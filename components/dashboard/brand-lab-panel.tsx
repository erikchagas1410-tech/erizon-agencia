"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useRef, useState } from "react";
import { ImagePlus, SendHorizontal, Sparkles, X } from "lucide-react";

import type { BrandChatAttachment, BrandChatMessage, ClientProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Diagnostico completo com foco em posicionamento premium.",
  "Analise este logo e diga o que transmite e como evoluir.",
  "Rebranding moderno, tecnologico e sofisticado.",
  "Manifesto, tom de voz e narrativa da marca.",
  "Direcao criativa mais memoravel."
];

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 4_000_000;

function createMessage(
  role: "user" | "assistant",
  content: string,
  attachments: BrandChatAttachment[] = []
): BrandChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    attachments,
    createdAt: new Date().toISOString()
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Falha"));
    reader.onerror = () => reject(new Error("Falha ao ler imagem."));
    reader.readAsDataURL(file);
  });
}

export function BrandLabPanel({ client }: { client: ClientProfile }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<BrandChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<BrandChatAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const canSend = draft.trim().length > 0 || attachments.length > 0;

  const historyForApi = useMemo(
    () =>
      messages.slice(-8).map((message) => ({
        role: message.role,
        content: message.content,
        attachments: message.attachments
      })),
    [messages]
  );

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList?.length) {
      return;
    }

    const slots = MAX_ATTACHMENTS - attachments.length;

    if (slots <= 0) {
      setFeedback(`Max. ${MAX_ATTACHMENTS} imagens.`);
      return;
    }

    const files = Array.from(fileList).slice(0, slots);
    const next: BrandChatAttachment[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setFeedback(`${file.name} nao e uma imagem.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setFeedback(`${file.name} ultrapassa 4 MB.`);
        continue;
      }

      const dataUrl = await readFileAsDataUrl(file).catch(() => null);

      if (dataUrl) {
        next.push({
          name: file.name,
          mimeType: file.type,
          dataUrl,
          size: file.size
        });
      }
    }

    setAttachments((current) => [...current, ...next]);

    if (next.length) {
      setFeedback(null);
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleSend() {
    if (!canSend || isSending) {
      return;
    }

    const content =
      draft.trim() || "Analise as imagens e me ajude a fortalecer a marca.";
    const outgoingAttachments = attachments;
    const userMessage = createMessage("user", content, outgoingAttachments);

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setAttachments([]);
    setIsSending(true);
    setFeedback(null);

    window.setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      50
    );

    try {
      const response = await fetch("/api/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          message: content,
          attachments: outgoingAttachments,
          history: historyForApi
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Falha no Brand Lab.");
      }

      setMessages((current) => [
        ...current,
        createMessage("assistant", payload.message)
      ]);

      window.setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        50
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Erro inesperado.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <p className="label">Brand Lab · {client.name}</p>
          <h2 className="mt-0.5 font-heading text-lg font-semibold">
            Chat estrategico
          </h2>
        </div>
        <div className="text-xs text-white/30">JPG, PNG, WEBP, SVG ate 4 MB</div>
      </div>

      <div className="grid xl:grid-cols-[220px,1fr]" style={{ minHeight: 520 }}>
        <aside className="hidden border-r border-white/[0.05] p-4 xl:block">
          <p className="label mb-3">Sugestoes</p>
          <div className="space-y-1.5">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setDraft(suggestion)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 text-left text-xs text-white/58 transition hover:border-white/10 hover:text-white/80"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="divider my-4" />

          <p className="label mb-3">Contexto ativo</p>
          <div className="space-y-2 text-xs text-white/50">
            <div>
              <span className="text-white/30">Tom:</span> {client.voice_tone}
            </div>
            <div>
              <span className="text-white/30">Personalidade:</span> {client.personality}
            </div>
            <div>
              <span className="text-white/30">Estetica:</span> {client.visual_aesthetic}
            </div>
          </div>
        </aside>

        <div className="flex flex-col">
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4" style={{ maxHeight: 480 }}>
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
                <Sparkles className="h-6 w-6 text-white/16" />
                <p className="text-sm text-white/32">
                  Envie uma mensagem ou imagem para comecar.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "rounded-xl border px-4 py-3",
                    message.role === "assistant"
                      ? "border-white/[0.06] bg-white/[0.03]"
                      : "border-violet-500/20 bg-violet-500/[0.07]"
                  )}
                >
                  <p className="label mb-2 text-[10px]">
                    {message.role === "assistant" ? "Brand Lab" : "Voce"}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-white/80">
                    {message.content}
                  </p>
                  {message.attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.attachments.map((attachment) => (
                        <img
                          key={`${message.id}-${attachment.name}`}
                          src={attachment.dataUrl}
                          alt={attachment.name}
                          className="h-16 w-16 rounded-xl border border-white/10 object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}

            {isSending && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <p className="label mb-2 text-[10px]">Brand Lab</p>
                <div className="space-y-2">
                  <div className="h-2.5 w-32 animate-pulse rounded-full bg-white/10" />
                  <div className="h-2.5 w-full animate-pulse rounded-full bg-white/8" />
                  <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-white/8" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="space-y-3 border-t border-white/[0.06] p-4">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment, index) => (
                  <div key={`${attachment.name}-${index}`} className="relative">
                    <img
                      src={attachment.dataUrl}
                      alt={attachment.name}
                      className="h-14 w-14 rounded-xl border border-white/10 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments((current) =>
                          current.filter((_, currentIndex) => currentIndex !== index)
                        )
                      }
                      className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-white/10 bg-black/80 text-white/70"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {feedback && <p className="text-xs text-white/50">{feedback}</p>}

            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                multiple
                className="hidden"
                onChange={(event) => handleFilesSelected(event.target.files)}
              />

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isSending || attachments.length >= MAX_ATTACHMENTS}
                className="btn-ghost shrink-0 px-3 py-2 text-xs disabled:opacity-30"
                title="Adicionar imagem"
              >
                <ImagePlus className="h-4 w-4" />
              </button>

              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={2}
                placeholder="Mensagem para o Brand Lab…"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                className="input-shell flex-1 resize-none px-3.5 py-2.5 text-sm"
              />

              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend || isSending}
                className="btn-primary shrink-0 px-3.5 py-2 disabled:opacity-40"
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
