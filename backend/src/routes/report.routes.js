import express from "express";
import { matchRequirements } from "../services/matchEngine.js";
import { generateReport } from "../services/llm.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { size_m2, seats, delivery, hazardous } = req.body;

    if (size_m2 === undefined || seats === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const matches = matchRequirements({ size_m2, seats, delivery, hazardous });

    // Call OpenAI to generate human-friendly report
    const aiReport = await generateReport(matches, { size_m2, seats, delivery, hazardous });

    res.json({
      business: { size_m2, seats, delivery, hazardous },
      requirements: matches,
      report: aiReport
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

export default router;
