import { Router } from "express";
const indexRouter = Router();
import { getLoginPage } from "../controllers/uploadControllers.js";

indexRouter.get("/", getLoginPage);

export default indexRouter;
