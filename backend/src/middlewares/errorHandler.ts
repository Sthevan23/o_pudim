import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/appError";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: "Rota não encontrada." });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      details: err.details,
    });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      message: "Dados inválidos.",
      details: err.flatten(),
    });
  }

  console.error(err);
  return res.status(500).json({ message: "Erro interno do servidor." });
}
