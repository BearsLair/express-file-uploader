import express from "express";
const app = express();
import "dotenv/config.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Now listening on PORT ${PORT}`);
});
