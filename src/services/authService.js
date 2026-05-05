import api from "./api";

/**
 * Login user
 * @param {{ email: string, password: string }} credentials
 */
export const login = async ({ email, password }) => {
  const { data } = await api.post("/auth/login", { email, password });
  // Simpan token & user ke localStorage
  if (data.token) localStorage.setItem("token", data.token);
  if (data.data) localStorage.setItem("user", JSON.stringify(data.data));
  return data;
};

/**
 * Logout user
 */
export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } finally {
    localStorage.clear();
    window.location.href = "/login";
  }
};

/**
 * Get profile user yang sedang login
 */
export const getProfile = async () => {
  const { data } = await api.get("/auth/profile");
  return data.data;
};

/**
 * Update profile (nama, email, foto)
 * @param {FormData} formData
 */
export const updateProfile = async (formData) => {
  const { data } = await api.put("/auth/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

/**
 * Ganti password
 * @param {{ old_password: string, new_password: string, confirm_password: string }} payload
 */
export const updatePassword = async (payload) => {
  const { data } = await api.put("/auth/change-password", payload);
  return data;
};