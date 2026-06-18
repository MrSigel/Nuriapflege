import { redirect } from "next/navigation";
import { loginNuriaAdmin } from "@/lib/nuria-admin-login-actions";
import { hasValidNuriaAdminSession } from "@/lib/nuria-admin-auth";
import { privateRobotsMetadata } from "@/lib/public-seo";

export const metadata = privateRobotsMetadata;

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NuriaAdminLoginPage({ searchParams }: PageProps) {
  if (await hasValidNuriaAdminSession()) {
    redirect("/nuria-admin");
  }

  const { error } = await searchParams;

  return (
    <main className="nuria-admin-login-page">
      <form className="nuria-admin-login-card" action={loginNuriaAdmin}>
        <div>
          <span>Interner Zugriff</span>
          <h1>Nuria Admin</h1>
        </div>
        {error ? <p>Login fehlgeschlagen. Bitte prüfen Sie Ihre Zugangsdaten.</p> : null}
        <label>
          E-Mail
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          Passwort
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button type="submit">Einloggen</button>
      </form>
    </main>
  );
}
