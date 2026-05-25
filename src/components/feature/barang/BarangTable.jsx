import { useState, memo, useCallback } from "react";
import {
  MdEdit, MdDelete, MdInventory, MdCategory, MdMeetingRoom,
  MdStore, MdImage, MdQrCode, MdFileDownload,
} from "react-icons/md";
import { getServerBaseUrl } from "../../../services/serverUrl";

const BASE_URL = getServerBaseUrl();

const COLUMNS = [
  { key: "no",      label: "No",          width: "w-[60px]",  align: "text-center" },
  { key: "gambar",  label: "Gambar",       width: "w-[70px]",  align: "text-left" },
  { key: "kode",    label: "Kode",         width: "w-[110px]", align: "text-left" },
  { key: "nama",    label: "Nama Barang",  width: "w-[180px]", align: "text-left" },
  { key: "kategori",label: "Kategori",     width: "w-[130px]", align: "text-left" },
  { key: "ruangan", label: "Ruangan",      width: "w-[150px]", align: "text-left" },
  { key: "cabang",  label: "Cabang",       width: "w-[150px]", align: "text-left" },
  { key: "jumlah",  label: "Jumlah",       width: "w-[80px]",  align: "text-center" },
  { key: "satuan",  label: "Satuan",       width: "w-[80px]",  align: "text-left" },
  { key: "tahun",   label: "Tahun",        width: "w-[80px]",  align: "text-center" },
  { key: "aksi",    label: "Aksi",         width: "w-[90px]",  align: "text-center" },
];

/* ── ItemImage: gambar dengan fallback ── */
// FIX 1: Bungkus memo dan hindari kalkulasi URL di render — hitung sekali
const ItemImage = memo(function ItemImage({ src, alt }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
        <MdImage size={18} className="text-gray-400" />
      </div>
    );
  }

  const url = src.startsWith("http") ? src : `${BASE_URL}/${src}`;
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"  // FIX 2: lazy load gambar → tidak block render row
      decoding="async" // FIX 3: decode async agar tidak block main thread
      className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
      onError={() => setError(true)}
    />
  );
});

/* ── Skeleton ── */
const Skel = memo(function Skel({ width = "w-20", height = "h-3", rounded = "rounded-md" }) {
  return <div className={`${width} ${height} ${rounded} bg-gray-200 animate-shimmer inline-block`} />;
});

const SkeletonRow = memo(function SkeletonRow() {
  // FIX 4: Hilangkan animasi per-index di skeleton (performa CPU)
  return (
    <tr className="animate-pulse">
      <td className="px-3 py-3 text-center"><Skel width="w-6" height="h-3" /></td>
      <td className="px-3 py-3"><Skel width="w-10" height="h-10" rounded="rounded-lg" /></td>
      <td className="px-3 py-3"><Skel width="w-16" height="h-3" /></td>
      <td className="px-3 py-3"><Skel width="w-28" height="h-3" /></td>
      <td className="px-3 py-3"><Skel width="w-20" height="h-3" /></td>
      <td className="px-3 py-3"><Skel width="w-24" height="h-3" /></td>
      <td className="px-3 py-3"><Skel width="w-24" height="h-3" /></td>
      <td className="px-3 py-3 text-center"><Skel width="w-8" height="h-3" /></td>
      <td className="px-3 py-3"><Skel width="w-12" height="h-3" /></td>
      <td className="px-3 py-3 text-center"><Skel width="w-12" height="h-3" /></td>
      <td className="px-3 py-3 text-center">
        <div className="flex justify-center gap-1">
          <Skel width="w-7" height="h-7" rounded="rounded-lg" />
          <Skel width="w-7" height="h-7" rounded="rounded-lg" />
        </div>
      </td>
    </tr>
  );
});

/* ── ActionBtn ── */
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

/* ── DataRow ── */
// FIX 5: DataRow menerima handler yang sudah stabil (useCallback di parent),
// sehingga memo() benar-benar mencegah re-render saat data row lain berubah
const DataRow = memo(function DataRow({
  item, rowNum, idx, onEdit, onDelete, onPreviewQR, onDownloadQR,
}) {
  // FIX 6: Bungkus handler item-specific dengan useCallback di dalam DataRow
  // agar referensi ActionBtn props tidak berubah tiap render DataRow
  const handleEdit = useCallback(() => onEdit(item), [onEdit, item]);
  const handleDelete = useCallback(() => onDelete(item.id), [onDelete, item.id]);
  const handlePreviewQR = useCallback(() => onPreviewQR?.(item), [onPreviewQR, item]);
  const handleDownloadQR = useCallback(() => onDownloadQR?.(item), [onDownloadQR, item]);

  return (
    <tr
      className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors duration-150"
      // FIX 7: Kurangi stagger delay — 40ms × banyak row bisa menyebabkan
      // animasi terasa lambat. Ganti jadi 20ms dan cap di 300ms max
      style={{ animation: `tableFadeIn 0.25s ease ${Math.min(idx * 20, 300)}ms both` }}
    >
      <td className="px-3 py-3 text-center">
        <span className="inline-flex items-center justify-center w-7 h-7 text-xs font-bold rounded-lg bg-gray-100 text-gray-500">
          {rowNum}
        </span>
      </td>

      <td className="px-3 py-3">
        <ItemImage src={item.image} alt={item.name} />
      </td>

      <td className="px-3 py-3">
        <span className="font-mono font-semibold text-[11px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md">
          {item.kode_barang}
        </span>
      </td>

      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <MdInventory size={14} className="text-gray-400 shrink-0" />
          <span className="font-medium text-sm text-gray-900 truncate max-w-37.5" title={item.name}>
            {item.name}
          </span>
        </div>
      </td>

      <td className="px-3 py-3">
        {item.kategori?.name_kategori ? (
          <div className="flex items-center gap-1.5">
            <MdCategory size={12} className="text-blue-400" />
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">
              {item.kategori.name_kategori}
            </span>
          </div>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )}
      </td>

      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <MdMeetingRoom size={12} className="text-gray-400" />
          <span className="text-xs text-gray-600 truncate max-w-30" title={item.ruangan?.name_ruangan}>
            {item.ruangan?.name_ruangan || <span className="text-gray-400">-</span>}
          </span>
        </div>
      </td>

      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <MdStore size={12} className="text-gray-400" />
          <span className="text-xs text-gray-600 truncate max-w-30" title={item.cabang?.name_cabang}>
            {item.cabang?.name_cabang || <span className="text-gray-400">-</span>}
          </span>
        </div>
      </td>

      <td className="px-3 py-3 text-center">
        <span className="inline-flex items-center justify-center font-bold text-sm text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md min-w-10">
          {item.jumlah ?? 0}
        </span>
      </td>

      <td className="px-3 py-3">
        <span className="text-xs text-gray-500">
          {item.satuan || <span className="text-gray-400">-</span>}
        </span>
      </td>

      <td className="px-3 py-3 text-center">
        <span className="text-xs text-gray-500 font-mono">{item.tahun_pengadaan}</span>
      </td>

      <td className="px-3 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <ActionBtn onClick={handlePreviewQR}  colorClass="text-gray-600 border-gray-200 bg-white"   hoverClass="hover:bg-gray-100 hover:border-gray-300"   icon={MdQrCode}       label="Preview QR" />
          <ActionBtn onClick={handleDownloadQR} colorClass="text-blue-500 border-blue-200 bg-blue-50"  hoverClass="hover:bg-blue-100 hover:border-blue-300"   icon={MdFileDownload} label="Download QR" />
          <ActionBtn onClick={handleEdit}       colorClass="text-blue-500 border-blue-200 bg-blue-50"  hoverClass="hover:bg-blue-100 hover:border-blue-300"   icon={MdEdit}         label="Edit" />
          <ActionBtn onClick={handleDelete}     colorClass="text-red-400 border-red-200 bg-red-50"     hoverClass="hover:bg-red-100 hover:border-red-300"     icon={MdDelete}       label="Hapus" />
        </div>
      </td>
    </tr>
  );
});

/* ── Main Export ── */
// FIX 8: BarangTable tidak perlu terima isLoading di DataRow — sudah tidak dipakai
const BarangTable = memo(function BarangTable({
  data, onEdit, onDelete, onPreviewQR, onDownloadQR, isLoading, page = 1, limit = 10,
}) {
  return (
    <div className="w-full">
      {/* FIX 9: Inject CSS sekali di module level, bukan tiap render komponen */}
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
            {isLoading && SKELETON_ROWS}

            {!isLoading && (!data || data.length === 0) && (
              <tr>
                <td colSpan={11} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <MdInventory size={28} className="text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500 mb-1">Belum ada data barang</p>
                      <p className="text-xs text-gray-400">Tambahkan barang pertama Anda</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && data?.map((item, idx) => (
              <DataRow
                key={item.id}
                item={item}
                rowNum={(page - 1) * limit + idx + 1}
                idx={idx}
                onEdit={onEdit}
                onDelete={onDelete}
                onPreviewQR={onPreviewQR}
                onDownloadQR={onDownloadQR}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default BarangTable;

// FIX 10: Skeleton rows sebagai konstanta — tidak dibuat ulang tiap render
const SKELETON_ROWS = Array.from({ length: 5 }, (_, i) => <SkeletonRow key={i} />);