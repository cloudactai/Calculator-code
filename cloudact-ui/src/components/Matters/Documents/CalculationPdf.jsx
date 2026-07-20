import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import dataAxios from "../../../utils/dataAxios";
import { AUTH_ROUTES } from "../../../routes/Routes.types";
import { DATA_API_BASE } from "../../../utils/dataAxios";
import { getAuthToken } from "../../../utils/authToken";

const CalculationPDf = ({ matterId }) => {
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const history = useHistory();

  useEffect(() => {
    if (!matterId) {
      setLoading(false);
      return;
    }
    dataAxios
      .get(`calculator/get_values_by_matter/${encodeURIComponent(matterId)}`)
      .then((res) => {
        const data = res?.data?.data ?? res?.data ?? [];
        setCalculations(Array.isArray(data) ? data : []);
      })
      .catch(() => setCalculations([]))
      .finally(() => setLoading(false));
  }, [matterId]);

  const handleResume = (calc) => {
    history.push(
      `${AUTH_ROUTES.CALCULATOR}?id=${calc.id}&step=0&saveValues=false`
    );
  };

  const handleDownloadPdf = async (calc) => {
    try {
      const res = await dataAxios.get(
        `calculator/get_report_pdf/${calc.id}`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(calc.label || "report").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download PDF:", err);
      alert("PDF not available yet. Please open the calculation first to generate the report.");
    }
  };

  if (loading) return <div className="description">Loading calculations…</div>;
  if (!calculations.length)
    return (
      <div className="description">
        No saved calculations for this matter yet.
      </div>
    );

  return (
    <div className="documents-table mt-3">
      <table className="table reports-table reports-table-primary">
        <thead>
          <tr>
            <th>Label</th>
            <th>Type</th>
            <th>Status</th>
            <th>Created</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {calculations.map((calc) => (
            <tr key={calc.id}>
              <td>{calc.label}</td>
              <td>
                {(calc.calculator_type || "")
                  .replace(/_/g, " ")
                  .replace(/CAL$/, "")}
              </td>
              <td>{(calc.status || "").replace(/_/g, " ")}</td>
              <td>
                {calc.created_at
                  ? new Date(calc.created_at).toLocaleDateString()
                  : "—"}
              </td>
              <td className="d-flex gap-2">
                {calc.has_pdf && (
                  <button
                    className="btn btnPrimary rounded-pill"
                    onClick={() => handleDownloadPdf(calc)}
                  >
                    <i className="fa-solid fa-file-pdf" style={{ marginRight: 6 }}></i>
                    Download PDF
                  </button>
                )}
                <button
                  className="btn btnSecondary rounded-pill"
                  onClick={() => handleResume(calc)}
                >
                  Resume
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CalculationPDf;
