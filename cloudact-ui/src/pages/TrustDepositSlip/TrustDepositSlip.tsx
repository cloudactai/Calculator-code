import React, { useState, useEffect } from "react";
import FooterDash from "../../components/Dashboard/FooterDash/FooterDash";
import Layout from "../../components/LayoutComponents/Layout";
import {
  getCurrentUserFromCookies,
  getUserId,
  getUserSID,
  getMonthsBetweenDates
} from "../../utils/helpers";
import { useSelector } from "react-redux";
import axios from "../../utils/axios";
import ComplianceHeader from "../../components/Tasks/ComplianceForm/ComplianceHeader";
import toast from "react-hot-toast";
import { getMonthFromDigit } from "../../utils/helpers";
import Noreportpage from "../Noreportpage";
import TrustDepositReport from "./TrustDepositReport.tsx";
import { RootState } from "../TrustDepositSlipNew/interface/trustdepoInterface.ts";

interface ComplianceData {
  id: number;
  task_month: string;
  task_status: string;
  pdf_url?: string;
  task_name: string;
  task_type_account: string;
}

interface HeaderDateData {
  month: string;
  year: string;
  search: string;
  status: string;
}

interface CustomYearModal {
  year: boolean;
  month: boolean;
}

const TrustDepositSlip: React.FC = () => {
  const { response } = useSelector((state:RootState) => state.userProfileInfo);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [complianceIds, setComplianceIds] = useState<number[]>([]);
  const [customYearModal, setCustomYearModal] = useState<CustomYearModal>({ year: false, month: false });
  const [headerDateData, setHeaderDateData] = useState<HeaderDateData>({
    month: '',
    year: '',
    search: '',
    status: 'All'
  });

  const [complianceFormData, setComplianceFormData] = useState<ComplianceData[]>([]);
  const [reportPeriod, setReportPeriod] = useState<string[]>([]);
  const [formsDataWithProgress, setFormsDataWithProgress] = useState<any[]>([]);
  const [filterData, setFilteredData] = useState<any[]>([]);

  const changeReportPeriod =  (reports: ComplianceData[]) => {
    if (reports && reports.length) {
      const period = reports
        .map((report) => {
          const [month, year] = report.task_month.split(" ");
          console.log('monthyear', period)
          const monthIndex =
            new Date(Date.parse(`1 ${month} 2000`)).getMonth() + 1;
          return `${year}-${monthIndex.toString().padStart(2, "0")}-15`;
        })
        .sort((a, b) => new Date(b) - new Date(a));
      console.log('period', period)
      setReportPeriod(
        getMonthsBetweenDates(period[period.length - 1], period[0]).reverse()
      );
    } else {
      setReportPeriod([])
    }
  };
  const handleSearchButton = () => {
    setLoaded(false)
    let month = headerDateData.month ? getMonthFromDigit(headerDateData.month) : '';
    axios.get(
      `/task/list/${getCurrentUserFromCookies().role
      }/${getUserId()}/${getUserSID()}?search=${headerDateData.search}&month=${month}&year=${headerDateData.year}&status=${headerDateData?.status == 'All' ? '' : headerDateData?.status}&isComplianceForm=2`
    )
      .then((res) => {
        const {
          data: {
            data: { body },
          },
        } = res;

        if (body) {
          setComplianceFormData(body)
          changeReportPeriod(body);
        }
      })
      .catch((err) => {
        toast.error('Internal Server Error')
      }).finally(() => {
        setLoaded(true)
      });
  }

  useEffect(() => {
    setLoaded(false)
    let month = headerDateData.month ? getMonthFromDigit(headerDateData.month) : '' ;
    axios.get(
      `/task/list/${getCurrentUserFromCookies().role
      }/${getUserId()}/${getUserSID()}?search=${headerDateData.search}&month=${month}&year=${headerDateData.year}&status=${headerDateData?.status == 'All' ? '' : headerDateData?.status}&isComplianceForm=2`
    ).then((res) => {
      const { data: { data: { body } } } = res;
      if (body) {
        setComplianceFormData(body.data)
        changeReportPeriod(body.data);
      }
    }).catch((err) => {
      toast.error('Internal Server Error')
    }).finally(() => {
      setLoaded(true)
    });
  }, [headerDateData.month, headerDateData.year, headerDateData.status]);


  function calculateProgress(data: any) {
    const subForm1 = data
    let filledCount = 0;
    let totalCount = 0;

    function countFilledValues(subform:any) {
      for (const key in subform) {
        if (subform[key] !== "") {
          filledCount++;
        }
        totalCount++;
      }
    }

    countFilledValues(subForm1);

    const progress = Math.ceil((filledCount / totalCount) * 100);
    return progress;
  }
  useEffect(() => {
    const getProgressData = async () => {
      if (complianceFormData && complianceFormData?.length) {
        const updatedDataArray = [] as any [];
        await Promise.all(
          complianceFormData?.map(async (data) => {
            const body = await axios.get(`/compliance/${data?.id}`);
            if (
              body?.data?.data?.body[0]?.formDetails &&
              Object.keys(JSON.parse(body?.data?.data?.body[0]?.formDetails)).length !== 0
            ) {
              const formData1 = JSON.parse(body?.data?.data?.body[0]?.formDetails);
              updatedDataArray.push({
                ...data,
                progress: calculateProgress(formData1),
              });
            }
          })
        );
        setFormsDataWithProgress(updatedDataArray);
      }
    };
    getProgressData();
  }, [complianceFormData]);
  const handleArchiveForms = () => {
    if (complianceIds.length == 0) return toast.error('Please select a form to archive');

    let anarchiveedData = complianceFormData.filter((data) => !complianceIds.includes(data?.id))
    setLoaded(false)

    axios.patch(`/update_archive/${getUserSID()}`, {
      ids: complianceIds,
      archiveType: "compliance",
      isArchive: true
    }).then((res) => {
      if (res.data.data.status == "success") {
        toast.success('Archive successfully');
        setComplianceFormData(anarchiveedData)
        changeReportPeriod(anarchiveedData);
      } else {
        toast.error('Something went wrong to Archive ');
      }
    }).catch((err) => {
      toast.error('Internal Server Error')
    }).finally(() => {
      setLoaded(true)
    });
  }

  const headerData = {
    customYearModal,
    setCustomYearModal,
    setHeaderDateData,
    headerDateData,
    handleSearchButton,
    title: 'Trust Deposit Slip',
    handleArchiveForms
  }

  const TrustDepositSlipData = {
    complianceFormData,
    reportPeriod,
    formsDataWithProgress,
    filterData,
    complianceIds, setComplianceIds
  }


  return (
    <Layout title={`Welcome ${response?.username ? response?.username : ""}`}>
      {!loaded && <div className="loader">Loading...</div>}

      <div className="panel trans">

        <div className="pHead">
          <ComplianceHeader data={headerData} />
        </div>

        {
          reportPeriod.length === 0 ?
            <Noreportpage />
            :
            <div className="pBody">
              <TrustDepositReport data={TrustDepositSlipData} />
            </div>
        }
      </div>

      <FooterDash />
    </Layout>
  );
};

export default TrustDepositSlip;
