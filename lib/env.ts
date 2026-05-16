import "server-only";

function required(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`A variavel de ambiente ${name} nao foi configurada.`);
  }

  return value;
}

export const serverEnv = {
  get groqApiKey() {
    return required("GROQ_API_KEY");
  },
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseAnonKey() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get appUrl() {
    return required("NEXT_PUBLIC_APP_URL");
  }
};
