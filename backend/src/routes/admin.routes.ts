import { Router } from "express";
import { UserRole } from "@prisma/client";
import { adminController } from "../controllers/admin.controller";
import { authenticate, authorize, requireCompany } from "../middlewares/auth";
import { upload } from "../middlewares/upload";

const router = Router();

router.use(authenticate, authorize(UserRole.ADMIN, UserRole.EMPLOYEE), requireCompany);

router.get("/dashboard", adminController.dashboard);
router.get("/notifications", adminController.notifications);

router.get("/products", adminController.products);
router.get("/products/:id", adminController.product);
router.post("/products", adminController.createProduct);
router.patch("/products/:id", adminController.updateProduct);
router.delete("/products/:id", adminController.deleteProduct);
router.post("/products/:id/duplicate", adminController.duplicateProduct);
router.post("/products/:id/toggle", adminController.toggleProduct);

router.get("/categories", adminController.categories);
router.post("/categories", adminController.createCategory);
router.patch("/categories/:id", adminController.updateCategory);
router.delete("/categories/:id", adminController.deleteCategory);

router.get("/orders", adminController.orders);
router.get("/orders/:id", adminController.order);
router.post("/orders", adminController.createOrder);
router.patch("/orders/:id/status", adminController.updateOrderStatus);

router.get("/customers", adminController.customers);
router.get("/customers/:id", adminController.customer);
router.post("/customers", adminController.createCustomer);
router.patch("/customers/:id", adminController.updateCustomer);
router.delete("/customers/:id", adminController.deleteCustomer);

router.get("/finance/dashboard", adminController.financeDashboard);
router.get("/finance", adminController.transactions);
router.post("/finance", adminController.createTransaction);
router.patch("/finance/:id", adminController.updateTransaction);
router.delete("/finance/:id", adminController.deleteTransaction);

router.get("/reports", adminController.reports);
router.get("/reports/export", adminController.exportReport);

router.get("/gallery", adminController.gallery);
router.post("/gallery", adminController.addGallery);
router.patch("/gallery/:id", adminController.updateGallery);
router.delete("/gallery/:id", adminController.deleteGallery);

router.get("/testimonials", adminController.testimonials);
router.post("/testimonials", adminController.addTestimonial);
router.patch("/testimonials/:id", adminController.updateTestimonial);
router.delete("/testimonials/:id", adminController.deleteTestimonial);

router.get("/differentiators", adminController.differentiators);
router.post("/differentiators", adminController.createDifferentiator);
router.patch("/differentiators/:id", adminController.saveDifferentiator);
router.delete("/differentiators/:id", adminController.deleteDifferentiator);

router.get("/settings", adminController.settings);
router.patch("/settings", adminController.updateSettings);

router.post("/upload", upload.single("file"), adminController.upload);

export default router;
