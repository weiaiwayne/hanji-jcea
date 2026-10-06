import CmsContent from "@/components/CmsContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Conference" };

export default function Page() {
  return <CmsContent slug="conference" fallbackTitle="Conference" />;
}
