import CmsContent from "@/components/CmsContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Publication Ethics" };

export default function Page() {
  return <CmsContent slug="publication-ethics" fallbackTitle="Publication Ethics" />;
}
