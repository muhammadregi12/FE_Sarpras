import api from "./api";

const EXPORT_CACHE_TTL = 5 * 60 * 1000;

const exportCache = {
  pdf: null,
  excel: null,
};

const exportPromises = {
  pdf: null,
  excel: null,
};

let hasPrefetchedExports = false;

const isExportCacheFresh = (entry) => {
  return !!entry && Date.now() - entry.timestamp < EXPORT_CACHE_TTL;
};

const readExportCache = (type) => {
  const entry = exportCache[type];
  return isExportCacheFresh(entry) ? entry.blob : null;
};

const writeExportCache = (type, blob) => {
  exportCache[type] = {
    blob,
    timestamp: Date.now(),
  };
  return blob;
};

const fetchExportBlob = async (type, url) => {
  if (exportPromises[type]) {
    return exportPromises[type];
  }

  exportPromises[type] = api
    .get(url, { responseType: "blob" })
    .then((response) => writeExportCache(type, response.data))
    .finally(() => {
      exportPromises[type] = null;
    });

  return exportPromises[type];
};

export const clearBarangExportCache = () => {
  exportCache.pdf = null;
  exportCache.excel = null;
  exportPromises.pdf = null;
  exportPromises.excel = null;
  hasPrefetchedExports = false;
};

export const prefetchBarangExports = () => {
  if (hasPrefetchedExports) return;
  hasPrefetchedExports = true;

  const runPrefetch = () => {
    void fetchExportBlob("pdf", "/barangs/export/pdf");
    void fetchExportBlob("excel", "/barangs/export/excel");
  };

  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(runPrefetch, { timeout: 2000 });
    return;
  }

  setTimeout(runPrefetch, 1200);
};

export const getBarangList = async (page = 1, limit = 10) => {
  const response = await api.get("/barangs", {
    params: { page, limit },
  });
  return response.data.data;
};
export const getBarangById = async (id) => {
  const response = await api.get(`/barangs/${id}`);
  return response.data.data;
};

export const createBarang = async (payload) => {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("kode_barang", payload.kode_barang);
  formData.append("ruangan_id", payload.ruangan_id);
  formData.append("cabang_id", payload.cabang_id);
  formData.append("kategori_id", payload.kategori_id);
  formData.append("satuan", payload.satuan);
  formData.append("keterangan", payload.keterangan || "");
  formData.append("tahun_pengadaan", payload.tahun_pengadaan);
  if (payload.image) {
    formData.append("image", payload.image);
  }

  const response = await api.post("/barangs", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

export const updateBarang = async (id, payload) => {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("kode_barang", payload.kode_barang);
  formData.append("ruangan_id", payload.ruangan_id);
  formData.append("cabang_id", payload.cabang_id);
  formData.append("kategori_id", payload.kategori_id);
  formData.append("satuan", payload.satuan);
  formData.append("keterangan", payload.keterangan || "");
  formData.append("tahun_pengadaan", payload.tahun_pengadaan);
  if (payload.image) {
    formData.append("image", payload.image);
  }

  const response = await api.put(`/barangs/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

export const deleteBarang = async (id) => {
  const response = await api.delete(`/barangs/${id}`);
  return response.data;
};

export const exportBarangPDF = async () => {
  const cached = readExportCache("pdf");
  if (cached) return cached;
  return fetchExportBlob("pdf", "/barangs/export/pdf");
};

export const exportBarangExcel = async () => {
  const cached = readExportCache("excel");
  if (cached) return cached;
  return fetchExportBlob("excel", "/barangs/export/excel");
};

export const importBarang = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/import/barang/excel", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const downloadTemplateBarang = async () => {
  const response = await api.get("/import/barang/template", {
    responseType: "blob",
  });
  return response.data;
};