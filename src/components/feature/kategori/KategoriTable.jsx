import { memo } from "react";
import { MdEdit, MdDelete, MdCategory } from "react-icons/md";

/* ── Column definitions ── */
const COLUMNS = [
  { key: "no", label: "No", width: "w-[60px]", align: "text-center" },
  { key: "name_kategori", label: "Nama Kategori", width: null, align: "text-left" },
  { key: "deskripsi", label: "Deskripsi", width: null, align: "text-left" },
  { key: "aksi", label: "Aksi", width: "w-[100px]", align: "text-center" },
];

const SkeletonRow = memo(function SkeletonRow({ index }) {
  return (
    <tr className={`animate-[tableFadeIn_0.3s_ease_${index * 50}ms_both]`}>
      <td className="px-4 py-3 text-center"><Skel width="w-6" height="h-3" /></td>
      <td className="px-4 py-3"><Skel width="w-20" height="h-3" /></td>
      <td className="px-4 py-3"><Skel width="w-28" height="h-3" /></td>
      <td className="px-4 py-3"><Skel width="w-40" height="h-3" /></td>
      <td className="px-4 py-3 text-center">
        <div className="flex justify-center gap-1.5">
          <Skel width="w-7" height="h-7" rounded="rounded-lg" />
          <Skel width="w-7" height="h-7" rounded="rounded-lg" />
        </div>
      </td>
    </tr>
  );
});

const Skel = memo(function Skel({ width = "w-20", height = "h-3", rounded = "rounded-md" }) {
  return <div className={`${width} ${height} ${rounded} bg-gray-200 animate-shimmer`} />;
});

const ActionBtn = memo(function ActionBtn({ onClick, colorClass, hoverClass, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-7 h-7 rounded-lg border transition-all duration-150 hover:scale-105 flex items-center justify-center ${colorClass} ${hoverClass}`}
    >
      <Icon size={14} />
    </button>
  );
});

function EmptyState() {
  return (
    <td colSpan={5} className="px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
          <MdCategory size={28} className="text-gray-300" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-1">Belum ada data kategori</p>
          <p className="text-xs text-gray-400">Tambahkan kategori pertama Anda</p>
        </div>
      </div>
    </td>
  );
}

const KategoriTable = memo(function KategoriTable({
  data,
  onEdit,
  onDelete,
  isLoading,
  page = 1,
  limit = 10,
}) {
  const startIndex = (page - 1) * limit;

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-['Sora']">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`${col.width || ""} ${col.align} px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap`}
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
                <EmptyState />
              </tr>
            )}

            {!isLoading && data?.map((item, idx) => (
              <DataRow
                key={item.id}
                item={item}
                rowNum={startIndex + idx + 1}
                idx={idx}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default KategoriTable;

const DataRow = memo(function DataRow({ item, rowNum, idx, onEdit, onDelete }) {
  const pastelColors = [
    { bg: "#eef2ff", border: "#c7d2fe", text: "#4f46e5", dot: "#818cf8" },
    { bg: "#ecfdf5", border: "#a7f3d0", text: "#059669", dot: "#34d399" },
    { bg: "#fef3c7", border: "#fde68a", text: "#d97706", dot: "#fbbf24" },
    { bg: "#ffe4e6", border: "#fecdd3", text: "#e11d48", dot: "#fb7185" },
    { bg: "#e0e7ff", border: "#c7d2fe", text: "#4338ca", dot: "#6366f1" },
  ];
  const colorScheme = pastelColors[idx % pastelColors.length];

  return (
    <tr
      className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors duration-150"
      style={{ animation: `tableFadeIn 0.3s ease ${idx * 40}ms both` }}
    >
      <td className="px-4 py-3 text-center">
        <span className="inline-flex items-center justify-center w-7 h-7 text-xs font-bold rounded-lg bg-gray-100 text-gray-500">
          {rowNum}
        </span>
      </td>

      <td className="px-4 py-3">
        <span
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full"
          style={{
            background: colorScheme.bg,
            color: colorScheme.text,
            border: `1px solid ${colorScheme.border}`,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: colorScheme.dot }} />
          {item.name_kategori}
        </span>
      </td>

      <td className="px-4 py-3">
        <span className="text-xs text-gray-500 line-clamp-1" title={item.deskripsi}>
          {item.deskripsi || "-"}
        </span>
      </td>

      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <ActionBtn
            onClick={() => onEdit(item)}
            colorClass="text-blue-500 border-blue-200 bg-blue-50"
            hoverClass="hover:bg-blue-100 hover:border-blue-300"
            icon={MdEdit}
            label="Edit"
          />
          <ActionBtn
            onClick={() => onDelete(item.id)}
            colorClass="text-red-400 border-red-200 bg-red-50"
            hoverClass="hover:bg-red-100 hover:border-red-300"
            icon={MdDelete}
            label="Hapus"
          />
        </div>
      </td>
    </tr>
  );
});