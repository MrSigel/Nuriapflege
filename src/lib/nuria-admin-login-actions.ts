"use server";

import { redirect } from "next/navigation";
import { clearNuriaAdminSession, createNuriaAdminSession, verifyNuriaAdminCredentials } from "@/lib/nuria-admin-auth";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function loginNuriaAdmin(formData: FormData) {
  const email = field(formData, "email");
  const password = field(formData, "password");

  if (!verifyNuriaAdminCredentials(email, password)) {
    redirect("/nuria-admin/login?error=1");
  }

  await createNuriaAdminSession();
  redirect("/nuria-admin");
}

export async function logoutNuriaAdmin() {
  await clearNuriaAdminSession();
  redirect("/nuria-admin/login");
}
