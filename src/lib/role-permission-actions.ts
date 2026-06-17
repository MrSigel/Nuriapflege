"use server";

import { revalidatePath } from "next/cache";
import { requireCompanyRole } from "@/lib/current-user";
import type { EmployeeRole } from "@/lib/employees";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { managedRoles, permissions } from "@/lib/permissions-config";

export async function saveRolePermissions(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId } = await requireCompanyRole(["inhaber", "pdl"]);
  if (!supabase || !companyId) return;

  const editableRoles = managedRoles.map((role) => role.key).filter((role) => role !== "inhaber");
  const rows: Array<{ company_id: string; role_key: EmployeeRole; permission_key: string; enabled: boolean }> = [];

  for (const role of editableRoles) {
    for (const permission of permissions) {
      rows.push({
        company_id: companyId,
        role_key: role,
        permission_key: permission.key,
        enabled: formData.get(`${role}:${permission.key}`) === "on",
      });
    }
  }

  await supabase.from("role_permissions").upsert(rows, { onConflict: "company_id,role_key,permission_key" });
  revalidatePath("/dashboard/rollen-rechte");
}
