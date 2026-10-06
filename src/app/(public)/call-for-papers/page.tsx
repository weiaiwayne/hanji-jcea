import CmsContent from "@/components/CmsContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Call for Papers" };

export default function Page() {
  return <CmsContent slug="call-for-papers" fallbackTitle="Call for Papers" />;
}
