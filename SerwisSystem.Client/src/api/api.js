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
    if (response.status === 401) {
      localStorage.removeItem("token");

      window.location.href = "/login";

      throw new Error("Your session has expired. Please log in again.");
    }

    if (response.status === 403) {
      throw new Error("You do not have permission to perform this action.");
    }

    throw new Error(
      data?.message ||
      data ||
      "Something went wrong."
    );
  }

  return data;
}





export function register(username, email, password) {// authorization ======================================================================
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


export function getUsers({// users ======================================================================
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
    body: JSON.stringify({
      username,
      email,
    }),
  });
}

export function changePassword(currentPassword, newPassword) {
  return apiFetch("/users/change-password", {
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

export function updateRepair(id, repair) {
  return apiFetch(`/repairs/${id}`, {
    method: "PUT",
    body: JSON.stringify(repair),
  });
}



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