const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const Tender = require("./models/Tender");
const { scrapeTenders } = require("./scraper");
const cron = require("node-cron");
require("dotenv").config();
const moment = require("moment");

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:3000",
  "https://tender-frontend-two.vercel.app",
];
// ✅ Enable CORS for frontend access
app.use(
  cors({
    origin: allowedOrigins,
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

// Middleware
app.use(express.json());

// Manually trigger scraping
app.get("/api/scrape", async (req, res) => {
  await scrapeTenders();
  res.json({ message: "Scraping started" });
});

connectDB();
// API Route to Fetch Tenders
app.get("/api/tenders", async (req, res) => {
  try {
    const { search, id, startDate, endDate } = req.query;
    let query = {};

    // ✅ Filter by Tender ID (if provided)
    if (id) {
      query.tenderId = new RegExp(id, "i"); // Case-insensitive match
    }

    // ✅ Filter by Search Term (title or organization)
    if (search) {
      query.$or = [
        { title: new RegExp(search, "i") },
        { organization: new RegExp(search, "i") },
      ];
    }

    // ✅ Filter by Date Range
    if (startDate && endDate) {
      query.ePublishedDate = {}; // Initialize query object
      console.log(new Date(startDate).toLocaleDateString());
      if (startDate) {
        query.ePublishedDate.$gte = new Date(startDate).toLocaleDateString();
      }
      if (endDate) {
        query.ePublishedDate.$lte = new Date(endDate);
      }
    }

    // ✅ Fetch filtered tenders from MongoDB
    const tenders = await Tender.find(query).sort({ ePublishedDate: -1 });

    res.json(tenders);
  } catch (error) {
    console.error("Error fetching tenders:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

// ✅ Schedule scraping every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  console.log("Running scheduled scraping every 5 minutes...");
  await scrapeTenders();
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
