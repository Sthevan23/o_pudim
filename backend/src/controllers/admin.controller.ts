import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { companyScope } from "../middlewares/auth";
import { dashboardService } from "../services/dashboard.service";
import { productService, categoryService } from "../services/catalog.service";
import { orderService, customerService } from "../services/order.service";
import { financeService, reportService } from "../services/finance.service";
import { contentService, notificationService } from "../services/content.service";
import { publicFileUrl } from "../middlewares/upload";

export const adminController = {
  dashboard: asyncHandler(async (req: Request, res: Response) => {
    res.json(await dashboardService.companyDashboard(companyScope(req), req.query as Record<string, string>));
  }),

  notifications: asyncHandler(async (req: Request, res: Response) => {
    res.json(await notificationService.list(companyScope(req)));
  }),

  products: asyncHandler(async (req: Request, res: Response) => {
    res.json(await productService.list(companyScope(req), req.query as Record<string, string>));
  }),
  product: asyncHandler(async (req: Request, res: Response) => {
    res.json(await productService.get(companyScope(req), req.params.id));
  }),
  createProduct: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await productService.create(companyScope(req), req.body));
  }),
  updateProduct: asyncHandler(async (req: Request, res: Response) => {
    res.json(await productService.update(companyScope(req), req.params.id, req.body));
  }),
  deleteProduct: asyncHandler(async (req: Request, res: Response) => {
    await productService.remove(companyScope(req), req.params.id);
    res.status(204).send();
  }),
  duplicateProduct: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await productService.duplicate(companyScope(req), req.params.id));
  }),
  toggleProduct: asyncHandler(async (req: Request, res: Response) => {
    res.json(await productService.toggle(companyScope(req), req.params.id));
  }),

  categories: asyncHandler(async (req: Request, res: Response) => {
    res.json(await categoryService.list(companyScope(req)));
  }),
  createCategory: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await categoryService.create(companyScope(req), req.body));
  }),
  updateCategory: asyncHandler(async (req: Request, res: Response) => {
    res.json(await categoryService.update(companyScope(req), req.params.id, req.body));
  }),
  deleteCategory: asyncHandler(async (req: Request, res: Response) => {
    await categoryService.remove(companyScope(req), req.params.id);
    res.status(204).send();
  }),

  orders: asyncHandler(async (req: Request, res: Response) => {
    res.json(await orderService.list(companyScope(req), req.query as never));
  }),
  order: asyncHandler(async (req: Request, res: Response) => {
    res.json(await orderService.get(companyScope(req), req.params.id));
  }),
  createOrder: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await orderService.create(companyScope(req), req.body));
  }),
  updateOrderStatus: asyncHandler(async (req: Request, res: Response) => {
    res.json(await orderService.updateStatus(companyScope(req), req.params.id, req.body.status));
  }),

  customers: asyncHandler(async (req: Request, res: Response) => {
    res.json(await customerService.list(companyScope(req), req.query.q as string | undefined));
  }),
  customer: asyncHandler(async (req: Request, res: Response) => {
    res.json(await customerService.get(companyScope(req), req.params.id));
  }),
  createCustomer: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await customerService.create(companyScope(req), req.body));
  }),
  updateCustomer: asyncHandler(async (req: Request, res: Response) => {
    res.json(await customerService.update(companyScope(req), req.params.id, req.body));
  }),
  deleteCustomer: asyncHandler(async (req: Request, res: Response) => {
    await customerService.remove(companyScope(req), req.params.id);
    res.status(204).send();
  }),

  financeDashboard: asyncHandler(async (req: Request, res: Response) => {
    res.json(await financeService.dashboard(companyScope(req), req.query as Record<string, string>));
  }),
  transactions: asyncHandler(async (req: Request, res: Response) => {
    res.json(await financeService.list(companyScope(req), req.query as never));
  }),
  createTransaction: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await financeService.create(companyScope(req), req.body));
  }),
  updateTransaction: asyncHandler(async (req: Request, res: Response) => {
    res.json(await financeService.update(companyScope(req), req.params.id, req.body));
  }),
  deleteTransaction: asyncHandler(async (req: Request, res: Response) => {
    await financeService.remove(companyScope(req), req.params.id);
    res.status(204).send();
  }),

  reports: asyncHandler(async (req: Request, res: Response) => {
    res.json(await reportService.build(companyScope(req), req.query as Record<string, string>));
  }),
  exportReport: asyncHandler(async (req: Request, res: Response) => {
    const csv = await reportService.csv(companyScope(req), String(req.query.type ?? "resumo"), req.query as Record<string, string>);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=relatorio.csv");
    res.send("\uFEFF" + csv);
  }),

  gallery: asyncHandler(async (req: Request, res: Response) => {
    res.json(await contentService.gallery(companyScope(req)));
  }),
  addGallery: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await contentService.addGallery(companyScope(req), req.body));
  }),
  updateGallery: asyncHandler(async (req: Request, res: Response) => {
    res.json(await contentService.updateGallery(companyScope(req), req.params.id, req.body));
  }),
  deleteGallery: asyncHandler(async (req: Request, res: Response) => {
    await contentService.removeGallery(companyScope(req), req.params.id);
    res.status(204).send();
  }),

  testimonials: asyncHandler(async (req: Request, res: Response) => {
    res.json(await contentService.testimonials(companyScope(req)));
  }),
  addTestimonial: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await contentService.addTestimonial(companyScope(req), req.body));
  }),
  updateTestimonial: asyncHandler(async (req: Request, res: Response) => {
    res.json(await contentService.updateTestimonial(companyScope(req), req.params.id, req.body));
  }),
  deleteTestimonial: asyncHandler(async (req: Request, res: Response) => {
    await contentService.removeTestimonial(companyScope(req), req.params.id);
    res.status(204).send();
  }),

  differentiators: asyncHandler(async (req: Request, res: Response) => {
    res.json(await contentService.differentiators(companyScope(req)));
  }),
  saveDifferentiator: asyncHandler(async (req: Request, res: Response) => {
    res.json(await contentService.upsertDifferentiator(companyScope(req), req.params.id, req.body));
  }),
  createDifferentiator: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await contentService.upsertDifferentiator(companyScope(req), undefined, req.body));
  }),
  deleteDifferentiator: asyncHandler(async (req: Request, res: Response) => {
    await contentService.removeDifferentiator(companyScope(req), req.params.id);
    res.status(204).send();
  }),

  settings: asyncHandler(async (req: Request, res: Response) => {
    res.json(await contentService.getSettings(companyScope(req)));
  }),
  updateSettings: asyncHandler(async (req: Request, res: Response) => {
    res.json(await contentService.updateSettings(companyScope(req), req.body));
  }),

  upload: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ message: "Nenhum arquivo enviado." });
      return;
    }
    res.json({ url: publicFileUrl(req.file.path) });
  }),
};
