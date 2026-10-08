const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");

async function apiFetch(endpoint, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Nie udało się połączyć z serwerem. Sprawdź połączenie i spróbuj ponownie.", { cause: error });
  }

  const contentType = response.headers.get("content-type");

  let data;

  if (contentType?.includes("json")) {
    try {
      data = await response.json();
    } catch {
      throw new Error("Serwer zwrócił nieprawidłową odpowiedź. Spróbuj ponownie później.");
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const details = data?.errors ? Object.values(data.errors).flat().join(" ") : "";
    const error = new Error(details || data?.message || data?.detail || data?.title || (typeof data === "string" ? data.trim() : "") || `Żądanie nie powiodło się (${response.status}).`);
    error.status = response.status;
    throw error;
  }

  return data;
}

export function createRepair(repair) {
  return apiFetch("/repairs", {
    method: "POST",
    body: JSON.stringify(repair),
  });
}

export function checkRepair(searchData, cancellationSignal) {
  return apiFetch("/repairs/check", {
    method: "POST",
    body: JSON.stringify(searchData),
    signal: cancellationSignal,
  });
}
