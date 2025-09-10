import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';

import matchRoutes from "./src/routes/match.routes.js";
import reportRoutes from "./src/routes/report.routes.js";



const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); 


app.use("/api/match", matchRoutes);
app.use("/api/report", reportRoutes);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

