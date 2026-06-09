import { useEffect, useState } from 'react';
import { getCurrentUserFromCookies, getUserId, getUserSID } from '../../utils/helpers';
import Layout from "../../components/LayoutComponents/Layout";
import axios from "../../utils/axios";
import Noreportpage from "../Noreportpage";
import TrustDepositHeader from './TrustDepositHeader';
import Complience_Accordion from "../../assets/images/Complience_Accordion.svg"

import {
    Accordion,
    Container,
    Row,
    Col,
    Pagination as PaginationBStrap,
} from "react-bootstrap";

import {
    getDigitFromMonth,
} from "../../utils/helpers";
import Loader from "../../components/Loader";

import TrustDepositSlipBody from './TrustDepositSlipBodyType';
import { useSelector } from 'react-redux';
import { Roles } from '../../routes/Role.types';

const TrustDepositSlipnew = () => {


    const [headerdata, setHeaderData] = useState({
        month: '',
        year: '',
        archive: 0,
        search: "",
        status: "ALL"
    })


    const [reportMonthsAndYear, setReportMonthsAndYear] = useState([]);
    const [dataMonthWise, setDataMonthWise] = useState({});


    const [paginationInfo, setPaginationInfo] = useState({
        itemsPerPage: 10,
        currentPage: 1,
        paginatedReports: [],
    });

    const [selectedReports, setSelectedReports] = useState([]);
    const [selectAllChecked, setSelectAllChecked] = useState(false);
    const [currentSelectedMonthYear, setCurrentSelectedMonthYear] = useState('');
    const [haveDeleteofArchive, setHaveDeleteofArchive] = useState(false);
    const [loading, setLoading] = useState(false);
    console.log('headerdata state', headerdata)


    const { response } = useSelector((state) => state.userProfileInfo);


    useEffect(() => {

        // we modified the user id  cause in trust deposit slip we have not any preparer and reviewer condition we add 0 for both
        const modifyedUserId = getCurrentUserFromCookies().role == (Roles.PREPARER || Roles.REVIEWER) ? 0 : getUserId();

        const fetchReports = async () => {
            setLoading(true)
            try {

                const monthlyChecklist = await axios.get(`/new/task/list/${getCurrentUserFromCookies().role}/${modifyedUserId}/${getUserSID()}?isComplianceForm=2&archive=0&status=${headerdata.status}&year=${headerdata.year}&month=${headerdata.month}&search=${headerdata.search}`);

                if (monthlyChecklist) {
                    console.log('monthlyChecklist', monthlyChecklist.data.data.body.data)
                    setReportMonthsAndYear(monthlyChecklist.data.data.body.data)
                }
                setLoading(false)
            } catch (err) {
                setLoading(false)
                console.log("err", err);
            }
        };
        fetchReports();
    }, [headerdata, haveDeleteofArchive]);

    useEffect(async () => {

        let [monthString, secondString] = currentSelectedMonthYear.split(' ');

        monthString = getDigitFromMonth(monthString) || 'All Tasks';

        if (currentSelectedMonthYear) {
            setLoading(true)
            try {
                let reports = await axios.get(`/taskListByMonth?page=1&limit=10&isComplianceForm=2&archive=0&sid=${getUserSID()}&year=${secondString}&status=${headerdata.status}&search=${headerdata.search}&month=${monthString}&role=${getCurrentUserFromCookies().role}&userId=${getUserId()}`)

                if (reports) {
                    try {
                        setDataMonthWise((prev) => ({
                            ...prev,
                            [currentSelectedMonthYear]: reports.data.data.body
                        }))
                    } catch (error) {
                        console.log('myerror', error)
                    }
                }

                setLoading(false)
            } catch (err) {
                setLoading(false)
                console.log("err", err);
            }
        }

    }, [haveDeleteofArchive, headerdata.status]);




    return (
        <Layout title={`Welcome ${response?.username ? response?.username : ""} `}>
            <Loader isLoading={loading} loadingMsg="Loading..." />
            <div className="panel trans">
                <TrustDepositHeader
                    selectedReports={selectedReports}
                    setSelectedReports={setSelectedReports}
                    selectAllChecked={selectAllChecked}
                    setSelectAllChecked={setSelectAllChecked}
                    headerdata={headerdata}
                    setHeaderData={setHeaderData}
                    currentSelectedMonthYear={currentSelectedMonthYear}
                    dataMonthWise={dataMonthWise}
                    setDataMonthWise={setDataMonthWise}
                    reportMonthsAndYear={reportMonthsAndYear}
                    setReportMonthsAndYear={setReportMonthsAndYear}
                    setHaveDeleteofArchive={setHaveDeleteofArchive}
                />

                <div className="pBody">

                    <Accordion defaultActiveKey="0">
                        {
                            reportMonthsAndYear.length > 0 ? (
                                reportMonthsAndYear.map((data, index) => (
                                    <AccordionBody
                                        selectedReports={selectedReports}
                                        setSelectedReports={setSelectedReports}
                                        selectAllChecked={selectAllChecked}
                                        setSelectAllChecked={setSelectAllChecked}
                                        headerdata={headerdata}
                                        paginationInfo={paginationInfo}
                                        setPaginationInfo={setPaginationInfo}
                                        data={data}
                                        index={index}
                                        dataMonthWise={dataMonthWise}
                                        setDataMonthWise={setDataMonthWise}
                                        setCurrentSelectedMonthYear={setCurrentSelectedMonthYear}
                                    />
                                ))
                            ) : (
                                <Noreportpage repeatPeriod={false} />
                            )
                        }
                    </Accordion>
                </div>

            </div>
        </Layout>
    )
}

const handleMonthChange = async (data, index, dataMonthWise, setDataMonthWise) => {
    let { month_year } = data.data;


    // track current selected month and year
    data.setCurrentSelectedMonthYear(month_year)


    let month = month_year.split(' ')[0]
    let year = month_year.split(' ')[1];

    if (month_year == "All Tasks") {
        year = data.headerdata.year ? data.headerdata.year : '';
        month = data.headerdata.month ? data.headerdata.month : 'All Tasks'
    }

    if (month_year !== "All Tasks") {
        month = getDigitFromMonth(month_year.split(' ')[0]);
    }

    console.log('data.headerdata.year', year, month_year, month)

    try {
        let reports = await axios.get(`/taskListByMonth?page=1&limit=10&isComplianceForm=2&archive=0&year=${year}&status=${data.headerdata.status}&search=${data.headerdata.search}&sid=${getUserSID()}&month=${month}&role=${getCurrentUserFromCookies().role}&userId=${getUserId()}`)
        if (reports) {

            try {
                setDataMonthWise((prev) => ({
                    ...prev,
                    [month_year]: reports.data.data.body
                }))
            } catch (error) {
                console.log('myerror', error)
            }



        }
    } catch (err) {
        console.log("err", err);
    }

}

const AccordionBody = (data,) => {
    let { month_year, record_count } = data.data;

    console.log("month_yearery", data.headerdata.year);

    const headings = ["Month", "Account", "Download"];


    const handlePaginationClick = async (indexNumber) => {

        data.setPaginationInfo((prev) => ({ ...prev, currentPage: indexNumber }));

        try {

            let year = month_year.split(' ')[1];
            let month = month_year.split(' ')[0];

            if (month_year == "All Tasks") {
                year = data.headerdata.year ? data.headerdata.year : '';
                month = data.headerdata.month ? data.headerdata.month : 'All Tasks'
            }

            if (month_year !== "All Tasks") {
                month = getDigitFromMonth(month_year.split(' ')[0]);
            }

            let reports = await axios.get(`/taskListByMonth?page=${indexNumber}&limit=10&isComplianceForm=2&archive=0&sid=${getUserSID()}&year=${year}&status=${data.headerdata.status}&search=${data.headerdata.search}&month=${month}&role=${getCurrentUserFromCookies().role}&userId=${getUserId()}`)


            if (reports) {
                data.setDataMonthWise((prev) => ({
                    ...prev,
                    [month_year]: {
                        ...prev[month_year],
                        data: reports.data.data.body.data
                    }

                }))
            }
        } catch (err) {
            console.log("err", err);
        }

    };

    const handleSelectAll = (monthYear) => {
        const monthReports = monthYear.data.map(report => report.id);

        if (data.selectAllChecked) {
            data.setSelectedReports(prevSelected =>
                prevSelected.filter(reportId => !monthReports.includes(reportId))
            );
        } else {
            data.setSelectedReports(prevSelected =>
                [...prevSelected, ...monthReports.filter(reportId => !prevSelected.includes(reportId))]
            );
        }
        data.setSelectAllChecked(!data.selectAllChecked);
    };


    const handleSelectIndividual = (reportId) => {
        if (data.selectedReports.includes(reportId)) {
            // Remove the report from selected state
            data.setSelectedReports(prevSelected =>
                prevSelected.filter(id => id !== reportId)
            );
        } else {
            data.setSelectedReports(prevSelected => [...prevSelected, reportId]);
        }
        data.setSelectAllChecked(false);
    };


    return (
        <>
            <Accordion.Item eventKey={data.index}>
                <Accordion.Header onClick={() => {
                    handleMonthChange(data, data.index, data.dataMonthWise, data.setDataMonthWise)
                    handlePaginationClick(1)
                }
                }
                >

                    <img src={Complience_Accordion} alt='month_image' className='pe-2' />
                    {month_year}
                    <span className="count">{record_count}</span>

                </Accordion.Header>

                <Accordion.Body>

                    {
                        data.dataMonthWise[month_year] &&
                        data.dataMonthWise[month_year].data.length === 0 &&
                        <Noreportpage repeatPeriod={true} />
                    }

                    {
                        data.dataMonthWise[month_year] &&
                        data.dataMonthWise[month_year].data.length !== 0 &&
                        <div className="tableOuter">
                            <table className="table customGrid">
                                <thead>
                                    <tr className='text-center'>
                                        <th className="tdCheckBox">
                                            <input
                                                type="checkbox"
                                                name="nameCheck"
                                                className="form-check-input"
                                                checked={data.selectAllChecked}
                                                onChange={() => handleSelectAll(data.dataMonthWise[month_year])}
                                            />
                                            <span>Trust deposit Slip</span>
                                        </th>
                                        {headings.map((e, key) => {
                                            return <th key={key}>{e}</th>;
                                        })}
                                    </tr>
                                </thead>

                                <tbody>
                                    {
                                        data.dataMonthWise[month_year].data.map((e, key) => {
                                            return <TrustDepositSlipBody handleSelectIndividual={handleSelectIndividual}
                                                selectedReports={data.selectedReports}
                                                key={key} data={e} />
                                        })
                                    }


                                    <tr>
                                        <td colSpan={4}>
                                            <Container>
                                                <Row>
                                                    <Col md={4} className="mx-auto">

                                                        <PaginationBStrap className="justify-content-center mt-3">
                                                            {/* Previous Button */}
                                                            <PaginationBStrap.Prev
                                                                disabled={data.paginationInfo.currentPage === 1}
                                                                onClick={() => handlePaginationClick(data.paginationInfo.currentPage - 1)}
                                                            />

                                                            {/* Page Numbers with Slicing */}
                                                            {Array.from(
                                                                { length: Math.ceil(data.dataMonthWise[month_year].totalCount / data.dataMonthWise[month_year].limit) },
                                                                (_, index) => index + 1
                                                            )
                                                                .slice(
                                                                    Math.max(0, data.paginationInfo.currentPage - 3), // Show 3 pages before the current page
                                                                    data.paginationInfo.currentPage + 2              // Show 2 pages after the current page
                                                                )
                                                                .map((i) => (
                                                                    <PaginationBStrap.Item
                                                                        key={i}
                                                                        onClick={() => handlePaginationClick(i)}
                                                                        active={i === data.paginationInfo.currentPage}
                                                                    >
                                                                        {i}
                                                                    </PaginationBStrap.Item>
                                                                ))
                                                            }

                                                            {/* Next Button */}
                                                            <PaginationBStrap.Next
                                                                disabled={data.paginationInfo.currentPage === Math.ceil(data.dataMonthWise[month_year].totalCount / data.dataMonthWise[month_year].limit)}
                                                                onClick={() => handlePaginationClick(data.paginationInfo.currentPage + 1)}
                                                            />
                                                        </PaginationBStrap>

                                                    </Col>
                                                </Row>
                                            </Container>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    }

                </Accordion.Body>
            </Accordion.Item>
        </>
    )
}


export default TrustDepositSlipnew
