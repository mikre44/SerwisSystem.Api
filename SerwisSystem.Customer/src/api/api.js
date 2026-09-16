const API_URL = "https://localhost:5000/api";

async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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

export function createRepair(repair) {
  return apiFetch("/repairs", {
    method: "POST",
    body: JSON.stringify(repair),
  });
}

export function checkRepair(serialNumber, email) {
  return apiFetch("/repairs/check", {
    method: "POST",
    body: JSON.stringify({
      serialNumber,
      email,
    }),
  });
}