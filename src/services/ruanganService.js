import api from "./api";

/**
 * Fetch all ruangan dengan pagination
 */
export const getRuanganList = async (page = 1, limit = 10) => {
  const { data } = await api.get("/ruangans", {
    params: { page, limit },
  });
  return data.data || [];
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
