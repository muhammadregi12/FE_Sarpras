export const formatRupiah = (value) => {
	if (value === null || value === undefined || value === "") return "-";
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		minimumFractionDigits: 0,
	}).format(value);
};