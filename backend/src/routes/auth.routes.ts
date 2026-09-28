import { Router } from "express";
import { z } from "zod";
import { authController, loginSchema } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.post("/login", validate(loginSchema), authController.login);
router.post(
  "/forgot-password",
  validate(z.object({ email: z.string().email() })),
  authController.forgot,
);
router.post(
  "/reset-password",
  validate(z.object({ token: z.string().min(10), password: z.string().min(6, "A senha deve ter ao menos 6 caracteres.") })),
  authController.reset,
);
router.get("/me", authenticate, authController.me);

export default router;
