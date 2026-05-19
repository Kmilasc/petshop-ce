import { defineHandler, createError, getRequestHeader } from "h3";
import { db } from "../../src/db/index";
import { users } from "../../src/db/schema";
import { getAuthPayload } from "../../src/lib/auth";
import { eq } from "drizzle-orm";

export default defineHandler(async (event) => {
  let payload;
  try {
    payload = getAuthPayload(getRequestHeader(event, "authorization"));
  } catch (e: any) {
    throw createError({ status: 401, message: e.message });
  }

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, phone: users.phone })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  if (!user) throw createError({ status: 404, message: "Usuário não encontrado" });
  return { user };
});
