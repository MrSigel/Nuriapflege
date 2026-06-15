import { AuthPage } from "@/components/auth-page";

type LoginPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  return <AuthPage initialMode={params.tab === "register" ? "register" : "login"} />;
}
