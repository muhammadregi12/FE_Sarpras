import api from "./api";

const DASHBOARD_CACHE_KEY = "dashboardSummaryCache";
const DASHBOARD_CACHE_TTL = 3 * 60 * 1000;

let inMemoryCache = null;
let inFlightRequest = null;

const readDashboardCache = () => {
  if (inMemoryCache) return inMemoryCache;

  try {
    const raw = sessionStorage.getItem(DASHBOARD_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.data || !parsed?.timestamp) return null;

    inMemoryCache = parsed;
    return parsed;
  } catch {
    return null;
  }
};

const writeDashboardCache = (data) => {
  const cached = {
    data,
    timestamp: Date.now(),
  };

  inMemoryCache = cached;

  try {
    sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore storage failures and keep the in-memory cache.
  }

  return cached;
};

export const clearDashboardSummaryCache = () => {
  inMemoryCache = null;
  inFlightRequest = null;

  try {
    sessionStorage.removeItem(DASHBOARD_CACHE_KEY);
  } catch {
    // Ignore storage failures.
  }
};

const isCacheFresh = (cached) => {
  if (!cached?.timestamp) return false;
  return Date.now() - cached.timestamp < DASHBOARD_CACHE_TTL;
};

const normalizeDashboardResponse = (payload) => {
  const cards = payload?.cards ?? {};
  const charts = payload?.charts ?? {};
  const tables = payload?.tables ?? {};
  const alerts = payload?.alerts ?? {};

  // Build a simple activity timeline from available dashboard tables.
  const recentActivity = [
    ...(tables.barang_masuk_terbaru ?? []).map((item) => ({
      nama: item?.barang?.name || item?.barang?.kode_barang || "Barang masuk",
      keterangan: `Masuk ${item?.jumlah ?? 0}`,
      tanggal: item?.tanggal_masuk,
      status: "Masuk",
    })),
    ...(tables.barang_rusak_terbaru ?? []).map((item) => ({
      nama: item?.barang?.name || item?.barang?.kode_barang || "Barang rusak",
      keterangan: item?.keterangan || `Rusak ${item?.jumlah_rusak ?? 0}`,
      tanggal: item?.tanggal_rusak,
      status: item?.tingkat_kerusakan || "Rusak",
    })),
    ...(tables.maintenance_berjalan ?? []).map((item) => ({
      nama: item?.barang?.name || item?.barang?.kode_barang || "Maintenance",
      keterangan: `Maintenance ${item?.jumlah_maintenance ?? 0}`,
      tanggal: item?.tanggal_maintenance,
      status: item?.status || "maintenance",
    })),
  ]
    .sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0))
    .slice(0, 12);

  return {
    message: payload?.message,
    cards,
    charts,
    tables,
    alerts,
    recentActivity,
  };
};

/**
 * Ambil semua data ringkasan untuk dashboard utama
 */
export const getDashboardSummary = async ({ forceRefresh = false } = {}) => {
  const cached = readDashboardCache();

  if (!forceRefresh && cached && isCacheFresh(cached)) {
    return cached.data;
  }

  if (inFlightRequest) {
    return inFlightRequest;
  }

  inFlightRequest = api
    .get("/dashboard")
    .then(({ data }) => {
      const normalized = normalizeDashboardResponse(data?.data ?? data);
      return writeDashboardCache(normalized).data;
    })
    .catch((error) => {
      if (cached?.data) {
        return cached.data;
      }
      throw error;
    })
    .finally(() => {
      inFlightRequest = null;
    });

  return inFlightRequest;
};
