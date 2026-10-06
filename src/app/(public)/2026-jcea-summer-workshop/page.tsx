import CmsContent from "@/components/CmsContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "2026 JCEA Summer Workshop" };

export default function Page() {
  return <CmsContent slug="2026-jcea-summer-workshop" fallbackTitle="2026 JCEA Summer Workshop" />;
}
