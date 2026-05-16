"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Mail, Sparkles } from "lucide-react";

import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

function getAuthFeedbackMessage(errorMessage: string) {
  const normalized = errorMessage.toLowerCase();

  if (
    normalized.includes("unsupported provider") ||
    normalized.includes("provider is not enabled")
  ) {
    return "O login com Google ainda nao esta habilitado no Supabase deste projeto. Ative o provider Google em Authentication > Sign In / Providers e configure o Client ID e Client Secret.";
  }

  return errorMessage;
}

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
      return "Nao foi possivel concluir a autenticacao. Tente novamente.";
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
      setFeedback(getAuthFeedbackMessage(error.message));
      setIsLoading(null);
    }
  }

  async function handleMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setFeedback("Digite um e-mail valido para receber o link.");
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
      setFeedback(getAuthFeedbackMessage(error.message));
    } else {
      setFeedback("Magic link enviado. Confira sua caixa de entrada.");
    }

    setIsLoading(null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-12 sm:px-6">
      <div className="grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr,0.95fr]">
        <section className="space-y-6">
          <span className="section-kicker">
            <Sparkles className="h-3.5 w-3.5" />
            Erizon Agency OS
          </span>

          <div className="space-y-4">
            <h1 className="max-w-3xl font-heading text-4xl font-semibold leading-tight text-[var(--color-text-1)] sm:text-5xl lg:text-6xl">
              Briefing zerado. Sua operacao criativa entra em cena com contexto total.
            </h1>
            <p className="max-w-2xl text-base text-[var(--color-text-2)] sm:text-lg">
              Cadastre a identidade completa de cada cliente uma unica vez e deixe a squad
              de IA produzir estrategia, copy, visual, midia e metricas em paralelo.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              "Cadastro profundo da marca com pilares, voz, objetivo e estetica",
              "5 especialistas rodando em paralelo via Groq",
              "Resultados salvos por cliente com historico e export em .md"
            ].map((item, index) => (
              <div key={item} className="card p-4 text-sm text-[var(--color-text-2)]">
                <div
                  className={`icon-box mb-3 h-10 w-10 ${
                    index === 0 ? "icon-box-violet" : index === 1 ? "icon-box-green" : "icon-box-amber"
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6 sm:p-8">
          <div className="mb-6">
            <div className="font-heading text-2xl font-semibold text-[var(--color-text-1)]">
              {APP_NAME}
            </div>
            <p className="mt-2 text-sm text-[var(--color-text-2)]">
              Entre com Google ou receba um magic link para acessar sua central.
            </p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading !== null}
              className="flex w-full items-center justify-between rounded-[10px] bg-[var(--color-primary)] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#5A4FE8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>Entrar com Google</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-[var(--color-text-3)]">
              <div className="h-px flex-1 bg-[var(--color-border)]" />
              ou
              <div className="h-px flex-1 bg-[var(--color-border)]" />
            </div>

            <form className="space-y-4" onSubmit={handleMagicLink}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--color-text-1)]">E-mail</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-3)]" />
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
                className="w-full rounded-[10px] border border-[var(--color-border)] bg-white px-5 py-4 text-sm font-semibold text-[var(--color-text-1)] transition hover:bg-[#faf9ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading === "magic" ? "Enviando link..." : "Receber magic link"}
              </button>
            </form>

            {feedback ? (
              <div className="rounded-[12px] border border-[var(--color-border)] bg-[#fbfaff] px-4 py-3 text-sm text-[var(--color-text-2)]">
                {feedback}
              </div>
            ) : null}

            <div className="rounded-[12px] border border-dashed border-[var(--color-border)] bg-[#fbfaff] p-4 text-xs leading-6 text-[var(--color-text-2)]">
              Para entrar com Google, habilite o provider no painel do Supabase em{" "}
              <code>Authentication &gt; Sign In / Providers &gt; Google</code>.
              <br />
              Para magic link em ambiente SSR, configure o template de e-mail do Supabase
              para redirecionar ao endpoint <code>/auth/callback</code>.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
