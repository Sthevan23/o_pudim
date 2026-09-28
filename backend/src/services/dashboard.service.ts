import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/appError";
import { serializeDecimal } from "../utils/slug";
import { parsePeriod } from "../utils/period";

function money(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value);
}

export const dashboardService = {
  async companyDashboard(companyId: string, query: { period?: string; from?: string; to?: string }) {
    const { from, to } = parsePeriod(query);
    const todayFrom = new Date();
    todayFrom.setHours(0, 0, 0, 0);
    const monthFrom = new Date(todayFrom.getFullYear(), todayFrom.getMonth(), 1);

    const delivered = { status: { not: "CANCELLED" as const } };

    const [
      revenueToday,
      revenueMonth,
      ordersToday,
      ordersMonth,
      productsCount,
      customersCount,
      periodOrders,
      topProducts,
      daily,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { companyId, createdAt: { gte: todayFrom }, ...delivered },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: { companyId, createdAt: { gte: monthFrom }, ...delivered },
        _sum: { total: true },
      }),
      prisma.order.count({ where: { companyId, createdAt: { gte: todayFrom } } }),
      prisma.order.count({ where: { companyId, createdAt: { gte: monthFrom } } }),
      prisma.product.count({ where: { companyId } }),
      prisma.customer.count({ where: { companyId } }),
      prisma.order.findMany({
        where: { companyId, createdAt: { gte: from, lte: to }, ...delivered },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: {
          order: { companyId, createdAt: { gte: from, lte: to }, ...delivered },
        },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 6,
      }),
      prisma.order.findMany({
        where: { companyId, createdAt: { gte: from, lte: to }, ...delivered },
        select: { createdAt: true, total: true },
      }),
    ]);

    const productIds = topProducts.map((p) => p.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const byDay = new Map<string, { revenue: number; orders: number }>();
    for (const order of daily) {
      const key = order.createdAt.toISOString().slice(0, 10);
      const current = byDay.get(key) ?? { revenue: 0, orders: 0 };
      current.revenue += money(order.total);
      current.orders += 1;
      byDay.set(key, current);
    }

    const byMonth = new Map<string, { revenue: number; orders: number }>();
    for (const order of daily) {
      const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, "0")}`;
      const current = byMonth.get(key) ?? { revenue: 0, orders: 0 };
      current.revenue += money(order.total);
      current.orders += 1;
      byMonth.set(key, current);
    }

    const periodRevenue = periodOrders.reduce((sum, o) => sum + money(o.total), 0);
    const ticket = periodOrders.length ? periodRevenue / periodOrders.length : 0;

    return {
      cards: {
        revenueToday: money(revenueToday._sum.total),
        revenueMonth: money(revenueMonth._sum.total),
        ordersToday,
        ordersMonth,
        productsCount,
        customersCount,
        ticketAverage: ticket,
      },
      revenueByDay: [...byDay.entries()].map(([date, v]) => ({ date, ...v })),
      revenueByMonth: [...byMonth.entries()].map(([month, v]) => ({ month, ...v })),
      topProducts: topProducts.map((row) => ({
        productId: row.productId,
        name: productMap.get(row.productId)?.name ?? "Produto",
        quantity: row._sum.quantity ?? 0,
        total: money(row._sum.total),
      })),
      ordersCount: periodOrders.length,
      period: { from, to },
    };
  },

  async masterDashboard() {
    const monthFrom = new Date();
    monthFrom.setDate(1);
    monthFrom.setHours(0, 0, 0, 0);

    const [companies, active, inactive, products, orders, revenue, newCompanies] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { status: "ACTIVE" } }),
      prisma.company.count({ where: { status: "INACTIVE" } }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        where: { status: { not: "CANCELLED" } },
        _sum: { total: true },
      }),
      prisma.company.count({ where: { createdAt: { gte: monthFrom } } }),
    ]);

    return {
      companies,
      active,
      inactive,
      products,
      orders,
      revenue: money(revenue._sum.total),
      newCompanies,
    };
  },
};

export { serializeDecimal };
