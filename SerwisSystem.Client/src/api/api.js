const API_URL = "http://localhost:5000/api";

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type");

  let data;

  if (contentType?.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    throw new Error(data.message || data);
  }

  return data;
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

export function updateUser(id, username, email) {
  return apiFetch(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      username,
      email,
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

export function register(username, email, password) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      username,
      email,
      password,
    }),
  });
}

export function deleteUser(id) {
  return apiFetch(`/users/${id}`, {
    method: "DELETE",
  });
}

export function updateRepair(id, repair) {
  return apiFetch(`/repairs/${id}`, {
    method: "PUT",
    body: JSON.stringify(repair),
  });
}

export function getLoggedUser() {
  return apiFetch("/users/logged");
}

export function getRepairs() {
  return apiFetch("/repairs");
}

export function getRepair(id) {
  return apiFetch(`/repairs/${id}`);
}

export function getUsers() {
  return apiFetch("/users");
}

export function getUser(id) {
  return apiFetch(`/users/${id}`);
}

export function takeRepair(id) {
  return apiFetch(`/repairs/${id}/take`, {
    method: "POST",
  });
}

export function completeRepair(id) {
  return apiFetch(`/repairs/${id}/complete`, {
    method: "POST",
  });
}

export function cancelRepair(id) {
  return apiFetch(`/repairs/${id}/cancel`, {
    method: "POST",
  });
}

export function returnRepair(id) {
  return apiFetch(`/repairs/${id}/return`, {
    method: "POST",
  });
}