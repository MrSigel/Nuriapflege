import { AuthPage } from "@/components/auth-page";
import { PublicJsonLd } from "@/components/public-json-ld";
import { createPublicMetadata } from "@/lib/public-seo";

export const metadata = createPublicMetadata("login");

type LoginPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  return (
    <>
      <PublicJsonLd page={params.tab === "register" ? "register" : "login"} />
      <AuthPage initialMode={params.tab === "register" ? "register" : "login"} />
    </>
  );
}
