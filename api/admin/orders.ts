import { defineHandler, readBody, createError, getRequestHeader, getQuery, getMethod } from "h3";
import { z } from "zod/v4";
import { db } from "../../src/db/index";
import { orders, users } from "../../src/db/schema";
import { getAuthPayload } from "../../src/lib/auth";
import { eq, desc } from "drizzle-orm";

export default defineHandler(async (event) => {
  let payload;
  try {
    payload = getAuthPayload(getRequestHeader(event, "authorization"));
  } catch (e: any) {
    throw createError({ status: 401, message: e.message });
  }
  if (payload.role !== "admin") throw createError({ status: 403, message: "Acesso negado" });

  const method = getMethod(event);

  if (method === "GET") {
    const allOrders = await db.select({
      id: orders.id, status: orders.status, total: orders.total,
      createdAt: orders.createdAt, userName: users.name, userEmail: users.email,
    }).from(orders).innerJoin(users, eq(orders.userId, users.id)).orderBy(desc(orders.createdAt));
    return { orders: allOrders };
  }

  if (method === "PATCH") {
    const q = getQuery(event) as Record<string, string>;
    const id = parseInt(q.id || "0");
    if (!id) throw createError({ status: 400, message: "ID inválido" });

    const body = await readBody(event);
    const parsed = z.object({
      status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]),
    }).safeParse(body);
    if (!parsed.success) throw createError({ status: 400, message: "Status inválido" });

    const [order] = await db.update(orders)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(eq(orders.id, id)).returning();
    return { order };
  }

  throw createError({ status: 405, message: "Method not allowed" });
});
