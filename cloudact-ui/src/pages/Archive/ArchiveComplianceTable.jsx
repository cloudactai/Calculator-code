import { useEffect, useState } from 'react';
import {
    Accordion,
    Container,
    Row,
    Col,
    Pagination as PaginationBStrap,
} from "react-bootstrap";
import { useSelector } from 'react-redux';


import { getCurrentUserFromCookies, getUserId, getUserSID } from '../../utils/helpers';
import axios from "../../utils/axios";
import Noreportpage from "../Noreportpage";
import ComplianceFormsBody from '../complianceFormsNew/ComplianceFormsBody.tsx';
import { getDigitFromMonth } from "../../utils/helpers";
import Loader from "../../components/Loader";
import ComplianceFormsHeader from '../complianceFormsNew/ComplianceFormsHeader';

const AchiveComplianceTable = ({ setArchiveFilter, ArchiveFilter }) => {

    const [headerdata, setHeaderData] = useState({
        month: '',
        year: '',
        archive: 1,
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



    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true)
            try {

                const monthlyChecklist = await axios.get(`/new/task/list/${getCurrentUserFromCookies().role}/${getUserId()}/${getUserSID()}?isComplianceForm=1&archive=${headerdata.archive}&status=${headerdata.status}&year=${headerdata.year}&month=${headerdata.month}&search=${headerdata.search}`);

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
                let reports = await axios.get(`/taskListByMonth?page=1&limit=10&isComplianceForm=1&archive=${headerdata.archive}&sid=${getUserSID()}&year=${secondString}&status=${headerdata.status}&search=${headerdata.search}&month=${monthString}&role=${getCurrentUserFromCookies().role}&userId=${getUserId()}`)

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
        <>
            <Loader isLoading={loading} loadingMsg="Loading..." />
            <div className="panel trans">
                <ComplianceFormsHeader
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
                    setArchiveFilter={setArchiveFilter}
                    ArchiveFilter={ArchiveFilter}
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
        </>
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
        let reports = await axios.get(`/taskListByMonth?page=1&limit=10&isComplianceForm=1&archive=1&year=${year}&status=${data.headerdata.status}&search=${data.headerdata.search}&sid=${getUserSID()}&month=${month}&role=${getCurrentUserFromCookies().role}&userId=${getUserId()}`)
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
    const headings = ["Month", "Progress", "Account", "Due-Date", "Status", "Download"];

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

            let reports = await axios.get(`/taskListByMonth?page=${indexNumber}&limit=10&isComplianceForm=1&archive=1&sid=${getUserSID()}&year=${year}&status=${data.headerdata.status}&search=${data.headerdata.search}&month=${month}&role=${getCurrentUserFromCookies().role}&userId=${getUserId()}`)


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

                    {reportCalSvg()}
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
                                            <span>Task Name</span>
                                        </th>
                                        {headings.map((e, key) => {
                                            return <th key={key}>{e}</th>;
                                        })}
                                    </tr>
                                </thead>

                                <tbody>
                                    {
                                        data.dataMonthWise[month_year].data.map((e, key) => {
                                            return <ComplianceFormsBody handleSelectIndividual={handleSelectIndividual}
                                                selectedReports={data.selectedReports}
                                                key={key} data={e} />
                                        })
                                    }


                                    <tr>
                                        <td colSpan={7}>
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
                                                                { length: Math.ceil(data.dataMonthWise[month_year].totalCount / data.dataMonthWise[month_year].limit) }, // Calculate the total number of pages
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
                                                                ))}

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

const reportCalSvg = () => <svg
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
>
    <path
        d="M30.5637 11.1938H5.43908C5.31069 11.1938 5.18961 11.1621 5.08203 11.1074V31.3632C5.08203 32.1692 5.73552 32.8227 6.54158 32.8227H29.4612C30.2673 32.8227 30.9207 32.1692 30.9207 31.3632V11.1074C30.8132 11.1621 30.6921 11.1938 30.5637 11.1938Z"
        fill="#F5F9FF"
    />
    <path
        d="M7.91161 2.04883C7.47061 2.04883 7.11328 2.4063 7.11328 2.84716V6.47612C7.11328 6.91712 7.47075 7.27445 7.91161 7.27445C8.35247 7.27445 8.70994 6.91698 8.70994 6.47612V2.84716C8.70994 2.40616 8.35261 2.04883 7.91161 2.04883Z"
        fill="#F6BD3D"
    />
    <path
        d="M11.396 2.04883C10.955 2.04883 10.5977 2.4063 10.5977 2.84716V6.47612C10.5977 6.91712 10.9551 7.27445 11.396 7.27445C11.8368 7.27445 12.1943 6.91698 12.1943 6.47612V2.84716C12.1945 2.40616 11.837 2.04883 11.396 2.04883Z"
        fill="#F6BD3D"
    />
    <path
        d="M24.605 2.04883C24.164 2.04883 23.8066 2.4063 23.8066 2.84716V6.47612C23.8066 6.91712 24.1641 7.27445 24.605 7.27445C25.0458 7.27445 25.4033 6.91698 25.4033 6.47612V2.84716C25.4033 2.40616 25.0458 2.04883 24.605 2.04883Z"
        fill="#F6BD3D"
    />
    <path
        d="M28.0893 2.04883C27.6483 2.04883 27.291 2.4063 27.291 2.84716V6.47612C27.291 6.91712 27.6485 7.27445 28.0893 7.27445C28.5303 7.27445 28.8877 6.91698 28.8877 6.47612V2.84716C28.8877 2.40616 28.5303 2.04883 28.0893 2.04883Z"
        fill="#F6BD3D"
    />
    <path
        opacity="0.7"
        d="M30.5635 4.73584H28.8883V6.47776C28.8883 6.91876 28.5308 7.27609 28.0899 7.27609C27.6489 7.27609 27.2916 6.91862 27.2916 6.47776V4.73584H25.4046V6.47776C25.4046 6.91876 25.0471 7.27609 24.6062 7.27609C24.1654 7.27609 23.8079 6.91862 23.8079 6.47776V4.73584H12.1948V6.47776C12.1948 6.91876 11.8373 7.27609 11.3965 7.27609C10.9556 7.27609 10.5982 6.91862 10.5982 6.47776V4.73584H8.71083V6.47776C8.71083 6.91876 8.35336 7.27609 7.9125 7.27609C7.47164 7.27609 7.11417 6.91862 7.11417 6.47776V4.73584H5.43891C5.00311 4.73584 4.64648 5.09247 4.64648 5.52826V10.403C4.64648 10.8388 5.00311 11.1954 5.43891 11.1954H30.5637C30.9995 11.1954 31.3561 10.8388 31.3561 10.403V5.5284C31.3561 5.09247 30.9995 4.73584 30.5635 4.73584Z"
        fill="#307FF4"
    />
    <path
        opacity="0.7"
        d="M15.3887 8.00096C15.3887 8.44196 15.7461 8.79929 16.187 8.79929H19.816C20.257 8.79929 20.6143 8.44182 20.6143 8.00096C20.6143 7.55996 20.2568 7.20264 19.816 7.20264H16.187C15.7461 7.20264 15.3887 7.56011 15.3887 8.00096Z"
        fill="#73C3FD"
    />
    <path
        opacity="0.5"
        d="M15.1168 16.5205C14.877 16.3868 14.8004 15.9229 14.8004 15.9229C14.7535 15.8174 14.6668 15.5713 14.6949 15.4307C14.7231 15.29 14.9879 15.0439 15.1168 14.9385L15.9254 14.0947L16.3473 13.6729L17.2262 13.3916L18.1754 13.4268L18.8082 14.2705L18.984 21.2666C18.9371 21.5479 18.759 22.1947 18.4215 22.5322C18.084 22.8697 17.9059 22.6729 17.859 22.5322L17.3317 22.4268L17.0856 21.8994L17.0153 18.7002V15.4307L16.1715 16.415C16.1715 16.415 15.4415 16.7015 15.1168 16.5205Z"
        fill="#73C3FD"
    />
    <path
        opacity="0.8"
        d="M18.9141 14.376L18.4219 13.5674L19.0195 13.7432L19.582 14.4111V21.4775L19.5469 22.2158L19.0195 22.5322H18.4219L18.9141 21.7939V15.8174V14.376Z"
        fill="#307FF4"
    />
    <path
        d="M16.3345 16.5064L16.8493 15.8885V21.6613C16.8497 21.9569 16.9673 22.2403 17.1763 22.4494C17.3854 22.6584 17.6688 22.776 17.9645 22.7764H18.761C19.0144 22.7761 19.2573 22.6753 19.4365 22.4961C19.6157 22.3169 19.7165 22.074 19.7168 21.8206V14.8113C19.7163 14.3889 19.5483 13.984 19.2497 13.6854C18.951 13.3867 18.5461 13.2187 18.1238 13.2183H17.3272C16.7906 13.2183 16.3743 13.4244 15.9402 13.9021L14.8251 15.0173C14.6381 15.2213 14.5385 15.4905 14.5474 15.7671C14.5385 16.0437 14.6381 16.3128 14.8251 16.5169C15.0356 16.6975 15.3044 16.7959 15.5818 16.794C15.8591 16.7921 16.1265 16.6899 16.3345 16.5064ZM19.3982 14.8113V21.8206C19.3982 21.9896 19.331 22.1516 19.2115 22.2711C19.092 22.3906 18.93 22.4578 18.761 22.4578H18.7433C18.8497 22.3542 18.9343 22.2304 18.9921 22.0936C19.0499 21.9568 19.0796 21.8098 19.0796 21.6613V14.8113C19.0794 14.5809 19.0292 14.3533 18.9324 14.1443C18.8356 13.9352 18.6946 13.7497 18.519 13.6006C18.7743 13.6842 18.9967 13.8462 19.1546 14.0636C19.3124 14.281 19.3977 14.5426 19.3982 14.8113ZM15.0503 16.2917C14.9242 16.1468 14.8582 15.9591 14.866 15.7671C14.8582 15.5751 14.9242 15.3874 15.0503 15.2425L16.1707 14.122C16.5484 13.7064 16.8836 13.5369 17.3272 13.5369H17.4865C17.8244 13.5372 18.1484 13.6716 18.3873 13.9106C18.6262 14.1495 18.7606 14.4734 18.761 14.8113V21.6613C18.761 21.8725 18.677 22.0751 18.5277 22.2245C18.3783 22.3738 18.1757 22.4578 17.9645 22.4578C17.7532 22.4578 17.5506 22.3738 17.4012 22.2245C17.2519 22.0751 17.1679 21.8725 17.1679 21.6613V15.4485C17.168 15.4157 17.1579 15.3838 17.1391 15.357C17.1203 15.3302 17.0937 15.3098 17.0629 15.2986C17.0322 15.2875 16.9987 15.2861 16.9671 15.2946C16.9355 15.3032 16.9073 15.3212 16.8863 15.3464L16.0995 16.2917C15.9505 16.4106 15.7655 16.4753 15.5749 16.4753C15.3843 16.4753 15.1993 16.4106 15.0503 16.2917Z"
        fill="#171D34"
    />
    <path
        d="M17.7581 14.2815L18.0348 14.466L18.2116 14.2009L17.9347 14.0164C17.7142 13.8682 17.4479 13.804 17.184 13.8354C16.9202 13.8669 16.6764 13.9919 16.4969 14.1878L15.1387 15.659L15.3728 15.8753L16.7309 14.4039C16.8591 14.2639 17.0333 14.1746 17.2218 14.1521C17.4103 14.1297 17.6006 14.1756 17.7581 14.2815Z"
        fill="#171D34"
    />
    <path
        d="M17.8049 21.6615V19.9092H17.4863V21.6615C17.4863 21.7882 17.5367 21.9098 17.6263 21.9994C17.7159 22.0891 17.8375 22.1394 17.9642 22.1394H18.1235V21.8208H17.9642C17.922 21.8208 17.8815 21.804 17.8516 21.7741C17.8217 21.7443 17.8049 21.7037 17.8049 21.6615Z"
        fill="#171D34"
    />
    <path
        d="M18.123 14.6519H18.4417V14.9705H18.123V14.6519Z"
        fill="#171D34"
    />
    <path
        d="M19.2789 29.9045C19.1238 29.9045 18.9819 29.8012 18.9396 29.6442L18.2012 26.9011L17.4626 29.6442C17.4123 29.8317 17.2196 29.9429 17.0317 29.8923C16.8443 29.8418 16.7332 29.6489 16.7837 29.4614L17.8617 25.4574C17.903 25.304 18.0423 25.1973 18.2012 25.1973C18.3601 25.1973 18.4993 25.304 18.5406 25.4574L19.6187 29.4614C19.6691 29.6489 19.5581 29.8418 19.3706 29.8923C19.3399 29.9006 19.3091 29.9045 19.2789 29.9045Z"
        fill="#171D34"
    />
    <path
        d="M18.818 28.8164H17.5859C17.3917 28.8164 17.2344 28.659 17.2344 28.4648C17.2344 28.2706 17.3917 28.1133 17.5859 28.1133H18.818C19.0122 28.1133 19.1695 28.2706 19.1695 28.4648C19.1695 28.659 19.012 28.8164 18.818 28.8164Z"
        fill="#171D34"
    />
    <path
        d="M15.2376 29.9034H13.8516C13.6574 29.9034 13.5 29.7461 13.5 29.5519V25.5479C13.5 25.3536 13.6574 25.1963 13.8516 25.1963H15.2376C15.856 25.1963 16.3592 25.6994 16.3592 26.3179V28.7819C16.359 29.4003 15.856 29.9034 15.2376 29.9034ZM14.2031 29.2003H15.2376C15.4683 29.2003 15.6561 29.0126 15.6561 28.7818V26.3178C15.6561 26.087 15.4683 25.8993 15.2376 25.8993H14.2031V29.2003Z"
        fill="#171D34"
    />
    <path
        d="M21.4133 28.3644H20.7974C20.1789 28.3644 19.6758 27.8613 19.6758 27.2428V25.5488C19.6758 25.3546 19.8331 25.1973 20.0273 25.1973C20.2215 25.1973 20.3789 25.3546 20.3789 25.5488V27.2428C20.3789 27.4736 20.5666 27.6613 20.7974 27.6613H21.4133C21.6441 27.6613 21.8318 27.4736 21.8318 27.2428V25.5488C21.8318 25.3546 21.9892 25.1973 22.1834 25.1973C22.3776 25.1973 22.535 25.3546 22.535 25.5488V27.2428C22.535 27.8614 22.0318 28.3644 21.4133 28.3644Z"
        fill="#171D34"
    />
    <path
        d="M21.1055 29.9042C20.9113 29.9042 20.7539 29.7469 20.7539 29.5527V28.0127C20.7539 27.8185 20.9113 27.6611 21.1055 27.6611C21.2997 27.6611 21.457 27.8185 21.457 28.0127V29.5527C21.457 29.7467 21.2997 29.9042 21.1055 29.9042Z"
        fill="#171D34"
    />
    <path
        d="M7.91175 7.6263C7.27767 7.6263 6.76172 7.11048 6.76172 6.47641V2.8473C6.76172 2.21322 7.27753 1.69727 7.91175 1.69727C8.54583 1.69727 9.06164 2.21308 9.06164 2.8473V6.47627C9.06178 7.11034 8.54583 7.6263 7.91175 7.6263ZM7.91175 2.40053C7.66537 2.40053 7.46484 2.60092 7.46484 2.84744V6.47641C7.46484 6.72278 7.66523 6.92317 7.91175 6.92317C8.15812 6.92317 8.35852 6.72278 8.35852 6.47641V2.8473C8.35866 2.60092 8.15812 2.40053 7.91175 2.40053Z"
        fill="#171D34"
    />
    <path
        d="M11.396 7.6263C10.7619 7.6263 10.2461 7.11048 10.2461 6.47641V2.8473C10.2461 2.21322 10.7619 1.69727 11.396 1.69727C12.0301 1.69727 12.5459 2.21308 12.5459 2.8473V6.47627C12.5459 7.11034 12.0301 7.6263 11.396 7.6263ZM11.396 2.40053C11.1496 2.40053 10.9492 2.60092 10.9492 2.84744V6.47641C10.9492 6.72278 11.1496 6.92317 11.396 6.92317C11.6424 6.92317 11.8427 6.72278 11.8427 6.47641V2.8473C11.8427 2.60092 11.6424 2.40053 11.396 2.40053Z"
        fill="#171D34"
    />
    <path
        d="M24.605 7.6263C23.9709 7.6263 23.4551 7.11048 23.4551 6.47641V2.8473C23.4551 2.21322 23.9709 1.69727 24.605 1.69727C25.239 1.69727 25.7549 2.21308 25.7549 2.8473V6.47627C25.7549 7.11034 25.239 7.6263 24.605 7.6263ZM24.605 2.40053C24.3586 2.40053 24.1582 2.60092 24.1582 2.84744V6.47641C24.1582 6.72278 24.3586 6.92317 24.605 6.92317C24.8513 6.92317 25.0517 6.72278 25.0517 6.47641V2.8473C25.0517 2.60092 24.8513 2.40053 24.605 2.40053Z"
        fill="#171D34"
    />
    <path
        d="M28.0893 7.6263C27.4553 7.6263 26.9395 7.11048 26.9395 6.47641V2.8473C26.9395 2.21322 27.4553 1.69727 28.0893 1.69727C28.7234 1.69727 29.2394 2.21308 29.2394 2.8473V6.47627C29.2392 7.11034 28.7234 7.6263 28.0893 7.6263ZM28.0893 2.40053C27.843 2.40053 27.6426 2.60092 27.6426 2.84744V6.47641C27.6426 6.72278 27.843 6.92317 28.0893 6.92317C28.3357 6.92317 28.5362 6.72278 28.5362 6.47641V2.8473C28.5361 2.60092 28.3357 2.40053 28.0893 2.40053Z"
        fill="#171D34"
    />
    <path
        d="M10.4512 5.0874H8.88672C8.69252 5.0874 8.53516 4.93004 8.53516 4.73584C8.53516 4.54164 8.69252 4.38428 8.88672 4.38428H10.4512C10.6454 4.38428 10.8027 4.54164 10.8027 4.73584C10.8027 4.93004 10.6454 5.0874 10.4512 5.0874Z"
        fill="#171D34"
    />
    <path
        d="M23.7012 5.0874H12.3223C12.1281 5.0874 11.9707 4.93004 11.9707 4.73584C11.9707 4.54164 12.1281 4.38428 12.3223 4.38428H23.7012C23.8954 4.38428 24.0528 4.54164 24.0528 4.73584C24.0528 4.93004 23.8954 5.0874 23.7012 5.0874Z"
        fill="#171D34"
    />
    <path
        d="M27.2344 5.0874H25.5117C25.3175 5.0874 25.1602 4.93004 25.1602 4.73584C25.1602 4.54164 25.3175 4.38428 25.5117 4.38428H27.2344C27.4286 4.38428 27.5859 4.54164 27.5859 4.73584C27.5859 4.93004 27.4286 5.0874 27.2344 5.0874Z"
        fill="#171D34"
    />
    <path
        d="M30.5638 11.5472H5.43891C4.80806 11.5472 4.29492 11.034 4.29492 10.4032V5.5284C4.29492 4.89756 4.80806 4.38428 5.43891 4.38428H6.91842C7.11263 4.38428 7.26998 4.54164 7.26998 4.73584C7.26998 4.93004 7.11263 5.0874 6.91842 5.0874H5.43891C5.19577 5.0874 4.99805 5.28526 4.99805 5.5284V10.4032C4.99805 10.6463 5.19577 10.844 5.43891 10.844H30.5637C30.8068 10.844 31.0045 10.6463 31.0045 10.4032V5.5284C31.0045 5.28526 30.8068 5.0874 30.5637 5.0874H28.9919C28.7977 5.0874 28.6403 4.93004 28.6403 4.73584C28.6403 4.54164 28.7977 4.38428 28.9919 4.38428H30.5637C31.1945 4.38428 31.7077 4.89756 31.7077 5.5284V10.4032C31.7078 11.0339 31.1945 11.5472 30.5638 11.5472Z"
        fill="#171D34"
    />
    <path
        d="M29.4612 33.1758H6.54158C5.54286 33.1758 4.73047 32.3635 4.73047 31.3647V11.1953C4.73047 11.0011 4.88783 10.8438 5.08203 10.8438C5.27623 10.8438 5.43359 11.0011 5.43359 11.1953V31.3647C5.43359 31.9756 5.9307 32.4727 6.54158 32.4727H29.4611C30.0721 32.4727 30.569 31.9756 30.569 31.3647V11.1953C30.569 11.0011 30.7264 10.8438 30.9206 10.8438C31.1148 10.8438 31.2722 11.0011 31.2722 11.1953V31.3647C31.2723 32.3635 30.4598 33.1758 29.4612 33.1758Z"
        fill="#171D34"
    />
    <path
        d="M19.8161 9.151H16.187C15.5529 9.151 15.0371 8.63518 15.0371 8.00111C15.0371 7.36703 15.5529 6.85107 16.187 6.85107H19.8161C20.4502 6.85107 20.966 7.36689 20.966 8.00111C20.9661 8.63504 20.4502 9.151 19.8161 9.151ZM16.1871 7.5542C15.9408 7.5542 15.7404 7.75459 15.7404 8.00111C15.7404 8.24748 15.9408 8.44787 16.1871 8.44787H19.8163C20.0626 8.44787 20.263 8.24748 20.263 8.00111C20.263 7.75473 20.0626 7.5542 19.8163 7.5542H16.1871Z"
        fill="#171D34"
    />
</svg>

export default AchiveComplianceTable
