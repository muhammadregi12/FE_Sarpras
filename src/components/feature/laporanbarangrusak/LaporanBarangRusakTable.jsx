import { memo, useMemo } from "react";
import {
	MdInventory,
	MdStore,
	MdMeetingRoom,
	MdCalendarToday,
	MdWarning,
	MdPerson,
	MdDescription,
} from "react-icons/md";
import { formatTanggal, severityClass } from "../../../utils/reportHelpers";

const COLUMNS = [
	{ key: "no", label: "No", width: "w-[55px]", align: "text-center" },
	{ key: "kode", label: "Kode Barang", width: "w-[120px]", align: "text-left" },
	{ key: "nama", label: "Nama Barang", width: "w-[185px]", align: "text-left" },
	{ key: "cabang", label: "Cabang", width: "w-[140px]", align: "text-left" },
	{ key: "ruangan", label: "Ruangan", width: "w-[140px]", align: "text-left" },
	{ key: "user", label: "User", width: "w-[130px]", align: "text-left" },
	{ key: "jumlah", label: "Jumlah Rusak", width: "w-[95px]", align: "text-center" },
	{ key: "tingkat", label: "Tingkat", width: "w-[120px]", align: "text-center" },
	{ key: "tanggal", label: "Tanggal Rusak", width: "w-[140px]", align: "text-left" },
	{ key: "keterangan", label: "Keterangan", width: "w-[210px]", align: "text-left" },
];

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
			<td className="px-3 py-3"><Skel width="w-24" /></td>
			<td className="px-3 py-3 text-center"><Skel width="w-8" /></td>
			<td className="px-3 py-3 text-center"><Skel width="w-18" /></td>
			<td className="px-3 py-3"><Skel width="w-24" /></td>
			<td className="px-3 py-3"><Skel width="w-32" /></td>
		</tr>
	);
});

const DataRow = memo(function DataRow({ item, rowNum, idx }) {
	return (
		<tr
			className="border-b border-gray-100 hover:bg-red-50/35 transition-colors duration-150"
			style={{ animation: `tableFadeIn 0.3s ease ${idx * 35}ms both` }}
		>
			<td className="px-3 py-3 text-center">
				<span className="inline-flex items-center justify-center w-7 h-7 text-xs font-bold rounded-lg bg-gray-100 text-gray-500">
					{rowNum}
				</span>
			</td>

			<td className="px-3 py-3">
				<span className="font-mono font-semibold text-[11px] bg-red-50 text-red-600 px-2 py-1 rounded-md border border-red-100">
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
					<MdStore size={12} className="text-gray-400 shrink-0" />
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

			<td className="px-3 py-3">
				<div className="flex items-center gap-1.5">
					<MdPerson size={12} className="text-gray-400" />
					<span className="text-xs text-gray-600 truncate max-w-25" title={item.user?.name}>
						{item.user?.name ?? <span className="text-gray-400">-</span>}
					</span>
				</div>
			</td>

			<td className="px-3 py-3 text-center">
					<span className="inline-flex items-center justify-center font-bold text-sm text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md min-w-10">
					{item.jumlah_rusak ?? 0}
				</span>
			</td>

			<td className="px-3 py-3 text-center">
				<span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full border text-[11px] font-bold ${severityClass(item.tingkat_kerusakan)}`}>
					{item.tingkat_kerusakan ?? "-"}
				</span>
			</td>

			<td className="px-3 py-3">
				<div className="flex items-center gap-1.5">
					<MdCalendarToday size={12} className="text-gray-400" />
					<span className="text-xs text-gray-600 font-mono">
						{formatTanggal(item.tanggal_rusak)}
					</span>
				</div>
			</td>

			<td className="px-3 py-3">
				<div className="flex items-start gap-1.5">
					<MdDescription size={12} className="text-gray-400 mt-0.5 shrink-0" />
					<span className="text-xs text-gray-600 truncate max-w-45" title={item.keterangan}>
						{item.keterangan ?? <span className="text-gray-400">-</span>}
					</span>
				</div>
			</td>
		</tr>
	);
});

const LaporanBarangRusakTable = memo(function LaporanBarangRusakTable({
	data,
	isLoading,
	totalJumlahRusak,
}) {
	const hasData = !isLoading && data && data.length > 0;
	const grandTotal = useMemo(() =>
        totalJumlahRusak ?? data?.reduce((sum, item) => sum + (item.jumlah_rusak ?? 0), 0) ?? 0,
    [totalJumlahRusak, data]);

	return (
		<div className="w-full">
			<div className="overflow-x-auto">
				<table className="w-full border-collapse font-['Sora'] text-sm">
					<thead>
						<tr className="bg-gray-50 border-b border-gray-200">
							{COLUMNS.map((column) => (
								<th
									key={column.key}
									className={`${column.width ?? ""} ${column.align} px-3 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap`}
								>
									{column.label}
								</th>
							))}
						</tr>
					</thead>

					<tbody>
						{isLoading && Array.from({ length: 6 }).map((_, index) => <SkeletonRow key={index} index={index} />)}

						{!isLoading && !data && (
							<tr>
								<td colSpan={COLUMNS.length} className="px-4 py-16 text-center">
									<div className="flex flex-col items-center gap-3">
										<div className="w-14 h-14 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
											<MdWarning size={28} className="text-red-300" />
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

						{!isLoading && data && data.length === 0 && (
							<tr>
								<td colSpan={COLUMNS.length} className="px-4 py-16 text-center">
									<div className="flex flex-col items-center gap-3">
										<div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
											<MdWarning size={28} className="text-gray-300" />
										</div>
										<p className="text-sm font-semibold text-gray-500">
											Tidak ada data barang rusak pada periode ini
										</p>
									</div>
								</td>
							</tr>
						)}

						{hasData && data.map((item, index) => <DataRow key={item.id} item={item} rowNum={index + 1} idx={index} />)}
					</tbody>

					{hasData && (
						<tfoot>
							<tr className="bg-red-50 border-t-2 border-red-200">
								<td colSpan={6} className="px-3 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wide">
									Total
								</td>
								<td className="px-3 py-3 text-center">
									<span className="inline-flex items-center justify-center font-extrabold text-sm text-red-700 bg-red-100 px-3 py-1 rounded-lg">
										{grandTotal}
									</span>
								</td>
								<td className="px-3 py-3" />
								<td className="px-3 py-3" />
								<td className="px-3 py-3" />
							</tr>
						</tfoot>
					)}
				</table>
			</div>

		</div>
	);
});

export default LaporanBarangRusakTable;
