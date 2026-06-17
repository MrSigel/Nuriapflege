import { notFound } from "next/navigation";
import { acceptEmployeeInvitation } from "@/lib/invite-accept-actions";
import { hashInviteToken } from "@/lib/invitations";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EmployeeInvitationPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { error } = await searchParams;
  const supabase = getSupabaseServerClient();

  if (!supabase || !token) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,first_name,last_name,email,invitation_expires_at")
    .eq("invitation_token_hash", hashInviteToken(token))
    .eq("invitation_status", "invited")
    .maybeSingle();

  if (!profile?.id || (profile.invitation_expires_at && new Date(profile.invitation_expires_at).getTime() < Date.now())) {
    notFound();
  }

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email;

  return (
    <main className="invite-page">
      <form className="invite-card" action={acceptEmployeeInvitation}>
        <input type="hidden" name="token" value={token} />
        <div>
          <span>Mitarbeiter-Einladung</span>
          <h1>Passwort festlegen</h1>
          <p>{name}</p>
        </div>
        {error ? <p className="form-status error">Einladung konnte nicht angenommen werden. Bitte prüfen Sie Ihre Eingabe.</p> : null}
        <label>
          Passwort
          <input name="password" type="password" required minLength={8} autoComplete="new-password" />
        </label>
        <label>
          Passwort wiederholen
          <input name="password_repeat" type="password" required minLength={8} autoComplete="new-password" />
        </label>
        <button type="submit">Einladung annehmen</button>
      </form>
    </main>
  );
}
