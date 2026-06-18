import { PublicJsonLd } from "@/components/public-json-ld";
import { PublicSite } from "@/components/public-site";
import { createPublicMetadata } from "@/lib/public-seo";

export const metadata = createPublicMetadata("home");

export default function Home() {
  return (
    <>
      <PublicJsonLd page="home" />
      <PublicSite />
    </>
  );
}
