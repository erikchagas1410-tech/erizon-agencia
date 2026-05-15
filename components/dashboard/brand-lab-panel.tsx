"use client";

import { useMemo, useRef, useState } from "react";
import {
  ImagePlus,
  MessageSquareText,
  SendHorizontal,
  Sparkles,
  Trash2
} from "lucide-react";

import type {
  BrandChatAttachment,
  BrandChatMessage,
  ClientProfile
} from "@/lib/types";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Faça um diagnóstico completo da marca com foco em posicionamento premium.",
  "Analise este logo e me diga o que transmite, o que enfraquece e como evoluir.",
  "Crie um rebranding moderno, tecnológico e sofisticado para esta marca.",
  "Me ajude a construir manifesto, tom de voz e narrativa da marca.",
  "Avalie a identidade visual e proponha uma direção criativa mais memorável."
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

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Não foi possível ler esta imagem."));
    };

    reader.onerror = () => reject(new Error("Falha ao ler a imagem."));
    reader.readAsDataURL(file);
  });
}

export function BrandLabPanel({ client }: { client: ClientProfile }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [messages, setMessages] = useState<BrandChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<BrandChatAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const canSend = draft.trim().length > 0 || attachments.length > 0;
  const historyForApi = useMemo(() => {
    return messages.slice(-8).map((message) => ({
      role: message.role,
      content: message.content,
      attachments: message.attachments
    }));
  }, [messages]);

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList?.length) {
      return;
    }

    const remainingSlots = MAX_ATTACHMENTS - attachments.length;

    if (remainingSlots <= 0) {
      setFeedback(`Você pode enviar até ${MAX_ATTACHMENTS} imagens por mensagem.`);
      return;
    }

    const files = Array.from(fileList).slice(0, remainingSlots);

    try {
      const nextAttachments: BrandChatAttachment[] = [];

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          setFeedback(`O arquivo ${file.name} não é uma imagem válida.`);
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          setFeedback(`A imagem ${file.name} ultrapassa 4MB.`);
          continue;
        }

        const dataUrl = await readFileAsDataUrl(file);

        nextAttachments.push({
          name: file.name,
          mimeType: file.type,
          dataUrl,
          size: file.size
        });
      }

      setAttachments((current) => [...current, ...nextAttachments]);
      if (nextAttachments.length > 0) {
        setFeedback(null);
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Falha ao carregar imagem.");
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function removeAttachment(indexToRemove: number) {
    setAttachments((current) => current.filter((_, index) => index !== indexToRemove));
  }

  async function handleSend() {
    if (!canSend || isSending) {
      return;
    }

    const outgoingContent =
      draft.trim() ||
      "Analise as imagens enviadas e me diga como fortalecer a marca.";

    const outgoingAttachments = attachments;
    const userMessage = createMessage("user", outgoingContent, outgoingAttachments);

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setAttachments([]);
    setIsSending(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/branding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          clientId: client.id,
          message: outgoingContent,
          attachments: outgoingAttachments,
          history: historyForApi
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Falha ao consultar o Brand Lab.");
      }

      const assistantMessage = createMessage("assistant", payload.message);
      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Erro inesperado no chat.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="glass-panel rounded-[2rem] p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="section-kicker">
            <MessageSquareText className="h-3.5 w-3.5" />
            Brand Lab
          </span>
          <h2 className="mt-3 font-heading text-2xl font-semibold">
            Chat estratégico com análise visual
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-white/56">
            Converse com um agente mestre de branding e envie logo, referências,
            concorrentes ou identidades para uma leitura mais profunda da marca.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/54">
          {client.name}
          <div className="mt-1 text-[11px] text-white/34">
            JPG, PNG, WEBP ou SVG até 4MB
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/38">
              Sugestões para começar
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setDraft(suggestion)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-white/72 transition hover:bg-white/10"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/38">
              Contexto usado pelo agente
            </div>
            <div className="space-y-2 text-sm text-white/72">
              <div>
                <strong className="text-white">Tom de voz:</strong> {client.voice_tone}
              </div>
              <div>
                <strong className="text-white">Personalidade:</strong> {client.personality}
              </div>
              <div>
                <strong className="text-white">Objetivo:</strong> {client.main_objective}
              </div>
              <div>
                <strong className="text-white">Estética:</strong> {client.visual_aesthetic}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="max-h-[680px] overflow-y-auto rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
            {messages.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="rounded-full border border-dashed border-white/10 p-4">
                  <Sparkles className="h-6 w-6 text-white/24" />
                </div>
                <h3 className="font-heading text-xl font-semibold">
                  Abra uma conversa estratégica
                </h3>
                <p className="max-w-lg text-sm text-white/48">
                  Envie contexto, dúvidas de posicionamento e imagens de logo ou
                  referências para receber uma análise mais afiada.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={cn(
                      "rounded-[1.5rem] border p-4",
                      message.role === "assistant"
                        ? "border-white/10 bg-white/[0.04]"
                        : "border-violet-400/25 bg-violet-500/10"
                    )}
                  >
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/38">
                      {message.role === "assistant" ? "Brand Lab" : "Você"}
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-7 text-white/84">
                      {message.content}
                    </div>

                    {message.attachments.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {message.attachments.map((attachment) => (
                          <div
                            key={`${message.id}-${attachment.name}`}
                            className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={attachment.dataUrl}
                              alt={attachment.name}
                              className="h-24 w-24 object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}

                {isSending ? (
                  <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/38">
                      Brand Lab
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-40 animate-pulse rounded-full bg-white/10" />
                      <div className="h-4 w-full animate-pulse rounded-full bg-white/8" />
                      <div className="h-4 w-4/5 animate-pulse rounded-full bg-white/8" />
                    </div>
                  </article>
                ) : null}
              </div>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={5}
              placeholder="Ex.: analise este logo e me diga como transformá-lo em uma marca mais premium, tecnológica e memorável."
              className="input-shell resize-none px-4 py-4 text-sm"
            />

            {attachments.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {attachments.map((attachment, index) => (
                  <div
                    key={`${attachment.name}-${index}`}
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={attachment.dataUrl}
                      alt={attachment.name}
                      className="h-24 w-24 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="absolute right-2 top-2 rounded-full border border-white/10 bg-black/65 p-1 text-white/80 transition hover:bg-black"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {feedback ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/78">
                {feedback}
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-3">
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
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ImagePlus className="h-4 w-4" />
                  Adicionar imagens
                </button>

                <div className="self-center text-xs text-white/36">
                  Até {MAX_ATTACHMENTS} anexos por mensagem
                </div>
              </div>

              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend || isSending}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <SendHorizontal className="h-4 w-4" />
                {isSending ? "Enviando..." : "Enviar para o Brand Lab"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
