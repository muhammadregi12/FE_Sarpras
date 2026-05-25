const MONTH_LABELS = [
	"Januari",
	"Februari",
	"Maret",
	"April",
	"Mei",
	"Juni",
	"Juli",
	"Agustus",
	"September",
	"Oktober",
	"November",
	"Desember",
];

const now = new Date();

export const REPORT_CURRENT_YEAR = now.getFullYear();
export const REPORT_CURRENT_MONTH = String(now.getMonth() + 1);

export const REPORT_TIPE_OPTIONS = [
	{ value: "harian", label: "Harian" },
	{ value: "bulanan", label: "Bulanan" },
	{ value: "tahunan", label: "Tahunan" },
	{ value: "custom", label: "Custom" },
];

export const REPORT_BULAN_OPTIONS = MONTH_LABELS.map((label, index) => ({
	value: String(index + 1),
	label,
}));

export const REPORT_TAHUN_OPTIONS = Array.from({ length: 6 }, (_, index) => String(REPORT_CURRENT_YEAR - index));

export const formatTanggal = (value) =>
	value
		? new Date(value).toLocaleDateString("id-ID", {
			day: "numeric",
			month: "short",
			year: "numeric",
		})
		: "-";

export const severityClass = (value) => {
	const level = String(value ?? "").toLowerCase();

	if (level === "ringan") return "bg-amber-50 text-amber-700 border-amber-200";
	if (level === "sedang") return "bg-orange-50 text-orange-700 border-orange-200";
	if (level === "berat") return "bg-red-50 text-red-700 border-red-200";

	return "bg-gray-50 text-gray-600 border-gray-200";
};