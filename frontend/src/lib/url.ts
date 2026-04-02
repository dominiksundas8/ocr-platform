/**
 * 🛠️ Asset URL Normalizer
 * Converte i link interni di Docker (es. 'backend:8000') in URL pubblici accessibili dal browser.
 */
export function getPublicUrl(path: string | null | undefined): string {
  if (!path) return "";
  
  const publicBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  
  // 🛡️ MODALITÀ "ROBUSTA": 
  // Django in Docker può restituire 'http://backend:8000/media/...' o altri host interni.
  // Noi cerchiamo la chiave '/media/' e ricostruiamo l'URL pubblico.
  if (path.includes("/media/")) {
    const parts = path.split("/media/");
    const relativePath = parts[parts.length - 1]; // Prende tutto ciò che c'è dopo l'ultimo /media/
    return `${publicBase}/media/${relativePath}`;
  }

  // Se non contiene /media/ ma è assoluto, lo lasciamo invariato
  if (path.startsWith("http")) {
    return path;
  }

  // 🛰️ RELATIVE PATH (fallback):
  const separator = path.startsWith("/") ? "" : "/";
  return `${publicBase}${separator}${path}`;
}

/**
 * 🔍 IS PDF CHECKER
 * Verifica se un file è un documento PDF in base all'estensione.
 */
export function isPdf(url: string): boolean {
  return url.toLowerCase().endsWith(".pdf");
}
