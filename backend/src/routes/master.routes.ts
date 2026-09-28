import { Router } from "express";
import { UserRole } from "@prisma/client";
import { masterController, publicController } from "../controllers/master.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { upload } from "../middlewares/upload";

export const masterRouter = Router();
masterRouter.use(authenticate, authorize(UserRole.MASTER));
masterRouter.get("/dashboard", masterController.dashboard);
masterRouter.get("/companies", masterController.companies);
masterRouter.post("/companies", masterController.createCompany);
masterRouter.patch("/companies/:id", masterController.updateCompany);
masterRouter.post("/companies/:id/impersonate", masterController.impersonate);
masterRouter.get("/logs", masterController.logs);
masterRouter.post("/upload", upload.single("file"), masterController.upload);

export const publicRouter = Router();
publicRouter.get("/:slug", publicController.site);
