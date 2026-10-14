import { Router } from "express";
const indexRouter = Router();

import {
  getLoginPage,
  getRegistrationPage,
  postRegistration,
} from "../controllers/uploadControllers.js";

indexRouter.get("/", getLoginPage);

// TODO: Add form validators
indexRouter.get("/register", getRegistrationPage);

indexRouter.post("/register", postRegistration);

export default indexRouter;
