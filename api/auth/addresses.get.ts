import { defineHandler, createError, getRequestHeader } from "h3";
import { db } from "../../src/db/index";
import { addresses } from "../../src/db/schema";
import { getAuthPayload } from "../../src/lib/auth";
import { eq, desc } from "drizzle-orm";

export default defineHandler(async (event) => {
  let payload;
  try {
    payload = getAuthPayload(getRequestHeader(event, "authorization"));
  } catch (e: any) {
    throw createError({ status: 401, message: e.message });
  }

  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, payload.userId))
    .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));

  return { addresses: rows };
});
