const crypto = require("crypto");

// Constant-time string comparison to prevent timing attacks
function safeCompare(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA); // keep timing constant
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// True if month is in the range [start, end] (wraps around the year)
function monthBetween(month, start, end) {
  if (start <= end) {
    return month >= start && month <= end;
  }
  return month >= start || month <= end;
}

// Returns the division abbreviation for the given month, or null if mush
function getCurrentDivision(month, monthDivisions) {
  for (const division of monthDivisions) {
    if (monthBetween(month, division.start, division.end)) {
      return division.abbr;
    }
  }
  return null;
}

// Returns the list of valid division options during a mush month, or null
function getMushOptions(month, mushMonths) {
  for (const mush of mushMonths) {
    if (monthBetween(month, mush.start, mush.end)) {
      return mush.options;
    }
  }
  return null;
}

// Format: <LOC>-<DIV><YY><NNN> — e.g. DCC-S25001
function formatRunNumber(year, division, locAbbr, num) {
  const padded = num.toString().padStart(3, "0");
  return `${locAbbr}-${division}${year}${padded}`;
}

module.exports = {
  safeCompare,
  monthBetween,
  getCurrentDivision,
  getMushOptions,
  formatRunNumber,
};
