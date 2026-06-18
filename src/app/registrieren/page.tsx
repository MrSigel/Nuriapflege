import { AuthPage } from "@/components/auth-page";
import { PublicJsonLd } from "@/components/public-json-ld";
import { createPublicMetadata } from "@/lib/public-seo";

export const metadata = createPublicMetadata("register");

export default function RegisterRedirectPage() {
  return (
    <>
      <PublicJsonLd page="register" />
      <AuthPage initialMode="register" />
    </>
  );
}
