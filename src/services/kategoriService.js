import api from "./api";

/**
 * Fetch all kategori dengan pagination
 */
export const getKategoriList = async (page = 1, limit = 10) => {
  const { data } = await api.get("/kategori", {
    params: { page, limit },
  });
  return data.data || [];
};

/**
 * Get kategori by ID
 */
export const getKategoriById = async (id) => {
  const { data } = await api.get(`/kategori/${id}`);
  return data.data;
};

/**
 * Create new kategori
 */
export const createKategori = async (payload) => {
  const { data } = await api.post("/kategori", payload);
  return data.data;
};

/**
 * Update kategori
 */
export const updateKategori = async (id, payload) => {
  const { data } = await api.put(`/kategori/${id}`, payload);
  return data.data;
};

/**
 * Delete kategori
 */
export const deleteKategori = async (id) => {
  const { data } = await api.delete(`/kategori/${id}`);
  return data;
};
