import Link from "next/link";
import { listCreativeAssets } from "@/lib/creative/library";

export const dynamic = "force-dynamic";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(dateString));
}

export default async function CreativeLibraryPage() {
  const assets = await listCreativeAssets();

  return (
    <div className="space-y-8 py-8">
      <header className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Creative Library</h1>
            <p className="max-w-2xl text-sm text-slate-300">
              Aqui você pode revisar criativos salvos, ver decisões de QA e reutilizar ativos aprovados.
            </p>
          </div>
          <Link
            href="/creative-engine"
            className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Voltar ao Creative Engine
          </Link>
        </div>
      </header>

      {assets.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/60 p-8 text-center text-slate-300">
          <p className="text-lg font-medium text-white">Nenhum criativo encontrado ainda.</p>
          <p className="mt-2 text-sm text-slate-400">Gere um criativo e marque como salvo para aparecer aqui.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {assets.map((asset) => (
            <Link
              key={asset.id}
              href={`/creative-library/${asset.id}`}
              className="group block overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/80 p-4 transition hover:-translate-y-0.5 hover:border-white/20"
            >
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
                {asset.imageUrl ? (
                  <img
                    src={asset.imageUrl}
                    alt={asset.title || asset.template}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-slate-900 text-sm text-slate-500">Sem preview disponível</div>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                  <span className="rounded-full bg-slate-800 px-2.5 py-1 text-slate-200">{asset.status}</span>
                  <span className="rounded-full bg-slate-800 px-2.5 py-1 text-slate-200">{asset.template}</span>
                  <span className="rounded-full bg-slate-800 px-2.5 py-1 text-slate-200">{asset.format}</span>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-white">{asset.title || asset.creativeJson.headline}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{asset.briefing || asset.creativeJson.subheadline || "Sem briefing"}</p>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-slate-300">
                  <span>Cliente: {asset.clientId || "—"}</span>
                  <span>QA: {asset.qaStatus ?? "não avaliado"}</span>
                  {asset.qaScore !== undefined ? <span>Pontuação: {asset.qaScore}</span> : null}
                  <span>Criado: {formatDate(asset.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
