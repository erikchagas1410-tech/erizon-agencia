import Link from "next/link";
import { getCreativeAsset } from "@/lib/creative/library";

export const dynamic = "force-dynamic";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(dateString));
}

export default async function CreativeLibraryItemPage({ params }: { params: { id: string } }) {
  const asset = await getCreativeAsset(params.id);

  return (
    <div className="space-y-8 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Visualizar criativo</h1>
          <p className="mt-2 text-sm text-slate-400">Detalhes do criativo e histórico de QA.</p>
        </div>
        <Link
          href="/creative-library"
          className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
        >
          Voltar para biblioteca
        </Link>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6 rounded-[32px] border border-white/10 bg-slate-950/80 p-6">
          {asset.imageUrl ? (
            <img
              src={asset.imageUrl}
              alt={asset.title || asset.template}
              className="w-full rounded-3xl object-cover"
            />
          ) : (
            <div className="flex h-80 items-center justify-center rounded-3xl bg-slate-900 text-slate-500">Sem preview disponível</div>
          )}

          <div className="space-y-4 px-1">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-slate-200">{asset.status}</span>
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-slate-200">{asset.template}</span>
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-slate-200">{asset.format}</span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">{asset.title || asset.creativeJson.headline}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {asset.briefing || asset.creativeJson.subheadline || "Sem descrição adicional."}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-900 p-4 text-sm text-slate-300">
                <p className="text-slate-400">Cliente</p>
                <p>{asset.clientId || "Não informado"}</p>
              </div>
              <div className="rounded-3xl bg-slate-900 p-4 text-sm text-slate-300">
                <p className="text-slate-400">Última atualização</p>
                <p>{formatDate(asset.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6">
            <h3 className="text-lg font-semibold text-white">Resumo de QA</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <p>Status: <strong>{asset.qaStatus ?? "não avaliado"}</strong></p>
              <p>Pontuação: <strong>{asset.qaScore ?? "—"}</strong></p>
              {asset.qaResult?.approved !== undefined ? (
                <p>Aprovado: <strong>{asset.qaResult.approved ? "Sim" : "Não"}</strong></p>
              ) : null}
              <p>Feedback: <strong>{asset.approvalNotes ?? asset.rejectionNotes ?? "Nenhum"}</strong></p>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6">
            <h3 className="text-lg font-semibold text-white">Dados do criativo</h3>
            <div className="mt-4 space-y-4 text-sm text-slate-300">
              <div>
                <p className="text-slate-400">Headline</p>
                <p>{asset.creativeJson.headline}</p>
              </div>
              {asset.creativeJson.subheadline ? (
                <div>
                  <p className="text-slate-400">Subheadline</p>
                  <p>{asset.creativeJson.subheadline}</p>
                </div>
              ) : null}
              {asset.creativeJson.cta ? (
                <div>
                  <p className="text-slate-400">CTA</p>
                  <p>{asset.creativeJson.cta}</p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6">
            <h3 className="text-lg font-semibold text-white">Visual & Marca</h3>
            <div className="mt-4 grid gap-3 text-sm text-slate-300">
              <p>Template: <strong>{asset.creativeJson.template}</strong></p>
              <p>Background: <strong>{asset.creativeJson.visual.backgroundStyle}</strong></p>
              <p>Mood: <strong>{asset.creativeJson.visual.mood}</strong></p>
              <p>Densidade: <strong>{asset.creativeJson.visual.density}</strong></p>
              <p>Cor primária: <strong>{asset.creativeJson.brand.colors.primary}</strong></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
