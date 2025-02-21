const mongoose = require("mongoose");

const TenderSchema = new mongoose.Schema(
  {
    title: String,
    openingDate: String,
    closingDate: String,
    ePublishedDate: String,
    organization: String,
    corrigendum: String,
    summary: String,
    sourceUrl: String,
    tenderId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tender", TenderSchema);
