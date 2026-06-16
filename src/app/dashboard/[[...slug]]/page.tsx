import { notFound, redirect } from "next/navigation";
import { DashboardOverview } from "@/components/dashboard-overview";
import { DashboardPage } from "@/components/dashboard-page";
import { DashboardShell } from "@/components/dashboard-shell";
import { DocumentsPage } from "@/components/documents-page";
import { CommunicationPage } from "@/components/communication-page";
import { BillingPage } from "@/components/billing-page";
import { CareDocumentationPage } from "@/components/care-documentation-page";
import { ClientsPage } from "@/components/clients-page";
import { ApplicantsPage } from "@/components/applicants-page";
import { EmployeesPage } from "@/components/employees-page";
import { LocationsPage } from "@/components/locations-page";
import { RolesPermissionsPage } from "@/components/roles-permissions-page";
import { SettingsPage } from "@/components/settings-page";
import { ShiftsPage } from "@/components/shifts-page";
import { TimeTrackingPage } from "@/components/time-tracking-page";
import { ToursPage } from "@/components/tours-page";
import { WebsiteOnlinePage } from "@/components/website-online-page";
import { QmMdPage } from "@/components/qm-md-page";
import { ExportsPage } from "@/components/exports-page";
import { ActivityLogsPage } from "@/components/activity-logs-page";
import { CompliancePage } from "@/components/compliance-page";
import { PaymentPage } from "@/components/payment-page";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { changeClientStatus, createClient, updateClient } from "@/lib/client-actions";
import { getClientsData } from "@/lib/clients";
import { getDashboardOverview } from "@/lib/dashboard-overview";
import { createEmployee, inviteEmployee, toggleEmployeeStatus, updateEmployee } from "@/lib/employee-actions";
import { getEmployeesData } from "@/lib/employees";
import { getLocationsData } from "@/lib/locations";
import { saveRolePermissions } from "@/lib/role-permission-actions";
import { getRolePermissionData } from "@/lib/roles-permissions";
import { changeShiftStatus, createShift, updateShift } from "@/lib/shift-actions";
import { getShiftsData } from "@/lib/shifts";
import { createTimeEntry, reviewTimeEntry, updateTimeEntry } from "@/lib/time-actions";
import { getTimeTrackingData } from "@/lib/time-tracking";
import { changeTourStatus, createTour, deleteTourStop, moveTourStop, updateTour, upsertTourStop } from "@/lib/tour-actions";
import { getToursData } from "@/lib/tours";
import { saveSettings } from "@/lib/settings-actions";
import { getSettingsData } from "@/lib/settings";
import { appRoutes, routeByPath } from "@/lib/nuria-config";
import { createCareDoc, reviewCareDoc, updateCareDoc } from "@/lib/care-actions";
import { getCareDocumentationData } from "@/lib/care-documentation";
import { changeBillingItemStatus, createBillingItem, createInvoice, updateBillingItem, updateInvoiceStatus } from "@/lib/billing-actions";
import { getBillingData } from "@/lib/billing";
import { archiveDocument, deleteDocument, getDocumentSignedUrl, updateDocument, uploadDocument } from "@/lib/document-actions";
import { getDocumentsData } from "@/lib/documents";
import { addParticipant, archiveConversation, createDirectConversation, createGroupConversation, markConversationRead, removeParticipant, sendMessage } from "@/lib/communication-actions";
import { getCommunicationData } from "@/lib/communication";
import { changeApplicantRating, changeApplicantStatus, createApplicant, setApplicantFollowUp, updateApplicant } from "@/lib/applicant-actions";
import { getApplicantsData } from "@/lib/applicants";
import { changeOnlineTaskPriority, changeOnlineTaskStatus, changeWebsiteLeadPriority, changeWebsiteLeadStatus, createOnlineTask, createWebsiteLead, setWebsiteLeadFollowUp, updateOnlineTask, updateWebsiteLead } from "@/lib/website-online-actions";
import { getWebsiteOnlineData } from "@/lib/website-online";
import { changeQmItemPriority, changeQmItemStatus, changeQmMeasurePriority, changeQmMeasureStatus, createQmEvidence, createQmItem, createQmMeasure, setQmItemDueDate, updateQmItem, updateQmMeasure } from "@/lib/qm-md-actions";
import { getQmMdData } from "@/lib/qm-md";
import { createExportJob, deleteExportJob } from "@/lib/export-actions";
import { getExportsData } from "@/lib/exports";
import { getActivityLogsData } from "@/lib/activity-logs";
import { getComplianceData } from "@/lib/compliance";
import { changeComplianceItemPriority, changeComplianceItemStatus, createComplianceEvidence, createComplianceItem, updateComplianceItem } from "@/lib/compliance-actions";
import { getPaymentData } from "@/lib/payment";
import { markPaymentSent, saveBillingData } from "@/lib/payment-actions";
import { getCompanyAccessState, getOnboardingData } from "@/lib/onboarding";
import { confirmOnboardingPayment, saveOnboardingCompany, saveOnboardingLocation, selectOnboardingPlan } from "@/lib/onboarding-actions";

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

async function blockedWrite() {
  "use server";
  throw new Error("Bitte schließen Sie die Einrichtung ab und bestätigen Sie die Zahlung, um diese Funktion zu nutzen.");
}

async function blockedSettingsWrite() {
  "use server";
  return { ok: false, message: "Bitte schließen Sie die Einrichtung ab und bestätigen Sie die Zahlung, um diese Funktion zu nutzen." };
}

export default async function CompanyDashboardPage({ params }: PageProps) {
  const { slug = [] } = await params;
  const path = `/dashboard${slug.length ? `/${slug.join("/")}` : ""}`;
  const route = routeByPath(path);

  if (!route || !path.startsWith("/dashboard")) {
    notFound();
  }

  const access = await getCompanyAccessState();
  const writeBlocked = !access.canWrite;

  if (path === "/dashboard/onboarding" && access.company?.onboarding_status === "completed") {
    redirect("/dashboard");
  }

  const overview = path === "/dashboard" ? await getDashboardOverview("inhaber") : null;
  const locations = path === "/dashboard/standorte" ? await getLocationsData() : null;
  const employees = path === "/dashboard/mitarbeiter" ? await getEmployeesData() : null;
  const clients = path === "/dashboard/klienten" ? await getClientsData() : null;
  const applicants = path === "/dashboard/bewerber" ? await getApplicantsData() : null;
  const websiteOnline = path === "/dashboard/website-online-praesenz" ? await getWebsiteOnlineData() : null;
  const qmMd = path === "/dashboard/qm-md" ? await getQmMdData() : null;
  const exports = path === "/dashboard/exporte" ? await getExportsData() : null;
  const activityLogs = path === "/dashboard/aktivitaeten" ? await getActivityLogsData() : null;
  const compliance = path === "/dashboard/compliance" ? await getComplianceData() : null;
  const payment = path === "/dashboard/zahlung-tarif" ? await getPaymentData() : null;
  const onboarding = path === "/dashboard/onboarding" ? await getOnboardingData() : null;
  const careDocs = path === "/dashboard/pflegedokumentation" ? await getCareDocumentationData() : null;
  const billing = path === "/dashboard/abrechnung" ? await getBillingData() : null;
  const documents = path === "/dashboard/dokumente" ? await getDocumentsData() : null;
  const communication = path === "/dashboard/kommunikation" ? await getCommunicationData() : null;
  const shifts = path === "/dashboard/dienstplanung" ? await getShiftsData() : null;
  const timeTracking = path === "/dashboard/zeiterfassung" ? await getTimeTrackingData() : null;
  const tours = path === "/dashboard/tourenplanung" ? await getToursData() : null;
  const rolesPermissions = path === "/dashboard/rollen-rechte" ? await getRolePermissionData() : null;
  const settings = path === "/dashboard/einstellungen" ? await getSettingsData() : null;

  return (
    <DashboardShell
      role="inhaber"
      title={route.title}
      routes={appRoutes.map(({ path, title }) => ({ path, title }))}
    >
      {writeBlocked && path !== "/dashboard/onboarding" ? (
        <div className={`dashboard-access-banner ${access.isOverdue ? "overdue" : ""}`}>
          <div>
            <strong>{access.isOverdue ? "Zahlung offen" : "Einrichtung noch nicht abgeschlossen"}</strong>
            <p>
              {access.isOverdue
                ? "Für Ihr Nutzerkonto liegt noch kein bestätigter Zahlungseingang vor. Bitte prüfen Sie die Überweisung oder kontaktieren Sie den Support."
                : "Bitte schließen Sie die Einrichtung ab und bestätigen Sie die Zahlung, um Nuria Pflege vollständig zu nutzen."}
            </p>
          </div>
          <a className="button" href="/dashboard/onboarding">Einrichtung fortsetzen</a>
        </div>
      ) : null}
      {overview ? <DashboardOverview data={overview} role="inhaber" /> : null}
      {locations ? <LocationsPage data={locations} /> : null}
      {careDocs ? <CareDocumentationPage data={careDocs} actions={writeBlocked ? { createCareDoc: blockedWrite, updateCareDoc: blockedWrite, reviewCareDoc: blockedWrite } : { createCareDoc, updateCareDoc, reviewCareDoc }} /> : null}
      {billing ? <BillingPage data={billing} actions={writeBlocked ? { createBillingItem: blockedWrite, updateBillingItem: blockedWrite, changeBillingItemStatus: blockedWrite, createInvoice: blockedWrite, updateInvoiceStatus: blockedWrite } : { createBillingItem, updateBillingItem, changeBillingItemStatus, createInvoice, updateInvoiceStatus }} /> : null}
      {documents ? <DocumentsPage data={documents} actions={writeBlocked ? { uploadDocument: blockedWrite, updateDocument: blockedWrite, archiveDocument: blockedWrite, deleteDocument: blockedWrite, getDocumentSignedUrl } : { uploadDocument, updateDocument, archiveDocument, deleteDocument, getDocumentSignedUrl }} /> : null}
      {communication ? <CommunicationPage data={communication} actions={writeBlocked ? { createDirectConversation: blockedWrite, createGroupConversation: blockedWrite, sendMessage: blockedWrite, markConversationRead, archiveConversation: blockedWrite, addParticipant: blockedWrite, removeParticipant: blockedWrite } : { createDirectConversation, createGroupConversation, sendMessage, markConversationRead, archiveConversation, addParticipant, removeParticipant }} /> : null}
      {applicants ? <ApplicantsPage data={applicants} actions={writeBlocked ? { createApplicant: blockedWrite, updateApplicant: blockedWrite, changeApplicantStatus: blockedWrite, changeApplicantRating: blockedWrite, setApplicantFollowUp: blockedWrite } : { createApplicant, updateApplicant, changeApplicantStatus, changeApplicantRating, setApplicantFollowUp }} /> : null}
      {websiteOnline ? <WebsiteOnlinePage data={websiteOnline} actions={writeBlocked ? { createWebsiteLead: blockedWrite, updateWebsiteLead: blockedWrite, changeWebsiteLeadStatus: blockedWrite, changeWebsiteLeadPriority: blockedWrite, setWebsiteLeadFollowUp: blockedWrite, createOnlineTask: blockedWrite, updateOnlineTask: blockedWrite, changeOnlineTaskStatus: blockedWrite, changeOnlineTaskPriority: blockedWrite } : { createWebsiteLead, updateWebsiteLead, changeWebsiteLeadStatus, changeWebsiteLeadPriority, setWebsiteLeadFollowUp, createOnlineTask, updateOnlineTask, changeOnlineTaskStatus, changeOnlineTaskPriority }} /> : null}
      {qmMd ? <QmMdPage data={qmMd} actions={writeBlocked ? { createQmItem: blockedWrite, updateQmItem: blockedWrite, changeQmItemStatus: blockedWrite, changeQmItemPriority: blockedWrite, setQmItemDueDate: blockedWrite, createQmMeasure: blockedWrite, updateQmMeasure: blockedWrite, changeQmMeasureStatus: blockedWrite, changeQmMeasurePriority: blockedWrite, createQmEvidence: blockedWrite } : { createQmItem, updateQmItem, changeQmItemStatus, changeQmItemPriority, setQmItemDueDate, createQmMeasure, updateQmMeasure, changeQmMeasureStatus, changeQmMeasurePriority, createQmEvidence }} /> : null}
      {exports ? <ExportsPage data={exports} actions={writeBlocked ? { createExportJob: blockedWrite, deleteExportJob: blockedWrite } : { createExportJob, deleteExportJob }} /> : null}
      {activityLogs ? <ActivityLogsPage data={activityLogs} /> : null}
      {compliance ? <CompliancePage data={compliance} actions={writeBlocked ? { createComplianceItem: blockedWrite, updateComplianceItem: blockedWrite, changeComplianceItemStatus: blockedWrite, changeComplianceItemPriority: blockedWrite, createComplianceEvidence: blockedWrite } : { createComplianceItem, updateComplianceItem, changeComplianceItemStatus, changeComplianceItemPriority, createComplianceEvidence }} /> : null}
      {payment ? <PaymentPage data={payment} actions={{ markPaymentSent, saveBillingData }} /> : null}
      {onboarding ? <OnboardingWizard data={onboarding} actions={{ saveCompany: saveOnboardingCompany, saveLocation: saveOnboardingLocation, selectPlan: selectOnboardingPlan, confirmPayment: confirmOnboardingPayment }} /> : null}
      {clients ? <ClientsPage data={clients} actions={writeBlocked ? { createClient: blockedWrite, updateClient: blockedWrite, changeClientStatus: blockedWrite } : { createClient, updateClient, changeClientStatus }} /> : null}
      {shifts ? <ShiftsPage data={shifts} actions={writeBlocked ? { createShift: blockedWrite, updateShift: blockedWrite, changeShiftStatus: blockedWrite } : { createShift, updateShift, changeShiftStatus }} /> : null}
      {timeTracking ? <TimeTrackingPage data={timeTracking} actions={writeBlocked ? { createTimeEntry: blockedWrite, updateTimeEntry: blockedWrite, reviewTimeEntry: blockedWrite } : { createTimeEntry, updateTimeEntry, reviewTimeEntry }} /> : null}
      {tours ? (
        <ToursPage
          data={tours}
          actions={writeBlocked ? { createTour: blockedWrite, updateTour: blockedWrite, changeTourStatus: blockedWrite, upsertTourStop: blockedWrite, deleteTourStop: blockedWrite, moveTourStop: blockedWrite } : { createTour, updateTour, changeTourStatus, upsertTourStop, deleteTourStop, moveTourStop }}
        />
      ) : null}
      {employees ? (
        <EmployeesPage
          data={employees}
          actions={writeBlocked ? { inviteEmployee: blockedWrite, createEmployee: blockedWrite, updateEmployee: blockedWrite, toggleEmployeeStatus: blockedWrite } : { inviteEmployee, createEmployee, updateEmployee, toggleEmployeeStatus }}
        />
      ) : null}
      {rolesPermissions ? <RolesPermissionsPage data={rolesPermissions} saveAction={writeBlocked ? blockedWrite : saveRolePermissions} /> : null}
      {settings ? <SettingsPage data={settings} saveAction={writeBlocked ? blockedSettingsWrite : saveSettings} /> : null}
      {!overview && !locations && !careDocs && !billing && !documents && !communication && !applicants && !websiteOnline && !qmMd && !exports && !activityLogs && !compliance && !payment && !onboarding && !clients && !shifts && !timeTracking && !tours && !employees && !rolesPermissions && !settings ? <DashboardPage route={route} context="company" /> : null}
    </DashboardShell>
  );
}
