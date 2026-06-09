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

const ComplianceFormsHeader = ({
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

    const [disableDownloadReport, setDisableDownloadReport] = useState(false);
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
            return toast.error("Please select checklist to Archive");
        }

        let archiveType = selectAllChecked ? "all" : "individual";

        let filteredReports = dataMonthWise[currentSelectedMonthYear].data.filter((report) => {
            return selectedReports.includes(report.id);
        });

        const checkAnyTaskInPROGRESS = filteredReports.some((report) => {
            return report.task_status == 'INPROGRESS'
        })

        if(checkAnyTaskInPROGRESS){
             toast.error('Cannot Archive Compliance with In-Progress Task')
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

        axios.patch(`/updateArchieve/checklist`, {
            taskIds: selectedReports,
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
                toast.success('Forms archived successfully successfully');
            } else {
                toast.error('Something went wrong to Archive Checklist');
            }


        }).catch((err) => {
            toast.error('Internal Server Error')
        });

    }

    const handleDeleteEntries = () => {
        if (selectedReports.length === 0) {
            return toast.error("Please select Checklist to Archive");
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

                axios.delete(`/delete/checklist`, {
                    data: {
                        taskIds: selectedReports,
                        deleteType: deleteType,
                        sid: getUserSID(),
                        month: month,
                        year: year,
                        reportType: headerdata.reportType,
                        archive: headerdata.archive,
                        isComplianceForm: 1,
                        bucket_name: ["complianceformpdf","cloudactlawforms"]
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
                        toast.error('Something went wrong to Delete Checklist');
                    }

                }).catch((err) => {
                    // setDeleteloading(false)
                    console.log("err", err);
                    toast.error(`Error deleting Checklist ${err}`);

                })
            }
        });


    }

    const makeReportObjects = (
        filename,
        from_date,
        to_date,
        short_firmname,
        type,
        pdf_file
    ) => {
        return {
            filename: `${filename}`,
            from_date: from_date,
            to_date: to_date,
            short_firmname: `${short_firmname}`,
            ext: type,
            full_report_name: pdf_file,
        };
    };

    const downloadReports = (type) => {

        let selectedReportsId = dataMonthWise[currentSelectedMonthYear].data.filter((report) => {
            return selectedReports.includes(report.id);
        });

        let downloadtype = selectAllChecked ? "all" : "individual";
        let [monthString, secondString] = currentSelectedMonthYear.split(' ');

        let year = secondString
        let month = getDigitFromMonth(monthString);

        if (secondString == 'Checklist') {
            headerdata.year ? year = headerdata.year : year = new Date().getFullYear();
        }

        if (secondString == 'Checklist') {
            if (selectAllChecked) {
                downloadtype = 'total'
            }
        }

        const allReportObjs = [];
        let full_report_name;


        selectedReportsId.forEach((e) => {
            const { filename, from_date, to_date, short_firmname, pdf_file } = e;
            full_report_name = pdf_file.split(".")[0];

            allReportObjs.push(
                makeReportObjects(
                    filename,
                    from_date,
                    to_date,
                    short_firmname,
                    type,
                    full_report_name
                )
            );
        });

        setModalShow(true);

        axios
            .post(
                `/download/report/inbulk`, {
                month: month,
                year: year,
                ext: type,
                sid: getUserSID(),
                object: JSON.stringify(allReportObjs),
                type: downloadtype,
                reportType: headerdata.reportType,
                archive: headerdata.archive
            }

            )
            .then((res) => {
                console.log("res", res);
                if (res.data.data.code === 200) {
                    console.log("downloads send to email");
                }
            })
            .catch((err) => {
                console.log("err", err);
            });
    };


    const disabledTheDownloadReportButtons = () => {
        setDisableDownloadReport(true);

        setTimeout(() => setDisableDownloadReport(false), 5000);
    };

    const handleChangetab=(e)=>{
        setArchiveFilter(e)
    }


    return (
        <div>
            <div className="pHead">
                <div className="checkListType">

                    <span className="h5">
                        <svg
                            width="27"
                            height="35"
                            viewBox="0 0 27 35"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            {" "}
                            <path
                                opacity="0.4"
                                d="M26.1956 7.97441V31.6769C26.1956 33.0535 25.0801 34.1611 23.7114 34.1611H3.34746C1.97879 34.1611 0.863281 33.0535 0.863281 31.6769V7.97441C0.863281 6.59783 1.97879 5.49023 3.34746 5.49023H7.15284H7.39809V8.36207H19.6054V5.49023H23.7035C25.0801 5.49023 26.1956 6.59783 26.1956 7.97441Z"
                                fill="#73C3FD"
                            />{" "}
                            <path
                                d="M19.6116 5.4904V8.36223H7.4043V5.4904V3.19609H10.4264C10.7587 1.78786 11.9613 0.711914 13.4882 0.711914C15.0151 0.711914 16.2571 1.78786 16.5499 3.19609H19.6116V5.4904Z"
                                fill="#73C3FD"
                            />{" "}
                            <path
                                d="M3.26741 35H23.6234C25.4272 35 26.8908 33.568 26.8908 31.7563V8.0538C26.8908 6.25 25.4272 4.77848 23.6234 4.77848H20.3323V3.27532C20.3323 2.84019 19.9684 2.48418 19.5332 2.48418H17.057C16.4794 0.981013 15.0316 0 13.4098 0C11.7959 0 10.3718 0.981013 9.77057 2.48418H7.32595C6.89082 2.48418 6.56646 2.83228 6.56646 3.27532V4.77848H3.26741C1.46361 4.77848 0 6.25 0 8.0538V31.7563C0 33.568 1.46361 35 3.26741 35ZM8.14873 4.06646H10.3481C10.712 4.06646 11.0364 3.81329 11.1155 3.45728C11.3766 2.33386 12.3022 1.58228 13.4098 1.58228C14.5174 1.58228 15.4747 2.36551 15.6962 3.43354C15.7753 3.79747 16.0918 4.06646 16.4715 4.06646H18.75V7.62658H8.14873V4.06646ZM1.58228 8.0538C1.58228 7.12025 2.33386 6.36076 3.26741 6.36076H6.56646V8.44145C6.56646 8.87658 6.89082 9.20886 7.32595 9.20886H19.5332C19.9684 9.20886 20.3323 8.87658 20.3323 8.44145V6.36076H23.6313C24.5649 6.36076 25.3165 7.12025 25.3165 8.0538V31.7563C25.3165 32.6899 24.5649 33.4177 23.6313 33.4177H3.26741C2.33386 33.4177 1.58228 32.6899 1.58228 31.7563V8.0538Z"
                                fill="#171D34"
                            />{" "}
                            <path
                                d="M5.88628 22.8081C6.04451 22.9663 6.25021 23.0454 6.4559 23.0454C6.65369 23.0454 6.84356 22.9742 7.00179 22.8318L10.2296 19.7859C10.5461 19.4853 10.5619 18.9869 10.2613 18.6704C9.96065 18.354 9.46223 18.3381 9.14578 18.6388L6.48755 21.1546L5.33249 19.9679C5.03185 19.6514 4.52552 19.6435 4.21698 19.9521C3.90052 20.2527 3.89261 20.759 4.20116 21.0676L5.88628 22.8081Z"
                                fill="#171D34"
                            />{" "}
                            <path
                                d="M12.6193 22.0256H22.1367C22.5718 22.0256 22.9278 21.6696 22.9278 21.2345C22.9278 20.7994 22.5718 20.4434 22.1367 20.4434H12.6193C12.1841 20.4434 11.8281 20.7994 11.8281 21.2345C11.8281 21.6696 12.1841 22.0256 12.6193 22.0256Z"
                                fill="#171D34"
                            />{" "}
                            <path
                                d="M5.88619 16.187C6.04441 16.3452 6.25011 16.4243 6.45581 16.4243C6.65359 16.4243 6.84346 16.3531 7.00169 16.2107L10.2295 13.1648C10.546 12.8642 10.5618 12.3658 10.2612 12.0493C9.96055 11.7329 9.46213 11.7171 9.14568 12.0177L6.48745 14.5335L5.3403 13.3547C5.03967 13.0383 4.53334 13.0303 4.22479 13.3389C3.90834 13.6395 3.90043 14.1458 4.20897 14.4544L5.88619 16.187Z"
                                fill="#171D34"
                            />{" "}
                            <path
                                d="M12.6193 15.3801H22.1367C22.5718 15.3801 22.9278 15.0241 22.9278 14.589C22.9278 14.1539 22.5718 13.7979 22.1367 13.7979H12.6193C12.1841 13.7979 11.8281 14.1539 11.8281 14.589C11.8281 15.0241 12.1841 15.3801 12.6193 15.3801Z"
                                fill="#171D34"
                            />{" "}
                            <path
                                d="M5.88619 29.4302C6.04441 29.5884 6.25011 29.6675 6.45581 29.6675C6.65359 29.6675 6.84346 29.5963 7.00169 29.4539L10.2295 26.408C10.546 26.1074 10.5618 25.609 10.2612 25.2925C9.96055 24.976 9.46213 24.9602 9.14568 25.2608L6.48745 27.7767L5.3403 26.5979C5.03967 26.2814 4.53334 26.2735 4.22479 26.5821C3.90834 26.8827 3.90043 27.389 4.20897 27.6976L5.88619 29.4302Z"
                                fill="#171D34"
                            />{" "}
                            <path
                                d="M12.6193 28.6711H22.1367C22.5718 28.6711 22.9278 28.3151 22.9278 27.88C22.9278 27.4449 22.5718 27.0889 22.1367 27.0889H12.6193C12.1841 27.0889 11.8281 27.4449 11.8281 27.88C11.8281 28.3151 12.1841 28.6711 12.6193 28.6711Z"
                                fill="#171D34"
                            />{" "}
                        </svg>
                        Compliance form

                        {/* {
                        !ArchiveFilter && 
                        selectedReports.length > 1 && <div className="btnGroup">
                            <button
                                disabled={disableDownloadReport}
                                className={`pdf ${disableDownloadReport ? "disabled" : ""}`}
                                onClick={() => {
                                    downloadReports("pdf");
                                    disabledTheDownloadReportButtons();
                                }}
                            >
                                <i className="fa-solid fa-file-pdf"></i> PDF
                            </button>
                            <button

                                disabled={disableDownloadReport}
                                onClick={() => {
                                    downloadReports("xlsx");
                                    disabledTheDownloadReportButtons();
                                }}
                                className={`excel ${disableDownloadReport ? "disabled" : ""}`}

                            >
                                <i className="fa-regular fa-file-excel"></i> Excel
                            </button>
                        </div>
                    } */}


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
                            <option value="INPROGRESS">In Progress</option>
                            <option value="DONE">Approved</option>
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
                                pathname: AUTH_ROUTES.CREATE_TASKS,
                                search: "type=COMPLIANCE_FORM",
                            }}
                        > Add compliance form
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

export default ComplianceFormsHeader
