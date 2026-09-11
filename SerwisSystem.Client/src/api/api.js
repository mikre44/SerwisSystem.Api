const API_URL = "http://localhost:5000/api";

export async function login(usernameOrEmail, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            usernameOrEmail,
            password,
        }),
    });

    const contentType = response.headers.get("content-type");

    let data;

    if (contentType?.includes("application/json")){// if it is ana actual response
        data = await response.json();
    } else {//                                         else its an error (bot)
        data = await response.text();
    }

    if (!response.ok) {
        throw new Error(data.message || data);
    }

    return data;
}

export async function getLoggedUser() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/users/logged`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data);
  }

  return data;
}