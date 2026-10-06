import CmsContent from "@/components/CmsContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "About the Journal" };

export default function Page() {
  return <CmsContent slug="about-journal" fallbackTitle="About the Journal" />;
}
