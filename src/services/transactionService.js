import { request } from "./apiClient";

export const getAll = () => request("/transactions");
export const create = (input) => request("/transactions", { method: "POST", body: input });
export const update = (id, patch) => request(`/transactions/${id}`, { method: "PATCH", body: patch });
export const remove = (id) => request(`/transactions/${id}`, { method: "DELETE" });
