import { getSupabaseServerClient } from "@/lib/supabase-server";

export type CareCategory = "pflegebericht" | "uebergabe" | "beobachtung" | "massnahme" | "vitalwerte" | "wunde" | "medikation" | "ereignis" | "sonstiges";
export type CareStatus = "draft" | "submitted" | "reviewed" | "archived";
export type CareVisibility = "internal" | "care_team" | "management";
export type CareOption = { id: string; name: string };
export type CareDoc = { id:string; company_id:string; client_id:string; employee_id:string|null; shift_id:string|null; tour_id:string|null; tour_stop_id:string|null; documentation_date:string; documentation_time:string|null; category:CareCategory; title:string; content:string; status:CareStatus; visibility:CareVisibility; created_by:string|null; updated_by:string|null; reviewed_by:string|null; reviewed_at:string|null; updated_at:string; client_name:string|null; employee_name:string|null; shift_name:string|null; tour_name:string|null; tour_stop_name:string|null; created_by_name:string|null; reviewed_by_name:string|null };
export type CareData = { docs: CareDoc[]; clients: CareOption[]; employees: CareOption[]; shifts: CareOption[]; tours: CareOption[]; tourStops: CareOption[]; today:string; stats:{ today:number; week:number; drafts:number; submitted:number; reviewed:number; archived:number; handovers:number; withoutClient:number } };
function cid(){return process.env.NURIA_DEV_COMPANY_ID ?? null}
function key(d:Date){return d.toISOString().slice(0,10)}
function week(d:Date){const day=d.getDay()||7; const s=new Date(d); s.setDate(d.getDate()-day+1); const e=new Date(s); e.setDate(s.getDate()+6); return {s:key(s),e:key(e)}}
export async function getCareDocumentationData(): Promise<CareData> {
  const supabase=getSupabaseServerClient(); const companyId=cid(); const now=new Date(); const today=key(now); const w=week(now); const empty={today:0,week:0,drafts:0,submitted:0,reviewed:0,archived:0,handovers:0,withoutClient:0};
  if(!supabase||!companyId) return {docs:[],clients:[],employees:[],shifts:[],tours:[],tourStops:[],today,stats:empty};
  const [{data:docs},{data:clients},{data:employees},{data:shifts},{data:tours},{data:stops}]=await Promise.all([
    supabase.from("care_documentation").select("*").eq("company_id",companyId).order("documentation_date",{ascending:false}).order("documentation_time",{ascending:false}),
    supabase.from("clients").select("id, first_name, last_name").eq("company_id",companyId).order("last_name"),
    supabase.from("profiles").select("id, first_name, last_name").eq("company_id",companyId).neq("role","admin").order("last_name"),
    supabase.from("shifts").select("id, title").eq("company_id",companyId).order("date",{ascending:false}),
    supabase.from("tours").select("id, title").eq("company_id",companyId).order("tour_date",{ascending:false}),
    supabase.from("tour_stops").select("id, client_id").eq("company_id",companyId),
  ]);
  const clientOpt=(clients??[]).map(x=>({id:x.id,name:[x.first_name,x.last_name].filter(Boolean).join(" ")||"Ohne Namen"}));
  const employeeOpt=(employees??[]).map(x=>({id:x.id,name:[x.first_name,x.last_name].filter(Boolean).join(" ")||"Ohne Namen"}));
  const shiftOpt=(shifts??[]).map(x=>({id:x.id,name:x.title}));
  const tourOpt=(tours??[]).map(x=>({id:x.id,name:x.title}));
  const cm=new Map(clientOpt.map(x=>[x.id,x.name])); const em=new Map(employeeOpt.map(x=>[x.id,x.name])); const sm=new Map(shiftOpt.map(x=>[x.id,x.name])); const tm=new Map(tourOpt.map(x=>[x.id,x.name]));
  const stopOpt=(stops??[]).map(x=>({id:x.id,name:cm.get(x.client_id??"")??"Tourstopp"})); const stopm=new Map(stopOpt.map(x=>[x.id,x.name]));
  const normalized=((docs??[]) as Omit<CareDoc,"client_name"|"employee_name"|"shift_name"|"tour_name"|"tour_stop_name"|"created_by_name"|"reviewed_by_name">[]).map(d=>({...d,client_name:cm.get(d.client_id)??null,employee_name:d.employee_id?em.get(d.employee_id)??null:null,shift_name:d.shift_id?sm.get(d.shift_id)??null:null,tour_name:d.tour_id?tm.get(d.tour_id)??null:null,tour_stop_name:d.tour_stop_id?stopm.get(d.tour_stop_id)??null:null,created_by_name:d.created_by?em.get(d.created_by)??null:null,reviewed_by_name:d.reviewed_by?em.get(d.reviewed_by)??null:null}));
  return {docs:normalized,clients:clientOpt,employees:employeeOpt,shifts:shiftOpt,tours:tourOpt,tourStops:stopOpt,today,stats:{today:normalized.filter(d=>d.documentation_date===today).length,week:normalized.filter(d=>d.documentation_date>=w.s&&d.documentation_date<=w.e).length,drafts:normalized.filter(d=>d.status==="draft").length,submitted:normalized.filter(d=>d.status==="submitted").length,reviewed:normalized.filter(d=>d.status==="reviewed").length,archived:normalized.filter(d=>d.status==="archived").length,handovers:normalized.filter(d=>d.category==="uebergabe").length,withoutClient:normalized.filter(d=>!d.client_id).length}};
}
