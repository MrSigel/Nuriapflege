import { PublicJsonLd } from "@/components/public-json-ld";
import { PublicSite } from "@/components/public-site";
import { createPublicMetadata } from "@/lib/public-seo";

export const metadata = createPublicMetadata("withdrawal");

export default function WithdrawalPage() {
  return (
    <>
      <PublicJsonLd page="withdrawal" />
      <PublicSite page="withdrawal" />
    </>
  );
}
