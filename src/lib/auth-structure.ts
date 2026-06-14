import { developmentAccounts, tenantAccessModel, type Role } from "@/lib/nuria-config";

export type SessionContext = {
  userId: string;
  role: Role;
  tenantId: string | null;
  companyId: string | null;
  assignedLocationIds: string[];
  assignedClientIds: string[];
};

export const preparedDevelopmentLogins = developmentAccounts;

export function canAccessTenantRecord(session: SessionContext, recordTenantId: string | null) {
  if (session.role === "admin") {
    return true;
  }

  return Boolean(session.tenantId && recordTenantId && session.tenantId === recordTenantId);
}

export function canAccessAssignedClient(session: SessionContext, clientId: string) {
  if (session.role === "admin" || session.role === "inhaber") {
    return true;
  }

  return session.assignedClientIds.includes(clientId);
}

export const rlsPreparation = {
  tenantColumn: tenantAccessModel.tenantKey,
  companyColumn: tenantAccessModel.companyKey,
  enforceServerSideChecks: true,
  clientSideChecksAreAdvisoryOnly: true,
  noOpenTableAccess: true,
};
