import { Router } from "express";
const indexRouter = Router();
import passport from "passport";
import upload from "../config/diskStorage.js";

import {
  getLoginPage,
  getRegistrationPage,
  postRegistration,
  prismaFileUpload,
  displayFiles,
  fileDetails,
  createFolder,
  viewFolder,
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

indexRouter.get("/file_viewer", displayFiles);

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

indexRouter.post("/file_view/newFolder", createFolder);

indexRouter.get("/folder/:folder", viewFolder);

export default indexRouter;
