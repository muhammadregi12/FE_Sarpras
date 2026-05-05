export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="h-11 flex-shrink-0 flex items-center justify-between px-6 lg:px-8 bg-white border-t text-xs text-gray-400"
      style={{ borderColor: "#e9ecf0" }}
    >
      <span>
        © {year}{" "}
        <strong className="text-gray-600 font-semibold">
          Sarpras Management System
        </strong>
      </span>

      <span className="hidden sm:flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Semua sistem berjalan normal
      </span>
    </footer>
  );
}