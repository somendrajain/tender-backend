const OpenAI = require("openai");
require("dotenv").config();

// Initialize OpenAI API
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Simple cache to store summaries temporarily
const summaryCache = new Map();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateSummary = async (tender) => {
  // Check if the summary already exists in cache
  if (summaryCache.has(tender.title)) {
    console.log(`✅ Using cached summary for: ${tender.title}`);
    return summaryCache.get(tender.title);
  }

  try {
    const prompt = `
        Summarize the following government tender:
        - Title: ${tender.title}
        - Organization: ${tender.organization}
        - Published Date: ${tender.ePublishedDate}
        - Closing Date: ${tender.closingDate}
        - Opening Date: ${tender.openingDate}
        - Additional Information: ${tender.corrigendum}

        Provide a **concise summary** focusing on:
        1. **Opportunity Overview**
        2. **Key Dates**
        3. **Requirements & Eligibility**
        `;

    await delay(2000); // Wait 2 seconds before making a request (rate limit)

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Use "gpt-4-turbo" if available
      messages: [{ role: "system", content: prompt }],
    });

    const summary = response.choices[0].message.content.trim();

    // Store in cache to avoid redundant requests
    summaryCache.set(tender.title, summary);

    return summary;
  } catch (error) {
    console.error("❌ Error generating summary:", error);
    return "Summary not available due to API quota limits.";
  }
};

module.exports = { generateSummary };
