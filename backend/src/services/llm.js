import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateReport(matches, businessInfo) {
  const prompt = `
  כתוב דוח דרישות רישוי לעסק בישראל.
  מידע על העסק: שטח ${businessInfo.size_m2} מ"ר, מקומות ישיבה ${businessInfo.seats}, משלוחים: ${businessInfo.delivery ? "כן" : "לא"}, חומרים מסוכנים: ${businessInfo.hazardous ? "כן" : "לא"}.

  דרישות רגולטוריות רלוונטיות:
  ${matches.map(m => `- ${m.title}: ${m.rules.join("; ")}`).join("\n")}

  נא לנסח את הדוח בשפה ברורה, מחולק לסעיפים, כך שבעל העסק יבין מה נדרש ממנו.
  `;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini", // or gpt-4o if you have access
    messages: [{ role: "user", content: prompt }]
  });

  return completion.choices[0].message.content;
}
