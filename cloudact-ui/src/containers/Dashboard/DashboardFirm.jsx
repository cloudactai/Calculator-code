import { Link } from "react-router-dom";
import chartImage1 from "../../assets/images/chart1.png";
import chartImage2 from "../../assets/images/chart2.png";
import { removeNegSignAndWrapInBracketsWith2Fraction } from "../../pages/calculator/reports";
import DashboardTable from "./DashboardTables/DashboardTable";
import { getSvg } from "./assetsDashboard/getSvg";
import { AUTH_ROUTES } from "../../routes/Routes.types";
import DoubleDonutChart from "./DoubleDonutChart";
import { useHistory } from "react-router";
import { useEffect } from "react";
import Cookies from "js-cookie";
import DashboardCards from "./DashboardTables/DashboardCards";
import Report_vector from "../../assets/images/Report_vector.svg";
import new_form_svg from "../../assets/images/new_form_svg.svg";
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AssuredWorkloadIcon from '@mui/icons-material/AssuredWorkload';

const DashboardFirm = ({ FirmDashboardData, show }) => {

    const history = useHistory();

    useEffect(() => {
        Cookies.set('DiagnoseConnection', true, {
            path: "/",
        });
    }, [])



    let pendingPayment =
    {
        first_title: 'No. of Overdue bills',
        secound_title: 'Total $ in overdue',
        count: FirmDashboardData?.pendingPayment[0]?.pending_payments_count ? FirmDashboardData?.pendingPayment[0]?.pending_payments_count : 0,
        balance: removeNegSignAndWrapInBracketsWith2Fraction(FirmDashboardData?.pendingPayment[0]?.total_balance ? FirmDashboardData?.pendingPayment[0]?.total_balance : 0)
    }

    let Financial_overview_dateT = {
        first_title: 'Bank Accounts',
        secound_title: 'Cash book balance',
        count: FirmDashboardData?.FinancialOverview[0]?.Count ? FirmDashboardData?.FinancialOverview[0]?.Count : 0,
        balance: removeNegSignAndWrapInBracketsWith2Fraction(FirmDashboardData?.FinancialOverview[0]?.Balance ? FirmDashboardData?.FinancialOverview[0]?.Balance : 0)
    }

    let overdrawn_client_balance = {
        first_title: 'Clients',
        secound_title: 'Balance',
        count: FirmDashboardData?.overdrawn[0]?.Count ? FirmDashboardData?.overdrawn[0]?.Count : 0,
        balance: removeNegSignAndWrapInBracketsWith2Fraction(FirmDashboardData?.overdrawn[0]?.Balance ? FirmDashboardData?.overdrawn[0]?.Balance : 0)
    }

    let closeAccount_data = {
        first_title: 'Clients',
        secound_title: 'Balance',
        count: FirmDashboardData?.closeAccount[0]?.Count ? FirmDashboardData?.closeAccount[0]?.Count : 0,
        balance: removeNegSignAndWrapInBracketsWith2Fraction(FirmDashboardData?.closeAccount[0]?.Balance ? FirmDashboardData?.closeAccount[0]?.Balance : 0)
    }

    let overdue_task_data = {
        first_title: 'Tasks',
        secound_title: 'Status',
        count: FirmDashboardData?.OverdueTasks[0]?.Count ? FirmDashboardData?.OverdueTasks[0]?.Count : 0,
        balance: 'In-Progress'
    }




    const Render_Card = (values) => {
        if (values === null)
            return null;

        return <>
            {
                values.body.text &&
                <Link name={values.body.text} className='totalInfo' to={values.body.link}>
                    <span className='title'>{values.body.text}</span>
                    <span className='count'>{values.total_count}</span>
                </Link>
            }

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

    //comment for prod changes
    // if(!show)
    // return null;


    return <>
        <div className="newDashboard mb-3">
            <div className="row">
                    {/*  Firm Analytics */}
                <div className="col-lg-6">
                    <div className="panelRow">
                        <div className="pHead">
                            <span className="h5" style={{ fontWeight: 700 }}>
                                Firm Analytics
                            </span>
                        </div>
                        <div className="row firmAnalyticsRow">
                            <div className="col-md-6">

                                <div className="panel panelH-min mb-4">
                                    <div className="pHead">
                                        <span className="h5">
                                            {getSvg('Financial overview')}
                                            Bank overview</span>
                                        <div className="control">
                                        </div>
                                    </div>
                                    <div className="pBody pb-0 pt-0" style={{ height: "237px" }}>
                                        <DashboardCards data={Financial_overview_dateT} />

                                    </div>
                                    <span class="moreBtn" style={{ margin: "0px" }}>
                                        {getSvg('moreBtn')}

                                    </span>
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="panel mb-4 panelH-min">
                                    <div className="pHead">

                                        <span className="h5">
                                            {getSvg('Outstanding A/R')}
                                            Outstanding A/R</span>
                                    </div>
                                    <div className="pBody pb-0 pt-0" style={{ height: "237px" }}>
                                        <DashboardCards data={pendingPayment} />

                                    </div>
                                    <span class="moreBtn">
                                        {getSvg('moreBtn')}
                                    </span>
                                </div>
                            </div>

                            <div className="col-md-12">
                                <div className="panel mb-4 panelH-min matterStatusBox">
                                    <div className="pHead">
                                        <span className="h5">

                                            {getSvg('Matter status')}
                                            Matter status</span>
                                    </div>
                                    <div className="pBody pb-0 pt-0">
                                        <div className="compliance ar">
                                            <span>{FirmDashboardData?.Matters?.completed}</span>
                                            <span className="h5">Open matters</span>
                                        </div>
                                        <div className="compliance ar">
                                            <span>{FirmDashboardData?.Matters?.Incomplete}</span>
                                            <span className="h5">Closed matters</span>
                                        </div>
                                        <div className="compliance ar">
                                            <span>{FirmDashboardData?.Matters?.inprogress}</span>
                                            <span className="h5">Pending matters</span>
                                        </div>

                                    </div>
                                    <span class="moreBtn">
                                        {getSvg('moreBtn')}

                                    </span>

                                </div>
                            </div>

                            <div className="col-md-6">

                                <div className="panel panelH-min mb-4">
                                    <div className="pHead">
                                        <span className="h5">

                                            <AssuredWorkloadIcon fontSize="large" style={{ color: "#73c3fd" }} />
                                            Overdrawn client balances</span>
                                    </div>
                                    <div className="pBody pb-0 pt-0" style={{ height: "237px" }}>
                                        <DashboardCards data={overdrawn_client_balance} />
                                    </div>
                                    <span class="moreBtn">
                                        {getSvg('moreBtn')}
                                    </span>

                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="panel panelH-min mb-4">
                                    <div className="pHead">
                                        <span className="h5" style={{ gap: "21px" }}>

                                            <img src={new_form_svg} alt="client_balance_closed" />
                                            Client balances with status 'Closed'</span>
                                    </div>
                                    <div className="pBody pb-0 pt-0" style={{ height: "237px" }}>
                                        <DashboardCards data={closeAccount_data} />
                                    </div>
                                    <span class="moreBtn">
                                        {getSvg('moreBtn')}
                                    </span>

                                </div>
                            </div>

                        </div>
                    </div>
                </div>
                 {/*  Your Analytics */}
                <div className="col-lg-6">
                    <div className="panelRow h-100">
                        <div className="pHead">
                            <span className="h5" style={{ fontWeight: 700 }}>
                                Your Analytics
                            </span>
                        </div>
                        <div className="row firmAnalyticsRow">
                            <div className="col-md-6">
                                <div class="panel panelH-min mb-4">
                                    <div class="pHead">

                                        <span class="h5">
                                            <svg width="34" height="36" viewBox="0 0 34 36" fill="none" xmlns="http://www.w3.org/2000/svg"> <path opacity="0.8" d="M25.6922 14.07C25.0066 14.07 24.3452 13.9667 23.7226 13.7749V29.6582C23.7226 30.6832 22.8917 31.514 21.8668 31.514H6.41699V33.4406C6.41699 34.4656 7.24788 35.2964 8.27275 35.2964H26.6568C27.6817 35.2964 28.5126 34.4655 28.5126 33.4406V13.4473C27.6557 13.8469 26.7 14.07 25.6922 14.07Z" fill="#F6BD3D"></path> <path d="M21.3061 2.22559H3.48271C2.45777 2.22559 1.62695 3.05647 1.62695 4.08134V29.6591C1.62695 30.6841 2.45784 31.5149 3.48271 31.5149H21.8668C22.8916 31.5149 23.7225 30.684 23.7225 29.6591V13.9164" fill="#FBFCFE"></path> <path opacity="0.5" d="M25.6921 14.0705C29.3826 14.0705 32.3743 11.0781 32.3743 7.38682C32.3743 3.69552 29.3826 0.703125 25.6921 0.703125C22.0015 0.703125 19.0098 3.69552 19.0098 7.38682C19.0098 11.0781 22.0015 14.0705 25.6921 14.0705Z" fill="#73C3FD"></path> <path opacity="0.5" d="M6.33984 7.77832H19.01V10.7479H6.33984V7.77832Z" fill="#73C3FD"></path> <path d="M25.6943 11.9768C25.3061 11.9768 24.9912 11.662 24.9912 11.2737V6.46582C24.9912 6.07755 25.3061 5.7627 25.6943 5.7627C26.0826 5.7627 26.3975 6.07755 26.3975 6.46582V11.2737C26.3975 11.662 26.0827 11.9768 25.6943 11.9768Z" fill="#171D34"></path> <path d="M25.6914 4.90625C26.0797 4.90625 26.3945 4.59145 26.3945 4.20312C26.3945 3.8148 26.0797 3.5 25.6914 3.5C25.3031 3.5 24.9883 3.8148 24.9883 4.20312C24.9883 4.59145 25.3031 4.90625 25.6914 4.90625Z" fill="#171D34"></path> <path d="M33.0775 7.38682C33.0775 3.31369 29.7644 0 25.692 0C24.0064 0 22.451 0.567703 21.2066 1.52198H3.48271C2.07175 1.52198 0.923828 2.66984 0.923828 4.08087V29.6587C0.923828 31.0696 2.07175 32.2176 3.48271 32.2176H5.7138V33.441C5.7138 34.852 6.86172 36 8.27268 36H26.6567C28.0676 36 29.2155 34.8521 29.2155 33.441V23.6886C29.2155 23.3003 28.9007 22.9854 28.5124 22.9854C28.1241 22.9854 27.8093 23.3003 27.8093 23.6886V33.441C27.8093 34.0766 27.2922 34.5938 26.6567 34.5938H8.27268C7.63713 34.5938 7.12005 34.0767 7.12005 33.441V32.2176H21.8668C23.2777 32.2176 24.4257 31.0697 24.4257 29.6587V14.6649C24.8373 14.7364 25.2604 14.7736 25.6921 14.7736C26.4276 14.7736 27.1384 14.6655 27.8094 14.4643V17.3315C27.8094 17.7198 28.1242 18.0347 28.5125 18.0347C28.9008 18.0347 29.2156 17.7198 29.2156 17.3315V13.8774C31.5143 12.624 33.0775 10.1846 33.0775 7.38682ZM23.0195 29.6587C23.0195 30.2943 22.5024 30.8114 21.8668 30.8114H3.48271C2.84716 30.8114 2.33008 30.2944 2.33008 29.6587V4.08087C2.33008 3.44531 2.84716 2.92823 3.48271 2.92823H19.8072C18.9247 4.09071 18.3781 5.52157 18.3132 7.07484H6.33965C5.95138 7.07484 5.63652 7.3897 5.63652 7.77797V10.7475C5.63652 11.1358 5.95138 11.4507 6.33965 11.4507H19.0098C19.1696 11.4507 19.317 11.3973 19.4351 11.3074C20.2751 12.6437 21.5309 13.6932 23.0195 14.2732V29.6587ZM18.3067 8.48109V10.0444H7.04277V8.48109H18.3067ZM25.692 13.3673C22.3952 13.3673 19.7129 10.6845 19.7129 7.38675C19.7129 4.08909 22.3952 1.40618 25.692 1.40618C28.989 1.40618 31.6712 4.08902 31.6712 7.38675C31.6712 10.6845 28.989 13.3673 25.692 13.3673Z" fill="#171D34"></path> <path d="M28.5131 21.2007C28.2234 21.2007 27.9579 21.0153 27.8558 20.7449C27.7509 20.4675 27.8368 20.1412 28.0673 19.9535C28.2983 19.7656 28.6308 19.743 28.8841 19.9002C29.137 20.0572 29.2664 20.3668 29.198 20.6571C29.124 20.9711 28.8362 21.2007 28.5131 21.2007Z" fill="#171D34"></path> <path d="M19.01 15.3027H6.33984C5.95158 15.3027 5.63672 14.9879 5.63672 14.5996C5.63672 14.2113 5.95158 13.8965 6.33984 13.8965H19.01C19.3983 13.8965 19.7131 14.2113 19.7131 14.5996C19.7131 14.9879 19.3984 15.3027 19.01 15.3027Z" fill="#171D34"></path> <path d="M19.01 18.6377H6.33984C5.95158 18.6377 5.63672 18.3228 5.63672 17.9346C5.63672 17.5462 5.95158 17.2314 6.33984 17.2314H19.01C19.3983 17.2314 19.7131 17.5462 19.7131 17.9346C19.7131 18.3228 19.3984 18.6377 19.01 18.6377Z" fill="#171D34"></path> <path d="M19.01 21.9727H6.33984C5.95158 21.9727 5.63672 21.6578 5.63672 21.2695C5.63672 20.8813 5.95158 20.5664 6.33984 20.5664H19.01C19.3983 20.5664 19.7131 20.8813 19.7131 21.2695C19.7131 21.6579 19.3984 21.9727 19.01 21.9727Z" fill="#171D34"></path> <path d="M19.01 25.3076H6.33984C5.95158 25.3076 5.63672 24.9928 5.63672 24.6045C5.63672 24.2162 5.95158 23.9014 6.33984 23.9014H19.01C19.3983 23.9014 19.7131 24.2162 19.7131 24.6045C19.7131 24.9928 19.3984 25.3076 19.01 25.3076Z" fill="#171D34"></path>
                                            </svg> Total information
                                        </span>
                                    </div>
                                    <div class="pBody countWidgets">

                                        {

                                            !FirmDashboardData.loading && [FirmDashboardData?.TasksDetails ? FirmDashboardData.TasksDetails : null,
                                            FirmDashboardData.ReportsDetails ? FirmDashboardData.ReportsDetails : null,
                                            FirmDashboardData.CalculatorDetails ? FirmDashboardData.CalculatorDetails : null
                                            ].map((e) => Render_Card(e))

                                        }


                                    </div>

                                    <span class="moreBtn">
                                        {getSvg('moreBtn')}

                                    </span>
                                </div>

                                <div className="panel panelH-min mb-4">
                                    <div className="pHead">
                                        <span className="h5">


                                            {getSvg('Monthly review checklist')}

                                            Monthly review checklist
                                        </span>
                                        <div className="control">
                                            <button className="btn btnPrimary" type="button"
                                                onClick={() => { history.push(AUTH_ROUTES.MONTHLY_CHECKLIST_TABLE) }}
                                            >View
                                            </button>


                                        </div>
                                    </div>
                                    <div className="pBody pb-0 pt-0">
                                        <span className="chartArea">


                                            <DoubleDonutChart data={FirmDashboardData?.MonthlyReviewChecklistChart} />
                                        </span>

                                        <div className="pHead chartType" style={{ display: "flex", justifyContent: "space-around" }}>

                                            <span className="blueColor">{
                                                FirmDashboardData?.MonthlyReviewChecklistChart[0]?.percentage_preparer ? FirmDashboardData?.MonthlyReviewChecklistChart[0]?.percentage_preparer : 0
                                            } %</span>
                                            <span className="yellowColor">
                                                {
                                                    FirmDashboardData?.MonthlyReviewChecklistChart[0]?.percentage_approver ? FirmDashboardData?.MonthlyReviewChecklistChart[0]?.percentage_approver : 0
                                                } %
                                            </span>
                                        </div>

                                        <div className="pHead chartType">

                                            <span className="blueColor">Prepared</span>
                                            <span className="yellowColor">Approved</span>
                                        </div>
                                    </div>
                                    <span class="moreBtn">
                                        {getSvg('moreBtn')}
                                    </span>

                                </div>

                            </div>

                            <div className="col-md-6">
                                <div className="panel panelH-min mb-4">
                                    <div className="pHead">
                                        <span className="h5">
                                            {getSvg('Quick links')}
                                            Quick links</span>
                                    </div>
                                    <div className="pBody pb-0 pt-0">
                                        <div className="pHead quickLinks pt-0">
                                            <div className="reportLink">

                                                <Link to={AUTH_ROUTES.RUN_REPORT}>
                                                    <span className="h5">
                                                        {getSvg('Generate reports')}
                                                    </span>
                                                </Link>

                                                <span className="h5">Generate reports</span>

                                            </div>
                                            <div className="reportLink">
                                                <Link to={AUTH_ROUTES.SUPPORT_CALCULATOR}>

                                                    <span className="h5">
                                                        {getSvg('Create support calculations')}
                                                    </span>
                                                </Link>
                                                <span className="h5">Create support calculations</span>
                                            </div>
                                            <div className="reportLink">
                                                <Link to={AUTH_ROUTES.MONTHLY_CHECKLIST_TABLE}>
                                                    <span className="h5">

                                                        {getSvg('Monthly review checklist')}
                                                    </span>
                                                </Link>
                                                <span className="h5">Complete monthly checklist</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span class="moreBtn">
                                        {getSvg('moreBtn')}
                                    </span>
                                </div>

                                <div className="panel panelH-min mb-4">
                                    <div className="pHead">
                                        <span className="h5">
                                            {/* {getSvg('Overdue task')}
                                             */}
                                            <AssignmentTurnedInIcon fontSize="large" style={{ color: "#73c3fd" }} />
                                            Overdue task</span>
                                        <div className="control">
                                            <button className="btn btnPrimary" type="button"
                                                onClick={() => { history.push(AUTH_ROUTES.MONTHLY_CHECKLIST_TABLE) }}
                                            >View
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pBody pb-0 pt-0" style={{ height: "473px" }} >
                                        <DashboardCards data={overdue_task_data} />
                                    </div>

                                    <span class="moreBtn">
                                        {getSvg('moreBtn')}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>


            </div>
        </div>


    </>
}

export default DashboardFirm