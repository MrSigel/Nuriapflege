import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const cookieName = "nuria_admin_session";
const maxAge = 60 * 60 * 8;

function normalizeEnvValue(value: string | undefined) {
  const normalized = value?.trim() ?? "";

  if (
    (normalized.startsWith("\"") && normalized.endsWith("\"")) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    return normalized.slice(1, -1);
  }

  return normalized;
}

function adminEmail() {
  return normalizeEnvValue(process.env.NURIA_ADMIN_EMAIL);
}

function adminPassword() {
  return normalizeEnvValue(process.env.NURIA_ADMIN_PASSWORD);
}

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function sign(payload: string) {
  const secret = `${adminEmail()}:${adminPassword()}`;
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function hasAdminEnv() {
  return Boolean(adminEmail() && adminPassword());
}

export function verifyNuriaAdminCredentials(email: string, password: string) {
  return hasAdminEnv() && email.trim() === adminEmail() && password === adminPassword();
}

export async function createNuriaAdminSession() {
  const payload = base64Url(JSON.stringify({ iat: Date.now() }));
  const token = `${payload}.${sign(payload)}`;
  const secure = process.env.NODE_ENV === "production";

  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/nuria-admin",
    maxAge,
  });
}

export async function clearNuriaAdminSession() {
  (await cookies()).set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/nuria-admin",
    maxAge: 0,
  });
}

export async function hasValidNuriaAdminSession() {
  if (!hasAdminEnv()) return false;

  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return false;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { iat?: number };
    return typeof parsed.iat === "number" && Date.now() - parsed.iat <= maxAge * 1000;
  } catch {
    return false;
  }
}
