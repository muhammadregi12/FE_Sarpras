import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import MainLayout from "../components/layouts/MainLayout";

// Pages
const Login = lazy(() => import("../pages/auth/Login"));
const UpdatePassword = lazy(() => import("../pages/auth/UpdatePasswordMain"));
const UpdateProfil = lazy(() => import("../pages/auth/UpdateProfilMain"));
const Dashboard = lazy(() => import("../pages/DashboardMain"));
const CabangMain = lazy(() => import("../pages/CabangMain"));
const KategoriMain = lazy(() => import("../pages/KategoriMain"));
const RuanganMain = lazy(() => import("../pages/RuanganMain"));
const SupplierMain = lazy(() => import("../pages/SupplierMain"));
const BarangMain = lazy(() => import("../pages/BarangMain"));
const BarangMasukMain = lazy(() => import("../pages/BarangMasukMain"));
const BarangKeluarMain = lazy(() => import("../pages/BarangKeluarMain"));
const BarangMaintenanceMain = lazy(() => import("../pages/BarangMaintenanceMain"));
const BarangRusakMain = lazy(() => import("../pages/BarangRusakMain"));
const LaporanBarangMain = lazy(() => import("../pages/report/LaporanBarangMain"));
const LaporanBarangMasukMain = lazy(() => import("../pages/report/LaporanBarangMasukMain"));
const LaporanBarangKeluarMain = lazy(() => import("../pages/report/LaporanBarangKeluarMain"));
const LaporanBarangRusakMain = lazy(() => import("../pages/report/LaporanBarangRusakMain"));
const BarangScan = lazy(() => import("../components/feature/barang/BarangScan"));
const RuanganScan = lazy(() => import("../components/feature/ruangan/RuanganScan"));
const ScanManagement = lazy(() => import("../pages/qr code/ScanManagement"));

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
        <Route path="/barang/scan" element={<BarangScan />} />
        <Route path="/ruangan/scan" element={<RuanganScan />} />

        {/* Protected — semua pakai MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/barang" element={<BarangMain />} />
          <Route path="/barang-masuk" element={<BarangMasukMain />} />
          <Route path="/barang-keluar" element={<BarangKeluarMain />} />
          <Route path="/maintenance" element={<BarangMaintenanceMain />} />
          <Route path="/laporan-barang" element={<LaporanBarangMain />} />
          <Route path="/laporan/barang-masuk" element={<LaporanBarangMasukMain />} />
          <Route path="/barang-rusak" element={<BarangRusakMain />} />
          <Route path="/laporan/barang-keluar" element={<LaporanBarangKeluarMain />} />
          <Route path="/laporan/barang-rusak" element={<LaporanBarangRusakMain />} />
          <Route path="/kategori" element={<KategoriMain />} />
          <Route path="/ruangan" element={<RuanganMain />} />
          <Route path="/supplier" element={<SupplierMain />} />
          <Route path="/cabang" element={<CabangMain />} />
          <Route path="/scan" element={<ScanManagement />} />
          <Route path="/profile" element={<UpdateProfil />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/update" element={<ComingSoon name="Update Profile" />} />
        </Route>

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}