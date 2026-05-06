export function getApiBaseUrl() {
  const configured = String(process.env.NEXT_PUBLIC_API_URL || "").trim();

  if (!configured) {
    return "/api";
  }

  const normalized = configured.toLowerCase();
  const looksLocal =
    normalized.includes("://localhost") ||
    normalized.includes("://127.0.0.1") ||
    normalized.includes("://0.0.0.0");

  if (looksLocal && typeof window !== "undefined") {
    const host = String(window.location.hostname || "").toLowerCase();
    const isLocalBrowser = host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";

    if (!isLocalBrowser) {
      return "/api";
    }
  }

  return configured;
}
