import { memo, useMemo } from "react";
import {
  MdInventory,
  MdStore,
  MdMeetingRoom,
  MdCalendarToday,
  MdPerson,
} from "react-icons/md";
import { formatTanggal } from "../../../utils/reportHelpers";

// ─── Kolom (module-level → tidak re-create tiap render) ──────────────────────
const COLUMNS = [
  { key: "no",             label: "No",             width: "w-[55px]",  align: "text-center" },
  { key: "kode",           label: "Kode Barang",    width: "w-[120px]", align: "text-left"   },
  { key: "nama",           label: "Nama Barang",    width: "w-[185px]", align: "text-left"   },
  { key: "cabang",         label: "Cabang",         width: "w-[140px]", align: "text-left"   },
  { key: "ruangan",        label: "Ruangan",        width: "w-[140px]", align: "text-left"   },
  { key: "jumlah_keluar",  label: "Jumlah Keluar",  width: "w-[130px]", align: "text-center" },
  { key: "tanggal_keluar", label: "Tanggal Keluar", width: "w-[140px]", align: "text-left"   },
  { key: "petugas",        label: "Petugas",        width: "w-[150px]", align: "text-left"   },
  { key: "keterangan",     label: "Keterangan",     width: "w-[180px]", align: "text-left"   },
];
const COL_COUNT = COLUMNS.length;

// ─── Skeleton ────────────────────────────────────────────────────────────────
const Skel = memo(function Skel({ width = "w-20", height = "h-3", rounded = "rounded-md" }) {
  return <div className={`${width} ${height} ${rounded} bg-gray-200 animate-shimmer inline-block`} />;
});

const SkeletonRow = memo(function SkeletonRow({ index }) {
  return (
    <tr style={{ animation: `tableFadeIn 0.3s ease ${index * 50}ms both` }}>
      <td className="px-3 py-3 text-center"><Skel width="w-5" /></td>
      <td className="px-3 py-3"><Skel width="w-16" /></td>
      <td className="px-3 py-3"><Skel width="w-32" /></td>
      <td className="px-3 py-3"><Skel width="w-20" /></td>
      <td className="px-3 py-3"><Skel width="w-20" /></td>
      <td className="px-3 py-3 text-center"><Skel width="w-12" /></td>
      <td className="px-3 py-3"><Skel width="w-24" /></td>
      <td className="px-3 py-3"><Skel width="w-20" /></td>
      <td className="px-3 py-3"><Skel width="w-28" /></td>
    </tr>
  );
});

// ─── Skeleton rows (pre-generated → tidak re-create array tiap render) ───────
const SKELETON_ROWS = Array.from({ length: 6 }, (_, i) => <SkeletonRow key={i} index={i} />);

// ─── DataRow ─────────────────────────────────────────────────────────────────
const DataRow = memo(function DataRow({ item, rowNum, idx }) {
  // formatTanggal hanya dipanggil sekali per baris karena memo
  const tanggalFormatted = formatTanggal(item.tanggal_keluar);

  return (
    <tr
      className="border-b border-gray-100 hover:bg-orange-50/30 transition-colors duration-150"
      style={{ animation: `tableFadeIn 0.3s ease ${idx * 35}ms both` }}
    >
      {/* No */}
      <td className="px-3 py-3 text-center">
        <span className="inline-flex items-center justify-center w-7 h-7 text-xs font-bold rounded-lg bg-gray-100 text-gray-500">
          {rowNum}
        </span>
      </td>

      {/* Kode Barang */}
      <td className="px-3 py-3">
        <span className="font-mono font-semibold text-[11px] bg-orange-50 text-orange-600 px-2 py-1 rounded-md">
          {item.barang?.kode_barang ?? "-"}
        </span>
      </td>

      {/* Nama Barang */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <MdInventory size={14} className="text-gray-400 shrink-0" />
          <span className="font-medium text-sm text-gray-900 truncate max-w-37.5" title={item.barang?.name}>
            {item.barang?.name ?? "-"}
          </span>
        </div>
      </td>

      {/* Cabang */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <MdStore size={12} className="text-gray-400" />
          <span className="text-xs text-gray-600 truncate max-w-27.5" title={item.cabang?.name_cabang}>
            {item.cabang?.name_cabang ?? <span className="text-gray-400">-</span>}
          </span>
        </div>
      </td>

      {/* Ruangan */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <MdMeetingRoom size={12} className="text-gray-400" />
          <span className="text-xs text-gray-600 truncate max-w-27.5" title={item.ruangan?.name_ruangan}>
            {item.ruangan?.name_ruangan ?? <span className="text-gray-400">-</span>}
          </span>
        </div>
      </td>

      {/* Jumlah Keluar */}
      <td className="px-3 py-3 text-center">
        <span className="inline-flex items-center justify-center font-bold text-sm text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md min-w-15">
          {item.jumlah_keluar ?? 0}
        </span>
      </td>

      {/* Tanggal Keluar */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <MdCalendarToday size={12} className="text-gray-400" />
          <span className="text-xs text-gray-600 font-mono">{tanggalFormatted}</span>
        </div>
      </td>

      {/* Petugas */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <MdPerson size={12} className="text-gray-400" />
          <span className="text-xs text-gray-600 truncate max-w-30" title={item.user?.name}>
            {item.user?.name ?? <span className="text-gray-400">-</span>}
          </span>
        </div>
      </td>

      {/* Keterangan */}
      <td className="px-3 py-3">
        <span className="text-xs text-gray-600 truncate max-w-37.5" title={item.keterangan}>
          {item.keterangan ?? <span className="text-gray-400">-</span>}
        </span>
      </td>
    </tr>
  );
});

// ─── TableHeader (memo → tidak re-render kecuali COLUMNS berubah) ────────────
const TableHeader = memo(function TableHeader() {
  return (
    <thead>
      <tr className="bg-gray-50 border-b border-gray-200">
        {COLUMNS.map((col) => (
          <th
            key={col.key}
            className={`${col.width ?? ""} ${col.align} px-3 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap`}
          >
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
  );
});

// ─── TableFooter (memo + menerima total yang sudah dihitung di parent) ────────
const TableFooter = memo(function TableFooter({ total }) {
  return (
    <tfoot>
      <tr className="bg-orange-50 border-t-2 border-orange-200">
        <td colSpan={5} className="px-3 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wide">
          Total
        </td>
        <td className="px-3 py-3 text-center">
          <span className="inline-flex items-center justify-center font-extrabold text-sm text-orange-700 bg-orange-100 px-3 py-1 rounded-lg">
            {total}
          </span>
        </td>
        <td colSpan={3} className="px-3 py-3" />
      </tr>
    </tfoot>
  );
});

// ─── Empty states (module-level agar tidak re-create tiap render) ─────────────
const EmptyUnfiltered = (
  <tr>
    <td colSpan={COL_COUNT} className="px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center">
          <MdInventory size={28} className="text-orange-300" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-1">
            Pilih periode untuk menampilkan laporan
          </p>
          <p className="text-xs text-gray-400">Tentukan periode dan filter di panel atas</p>
        </div>
      </div>
    </td>
  </tr>
);

const EmptyFiltered = (
  <tr>
    <td colSpan={COL_COUNT} className="px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
          <MdInventory size={28} className="text-gray-300" />
        </div>
        <p className="text-sm font-semibold text-gray-500">
          Tidak ada data barang keluar pada periode ini
        </p>
      </div>
    </td>
  </tr>
);

// ─── Main Table ───────────────────────────────────────────────────────────────
const LaporanBarangKeluarTable = memo(function LaporanBarangKeluarTable({ data, isLoading }) {
  const hasData = !isLoading && data && data.length > 0;

  // Total hanya di-hitung ulang jika `data` berubah (bukan setiap render)
  const total = useMemo(
    () => (data ? data.reduce((s, d) => s + (d.jumlah_keluar ?? 0), 0) : 0),
    [data],
  );

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-['Sora'] text-sm">
          <TableHeader />

          <tbody>
            {isLoading && SKELETON_ROWS}

            {!isLoading && !data && EmptyUnfiltered}

            {!isLoading && data && data.length === 0 && EmptyFiltered}

            {hasData &&
              data.map((item, idx) => (
                <DataRow key={item.id} item={item} rowNum={idx + 1} idx={idx} />
              ))}
          </tbody>

          {hasData && <TableFooter total={total} />}
        </table>
      </div>
    </div>
  );
});

export default LaporanBarangKeluarTable;