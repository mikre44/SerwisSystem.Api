const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  let response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
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
    if (response.status === 401 && endpoint !== "/auth/login") {
      localStorage.removeItem("token");

      window.location.href = "/login";

      throw new Error("Sesja wygasła. Zaloguj się ponownie.");
    }

    if (response.status === 403) {
      throw new Error("Nie masz uprawnień do wykonania tej czynności.");
    }

    const details = data?.errors ? Object.values(data.errors).flat().join(" ") : "";
    const error = new Error(details || data?.message || data?.detail || data?.title || (typeof data === "string" ? data.trim() : "") || `Żądanie nie powiodło się (${response.status}).`);
    error.status = response.status;
    throw error;
  }

  return data;
}





export function register(username, email, password) {// authorization ============================
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      username,
      email,
      password,
    }),
  });
}

export function login(usernameOrEmail, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      usernameOrEmail,
      password,
    }),
  });
}

export function getRepairs({// repairs ============================================================
  page = 1,
  pageSize = 10,
  search = "",
  statuses = [],
  mine = false,
  sortBy = "createdAt",
  descending = true,
} = {}, cancellationSignal) {
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

  return apiFetch(`/repairs?${params}`, { signal: cancellationSignal });
}

export function getRepair(id, cancellationSignal) {
  return apiFetch(`/repairs/${id}`, { signal: cancellationSignal });
}

export function updateRepair(id, repair) {
  return apiFetch(`/repairs/${id}`, {
    method: "PUT",
    body: JSON.stringify(repair),
  });
}

export function takeRepair(id, version) {
  return apiFetch(`/repairs/${id}/take`, {
    method: "POST",
    body: JSON.stringify({ version }),
  });
}

export function completeRepair(id, version) {
  return apiFetch(`/repairs/${id}/complete`, {
    method: "POST",
    body: JSON.stringify({ version }),
  });
}

export function cancelRepair(id, version) {
  return apiFetch(`/repairs/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ version }),
  });
}

export function returnRepair(id, version) {
  return apiFetch(`/repairs/${id}/return`, {
    method: "POST",
    body: JSON.stringify({ version }),
  });
}

export function deleteRepair(id, version) {
  return apiFetch(`/repairs/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ version }),
  });
}

export function getUsers({// users ================================================================
  page = 1,
  pageSize = 10,
  search = "",
  sortBy = "priority",
  descending = false,
} = {}, cancellationSignal) {
  const params = new URLSearchParams({
    page,
    pageSize,
    search,
    sortBy,
    descending,
  });

  return apiFetch(`/users?${params}`, { signal: cancellationSignal });
}

export function getUser(id, cancellationSignal) {
  return apiFetch(`/users/${id}`, { signal: cancellationSignal });
}

export function getLoggedUser(cancellationSignal) {
  return apiFetch("/users/logged", { signal: cancellationSignal });
}

export function updateUser(id, username, email) {
  return apiFetch(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      username,
      email,
    }),
  });
}

export function changePassword(currentPassword, newPassword) {
  return apiFetch("/users/changePassword", {
    method: "PUT",
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
  });
}

export function updatePermissions(id, permissionsGranted, permissionsRevoked){
  return apiFetch(`/users/grant/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      permissionsGranted,
      permissionsRevoked,
    })
  })
}

export function deleteUser(id) {
  return apiFetch(`/users/${id}`, {
    method: "DELETE",
  });
}



export function getAdmins(cancellationSignal) {
  return apiFetch("/users/admins", { signal: cancellationSignal });
}

export function promoteAdmin(id) {
  return apiFetch(`/users/${id}/promote-admin`, {
    method: "PUT",
  });
}

export function demoteAdmin(id) {
  return apiFetch(`/users/${id}/demote-admin`, {
    method: "PUT",
  });
}

export function updateAdminPriority(id, priority) {
  return apiFetch(`/users/${id}/priority`, {
    method: "PUT",
    body: JSON.stringify({
      priority,
    }),
  });
}
