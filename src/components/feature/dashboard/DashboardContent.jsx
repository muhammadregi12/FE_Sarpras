import { useCallback, useEffect, useMemo, useState, memo } from "react";
import {
  MdInventory2,
  MdNorth,
  MdSouth,
  MdBuild,
  MdWarningAmber,
  MdSell,
} from "react-icons/md";
import { injectStyles, DASHBOARD_STYLES, PALETTE } from "../../../utils/DashboardHelpers";
import { StatCard, SkeletonDashboard } from "./DashboardCard";
import {
  WelcomeBanner,
  MonthlyAreaChart,
  CategoryPieChart,
  BranchBarChart,
  SimpleTable,
  LowStockAlert,
  ActivityFeed,
  QuickActions,
} from "./DashboardSection";

function DashboardContent({ loading, data }) {
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Inject styles once on mount
  useEffect(() => {
    injectStyles(DASHBOARD_STYLES);
  }, []);

  const cards = data?.cards ?? {};
  const charts = data?.charts ?? {};
  const totalKategori = charts?.barang_per_kategori?.length ?? 0;

  const handleRefresh = useCallback(() => {
    setLastUpdated(new Date());
    if (data?.onRefresh) data.onRefresh();
  }, [data]);

  const stats = useMemo(() => [
    {
      label: "Total Aset",
      value: cards?.total_barang ?? "—",
      icon: MdInventory2,
      color: "#3b82f6",
      bg: "#eff6ff",
      delta: "aset terdaftar",
      trend: "+12%",
    },
    {
      label: "Barang Masuk",
      value: cards?.total_barang_masuk ?? "—",
      icon: MdNorth,
      color: PALETTE.masuk,
      bg: "#ecfdf5",
      delta: "bulan ini",
      trend: "+8.2%",
    },
    {
      label: "Barang Keluar",
      value: cards?.total_barang_keluar ?? "—",
      icon: MdSouth,
      color: PALETTE.keluar,
      bg: "#fffbeb",
      delta: "bulan ini",
      trend: "-3.1%",
    },
    {
      label: "Maintenance",
      value: cards?.total_maintenance ?? "—",
      icon: MdBuild,
      color: PALETTE.maint,
      bg: "#f5f3ff",
      delta: "aktif",
      trend: "+2",
    },
    {
      label: "Barang Rusak",
      value: cards?.total_barang_rusak ?? "—",
      icon: MdWarningAmber,
      color: PALETTE.rusak,
      bg: "#fef2f2",
      delta: "butuh tindakan",
      trend: "+5",
    },
    {
      label: "Kategori",
      value: totalKategori || "—",
      icon: MdSell,
      color: PALETTE.kategori,
      bg: "#ecfeff",
      delta: "kategori",
      trend: "-",
    },
  ], [cards, totalKategori]);

  if (loading) return <SkeletonDashboard />;

  return (
    <div className="space-y-8" style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <WelcomeBanner onRefresh={handleRefresh} lastUpdated={lastUpdated} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5 px-6">
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} delay={i * 80} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 px-6">
        <div className="xl:col-span-2">
          <MonthlyAreaChart data={charts?.masuk_keluar_per_bulan} />
        </div>
        <div>
          <CategoryPieChart data={charts?.barang_per_kategori} />
        </div>
      </div>

      {/* Branch Chart */}
      <div className="px-6">
        <BranchBarChart data={charts?.barang_per_cabang} />
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 px-6">
        <SimpleTable
          title="Barang Masuk Terbaru"
          rows={data?.tables?.barang_masuk_terbaru}
          type="masuk"
        />
        <SimpleTable
          title="Barang Rusak Terbaru"
          rows={data?.tables?.barang_rusak_terbaru}
          type="rusak"
        />
      </div>

      {/* Low Stock Alert */}
      <div className="px-6">
        <LowStockAlert
          rows={data?.alerts?.stok_rendah}
          total={data?.alerts?.total_stok_rendah}
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 pb-8">
        <div className="lg:col-span-2">
          <ActivityFeed activities={data?.recentActivity} />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}

export default memo(DashboardContent);