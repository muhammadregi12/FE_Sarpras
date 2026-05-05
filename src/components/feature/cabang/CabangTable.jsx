/**
 * CabangTable.jsx — SARPRAS Table Component
 *
 * Features:
 *  - Light/white theme bersih dan profesional
 *  - Stagger row entrance animation
 *  - Skeleton loading per baris (bukan spinner)
 *  - Row numbering berdasarkan page & limit
 *  - Empty state bergambar
 *  - Action button dengan tooltip
 *  - Menggunakan Tailwind CSS
 */

import { MdEdit, MdDelete, MdStore, MdLocationOn } from "react-icons/md";

/* ── Column definitions ── */
const COLUMNS = [
  { key: "no", label: "No", width: "w-[60px]", align: "text-center" },
  { key: "name_cabang", label: "Nama Cabang", width: "w-[260px]", align: "text-left" },
  { key: "daerah_cabang", label: "Daerah", width: "w-[160px]", align: "text-left" },
  { key: "aksi", label: "Aksi", width: "w-[100px]", align: "text-center" },
];

/* ── Skeleton row ── */
function SkeletonRow({ index }) {
  return (
    <tr className={`animate-[tableFadeIn_0.3s_ease_${index * 50}ms_both]`}>
      <td className="px-4 py-3 text-center"><Skel width="w-6" height="h-3" /></td>
      <td className="px-4 py-3"><Skel width="w-32" height="h-3" /></td>
      <td className="px-4 py-3"><Skel width="w-24" height="h-3" /></td>
      <td className="px-4 py-3 text-center">
        <div className="flex justify-center gap-1.5">
          <Skel width="w-7" height="h-7" rounded="rounded-lg" />
          <Skel width="w-7" height="h-7" rounded="rounded-lg" />
        </div>
      </td>
    </tr>
  );
}

function Skel({ width = "w-20", height = "h-3", rounded = "rounded-md" }) {
  return (
    <div className={`${width} ${height} ${rounded} bg-gray-200 animate-shimmer inline-block`} />
  );
}

/* ── Action button ── */
function ActionBtn({ onClick, colorClass, hoverClass, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-7 h-7 rounded-lg border transition-all duration-150 hover:scale-105 flex items-center justify-center ${colorClass} ${hoverClass}`}
    >
      <Icon size={14} />
    </button>
  );
}

/* ── Main Export ── */
export default function CabangTable({ data, onEdit, onDelete, isLoading, page = 1, limit = 10 }) {
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
            {/* Loading: tampilkan 5 skeleton row */}
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} index={i} />
            ))}

            {/* Empty state */}
            {!isLoading && (!data || data.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <MdStore size={28} className="text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500 mb-1">
                        Belum ada data cabang
                      </p>
                      <p className="text-xs text-gray-400">
                        Tambahkan cabang pertama Anda
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
                />
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{TABLE_CSS}</style>
    </div>
  );
}

/* ── Data Row Component ── */
function DataRow({ item, rowNum, idx, onEdit, onDelete }) {
  return (
    <tr
      className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors duration-150"
      style={{ animation: `tableFadeIn 0.3s ease ${idx * 40}ms both` }}
    >
      {/* No */}
      <td className="px-4 py-3 text-center">
        <span className="inline-flex items-center justify-center w-7 h-7 text-xs font-bold rounded-lg bg-gray-100 text-gray-500">
          {rowNum}
        </span>
      </td>

      {/* Nama Cabang */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <MdStore size={12} className="text-blue-600" />
          </div>
          <span className="font-medium text-sm text-gray-900">{item.name_cabang}</span>
        </div>
      </td>

      {/* Daerah */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <MdLocationOn size={14} className="text-gray-400 shrink-0" />
          <span className="text-sm text-gray-600">{item.daerah_cabang}</span>
        </div>
      </td>

      {/* Aksi */}
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
}

const TABLE_CSS = `

@keyframes tableFadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shimmer {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}

.animate-shimmer {
  animation: shimmer 1.5s ease-in-out infinite;
}
`;