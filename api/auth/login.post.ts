import { defineHandler, readBody, createError } from "h3";
import { z } from "zod/v4";
import { db } from "../../src/db/index";
import { users } from "../../src/db/schema";
import { comparePassword, signToken } from "../../src/lib/auth";
import { eq } from "drizzle-orm";

const schema = z.object({ email: z.email(), password: z.string().min(1) });

export default defineHandler(async (event) => {
  const body = await readBody(event);
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw createError({ status: 400, message: "Dados inválidos" });

  const { email, password } = parsed.data;
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw createError({ status: 401, message: "Email ou senha inválidos" });
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token };
});
