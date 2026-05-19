import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");
  return secret;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: "customer" | "admin";
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, getSecret()) as JWTPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getAuthPayload(authHeader: string | undefined): JWTPayload {
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
  try {
    return verifyToken(authHeader.slice(7));
  } catch {
    throw new Error("Invalid token");
  }
}

export function requireAdmin(authHeader: string | undefined): JWTPayload {
  const payload = getAuthPayload(authHeader);
  if (payload.role !== "admin") throw new Error("Forbidden");
  return payload;
}
