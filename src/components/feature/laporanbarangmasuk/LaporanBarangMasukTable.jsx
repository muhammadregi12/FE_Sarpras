import { memo, useMemo } from "react";
import {
  MdInventory,
  MdLocalShipping,
  MdStore,
  MdMeetingRoom,
  MdCalendarToday,
} from "react-icons/md";
import { formatTanggal } from "../../../utils/reportHelpers";
import { formatRupiah }  from "../../../utils/formatRupiah";

// ─── Statis — di luar komponen ────────────────────────────────────────────────
const COLUMNS = [
  { key: "no",            label: "No",            width: "w-[55px]",  align: "text-center" },
  { key: "kode",          label: "Kode Barang",   width: "w-[120px]", align: "text-left"   },
  { key: "nama",          label: "Nama Barang",   width: "w-[185px]", align: "text-left"   },
  { key: "supplier",      label: "Supplier",      width: "w-[150px]", align: "text-left"   },
  { key: "cabang",        label: "Cabang",        width: "w-[140px]", align: "text-left"   },
  { key: "ruangan",       label: "Ruangan",       width: "w-[140px]", align: "text-left"   },
  { key: "jumlah",        label: "Jumlah",        width: "w-[80px]",  align: "text-center" },
  { key: "harga_satuan",  label: "Harga Satuan",  width: "w-[130px]", align: "text-right"  },
  { key: "total_harga",   label: "Total Harga",   width: "w-[140px]", align: "text-right"  },
  { key: "tanggal_masuk", label: "Tanggal Masuk", width: "w-[140px]", align: "text-left"   },
];

// OPTIMASI: array statis — dibuat sekali, tidak perlu useMemo di dalam komponen
const SKELETON_INDICES = Array.from({ length: 6 }, (_, i) => i);

/* ── Skeleton ── */
const Skel = memo(function Skel({ width = "w-20", height = "h-3", rounded = "rounded-md" }) {
  return <div className={`${width} ${height} ${rounded} bg-gray-200 animate-shimmer inline-block`} />;
});

const SkeletonRow = memo(function SkeletonRow({ index }) {
  return (
    <tr style={{ animation: `tableFadeIn 0.3s ease ${index * 50}ms both` }}>
      <td className="px-3 py-3 text-center"><Skel width="w-5" /></td>
      <td className="px-3 py-3"><Skel width="w-16" /></td>
      <td className="px-3 py-3"><Skel width="w-32" /></td>
      <td className="px-3 py-3"><Skel width="w-24" /></td>
      <td className="px-3 py-3"><Skel width="w-20" /></td>
      <td className="px-3 py-3"><Skel width="w-20" /></td>
      <td className="px-3 py-3 text-center"><Skel width="w-8" /></td>
      <td className="px-3 py-3 text-right"><Skel width="w-20" /></td>
      <td className="px-3 py-3 text-right"><Skel width="w-24" /></td>
      <td className="px-3 py-3"><Skel width="w-24" /></td>
    </tr>
  );
});

/* ── Data Row ── */
const DataRow = memo(function DataRow({ item, rowNum, idx }) {
  // OPTIMASI: totalHarga dihitung sekali saat row ini di-render,
  // tidak akan dihitung ulang kecuali item berubah (karena DataRow di-memo)
  const totalHarga = (item.jumlah ?? 0) * (item.harga_satuan ?? 0);

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
          {item.barang?.kode_barang ?? "-"}
        </span>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <MdInventory size={14} className="text-gray-400 shrink-0" />
          <span className="font-medium text-sm text-gray-900 truncate max-w-37.5" title={item.barang?.name}>
            {item.barang?.name ?? "-"}
          </span>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <MdLocalShipping size={12} className="text-indigo-400 shrink-0" />
          <span className="text-xs text-gray-600 truncate max-w-28.75" title={item.supplier?.name_supplier}>
            {item.supplier?.name_supplier ?? <span className="text-gray-400">-</span>}
          </span>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <MdStore size={12} className="text-gray-400" />
          <span className="text-xs text-gray-600 truncate max-w-27.5" title={item.cabang?.name_cabang}>
            {item.cabang?.name_cabang ?? <span className="text-gray-400">-</span>}
          </span>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <MdMeetingRoom size={12} className="text-gray-400" />
          <span className="text-xs text-gray-600 truncate max-w-27.5" title={item.ruangan?.name_ruangan}>
            {item.ruangan?.name_ruangan ?? <span className="text-gray-400">-</span>}
          </span>
        </div>
      </td>
      <td className="px-3 py-3 text-center">
        <span className="inline-flex items-center justify-center font-bold text-sm text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md min-w-10">
          {item.jumlah ?? 0}
        </span>
      </td>
      <td className="px-3 py-3 text-right">
        <span className="text-xs text-gray-600 font-mono">
          {formatRupiah(item.harga_satuan)}
        </span>
      </td>
      <td className="px-3 py-3 text-right">
        <span className="text-xs font-bold text-blue-700 font-mono">
          {formatRupiah(totalHarga)}
        </span>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <MdCalendarToday size={12} className="text-gray-400" />
          <span className="text-xs text-gray-600 font-mono">
            {formatTanggal(item.tanggal_masuk)}
          </span>
        </div>
      </td>
    </tr>
  );
});

/* ── Main Export ── */
const LaporanBarangMasukTable = memo(function LaporanBarangMasukTable({
  data,
  isLoading,
  totalHarga,
}) {
  const hasData = !isLoading && data && data.length > 0;

  // OPTIMASI: grandTotal dan totalJumlah di-memo
  // — reduce hanya dijalankan ulang jika `data` atau `totalHarga` berubah,
  //   bukan setiap kali komponen parent re-render karena alasan lain
  const grandTotal = useMemo(() => {
    if (totalHarga != null) return totalHarga;
    if (!data) return 0;
    return data.reduce((s, d) => s + (d.jumlah ?? 0) * (d.harga_satuan ?? 0), 0);
  }, [data, totalHarga]);

  const totalJumlah = useMemo(() => {
    if (!data) return 0;
    return data.reduce((s, d) => s + (d.jumlah ?? 0), 0);
  }, [data]);

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
            {/* Loading — pakai array statis agar tidak Array.from ulang */}
            {isLoading &&
              SKELETON_INDICES.map((i) => <SkeletonRow key={i} index={i} />)}

            {/* Belum di-filter */}
            {!isLoading && !data && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                      <MdInventory size={28} className="text-blue-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500 mb-1">
                        Pilih periode untuk menampilkan laporan
                      </p>
                      <p className="text-xs text-gray-400">
                        Tentukan periode dan filter di panel atas
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {/* Filter aktif tapi kosong */}
            {!isLoading && data && data.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <MdInventory size={28} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-500">
                      Tidak ada data barang masuk pada periode ini
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {/* Data */}
            {hasData &&
              data.map((item, idx) => (
                <DataRow key={item.id} item={item} rowNum={idx + 1} idx={idx} />
              ))}
          </tbody>

          {/* Footer total — nilai dari memo, tidak reduce ulang */}
          {hasData && (
            <tfoot>
              <tr className="bg-blue-50 border-t-2 border-blue-200">
                <td colSpan={6} className="px-3 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Total
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="inline-flex items-center justify-center font-extrabold text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-lg">
                    {totalJumlah}
                  </span>
                </td>
                <td className="px-3 py-3" />
                <td className="px-3 py-3 text-right">
                  <span className="font-extrabold text-sm text-blue-700 font-mono">
                    {formatRupiah(grandTotal)}
                  </span>
                </td>
                <td className="px-3 py-3" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
});

export default LaporanBarangMasukTable;