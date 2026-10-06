import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Breadcrumbs } from "@/components/ui";
import { notFound } from "next/navigation";
import PageEditor from "./PageEditor";

export const dynamic = "force-dynamic";

export default async function EditCmsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser("admin");
  const { id } = await params;

  const isNew = id === "new";
  const page = isNew
    ? { id: 0, slug: "", title: "", html: "" }
    : (getDb().prepare("SELECT * FROM cms_pages WHERE id = ?").get(Number(id)) as
        | { id: number; slug: string; title: string; html: string }
        | undefined);
  if (!page) notFound();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Pages", href: "/admin/pages" },
          { label: isNew ? "New page" : page.title },
        ]}
      />
      <PageEditor page={page} isNew={isNew} />
    </>
  );
}
