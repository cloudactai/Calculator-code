import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { accessPagesAction } from "../actions/accessPagesActions";
import { userProfileInfoAction } from "../actions/userActions";
import FooterDash from "../components/Dashboard/FooterDash/FooterDash";
import Layout from "../components/LayoutComponents/Layout";
import Reports from "../components/Reports/Reports";
import Tasks from "../components/Tasks";
import DashboardAnalytics from "../containers/Dashboard/DashboardAnalytics";
import DashboardStatuses from "../containers/Dashboard/DashboardStatuses";
import ExistingCalculations from "../containers/Dashboard/ExistingCalculations";
import DashboardFirm from "../containers/Dashboard/DashboardFirm";
import { IaccessPagesAuthData, Store } from "../store/store";
import axios from "../utils/axios";
import {
  getCurrentUserFromCookies,
  getUserId,
  getUserSID,
} from "../utils/helpers";
import { clearCookieForCalculatorLabel } from "./calculator/Calculator";
import getDashboardStatuses from '../utils/Apis/dashboard/dashboard_statuses';
import { AUTH_ROUTES } from "../routes/Routes.types";
import { BsCalculator, BsCheck2 } from 'react-icons/bs';
import { TbReportAnalytics } from 'react-icons/tb';
import toast from "react-hot-toast"


const Dashboard = ({ userInfo, currentUserRole }) => {
  const [allReports, setAllReports] = useState([]);
  const [allTasks, setAllTasks] = useState({});
  const [loadedReports, setLoadedReports] = useState(false);
  const [loadedTasks, setLoadedTasks] = useState(false);
  const userInfoStore = useSelector((state) => state.userProfileInfo.response);
  const [name, setName] = useState(userInfoStore?.username);
  const [FirmDashboardData , setFirmDashboardData] = useState({
    Matters:[],
    overdrawn:[],
    closeAccount:[],
    CalculatorDetails : [],
    TasksDetails:[],
    ReportsDetails:[],
    FinancialOverview:[],
    OverdueTasks:[],
    pendingPayment:[],
    MonthlyReviewChecklistChart:[],
    loading : false
  })
  console.log("FirmDashboardData",FirmDashboardData)
  const dispatch = useDispatch();
  const {
    response: accessPagesState,
    loading: accessPagesStateLoading,
  }: IaccessPagesAuthData = useSelector((state: Store) => state?.accessPages);


  const fetchReports = () => {
    axios
      .get(`/reports/${getUserSID()}?page=1&reportType=0`)
      .then((res) => {
        // setAllReports(res.data.data.body.data.slice(0, 5));
        setLoadedReports(true);
        return res.data.data.body.data.slice(0, 5);
      })
      .then(async (reports) => {
        return await Promise.all(
          reports.map(async (report) => {
            const res = await axios.get(`/profile/info`);
            return {
              ...report,
              profile_pic: res.data.data.body.profile_pic,
            };
          })
        );
      })
      .then((reports) => {
        setAllReports(reports);
      })
      .catch((err) => {
        console.log("err", err);
        setLoadedReports(false);
      });
  };

  useEffect(() => {
    const fetchTasks = () => {
      axios.get(
          `/task/list/${
            getCurrentUserFromCookies().role
          }/${getUserId()}/${getUserSID()}?page=1&isComplianceForm=0&status=`
        )
        .then((res) => {
          const {
            data: {
              data: { body },
            },
          } = res;
          setAllTasks(body.data.slice(0, 3));
          setLoadedTasks(true);
        })
        .catch((err) => {
          console.log("err", err);
          setLoadedTasks(false);
        });
    };

    fetchReports();
    fetchTasks();
    fetchOverDrawn();
    fetchClosedAccount();
    fetchFinancialOverview();
    fetchOverdueTasks();
    fetchpendingPayment();
    fetchMonthlyReviewChecklistChart();
  }, [currentUserRole]);

  useEffect(() => {
    clearCookieForCalculatorLabel();
    if (!accessPagesStateLoading) dispatch(accessPagesAction());
    dispatch(userProfileInfoAction());
  }, []);



  useEffect(() => {

    setName(userInfoStore?.username !== undefined ? userInfoStore?.username : "")

  }, [userInfoStore]);

  const fetchOverDrawn=async()=>{
    try {
      let data = await axios.get(`get/matters/overdrawn/${getUserSID()}`);
      if(data?.data?.data?.body){
        setFirmDashboardData((prev)=>({
          ...prev,
          overdrawn:data.data.data.body
        }))
      }
    } catch (error) {
      toast.error('Internal Server Error')
    }
 
  }

  const fetchClosedAccount=async()=>{
    try {
    let data = await axios.get(`get/matters/closed/${getUserSID()}`);
    console.log('checkhave dataa in boy',data)
     if(data?.data?.data?.body){
      setFirmDashboardData((prev)=>({
        ...prev,
        closeAccount:data?.data?.data?.body
      }))
    }
    } catch (error) {
      toast.error('Internal Server Error')
    }

    
 
}

const fetchFinancialOverview=async()=>{

  try {
    let data = await axios.get(`get/financial/overview/${getUserSID()}`);

    if (data?.data?.data?.body){
      setFirmDashboardData((prev)=>({
        ...prev,
        FinancialOverview:data.data.data.body
     }))
    }
  
    
  } catch (error) {
    toast.error('Internal Server Error')
    
  }

}

const fetchOverdueTasks=async()=>{
  try {
    let data = await axios.get(`get/overdue/task/${getUserSID()}`);
    if(data?.data?.data?.body){
      setFirmDashboardData((prev)=>({
        ...prev,
        OverdueTasks:data.data.data.body
      }))
    }
   
  } catch (error) {
    toast.error('Internal Server Error')
  }
 
 }

 const fetchpendingPayment=async()=>{
  try {
    let data = await axios.get(`get/pending/payment/${getUserSID()}`);
    if(data?.data?.data?.body){
      setFirmDashboardData((prev)=>({
        ...prev,
        pendingPayment:data.data.data.body
      }))
    }
   
  } catch (error) {
    toast.error('Internal Server Error')
  }
 
 }

 const fetchMonthlyReviewChecklistChart=async()=>{
  try {
    let data = await axios.get(`get/task/prepared/approved/${getUserSID()}`);
    if(data?.data?.data?.body){
      setFirmDashboardData((prev)=>({
        ...prev,
        MonthlyReviewChecklistChart:data.data.data.body
      }))
    }
   
  } catch (error) {
    toast.error('Internal Server Error')
  }
 
 }

useEffect(() => {
  const fetchDashboardStatuses = async () => {
    setFirmDashboardData((prev)=>({
      ...prev,
      loading :true
    }));

    try {
      const data = await getDashboardStatuses();

      data.forEach((e) => {
        switch (e.type) {
          case "Calculator":
            setFirmDashboardData((prev)=>({
              ...prev , 
              CalculatorDetails:{ ...e, color: "rgb(93, 150, 234)", title: "Family law calculator", body: 
              { text: "Total calculations", link: AUTH_ROUTES.SUPPORT_CALCULATOR }, 
              icon: <BsCalculator size={32} />,
               completedTitle: { text: "Completed Calculations", link: AUTH_ROUTES.SUPPORT_CALCULATOR }, 
               inprogressTitle: { text: "In progress calculations", link: AUTH_ROUTES.SUPPORT_CALCULATOR } }
            }));
  
          break;
  
          case "Reports":
            setFirmDashboardData((prev)=>({
              ...prev , 
              ReportsDetails:{ ...e, color: "rgb(57, 130, 239)", title: "Reports", body: { text: "Total Law Society compliance reports", link: AUTH_ROUTES.REPORTS }, icon: <TbReportAnalytics size={32} />, completedTitle: { text: "Completed Reports", link: AUTH_ROUTES.REPORTS }, inprogressTitle: { text: "In progress reports", link: AUTH_ROUTES.REPORTS } }
  
            }));
          break;
  
          case "Tasks":
            setFirmDashboardData((prev)=>({
              ...prev , 
              TasksDetails: { ...e, color: "rgb(28, 113, 239)", title: "Tasks", body: { text: "Total tasks", link: AUTH_ROUTES.MONTHLY_CHECKLIST_TABLE }, icon: <BsCheck2 size={32} />, completedTitle: { text: "Completed Tasks", link: AUTH_ROUTES.MONTHLY_CHECKLIST_TABLE }, inprogressTitle: { text: "In progress tasks", link: AUTH_ROUTES.MONTHLY_CHECKLIST_TABLE } }
            
            }));
            break;
  
          case "Matters":
            setFirmDashboardData((prev)=>({
              ...prev , 
              Matters:e
            }));
            break;
  
          default:
            break;
        }
      })
    
    } catch (error) {
      toast.error('Internal Server Error')
      
    }finally{
      setFirmDashboardData((prev)=>({
        ...prev,
        loading :false
      }));
    }
  
  }

  fetchDashboardStatuses();
}, [])


  return (
    <Layout title={`Welcome ${name}`}>
      {loadedReports && loadedTasks && (
        <>
          <h5 className="calcTitle">Dashboard</h5>
          <div className="row">
            {
              <DashboardFirm FirmDashboardData={FirmDashboardData}
              show={
                // accessPagesState?.auth_calculator &&
                // accessPagesState?.auth_tasks
                true
              }
              />

            }

            {/* <DashboardAnalytics
              show={
                accessPagesState?.auth_calculator &&
                accessPagesState?.auth_tasks
              }
            />
            <DashboardStatuses
              loaded={loadedReports && loadedTasks}
              show={accessPagesState}
            />
            <Tasks
              show={accessPagesState?.auth_tasks}
              loadedTasks={loadedTasks}
              allTasks={allTasks}
            /> */}
            
          </div>

          {Boolean(accessPagesState?.auth_report_history) && (
            <Reports allReports={allReports} fetchReports={fetchReports} />
          )}
        </>
      )}
      {/* {Boolean(accessPagesState?.auth_calculator) && <ExistingCalculations />} */}

      <FooterDash />
    </Layout>
  );
};

export default Dashboard;
