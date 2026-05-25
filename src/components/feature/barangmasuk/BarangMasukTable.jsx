import { memo } from "react";
import {
  MdEdit, MdDelete, MdInventory, MdStore, MdMeetingRoom,
  MdPerson, MdLocalShipping, MdCalendarToday, MdAttachMoney,
} from "react-icons/md";
import { formatRupiah } from "../../../utils/formatRupiah";

/* ── Column definitions ── */
const COLUMNS = [
  { key: "no",            label: "No",           width: "w-[60px]",  align: "text-center" },
  { key: "kode",          label: "Kode Barang",  width: "w-[120px]", align: "text-left"   },
  { key: "nama",          label: "Nama Barang",  width: "w-[180px]", align: "text-left"   },
  { key: "supplier",      label: "Supplier",     width: "w-[150px]", align: "text-left"   },
  { key: "cabang",        label: "Cabang",       width: "w-[140px]", align: "text-left"   },
  { key: "ruangan",       label: "Ruangan",      width: "w-[140px]", align: "text-left"   },
  { key: "jumlah",        label: "Jumlah",       width: "w-[80px]",  align: "text-center" },
  { key: "harga_satuan",  label: "Harga Satuan", width: "w-[130px]", align: "text-right"  },
  { key: "tanggal_masuk", label: "Tanggal",      width: "w-[120px]", align: "text-left"   },
  { key: "user",          label: "Petugas",      width: "w-[120px]", align: "text-left"   },
  { key: "aksi",          label: "Aksi",         width: "w-[90px]",  align: "text-center" },
];

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
      <td className="px-3 py-3"><Skel width="w-24" height="h-3" /></td>
      <td className="px-3 py-3"><Skel width="w-24" height="h-3" /></td>
      <td className="px-3 py-3"><Skel width="w-24" height="h-3" /></td>
      <td className="px-3 py-3 text-center"><Skel width="w-8" height="h-3" /></td>
      <td className="px-3 py-3 text-right"><Skel width="w-20" height="h-3" /></td>
      <td className="px-3 py-3"><Skel width="w-20" height="h-3" /></td>
      <td className="px-3 py-3"><Skel width="w-20" height="h-3" /></td>
      <td className="px-3 py-3 text-center">
        <div className="flex justify-center gap-1">
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
const DataRow = memo(function DataRow({ item, rowNum, idx, onEdit, onDelete, isLoading }) {
  return (
    <tr
      className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors duration-150"
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
        <span className="font-mono font-semibold text-[11px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md">
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

      {/* Supplier */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <MdLocalShipping size={12} className="text-orange-400 shrink-0" />
          <span className="text-xs text-gray-600 truncate max-w-[120px]" title={item.supplier?.name_supplier}>
            {item.supplier?.name_supplier || <span className="text-gray-400">-</span>}
          </span>
        </div>
      </td>

      {/* Cabang */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <MdStore size={12} className="text-gray-400 shrink-0" />
          <span className="text-xs text-gray-600 truncate max-w-[110px]" title={item.cabang?.name_cabang}>
            {item.cabang?.name_cabang || <span className="text-gray-400">-</span>}
          </span>
        </div>
      </td>

      {/* Ruangan */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <MdMeetingRoom size={12} className="text-gray-400 shrink-0" />
          <span className="text-xs text-gray-600 truncate max-w-[110px]" title={item.ruangan?.name_ruangan}>
            {item.ruangan?.name_ruangan || <span className="text-gray-400">-</span>}
          </span>
        </div>
      </td>

      {/* Jumlah */}
      <td className="px-3 py-3 text-center">
        <span className="inline-flex items-center justify-center font-bold text-sm text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md min-w-[40px]">
          {item.jumlah ?? 0}
        </span>
      </td>

      {/* Harga Satuan */}
      <td className="px-3 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <MdAttachMoney size={12} className="text-green-400 shrink-0" />
          <span className="text-xs font-semibold text-green-700 font-mono">
            {formatRupiah(item.harga_satuan)}
          </span>
        </div>
      </td>

      {/* Tanggal Masuk */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <MdCalendarToday size={12} className="text-blue-400 shrink-0" />
          <span className="text-xs text-gray-600 font-mono">
            {formatDate(item.tanggal_masuk)}
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
          <ActionBtn
            onClick={() => onEdit(item)}
            colorClass="text-blue-500 border-blue-200 bg-blue-50"
            hoverClass="hover:bg-blue-100 hover:border-blue-300"
            icon={MdEdit}
            label="Edit"
            disabled={isLoading}
          />
          <ActionBtn
            onClick={() => onDelete(item.id)}
            colorClass="text-red-400 border-red-200 bg-red-50"
            hoverClass="hover:bg-red-100 hover:border-red-300"
            icon={MdDelete}
            label="Hapus"
            disabled={isLoading}
          />
        </div>
      </td>
    </tr>
  );
});

/* ── Main Export ── */
const BarangMasukTable = memo(function BarangMasukTable({ data, onEdit, onDelete, isLoading, page = 1, limit = 10 }) {
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
            {/* Loading skeleton */}
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} index={i} />
            ))}

            {/* Empty state */}
            {!isLoading && (!data || data.length === 0) && (
              <tr>
                <td colSpan={11} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <MdInventory size={28} className="text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500 mb-1">
                        Belum ada data barang masuk
                      </p>
                      <p className="text-xs text-gray-400">
                        Tambahkan data barang masuk pertama
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!isLoading && data?.map((item, idx) => {
              const rowNum = (page - 1) * limit + idx + 1;
              return (
                <DataRow
                  key={item.id}
                  item={item}
                  rowNum={rowNum}
                  idx={idx}
                  onEdit={onEdit}
                  onDelete={onDelete}
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

export default BarangMasukTable;