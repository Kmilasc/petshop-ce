import { defineHandler, readBody, createError, getRequestHeader, getMethod, setResponseStatus } from "h3";
import { z } from "zod/v4";
import { db } from "../../src/db/index";
import { cartItems, products } from "../../src/db/schema";
import { getAuthPayload } from "../../src/lib/auth";
import { eq, and } from "drizzle-orm";

const addSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
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
    const items = await db.select({
      id: cartItems.id, quantity: cartItems.quantity,
      productId: products.id, productName: products.name,
      productSlug: products.slug, productPrice: products.price,
      productImageUrl: products.imageUrl, productStock: products.stock,
    }).from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, payload.userId));
    return { items };
  }

  if (method === "POST") {
    const body = await readBody(event);
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) throw createError({ status: 400, message: "Dados inválidos" });

    const { productId, quantity } = parsed.data;
    const [product] = await db.select({ id: products.id, stock: products.stock }).from(products).where(eq(products.id, productId)).limit(1);
    if (!product) throw createError({ status: 404, message: "Produto não encontrado" });
    if (product.stock < quantity) throw createError({ status: 400, message: "Estoque insuficiente" });

    const [existing] = await db.select().from(cartItems)
      .where(and(eq(cartItems.userId, payload.userId), eq(cartItems.productId, productId))).limit(1);

    if (existing) {
      await db.update(cartItems).set({ quantity: existing.quantity + quantity, updatedAt: new Date() }).where(eq(cartItems.id, existing.id));
    } else {
      await db.insert(cartItems).values({ userId: payload.userId, productId, quantity });
    }
    setResponseStatus(event, 201);
    return { success: true };
  }

  if (method === "DELETE") {
    await db.delete(cartItems).where(eq(cartItems.userId, payload.userId));
    return { success: true };
  }

  throw createError({ status: 405, message: "Method not allowed" });
});
