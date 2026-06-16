import React, { useEffect, useState } from 'react';
import { BsCalculator, BsCheck2 } from 'react-icons/bs';
import { TbReportAnalytics } from 'react-icons/tb';
import { Link } from 'react-router-dom';
import { AUTH_ROUTES } from '../../routes/Routes.types';
import { IaccessPagesAuthData } from '../../store/store';
import getDashboardStatuses from '../../utils/Apis/dashboard/dashboard_statuses';

const DashboardStatuses = ({ loaded, show }: {loaded: Boolean, show: {response: IaccessPagesAuthData}}) => {
  // console.log("show Details")
  const [reportDetails, setReportDetails] = useState({
    total_count: 0,
    inprogress: 0,
    completed: 0,
    type: '',
    title: "Reports",
    completedTitle: "",
    inprogressTitle: "",
    body: { text: '', link: "" },
    color: "",
  });

  const [taskDetails, setTaskDetails] = useState({
    total_count: 0,
    inprogress: 0,
    completed: 0,
    type: '',
    title: "Tasks",
    completedTitle: "",
    inprogressTitle: "",
    body: { text: '', link: "" },
    color: ""
  });

  const [calculatorDetails, setCalculatorDetails] = useState({
    total_count: 0,
    inprogress: 0,
    completed: 0,
    type: "",
    title: "Calculator",
    completedTitle: "",
    inprogressTitle: "",
    body: { text: '', link: "" },
    color: ""
  });



  useEffect(() => {
    const fetchDashboardStatuses = async () => {
      const data = await getDashboardStatuses();

      data.forEach((e) => {
        switch (e.type) {
          case "Calculator":
            setCalculatorDetails({ ...e, color: "rgb(93, 150, 234)", title: "Family law calculator", body: { text: "Total calculations", link: AUTH_ROUTES.SUPPORT_CALCULATOR }, icon: <BsCalculator size={32} />, completedTitle: { text: "Completed Calculations", link: AUTH_ROUTES.SUPPORT_CALCULATOR }, inprogressTitle: { text: "In progress calculations", link: AUTH_ROUTES.SUPPORT_CALCULATOR } });
            break;

          case "Reports":
            setReportDetails({ ...e, color: "rgb(57, 130, 239)", title: "Reports", body: { text: "Total Law Society compliance reports", link: AUTH_ROUTES.REPORTS }, icon: <TbReportAnalytics size={32} />, completedTitle: { text: "Completed Reports", link: AUTH_ROUTES.REPORTS }, inprogressTitle: { text: "In progress reports", link: AUTH_ROUTES.REPORTS } });
            break;

          case "Tasks":
            setTaskDetails({ ...e, color: "rgb(28, 113, 239)", title: "Tasks", body: { text: "Total tasks", link: AUTH_ROUTES.MONTHLY_CHECKLIST_TABLE }, icon: <BsCheck2 size={32} />, completedTitle: { text: "Completed Tasks", link: AUTH_ROUTES.MONTHLY_CHECKLIST_TABLE }, inprogressTitle: { text: "In progress tasks", link: AUTH_ROUTES.MONTHLY_CHECKLIST_TABLE } })
            break;

          default:
            break;
        }
      })

    }

    fetchDashboardStatuses();
  }, [])


  const Render_Card = (values) => {
    if(values === null)
      return null;

    return <>
              <Link name={values.body.text} className='totalInfo' to={values.body.link}>
                <span className='title'>{values.body.text}</span>
                <span className='count'>{values.total_count}</span>
              </Link>
              {values.completed > 0 && 
              <Link name={values.completedTitle.text} className='totalInfo' to={values.completedTitle.link}>
                <span className='title'>{values.completedTitle.text}</span>
                <span className='count'>{values.completed}</span>
              </Link>}
              {values.inprogress > 0 &&
              <Link name={values.inprogressTitle.text} className="totalInfo" to={values.inprogressTitle.link}>
                <span className='title'>{values.inprogressTitle.text}</span>
                <span className='count'>{values.inprogress}</span>
              </Link>}
            </>
    }

  if(!show?.auth_calculator && !show?.auth_tasks && !show?.auth_report_history)
    return null;

  return (
    (loaded && calculatorDetails.inprogressTitle) && 
      <div className='col-lg-4'>
        <div className='panel'>
          <div className='pHead'>
            <span className='h5'><svg width="34" height="36" viewBox="0 0 34 36" fill="none" xmlns="http://www.w3.org/2000/svg"> <path opacity="0.8" d="M25.6922 14.07C25.0066 14.07 24.3452 13.9667 23.7226 13.7749V29.6582C23.7226 30.6832 22.8917 31.514 21.8668 31.514H6.41699V33.4406C6.41699 34.4656 7.24788 35.2964 8.27275 35.2964H26.6568C27.6817 35.2964 28.5126 34.4655 28.5126 33.4406V13.4473C27.6557 13.8469 26.7 14.07 25.6922 14.07Z" fill="#F6BD3D"/> <path d="M21.3061 2.22559H3.48271C2.45777 2.22559 1.62695 3.05647 1.62695 4.08134V29.6591C1.62695 30.6841 2.45784 31.5149 3.48271 31.5149H21.8668C22.8916 31.5149 23.7225 30.684 23.7225 29.6591V13.9164" fill="#FBFCFE"/> <path opacity="0.5" d="M25.6921 14.0705C29.3826 14.0705 32.3743 11.0781 32.3743 7.38682C32.3743 3.69552 29.3826 0.703125 25.6921 0.703125C22.0015 0.703125 19.0098 3.69552 19.0098 7.38682C19.0098 11.0781 22.0015 14.0705 25.6921 14.0705Z" fill="#73C3FD"/> <path opacity="0.5" d="M6.33984 7.77832H19.01V10.7479H6.33984V7.77832Z" fill="#73C3FD"/> <path d="M25.6943 11.9768C25.3061 11.9768 24.9912 11.662 24.9912 11.2737V6.46582C24.9912 6.07755 25.3061 5.7627 25.6943 5.7627C26.0826 5.7627 26.3975 6.07755 26.3975 6.46582V11.2737C26.3975 11.662 26.0827 11.9768 25.6943 11.9768Z" fill="#171D34"/> <path d="M25.6914 4.90625C26.0797 4.90625 26.3945 4.59145 26.3945 4.20312C26.3945 3.8148 26.0797 3.5 25.6914 3.5C25.3031 3.5 24.9883 3.8148 24.9883 4.20312C24.9883 4.59145 25.3031 4.90625 25.6914 4.90625Z" fill="#171D34"/> <path d="M33.0775 7.38682C33.0775 3.31369 29.7644 0 25.692 0C24.0064 0 22.451 0.567703 21.2066 1.52198H3.48271C2.07175 1.52198 0.923828 2.66984 0.923828 4.08087V29.6587C0.923828 31.0696 2.07175 32.2176 3.48271 32.2176H5.7138V33.441C5.7138 34.852 6.86172 36 8.27268 36H26.6567C28.0676 36 29.2155 34.8521 29.2155 33.441V23.6886C29.2155 23.3003 28.9007 22.9854 28.5124 22.9854C28.1241 22.9854 27.8093 23.3003 27.8093 23.6886V33.441C27.8093 34.0766 27.2922 34.5938 26.6567 34.5938H8.27268C7.63713 34.5938 7.12005 34.0767 7.12005 33.441V32.2176H21.8668C23.2777 32.2176 24.4257 31.0697 24.4257 29.6587V14.6649C24.8373 14.7364 25.2604 14.7736 25.6921 14.7736C26.4276 14.7736 27.1384 14.6655 27.8094 14.4643V17.3315C27.8094 17.7198 28.1242 18.0347 28.5125 18.0347C28.9008 18.0347 29.2156 17.7198 29.2156 17.3315V13.8774C31.5143 12.624 33.0775 10.1846 33.0775 7.38682ZM23.0195 29.6587C23.0195 30.2943 22.5024 30.8114 21.8668 30.8114H3.48271C2.84716 30.8114 2.33008 30.2944 2.33008 29.6587V4.08087C2.33008 3.44531 2.84716 2.92823 3.48271 2.92823H19.8072C18.9247 4.09071 18.3781 5.52157 18.3132 7.07484H6.33965C5.95138 7.07484 5.63652 7.3897 5.63652 7.77797V10.7475C5.63652 11.1358 5.95138 11.4507 6.33965 11.4507H19.0098C19.1696 11.4507 19.317 11.3973 19.4351 11.3074C20.2751 12.6437 21.5309 13.6932 23.0195 14.2732V29.6587ZM18.3067 8.48109V10.0444H7.04277V8.48109H18.3067ZM25.692 13.3673C22.3952 13.3673 19.7129 10.6845 19.7129 7.38675C19.7129 4.08909 22.3952 1.40618 25.692 1.40618C28.989 1.40618 31.6712 4.08902 31.6712 7.38675C31.6712 10.6845 28.989 13.3673 25.692 13.3673Z" fill="#171D34"/> <path d="M28.5131 21.2007C28.2234 21.2007 27.9579 21.0153 27.8558 20.7449C27.7509 20.4675 27.8368 20.1412 28.0673 19.9535C28.2983 19.7656 28.6308 19.743 28.8841 19.9002C29.137 20.0572 29.2664 20.3668 29.198 20.6571C29.124 20.9711 28.8362 21.2007 28.5131 21.2007Z" fill="#171D34"/> <path d="M19.01 15.3027H6.33984C5.95158 15.3027 5.63672 14.9879 5.63672 14.5996C5.63672 14.2113 5.95158 13.8965 6.33984 13.8965H19.01C19.3983 13.8965 19.7131 14.2113 19.7131 14.5996C19.7131 14.9879 19.3984 15.3027 19.01 15.3027Z" fill="#171D34"/> <path d="M19.01 18.6377H6.33984C5.95158 18.6377 5.63672 18.3228 5.63672 17.9346C5.63672 17.5462 5.95158 17.2314 6.33984 17.2314H19.01C19.3983 17.2314 19.7131 17.5462 19.7131 17.9346C19.7131 18.3228 19.3984 18.6377 19.01 18.6377Z" fill="#171D34"/> <path d="M19.01 21.9727H6.33984C5.95158 21.9727 5.63672 21.6578 5.63672 21.2695C5.63672 20.8813 5.95158 20.5664 6.33984 20.5664H19.01C19.3983 20.5664 19.7131 20.8813 19.7131 21.2695C19.7131 21.6579 19.3984 21.9727 19.01 21.9727Z" fill="#171D34"/> <path d="M19.01 25.3076H6.33984C5.95158 25.3076 5.63672 24.9928 5.63672 24.6045C5.63672 24.2162 5.95158 23.9014 6.33984 23.9014H19.01C19.3983 23.9014 19.7131 24.2162 19.7131 24.6045C19.7131 24.9928 19.3984 25.3076 19.01 25.3076Z" fill="#171D34"/> </svg> Total information</span>
          </div>
          <div className='pBody countWidgets'>
            {[show?.auth_tasks ? taskDetails : null,
               show?.auth_report_history ? reportDetails : null,
                show?.auth_calculator ? calculatorDetails: null
                ].map((e) => Render_Card(e))}
          </div>
        <span className='moreBtn'><svg width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M2.5625 1.625C2.5625 1.81042 2.50752 1.99168 2.4045 2.14585C2.30149 2.30002 2.15507 2.42018 1.98377 2.49114C1.81246 2.56209 1.62396 2.58066 1.4421 2.54449C1.26025 2.50831 1.0932 2.41902 0.962088 2.28791C0.830976 2.1568 0.741688 1.98975 0.705514 1.8079C0.669341 1.62604 0.687906 1.43754 0.758863 1.26623C0.829821 1.09493 0.949982 0.948511 1.10415 0.845498C1.25832 0.742484 1.43958 0.6875 1.625 0.6875C1.87364 0.6875 2.1121 0.786272 2.28791 0.962088C2.46373 1.1379 2.5625 1.37636 2.5625 1.625ZM8 0.6875C7.81458 0.6875 7.63332 0.742484 7.47915 0.845498C7.32498 0.948511 7.20482 1.09493 7.13386 1.26623C7.06291 1.43754 7.04434 1.62604 7.08051 1.8079C7.11669 1.98975 7.20598 2.1568 7.33709 2.28791C7.4682 2.41902 7.63525 2.50831 7.8171 2.54449C7.99896 2.58066 8.18746 2.56209 8.35877 2.49114C8.53007 2.42018 8.67649 2.30002 8.7795 2.14585C8.88252 1.99168 8.9375 1.81042 8.9375 1.625C8.9375 1.37636 8.83873 1.1379 8.66291 0.962088C8.4871 0.786272 8.24864 0.6875 8 0.6875ZM14.375 2.5625C14.5604 2.5625 14.7417 2.50752 14.8958 2.4045C15.05 2.30149 15.1702 2.15507 15.2411 1.98377C15.3121 1.81246 15.3307 1.62396 15.2945 1.4421C15.2583 1.26025 15.169 1.0932 15.0379 0.962088C14.9068 0.830976 14.7398 0.741688 14.5579 0.705514C14.376 0.66934 14.1875 0.687906 14.0162 0.758864C13.8449 0.829821 13.6985 0.949982 13.5955 1.10415C13.4925 1.25832 13.4375 1.43958 13.4375 1.625C13.4375 1.87364 13.5363 2.1121 13.7121 2.28791C13.8879 2.46373 14.1264 2.5625 14.375 2.5625ZM1.625 7.4375C1.43958 7.4375 1.25832 7.49248 1.10415 7.5955C0.949982 7.69851 0.829821 7.84493 0.758863 8.01624C0.687906 8.18754 0.669341 8.37604 0.705514 8.5579C0.741688 8.73975 0.830976 8.9068 0.962088 9.03791C1.0932 9.16903 1.26025 9.25831 1.4421 9.29449C1.62396 9.33066 1.81246 9.3121 1.98377 9.24114C2.15507 9.17018 2.30149 9.05002 2.4045 8.89585C2.50752 8.74168 2.5625 8.56042 2.5625 8.375C2.5625 8.12636 2.46373 7.8879 2.28791 7.71209C2.1121 7.53627 1.87364 7.4375 1.625 7.4375ZM8 7.4375C7.81458 7.4375 7.63332 7.49248 7.47915 7.5955C7.32498 7.69851 7.20482 7.84493 7.13386 8.01624C7.06291 8.18754 7.04434 8.37604 7.08051 8.5579C7.11669 8.73975 7.20598 8.9068 7.33709 9.03791C7.4682 9.16903 7.63525 9.25831 7.8171 9.29449C7.99896 9.33066 8.18746 9.3121 8.35877 9.24114C8.53007 9.17018 8.67649 9.05002 8.7795 8.89585C8.88252 8.74168 8.9375 8.56042 8.9375 8.375C8.9375 8.12636 8.83873 7.8879 8.66291 7.71209C8.4871 7.53627 8.24864 7.4375 8 7.4375ZM14.375 7.4375C14.1896 7.4375 14.0083 7.49248 13.8542 7.5955C13.7 7.69851 13.5798 7.84493 13.5089 8.01624C13.4379 8.18754 13.4193 8.37604 13.4555 8.5579C13.4917 8.73975 13.581 8.9068 13.7121 9.03791C13.8432 9.16903 14.0102 9.25831 14.1921 9.29449C14.374 9.33066 14.5625 9.3121 14.7338 9.24114C14.9051 9.17018 15.0515 9.05002 15.1545 8.89585C15.2575 8.74168 15.3125 8.56042 15.3125 8.375C15.3125 8.12636 15.2137 7.8879 15.0379 7.71209C14.8621 7.53627 14.6236 7.4375 14.375 7.4375Z" fill="#171D34"/> </svg></span>
        </div>
      </div>
  )
}

export default DashboardStatuses