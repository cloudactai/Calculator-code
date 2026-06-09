import React, { useState } from "react";
import LibraryAddCheckIcon from '@mui/icons-material/LibraryAddCheck';
import { Stack } from "react-bootstrap";
import { Box, Select, MenuItem, IconButton, Divider, Button, Link } from "@mui/material";
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { getIcon } from "./WorkflowAssets";

import UploadModal from "../../components/Matters/UploadDocuments/UploadModal";
import { getShortFirmname, getUserId, getUserSID } from "../../utils/helpers";
import axios from "../../utils/axios";
import toast from "react-hot-toast";
import { useHistory, useParams } from "react-router";
import Loader from "../Loader";

const WorkflowStep = ({ stepRef, fileName, stepStatus,stepAction, fileUrl,stepNumber, stepTitle, role,handleRefresh, handleExpansion, dueDate, isFileRequired }) => {

  const [selectedValue, setSelectedValue] = React.useState(stepStatus??'Not Started');
  const history = useHistory();
  const { workflowId, month_year } = useParams();
  const [loader, setLoader] = useState(false);

  function formatToSQLDate(dateStr) {
    const date = new Date(dateStr);

    // Helper function to pad numbers with leading zeros.
    const pad = (n) => n.toString().padStart(2, "0");

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1); // Months are 0-indexed.
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  const handleChange = async(event) => {
    const payload = {
      step_id: stepRef,workflowId, status: event.target.value, due_date: formatToSQLDate(dueDate), assignee: role, assignee_id: getUserId()
    }
    try{
      setLoader(true)
      const response = await axios.put(`/update_status_of_workflow_step`, payload);
    if(response){
      setSelectedValue(event.target.value);
      toast.success('Updated successfully!');
      history.go(0)
    }else{
      toast.error("Unable to update step")
    }

    }catch(error){
      if (error.response && error.response.status === 403) {
        toast.error('Unauthorized Access!')
      }
      else{
        toast.error('Something went wrong while updating status!')
      }
    }
    setLoader(false)
  };

  const formatDate = (dateString)=>{
    const date = new Date(dateString);

    return `${date.getDate()}.${date.getMonth()+1}.${date.getFullYear()}`
  }

  const [showUploadFormModal, setShowUploadFormModal] = useState(false);
  const handleUpload = async (files) => {
    setLoader(true);
    const formData = new FormData();
    const short_firmname = getShortFirmname();
    const sid = getUserSID();
    const currentUserId = getUserId();

    files.forEach((file, index) => {
      const sanitizedFileName = file.name.replace(/\s+/g, '_');
      formData.append("files", file);
      formData.append(`file_title[${index}]`, file.title || sanitizedFileName);
    });
    // formData.append("matterId", id);
    formData.append("short_firmname", short_firmname);
    formData.append("sid", sid);
    const tab= 'workflow'
    formData.append("tab", tab);
    formData.append("workflow_step_ref_id", stepRef)
    formData.append("assignee_id", currentUserId)

    // let path = `${id}/${modalData.component.replace(/\s+/g, '_')}`;
    let path = `${stepNumber}`;

    if (tab) {
      path += `/${tab.replace(/\s+/g, '_')}`;
    }
    formData.append("path", path);
    try {
      const response = await axios.post("/upload_workflow_document", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setLoader(false);
      toast.success("Files uploaded successfully");
      history.go(0);
    } catch (error) {
      console.error("Upload failed:", error);
      if (error.response && error.response.status === 403) {
        toast.error('Unauthorized Access!')
      }
      else{
        toast.error('Something went wrong while updating status!')
      }
    }
    setLoader(false);
  }

  const handleAccordionChange = (event, isExpanded) => {
      handleExpansion(parseInt(stepNumber)-1, isExpanded);
  };

  const validatePayload = (payload) => {
    return payload.sid!=='' && 
    payload.step_number != undefined  && 
    payload.workflow_id!=undefined 
  };

  const handleDeleteStep = async()=>{
    const deleteStepPayload = {
      "workflow_id": workflowId,
      "sid": getUserSID(),
      "step_number": stepNumber
    }
    if(!validatePayload(deleteStepPayload)){
      toast.error("Insufficient data for delete!")
      return;
    }
    console.log({deleteStepPayload});
    try{
      const response = await axios.delete(`/deleteStepFromWorkflow`, { data: deleteStepPayload});
      if(response){
        toast.success('Deleted successfully!');
        history.go(0)
      }else{
        toast.error("Unable to delete step")
      }
    }catch(error){
      toast.error("Unable to delete step")
    }
  }

  function getColor(dueDate){

    const due = new Date(dueDate.replace(" ", "T"));
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays < 0) {
      return "#FB554A"; // Red for missed
    }
    else {
      if(stepStatus == 'Done'){
        return "#4CB528";
      }
      if(stepStatus== 'Not Started'){
        return "#000000"
      }
      return "#F59E0B"; // Orange for warning
    }
  }

  const handleDownloadDocument = async (fileUrl) => {
    try {
      const response = await axios.post("/download_documents", { file_url: fileUrl });
      const presignedUrl = response.data;
      
      window.open(presignedUrl, "_blank");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };
  function getBorderColor(dueDate){

    const due = new Date(dueDate.replace(" ", "T"));
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays < 0) {
      return "#FB554A"; // Red for missed
    }
    else {
      if(stepStatus == 'Done'){
        return "#4CB528";
      }
      if(stepStatus== 'Not Started'){
        return "#73C3FD"
      }
      return "#F59E0B"; // Orange for warning
    }
  }
  const [intro, bulletPart] = stepAction.includes(':')? stepAction.split(':'):['',''];
  
  // Use a regex to split the bulletPart into items.
  // The regex splits on digits followed by a period and any amount of whitespace.
  const listItems = bulletPart
    .split(/\d+\.\s*/)
    .filter(item => item.trim() !== "");

  return (
    <Stack direction="vertical" style={{ minWidth: '450px', position: "relative", zIndex:1,maxWidth: '450px' }}>
      {/* Role Badge Positioned on Top */}
      <div
        style={{
          position: "absolute",
          top: "0px",
          left: "85%",
          transform: "translateX(-50%)",
          backgroundColor: "#307ff4",
          color: "white",
          padding: "2px 15px",
          fontWeight: "bold",
          border: "1px solid #23bffc",
          fontSize: "10px",
          borderRadius: "10px 10px 0 0", // Rounded only on top corners
          textAlign: "center",
          minWidth: "auto",
          zIndex: 0,
        }}
      >
        {role}
      </div>

      <div >
        <Accordion style={{ marginTop: "20px" , zIndex: 0, borderRadius: "12px",
          border: "1px solid #23bffc",}} onChange={handleAccordionChange} TransitionProps={{ style: { transformOrigin: "bottom" } }}  >
            <AccordionSummary
            expandIcon={<ExpandMoreIcon  />}
            aria-controls="panel1-content"
            id="panel1-header"
            >
            <Box display="flex" flexDirection="row" justifyContent="space-between" sx={{ width: "100%" }}>
                <Box display="flex" flexDirection="row">
                  <Box display="flex" flexDirection="column" justifyContent="center">
                      {getIcon(stepNumber, stepStatus=='Done')}
                  </Box>
                  <Box display="flex" flexDirection="column" sx={{ ml: 1 }}>
                      <div>Step {stepNumber}</div>
                      <Box>{stepTitle}</Box>
                  </Box>
                </Box>
                {isFileRequired?<Box display="flex" flexDirection="column" justifyContent="center">
                <IconButton onClick={()=>setShowUploadFormModal(true)}><UploadFileOutlinedIcon /></IconButton>
              </Box>:<></>}
            </Box>
            </AccordionSummary>
            <Divider sx={{ background: '#307ff4', ml: 2, mr: 2 }} />
            <AccordionDetails>
            <Box display="flex" flexDirection="column" sx={{ pt: 2 }}>
            <Loader isLoading={loader} loadingMsg="Loading..." />
                <Box display="flex" flexDirection="row">
                <Box><span className="blueColor"><b>Assignee</b></span></Box>
                <Box sx={{ ml: 2 }}><span>{`  ${role}`}</span></Box>
                </Box>
                <Box display="flex" flexDirection="row" sx={{ mt: 1 }}>
                <Box> <span className="blueColor"><b>Action</b></span></Box>
                <Box sx={{ ml: 2 }}> <span>{`  ${stepAction}`}</span></Box>
                </Box>
                {isFileRequired ?<Box display="flex" flexDirection="row" sx={{ mt: 1, flexWrap: 'wrap' }}>
                  <Box>
                    <span className="blueColor">
                      <b>Uploaded file</b>
                    </span>
                  </Box>
                  <Box sx={{ ml: 2, wordBreak: 'break-all' }}>
                  {fileName.map((name,index)=>
            <Box ><a
            target="_blank"
            download
            onClick={() => handleDownloadDocument(fileUrl[index])}
          >
          <Link><span>{name}</span></Link>
          </a></Box>)}

                  </Box>
                </Box>:<></>}

                <Box sx={{ display: "flex", alignItems: "center", justifyContent: 'space-between', width: "100%", mt: 2 }}>
                <Box sx={{ maxWidth: 150 }}>
                    {/* <Select
                    value={selectedValue}
                    onChange={handleChange}
                    variant="standard"
                    IconComponent={KeyboardArrowDownIcon}
                    sx={{ flex: 1, minWidth: 100, color: "green", border: "none" }}
                    disableUnderline
                    MenuProps={{
                        PaperProps: {
                        style: {
                            maxHeight: 200,
                        },
                        },
                    }}
                    >
                    <MenuItem value="done">Done</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    </Select> */}
                    <div className="select-custom">
                      <select value={selectedValue} onChange={handleChange}>
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>
                </Box>

                {/* Icons on the right */}
                <Box direction="row" spacing={1}>
                    {/* <IconButton>
                    <EditIcon sx={{ color: "gray" }} />
                    </IconButton> */}
                    <IconButton onClick={handleDeleteStep}>
                    <DeleteIcon sx={{ color: "gray" }} />
                    </IconButton>
                </Box>
                </Box>
            </Box>
            </AccordionDetails>
        </Accordion>
      </div>

      {/* Due Date Badge at Bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "-18px",
          left: "75%",
          transform: "translateX(-50%)",
          backgroundColor: "white",
          color: `${getColor(dueDate)}`,
          padding: "1px 10px",
          fontWeight: "bold",
          fontSize: "10px",
          borderRadius: "0 0 10px 10px",
          textAlign: "center",
          minWidth: "150px",
          zIndex: 0,
          border: `1px solid ${getBorderColor(dueDate)}`
        }}
      >
        Due date: {formatDate(dueDate)}
      </div>
      <UploadModal
            isOpen={showUploadFormModal}
            onClose={() => setShowUploadFormModal(false)}
            onUpload={handleUpload}
          />
    </Stack>
  );
};

export default WorkflowStep;
