import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const cookieName = "nuria_admin_session";
const maxAge = 60 * 60 * 8;

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function sign(payload: string) {
  const secret = `${process.env.NURIA_ADMIN_EMAIL ?? ""}:${process.env.NURIA_ADMIN_PASSWORD ?? ""}`;
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function hasAdminEnv() {
  return Boolean(process.env.NURIA_ADMIN_EMAIL && process.env.NURIA_ADMIN_PASSWORD);
}

export function verifyNuriaAdminCredentials(email: string, password: string) {
  return hasAdminEnv() && email === process.env.NURIA_ADMIN_EMAIL && password === process.env.NURIA_ADMIN_PASSWORD;
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
