import { useCallback, useEffect, useState } from "react";
import DashboardContent from "../components/feature/dashboard/DashboardContent";
import { getDashboardSummary } from "../services/dashboardService";
import { MdErrorOutline } from "react-icons/md";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getDashboardSummary();
      setData(result);
    } catch (err) {
      setError(err.message || "Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData();
    });
  }, [fetchData]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-3"
            style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca" }}
          >
            <MdErrorOutline className="w-4 h-4" />
            {error}
          </div>
          <button
            onClick={fetchData}
            className="text-sm text-blue-500 hover:underline block mx-auto"
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  return <DashboardContent loading={loading} data={data} />;
}