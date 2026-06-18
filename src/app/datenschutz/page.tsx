import { PublicJsonLd } from "@/components/public-json-ld";
import { PublicSite } from "@/components/public-site";
import { createPublicMetadata } from "@/lib/public-seo";

export const metadata = createPublicMetadata("privacy");

export default function PrivacyPage() {
  return (
    <>
      <PublicJsonLd page="privacy" />
      <PublicSite page="privacy" />
    </>
  );
}
