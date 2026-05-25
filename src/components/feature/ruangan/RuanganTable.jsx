import { memo } from "react";
import { MdEdit, MdDelete, MdMeetingRoom, MdBadge, MdQrCode, MdFileDownload } from "react-icons/md";

const COLUMNS = [
  { key: "no", label: "No", width: "w-[60px]", align: "text-center" },
  { key: "kode_ruangan", label: "Kode Ruangan", width: "w-[160px]", align: "text-left" },
  { key: "name_ruangan", label: "Nama Ruangan", width: null, align: "text-left" },
  { key: "aksi", label: "Aksi", width: "w-[100px]", align: "text-center" },
];

const Skel = memo(function Skel({ width = "w-20", height = "h-3", rounded = "rounded-md" }) {
  return <div className={`${width} ${height} ${rounded} bg-gray-200 animate-shimmer inline-block`} />;
});

const SkeletonRow = memo(function SkeletonRow({ index }) {
  return (
    <tr className={`animate-[tableFadeIn_0.3s_ease_${index * 50}ms_both]`}>
      <td className="px-4 py-3 text-center"><Skel width="w-6" height="h-3" /></td>
      <td className="px-4 py-3"><Skel width="w-20" height="h-3" /></td>
      <td className="px-4 py-3"><Skel width="w-36" height="h-3" /></td>
      <td className="px-4 py-3 text-center">
        <div className="flex justify-center gap-1.5">
          <Skel width="w-7" height="h-7" rounded="rounded-lg" />
          <Skel width="w-7" height="h-7" rounded="rounded-lg" />
        </div>
      </td>
    </tr>
  );
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

const DataRow = memo(function DataRow({ item, rowNum, idx, onEdit, onPreviewQR, onDownloadQR, onExportPDF }) {
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
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <MdBadge size={12} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{item.kode_ruangan}</p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="text-sm text-gray-700 font-medium">{item.name_ruangan}</div>
      </td>

      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <ActionBtn
            onClick={() => onPreviewQR && onPreviewQR(item)}
            colorClass="text-gray-600 border-gray-200 bg-white"
            hoverClass="hover:bg-gray-100 hover:border-gray-300"
            icon={MdQrCode}
            label="Preview QR"
          />
          <ActionBtn
            onClick={() => onDownloadQR && onDownloadQR(item)}
            colorClass="text-blue-500 border-blue-200 bg-blue-50"
            hoverClass="hover:bg-blue-100 hover:border-blue-300"
            icon={MdFileDownload}
            label="Download QR"
          />
          <ActionBtn
            onClick={() => onExportPDF && onExportPDF(item)}
            colorClass="text-red-500 border-red-200 bg-red-50"
            hoverClass="hover:bg-red-100 hover:border-red-300"
            icon={MdDelete}
            label="Hapus"
          />
          <ActionBtn
            onClick={() => onEdit(item)}
            colorClass="text-blue-500 border-blue-200 bg-blue-50"
            hoverClass="hover:bg-blue-100 hover:border-blue-300"
            icon={MdEdit}
            label="Edit"
          />
        </div>
      </td>
    </tr>
  );
});

const RuanganTable = memo(function RuanganTable({ data, onEdit, onPreviewQR, onDownloadQR, onExportPDF, isLoading, page = 1, limit = 10 }) {
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
            {isLoading && Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} index={i} />
            ))}

            {!isLoading && (!data || data.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <MdMeetingRoom size={28} className="text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500 mb-1">Belum ada data ruangan</p>
                      <p className="text-xs text-gray-400">Tambahkan ruangan pertama Anda</p>
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
                  onPreviewQR={onPreviewQR}
                  onDownloadQR={onDownloadQR}
                  onExportPDF={onExportPDF}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default RuanganTable;
