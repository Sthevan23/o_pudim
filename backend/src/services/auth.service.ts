import crypto from "crypto";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { AppError } from "../utils/appError";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";

export const authService = {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { company: true },
    });
    if (!user || !user.isActive) {
      throw new AppError("E-mail ou senha inválidos.", 401);
    }
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) throw new AppError("E-mail ou senha inválidos.", 401);

    if (user.role !== "MASTER" && user.company && user.company.status !== "ACTIVE") {
      throw new AppError("Esta empresa está inativa. Fale com o suporte.", 403);
    }

    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company?.name ?? null,
        companySlug: user.company?.slug ?? null,
        logoUrl: user.company?.logoUrl ?? user.avatarUrl,
      },
    };
  },

  async me(userId: string, impersonatedBy?: string, companyId?: string | null) {
    const user = await prisma.user.findUnique({
      where: { id: impersonatedBy ?? userId },
      include: { company: true },
    });
    if (!user) throw new AppError("Usuário não encontrado.", 404);

    const impersonating = Boolean(impersonatedBy);
    const company = impersonating && companyId
      ? await prisma.company.findUnique({ where: { id: companyId } })
      : user.company;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: impersonating ? "ADMIN" : user.role,
      realRole: user.role,
      companyId: company?.id ?? user.companyId,
      companyName: company?.name ?? null,
      companySlug: company?.slug ?? null,
      logoUrl: company?.logoUrl ?? user.avatarUrl,
      impersonating,
    };
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return { message: "Se o e-mail existir, enviaremos as instruções." };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const resetUrl = `${env.frontendUrl}/redefinir-senha?token=${token}`;
    if (env.isDev) {
      console.log("Link de redefinição:", resetUrl);
      return {
        message: "Link de redefinição gerado (ambiente de desenvolvimento).",
        resetUrl,
      };
    }
    return { message: "Se o e-mail existir, enviaremos as instruções." };
  },

  async resetPassword(token: string, password: string) {
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new AppError("Link inválido ou expirado.", 400);
    }
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash: await hashPassword(password) },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
    return { message: "Senha atualizada. Você já pode entrar." };
  },
};
