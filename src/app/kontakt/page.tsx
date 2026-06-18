import { PublicJsonLd } from "@/components/public-json-ld";
import { PublicSite } from "@/components/public-site";
import { createPublicMetadata } from "@/lib/public-seo";

export const metadata = createPublicMetadata("contact");

export default function ContactPage() {
  return (
    <>
      <PublicJsonLd page="contact" />
      <PublicSite page="contact" />
    </>
  );
}
