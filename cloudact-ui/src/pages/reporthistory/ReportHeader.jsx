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
    getUserId,
    getUserSID,
    last12Months,
    getMonthsBetweenDates,
    getDigitFromMonth
} from "../../utils/helpers";
import Swal from 'sweetalert2'
import toast from "react-hot-toast";
import axios from "../../utils/axios";
import { getShortFirmname } from "../../utils/helpers";
import ModalInputCenter from "../../components/ModalInputCenter";
import { AUTH_ROUTES } from "../../routes/Routes.types";
import Nav from 'react-bootstrap/Nav';


const ReportHeader = ({
    selectedReports,
    setSelectedReports,
    selectAllChecked,
    setSelectAllChecked,
    headerdata,
    setHeaderData,
    currentSelectedMonthYear,
    dataMonthWise,
    setDataMonthWise,
    reportMonthsAndYear,
    setReportMonthsAndYear,
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
            return toast.error("Please select reports to Archive");
        }

        let archiveType = selectAllChecked ? "all" : "individual";

        // let filteredReports = dataMonthWise[currentSelectedMonthYear].data.filter((report) => {
        //     return !selectedReports.includes(report.id);
        // });

        // let filterCount = reportMonthsAndYear.find((ele) => ele.month_year == currentSelectedMonthYear)

        let [monthString, secondString] = currentSelectedMonthYear.split(' ');

        let year = secondString
        let month = getDigitFromMonth(monthString);

        if (secondString == 'Reports') {
            headerdata.year ? year = headerdata.year : year = new Date().getFullYear();
        }

        if (secondString == 'Reports') {
            if (selectAllChecked) {
                archiveType = 'total'
            }
        }

        axios.patch(`/archive/update/report`, {
            reportIds: selectedReports,
            archiveType: archiveType,
            sid: getUserSID(),
            month: month,
            year: year,
            reportType: headerdata.reportType,
            archive: headerdata.archive

        }).then((res) => {

            if (res.status == 200) {

                // setReportMonthsAndYear((prev) =>
                //     prev.map((item) =>
                //         item.month_year === currentSelectedMonthYear
                //             ? { ...item, record_count: filterCount.record_count - selectedReports.length }
                //             : item
                //     )
                // );

                // setDataMonthWise((prev) => ({
                //     ...prev,
                //     [currentSelectedMonthYear]: {
                //         ...prev[currentSelectedMonthYear],
                //         data: filteredReports
                //     }
                // }))

                setSelectAllChecked(false);
                setSelectedReports([]);
                setHaveDeleteofArchive((prev) => !prev)

                toast.success('Reports archived successfully');
            } else {
                toast.error('Something went wrong to Archive Reports');
            }


        }).catch((err) => {
            toast.error('Internal Server Error')
        });

    }

    const handleDeleteEntries = () => {
        if (selectedReports.length === 0) {
            return toast.error("Please select reports to Archive");
        }

        let deleteType = selectAllChecked ? "all" : "individual";

        // let filteredReports = dataMonthWise[currentSelectedMonthYear].data.filter((report) => {
        //     return !selectedReports.includes(report.id);
        // });

        // let filterCount = reportMonthsAndYear.find((ele) => ele.month_year == currentSelectedMonthYear)

        let [monthString, secondString] = currentSelectedMonthYear.split(' ');

        let year = secondString
        let month = getDigitFromMonth(monthString);

        if (secondString == 'Reports') {
            headerdata.year ? year = headerdata.year : year = new Date().getFullYear();
        }

        if (secondString == 'Reports') {
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

                axios.delete(`/delete/report`, {
                    data: {
                        reportIds: selectedReports,
                        deleteType: deleteType,
                        sid: getUserSID(),
                        month: month,
                        year: year,
                        bucket_name: `${getShortFirmname().toLowerCase()}`,
                        reportType: headerdata.reportType,
                        archive: headerdata.archive
                    }
                }).then((res) => {

                    if (res.status == 200) {
                        // i wrote a logic if we don't want to call api again.

                        // setReportMonthsAndYear((prev) =>
                        //     prev.map((item) =>
                        //         item.month_year === currentSelectedMonthYear
                        //             ? { ...item, record_count: recordCount }
                        //             : item
                        //     )
                        // );

                        // setDataMonthWise((prev) => ({
                        //     ...prev,
                        //     [currentSelectedMonthYear]: {
                        //         ...prev[currentSelectedMonthYear],
                        //         data: filteredReports
                        //     }
                        // }))

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
                        toast.error('Something went wrong to Delete Reports');
                    }

                }).catch((err) => {
                    // setDeleteloading(false)
                    console.log("err", err);
                    toast.error(`Error deleting reports ${err}`);

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

        if (secondString == 'Reports') {
            headerdata.year ? year = headerdata.year : year = new Date().getFullYear();
        }

        if (secondString == 'Reports') {
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
                    Report history

                    
                    {
                        !ArchiveFilter && 
                        selectedReports.length > 1 && <div className="btnGroup">
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
                    }


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


                    <Link className="btn btnPrimary rounded-pill" to={
                        headerdata.reportType == '0' ? `${AUTH_ROUTES.RUN_REPORT}` :
                            `${AUTH_ROUTES.OPERATIONAL_REPORTS}`
                    }>
                        Generate Report
                    </Link>
                
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


            {/* <div className="pBody"> */}
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

        // </div>
    )
}

export default ReportHeader
