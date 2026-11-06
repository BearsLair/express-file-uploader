import { Router } from "express";
const indexRouter = Router();
import passport from "passport";
import upload from "../config/diskStorage.js";

import {
  getLoginPage,
  getRegistrationPage,
  postRegistration,
  prismaFileUpload,
  displayHomeDirectory,
  fileDetails,
  createFolder,
  viewFolder,
  deleteFile,
  deleteFolder,
} from "../controllers/uploadControllers.js";

indexRouter.get("/", getLoginPage);

indexRouter.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/",
    failureMessage: true,
  }),
);

indexRouter.get("/home", displayHomeDirectory);

indexRouter.post("/upload/:folder", upload.single("file"), prismaFileUpload);

// TODO: Add form validators
indexRouter.get("/register", getRegistrationPage);

indexRouter.post("/register", postRegistration);

indexRouter.get("/log-out", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

indexRouter.get("/details/:id", fileDetails);

indexRouter.post("/newFolder/:current_folder", createFolder);

indexRouter.get("/folder/:folder", viewFolder);

indexRouter.get("/delete/:id", deleteFile);

indexRouter.get("/deleteFolder/:id", deleteFolder);

export default indexRouter;
