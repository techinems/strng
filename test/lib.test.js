const {
  safeCompare,
  monthBetween,
  getCurrentDivision,
  getMushOptions,
  formatRunNumber,
} = require("../lib");

describe("safeCompare", () => {
  test("returns true for identical strings", () => {
    expect(safeCompare("hunter2", "hunter2")).toBe(true);
  });
  test("returns false for different strings", () => {
    expect(safeCompare("hunter2", "hunter3")).toBe(false);
  });
  test("returns false for different-length strings", () => {
    expect(safeCompare("abc", "abcd")).toBe(false);
  });
  test("coerces non-strings", () => {
    expect(safeCompare(123, "123")).toBe(true);
  });
});

describe("monthBetween", () => {
  test("non-wrapping range", () => {
    expect(monthBetween(5, 2, 8)).toBe(true);
    expect(monthBetween(1, 2, 8)).toBe(false);
    expect(monthBetween(2, 2, 8)).toBe(true); // inclusive start
    expect(monthBetween(8, 2, 8)).toBe(true); // inclusive end
  });
  test("wrapping range (e.g. Oct..Feb)", () => {
    expect(monthBetween(11, 9, 1)).toBe(true);
    expect(monthBetween(0, 9, 1)).toBe(true);
    expect(monthBetween(1, 9, 1)).toBe(true);
    expect(monthBetween(5, 9, 1)).toBe(false);
  });
});

describe("getCurrentDivision", () => {
  const divisions = [
    { abbr: "F", start: 9, end: 1 },
    { abbr: "S", start: 2, end: 8 },
  ];
  test("returns Fall abbr in November", () => {
    expect(getCurrentDivision(10, divisions)).toBe("F");
  });
  test("returns Spring abbr in April", () => {
    expect(getCurrentDivision(3, divisions)).toBe("S");
  });
  test("returns null when no division matches", () => {
    expect(getCurrentDivision(5, [{ abbr: "X", start: 0, end: 2 }])).toBe(null);
  });
});

describe("getMushOptions", () => {
  const mush = [
    { start: 1, end: 2, options: ["F", "S"] },
    { start: 8, end: 9, options: ["S", "F"] },
  ];
  test("returns options within a mush window", () => {
    expect(getMushOptions(1, mush)).toEqual(["F", "S"]);
    expect(getMushOptions(9, mush)).toEqual(["S", "F"]);
  });
  test("returns null outside any mush window", () => {
    expect(getMushOptions(5, mush)).toBe(null);
  });
});

describe("formatRunNumber", () => {
  test("zero-pads the run number to 3 digits", () => {
    expect(formatRunNumber("25", "S", "DCC", 1)).toBe("DCC-S25001");
    expect(formatRunNumber("25", "F", "HFH", 42)).toBe("HFH-F25042");
  });
  test("does not truncate run numbers over 999", () => {
    expect(formatRunNumber("26", "S", "AF", 1000)).toBe("AF-S261000");
  });
});
