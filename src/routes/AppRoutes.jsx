import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import MainLayout from "../components/layouts/MainLayout";

// Pages
const Login = lazy(() => import("../pages/auth/Login"));
const Dashboard = lazy(() => import("../pages/DashboardMain"));
const CabangMain = lazy(() => import("../pages/CabangMain"));
const KategoriMain = lazy(() => import("../pages/KategoriMain"));
const RuanganMain = lazy(() => import("../pages/RuanganMain"));
const SupplierMain = lazy(() => import("../pages/SupplierMain"));
const BarangMain = lazy(() => import("../pages/BarangMain"));

// Placeholder — ganti dengan komponen nyata saat sudah dibuat
function ComingSoon({ name }) {
  return (
    <div className="flex items-center justify-center h-full min-h-64">
      <div className="text-center text-gray-400">
        <div className="text-5xl mb-3">🚧</div>
        <h3 className="text-xl font-bold text-gray-600 mb-1">{name}</h3>
        <p className="text-sm">Halaman ini sedang dalam pengembangan.</p>
      </div>
    </div>
  );
}

export default function AppRouter() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
          Memuat halaman...
        </div>
      }
    >
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected — semua pakai MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/barang" element={<BarangMain />} />
          <Route path="/barang-masuk" element={<ComingSoon name="Barang Masuk" />} />
          <Route path="/barang-keluar" element={<ComingSoon name="Barang Keluar" />} />
          <Route path="/maintenance" element={<ComingSoon name="Maintenance" />} />
          <Route path="/barang-rusak" element={<ComingSoon name="Barang Rusak" />} />
          <Route path="/kategori" element={<KategoriMain />} />
          <Route path="/ruangan" element={<RuanganMain />} />
          <Route path="/supplier" element={<SupplierMain />} />
          <Route path="/cabang" element={<CabangMain />} />
          <Route path="/laporan" element={<ComingSoon name="Laporan" />} />
          <Route path="/scan" element={<ComingSoon name="Scan QR" />} />
          <Route path="/profile" element={<ComingSoon name="Profil Saya" />} />
          <Route path="/settings" element={<ComingSoon name="Pengaturan" />} />
        </Route>

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}