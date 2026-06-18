import { PublicJsonLd } from "@/components/public-json-ld";
import { PublicSite } from "@/components/public-site";
import { createPublicMetadata } from "@/lib/public-seo";

export const metadata = createPublicMetadata("cookies");

export default function CookiesPage() {
  return (
    <>
      <PublicJsonLd page="cookies" />
      <PublicSite page="cookies" />
    </>
  );
}
