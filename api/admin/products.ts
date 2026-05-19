import { defineHandler, readBody, createError, getRequestHeader, getQuery, getMethod } from "h3";
import { z } from "zod/v4";
import { db } from "../../src/db/index";
import { products } from "../../src/db/schema";
import { getAuthPayload } from "../../src/lib/auth";
import { eq } from "drizzle-orm";

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  price: z.string(),
  originalPrice: z.string().optional(),
  stock: z.number().int().min(0),
  imageUrl: z.string().optional(),
  categoryId: z.number().int().positive(),
  petType: z.enum(["dog", "cat", "bird", "fish", "rabbit", "hamster", "reptile", "other"]),
  brand: z.string().optional(),
  weight: z.string().optional(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});

export default defineHandler(async (event) => {
  let payload;
  try {
    payload = getAuthPayload(getRequestHeader(event, "authorization"));
  } catch (e: any) {
    throw createError({ status: 401, message: e.message });
  }
  if (payload.role !== "admin") throw createError({ status: 403, message: "Acesso negado" });

  const method = getMethod(event);
  const q = getQuery(event) as Record<string, string>;

  if (method === "POST") {
    const body = await readBody(event);
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) throw createError({ status: 400, message: "Dados inválidos" });
    const [product] = await db.insert(products).values(parsed.data).returning();
    return { product };
  }

  if (method === "PATCH") {
    const id = parseInt(q.id || "0");
    if (!id) throw createError({ status: 400, message: "ID inválido" });
    const body = await readBody(event);
    const parsed = productSchema.partial().safeParse(body);
    if (!parsed.success) throw createError({ status: 400, message: "Dados inválidos" });
    const [product] = await db.update(products).set({ ...parsed.data, updatedAt: new Date() }).where(eq(products.id, id)).returning();
    return { product };
  }

  if (method === "DELETE") {
    const id = parseInt(q.id || "0");
    if (!id) throw createError({ status: 400, message: "ID inválido" });
    await db.update(products).set({ active: false }).where(eq(products.id, id));
    return { success: true };
  }

  throw createError({ status: 405, message: "Method not allowed" });
});
