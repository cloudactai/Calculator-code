import React from 'react'
import { showElementForReportType } from '.';

type Props =  {
  children: React.ReactChildren,
  data: any,
  page: number | string,
  elem: string,
}

const ReportWrapper = ({children, data, page, elem}: Props) => {
    const reportType = data.report_type;
    const calculatorType = data.calculator_type;

    console.log("showElementForReportType()",showElementForReportType(calculatorType, reportType, page, elem))

  return (
    showElementForReportType(calculatorType, reportType, page, elem) ?
    <>{children}</> : null
  )
}

export default ReportWrapper