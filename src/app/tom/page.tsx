import { PublicJsonLd } from "@/components/public-json-ld";
import { PublicSite } from "@/components/public-site";
import { createPublicMetadata } from "@/lib/public-seo";

export const metadata = createPublicMetadata("tom");

export default function TechnicalMeasuresPage() {
  return (
    <>
      <PublicJsonLd page="tom" />
      <PublicSite page="tom" />
    </>
  );
}
