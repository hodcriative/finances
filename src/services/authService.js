import { clearToken, request, setToken } from "./apiClient";

export async function login(credentials) {
  const result = await request("/auth/login", { method: "POST", body: credentials, auth: false });
  setToken(result.token);
  return result.user;
}

export async function register(details) {
  const result = await request("/auth/register", { method: "POST", body: details, auth: false });
  setToken(result.token);
  return result.user;
}

export async function getCurrentUser() {
  const result = await request("/auth/me");
  return result.user;
}

export async function logout() {
  try {
    await request("/auth/logout", { method: "POST" });
  } finally {
    clearToken();
  }
}
