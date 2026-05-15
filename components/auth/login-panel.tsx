"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Mail, Sparkles } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";

export function LoginPanel() {
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") || "/";
  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectedFrom)}`;
  }, [redirectedFrom]);

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState<"google" | "magic" | null>(null);
  const [feedback, setFeedback] = useState<string | null>(() => {
    if (searchParams.get("error") === "auth_callback") {
      return "Não foi possível concluir a autenticação. Tente novamente.";
    }

    return null;
  });

  async function handleGoogleLogin() {
    setIsLoading("google");
    setFeedback(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl
      }
    });

    if (error) {
      setFeedback(error.message);
      setIsLoading(null);
    }
  }

  async function handleMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setFeedback("Digite um e-mail válido para receber o link.");
      return;
    }

    setIsLoading("magic");
    setFeedback(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: callbackUrl
      }
    });

    if (error) {
      setFeedback(error.message);
    } else {
      setFeedback("Magic link enviado. Confira sua caixa de entrada.");
    }

    setIsLoading(null);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.28),transparent_55%)]" />
      <div className="grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr,0.95fr]">
        <section className="space-y-6">
          <span className="section-kicker">
            <Sparkles className="h-3.5 w-3.5" />
            AI Agency OS
          </span>

          <div className="space-y-4">
            <h1 className="max-w-3xl font-heading text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Briefing zerado. A sua operação criativa entra em cena com contexto total.
            </h1>
            <p className="max-w-2xl text-base text-white/70 sm:text-lg">
              Cadastre a identidade completa de cada cliente uma única vez e deixe a
              squad de IA produzir estratégia, copy, visual, mídia e métricas em
              paralelo.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              "Cadastro profundo da marca com pilares, voz, objetivo e estética",
              "5 especialistas rodando em paralelo via Groq",
              "Resultados salvos por cliente com histórico e export em .md"
            ].map((item) => (
              <div key={item} className="glass-panel rounded-3xl p-4 text-sm text-white/72">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel neon-border rounded-[2rem] p-6 sm:p-8">
          <div className="mb-6">
            <div className="font-heading text-2xl font-semibold">{APP_NAME}</div>
            <p className="mt-2 text-sm text-white/62">
              Entre com Google ou receba um magic link para acessar sua central.
            </p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading !== null}
              className="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-black transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>Entrar com Google</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-white/40">
              <div className="h-px flex-1 bg-white/10" />
              ou
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form className="space-y-4" onSubmit={handleMagicLink}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/84">E-mail</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/38" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@agencia.com"
                    className="input-shell px-12 py-4 text-sm"
                    required
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={isLoading !== null}
                className="w-full rounded-2xl border border-white/10 bg-white/6 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading === "magic" ? "Enviando link..." : "Receber magic link"}
              </button>
            </form>

            {feedback ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/72">
                {feedback}
              </div>
            ) : null}

            <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-4 text-xs leading-6 text-white/48">
              Para magic link em ambiente SSR, configure o template de e-mail do
              Supabase para redirecionar ao endpoint <code>/auth/callback</code>.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
