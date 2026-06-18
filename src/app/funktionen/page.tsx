import { PublicJsonLd } from "@/components/public-json-ld";
import { PublicSite } from "@/components/public-site";
import { createPublicMetadata } from "@/lib/public-seo";

export const metadata = createPublicMetadata("features");

export default function FeaturesPage() {
  return (
    <>
      <PublicJsonLd page="features" />
      <PublicSite page="features" />
    </>
  );
}
