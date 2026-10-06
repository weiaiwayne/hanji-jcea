import CmsContent from "@/components/CmsContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Submission Guidelines" };

export default function Page() {
  return <CmsContent slug="submission" fallbackTitle="Submission Guidelines" />;
}
