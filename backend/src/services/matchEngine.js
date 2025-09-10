import fs from 'fs';
import path from 'path';


//Read the JSON file which contains the requirements data
const dataPath = path.resolve("src/data/requirements.json");

//Parse the JSON data 
const rules = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Function to match user answers against the requirements rules
// the answers parameter is an object with the following structure:
// {
//   size_m2: number,
//   seats: number,
//   delivery: boolean,
//   hazardous: boolean
// }

export function matchRequirements(answers) {
  return rules.filter(r => {
    const cond = r.applies_if || {};

    // Size checks
    if (cond.min_size_m2 && answers.size_m2 < cond.min_size_m2) return false;
    if (cond.max_size_m2 && answers.size_m2 > cond.max_size_m2) return false;

    // Seats checks
    if (cond.min_seats && answers.seats < cond.min_seats) return false;
    if (cond.max_seats && answers.seats > cond.max_seats) return false;

    // Delivery check
    if (cond.delivery !== undefined && answers.delivery !== cond.delivery) return false;

    // Hazardous check
    if (cond.hazardous !== undefined && answers.hazardous !== cond.hazardous) return false;

    return true;
  });
};