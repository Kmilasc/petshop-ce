import { defineHandler, readBody, createError, getRequestHeader, getQuery, getMethod } from "h3";
import { z } from "zod/v4";
import { db } from "../../src/db/index";
import { reviews, users } from "../../src/db/schema";
import { getAuthPayload } from "../../src/lib/auth";
import { eq, and, avg, count, desc } from "drizzle-orm";

const reviewSchema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export default defineHandler(async (event) => {
  const method = getMethod(event);
  const q = getQuery(event) as Record<string, string>;

  if (method === "GET") {
    const productId = parseInt(q.productId || "0");
    if (!productId) throw createError({ status: 400, message: "productId obrigatório" });

    const rows = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        userName: users.name,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt))
      .limit(50);

    const [stats] = await db
      .select({ avg: avg(reviews.rating), total: count(reviews.id) })
      .from(reviews)
      .where(eq(reviews.productId, productId));

    return {
      reviews: rows,
      avg: stats?.avg ? parseFloat(stats.avg as string) : null,
      total: Number(stats?.total ?? 0),
    };
  }

  if (method === "POST") {
    let payload;
    try {
      payload = getAuthPayload(getRequestHeader(event, "authorization"));
    } catch {
      throw createError({ status: 401, message: "Faça login para avaliar" });
    }

    const body = await readBody(event);
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) throw createError({ status: 400, message: "Dados inválidos" });

    const { productId, rating, comment } = parsed.data;

    const existing = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.userId, payload.userId)))
      .limit(1);

    if (existing.length > 0) throw createError({ status: 409, message: "Você já avaliou este produto" });

    const [review] = await db
      .insert(reviews)
      .values({ productId, userId: payload.userId, rating, comment })
      .returning();

    return { review };
  }

  throw createError({ status: 405, message: "Method not allowed" });
});
