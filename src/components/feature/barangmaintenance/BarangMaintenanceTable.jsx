import { memo } from "react";
import {
  MdEdit, MdInventory, MdPerson,
  MdCalendarToday, MdOutlineDescription, MdBuild,
  MdCheckCircle, MdNumbers, MdAttachMoney,
} from "react-icons/md";
import { formatRupiah } from "../../../utils/formatRupiah";

/* ── Column definitions ── */
const COLUMNS = [
  { key: "no",                  label: "No",              width: "w-[60px]",  align: "text-center" },
  { key: "kode",                label: "Kode Barang",     width: "w-[120px]", align: "text-left"   },
  { key: "nama",                label: "Nama Barang",     width: "w-[180px]", align: "text-left"   },
  { key: "jumlah_maintenance",  label: "Jml",             width: "w-[70px]",  align: "text-center" },
  { key: "tanggal_maintenance", label: "Tgl Maintenance", width: "w-[130px]", align: "text-left"   },
  { key: "tanggal_selesai",     label: "Tgl Selesai",     width: "w-[120px]", align: "text-left"   },
  { key: "status",              label: "Status",          width: "w-[120px]", align: "text-center" },
  { key: "biaya",               label: "Biaya",           width: "w-[120px]", align: "text-right"  },
  { key: "keterangan",          label: "Keterangan",      width: "w-[160px]", align: "text-left"   },
  { key: "user",                label: "Petugas",         width: "w-[120px]", align: "text-left"   },
  { key: "aksi",                label: "Aksi",            width: "w-[110px]", align: "text-center" },
];

/* ── Status Badge ── */
const StatusBadge = memo(function StatusBadge({ status }) {
  if (status === "selesai") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
        <MdCheckCircle size={11} />
        Selesai
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <MdBuild size={11} className="animate-pulse" />
      Dalam Proses
    </span>
  );
});

/* ── Skeleton ── */
const Skel = memo(function Skel({ width = "w-20", height = "h-3", rounded = "rounded-md" }) {
  return (
    <div className={`${width} ${height} ${rounded} bg-gray-200 animate-shimmer inline-block`} />
  );
});

const SkeletonRow = memo(function SkeletonRow({ index }) {
  return (
    <tr style={{ animation: `tableFadeIn 0.3s ease ${index * 50}ms both` }}>
      <td className="px-3 py-3 text-center"><Skel width="w-6" height="h-3" /></td>
      <td className="px-3 py-3"><Skel width="w-20" height="h-3" /></td>
      <td className="px-3 py-3"><Skel width="w-28" height="h-3" /></td>
      <td className="px-3 py-3 text-center"><Skel width="w-8" height="h-3" /></td>
      <td className="px-3 py-3"><Skel width="w-24" height="h-3" /></td>
      <td className="px-3 py-3"><Skel width="w-24" height="h-3" /></td>
      <td className="px-3 py-3 text-center"><Skel width="w-20" height="h-5" rounded="rounded-full" /></td>
      <td className="px-3 py-3 text-right"><Skel width="w-20" height="h-3" /></td>
      <td className="px-3 py-3"><Skel width="w-28" height="h-3" /></td>
      <td className="px-3 py-3"><Skel width="w-20" height="h-3" /></td>
      <td className="px-3 py-3 text-center">
        <div className="flex justify-center gap-1">
          <Skel width="w-7" height="h-7" rounded="rounded-lg" />
          <Skel width="w-7" height="h-7" rounded="rounded-lg" />
          <Skel width="w-7" height="h-7" rounded="rounded-lg" />
        </div>
      </td>
    </tr>
  );
});

/* ── Action button ── */
const ActionBtn = memo(function ActionBtn({ onClick, colorClass, hoverClass, icon: Icon, label, disabled }) {
  return (
    <button
      onClick={onClick}
      title={label}
      disabled={disabled}
      className={`w-7 h-7 rounded-lg border transition-all duration-150 hover:scale-105 flex items-center justify-center ${colorClass} ${hoverClass} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <Icon size={15} />
    </button>
  );
});

/* ── Format date ── */
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/* ── Data Row ── */
const DataRow = memo(function DataRow({ item, rowNum, idx, onEdit, onSelesai, isLoading }) {
  const isSelesai = item.status === "selesai";

  return (
    <tr
      className="border-b border-gray-100 hover:bg-orange-50/30 transition-colors duration-150"
      style={{ animation: `tableFadeIn 0.3s ease ${idx * 40}ms both` }}
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
          {item.barang?.kode_barang || "-"}
        </span>
      </td>

      {/* Nama Barang */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <MdInventory size={14} className="text-gray-400 shrink-0" />
          <span className="font-medium text-sm text-gray-900 truncate max-w-[160px]" title={item.barang?.name}>
            {item.barang?.name || "-"}
          </span>
        </div>
      </td>

      {/* Jumlah Maintenance */}
      <td className="px-3 py-3 text-center">
        <span className="inline-flex items-center justify-center font-bold text-sm text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md min-w-[36px]">
          {item.jumlah_maintenance ?? 0}
        </span>
      </td>

      {/* Tanggal Maintenance */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <MdCalendarToday size={12} className="text-orange-400 shrink-0" />
          <span className="text-xs text-gray-600 font-mono">
            {formatDate(item.tanggal_maintenance)}
          </span>
        </div>
      </td>

      {/* Tanggal Selesai */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <MdCalendarToday size={12} className="text-green-400 shrink-0" />
          <span className="text-xs text-gray-600 font-mono">
            {formatDate(item.tanggal_selesai)}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-3 text-center">
        <StatusBadge status={item.status} />
      </td>

      {/* Biaya */}
      <td className="px-3 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <MdAttachMoney size={12} className="text-orange-400 shrink-0" />
          <span className="text-xs font-semibold text-orange-700 font-mono">
            {formatRupiah(item.biaya)}
          </span>
        </div>
      </td>

      {/* Keterangan */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <MdOutlineDescription size={12} className="text-gray-400 shrink-0" />
          <span className="text-xs text-gray-500 truncate max-w-[130px]" title={item.keterangan}>
            {item.keterangan || <span className="text-gray-400">-</span>}
          </span>
        </div>
      </td>

      {/* Petugas */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <MdPerson size={12} className="text-gray-400 shrink-0" />
          <span className="text-xs text-gray-600 truncate max-w-[100px]" title={item.user?.name}>
            {item.user?.name || <span className="text-gray-400">-</span>}
          </span>
        </div>
      </td>

      {/* Aksi */}
      <td className="px-3 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          {/* Tombol Selesai — hanya tampil jika status bukan selesai */}
          {!isSelesai && (
            <ActionBtn
              onClick={() => onSelesai(item)}
              colorClass="text-green-600 border-green-200 bg-green-50"
              hoverClass="hover:bg-green-100 hover:border-green-300"
              icon={MdCheckCircle}
              label="Tandai Selesai"
              disabled={isLoading}
            />
          )}
          <ActionBtn
            onClick={() => onEdit(item)}
            colorClass="text-blue-500 border-blue-200 bg-blue-50"
            hoverClass="hover:bg-blue-100 hover:border-blue-300"
            icon={MdEdit}
            label="Edit"
            disabled={isLoading || isSelesai}
          />
        </div>
      </td>
    </tr>
  );
});

/* ── Main Export ── */
const BarangMaintenanceTable = memo(function BarangMaintenanceTable({
  data, onEdit, onSelesai, isLoading, page = 1, limit = 10,
}) {
  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-['Sora'] text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`${col.width || ""} ${col.align} px-3 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} index={i} />
            ))}

            {!isLoading && (!data || data.length === 0) && (
              <tr>
                <td colSpan={11} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <MdBuild size={28} className="text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500 mb-1">
                        Belum ada data maintenance
                      </p>
                      <p className="text-xs text-gray-400">
                        Tambahkan data maintenance barang pertama
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && data?.map((item, idx) => {
              const rowNum = (page - 1) * limit + idx + 1;
              return (
                <DataRow
                  key={item.id}
                  item={item}
                  rowNum={rowNum}
                  idx={idx}
                  onEdit={onEdit}
                  onSelesai={onSelesai}
                  isLoading={isLoading}
                />
              );
            })}
          </tbody>
        </table>
      </div>


    </div>
  );
});

export default BarangMaintenanceTable;