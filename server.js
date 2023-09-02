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
};

console.log(data);
console.log(checkGetAndSetYear());
console.log(checkAndMaybeDetermineDivision());
console.log(data);