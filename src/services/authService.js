import api from "./api";

// ─── Konstanta ──────────────────────────────────────────────────────────────

export const SESSION_TIMEOUT = 3 * 60 * 60 * 1000; // 3 jam dalam ms

// ─── Helpers localStorage yang aman ─────────────────────────────────────────

const safeSet = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Abaikan kegagalan storage (misal: private mode penuh)
  }
};

const safeGet = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeClear = () => {
  try {
    localStorage.clear();
  } catch {
    // ignore
  }
};

// ─── Session utils (dipakai juga oleh MainLayout) ────────────────────────────

/**
 * Kembalikan true jika sesi masih valid, false jika sudah kedaluwarsa.
 */
export const isSessionValid = () => {
  const token = safeGet("token");
  if (!token) return false;
  const lastActive = Number(safeGet("lastActive") || 0);
  if (!lastActive) return false;
  return Date.now() - lastActive <= SESSION_TIMEOUT;
};

/**
 * Perbarui timestamp lastActive ke sekarang.
 */
export const touchSession = () => {
  safeSet("lastActive", Date.now().toString());
};

// ─── Profile cache ───────────────────────────────────────────────────────────

export const readCachedProfile = () => {
  try {
    const cached = safeGet("profileCache");
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

export const persistProfile = (profile) => {
  if (!profile) return;
  try {
    safeSet("profileCache", JSON.stringify(profile));
  } catch {
    // ignore
  }
};

// ─── Auth API ────────────────────────────────────────────────────────────────

/**
 * Login user.
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<object>} data respons dari server
 */
export const login = async ({ email, password }) => {
  const { data } = await api.post("/auth/login", { email, password });

  if (data.token) safeSet("token", data.token);
  if (data.data) safeSet("user", JSON.stringify(data.data));
  touchSession();

  return data;
};

/**
 * Logout user — bersihkan storage lalu arahkan ke halaman login.
 * Selalu resolve (tidak pernah throw), agar caller tidak perlu try/catch.
 */
export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } catch {
    // Tetap lanjutkan proses logout meski request gagal
  } finally {
    safeClear();
    window.location.replace("/login");
  }
};

/**
 * Ambil profil user yang sedang login.
 * @returns {Promise<object>}
 */
export const getProfile = async () => {
  const { data } = await api.get("/auth/profile");
  return data.data;
};

/**
 * Update profil (nama, email, foto).
 * @param {FormData} formData
 * @returns {Promise<object>}
 */
export const updateProfile = async (formData) => {
  const { data } = await api.put("/auth/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  if (data.data) safeSet("user", JSON.stringify(data.data));
  return data;
};

/**
 * Ganti password.
 * @param {{ old_password: string, new_password: string, confirm_password: string }} payload
 * @returns {Promise<object>}
 */
export const updatePassword = async (payload) => {
  const { data } = await api.put("/auth/change-password", payload);
  return data;
};