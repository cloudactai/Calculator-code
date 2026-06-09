import {
    Button,
    Modal,
    Container,
    Row,
    Col,
    Pagination as PaginationBStrap,
} from "react-bootstrap";
import { YearCalendar } from "@mui/x-date-pickers/YearCalendar";
import { MonthCalendar } from "@mui/x-date-pickers/MonthCalendar";
import { Link } from "react-router-dom";
import { useState } from "react";
import moment from "moment";
import {
    getMonthFromDigit,
    getUserSID,
    getDigitFromMonth
} from "../../utils/helpers";
import Swal from 'sweetalert2'
import toast from "react-hot-toast";
import axios from "../../utils/axios";
import ModalInputCenter from "../../components/ModalInputCenter";
import { AUTH_ROUTES } from "../../routes/Routes.types";
import Nav from 'react-bootstrap/Nav';
import { getCurrentUserFromCookies } from "../../utils/helpers";
import { Roles } from "../../routes/Role.types";
import WorkflowLogo from '../../assets/images/workflow.svg'

const WorkflowListHeader = ({
    selectedReports,
    setSelectedReports,
    selectAllChecked,
    setSelectAllChecked,
    headerdata,
    setHeaderData,
    currentSelectedMonthYear,
    dataMonthWise,
    setHaveDeleteofArchive,
    ArchiveFilter,
    setArchiveFilter
}) => {


    const [customModal, setCustomModal] = useState({
        year: false,
        month: false
    });

    const [modalShow, setModalShow] = useState(false);
    const DurationChangeHandler = (key, value) => {
        if (key == 'month') {
            if (headerdata.year == '' || undefined) {
                toast.error('Please select year first');
                return
            }
        }

        if (key == 'year') {
            setHeaderData((prev) => ({
                ...prev,
                year: value
            }))
        } else {
            setHeaderData((prev) => ({
                ...prev,
                month: new Date(value).getMonth() + 1
            }))
        }
    }

    const handleArchiveReports = () => {
        if (selectedReports.length === 0) {
            return toast.error("Please select workflows to Archive");
        }

        let archiveType = selectAllChecked ? "all" : "individual";

        let filteredReports = dataMonthWise[currentSelectedMonthYear].data.filter((report) => {
            return selectedReports.includes(report.id);
        });

        const checkAnyTaskInPROGRESS = filteredReports.some((report) => {
            return report.status == 'INPROGRESS'
        })

        if(checkAnyTaskInPROGRESS){
             toast.error('Cannot Archive workflow with In-Progress Task')
             return;
        }

        let [monthString, secondString] = currentSelectedMonthYear.split(' ');

        let year = secondString
        let month = getDigitFromMonth(monthString);

        if (secondString == 'Tasks') {
            headerdata.year ? year = headerdata.year : year = new Date().getFullYear();
        }

        if (secondString == 'Tasks') {
            if (selectAllChecked) {
                archiveType = 'total'
            }
        }

        axios.patch(`/archive_workflow`, {
            workflowIds: selectedReports,
            archiveTaskType: archiveType,
            sid: getUserSID(),
            month: month,
            year: year,
            reportType: headerdata.reportType,
            archive: headerdata.archive,
            isComplianceForm: 1
        }).then((res) => {
            if (res.status == 200) {
                setSelectAllChecked(false);
                setSelectedReports([]);
                setHaveDeleteofArchive((prev) => !prev)
                toast.success('Workflows archived successfully successfully');
            } else {
                toast.error('Something went wrong to Archive workflow');
            }


        }).catch((err) => {
            toast.error('Internal Server Error')
        });

    }

    const handleDeleteEntries = () => {
        if (selectedReports.length === 0) {
            return toast.error("Please select workflow to Archive");
        }
        let deleteType = selectAllChecked ? "all" : "individual";

        let [monthString, secondString] = currentSelectedMonthYear.split(' ');

        let year = secondString
        let month = getDigitFromMonth(monthString);

        if (secondString == 'Tasks') {
            headerdata.year ? year = headerdata.year : year = new Date().getFullYear();
        }

        if (secondString == 'Tasks') {
            if (selectAllChecked) {
                deleteType = 'total'
            }
        }

        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#73c3fd",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        }).then((result) => {
            if (result.isConfirmed) {
                axios.delete(`/deleteWorkflowById`, {
                    data: {
                        workflow_ids: selectedReports,
                        sid: getUserSID(),                
                    }
                }).then((res) => {

                    if (res.status == 200) {
                        setSelectAllChecked(false);
                        setSelectedReports([]);
                        

                        Swal.fire({
                            title: "Deleted!",
                            text: "Your file has been deleted.",
                            icon: "success",
                            confirmButtonColor: "#73c3fd",
                        }).then(() => {
                            setHaveDeleteofArchive((prev) => !prev)
                        })
                    } else {
                        toast.error('Something went wrong to Delete Workflow');
                    }

                }).catch((err) => {
                    // setDeleteloading(false)
                    console.log("err", err);
                    toast.error(`Error deleting Checklist ${err}`);

                })
            }
        });


    }

    const handleChangetab=(e)=>{
        setArchiveFilter(e)
    }


    return (
        <div>
            <div className="pHead">
                <div className="checkListType">

                    <span className="h5">
                    <span className="h5">
                        {/* {getSvg("Add Workflow")} */}
                        <img src={WorkflowLogo} alt="Workflow Icon" width="24" height="24" />
                        Workflows
                    </span>
                        {
                            selectedReports.length > 0 && <div className="btnGroup">
                                <button className={`pdf`} onClick={handleDeleteEntries} >
                                    <i className="fa-solid fa-trash"></i>  Delete
                                </button>
                            </div>
                        }
                    </span>
                    {
                    ArchiveFilter && 
                    <Nav variant="pills" className="me-auto" onSelect={handleChangetab}  >
                    <Nav.Item >
                      <Nav.Link className="font-weight-bold"   active={ArchiveFilter === "Reports"} eventKey="Reports">
                      Reports
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item >
                      <Nav.Link className="font-weight-bold"  active={ArchiveFilter === "Compliance Form"} eventKey="Compliance Form">Compliance Form</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link className="font-weight-bold"  active={ArchiveFilter === "Monthly Checklist"} eventKey="Monthly Checklist">Monthly Checklist</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link className="font-weight-bold"  active={ArchiveFilter === "Billing"} eventKey="Billing">Billing</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link className="font-weight-bold"  active={ArchiveFilter === "Workflow"} eventKey="Workflow">Workflow</Nav.Link>
                    </Nav.Item>
                  </Nav>
                    
                }
                    <div className="form-group m-0 rounded-pill">
                        <select
                            className="form-select rounded-pill text-center"
                            onChange={(e) => setHeaderData((prev) => ({
                                ...prev,
                                status: e.target.value
                            }))}
                            value={headerdata.status}
                            style={{
                                border: "rgba(115,195,253,0.5) solid 2px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                minWidth: "20px",
                            }}

                        >
                            <option value="ALL">All</option>
                            <option value="Not started">Not Started</option>
                            <option value="In progress">In Progress</option>
                            <option value="Done">Approved</option>
                        </select>
                    </div>

                  </div>


                <div className="control">
                    <div className="filterRow">
                        <div class="gridSearch">
                            <button className="btn btnDefault rounded-pill"
                                onClick={() => setCustomModal({ ...customModal, year: true })}
                            >
                                {headerdata.year ? headerdata.year : "Choose Year"}

                            </button>
                            <Modal centered size="md"
                                show={customModal.year}
                                onHide={() => setCustomModal({ ...customModal, year: false })}
                            >
                                <Modal.Header closeButton>
                                    <Modal.Title>Select Year</Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                    <Container>
                                        <Row>
                                            <Col className="d-flex align-items-center justify-content-center">
                                                <YearCalendar
                                                    value={
                                                        headerdata.year ?
                                                            moment(new Date().setFullYear(headerdata.year))
                                                            : null
                                                    }
                                                    onChange={(value) => {
                                                        console.log('checkALlRRR', new Date(value).getFullYear())
                                                        DurationChangeHandler('year', new Date(value).getFullYear())
                                                    }
                                                    }
                                                />
                                            </Col>
                                        </Row>
                                    </Container>
                                </Modal.Body>
                                <Modal.Footer>
                                    <Button variant="secondary"
                                        onClick={() =>
                                            setHeaderData((prev) => ({
                                                ...prev,
                                                year: null
                                            }))
                                        }
                                    >
                                        Remove
                                    </Button>
                                    <Button variant="primary"
                                        onClick={() => setCustomModal({ ...customModal, year: false })}
                                    >
                                        Apply
                                    </Button>
                                </Modal.Footer>
                            </Modal>
                        </div>
                    </div>

                    <div className="filterRow">
                        <div class="gridSearch">
                            <button className="btn btnDefault rounded-pill"
                                onClick={() => setCustomModal({ ...customModal, month: true })}
                            >
                                {headerdata.month
                                    ? getMonthFromDigit(headerdata.month)
                                    : "Choose month"}
                            </button>
                            <Modal centered size="md"
                                show={customModal.month}
                                onHide={() => setCustomModal({ ...customModal, month: false })}

                            >
                                <Modal.Header closeButton>
                                    <Modal.Title>Select Month</Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                    <Container>
                                        <Row>
                                            <Col className="d-flex align-items-center justify-content-center">
                                                <MonthCalendar
                                                    value={
                                                        headerdata.month
                                                            ? moment().month(headerdata.month - 1)
                                                            : null
                                                    }
                                                    onChange={(value) =>
                                                        DurationChangeHandler('month', value)
                                                    }
                                                />
                                            </Col>
                                        </Row>
                                    </Container>
                                </Modal.Body>
                                <Modal.Footer>
                                    <Button
                                        variant="secondary"
                                        onClick={() =>
                                            setHeaderData((prev) => ({
                                                ...prev,
                                                month: ''
                                            }))
                                        }
                                    >
                                        Remove
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={() => setCustomModal({ ...customModal, month: false })}
                                    >
                                        Apply
                                    </Button>
                                </Modal.Footer>
                            </Modal>
                        </div>
                    </div>
                    <div class="gridSearch">
                        <i class="fas fa-search"></i>
                        <input
                            type="text"
                            className="form-control rounded-pill"
                            name="search"
                            value={headerdata.fileName}
                            onChange={(e) => setHeaderData((prev) => ({ ...prev, fileName: e.target.value }))}
                            placeholder="Search"
                        />
                    </div>
                    <button
                        onClick={() =>

                            setHeaderData((prev) => ({
                                ...prev,
                                fileName: '',
                                month: '',
                                year: ''
                            }))
                        }
                        className="btn btnSecondary icon"
                    >

                        <i class="fa-solid fa-rotate-right"></i>

                    </button>



                    {(getCurrentUserFromCookies().role === Roles.ADMIN || getCurrentUserFromCookies().role === Roles.PREPARER) && (

                        <Link
                            className={`btn btnPrimary rounded-pill `}
                            
                            to={{
                                pathname: AUTH_ROUTES.CREATE_WORKFLOW,
                                search: "type=COMPLIANCE_FORM",
                            }}
                        > Add Workflow
                        </Link>
                    )}

                    {

                        !ArchiveFilter &&
                        <Button
                            className="classNamebtn btnPrimary rounded-pill"
                            onClick={handleArchiveReports}
                        >
                            Archive
                        </Button>
                    }

                </div>
            </div>

            <ModalInputCenter
                show={modalShow}
                cancelOption="Close"
                changeShow={() => setModalShow(false)}
                handleClick={() => setModalShow(false)}
                action=""
                heading="Email Send!"
            >
                <h4>Reports send on Email</h4>
                <p>All the Reports are sent to the email in the Zip format.</p>
            </ModalInputCenter>
        </div>

    )
}

export default WorkflowListHeader
