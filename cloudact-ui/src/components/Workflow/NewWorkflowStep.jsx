import React, {useRef, useState } from "react";
import { Stack } from "react-bootstrap";
import {
  Box,
  IconButton,
  Divider,
  TextField,
  Switch,
  FormControl,
  Button,
} from "@mui/material";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import { getIcon } from "./WorkflowAssets";
import { getShortFirmname, getUserSID } from "../../utils/helpers";
import axios from "../../utils/axios";
import { useHistory, useParams } from "react-router";
import toast from "react-hot-toast";
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';

import UploadModal from "../../components/Matters/UploadDocuments/UploadModal";
import NewStepDateModal from "./NewStepDateModal";
import { CalendarIcon } from "@mui/x-date-pickers";
import Loader from "../Loader";

const NewWorkflowStep = ({ stepNumber, stepTitle, role, isOpen, handleDeleteNode }) => {
  const [actionText, setActionText] = useState("");
  const [title, setTitle] = useState("");
  const [isFileUpload, setIsFileUpload] = useState(false);
  const { workflowId, month_year } = useParams();
  const [showUploadFormModal, setShowUploadFormModal] = useState(false);
  const [assignee, setAssignee] = useState("Preparer")
  const [dueDateInterval, setdueDateInterval] = useState(2);
  const dateInputRef = useRef(null);
  const [loader, setLoader] =useState(false);
  const history = useHistory();

  const handleSetInterval = (days)=>{
    setdueDateInterval(days);
  }

  const handleActionTextChange = (event) => {
    setActionText(event.target.value);
  };

  const handleTitleTextChange = (event) => {
    setTitle(event.target.value);
  };

  const handleIsFileUploadChange = (event) => {
    setIsFileUpload(event.target.checked);
  };

  console.log({dueDateInterval});
  function isValidDate(dateField) {
    if (!dateField || (typeof dateField === 'string' && dateField.trim() === '')) {
      return false;
    }
    const date = new Date(dateField);
    return !isNaN(date.getTime());
  }

  const validatePayload = (payload) => {
    return payload.sid!=='' && 
    payload.prev_count != undefined  && 
    payload.step_title != ''  &&
    payload.step_description!='' && 
    payload.is_file_required != undefined && 
    payload.default_assignee!= '' &&
    payload.workflow_id!=undefined &&
    payload.dueDateInterval != null
  };

  
  const handleSaveNewStep = async(event) => {
    event.stopPropagation();
    const payload = {
      sid: getUserSID(),
      prev_count: parseInt(stepNumber),
      step_title: title,
      step_description: actionText,
      is_file_required: isFileUpload,
      default_assignee: assignee,
      workflow_id: workflowId,
      dueDateInterval: parseInt(dueDateInterval)
    }
    if(!validatePayload(payload)){
      toast.error("Fill all the fields before adding step")
      return;
    }
    try{
      setLoader(true)
      const response = await axios.post(`/addStepToWorkflow`, payload);
      if(response){
        toast.success('Saved successfully!');
        history.go(0)
      }else{
        toast.error("Unable to add step")
      }
    }catch(error){
      toast.error("Unable to add step")
    }
    setLoader(false)
  };

  return (
    <Stack direction="vertical" style={{ minWidth: "450px", position: "relative", zIndex: 100 }}>
       <Loader isLoading={loader} loadingMsg="Loading..." />
      {/* Role Badge Positioned on Top */}
      <div
        style={{
          position: "absolute",
          // top: "-10px",
          left: "85%",
          transform: "translateX(-50%)",
          backgroundColor: "#307ff4",
          color: "white",
          fontWeight: "bold",
          border: "1px solid #23bffc",
          fontSize: "10px",
          borderRadius: "10px 10px 0 0",
          textAlign: "center",
          zIndex: 100,
          width: "100px"
        }}
      >
      <FormControl variant="standard" sx={{ minWidth: 280 }}>
                    {/* <Select
                      value={selectedValue}
                      onChange={handleSelectChange}
                      IconComponent={KeyboardArrowDownIcon}
                      MenuProps={{ container: document.body }}
                    >
                      <MenuItem value="client">client</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                    </Select> */}
                    <Box sx={{
                      // Target the label
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingLeft: '20px',
                      mt: "4px",
                      '& .MuiInputLabel-root': {
                        fontSize: '12px',color: 'white', border: 'none'
                      },
                      // Target the input text
                      '& .MuiInputBase-input': {
                        fontSize: '12px',color: 'white',
                        textAlign: 'center',
                        border: 'none'
                      },
                      color: 'white',
                      border: 'none',
                    }}>
                     
                    </Box>
                  </FormControl>
      {/* <TextField
        value={assignee}
        onChange={(e) => setAssignee(e.target.value)}
        label="Enter assignee"
        size="small"
        sx={{
          // Target the label
          '& .MuiInputLabel-root': {
            fontSize: '12px',color: 'white', border: 'none'
          },
          // Target the input text
          '& .MuiInputBase-input': {
            fontSize: '12px',color: 'white',
            textAlign: 'center',
            border: 'none'
          },
          color: 'white',
          border: 'none',
        }}
      /> */}
      </div>

      <div>
        <Accordion style={{ marginTop: "20px", zIndex: 100, border: "1px solid #23bffc",borderRadius: "12px" }} defaultExpanded >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            <Box display="flex" flexDirection="row" justifyContent="space-between" sx={{ width: "100%" }}>
              <Box display="flex" flexDirection="row">
                <Box display="flex" flexDirection="column" justifyContent="center" >
                  {getIcon("New step Icon", true)}
                </Box>
                <Box display="flex" flexDirection="column" sx={{ ml: 1, mb: -1, pt: 1 }}>
                  <Box sx={{ ml: 2, pb: 2 }}>
                    <TextField
                      placeholder="Enter Task Name"
                      value={title}
                      onChange={handleTitleTextChange}
                      sx={{ minWidth: 280 }}
                      variant="standard"
                      onClick={(event)=>event.stopPropagation()}
                    />
                  </Box>
                </Box>
              </Box>
              {isFileUpload?<Box display="flex" flexDirection="column" justifyContent="center">
                <IconButton><UploadFileOutlinedIcon /></IconButton>
              </Box>:<></>}
            </Box>
          </AccordionSummary>
          <Divider sx={{ background: "#307ff4", ml: 2, mr: 2 }} />
          <AccordionDetails sx={{zIndex: 100}}>
            <Box display="flex" flexDirection="column" sx={{ pt: 2 ,zIndex: 100}}>
              <Box display="flex" flexDirection="row">
                <Box sx={{ minWidth: 90 }}>
                  <span className="blueColor">
                    <b>Assignee</b>
                  </span>
                </Box>
                <Box sx={{ minWidth: 50, ml: 2, pb: 2 }}>
                  <FormControl variant="standard" sx={{ minWidth: 280 }}>
                    <div className="select-custom">
                      <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                      <option value="Preparer">Preparer</option>
                        <option value="Approver">Approver</option>
                      </select>
                    </div>
                  </FormControl>
                </Box>
              </Box>
              <Box display="flex" flexDirection="row" sx={{ mt: 1 }}>
                <Box sx={{ minWidth: 90 }}>
                  <span className="blueColor">
                    <b>Action</b>
                  </span>
                </Box>
                <Box sx={{ ml: 2, pb: 2 }}>
                  <TextField
                    value={actionText}
                    onChange={handleActionTextChange}
                    sx={{ minWidth: 280 }}
                    variant="standard"
                  />
                </Box>
              </Box>
              <Box display="flex" flexDirection="row" sx={{ mt: 1 }}>
                <Box>
                  <span className="blueColor">
                    <b>Upload Files</b>
                  </span>
                </Box>
                <Box sx={{ ml: 2 }}>
                  <Switch
                    checked={isFileUpload}
                    inputProps={{ "aria-label": "controlled switch" }}
                    onChange={handleIsFileUploadChange}
                  />
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  mt: 2,
                }}
              >
                <Box></Box>
                {/* Icons on the right */}
                <Box direction="row" spacing={1}>
                  {/* <IconButton onClick={handleSaveNewStep}>
                    <CheckOutlinedIcon sx={{ color: "#73C3FD" }} />
                  </IconButton> */}
                  <Button onClick={handleSaveNewStep} startIcon={<CheckOutlinedIcon sx={{ color: "#73C3FD" }} />}>Add</Button>
                  <IconButton onClick={()=>{handleDeleteNode(parseInt(stepNumber))}}>
                    <DeleteIcon sx={{ color: "gray" }} />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </div>

      {/* Due Date Badge at Bottom */}
      <span
        style={{
          position: "absolute",
          bottom: "-36px",
          left: "75%",
          transform: "translateX(-50%)",
          backgroundColor: "white",
          color: "#307FF4",
          fontWeight: "bold",
          fontSize: "10px",
          borderRadius: "0 0 10px 10px",
          minWidth: "150px",
          zIndex: 1,
          textAlign: "center",
          border: "1px solid #307FF4",
          width: "200px",
          paddingBottom:0
        }}
      >
      <>{dueDateInterval ? `Due date interval: ${dueDateInterval} days `: `Choose due date interval`}</>
         {/* <input
        ref={dateInputRef}
        type="date"
        value={dueDateInterval}
        placeholder="Choose your Date:"
        onChange={(e) => setdueDateInterval(e.target.value)}
        style={{border: "none", color: '#73e069', maxWidth: "80px"}}
       /> */}
        {/* {dueDateInterval ? <p>Due date: {dueDateInterval}</p>: <p>Choose your Date:</p>} */}
        
       <IconButton onClick={()=>setShowUploadFormModal(true)}>
        <CalendarIcon sx={{color: '#307FF4'}}/>
       </IconButton>
      </span>
          <NewStepDateModal  open={showUploadFormModal}
          initialValue={dueDateInterval ?? 2}
            handleOnClose={() => setShowUploadFormModal(false)}
            handleOnSave={handleSetInterval} />
        
    </Stack>
  );
};

export default NewWorkflowStep;
