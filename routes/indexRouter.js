import { Router } from "express";
const indexRouter = Router();
import passport from "passport";

import {
  getLoginPage,
  getRegistrationPage,
  postRegistration,
} from "../controllers/uploadControllers.js";

indexRouter.get("/", getLoginPage);

indexRouter.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/file_viewer",
    failureRedirect: "/",
    failureMessage: true,
  }),
);

indexRouter.get("/file_viewer", (req, res) => {
  res.render("fileViewer", { user: req.user });
});

// TODO: Add form validators
indexRouter.get("/register", getRegistrationPage);

indexRouter.post("/register", postRegistration);

export default indexRouter;
