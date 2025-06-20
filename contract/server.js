require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sendBestYieldRequest } = require("./functions/t");

//initialize the express app
const app = express();
const PORT = 5000;
//middleware
app.use(cors());
app.use(express.json());
// Define a POST endpoint for manually triggering yield update
app.post("/update-yield", async (req, res) => {
  try {
    //call the offchain logic to fetch the best apy
    await sendBestYieldRequest();
    res.status(200).json({ message: "Yield update sent" });
  } catch (error) {
    console.log("Error fetching the data");
    res.status(500).json({ error: "Yield Update failed" });
  }
})
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
