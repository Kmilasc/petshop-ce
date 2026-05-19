import { defineHandler, getQuery } from "h3";
import { db } from "../../src/db/index";
import { products, categories } from "../../src/db/schema";
import { eq, and, ilike, desc, sql } from "drizzle-orm";

export default defineHandler(async (event) => {
  const q = getQuery(event) as Record<string, string>;
  const page = parseInt(q.page || "1");
  const limit = parseInt(q.limit || "12");
  const search = q.search || "";
  const categoryId = q.category;
  const petType = q.petType;
  const featured = q.featured;
  const offset = (page - 1) * limit;

  const conditions: any[] = [eq(products.active, true)];
  if (search) conditions.push(ilike(products.name, `%${search}%`));
  if (categoryId) conditions.push(eq(products.categoryId, parseInt(categoryId)));
  if (petType) conditions.push(eq(products.petType, petType as any));
  if (featured === "true") conditions.push(eq(products.featured, true));

  const where = conditions.length > 1 ? and(...conditions) : conditions[0];

  const [rows, [{ count }]] = await Promise.all([
    db.select({
      id: products.id, name: products.name, slug: products.slug,
      price: products.price, originalPrice: products.originalPrice,
      stock: products.stock, imageUrl: products.imageUrl,
      petType: products.petType, brand: products.brand,
      featured: products.featured,
      categoryName: categories.name, categorySlug: categories.slug,
    }).from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where).orderBy(desc(products.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(products).where(where),
  ]);

  return { products: rows, pagination: { page, limit, total: count, pages: Math.ceil(count / limit) } };
});
