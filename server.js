const fs = require("fs");

const config = JSON.parse(fs.readFileSync("config.json"));
let data = JSON.parse(fs.readFileSync("data.json"));

//helper functions
const checkGetAndSetYear = () => {
  const year = new Date().getFullYear().toString().substring(2);
  if (data.current_year == year) {return 0;} 
  data.current_year = year;
  return 1;
};

const monthBetween = (month, start, end) => {
  if (start <= end)
    return month >= start && month <= end;
  else
    return month >= start || month <=end;
};

const checkAndMaybeDetermineDivision = () => {
  const month = new Date().getMonth();
  for (const division of config.month_divisions) {
    if (monthBetween(month, division.start, division.end)) {
      data.current_division = division.abbr;
      return 0;
    }
  }
  return 1;
  // if 1, we need to then make sure that the current
  // month is a mush month and then ask the user which
  // division they'd like to use
};

// this is just going to hold some code so I don't have to write it later
// when I actually need it
const printLocations = () => {
  let output = "";
  for (const location of config.locations) {
    output += `${location.name} (${location.abbr})\n`;
  }
  return output.trim();
};

console.log(data);
console.log(checkGetAndSetYear());
console.log(checkAndMaybeDetermineDivision());
console.log(data);
console.log(printLocations());