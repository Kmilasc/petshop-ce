import { defineHandler, readBody, createError, setResponseStatus } from "h3";
import { z } from "zod/v4";
import { db } from "../../src/db/index";
import { users, addresses } from "../../src/db/schema";
import { hashPassword, signToken } from "../../src/lib/auth";
import { eq } from "drizzle-orm";

// Valida CPF: remove formatação e checa dígitos verificadores
function isValidCPF(raw: string): boolean {
  const cpf = raw.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(cpf[10]);
}

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  password: z.string().min(6),
  cpf: z.string().min(11).max(14),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().min(1),
    number: z.string().min(1),
    complement: z.string().optional(),
    neighborhood: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2),
    zipCode: z.string().min(8),
  }).optional(),
});

export default defineHandler(async (event) => {
  const body = await readBody(event);
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw createError({ status: 400, message: "Dados inválidos" });

  const { name, email, password, cpf, phone, address } = parsed.data;

  if (!isValidCPF(cpf)) throw createError({ status: 400, message: "CPF inválido" });

  const cpfFormatted = cpf.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) throw createError({ status: 409, message: "Email já cadastrado" });

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({ name, email, passwordHash, phone, cpf: cpfFormatted }).returning({
    id: users.id, name: users.name, email: users.email, role: users.role, cpf: users.cpf,
  });

  // Salva endereço inicial se fornecido
  if (address) {
    await db.insert(addresses).values({
      userId: user.id,
      ...address,
      isDefault: true,
    });
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  setResponseStatus(event, 201);
  return { user, token };
});
