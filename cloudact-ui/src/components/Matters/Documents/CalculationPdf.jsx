import React, { useRef, useState, useEffect } from "react";
import ReactToPrint from "react-to-print";
import { Table } from "react-bootstrap";
import moment from "moment";
import { apiCalculatorById } from "../../../utils/Apis/calculator/Calculator_values_id";
import Reports from "../../../pages/calculator/reports/Reports";
import toast from "react-hot-toast";

const CalculationPDf = ({ files }) => {
  const [reportData, setReportData] = useState({ data: {}, showReportTemplate: true });
  const [editingId, setEditingId] = useState(null);
  const [editedLabel, setEditedLabel] = useState("");
  const [fileList, setFileList] = useState(files);
  const inputRef = useRef(null);
  let reportRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editingId && inputRef.current && !inputRef.current.contains(e.target)) {
        const original = fileList.find(f => f.id === editingId)?.label;
        if (editedLabel === original || !editedLabel.trim()) cancelEdit();
        else saveLabel({ id: editingId, label: original }); // Save if actually modified
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingId, editedLabel, fileList]);

  const cancelEdit = () => {
    setEditingId(null);
    setEditedLabel("");
  };

  const saveLabel = async (file) => {
    if (!editedLabel.trim() || editedLabel === file.label) return cancelEdit();

    try {
      await apiCalculatorById.edit_value(file.id, { label: editedLabel });
      setFileList(prev =>
        prev.map(f => (f.id === file.id ? { ...f, label: editedLabel } : f))
      );
      toast.success("Label updated successfully");
      cancelEdit();
    } catch (err) {
      console.error("Rename failed", err);
      toast.error("Something went wrong");
    }
  };

  const deleteValue = async (id) => {
    if (!window.confirm("Are you sure you want to delete this calculation?")) return;
    try {
      await apiCalculatorById.delete_value(id);
      setFileList(prev => prev.filter(f => f.id !== id));
      toast.success("Calculation deleted successfully");
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Something went wrong");
    }
  };

  const startEdit = (file) => {
    setEditingId(file.id);
    setEditedLabel(file.label);
  };

  return (
    <div className="tableOuter">
      <table className="table customGrid table-hover">
        <thead>
          <tr>
            <th>Document</th>
            <th>Created On</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {fileList.map((file) => (
            <tr key={file.id}>
              <td>
                {editingId === file.id ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }} ref={inputRef}>
                  <input
                    value={editedLabel}
                    onChange={(e) => setEditedLabel(e.target.value)}
                    className="form-control d-inline w-auto"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveLabel(file);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    style={{ maxWidth: "200px" }}
                  />
                  <i
                    className="fas fa-check text-success"
                    style={{ cursor: "pointer", fontSize: 14 }}
                    onClick={() => saveLabel(file)}
                    title="Save"
                  ></i>
                  <i
                    className="fas fa-times text-danger"
                    style={{ cursor: "pointer", fontSize: 14 }}
                    onClick={cancelEdit}
                    title="Cancel"
                  ></i>
                </div>
                
                ) : (
                  <>
                    {file.label}
                    <i
                      className="fas fa-pen mx-2"
                      style={{ cursor: "pointer", fontSize: 14 }}
                      onClick={() => startEdit(file)}
                    ></i>
                    <i
                      className="fas fa-trash-alt text-danger"
                      style={{ cursor: "pointer", fontSize: 14 }}
                      onClick={() => deleteValue(file.id)}
                    ></i>
                  </>
                )}
              </td>
              <td>{moment(file.created_at).format("D-MM-YYYY")}</td>
              <td className="actions" style={{ justifyContent: "center", display: "flex" }}>
                <ReactToPrint
                  onBeforeGetContent={async () => {
                    const data = await apiCalculatorById.get_value(file.id);
                    const ExtractedData = JSON.parse(data.report_data);
                    setReportData({ data: ExtractedData, showReportTemplate: false });
                  }}
                  trigger={() => (
                    <button className="redColor" style={{ cursor: "pointer" }}>
                      <i className="fa-solid fa-file-pdf"></i> PDF
                    </button>
                  )}
                  content={() => reportRef.current}
                />
              </td>
              {reportData.data && (
                <div
                  style={{
                    position: "absolute",
                    left: "-999rem",
                    opacity: 0,
                    visibility: "hidden",
                  }}
                >
                  <Reports ref={reportRef} data={reportData.data} />
                </div>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CalculationPDf;
