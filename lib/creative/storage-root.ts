/**
 * Retorna o diretório raiz gravável para artefatos gerados em runtime.
 *
 * Em ambientes serverless (Vercel, AWS Lambda, etc.) o `process.cwd()` aponta
 * para /var/task, que é somente-leitura. O único diretório gravável nesses
 * ambientes é /tmp.
 *
 * Em desenvolvimento local, usamos .generated/ na raiz do projeto para manter
 * os arquivos entre reinicializações do servidor dev.
 */
import path from "path";
import os from "os";

function isReadonlyCwd(): boolean {
  // /var/task é o diretório padrão do Lambda/Vercel (somente-leitura)
  const cwd = process.cwd();
  return cwd.startsWith("/var/task") || cwd.startsWith("/var/runtime");
}

export function getStorageRoot(subfolder: string): string {
  if (isReadonlyCwd() || process.env.STORAGE_USE_TMP === "1") {
    return path.join(os.tmpdir(), ".generated", subfolder);
  }
  return path.join(process.cwd(), ".generated", subfolder);
}
