import express from "express";
const app = express();
import "dotenv/config.js";
import path from "node:path";
import indexRouter from "./routes/indexRouter.js";

import expressSession from "express-session";
import { prisma } from "./lib/prisma.js";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import passport from "passport";
import "./config/passport.js";

import multer from "multer";

app.use(
  expressSession({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000,
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  }),
);

app.use(passport.authenticate("session"));

app.set("view engine", "ejs");
app.set("views", path.join(import.meta.dirname, "/views"));

app.use(express.urlencoded({ extended: true }));
app.use("/", indexRouter);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .render("errorPage", { error: "File too large. Must be under 10MB!" });
    }
  }
  res.render("errorPage", { error: "Oops! Something went wrong..." });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Now listening on PORT ${PORT}`);
});
