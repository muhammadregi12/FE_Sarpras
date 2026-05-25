import { memo, useMemo } from "react";
import {
  MdInventory,
  MdCategory,
  MdMeetingRoom,
} from "react-icons/md";

/* ── Column definitions ── */
const COLUMNS = [
  { key: "no",              label: "No",          width: "w-[55px]",  align: "text-center" },
  { key: "kode",            label: "Kode Barang", width: "w-[120px]", align: "text-left"   },
  { key: "nama",            label: "Nama Barang", width: "w-[200px]", align: "text-left"   },
  { key: "kategori",        label: "Kategori",    width: "w-[140px]", align: "text-left"   },
  { key: "ruangan",         label: "Ruangan",     width: "w-[150px]", align: "text-left"   },
  { key: "jumlah",          label: "Jumlah",      width: "w-[80px]",  align: "text-center" },
  { key: "satuan",          label: "Satuan",      width: "w-[80px]",  align: "text-left"   },
  { key: "tahun_pengadaan", label: "Tahun",       width: "w-[80px]",  align: "text-center" },
  { key: "keterangan",      label: "Keterangan",  width: "w-[180px]", align: "text-left"   },
];

const COL_SPAN = COLUMNS.length;

/* ── Skeleton ── */
const Skel = memo(function Skel({ width = "w-20", height = "h-3" }) {
  return <div className={`${width} ${height} rounded-md bg-gray-200 animate-shimmer inline-block`} />;
});

const SkeletonRow = memo(function SkeletonRow({ index }) {
  return (
    <tr style={{ animation: `tableFadeIn 0.3s ease ${index * 50}ms both` }}>
      <td className="px-3 py-3 text-center"><Skel width="w-5"  height="h-3" /></td>
      <td className="px-3 py-3"><Skel width="w-16" /></td>
      <td className="px-3 py-3"><Skel width="w-32" /></td>
      <td className="px-3 py-3"><Skel width="w-20" /></td>
      <td className="px-3 py-3"><Skel width="w-24" /></td>
      <td className="px-3 py-3 text-center"><Skel width="w-8" /></td>
      <td className="px-3 py-3"><Skel width="w-12" /></td>
      <td className="px-3 py-3 text-center"><Skel width="w-10" /></td>
      <td className="px-3 py-3"><Skel width="w-28" /></td>
    </tr>
  );
});

/* Skeleton rows pre-baked — tidak perlu Array.from setiap render */
const SKELETON_ROWS = Array.from({ length: 6 }, (_, i) => <SkeletonRow key={i} index={i} />);

/* ── Data Row ── */
const DataRow = memo(function DataRow({ item, rowNum, idx }) {
  return (
    <tr
      className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors duration-150"
      style={{ animation: `tableFadeIn 0.3s ease ${idx * 35}ms both` }}
    >
      <td className="px-3 py-3 text-center">
        <span className="inline-flex items-center justify-center w-7 h-7 text-xs font-bold rounded-lg bg-gray-100 text-gray-500">
          {rowNum}
        </span>
      </td>

      <td className="px-3 py-3">
        <span className="font-mono font-semibold text-[11px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md">
          {item.kode_barang}
        </span>
      </td>

      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <MdInventory size={14} className="text-gray-400 shrink-0" />
          <span className="font-medium text-sm text-gray-900 truncate max-w-[165px]" title={item.name}>
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
          <span className="text-xs text-gray-600 truncate max-w-[115px]" title={item.ruangan?.name_ruangan}>
            {item.ruangan?.name_ruangan ?? <span className="text-gray-400">-</span>}
          </span>
        </div>
      </td>

      <td className="px-3 py-3 text-center">
        <span className="inline-flex items-center justify-center font-bold text-sm text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md min-w-[40px]">
          {item.jumlah ?? 0}
        </span>
      </td>

      <td className="px-3 py-3">
        <span className="text-xs text-gray-500">{item.satuan ?? "-"}</span>
      </td>

      <td className="px-3 py-3 text-center">
        <span className="text-xs text-gray-500 font-mono">{item.tahun_pengadaan}</span>
      </td>

      <td className="px-3 py-3">
        <span className="text-xs text-gray-500 truncate max-w-[150px] block" title={item.keterangan}>
          {item.keterangan ?? <span className="text-gray-400">-</span>}
        </span>
      </td>
    </tr>
  );
});

/* ── Main Export ── */
const LaporanBarangTable = memo(function LaporanBarangTable({ data, isLoading, totalJumlah }) {
  const hasData = !isLoading && data?.length > 0;

  /**
   * Fallback total hanya dihitung jika prop totalJumlah tidak disediakan.
   * useMemo mencegah kalkulasi ulang saat re-render tidak relevan.
   */
  const computedTotal = useMemo(() => {
    if (totalJumlah != null) return totalJumlah;
    return data?.reduce((s, b) => s + (b.jumlah ?? 0), 0) ?? 0;
  }, [totalJumlah, data]);

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-['Sora'] text-sm">
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

          <tbody>
            {/* Loading skeleton */}
            {isLoading && SKELETON_ROWS}

            {/* Belum ada filter */}
            {!isLoading && !data && (
              <tr>
                <td colSpan={COL_SPAN} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                      <MdInventory size={28} className="text-blue-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500 mb-1">
                        Pilih filter untuk menampilkan laporan
                      </p>
                      <p className="text-xs text-gray-400">
                        Tentukan cabang atau ruangan di panel filter di atas
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {/* Filter dipilih, tidak ada data */}
            {!isLoading && data && data.length === 0 && (
              <tr>
                <td colSpan={COL_SPAN} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <MdInventory size={28} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-500">
                      Tidak ada barang ditemukan untuk filter ini
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {hasData && data.map((item, idx) => (
              <DataRow key={item.id} item={item} rowNum={idx + 1} idx={idx} />
            ))}
          </tbody>

          {/* Footer total */}
          {hasData && (
            <tfoot>
              <tr className="bg-blue-50 border-t-2 border-blue-200">
                <td colSpan={5} className="px-3 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Total Jumlah
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="inline-flex items-center justify-center font-extrabold text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-lg min-w-[40px]">
                    {computedTotal}
                  </span>
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
});

export default LaporanBarangTable;