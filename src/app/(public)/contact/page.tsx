import CmsContent from "@/components/CmsContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contact" };

export default function Page() {
  return <CmsContent slug="contact" fallbackTitle="Contact" />;
}
