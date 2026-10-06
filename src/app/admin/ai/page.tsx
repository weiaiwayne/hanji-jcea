import { getDb, getSetting, parseJson } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageTitle, Card, CardHeader, Badge } from "@/components/ui";
import AiAssetControls, { GenerateButton } from "./AiAssetControls";
import AiGlobalToggle from "./AiGlobalToggle";

import { api } from "@/lib/basePath";
export const dynamic = "force-dynamic";

const TYPES = [
  { type: "podcast", label: "Podcast", consentCol: "consent_podcast" },
  { type: "summary", label: "Summary", consentCol: "consent_summary" },
  { type: "visualization", label: "Visualizations", consentCol: "consent_viz" },
] as const;

const STATUS_CLS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  generating: "bg-accent-100 text-accent-700",
  generated: "bg-primary-100 text-primary-700",
  approved: "bg-teal-100 text-teal-700",
  rejected: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
};

interface SummaryContent {
  overview?: string;
  key_findings?: string[];
  methods?: string;
  implications?: string;
  limitations?: string;
  plain_language_abstract?: string;
}

export default async function AdminAiPage() {
  await requireUser("admin");
  const db = getDb();
  const enabled = getSetting("ai_features_enabled", "yes").toLowerCase() !== "no";

  const manuscripts = db
    .prepare(
      `SELECT id, number, title, status, consent_podcast, consent_summary, consent_viz
       FROM manuscripts
       WHERE status IN ('accepted','published')
         AND (consent_podcast = 1 OR consent_summary = 1 OR consent_viz = 1)
       ORDER BY updated_at DESC`
    )
    .all() as {
    id: number;
    number: string;
    title: string;
    status: string;
    consent_podcast: number;
    consent_summary: number;
    consent_viz: number;
  }[];

  const assets = db
    .prepare("SELECT * FROM ai_assets ORDER BY updated_at DESC")
    .all() as {
    id: number;
    manuscript_id: number;
    type: string;
    status: string;
    content: string | null;
    file_path: string | null;
    error: string | null;
  }[];

  const assetFor = (msId: number, type: string) =>
    assets.find((a) => a.manuscript_id === msId && a.type === type);

  return (
    <>
      <PageTitle
        title="AI Content Management"
        subtitle="Generate and approve author-consented AI companion content. Nothing appears publicly until approved here."
        actions={<AiGlobalToggle enabled={enabled} />}
      />

      {manuscripts.length === 0 && (
        <Card className="px-5 py-8 text-center text-sm text-gray-500">
          No accepted or published manuscripts with AI consent yet. Authors grant
          consent per submission in the Author Portal.
        </Card>
      )}

      <div className="space-y-6">
        {manuscripts.map((m) => (
          <Card key={m.id}>
            <CardHeader
              title={m.title}
              subtitle={`${m.number} · ${m.status}`}
            />
            <div className="divide-y divide-gray-100 px-5">
              {TYPES.map(({ type, label, consentCol }) => {
                const consented = (m as unknown as Record<string, number>)[consentCol] === 1;
                const asset = assetFor(m.id, type);
                const summary =
                  asset?.type === "summary" && asset.content
                    ? parseJson<SummaryContent>(asset.content, {})
                    : null;
                const script =
                  asset?.type === "podcast" && asset.content
                    ? parseJson<{ script?: string }>(asset.content, {}).script
                    : null;
                const vizItems =
                  asset?.type === "visualization" && asset.content
                    ? parseJson<{ title: string; description: string; svg: string }[]>(asset.content, [])
                    : null;
                return (
                  <div key={type} className="py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-900">{label}</span>
                        {!consented ? (
                          <Badge className="bg-gray-100 text-gray-500">No author consent</Badge>
                        ) : asset ? (
                          <Badge className={STATUS_CLS[asset.status] || ""}>{asset.status}</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600">Not generated</Badge>
                        )}
                      </p>
                      {consented && enabled && (
                        <div className="flex items-center gap-2">
                          {(!asset || ["failed", "rejected"].includes(asset.status)) && (
                            <GenerateButton manuscriptId={m.id} type={type} label={asset ? "Regenerate" : "Generate"} />
                          )}
                          {asset && ["generated", "approved"].includes(asset.status) && (
                            <AiAssetControls assetId={asset.id} status={asset.status} />
                          )}
                          {asset?.status === "generating" && (
                            <span className="text-xs text-accent-700">
                              Generating… refresh this page to check progress.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {asset?.status === "failed" && asset.error && (
                      <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-700">
                        {asset.error}
                      </p>
                    )}
                    {summary && (
                      <details className="mt-2 rounded-md bg-gray-50 p-3 text-sm">
                        <summary className="cursor-pointer font-medium text-primary-800">
                          Preview summary
                        </summary>
                        <dl className="mt-2 space-y-2 text-gray-700">
                          {summary.plain_language_abstract && (
                            <div><dt className="font-semibold">Plain-language abstract</dt><dd>{summary.plain_language_abstract}</dd></div>
                          )}
                          {summary.overview && (
                            <div><dt className="font-semibold">Overview</dt><dd>{summary.overview}</dd></div>
                          )}
                          {summary.key_findings && summary.key_findings.length > 0 && (
                            <div>
                              <dt className="font-semibold">Key findings</dt>
                              <dd><ul className="list-disc pl-5">{summary.key_findings.map((f, i) => <li key={i}>{f}</li>)}</ul></dd>
                            </div>
                          )}
                          {summary.methods && (
                            <div><dt className="font-semibold">Methods</dt><dd>{summary.methods}</dd></div>
                          )}
                          {summary.implications && (
                            <div><dt className="font-semibold">Implications</dt><dd>{summary.implications}</dd></div>
                          )}
                          {summary.limitations && (
                            <div><dt className="font-semibold">Limitations</dt><dd>{summary.limitations}</dd></div>
                          )}
                        </dl>
                      </details>
                    )}
                    {script && (
                      <details className="mt-2 rounded-md bg-gray-50 p-3 text-sm">
                        <summary className="cursor-pointer font-medium text-primary-800">
                          Preview podcast
                        </summary>
                        {asset?.file_path && (
                          <audio controls preload="none" className="mt-2 w-full" src={api(`/api/ai-assets/${asset.id}/audio`)} />
                        )}
                        <p className="mt-2 whitespace-pre-line text-gray-700">{script}</p>
                      </details>
                    )}
                    {vizItems && vizItems.length > 0 && (
                      <details className="mt-2 rounded-md bg-gray-50 p-3 text-sm">
                        <summary className="cursor-pointer font-medium text-primary-800">
                          Preview {vizItems.length} visualization{vizItems.length === 1 ? "" : "s"}
                        </summary>
                        <div className="mt-3 grid gap-4 md:grid-cols-2">
                          {vizItems.map((v, i) => (
                            <figure key={i} className="rounded border border-gray-200 bg-white p-3">
                              <div className="[&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: v.svg }} />
                              <figcaption className="mt-1 text-xs text-gray-600">
                                <strong>{v.title}.</strong> {v.description}
                              </figcaption>
                            </figure>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
