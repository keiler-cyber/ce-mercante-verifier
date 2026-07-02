// Acesso REVOGADO — barrado em login, cadastro e reset em todos os módulos.
export const BLOCKED_EMAILS = ['julia.lisboa@brasporto.com'];

// ACESSO PROVISÓRIO Thais Nogueira (Nell 360) — remover ao encerrar
export const ALLOWED_EXTERNAL_EMAILS = ['thaisnogueira@nell360.com.br'];

export function isEmailAllowed(email: string | undefined | null): boolean {
  const normalized = (email ?? '').trim().toLowerCase();
  if (!normalized) return false;
  if (BLOCKED_EMAILS.includes(normalized)) return false;
  if (normalized.endsWith('@brasporto.com')) return true;
  // ACESSO PROVISÓRIO Thais Nogueira (Nell 360) — remover ao encerrar
  return ALLOWED_EXTERNAL_EMAILS.includes(normalized);
}