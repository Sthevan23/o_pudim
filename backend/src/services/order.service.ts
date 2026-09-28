import { OrderStatus, PaymentMethod } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/appError";
import { serializeDecimal } from "../utils/slug";

type OrderItemInput = { productId: string; quantity: number };

export const orderService = {
  async list(companyId: string, query: { status?: OrderStatus; q?: string }) {
    const items = await prisma.order.findMany({
      where: {
        companyId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.q
          ? {
              OR: [
                { customer: { name: { contains: query.q } } },
                { customer: { phone: { contains: query.q } } },
              ],
            }
          : {}),
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return serializeDecimal(items);
  },

  async get(companyId: string, id: string) {
    const order = await prisma.order.findFirst({
      where: { id, companyId },
      include: { customer: true, items: { include: { product: true } } },
    });
    if (!order) throw new AppError("Pedido não encontrado.", 404);
    return serializeDecimal(order);
  },

  async create(
    companyId: string,
    data: {
      customerId: string;
      items: OrderItemInput[];
      paymentMethod?: PaymentMethod;
      notes?: string;
      createdAt?: Date;
    },
  ) {
    const customer = await prisma.customer.findFirst({ where: { id: data.customerId, companyId } });
    if (!customer) throw new AppError("Cliente não encontrado.", 404);
    if (!data.items.length) throw new AppError("Inclua ao menos um item.", 400);

    const products = await prisma.product.findMany({
      where: { companyId, id: { in: data.items.map((i) => i.productId) } },
    });
    if (products.length !== data.items.length) throw new AppError("Há produtos inválidos no pedido.", 400);

    const last = await prisma.order.findFirst({
      where: { companyId },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const number = (last?.number ?? 0) + 1;
    const productMap = new Map(products.map((p) => [p.id, p]));

    const items = data.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = Number(product.promotionalPrice ?? product.price);
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        total: unitPrice * item.quantity,
      };
    });
    const total = items.reduce((sum, item) => sum + item.total, 0);

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          companyId,
          customerId: data.customerId,
          number,
          paymentMethod: data.paymentMethod ?? "PIX",
          notes: data.notes,
          subtotal: total,
          total,
          createdAt: data.createdAt,
          items: { create: items },
        },
        include: { customer: true, items: { include: { product: true } } },
      });

      await tx.financialTransaction.create({
        data: {
          companyId,
          type: "INCOME",
          category: "Vendas",
          description: `Pedido #${String(number).padStart(4, "0")}`,
          amount: total,
          date: created.createdAt,
          orderId: created.id,
        },
      });

      return created;
    });

    return serializeDecimal(order);
  },

  async updateStatus(companyId: string, id: string, status: OrderStatus) {
    await this.get(companyId, id);
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: { customer: true, items: { include: { product: true } } },
    });

    if (status === "CANCELLED") {
      await prisma.financialTransaction.deleteMany({ where: { orderId: id, companyId } });
    }

    return serializeDecimal(order);
  },
};

export const customerService = {
  async list(companyId: string, q?: string) {
    const customers = await prisma.customer.findMany({
      where: {
        companyId,
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { phone: { contains: q } },
                { email: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        orders: { select: { total: true, createdAt: true, status: true } },
      },
      orderBy: { name: "asc" },
    });

    return customers.map((customer) => {
      const valid = customer.orders.filter((o) => o.status !== "CANCELLED");
      const spent = valid.reduce((sum, o) => sum + Number(o.total), 0);
      const lastOrder = valid.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      return {
        ...customer,
        ordersCount: valid.length,
        totalSpent: spent,
        lastOrderAt: lastOrder?.createdAt ?? null,
        orders: undefined,
      };
    });
  },

  async get(companyId: string, id: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, companyId },
      include: {
        orders: {
          include: { items: { include: { product: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!customer) throw new AppError("Cliente não encontrado.", 404);
    const valid = customer.orders.filter((o) => o.status !== "CANCELLED");
    return serializeDecimal({
      ...customer,
      ordersCount: valid.length,
      totalSpent: valid.reduce((sum, o) => sum + Number(o.total), 0),
      lastOrderAt: valid[0]?.createdAt ?? null,
    });
  },

  async create(companyId: string, data: { name: string; phone: string; email?: string; address?: string; notes?: string }) {
    return prisma.customer.create({ data: { ...data, companyId } });
  },

  async update(companyId: string, id: string, data: { name?: string; phone?: string; email?: string; address?: string; notes?: string }) {
    await this.get(companyId, id);
    return prisma.customer.update({ where: { id }, data });
  },

  async remove(companyId: string, id: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, companyId },
      include: { _count: { select: { orders: true } } },
    });
    if (!customer) throw new AppError("Cliente não encontrado.", 404);
    if (customer._count.orders > 0) {
      throw new AppError("Não é possível excluir um cliente com pedidos.", 400);
    }
    await prisma.customer.delete({ where: { id } });
  },
};
