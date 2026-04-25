const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const session = require("express-session");

const config = JSON.parse(fs.readFileSync("config.json"));
let data = JSON.parse(fs.readFileSync("data.json"));

const app = express();
const PORT = config.port || 3000;

// Persist data to disk
const saveData = () => {
  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
};

// Constant-time string comparison to prevent timing attacks
const safeCompare = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA); // keep timing constant
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
};

// Helper: update current_year in data; returns true if it changed
const checkGetAndSetYear = () => {
  const year = new Date().getFullYear().toString().substring(2);
  if (data.current_year === year) { return false; }
  data.current_year = year;
  return true;
};

// Helper: true if month is in the range [start, end] (wraps around year)
const monthBetween = (month, start, end) => {
  if (start <= end) {
    return month >= start && month <= end;
  }
  return month >= start || month <= end;
};

// Returns the division abbreviation for the current month, or null if mush
const getCurrentDivision = () => {
  const month = new Date().getMonth();
  for (const division of config.month_divisions) {
    if (monthBetween(month, division.start, division.end)) {
      return division.abbr;
    }
  }
  return null;
};

// Returns the list of valid division options during a mush month, or null
const getMushOptions = () => {
  const month = new Date().getMonth();
  for (const mush of config.mush_months) {
    if (monthBetween(month, mush.start, mush.end)) {
      return mush.options;
    }
  }
  return null;
};

// Ensure every configured location exists in data.locations
const ensureLocations = () => {
  for (const loc of config.locations) {
    if (!data.locations.find((l) => l.abbr === loc.abbr)) {
      data.locations.push({ abbr: loc.abbr, next_run: 1 });
    }
  }
};

// Format: <LOC>-<DIV><YY><NNN> — e.g. DCC-S25001
const formatRunNumber = (year, division, locAbbr, num) => {
  const padded = num.toString().padStart(3, "0");
  return `${locAbbr}-${division}${year}${padded}`;
};

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: config.session_secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  },
}));

// Attach a per-session CSRF token to res.locals for use in all templates
app.use((req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
});

// Auth guards
const requireUser = (req, res, next) => {
  if (req.session.role === "user" || req.session.role === "admin") {
    return next();
  }
  res.redirect("/login");
};

const requireAdmin = (req, res, next) => {
  if (req.session.role === "admin") {
    return next();
  }
  res.redirect("/admin/login");
};

// CSRF validation for state-changing POST requests
const validateCsrf = (req, res, next) => {
  if (!safeCompare(req.body._csrf || "", req.session.csrfToken || "")) {
    return res.status(403).send("Invalid CSRF token.");
  }
  next();
};

// ── User routes ────────────────────────────────────────────────────────────

app.get("/login", (req, res) => {
  if (req.session.role) { return res.redirect("/"); }
  res.render("login", { error: null });
});

app.post("/login", validateCsrf, (req, res) => {
  if (safeCompare(req.body.password, config.password)) {
    req.session.role = "user";
    return res.redirect("/");
  }
  res.render("login", { error: "Incorrect password." });
});

app.post("/logout", validateCsrf, (req, res) => {
  req.session.destroy((err) => {
    if (err) { console.error("Session destroy error:", err); }
    res.redirect("/login");
  });
});

app.get("/", requireUser, (req, res) => {
  checkGetAndSetYear();
  ensureLocations();
  const division = getCurrentDivision();
  res.render("index", {
    locations: config.locations,
    currentYear: data.current_year,
    currentDivision: division || data.current_division,
    mushOptions: division === null ? getMushOptions() : null,
    role: req.session.role,
    runNumber: null,
    error: null,
  });
});

app.post("/generate", requireUser, validateCsrf, (req, res) => {
  checkGetAndSetYear();
  ensureLocations();

  const locAbbr = req.body.location;
  const loc = config.locations.find((l) => l.abbr === locAbbr);

  let division = getCurrentDivision();
  if (division === null) {
    const options = getMushOptions();
    const picked = req.body.division;
    division = (options && options.includes(picked))
      ? picked
      : (options ? options[0] : data.current_division);
  }

  const renderError = (msg) => res.render("index", {
    locations: config.locations,
    currentYear: data.current_year,
    currentDivision: division,
    mushOptions: getCurrentDivision() === null ? getMushOptions() : null,
    role: req.session.role,
    runNumber: null,
    error: msg,
  });

  if (!loc) { return renderError("Invalid location."); }

  let locData = data.locations.find((l) => l.abbr === locAbbr);
  if (!locData) {
    locData = { abbr: locAbbr, next_run: 1 };
    data.locations.push(locData);
  }

  const runNumber = formatRunNumber(
    data.current_year, division, locAbbr, locData.next_run
  );
  locData.next_run += 1;
  data.current_division = division;
  saveData();

  res.render("index", {
    locations: config.locations,
    currentYear: data.current_year,
    currentDivision: division,
    mushOptions: getCurrentDivision() === null ? getMushOptions() : null,
    role: req.session.role,
    runNumber,
    error: null,
  });
});

// ── Admin routes ───────────────────────────────────────────────────────────

app.get("/admin/login", (req, res) => {
  if (req.session.role === "admin") { return res.redirect("/admin"); }
  res.render("admin/login", { error: null });
});

app.post("/admin/login", validateCsrf, (req, res) => {
  if (safeCompare(req.body.password, config.admin_password)) {
    req.session.role = "admin";
    return res.redirect("/admin");
  }
  res.render("admin/login", { error: "Incorrect admin password." });
});

app.post("/admin/logout", validateCsrf, (req, res) => {
  req.session.destroy((err) => {
    if (err) { console.error("Session destroy error:", err); }
    res.redirect("/admin/login");
  });
});

app.get("/admin", requireAdmin, (req, res) => {
  checkGetAndSetYear();
  ensureLocations();
  const division = getCurrentDivision();
  res.render("admin/index", {
    locations: config.locations,
    dataLocations: data.locations,
    currentYear: data.current_year,
    currentDivision: division || data.current_division,
    mushOptions: division === null ? getMushOptions() : null,
    success: null,
    error: null,
  });
});

app.post("/admin/set", requireAdmin, validateCsrf, (req, res) => {
  checkGetAndSetYear();
  ensureLocations();

  const errors = [];
  for (const loc of config.locations) {
    const raw = req.body[`next_run_${loc.abbr}`];
    if (raw === undefined) { continue; }
    const val = parseInt(raw, 10);
    if (isNaN(val) || val < 1) {
      errors.push(`Invalid run number for ${loc.name}.`);
      continue;
    }
    let locData = data.locations.find((l) => l.abbr === loc.abbr);
    if (!locData) {
      data.locations.push({ abbr: loc.abbr, next_run: val });
    } else {
      locData.next_run = val;
    }
  }
  saveData();

  const division = getCurrentDivision();
  res.render("admin/index", {
    locations: config.locations,
    dataLocations: data.locations,
    currentYear: data.current_year,
    currentDivision: division || data.current_division,
    mushOptions: division === null ? getMushOptions() : null,
    success: errors.length === 0 ? "Run numbers updated." : null,
    error: errors.length > 0 ? errors.join(" ") : null,
  });
});

// ── Start ──────────────────────────────────────────────────────────────────

ensureLocations();
app.listen(PORT, () => {
  console.log(`strng running on port ${PORT}`);
});
