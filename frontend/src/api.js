const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function request(path, { method = "GET", body, token, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const message = data?.detail || `Request failed (${res.status})`;
    throw new Error(typeof message === "string" ? message : "Something went wrong.");
  }
  return data;
}

export const api = {
  checkPhone: (phone_number) => request("/auth/check-phone", { method: "POST", body: { phone_number } }),
  setPin: (payload) => request("/auth/set-pin", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),

  listDepartments: () => request("/departments"),
  createDepartment: (name, token) => request("/departments", { method: "POST", body: { name }, token }),
  renameDepartment: (id, name, token) => request(`/departments/${id}`, { method: "PUT", body: { name }, token }),
  deleteDepartment: (id, token) => request(`/departments/${id}`, { method: "DELETE", token }),

  me: (token) => request("/users/me", { token }),
  setFcmToken: (fcmToken, token) =>
    request("/users/me/fcm-token", { method: "POST", body: { token: fcmToken }, token }),
  setMyDepartment: (department_id, token) =>
    request("/users/me/department", { method: "POST", body: { department_id }, token }),
  listUsers: (token) => request("/users", { token }),
  whitelist: (phone_number, token) => request("/users/whitelist", { method: "POST", body: { phone_number }, token }),
  removeUser: (id, token) => request(`/users/${id}`, { method: "DELETE", token }),

  listPhotos: (token) => request("/photos", { token }),
  sendPhoto: (formData, token) => request("/photos/send", { method: "POST", body: formData, isForm: true, token }),
  
  // ADD THIS NEW LINE RIGHT HERE:
  deletePhoto: (id, token) => request(`/photos/${id}`, { method: "DELETE", token }),
};
