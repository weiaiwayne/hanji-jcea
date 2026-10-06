import CmsContent from "@/components/CmsContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Author Fees and Business Model" };

export default function Page() {
  return <CmsContent slug="author-fees" fallbackTitle="Author Fees and Business Model" />;
}
