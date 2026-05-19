import { defineHandler } from "h3";
import { db } from "../../src/db/index";
import { categories, products } from "../../src/db/schema";
import { eq, sql } from "drizzle-orm";

export default defineHandler(async () => {
  const rows = await db.select({
    id: categories.id, name: categories.name, slug: categories.slug,
    description: categories.description, imageUrl: categories.imageUrl,
    emoji: categories.emoji, petType: categories.petType,
    productCount: sql<number>`count(${products.id})::int`,
  }).from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(categories.name);

  return { categories: rows };
});
