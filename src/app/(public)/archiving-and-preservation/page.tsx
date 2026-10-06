import CmsContent from "@/components/CmsContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Archiving and Digital Preservation" };

export default function Page() {
  return <CmsContent slug="archiving-and-preservation" fallbackTitle="Archiving and Digital Preservation" />;
}
