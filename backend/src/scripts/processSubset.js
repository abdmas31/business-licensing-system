import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcPath = path.join(__dirname, "..", "raw", "subset_raw.txt");
const outPath = path.join(__dirname, "..", "data", "requirements.json");

// helper
function onlyNum(s) {
  return parseInt(String(s).replace(/[^\d]/g, ""), 10);
}

/* ---------- פתחי יציאה ---------- */
function parseExits(lines) {
  const out = [];

  for (const line of lines) {
    if (/עד\s*50\s*איש/.test(line)) {
      out.push({
        id: "exits_upto_50",
        title: "פתחי יציאה",
        applies_if: { max_seats: 50 },
        rules: ["פתח יציאה אחד לפחות ברוחב 0.9 מ' נטו"],
      });
    } else if (/מעל\s*50.*לא\s*יותר\s*מ-?\s*500/.test(line)) {
      out.push({
        id: "exits_51_500",
        title: "פתחי יציאה",
        applies_if: { min_seats: 51, max_seats: 500 },
        rules: [
          "לפחות שני פתחים ברוחב 1.1 מ' נטו כל אחד",
          "כיוון פתיחת הדלת יהיה לכיוון המילוט",
        ],
      });
    } else if (/מעל\s*500.*לא\s*יותר\s*מ-?\s*1,?000/.test(line)) {
      out.push({
        id: "exits_501_1000",
        title: "פתחי יציאה",
        applies_if: { min_seats: 501, max_seats: 1000 },
        rules: [
          "לפחות שלושה פתחים ברוחב 1.1 מ' נטו כל אחד",
          "כיוון פתיחת הדלת יהיה לכיוון המילוט",
        ],
      });
    } else if (/חומרים\s*מסוכנים/i.test(line) && /עולה\s*על\s*20\s*מ/.test(line)) {
      out.push({
        id: "exits_hazardous_over_20",
        title: "פתחי יציאה",
        applies_if: { hazardous: true, min_size_m2: 21 },
        rules: [
          "לפחות שני פתחי יציאה ברוחב 0.9 מ' נטו כל אחד",
          "דלת אחת לפחות נפתחת ישירות אל החוץ",
        ],
      });
    }
  }

  // כלל כללי דרכי מוצא
  const general = lines.find((l) => /דרכי\s*מוצא/.test(l));
  if (general) {
    out.push({
      id: "exits_egress_clear",
      title: "פתחי יציאה",
      applies_if: {},
      rules: ["דרכי המוצא ופתחי היציאה יהיו פנויים ממכשולים בכל עת; ניתן לפתוח מבפנים ללא מפתח נשלף"],
    });
  }
  return out;
}

/* ---------- אספקת מים וברזי כיבוי ---------- */
function parseWater(lines) {
  const out = [];

  if (lines.some((l) => /אספקת.*המים.*לחץ.*כיבוי/i.test(l))) {
    out.push({
      id: "water_supply_general",
      title: "אספקת מים וברזי כיבוי",
      applies_if: {},
      rules: ["יש להבטיח כמות ולחץ מים מספיקים להפעלת כלל ציוד הכיבוי"],
    });
  }

  if (lines.some((l) => /עד\s*500\s*מ["״']?ר/.test(l))) {
    out.push({
      id: "hydrant_upto_500",
      title: "אספקת מים וברזי כיבוי",
      applies_if: { max_size_m2: 500 },
      rules: ['להתקין ברז כיבוי חיצוני בקוטר 3"', "מרחק עד 80 מטר מהעסק"],
    });
  }

  if (lines.some((l) => /מעל\s*500\s*מ["״']?ר/.test(l))) {
    out.push({
      id: "hydrant_over_500",
      title: "אספקת מים וברזי כיבוי",
      applies_if: { min_size_m2: 501, max_size_m2: 800 },
      rules: ['ברזי כיבוי חיצוניים בקוטר 3" על זקף בקוטר 4" בהיקף העסק', "מרווח בין ברזים סמוכים לא יעלה על 80 מטר"],
    });
  }

  if (lines.some((l) => /מעל\s*800\s*מ["״']?ר/.test(l))) {
    out.push({
      id: "hydrant_over_800",
      title: "אספקת מים וברזי כיבוי",
      applies_if: { min_size_m2: 801 },
      rules: ["יש להתקין חיבור הסנקה לברזי הכיבוי", "ברז ההסנקה יוצב מחוץ לעסק עד 6 מ' מקצה העסק"],
    });
  }
  return out;
}
/* ---------- Delivery ---------- */
function parseDeliveries(lines) {
  const out = [];

  //Delivery specific rules
  if (lines.some((l) => /לא\s+ינתן.*ר(?:י)?שיון.*שליחת\s*מזון/i.test(l))) {
    out.push({
      id: "delivery_license_requires_compliance",
      title: "שליחת מזון",
      applies_if: { delivery: true },
      rules: ["לא יינתן רישיון לשליחת מזון אלא בעמידה בהנחיות המנהל"],
    });
  }

  if (lines.some((l) => /לבקשה\s+לקבלת\s+ר(?:י)?שיון\s+עסק\s+לשליחת\s*מזון/i.test(l))) {
    out.push({
      id: "delivery_new_application_attachments",
      title: "שליחת מזון",
      applies_if: { delivery: true },
      rules: [
        "תכניות בהתאם לתקנות רישוי עסקים (הוראות כלליות), 2000",
        "פרשה טכנית: סוגי מוצרים במשלוחים, תנאי הכנה/הזמנות/אחסון, כלים להובלה, פרטי רכב הובלה",
      ],
    });
  }

  // המנהל רשאי לדרוש תכניות מפורטות ... 1:50
  if (lines.some((l) => /מנהל\s+רשאי.*לדרוש\s+תכניות\s+מפורטות.*1:50/i.test(l))) {
    out.push({
      id: "delivery_manager_may_require_detailed_plans",
      title: "שליחת מזון",
      applies_if: { delivery: true },
      rules: ['המנהל רשאי לדרוש תכניות מפורטות של אזור הכנת משלוחים ורכב הובלה בקנ"מ 1:50 (או אחר)'],
    });
  }

  // חידוש ריש(י)ון
  if (lines.some((l) => /חידוש\s+ר(?:י)?שיון/i.test(l))) {
    out.push({
      id: "delivery_renewal_exemptions",
      title: "שליחת מזון",
      applies_if: { delivery: true },
      rules: [
        "אם אין שינויים בעסק – התכניות הקיימות בתיק משקפות את המצב",
        "יש לצרף הצהרה חתומה שהנספחים והבקשה המקורית משקפים את המצב בעת החידוש",
      ],
    });
  }

  return out;
}

/* ---------- אריזות ומשלוחים (כללי) ---------- */
function parsePackaging(lines) {
  const out = [];
  if (lines.some((l) => /אריזה\s*אטומה|טמפרטורה|קירור/.test(l))) {
    out.push({
      id: "packaging_sealed",
      title: "אריזות ומשלוחים",
      applies_if: { delivery: true },
      rules: ["משלוחים באריזה אטומה לשמירה על טמפרטורה"],
    });
  }
  if (lines.some((l) => /אלרגנ/i.test(l))) {
    out.push({
      id: "packaging_allergens",
      title: "אריזות ומשלוחים",
      applies_if: { delivery: true },
      rules: ["סימון אלרגנים ברור על כל אריזה"],
    });
  }
  return out;
}

/* ---------- היגיינה ותברואה ---------- */
function parseHygiene(lines) {
  const out = [];
  if (lines.some((l) => /ניקיון|תחזוקה/.test(l))) {
    out.push({
      id: "hygiene_cleaning",
      title: "היגיינה ותברואה",
      applies_if: {},
      rules: ["תחזוקת ניקיון שוטפת למשטחי עבודה וכלים"],
    });
  }
  if (lines.some((l) => /חיטוי.*ידיים|עמדת\s*חיטוי/.test(l))) {
    out.push({
      id: "hygiene_sanitizer",
      title: "היגיינה ותברואה",
      applies_if: {},
      rules: ["עמדת חיטוי ידיים לעובדים בסמוך לעמדת ההכנה"],
    });
  }
  return out;
}

/* ---------- חומרים מסוכנים ---------- */
function parseHazardous(lines) {
  const out = [];
  if (lines.some((l) => /SDS|גיליונות\s*בטיחות|חומר(?:ים)?\s*מסוכנים/i.test(l))) {
    out.push({
      id: "hazardous_sds",
      title: "חומרים מסוכנים",
      applies_if: { hazardous: true },
      rules: ["החזקת גיליונות בטיחות (SDS) והכשרת עובדים כנדרש"],
    });
  }
  if (lines.some((l) => /שילוט.*אזהרה/.test(l))) {
    out.push({
      id: "hazardous_signage",
      title: "חומרים מסוכנים",
      applies_if: { hazardous: true },
      rules: ["שילוט אזהרה מתאים באזורי אחסון"],
    });
  }
  return out;
}

/* ---------- כיבוי אש בסיסי ---------- */
function parseBasicFire(lines) {
  const out = [];
  if (lines.some((l) => /מטף|בדיקה\s*שנתית/.test(l))) {
    out.push({
      id: "fire_extinguisher_basic",
      title: "כיבוי אש בסיסי",
      applies_if: {},
      rules: ["מטף כיבוי תקין ונגיש + בדיקה שנתית"],
    });
  }
  if (lines.some((l) => /שילט(?:י|ות)?\s*יציאת\s*חירום|מוארים?/.test(l))) {
    out.push({
      id: "fire_exit_signage",
      title: "כיבוי אש בסיסי",
      applies_if: {},
      rules: ["שלטי יציאת חירום מוארים במסלולי המילוט"],
    });
  }
  return out;
}

/* ---------- אגרגציה מהקובץ ---------- */
function parseSubset(raw) {
  // בלוקים מופרדים בשורה ריקה
  const blocks = raw.split(/\r?\n\s*\r?\n/);

  const get = (re) =>
    blocks.find((b) => re.test(b))?.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) || [];

  const exitsLines      = get(/פתחי\s*יציאה/i);
  const waterLines      = get(/אספקת\s*מים|ברזי\s*כיבוי/i);
  const packLines       = get(/אריזות|משלוחים/i);
  const hygieneLines    = get(/היגיינה|תברואה/i);
  const hazardousLines  = get(/חומרים\s*מסוכנים/i);
  const fireBasicLines  = get(/כיבוי\s*אש\s*בסיסי/i);
  const deliveriesLines = get(/שליחת\s*מזון/i);

  return [
    ...parseExits(exitsLines),
    ...parseWater(waterLines),
    ...parsePackaging(packLines),
    ...parseHygiene(hygieneLines),
    ...parseHazardous(hazardousLines),
    ...parseBasicFire(fireBasicLines),
    ...parseDeliveries(deliveriesLines),
  ];
}

/* ---------- הפעלה ---------- */
if (!fs.existsSync(srcPath)) {
  console.error(" Missing raw subset file:", srcPath);
  process.exit(1);
}

const raw = fs.readFileSync(srcPath, "utf-8");
const items = parseSubset(raw);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(items, null, 2), "utf-8");
console.log(` Wrote ${items.length} structured rules → ${outPath}`);
