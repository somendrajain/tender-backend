const mongoose = require("mongoose");
require("dotenv").config();

const MAX_RETRIES = 5; // Number of retries
const RETRY_DELAY = 5000; // Delay in milliseconds (5 seconds)

const connectDB = async (retries = MAX_RETRIES) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      //   useNewUrlParser: true,
      //   useUnifiedTopology: true,
    });
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error(
      `MongoDB Connection Failed (Retries Left: ${retries}):`,
      error.message
    );

    if (retries > 0) {
      console.log(
        `🔄 Retrying MongoDB connection in ${RETRY_DELAY / 1000} seconds...`
      );
      setTimeout(() => connectDB(retries - 1), RETRY_DELAY);
    } else {
      console.error("Maximum retry attempts reached. Exiting...");
      process.exit(1);
    }
  }
};

module.exports = connectDB;
