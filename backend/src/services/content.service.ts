import { prisma } from "../config/prisma";
import { AppError } from "../utils/appError";
import { serializeDecimal } from "../utils/slug";
import { signToken } from "../utils/jwt";

export const publicService = {
  async getBySlug(slug: string) {
    const company = await prisma.company.findUnique({
      where: { slug },
      include: {
        settings: true,
        siteContent: true,
        categories: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        products: {
          where: { isAvailable: true },
          include: { category: true },
          orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
        },
        gallery: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        testimonials: { where: { isActive: true }, orderBy: { createdAt: "desc" } },
        differentiators: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      },
    });
    if (!company || company.status !== "ACTIVE") {
      throw new AppError("Empresa não encontrada.", 404);
    }
    return serializeDecimal(company);
  },
};

export const contentService = {
  async gallery(companyId: string) {
    return prisma.galleryImage.findMany({
      where: { companyId },
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    });
  },

  async addGallery(companyId: string, data: { imageUrl: string; caption?: string; isPrimary?: boolean }) {
    if (data.isPrimary) {
      await prisma.galleryImage.updateMany({ where: { companyId }, data: { isPrimary: false } });
    }
    return prisma.galleryImage.create({ data: { companyId, ...data } });
  },

  async updateGallery(companyId: string, id: string, data: { caption?: string; isPrimary?: boolean; sortOrder?: number }) {
    const image = await prisma.galleryImage.findFirst({ where: { id, companyId } });
    if (!image) throw new AppError("Imagem não encontrada.", 404);
    if (data.isPrimary) {
      await prisma.galleryImage.updateMany({ where: { companyId }, data: { isPrimary: false } });
    }
    return prisma.galleryImage.update({ where: { id }, data });
  },

  async removeGallery(companyId: string, id: string) {
    const image = await prisma.galleryImage.findFirst({ where: { id, companyId } });
    if (!image) throw new AppError("Imagem não encontrada.", 404);
    await prisma.galleryImage.delete({ where: { id } });
  },

  async testimonials(companyId: string) {
    return prisma.testimonial.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } });
  },

  async addTestimonial(companyId: string, data: { name: string; text: string; rating: number; photoUrl?: string }) {
    if (data.rating < 1 || data.rating > 5) throw new AppError("A nota deve ser de 1 a 5.", 400);
    return prisma.testimonial.create({ data: { companyId, ...data } });
  },

  async updateTestimonial(companyId: string, id: string, data: Partial<{ name: string; text: string; rating: number; photoUrl: string | null; isActive: boolean }>) {
    const item = await prisma.testimonial.findFirst({ where: { id, companyId } });
    if (!item) throw new AppError("Depoimento não encontrado.", 404);
    return prisma.testimonial.update({ where: { id }, data });
  },

  async removeTestimonial(companyId: string, id: string) {
    const item = await prisma.testimonial.findFirst({ where: { id, companyId } });
    if (!item) throw new AppError("Depoimento não encontrado.", 404);
    await prisma.testimonial.delete({ where: { id } });
  },

  async differentiators(companyId: string) {
    return prisma.differentiator.findMany({ where: { companyId }, orderBy: { sortOrder: "asc" } });
  },

  async upsertDifferentiator(companyId: string, id: string | undefined, data: { title: string; description: string; icon?: string; sortOrder?: number; isActive?: boolean }) {
    if (id) {
      const item = await prisma.differentiator.findFirst({ where: { id, companyId } });
      if (!item) throw new AppError("Diferencial não encontrado.", 404);
      return prisma.differentiator.update({ where: { id }, data });
    }
    return prisma.differentiator.create({ data: { companyId, ...data } });
  },

  async removeDifferentiator(companyId: string, id: string) {
    const item = await prisma.differentiator.findFirst({ where: { id, companyId } });
    if (!item) throw new AppError("Diferencial não encontrado.", 404);
    await prisma.differentiator.delete({ where: { id } });
  },

  async getSettings(companyId: string) {
    const [company, settings, content] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId } }),
      prisma.companySettings.findUnique({ where: { companyId } }),
      prisma.siteContent.findUnique({ where: { companyId } }),
    ]);
    if (!company) throw new AppError("Empresa não encontrada.", 404);
    return { company, settings, content };
  },

  async updateSettings(
    companyId: string,
    data: {
      company?: { name?: string; logoUrl?: string | null; faviconUrl?: string | null };
      settings?: Record<string, unknown>;
      content?: Record<string, unknown>;
    },
  ) {
    if (data.company) {
      await prisma.company.update({ where: { id: companyId }, data: data.company });
    }
    if (data.settings) {
      await prisma.companySettings.update({ where: { companyId }, data: data.settings });
    }
    if (data.content) {
      await prisma.siteContent.update({ where: { companyId }, data: data.content });
    }
    return this.getSettings(companyId);
  },
};

export const masterService = {
  async companies() {
    const companies = await prisma.company.findMany({
      include: {
        _count: { select: { products: true, orders: true, customers: true } },
        users: { where: { role: "ADMIN" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });
    return companies;
  },

  async impersonate(masterUserId: string, masterEmail: string, companyId: string) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new AppError("Empresa não encontrada.", 404);

    const admin = await prisma.user.findFirst({
      where: { companyId, role: "ADMIN", isActive: true },
    });
    if (!admin) throw new AppError("Esta empresa não possui um administrador ativo.", 400);

    await prisma.auditLog.create({
      data: {
        actorId: masterUserId,
        actorEmail: masterEmail,
        companyId,
        action: "IMPERSONATE",
        details: `Master acessou o painel da empresa ${company.name}`,
      },
    });

    const token = signToken({
      sub: admin.id,
      email: admin.email,
      role: "ADMIN",
      companyId: company.id,
      impersonatedBy: masterUserId,
    });

    return {
      token,
      company: { id: company.id, name: company.name, slug: company.slug },
    };
  },

  async logs() {
    return prisma.auditLog.findMany({
      include: { company: true, actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  },
};

export const notificationService = {
  async list(companyId: string) {
    const orders = await prisma.order.findMany({
      where: { companyId, status: "NEW" },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
    return serializeDecimal(
      orders.map((order) => ({
        id: order.id,
        title: `Pedido #${String(order.number).padStart(4, "0")}`,
        message: `${order.customer.name} fez um novo pedido.`,
        createdAt: order.createdAt,
      })),
    );
  },
};
