import { prisma } from "../config/prisma";
import { AppError } from "../utils/appError";
import { serializeDecimal } from "../utils/slug";

type ProductInput = {
  name: string;
  description: string;
  price: number;
  promotionalPrice?: number | null;
  categoryId: string;
  imageUrl?: string | null;
  stock?: number;
  isAvailable?: boolean;
  isFeatured?: boolean;
};

export const productService = {
  async list(companyId: string, query: { q?: string; categoryId?: string; available?: string }) {
    const items = await prisma.product.findMany({
      where: {
        companyId,
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query.available === "true" ? { isAvailable: true } : {}),
        ...(query.available === "false" ? { isAvailable: false } : {}),
        ...(query.q
          ? {
              OR: [
                { name: { contains: query.q } },
                { description: { contains: query.q } },
              ],
            }
          : {}),
      },
      include: { category: true },
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    });
    return serializeDecimal(items);
  },

  async get(companyId: string, id: string) {
    const product = await prisma.product.findFirst({
      where: { id, companyId },
      include: { category: true },
    });
    if (!product) throw new AppError("Produto não encontrado.", 404);
    return serializeDecimal(product);
  },

  async create(companyId: string, data: ProductInput) {
    await assertCategory(companyId, data.categoryId);
    const product = await prisma.product.create({
      data: {
        companyId,
        name: data.name,
        description: data.description,
        price: data.price,
        promotionalPrice: data.promotionalPrice ?? null,
        categoryId: data.categoryId,
        imageUrl: data.imageUrl,
        stock: data.stock ?? 0,
        isAvailable: data.isAvailable ?? true,
        isFeatured: data.isFeatured ?? false,
      },
      include: { category: true },
    });
    return serializeDecimal(product);
  },

  async update(companyId: string, id: string, data: Partial<ProductInput>) {
    await this.get(companyId, id);
    if (data.categoryId) await assertCategory(companyId, data.categoryId);
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.promotionalPrice !== undefined ? { promotionalPrice: data.promotionalPrice } : {}),
        ...(data.categoryId ? { categoryId: data.categoryId } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
        ...(data.stock !== undefined ? { stock: data.stock } : {}),
        ...(data.isAvailable !== undefined ? { isAvailable: data.isAvailable } : {}),
        ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
      },
      include: { category: true },
    });
    return serializeDecimal(product);
  },

  async remove(companyId: string, id: string) {
    await this.get(companyId, id);
    await prisma.product.delete({ where: { id } });
  },

  async duplicate(companyId: string, id: string) {
    const original = await this.get(companyId, id);
    return this.create(companyId, {
      name: `${original.name} (cópia)`,
      description: original.description,
      price: Number(original.price),
      promotionalPrice: original.promotionalPrice ? Number(original.promotionalPrice) : null,
      categoryId: original.categoryId,
      imageUrl: original.imageUrl,
      stock: original.stock,
      isAvailable: false,
      isFeatured: false,
    });
  },

  async toggle(companyId: string, id: string) {
    const product = await this.get(companyId, id);
    return this.update(companyId, id, { isAvailable: !product.isAvailable });
  },
};

async function assertCategory(companyId: string, categoryId: string) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, companyId } });
  if (!category) throw new AppError("Categoria inválida.", 400);
}

export const categoryService = {
  async list(companyId: string) {
    return prisma.category.findMany({
      where: { companyId },
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: "asc" },
    });
  },

  async create(companyId: string, data: { name: string; slug: string; description?: string; sortOrder?: number }) {
    const exists = await prisma.category.findFirst({ where: { companyId, slug: data.slug } });
    if (exists) throw new AppError("Já existe uma categoria com este slug.", 409);
    return prisma.category.create({ data: { ...data, companyId } });
  },

  async update(companyId: string, id: string, data: { name?: string; slug?: string; description?: string; sortOrder?: number; isActive?: boolean }) {
    const category = await prisma.category.findFirst({ where: { id, companyId } });
    if (!category) throw new AppError("Categoria não encontrada.", 404);
    return prisma.category.update({ where: { id }, data });
  },

  async remove(companyId: string, id: string) {
    const category = await prisma.category.findFirst({
      where: { id, companyId },
      include: { _count: { select: { products: true } } },
    });
    if (!category) throw new AppError("Categoria não encontrada.", 404);
    if (category._count.products > 0) {
      throw new AppError("Não é possível excluir uma categoria com produtos.", 400);
    }
    await prisma.category.delete({ where: { id } });
  },
};
