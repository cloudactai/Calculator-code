import { useEffect, useState , useRef} from "react";

import Navbar from "../../components/Dashboard/Navbar/Navbar";
import InfoHeader from "../../components/Dashboard/InfoHeader";
import { getSvg } from "../MonthlyChecklist/checkListAssets/checklistAsset";
import WorkflowStep from "../../components/Workflow/WorkflowStep";
import {ReactFlow} from '@xyflow/react';
import FlowChart from "./FlowChart";
import FlowWithoutLibrary from "./WithoutLibrary/FlowWithoutLibrary";
import { Box, Button, Typography } from "@mui/material";
import { useHistory, useParams } from "react-router";
import axios from "../../utils/axios";
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { getShortFirmname, getUserId, getUserSID } from "../../utils/helpers";
import Loader from "../../components/Loader";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const WorkflowLayout = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [stepsForWorkflows, setStepsForWorkflows] = useState([]);
  const [workflowStatus, setWorkflowStatus] = useState("Not done");
  const { workflowId, month_year } = useParams();
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const [refreshChild, setRefreshChild] = useState(false);

  const handleRefresh = () => {
    setRefresh((prev) => !prev);
  };

  const handleRefreshChild = () => {
    setRefreshChild((prev) => !prev);
  };
  const childRef = useRef();

  const handleCallChild = () => {
    if (childRef.current) {
      childRef.current.handleCapture();
    }
  };

  useEffect(() => {
    const fetchAllStepsForWorkflow = async () => {
      const allStepsForWorkflow = await axios.get(
        `/getStepsForWorkflow?workflowId=${workflowId}`
      );
      if (allStepsForWorkflow.data.stepsForWorkflow) {
        const mergedData = Object.values(
          allStepsForWorkflow.data.stepsForWorkflow.reduce((acc, item) => {
            const key = item.idtbl_workflow_step_tracking;
            if (!acc[key]) {
              // Start with a copy of the current item.
              // Convert file_url and file_name to arrays.
              acc[key] = {
                ...item,
                file_url: item.file_url ? [item.file_url] : [],
                file_name: item.file_name ? [item.file_name] : [],
              };
            } else {
              if (item.file_url && !acc[key].file_url.includes(item.file_url)) {
                acc[key].file_url.push(item.file_url);
              }
              if (
                item.file_name &&
                !acc[key].file_name.includes(item.file_name)
              ) {
                acc[key].file_name.push(item.file_name);
              }
            }
            return acc;
          }, {})
        );
        if (mergedData.length) {
          mergedData.sort((a, b) => a.step_number - b.step_number);
        }
        setStepsForWorkflows([...mergedData]);
        setWorkflowStatus(
          allStepsForWorkflow.data.workflowDetails[0].workflow_status
        );
      }
    };
    fetchAllStepsForWorkflow();
  }, [refresh]);

  const isButtonDisabled = () => {
    let isEnabled = true;
    stepsForWorkflows.forEach((step) => {
      isEnabled = isEnabled && step.step_status.toLowerCase() == "done";
    });
    return !isEnabled || workflowStatus.toLowerCase() == "done";
  };

  const handleMarkAsDone = async () => {
    try {
      setLoading(true);
      const resp = await axios.patch("/updateWorkflowStatus", { workflowId });
      setRefreshChild((prev) => !prev);
      if (resp) {
        // handleCallChild();
        const element = document.getElementById("capture");
        setTimeout(async () => {
          const canvas = await html2canvas(element, {
            logging: true,
            useCORS: true,
            letterRendering: 1,
          });

          const imgData = canvas.toDataURL("image/jpeg", 0.7);
          const pdf = new jsPDF({
            orientation: "p",
            unit: "mm",
            format: "a4",
            compress: true,
          });
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = (canvas.height * pageWidth) / canvas.width;

          pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);

          const pdfBlob = pdf.output("blob");

          const formData = new FormData();
          formData.append("files", pdfBlob, "snapshot.pdf");
          formData.append("short_firmname", getShortFirmname());
          formData.append("sid", getUserSID());
          formData.append("path", `${workflowId}`);
          formData.append("workflow_id", workflowId);
          formData.append("file_title", "Reconciliation Workflow");

          // 7) send it
          try {
            await axios.post("/upload_workflow_completion_document", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("Bank reconciliation flow completed!");
            setLoading(false);
            history.push("/workflow/workflow-list");
          } catch (err) {
            console.error("Upload failed:", err);
            toast.error("Could not save flow. Something went wrong!");
            setLoading(false);
          }

          // old code below
          // html2pdf()
          // .set(opt)
          // .from(element)
          // .outputPdf('blob')
          // .then(async(pdfBlob) => {
          //   const formData = new FormData();
          //   formData.append('files', pdfBlob, 'snapshot.pdf');
          //   let path = `${workflowId}`;
          //   const short_firmname = getShortFirmname();
          //   const sid = getUserSID();
          //   const currentUserId = getUserId();
          //   formData.append("short_firmname", short_firmname);
          //   formData.append("sid", sid);
          //   formData.append("path", path);
          //   formData.append("workflow_id", workflowId);
          //   formData.append("file_title", "Reconciliation Workflow")

          //   try {
          //     const response = await axios.post("/upload_workflow_completion_document", formData, {
          //       headers: {
          //         "Content-Type": "multipart/form-data",
          //       },
          //     });
          //     toast.success("Bank reconciliation flow completed!");
          //     history.push("/workflow/workflow-list")
          //   } catch (error) {
          //     console.error("Upload failed:", error);
          //     toast.error("Could not save flow. Something went wrong!");
          //   }
          // })
          // .catch(error => {
          //   console.error('Error generating PDF:', error);
          // });
        }, 1000);
      }
    } catch (error) {
      toast.error("Cannot complete workflow");
      setLoading(false);
    }
  };
  return (
    <section className="wrapper">
      <aside className="mainSide">
        <Navbar setIsNavOpen={setIsNavOpen} />
      </aside>
      <main>
        <InfoHeader title={`Welcome `} />
        <h5 className="calcTitle mb-0">Bank reconciliation workflow</h5>

        <div className="row">
          <Box
            sx={{
              border: "2px solid #307FF4",
              borderRadius: "24px",
              height: "878px",
              width: "1679px",
              overflow: "hidden",
              padding: 0,
            }}
          >
            <Box
              sx={{
                backgroundColor: "#FBFCFE",
                borderBottom: "1px solid #73C3FD",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
                paddingTop: 1,
                paddingLeft: 2,
                paddingBottom: 1,
              }}
            >
              <Typography>
                {" "}
                Bank reconciliation workflow - {month_year}
              </Typography>
              <Button
                disabled={isButtonDisabled()}
                onClick={handleMarkAsDone}
                variant="outlined"
                sx={{
                  border: "1px solid #73C3FD",
                  color: "#000000",
                  height: "28px",
                  mr: 2,
                }}
                startIcon={<CheckOutlinedIcon sx={{ color: "#73C3FD" }} />}
              >
                Mark as done
              </Button>
            </Box>
            <Loader isLoading={loading} loadingMsg="Completing workflow..." />
            <div id="capture" style={{ background: "white" }}>
              <FlowChart
                ref={childRef}
                data={stepsForWorkflows}
                handleRefresh={handleRefresh}
                isRefresh={refreshChild}
              />
            </div>
          </Box>
        </div>

        <div className="pb-3"> </div>
      </main>
    </section>
  );
};

export default WorkflowLayout;
