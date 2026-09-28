import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { dashboardService } from "../services/dashboard.service";
import { companyService } from "../services/company.service";
import { masterService } from "../services/content.service";
import { publicService } from "../services/content.service";
import { publicFileUrl } from "../middlewares/upload";

export const masterController = {
  dashboard: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await dashboardService.masterDashboard());
  }),
  companies: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await masterService.companies());
  }),
  createCompany: asyncHandler(async (req: Request, res: Response) => {
    const company = await companyService.createWithDefaults(req.body);
    res.status(201).json(company);
  }),
  updateCompany: asyncHandler(async (req: Request, res: Response) => {
    res.json(await companyService.update(req.params.id, req.body));
  }),
  impersonate: asyncHandler(async (req: Request, res: Response) => {
    res.json(await masterService.impersonate(req.user!.id, req.user!.email, req.params.id));
  }),
  logs: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await masterService.logs());
  }),
  upload: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ message: "Nenhum arquivo enviado." });
      return;
    }
    res.json({ url: publicFileUrl(req.file.path) });
  }),
};

export const publicController = {
  site: asyncHandler(async (req: Request, res: Response) => {
    res.json(await publicService.getBySlug(req.params.slug));
  }),
};
