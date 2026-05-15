import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { clsx, type ClassValue } from "clsx";

import type { CampaignResults, ClientFormValues } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatDateTime(date: string) {
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function parsePillarsInput(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export function buildPillarsInput(pillars: string[]) {
  return pillars.join("\n");
}

export function toClientPayload(values: ClientFormValues) {
  return {
    ...values,
    content_pillars: parsePillarsInput(values.content_pillars)
  };
}

export function getCopyForExport(results: CampaignResults) {
  return Object.values(results)
    .filter(Boolean)
    .join("\n\n---\n\n");
}

export function inferPaidMediaIntent(request: string) {
  const normalized = request.toLowerCase();

  return [
    "ads",
    "ad",
    "tráfego",
    "trafego",
    "meta",
    "google",
    "conversão",
    "conversao",
    "campanha",
    "paid",
    "anúncio",
    "anuncio"
  ].some((keyword) => normalized.includes(keyword));
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
