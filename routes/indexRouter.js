import { Router } from "express";
const indexRouter = Router();

import {
  getLoginPage,
  getRegistrationPage,
} from "../controllers/uploadControllers.js";

indexRouter.get("/", getLoginPage);

// TODO: Add validators
indexRouter.get("/register", getRegistrationPage);

export default indexRouter;
