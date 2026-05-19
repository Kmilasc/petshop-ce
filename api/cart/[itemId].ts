import { defineHandler, readBody, createError, getRequestHeader, getMethod } from "h3";
import { z } from "zod/v4";
import { db } from "../../src/db/index";
import { cartItems } from "../../src/db/schema";
import { getAuthPayload } from "../../src/lib/auth";
import { eq, and } from "drizzle-orm";

export default defineHandler(async (event) => {
  let payload;
  try {
    payload = getAuthPayload(getRequestHeader(event, "authorization"));
  } catch (e: any) {
    throw createError({ status: 401, message: e.message });
  }

  const itemId = parseInt(event.context.params?.itemId as string);
  const method = getMethod(event);

  if (method === "PATCH") {
    const body = await readBody(event);
    const parsed = z.object({ quantity: z.number().int().min(1) }).safeParse(body);
    if (!parsed.success) throw createError({ status: 400, message: "Dados inválidos" });
    await db.update(cartItems).set({ quantity: parsed.data.quantity, updatedAt: new Date() })
      .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, payload.userId)));
    return { success: true };
  }

  if (method === "DELETE") {
    await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.userId, payload.userId)));
    return { success: true };
  }

  throw createError({ status: 405, message: "Method not allowed" });
});
