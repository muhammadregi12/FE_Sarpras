import {
  MdSpaceDashboard,
  MdFolder,
  MdInventory2,
  MdSell,
  MdBusiness,
  MdStorefront,
  MdLocalShipping,
  MdBarChart,
  MdQrCodeScanner,
} from "react-icons/md";

export const navItems = [
  {
    group: "Utama",
    items: [{ to: "/dashboard", label: "Dashboard", icon: MdSpaceDashboard }],
  },
  {
    group: "Manajemen",
    items: [
      {
        label: "Master",
        icon: MdFolder,
        children: [
          { to: "/barang", label: "Barang", icon: MdInventory2 },
          { to: "/kategori", label: "Kategori", icon: MdSell },
          { to: "/ruangan", label: "Ruangan", icon: MdBusiness },
          { to: "/cabang", label: "Cabang", icon: MdStorefront },
          { to: "/supplier", label: "Supplier", icon: MdLocalShipping },
        ],
      },
    ],
  },
  {
    group: "Tracking",
    items: [
      {
        label: "Barang",
        icon: MdInventory2,
        children: [
          { to: "/barang-masuk", label: "Masuk", icon: MdInventory2 },
          { to: "/barang-rusak", label: "Rusak", icon: MdInventory2 },
          { to: "/maintenance", label: "Maintenance", icon: MdInventory2 },
          { to: "/barang-keluar", label: "Keluar", icon: MdInventory2 },
        ],
      },
    ],
  },
  {
    group: "Laporan",
    items: [
      {
        label: "Laporan",
        icon: MdBarChart,
        children: [
          { to: "/laporan-barang", label: "Laporan Barang", icon: MdBarChart },
          { to: "/laporan/barang-masuk", label: "Barang Masuk", icon: MdInventory2 },
          { to: "/laporan/barang-keluar", label: "Barang Keluar", icon: MdInventory2 },
          { to: "/laporan/barang-rusak", label: "Barang Rusak", icon: MdInventory2 },
        ],
      },
      { to: "/scan", label: "Scan QR", icon: MdQrCodeScanner },
    ],
  },
];