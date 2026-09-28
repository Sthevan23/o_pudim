import { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/appError";
import { verifyToken } from "../utils/jwt";

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError("Não autenticado.", 401));
  }

  try {
    const payload = verifyToken(header.slice(7));
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      return next(new AppError("Usuário inválido ou inativo.", 401));
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: payload.impersonatedBy ? UserRole.ADMIN : user.role,
      companyId: payload.companyId,
      impersonatedBy: payload.impersonatedBy,
    };
    return next();
  } catch {
    return next(new AppError("Sessão expirada. Entre novamente.", 401));
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError("Não autenticado.", 401));
    if (req.user.impersonatedBy && roles.includes(UserRole.ADMIN)) {
      return next();
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError("Você não tem permissão para isso.", 403));
    }
    next();
  };
}

export function requireCompany(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new AppError("Não autenticado.", 401));
  if (req.user.role === UserRole.MASTER && !req.user.impersonatedBy) {
    return next(new AppError("Acesse o painel master para esta operação.", 403));
  }
  if (!req.user.companyId) {
    return next(new AppError("Empresa não identificada.", 403));
  }
  next();
}

export function companyScope(req: Request): string {
  if (!req.user?.companyId) {
    throw new AppError("Empresa não identificada.", 403);
  }
  return req.user.companyId;
}
