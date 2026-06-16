import React from 'react'
import { Accordion, Container, Row, Col, Pagination as PaginationBStrap, } from "react-bootstrap";
import Complience_Accordion from "../../assets/images/Complience_Accordion.svg"
import ReportRowTrustProgress from './ReportRowTrustProgress.tsx';
import Noreportpage from '../Noreportpage';


// Define types for props and other structures
interface DataProps {
  reportPeriod: string[];
  complianceFormData: Array<{
    id: number;
    task_month: string;
    [key: string]: any;
  }>;
  formsDataWithProgress: any;
  complianceIds: number[];
  setComplianceIds: React.Dispatch<React.SetStateAction<number[]>>;
}

interface PaginationInfo {
  itemsPerPage: number;
  currentPage: number;
  paginatedReports: DataProps['complianceFormData'];
}

interface TrustDepositReportProps {
  data: DataProps;
}



const TrustDepositReport: React.FC<TrustDepositReportProps> = ({ data }) => {
  const [paginationInfo, setPaginationInfo] = React.useState<PaginationInfo>({
    itemsPerPage: 10,
    currentPage: 1,
    paginatedReports: [],
  });

  const [checkedItems, setCheckedItems] = React.useState<number[]>([]);

  const handleSetPagination = (data: DataProps['complianceFormData'], updatedPagination: PaginationInfo) => {
    const indexOfLastReport = updatedPagination.currentPage * paginationInfo.itemsPerPage;
    const indexOfFirstReport = indexOfLastReport - paginationInfo.itemsPerPage;
    const currentReports = data.slice(indexOfFirstReport, indexOfLastReport);
    setPaginationInfo({
      ...updatedPagination,
      paginatedReports: currentReports,
    });
  };

  const headings = ['Trust deposit Slip', 'Month', 'Account', 'Status', 'Download'];


  const checkBoxFunction = (key: number, id: number) => {
    if (data.complianceIds.includes(id)) {
      data.setComplianceIds(data.complianceIds.filter((item) => item !== id))
    } else {
      data.setComplianceIds([...data.complianceIds, id])
    }

    setCheckedItems((prevChecked) =>
      prevChecked.includes(id)
        ? prevChecked.filter((item) => item !== id)
        : [...prevChecked, id]
    );
  }



  return (
    <>

      <Accordion defaultActiveKey="0">
        {
          data?.reportPeriod.length !== 0 && [...data.reportPeriod, "All Tasks"]?.map((element, index) => {
            return <Accordion.Item eventKey={index.toString()} key={index}>
              <Accordion.Header
                onClick={() =>
                  setPaginationInfo({
                    ...paginationInfo,
                    currentPage: 1,
                    paginatedReports: [],
                  })
                }
              >
                <img src={Complience_Accordion} alt='month_image' className='pe-2' />
                {element}
                <span className="count">
                  {
                    element === "All Tasks" ?
                      data?.complianceFormData?.length :
                      data?.complianceFormData?.filter((task) => {
                        return task.task_month === element;
                      })?.length
                  }
                </span>
              </Accordion.Header>

              <Accordion.Body>
                {element === "All Tasks" ||
                  data?.complianceFormData
                    ?.filter((task) => {
                      return task.task_month === element;
                    }).length >
                  0 ? (

                  <div className="tableOuter">
                    <table className="table customGrid">
                      <thead>
                        <tr>
                          {headings.map((e, key) => {
                            return <th key={key}>{e}</th>;
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {element === "All Tasks" ? paginationInfo.paginatedReports.length
                          ? paginationInfo.paginatedReports.map((element, index) => (
                            < ReportRowTrustProgress isChecked={checkedItems.includes(element.id)} key={index} checkBoxFunction={checkBoxFunction} data={element} />
                          ))
                          : data?.complianceFormData
                            .slice(0, 10)
                            .map((element, index) => (
                              < ReportRowTrustProgress isChecked={checkedItems.includes(element.id)} key={index} checkBoxFunction={checkBoxFunction} data={element} />
                            ))
                          : paginationInfo.paginatedReports.length
                            ? paginationInfo.paginatedReports?.filter((task) => {
                              return task.task_month === element;
                            }).map((element, index) => (
                              < ReportRowTrustProgress
                                isChecked={checkedItems.includes(element.id)}
                                key={index}
                                checkBoxFunction={checkBoxFunction}
                                data={element}
                              />

                            ))
                            : data?.complianceFormData
                              ?.filter((task) => {
                                return task.task_month === element;
                              })
                              .slice(0, 10)
                              .map((element, index) => (
                                <>
                                  < ReportRowTrustProgress
                                    isChecked={checkedItems.includes(element.id)}
                                    key={index}
                                    checkBoxFunction={checkBoxFunction}
                                    data={element}
                                  />

                                </>
                              ))}
                        {element === "All Tasks"
                          ? PaginationHelper(
                            data?.complianceFormData,
                            paginationInfo,
                            handleSetPagination
                          )
                          : PaginationHelper(
                            data?.complianceFormData?.filter((task) => {
                              return task.task_month === element;
                            }),
                            paginationInfo,
                            handleSetPagination
                          )}
                      </tbody>
                    </table>
                  </div>
                )
                  :
                  (<Noreportpage repeatPeriod={false} />)}
              </Accordion.Body>

            </Accordion.Item>
          })

        }

      </Accordion>
    </>
  )
}


const PaginationHelper = (
  data: DataProps['complianceFormData'],
  paginationInfo: PaginationInfo,
  handleSetPagination: (data: DataProps['complianceFormData'], updatedPagination: PaginationInfo) => void
) => {


  const totalPages = Math.ceil(data.length / 10);


  const handlePaginationClick = async (indexNumber: number) => {
    handleSetPagination(data, {
      ...paginationInfo,
      currentPage: indexNumber,
    });
  };

  const handlePreviousClick = async () => {
    if (paginationInfo.currentPage > 1) {
      await handlePaginationClick(paginationInfo.currentPage - 1);
    }
  };

  const handleNextClick = async () => {
    if (paginationInfo.currentPage < totalPages) {
      await handlePaginationClick(paginationInfo.currentPage + 1);
    }
  };

  return (
    <tr>
      <td colSpan={5}>
        <Container>
          <Row>
            <Col md={4} className="mx-auto">
              <PaginationBStrap className="justify-content-center mt-3">
                {/* Previous Button */}
                <PaginationBStrap.Prev onClick={handlePreviousClick} disabled={paginationInfo.currentPage === 1} />

                {/* Page Numbers with Slicing */}
                {Array.from({ length: totalPages }, (_, index) => index + 1)  // Create an array of page numbers
                  .slice(
                    Math.max(0, paginationInfo.currentPage - 3),  // Show 3 pages before the current page
                    paginationInfo.currentPage + 2               // Show 2 pages after the current page
                  )
                  .map((i) => (
                    <PaginationBStrap.Item
                      key={i}
                      onClick={() => handlePaginationClick(i)}
                      active={i === paginationInfo.currentPage}
                    >
                      {i}
                    </PaginationBStrap.Item>
                  ))
                }

                {/* Next Button */}
                <PaginationBStrap.Next onClick={handleNextClick} disabled={paginationInfo.currentPage === totalPages} />
              </PaginationBStrap>

            </Col>
          </Row>
        </Container>
      </td>
    </tr>
  );
};

export default TrustDepositReport