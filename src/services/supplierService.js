import api from "./api";

export const getSupplierList = async (page = 1, limit = 10) => {
  const response = await api.get("/suppliers", {
    params: { page, limit },
  });
  const rows = response.data.data || [];
  rows.meta = response.data.meta || null;
  return rows;
};

export const getSupplierById = async (id) => {
  const response = await api.get(`/suppliers/${id}`);
  return response.data.data;
};

export const createSupplier = async (payload) => {
  const response = await api.post("/suppliers", payload);
  return response.data.data;
};

export const updateSupplier = async (id, payload) => {
  const response = await api.put(`/suppliers/${id}`, payload);
  return response.data.data;
};

export const deleteSupplier = async (id) => {
  const response = await api.delete(`/suppliers/${id}`);
  return response.data;
};

export const exportSupplierPDF = async () => {
  const response = await api.get("/suppliers/export/pdf", {
    responseType: "blob",
  });
  return response.data;
};

export const exportSupplierExcel = async () => {
  const response = await api.get("/suppliers/export/excel", {
    responseType: "blob",
  });
  return response.data;
};

export const importSupplier = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/import/supplier/excel", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const downloadTemplateSupplier = async () => {
  const response = await api.get("/import/supplier/template", {
    responseType: "blob",
  });
  return response.data;
};
