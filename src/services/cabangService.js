import api from "./api";

/**
 * Fetch all cabang dengan pagination
 */
export const getCabangList = async (page = 1, limit = 10) => {
  const { data } = await api.get("/cabangs", {
    params: { page, limit },
  });
  const rows = data.data || [];
  rows.meta = data.meta || null;
  return rows;
};

/**
 * Get cabang by ID
 */
export const getCabangById = async (id) => {
  const { data } = await api.get(`/cabangs/${id}`);
  return data.data;
};

/**
 * Create new cabang
 */
export const createCabang = async (payload) => {
  const { data } = await api.post("/cabangs", payload);
  return data.data;
};

/**
 * Update cabang
 */
export const updateCabang = async (id, payload) => {
  const { data } = await api.put(`/cabangs/${id}`, payload);
  return data.data;
};

/**
 * Delete cabang
 */
export const deleteCabang = async (id) => {
  const { data } = await api.delete(`/cabangs/${id}`);
  return data;
};

/**
 * Import cabang dari Excel
 */
export const importCabang = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/import/cabang/excel", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

/**
 * Download template cabang
 */
export const downloadTemplateCabang = async () => {
  const response = await api.get("/import/cabang/template", {
    responseType: "blob",
  });
  return response.data;
};
