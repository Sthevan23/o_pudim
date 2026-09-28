import { TransactionType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/appError";
import { serializeDecimal } from "../utils/slug";
import { parsePeriod, toCsv } from "../utils/period";

export const EXPENSE_CATEGORIES = [
  "Ingredientes",
  "Embalagens",
  "Marketing",
  "Funcionários",
  "Aluguel",
  "Energia",
  "Internet",
  "Transporte",
  "Outros",
] as const;

export const financeService = {
  async dashboard(companyId: string, query: { period?: string; from?: string; to?: string }) {
    const { from, to } = parsePeriod(query);
    const txs = await prisma.financialTransaction.findMany({
      where: { companyId, date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    });

    const income = txs.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
    const expense = txs.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
    const orders = await prisma.order.count({
      where: { companyId, createdAt: { gte: from, lte: to }, status: { not: "CANCELLED" } },
    });

    const byCategory = new Map<string, number>();
    for (const tx of txs.filter((t) => t.type === "EXPENSE")) {
      byCategory.set(tx.category, (byCategory.get(tx.category) ?? 0) + Number(tx.amount));
    }

    const byDay = new Map<string, { income: number; expense: number }>();
    for (const tx of txs) {
      const key = tx.date.toISOString().slice(0, 10);
      const current = byDay.get(key) ?? { income: 0, expense: 0 };
      if (tx.type === "INCOME") current.income += Number(tx.amount);
      else current.expense += Number(tx.amount);
      byDay.set(key, current);
    }

    return {
      income,
      expense,
      profit: income - expense,
      ticketAverage: orders ? income / orders : 0,
      byCategory: [...byCategory.entries()].map(([category, amount]) => ({ category, amount })),
      byDay: [...byDay.entries()].map(([date, v]) => ({ date, ...v })),
      categories: EXPENSE_CATEGORIES,
    };
  },

  async list(companyId: string, query: { type?: TransactionType; from?: string; to?: string }) {
    const { from, to } = parsePeriod(query);
    const items = await prisma.financialTransaction.findMany({
      where: {
        companyId,
        date: { gte: from, lte: to },
        ...(query.type ? { type: query.type } : {}),
      },
      orderBy: { date: "desc" },
    });
    return serializeDecimal(items);
  },

  async create(
    companyId: string,
    data: {
      type: TransactionType;
      category: string;
      description: string;
      amount: number;
      date: string | Date;
      notes?: string;
    },
  ) {
    const tx = await prisma.financialTransaction.create({
      data: {
        companyId,
        type: data.type,
        category: data.category,
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
        notes: data.notes,
      },
    });
    return serializeDecimal(tx);
  },

  async update(companyId: string, id: string, data: Partial<{ type: TransactionType; category: string; description: string; amount: number; date: string; notes: string }>) {
    const existing = await prisma.financialTransaction.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError("Lançamento não encontrado.", 404);
    const tx = await prisma.financialTransaction.update({
      where: { id },
      data: {
        ...data,
        ...(data.date ? { date: new Date(data.date) } : {}),
      },
    });
    return serializeDecimal(tx);
  },

  async remove(companyId: string, id: string) {
    const existing = await prisma.financialTransaction.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError("Lançamento não encontrado.", 404);
    await prisma.financialTransaction.delete({ where: { id } });
  },
};

export const reportService = {
  async build(companyId: string, query: { from?: string; to?: string }) {
    const { from, to } = parsePeriod(query);
    const [orders, transactions, customers] = await Promise.all([
      prisma.order.findMany({
        where: { companyId, createdAt: { gte: from, lte: to } },
        include: { customer: true, items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.financialTransaction.findMany({
        where: { companyId, date: { gte: from, lte: to } },
      }),
      prisma.customer.findMany({ where: { companyId } }),
    ]);

    const validOrders = orders.filter((o) => o.status !== "CANCELLED");
    const income = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
    const expense = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);

    const soldMap = new Map<string, { name: string; quantity: number; total: number }>();
    for (const order of validOrders) {
      for (const item of order.items) {
        const current = soldMap.get(item.productId) ?? { name: item.product.name, quantity: 0, total: 0 };
        current.quantity += item.quantity;
        current.total += Number(item.total);
        soldMap.set(item.productId, current);
      }
    }

    const productsSold = [...soldMap.values()].sort((a, b) => b.quantity - a.quantity);

    return {
      period: { from, to },
      revenue: income,
      expense,
      profit: income - expense,
      ordersCount: validOrders.length,
      cancelledCount: orders.length - validOrders.length,
      ticketAverage: validOrders.length ? income / validOrders.length : 0,
      productsSold,
      topProducts: productsSold.slice(0, 8),
      customersCount: customers.length,
      orders: serializeDecimal(validOrders),
    };
  },

  async csv(companyId: string, type: string, query: { from?: string; to?: string }) {
    const report = await this.build(companyId, query);
    if (type === "produtos") {
      return toCsv(report.productsSold.map((p) => ({ Produto: p.name, Quantidade: p.quantity, Total: p.total.toFixed(2) })));
    }
    if (type === "pedidos") {
      return toCsv(
        (report.orders as unknown as Array<{ number: number; customer: { name: string }; total: number; status: string; createdAt: Date; paymentMethod: string }>).map((o) => ({
          Pedido: o.number,
          Cliente: o.customer.name,
          Total: Number(o.total).toFixed(2),
          Status: o.status,
          Pagamento: o.paymentMethod,
          Data: new Date(o.createdAt).toLocaleString("pt-BR"),
        })),
      );
    }
    return toCsv([
      {
        Periodo_inicio: report.period.from.toISOString(),
        Periodo_fim: report.period.to.toISOString(),
        Faturamento: report.revenue.toFixed(2),
        Despesas: report.expense.toFixed(2),
        Lucro: report.profit.toFixed(2),
        Pedidos: report.ordersCount,
        Ticket_medio: report.ticketAverage.toFixed(2),
        Clientes: report.customersCount,
      },
    ]);
  },
};
