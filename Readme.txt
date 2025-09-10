This is how I solve this home assignment
My thought process and my decision making
Reading the task description and understanding

i need to read the requirements and understand what the system does
1.1 – i understood that i need to build a system where the user enters some information about his business (example: size, seats, has delivery etc..)
1.2 – the system has a pdf of regulations that are applied to the business related to his business description
1.3 – i don’t need to process the whole pdf. i can focus on a subset to prove the end-to-end idea (they explicitly allow it)
1.4 – example: if size > 100 and there’s a rule for businesses > 100, show it in the report
1.5 – i can keep the rules in a structured json (with conditions), then do matching against the user input
1.6 – after matching, i call an llm (openai api) to generate a clean, human-friendly hebrew report from the matched items only (no hallucinations)
Drawing the system flow (to make sure i actually get it)

client fills a short form (size_m2, seats, delivery, hazardous, [optional] renewal) → submit
frontend sends an http request to backend
backend validates input, runs matching engine on the structured rules
backend sends the matched items to the llm service to write a readable report in hebrew
backend returns both: (a) the concrete matched bullets and (b) the ai report text
frontend renders both so the user sees specifics + a readable summary
Small ascii sketch:


Tech stack choices

backend: node.js + express
frontend: react
data: json files (no db needed for this exercise). if this grows, i’d use postgres.
ai: openai sdk (env key only in .env, never in git)



Repository + tools
github repo: business-licensing-system
link: https://github.com/abdmas31/business-licensing-system
editor & helpers: vscode, nodemon for dev reload, simple scripts. i used copilot/chatgpt for boilerplate and regex hints, but i kept the logic explicit in code.



business-licensing-system/
backend/
.env.example
server.js
package.json
src/
routes/
match.routes.js
report.routes.js
controllers/ (lightweight, logic is in services)
services/
matchEngine.js
llm.js
groupMatches.js
data/
requirements.json <-- generated from subset script
raw/
subset_raw.txt <-- small curated Hebrew subset
scripts/
processSubset.js <-- turns subset_raw.txt -> requirements.json
frontend/
src/
App.jsx
api.js
components/...
.env.example
package.json
README.md (this write up + run instructions + screenshots)


Data processing (subset → structured JSON)
Why subset: pdf parsing is noisy and not required for full marks. i chose a deterministic subset in src/raw/subset_raw.txt with clear headers and bullets in hebrew.

Script: backend/src/scripts/processSubset.js

reads subset_raw.txt blocks like:

“פתחי יציאה:” (exit doors)
“אספקת מים (ברזי כיבוי):” (hydrants)
“אריזות ומשלוחים:” (packaging for deliveries)
“היגיינה ותברואה”
“חומרים מסוכנים”
“שליחת מזון:” (licensing for delivery)
uses simple regex to extract conditions and map them into applies_if with these fields:

min_size_m2, max_size_m2
min_seats, max_seats
delivery: true/false
hazardous: true/false
writes src/data/requirements.json with items shaped like:


{
"id": "exits_51_500",
"title": "פתחי יציאה",
"applies_if": { "min_seats": 51, "max_seats": 500 },
"rules": [
"לפחות שני פתחים ברוחב 1.1 מ' נטו כל אחד",
"כיוון פתיחת הדלת יהיה לכיוון המילוט"
]
}


To run the script->
cd backend
node src/scripts/processSubset.js



Matching engine
File: backend/src/services/matchEngine.js
Input (from user):

 
{
"size_m2": number,
"seats": number,
"delivery": boolean,
"hazardous": boolean,
"renewal": boolean (optional, currently not required)
}


Logic (simple & readable):

for each rule object:

check size bounds: if min_size_m2 present, input must be ≥ it; if max_size_m2 present, input must be ≤ it
check seats bounds: same idea
check boolean flags: if rule declares delivery/hazardous, input must match
if everything passes → include this rule
Why this works: the subset writer already encodes the conditions, so matching stays dumb and fast.



AI report 
File: backend/src/services/llm.js
How i keep it grounded:

i pass only the matched bullets grouped by their title
i instruct the model (system prompt) to not invent new laws and to reuse the exact numeric requirements as bullets
/api/report returns both:

details: the raw grouped bullets (what matched)
report: the human-friendly hebrew narrative (generated from those bullets)


API surface
POST /api/match

body: { size_m2, seats, delivery, hazardous, renewal? }
returns: array of rule items that match
POST /api/report

body: same as above


Frontend (React)
simple form with fields: size (m²), seats, delivery (checkbox)
submit calls /api/report and renders:

דרישות מותאמות (the actual bullets from details)
ניסוח AI (the hebrew report text anchored to those bullets)
config for api base: frontend/src/api.js or via REACT_APP_API_BASE


How to run->

-BACKEND-

cd backend
copy .env.example .env # set OPENAI_API_KEY=xxxxx
npm install
node src/scripts/processSubset.js
npm run dev # http://localhost:5000

-FRONTEND-

cd ../frontend
copy .env.example .env # set REACT_APP_API_BASE=http://localhost:5000/api
npm install
npm start # http://localhost:3000

 

Problems i hit and how i fixed them
github push protection blocked my push (openai key caught)

i ensured .env is ignored, removed any secrets from history, and only committed .env.example with placeholders.
verified with git ls-files | Select-String ".env" → only .env.example shows.
pdf-parse weird path (tried to open its own test pdf)

i ditched full pdf parsing for this assignment. i used a deterministic subset file and a small parser. stable and predictable.
esm vs cjs warnings

set "type": "module" in backend/package.json and used node’s fileURLToPath + __dirname pattern for safe file paths on windows.
path issues on windows

always resolved paths relative to the script file (not cwd). no more ENOENT.
cors / axios / “Cannot POST /api/…”

added app.use(cors()), checked route wiring, and used POST with correct Content-Type.



What i would add next 
better hebrew parsing (regex for more phrasing variants)
more business attributes (gas usage, alcohol serving, food type)
rule categories with ids and anchors to original regulation text
persistence (postgres) + auth so users can save drafts
print-ready pdf of the report


Screenshots i included (in the repo)
the form with inputs filled
the matched bullets (“דרישות מותאמות”)
the ai report (“ניסוח AI”) for the same input
i also added 2 screenshots for the postman tests



AI tools i used + how i used them
ChatGPT (GPT-5 / ChatGPT web)

brainstorming the system shape (apis, data flow)
writing first drafts for express routes, match engine, and the subset parser
quick regex help for Hebrew phrases (e.g., “עד/מעל … איש”, “מ״ר”, “רשיון/רישיון”)
debugging weird windows paths + __dirname ESM pattern
writing the production LLM prompt (Hebrew, no-hallucinations)
GitHub Copilot (VS Code)

inline suggestions while coding (smaller snippets, typing speedups)
filling boilerplate (imports, small utilities)
OpenAI Node SDK (runtime in backend)

live report generation for /api/report based strictly on matched bullets
model used: gpt-4o-mini (low temperature for factual tone)
note: no secrets in git. only .env.example with placeholders. .env is ignored.





these are examples of the kind of prompts i used while building. i kept them short and specific:

“make a minimal express server with /api/health, /api/match (POST), /api/report (POST). use cors and json body parsing. esm modules.”
“write a simple match engine that filters rule objects by min/max_size_m2, min/max_seats, and boolean delivery.”
“give me a tiny deterministic parser that reads a Hebrew subset text file and outputs requirements.json with title, applies_if, rules. don’t depend on the full pdf.”
“extend the subset parser with sections: פתחי יציאה, אספקת מים/ברזי כיבוי, אריזות ומשלוחים, היגיינה, חומרים מסוכנים, שליחת מזון. add regex for רישיון/רשיון.”
“write a grouping helper that takes matched items and returns [ { title, rules[] } ] for cleaner prompts.”
“draft a Hebrew LLM prompt that forbids adding laws we didn’t pass in, and forces it to reuse the exact numeric bullets.”
“fix ENOENT path on windows: use fileURLToPath + __dirname in esm.”
“react form with fields size, seats, delivery, hazardous; submit to /api/report and render both raw bullets and the ai report.”

