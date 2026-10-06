import CmsContent from "@/components/CmsContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Best Paper Award" };

export default function Page() {
  return <CmsContent slug="best-paper" fallbackTitle="Best Paper Award" />;
}
