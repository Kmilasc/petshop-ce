import { defineHandler, readBody, createError, getRequestHeader, getMethod, setResponseStatus } from "h3";
import { z } from "zod/v4";
import { db } from "../../src/db/index";
import { orders, orderItems, cartItems, products, addresses } from "../../src/db/schema";
import { getAuthPayload } from "../../src/lib/auth";
import { eq, desc } from "drizzle-orm";

const checkoutSchema = z.object({
  addressId: z.number().int().positive().optional(),
  notes: z.string().optional(),
  newAddress: z.object({
    street: z.string(), number: z.string(),
    complement: z.string().optional(),
    neighborhood: z.string(), city: z.string(),
    state: z.string().length(2), zipCode: z.string(),
  }).optional(),
});

export default defineHandler(async (event) => {
  let payload;
  try {
    payload = getAuthPayload(getRequestHeader(event, "authorization"));
  } catch (e: any) {
    throw createError({ status: 401, message: e.message });
  }

  const method = getMethod(event);

  if (method === "GET") {
    const userOrders = await db.select({
      id: orders.id, status: orders.status, total: orders.total,
      subtotal: orders.subtotal, shippingCost: orders.shippingCost,
      notes: orders.notes, createdAt: orders.createdAt,
    }).from(orders).where(eq(orders.userId, payload.userId)).orderBy(desc(orders.createdAt));
    return { orders: userOrders };
  }

  if (method === "POST") {
    const body = await readBody(event);
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) throw createError({ status: 400, message: "Dados inválidos" });

    const cartRows = await db.select({
      id: cartItems.id, quantity: cartItems.quantity,
      productId: products.id, productName: products.name,
      productPrice: products.price, productImageUrl: products.imageUrl,
      productStock: products.stock,
    }).from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, payload.userId));

    if (cartRows.length === 0) throw createError({ status: 400, message: "Carrinho vazio" });

    for (const item of cartRows) {
      if (item.productStock < item.quantity)
        throw createError({ status: 400, message: `Estoque insuficiente para ${item.productName}` });
    }

    let addressId = parsed.data.addressId;
    if (!addressId && parsed.data.newAddress) {
      const [addr] = await db.insert(addresses)
        .values({ userId: payload.userId, ...parsed.data.newAddress })
        .returning({ id: addresses.id });
      addressId = addr.id;
    }

    const subtotal = cartRows.reduce((acc, item) => acc + parseFloat(item.productPrice as string) * item.quantity, 0);
    const shippingCost = subtotal >= 150 ? 0 : 19.9;
    const total = subtotal + shippingCost;

    const [order] = await db.insert(orders).values({
      userId: payload.userId,
      subtotal: subtotal.toFixed(2), shippingCost: shippingCost.toFixed(2),
      total: total.toFixed(2), addressId, notes: parsed.data.notes,
    }).returning();

    await db.insert(orderItems).values(cartRows.map((item) => ({
      orderId: order.id, productId: item.productId, quantity: item.quantity,
      unitPrice: item.productPrice as string,
      subtotal: (parseFloat(item.productPrice as string) * item.quantity).toFixed(2),
      productName: item.productName, productImageUrl: item.productImageUrl,
    })));

    await db.delete(cartItems).where(eq(cartItems.userId, payload.userId));

    setResponseStatus(event, 201);
    return { order };
  }

  throw createError({ status: 405, message: "Method not allowed" });
});
