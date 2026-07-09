import React, { useRef, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import moment from "moment";
import { apiCalculatorById } from "../../../utils/Apis/calculator/Calculator_values_id";
import Reports from "../../../pages/calculator/reports/Reports";
import { createMatterFiles } from "../../../utils/Apis/matters/createMatterFiles/createMatterFilesActions";
import { saveFileData } from "../../../utils/Apis/matters/saveFileData/saveFileDataActions";
import { getUserSID } from "../../../utils/helpers";
import toast from "react-hot-toast";

const CalculationPDf = ({ files, matterId, folder_id }) => {
  const [reportData, setReportData] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const [generatingAction, setGeneratingAction] = useState(null); // "download" | "save"
  const [editingId, setEditingId] = useState(null);
  const [editedLabel, setEditedLabel] = useState("");
  const [fileList, setFileList] = useState(files);
  const inputRef = useRef(null);
  const reportRef = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editingId && inputRef.current && !inputRef.current.contains(e.target)) {
        const original = fileList.find(f => f.id === editingId)?.label;
        if (editedLabel === original || !editedLabel.trim()) cancelEdit();
        else saveLabel({ id: editingId, label: original });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingId, editedLabel, fileList]);

  // Once reportData is set and the Reports component renders, generate PDF
  useEffect(() => {
    if (!reportData || !generatingId || !generatingAction) return;

    const timer = setTimeout(async () => {
      try {
        const pdf = await buildPdf();
        if (!pdf) return;

        if (generatingAction === "download") {
          downloadPdf(pdf);
        } else if (generatingAction === "save") {
          await saveToMatter(pdf);
        }
      } catch (err) {
        console.error("PDF generation failed", err);
        toast.error("Failed to generate PDF");
      } finally {
        setGeneratingId(null);
        setGeneratingAction(null);
        setReportData(null);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [reportData, generatingId, generatingAction]);

  // Shared: build jsPDF from rendered report pages
  const buildPdf = async () => {
    const element = reportRef.current;
    if (!element) {
      toast.error("Report content not ready");
      return null;
    }

    const pages = element.querySelectorAll(".pagePDF");
    if (pages.length === 0) {
      toast.error("No report pages found");
      return null;
    }

    const pdf = new jsPDF("p", "mm", "letter");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, Math.min(imgHeight, pdfHeight));
    }

    return pdf;
  };

  const getFilename = () => {
    const party1 = reportData?.background?.party1FirstName || "Party1";
    const party2 = reportData?.background?.party2FirstName || "Party2";
    const date = moment().format("YYYY-MM-DD");
    return `CloudAct_Report_${party1}_${party2}_${date}.pdf`;
  };

  // Option 1: Direct download
  const downloadPdf = (pdf) => {
    pdf.save(getFilename());
    toast.success("PDF downloaded successfully");
  };

  // Option 2: Save to matter
  const saveToMatter = async (pdf) => {
    try {
      const filename = getFilename();
      const base64 = pdf.output("datauristring");

      // Create a file record in the matter folder
      const newFileData = {
        sid: getUserSID(),
        matter_id: matterId,
        folder_id: folder_id,
        file_name: filename,
        status: "Complete",
        type: "report",
      };

      await dispatch(createMatterFiles(newFileData));

      // Save PDF content to the matter
      const saveData = {
        matterId: matterId,
        folder_id: folder_id,
        file_name: filename,
        file_content: base64,
        type: "report",
      };

      await dispatch(saveFileData(saveData));

      toast.success("Report saved to matter");
    } catch (err) {
      console.error("Failed to save report to matter", err);
      toast.error("Failed to save report to matter");
    }
  };

  // Fetch report data and trigger the specified action
  const handleGeneratePdf = async (file, action) => {
    if (generatingId) return;
    setGeneratingId(file.id);
    setGeneratingAction(action);

    try {
      const data = await apiCalculatorById.get_value(file.id);
      const extracted = JSON.parse(data.report_data);
      setReportData(extracted);
    } catch (err) {
      console.error("Failed to fetch report data", err);
      toast.error("Failed to load calculation data");
      setGeneratingId(null);
      setGeneratingAction(null);
    }
  };

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

  const isGenerating = !!generatingId;

  return (
    <>
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
                <td className="actions" style={{ justifyContent: "center", display: "flex", gap: "0.5rem" }}>
                  {/* Download PDF */}
                  <button
                    className="redColor"
                    style={{ cursor: generatingId === file.id ? "wait" : "pointer" }}
                    onClick={() => handleGeneratePdf(file, "download")}
                    disabled={isGenerating}
                    title="Download PDF"
                  >
                    {generatingId === file.id && generatingAction === "download" ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Generating...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-download"></i> Download
                      </>
                    )}
                  </button>

                  {/* Save to Matter */}
                  <button
                    className="redColor"
                    style={{ cursor: generatingId === file.id ? "wait" : "pointer" }}
                    onClick={() => handleGeneratePdf(file, "save")}
                    disabled={isGenerating}
                    title="Save report to matter"
                  >
                    {generatingId === file.id && generatingAction === "save" ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Saving...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-floppy-disk"></i> Save to Matter
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Off-screen render container for PDF generation */}
      {reportData && (
        <div
          style={{
            position: "fixed",
            left: "-9999px",
            top: 0,
            width: "816px",
            height: "auto",
            zIndex: -9999,
            pointerEvents: "none",
          }}
        >
          <Reports ref={reportRef} data={reportData} />
        </div>
      )}
    </>
  );
};

export default CalculationPDf;
