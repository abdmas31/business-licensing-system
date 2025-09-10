import express from "express";
import { matchRequirements } from "../services/matchEngine.js";

const router = express.Router();

router.post("/", (req, res) => {
  const { size_m2, seats, delivery, hazardous } = req.body;
  const matches = matchRequirements({ size_m2, seats, delivery, hazardous });
  res.json({ requirements: matches });
});

export default router;
