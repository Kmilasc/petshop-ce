import { defineHandler, createError } from "h3";
import { db } from "../../src/db/index";
import { products, categories } from "../../src/db/schema";
import { eq } from "drizzle-orm";

export default defineHandler(async (event) => {
  const slug = event.context.params?.slug as string;

  const [product] = await db.select({
    id: products.id, name: products.name, slug: products.slug,
    description: products.description, price: products.price,
    originalPrice: products.originalPrice, stock: products.stock,
    imageUrl: products.imageUrl, imageUrls: products.imageUrls,
    petType: products.petType, brand: products.brand,
    weight: products.weight, featured: products.featured,
    categoryId: products.categoryId,
    categoryName: categories.name, categorySlug: categories.slug,
  }).from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug)).limit(1);

  if (!product) throw createError({ status: 404, message: "Produto não encontrado" });
  return { product };
});
