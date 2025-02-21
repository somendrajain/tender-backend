const axios = require("axios");
const cheerio = require("cheerio");
const mongoose = require("mongoose");
const Tender = require("./models/Tender");
const connectDB = require("./db");
const { generateSummary } = require("./openaiService");

const scrapeTenders = async () => {
  try {
    console.log("🔄 Scraping started...");

    const url = "https://eprocure.gov.in/cppp/latestactivetendersnew/cpppdata";
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    let tenders = [];

    $("#table.list_table tbody").each((index, tbody) => {
      $(tbody)
        .find("tr")
        .each((i, row) => {
          const columns = $(row).find("td");

          if (columns.length >= 6) {
            const tender = {
              serialNo: $(columns[0]).text().trim(),
              ePublishedDate: $(columns[1]).text().trim(),
              closingDate: $(columns[2]).text().trim(),
              openingDate: $(columns[3]).text().trim(),
              title: $(columns[4]).text().trim(),
              organization: $(columns[5]).text().trim(),
              corrigendum: $(columns[6]).text().trim() || "N/A",
              sourceUrl: url,
              tenderId: $(columns[4]).text().trim().split("/").pop(),
            };

            tenders.push(tender);
          }
        });
    });

    console.log(`Extracted ${tenders.length} tenders`);

    // Process tenders with LLM (Retry up to 3 times for failures)
    for (let tender of tenders) {
      let summary;
      for (let attempt = 1; attempt <= 3; attempt++) {
        summary = await generateSummary(tender);
        if (summary !== "Summary not available due to API quota limits.") break;
        console.log(
          `🔁 Retrying summary for: ${tender.title} (Attempt ${attempt}/3)`
        );
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 sec before retrying
      }

      tender.summary = summary;
      console.log(tender);
      await Tender.findOneAndUpdate({ title: tender.title }, tender, {
        upsert: true,
        new: true,
      });
    }

    console.log(`Successfully saved ${tenders.length} tenders with summaries`);
  } catch (error) {
    console.error("Error scraping:", error);
  }
};

// Run the scraper
module.exports = { scrapeTenders };
