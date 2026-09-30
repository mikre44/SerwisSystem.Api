// Base URL is configurable per environment (see .env.local / README);
// http://localhost:5000/api matches the API's default dev port.
const DEFAULT_API_URL = "http://localhost:5000/api";
const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type");
  const body = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw buildApiError(response, body);
  }

  return body;
}

// The API returns RFC 7807 ProblemDetails for every error. Pick the most
// specific message available, and never let an empty body become "Error: ".
function buildApiError(response, body) {
  if (response.status === 429) {
    return new Error(
      "Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie."
    );
  }

  const problem = typeof body === "object" && body !== null ? body : null;

  const message =
    problem?.detail ||
    problem?.title ||
    (typeof body === "string" && body) ||
    `${response.status} ${response.statusText}`;

  const error = new Error(message);

  if (problem?.errors) {
    error.fieldErrors = toCamelCaseKeys(problem.errors);
  }

  return error;
}

// ASP.NET validation errors are keyed by the DTO property name
// (PascalCase); forms look them up by their camelCase field name.
function toCamelCaseKeys(errors) {
  const result = {};

  for (const [key, value] of Object.entries(errors)) {
    const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
    result[camelKey] = value;
  }

  return result;
}

// Product catalogue: [{ name, serialRequired, serialHint }]. The backend is
// now the single source of truth for which products need a serial number
// and how to validate it (see validation/repairForm.js).
export function getProducts() {
  return apiFetch("/products");
}

export function createRepair(repair) {
  return apiFetch("/repairs", {
    method: "POST",
    body: JSON.stringify(repair),
  });
}

export function checkRepair({ id, email }) {
  return apiFetch("/repairs/check", {
    method: "POST",
    body: JSON.stringify({ id, email }),
  });
}
