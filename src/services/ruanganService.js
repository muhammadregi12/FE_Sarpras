import api from "./api";

/**
 * Fetch all ruangan dengan pagination
 */
export const getRuanganList = async (page = 1, limit = 10) => {
  const { data } = await api.get("/ruangans", {
    params: { page, limit },
  });
  const rows = data.data || [];
  rows.meta = data.meta || null;
  return rows;
};

/**
 * Get ruangan by ID
 */
export const getRuanganById = async (id) => {
  const { data } = await api.get(`/ruangans/${id}`);
  return data.data;
};

/**
 * Create new ruangan
 */
export const createRuangan = async (payload) => {
  const { data } = await api.post("/ruangans", payload);
  return data.data;
};

/**
 * Update ruangan
 */
export const updateRuangan = async (id, payload) => {
  const { data } = await api.put(`/ruangans/${id}`, payload);
  return data.data;
};

/**
 * Delete ruangan
 */
export const deleteRuangan = async (id) => {
  const { data } = await api.delete(`/ruangans/${id}`);
  return data;
};

// QR / detail / export helpers
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const getQRCodeUrl = (id) => {
  if (!API_BASE) return `/scan/ruangan/qrcode/${id}`;
  return `${API_BASE}/scan/ruangan/qrcode/${id}`;
};

export const getDetailRuangan = async (id) => {
  const { data } = await api.get(`/scan/ruangan/detail/${id}`);
  return data;
};

export const getQRCodeRuangan = async (id) => {
  const res = await api.get(`/scan/ruangan/qrcode/${id}`, { responseType: "blob" });
  return res.data; // Blob
};

export const downloadQRCodeRuangan = async (id) => {
  const res = await api.get(`/scan/ruangan/qrcode/download/${id}`, { responseType: "blob" });
  return res.data; // Blob for download
};

export const getAllQRCodes = async (baseUrl = null) => {
  const params = baseUrl ? { base_url: baseUrl } : {};
  const { data } = await api.get(`/scan/ruangan/qrcode`, { params });
  return data;
};

export const exportPDFDetailRuangan = async (id) => {
  const res = await api.get(`/scan/ruangan/export-pdf/${id}`, { responseType: "blob" });
  return res.data; // PDF Blob
};
