import express from "express";
const app = express();
import "dotenv/config.js";
import path from "node:path";
import indexRouter from "./routes/indexRouter.js";

app.set("view engine", "ejs");
app.set("views", path.join(import.meta.dirname, "/views"));

app.use(express.urlencoded({ extended: true }));
app.use("/", indexRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Now listening on PORT ${PORT}`);
});
