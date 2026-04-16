import { api } from "./client";

export async function syncUser() {
  const { data } = await api.post("/users/sync");
  return data;
}

export async function getMe() {
  const { data } = await api.get("/users/me");
  return data;
}
