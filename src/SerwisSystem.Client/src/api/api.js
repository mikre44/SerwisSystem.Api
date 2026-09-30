import { clearToken, getToken } from "./auth";

const API_URL = "http://localhost:5000/api";

// Thrown for every failed request. `fieldErrors` holds validation messages
// per field (`{ serialNumber: ["..."] }`) so forms can show them next to inputs.
export class ApiError extends Error {
  constructor(message, status, fieldErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function readBody(response) {
  const contentType = response.headers.get("content-type") ?? "";

  // Both "application/json" and "application/problem+json" contain "json".
  if (contentType.includes("json")) {
    return response.json();
  }

  return response.text();
}

// The API answers errors with RFC 7807 ProblemDetails: { title, status, detail?, errors? }.
function getErrorMessage(response, body) {
  if (typeof body === "string") {
    return body || `${response.status} ${response.statusText}`;
  }

  return body?.detail || body?.title || `${response.status} ${response.statusText}`;
}

function redirectToLogin() {
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();

  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
  } catch {
    // fetch() only rejects when the server cannot be reached at all.
    throw new ApiError("Cannot connect to the server.", 0);
  }

  const body = await readBody(response);

  if (response.ok) {
    return body;
  }

  // A 401 on a request that carried a token means the session has expired.
  // A 401 without a token (e.g. wrong password on login) is a normal error.
  if (response.status === 401 && token) {
    clearToken();
    redirectToLogin();
    throw new ApiError("Your session has expired. Please log in again.", 401);
  }

  throw new ApiError(
    getErrorMessage(response, body),
    response.status,
    body?.errors ?? {},
  );
}

// Auth

export function register(username, email, password) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

export function login(usernameOrEmail, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ usernameOrEmail, password }),
  });
}

// Products

export function getProducts() {
  return apiFetch("/products");
}

// Repairs

export function getRepairs({
  page = 1,
  pageSize = 10,
  search = "",
  statuses = [],
  mine = false,
  sortBy = "createdAt",
  descending = true,
} = {}) {
  const params = new URLSearchParams({
    page,
    pageSize,
    search,
    mine,
    sortBy,
    descending,
  });

  statuses.forEach((status) => {
    params.append("statuses", status);
  });

  return apiFetch(`/repairs?${params}`);
}

export function getRepair(id) {
  return apiFetch(`/repairs/${id}`);
}

export function updateRepair(id, repair) {
  return apiFetch(`/repairs/${id}`, {
    method: "PUT",
    body: JSON.stringify(repair),
  });
}

export function takeRepair(id) {
  return apiFetch(`/repairs/${id}/take`, { method: "POST" });
}

export function completeRepair(id) {
  return apiFetch(`/repairs/${id}/complete`, { method: "POST" });
}

export function cancelRepair(id) {
  return apiFetch(`/repairs/${id}/cancel`, { method: "POST" });
}

export function returnRepair(id) {
  return apiFetch(`/repairs/${id}/return`, { method: "POST" });
}

export function deleteRepair(id) {
  return apiFetch(`/repairs/${id}`, { method: "DELETE" });
}

// Users

export function getUsers({
  page = 1,
  pageSize = 10,
  search = "",
  sortBy = "priority",
  descending = false,
} = {}) {
  const params = new URLSearchParams({
    page,
    pageSize,
    search,
    sortBy,
    descending,
  });

  return apiFetch(`/users?${params}`);
}

export function getUser(id) {
  return apiFetch(`/users/${id}`);
}

export function getLoggedUser() {
  return apiFetch("/users/logged");
}

export function updateUser(id, username, email) {
  return apiFetch(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify({ username, email }),
  });
}

export function changePassword(currentPassword, newPassword) {
  return apiFetch("/users/change-password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function updatePermissions(id, permissionsGranted, permissionsRevoked) {
  return apiFetch(`/users/grant/${id}`, {
    method: "PUT",
    body: JSON.stringify({ permissionsGranted, permissionsRevoked }),
  });
}

export function deleteUser(id) {
  return apiFetch(`/users/${id}`, { method: "DELETE" });
}

// Admins

export function getAdmins() {
  return apiFetch("/users/admins");
}

export function promoteAdmin(id) {
  return apiFetch(`/users/${id}/promote-admin`, { method: "PUT" });
}

export function demoteAdmin(id) {
  return apiFetch(`/users/${id}/demote-admin`, { method: "PUT" });
}

export function updateAdminPriority(id, priority) {
  return apiFetch(`/users/${id}/priority`, {
    method: "PUT",
    body: JSON.stringify({ priority }),
  });
}
