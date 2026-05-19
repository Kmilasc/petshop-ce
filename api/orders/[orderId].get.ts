import { defineHandler, createError, getRequestHeader } from "h3";
import { db } from "../../src/db/index";
import { orders, orderItems, addresses } from "../../src/db/schema";
import { getAuthPayload } from "../../src/lib/auth";
import { eq, and } from "drizzle-orm";

export default defineHandler(async (event) => {
  let payload;
  try {
    payload = getAuthPayload(getRequestHeader(event, "authorization"));
  } catch (e: any) {
    throw createError({ status: 401, message: e.message });
  }

  const orderId = parseInt(event.context.params?.orderId as string);
  const [order] = await db.select().from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, payload.userId))).limit(1);

  if (!order) throw createError({ status: 404, message: "Pedido não encontrado" });

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

  let address = null;
  if (order.addressId) {
    const [addr] = await db.select().from(addresses).where(eq(addresses.id, order.addressId)).limit(1);
    address = addr || null;
  }

  return { order: { ...order, items, address } };
});
