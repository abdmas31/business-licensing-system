import express from "express";
import { matchRequirements } from "../services/matchEngine.js";

const router = express.Router();

router.post("/", (req, res) => {
  const { size_m2, seats, delivery, hazardous } = req.body;

  const matches = matchRequirements({ size_m2, seats, delivery, hazardous });

  res.json({
    summary: `דוח מותאם לעסק שלך (שטח: ${size_m2}, מקומות ישיבה: ${seats}, משלוחים: ${delivery ? "כן" : "לא"})`,
    details: matches
  });
});

export default router;
