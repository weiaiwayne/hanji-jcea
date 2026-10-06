import CmsContent from "@/components/CmsContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Editorial Process" };

export default function Page() {
  return <CmsContent slug="editorial-process" fallbackTitle="Editorial Process" />;
}
