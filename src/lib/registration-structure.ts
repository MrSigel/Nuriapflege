import {
  blockedOwnerRegistrationEmailDomains,
  businessRegistrationFields,
} from "@/lib/nuria-config";

export const ownerRegistrationPreparation = {
  fields: businessRegistrationFields,
  blockedPrivateEmailDomains: blockedOwnerRegistrationEmailDomains,
  ikNumberCanBeAddedLater: true,
  multipleLocationsSupported: true,
};

export const employeeInvitationPreparation = {
  inviteByEmail: true,
  registrationByInvitation: true,
  roleAssignedByCompany: true,
  staffDashboardOnly: true,
  staffShortCodePrepared: true,
};
