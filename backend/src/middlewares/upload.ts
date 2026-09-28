import fs from "fs";
import path from "path";
import multer from "multer";
import { env } from "../config/env";
import { AppError } from "../utils/appError";

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const companyId = req.user?.companyId ?? "platform";
    const dir = path.resolve(env.uploadDir, companyId);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowed.includes(file.mimetype)) {
      cb(new AppError("Envie apenas imagens (JPG, PNG, WEBP, GIF ou SVG).", 400));
      return;
    }
    cb(null, true);
  },
});

export function publicFileUrl(filePath: string): string {
  const relative = path.relative(path.resolve(env.uploadDir), filePath).replace(/\\/g, "/");
  return `/uploads/${relative}`;
}
