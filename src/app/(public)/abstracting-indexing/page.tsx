import CmsContent from "@/components/CmsContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Abstracting & Indexing" };

export default function Page() {
  return <CmsContent slug="abstracting-indexing" fallbackTitle="Abstracting & Indexing" />;
}
