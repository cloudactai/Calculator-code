import NewMatterModal from "../../components/Matters/NewMatterModal";
import { Link, useHistory } from "react-router-dom";
import Layout from "../../components/LayoutComponents/Layout";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { getUserSID } from "../../utils/helpers";
import { getAllMatters } from "../../utils/Apis/matters/getMatters/getMattersActions";
import { createMatter } from "../../utils/Apis/matters/createMatters/createMattersActions";
import {
  selectMattersData,
  selectMattersError,
  selectMattersLoading,
} from "../../utils/Apis/matters/getMatters/getMattersSelectors";
import Loader from "../../components/Loader";
import moment from "moment";
import { convertDate } from "../../utils/helpers/Formatting";
import {
  Col,
  Container,
  Pagination as PaginationBStrap,
  Row,
} from "react-bootstrap";

const MatterDashboard = () => {
  const { response } = useSelector((state) => state.userProfileInfo);

  const [matterNewModal, setMatterModalShow] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10; // Adjust this value based on your requirement
  const history = useHistory();
  const dispatch = useDispatch();

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePreviousClick = () => {
    if (currentPage > 1) {
      paginate(currentPage - 1);
    }
  };

  const handleNextClick = () => {
    if (currentPage < totalPages) {
      paginate(currentPage + 1);
    }
  };

  /**
   * Create a new matter
   * This opens the modal to create a new matter
   */
  const createNewMatter = () => {
    setMatterModalShow(true);
  };

  /**
   * Get all matters
   * This useEffect hook gets all matters from the backend
   *
   * Example response data:
   * {
   *   "data": {
   *     "code": 200,
   *     "status": "success",
   *     "body": [{
   *       "id": 6,
   *       "client_id": "Alex Smith",
   *       "matterNumber": "CA-2024-00001",
   *       "clientRole": "Client",
   *       "childrenInvolved": "Yes",
   *       "province": "Ontario",
   *       "checkedItems": "[\"divorce\", \"children_implications\", \"support\"]",
   *       "sid": 1,
   *       "information_completed": 0,
   *       "status": 0,
   *       "source": "Internal",
   *       "valuation_date": "2024-05-16",
   *       "financial_year_income_benefits": "2022",
   *       "financial_year_expenses": "2023",
   *       "created": "2024-05-17T15:34:30.000Z"
   *     }]
   *   }
   * }
   */
  useEffect(() => {
    dispatch(getAllMatters());
  }, [dispatch]);

  /**
   * Get the user matters
   * This is a selector to get the user matters from the redux store
   */
  const userMatters = useSelector(selectMattersData);
  const matterRows = Array.isArray(userMatters?.body) ? userMatters.body : [];

  // Calculate the indices of the first and last items on the current page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const filteredMatters =
    matterRows.filter((item) => {
      const term = searchTerm.toLowerCase();
      return (
        String(item.matterNumber || "").toLowerCase().includes(term) ||
        String(item.client_id || "").toLowerCase().includes(term) ||
        String(item.source || "").toLowerCase().includes(term)
      );
    }) || [];

  const currentItems = filteredMatters.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(filteredMatters.length / itemsPerPage));

  const selectMatterLoading = useSelector(selectMattersLoading);
  const selectMatterError = useSelector(selectMattersError);

  /**
   * Create a New Matter
   * This is the function to handle the continue button
   * It creates a new matter and redirects to the 5-steps page
   *
   * @param {Object} state - The form state containing matter details
   * @param {number} state.sid - User's SID obtained from getUserSID()
   * @param {Array} state.checkedItems - Selected items/services for the matter
   * @param {string} state.clientName - Name of the client
   * @param {string} state.matterNumber - Generated matter number (format: CA-YYYY-XXXXX)
   * @param {string} state.clientRole - Role of the client
   * @param {string} state.childrenInvolved - Whether children are involved ("Yes"/"No")
   * @param {string} state.province - Province where matter is filed
   */
  const handleContinue = async (state) => {
    const mattersCount = matterRows.length; // Ensure mattersCount is defined
    let matter_number = null;
    if(state && state.matterNumber){
      matter_number = state.matterNumber
    } else {
      matter_number =
        "CA-" + moment().year() + "-" + String(mattersCount + 1).padStart(5, "0");
    }

    const formData = {
      sid: getUserSID(),
      checkedItems: state.checkedItems,
      clientName: state.clientName,
      matterNumber: matter_number,
      clientRole: state.clientRole,
      childrenInvolved: state.childrenInvolved,
      province: state.province,
    };

    if (
      state.checkedItems &&
      state.clientName &&
      matter_number &&
      state.clientRole &&
      state.childrenInvolved &&
      state.province
    ) {
      // setMatterNumber(matter_number)
      const createdMatter = await dispatch(createMatter(formData));
      if (createdMatter) {
        setMatterModalShow(false);
        history.push(`/single-matter/${matter_number}`);
      }
      return;
    }
    setMatterModalShow(false);
  };

  const handleOpenMatter = (matter) => {
    if (!matter) return;
    // Carry the client name so the single-matter header can show it even if the
    // get_single_matter response omits client_id.
    history.push(`/single-matter/${matter.matterNumber}`, {
      clientName: matter.client_id,
    });
  };

  return (
    <Layout title={`Welcome ${response?.username ? response?.username : ""}`}>
      {selectMatterLoading ? (
        <Loader isLoading={<Loader isLoading={selectMatterLoading} />} />
      ) : (
        <>
          <div className="panel trans">
            <div className="pHead">
              <span className="h5">
                <svg
                  width="45"
                  height="45"
                  viewBox="0 0 45 45"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M28.4336 34.9784L28.4775 37.8175C28.4775 38.1213 28.8114 38.3644 29.2157 38.3644L40.6391 38.2776C41.0433 38.2776 41.3685 38.0258 41.3685 37.722L41.3245 34.8829C41.3245 34.579 40.9906 34.3359 40.5864 34.3359L29.1629 34.4228C28.7587 34.4228 28.4336 34.6745 28.4336 34.9784Z"
                    fill="#AAE07F"
                  />
                  <path
                    d="M39.2031 34.3555H41.356V37.8804H39.2031V34.3555Z"
                    fill="#F5F9FF"
                  />
                  <path
                    opacity="0.7"
                    d="M42.5989 44.9148H29.4883C33.9083 44.9148 37.7835 42.5272 39.9188 38.2556L42.4935 38.2383L42.5989 44.9148Z"
                    fill="#307FF4"
                  />
                  <path
                    d="M39.9203 38.2539C37.785 42.5168 33.9098 44.9131 29.4898 44.9131H27.4599L27.3633 38.3581L39.9203 38.2539Z"
                    fill="#73C3FD"
                  />
                  <path
                    d="M43.2549 24.0582L42.8243 24.2319L41.2778 19.4654L41.2602 19.422C40.9966 18.9271 40.4869 18.6146 39.9245 18.5972C39.1512 18.5798 38.4219 18.9618 37.9913 19.5956L37.9825 19.613C37.5432 20.377 37.3762 21.2626 37.508 22.1308C37.6398 22.9643 38.0001 25.1435 38.1495 26.0204C37.9474 26.1333 37.7453 26.2635 37.5607 26.4024L28.5011 30.1444L27.4554 30.5785L26.8578 30.8303L26.5854 30.9432L24.1689 25.2477C24.2392 25.2564 24.3095 25.2564 24.3886 25.2651C25.2498 25.3345 26.2603 25.2824 27.0072 24.8917C27.1215 24.831 27.2269 24.7702 27.3324 24.7007C27.7366 24.4316 28.0881 24.093 28.3693 23.6936C28.4132 23.6328 28.4483 23.5807 28.4835 23.52C28.5098 23.4765 28.5362 23.4244 28.5626 23.381C28.7295 23.0858 28.8526 22.7733 28.9316 22.4607C28.9404 22.426 28.9492 22.3913 28.958 22.3479C28.958 22.3479 28.958 22.3392 28.958 22.3305C29.3007 20.733 28.5714 19.0313 27.0512 18.2065C25.1883 17.1907 22.8421 17.8592 21.8227 19.6998C21.6382 19.2657 21.4273 18.7622 21.1988 18.2239V18.2152C20.5134 16.583 19.705 14.6729 19.3008 13.7265L26.067 10.9309C26.357 10.8094 26.5327 10.5315 26.5151 10.219C26.4976 9.9151 26.2955 9.65463 25.9967 9.56781C25.2937 9.35076 24.6962 8.87324 24.3535 8.23077C23.6241 6.88504 24.1338 5.20939 25.4958 4.48878C26.8578 3.76817 28.5538 4.27173 29.2831 5.61745C29.6961 6.38148 29.5555 7.69248 29.4764 8.22208C29.4589 8.361 29.4764 8.50859 29.5292 8.63883C29.6961 9.0382 30.1706 9.23789 30.5749 9.06425L36.9984 6.40753L43.8524 22.6083C44.0897 23.1727 43.8261 23.8238 43.2549 24.0582Z"
                    fill="#F6BD3D"
                  />
                  <path
                    opacity="0.3"
                    d="M23.8633 25.8644L26.3061 31.6294L43.4589 24.5448C44.3025 24.1975 44.6979 23.2425 44.3464 22.409L44.074 21.7578C43.3359 22.1138 42.5802 22.4524 41.8157 22.7736C36.1391 25.1265 30.0056 26.177 23.8633 25.8644Z"
                    fill="#FBFCFE"
                  />
                  <path
                    d="M43.16 26.9851L41.6662 32.5243L41.6574 32.5156L41.6398 32.585C41.5871 32.8021 41.4904 33.0018 41.3674 33.1841C41.3674 33.1841 40.9368 33.8874 40.5238 34.4951L29.5397 34.5038C28.5819 33.6443 28.0283 32.4288 28.002 31.1525L27.9844 30.3624L28.5028 30.1454L37.5625 26.4034C37.747 26.2645 37.9404 26.1342 38.1513 26.0214C38.0019 25.1445 37.6416 22.974 37.5098 22.1318C37.5098 22.1231 37.5098 22.1144 37.5098 22.1144C37.624 22.1057 37.7295 22.0971 37.8437 22.0884C37.8437 21.8106 37.8701 21.5327 37.9491 21.2636C37.9755 21.1594 38.0107 21.0552 38.0546 20.951C38.1249 20.5777 38.2567 20.2217 38.4412 19.8831C38.9597 19.0844 40.3217 18.7545 40.805 19.6661L43.16 26.9851Z"
                    fill="#EFCDB1"
                  />
                  <path
                    d="M16.7474 10.9759L16.7034 8.13682C16.7034 7.83294 16.3695 7.58984 15.9653 7.58984L4.54184 7.67666C4.13763 7.67666 3.8125 7.92845 3.8125 8.23232L3.85644 11.0714C3.85644 11.3752 4.19035 11.6183 4.59457 11.6183L16.018 11.5315C16.4222 11.5315 16.7474 11.2884 16.7474 10.9759Z"
                    fill="#AAE07F"
                  />
                  <path
                    d="M3.8125 8.07422H5.96538V11.5992H3.8125V8.07422Z"
                    fill="#F5F9FF"
                  />
                  <path
                    opacity="0.7"
                    d="M2.58203 0.0078125H15.6926C11.2726 0.0078125 7.39746 3.43724 5.26215 7.70884L2.67869 7.7262L2.58203 0.0078125Z"
                    fill="#307FF4"
                  />
                  <path
                    d="M5.25781 7.70016C7.39312 3.43724 11.2683 0.0078125 15.6883 0.0078125H17.7182L17.8148 7.60465L5.25781 7.70016Z"
                    fill="#73C3FD"
                  />
                  <path
                    d="M16.4933 13.7503L9.44587 16.8672L8.55836 16.4591C8.3914 16.8151 8.20686 17.1624 8.02233 17.4923C7.99597 17.5444 7.96082 17.5878 7.93446 17.6399C7.77629 17.909 7.59175 18.1435 7.39843 18.3345C6.84484 18.8901 6.25609 19.1419 6.2473 19.1419L5.86066 19.2982L5.9046 19.5673L5.93096 19.7062C5.93975 19.741 6.46698 22.9099 6.63394 23.9605C6.7306 24.5856 6.61637 25.2194 6.30002 25.775C6.07155 26.0963 5.70249 26.2959 5.30706 26.2959C5.13132 26.3046 4.96436 26.2091 4.87649 26.0615L3.16297 20.7741L3.0048 20.2706L2.84662 19.767L2.57422 18.9335L4.02412 13.5506C4.06806 13.3943 4.16472 13.1773 4.25259 13.0384L4.26138 13.021C4.26138 13.0123 4.52499 12.5956 4.83255 12.1181L15.5179 12.0312C15.9748 12.5435 16.3087 13.1252 16.4933 13.7503Z"
                    fill="#EFCDB1"
                  />
                  <path
                    d="M27.9303 22.1221C27.737 22.7906 27.28 23.3896 26.6298 23.7543C25.8653 24.1797 24.5384 24.0755 24.0024 24.0148C23.853 23.9974 23.7124 24.0148 23.5806 24.0755C23.44 24.1363 23.3346 24.2318 23.2555 24.3447C23.0797 24.4923 22.9743 24.718 22.9743 24.9437C22.9743 25.0479 22.9918 25.1521 23.0358 25.2476L25.6895 31.5248C25.628 31.6029 25.5489 31.6637 25.4523 31.7071C24.0112 32.3496 21.5683 33.4262 20.0657 34.0947C20.2502 33.3828 20.2239 32.6361 19.9866 31.9415C19.31 29.9533 17.1219 28.8767 15.1097 29.5539C13.0974 30.2225 12.0078 32.3843 12.6932 34.3725C12.9919 35.2407 13.7828 36.0047 14.5121 36.5517L8.55435 39.1824L1.17304 22.8861C0.918208 22.3218 1.17304 21.6706 1.74421 21.4188L2.20994 21.2104L3.91467 26.4805L3.94103 26.5239C4.20465 27.0188 4.71431 27.3313 5.2767 27.3487H5.36457C6.11149 27.34 6.80568 26.958 7.21869 26.3416L7.22747 26.3242C7.66684 25.5602 7.83379 24.6746 7.70199 23.8064C7.57018 22.9642 7.2099 20.7937 7.06051 19.9168C7.7635 19.5261 8.35224 18.9705 8.79161 18.3019L16.6826 14.8117L17.7107 14.3603L17.8074 14.3168C17.8689 14.2908 17.9304 14.2734 18.0007 14.2734C18.1852 14.2734 18.3522 14.3776 18.4225 14.5426C18.8882 15.5671 19.6175 17.1906 20.2502 18.5798V18.5884C20.6193 19.4567 20.9532 20.2554 21.1729 20.7677C21.2608 20.9673 21.4277 21.1149 21.6386 21.1844C22.0252 21.3059 22.4383 21.0889 22.5613 20.7069C22.781 20.0123 23.2643 19.4219 23.9145 19.0833C25.2765 18.3627 26.9725 18.8663 27.7018 20.212C27.9918 20.8371 28.0621 21.5056 27.9303 22.1221Z"
                    fill="#307FF4"
                  />
                  <path
                    opacity="0.3"
                    d="M26.8865 24.2152C26.0253 24.6927 24.6545 24.6233 23.934 24.5364C23.7846 24.5191 23.6528 24.6233 23.6352 24.7709C23.6264 24.823 23.6352 24.8664 23.6528 24.9098L26.2538 30.6573C26.5174 31.239 26.2538 31.9249 25.6651 32.1941C23.9691 32.9407 20.8936 34.3038 19.5843 34.8855C19.4788 34.9289 19.3558 34.8855 19.3118 34.7813C19.2855 34.7292 19.2855 34.6598 19.3118 34.6077C20.1203 32.9841 19.4437 31.0133 17.8004 30.2145C16.1572 29.4158 14.1625 30.0843 13.3541 31.7079C12.9674 32.4893 12.9059 33.3835 13.1871 34.2083C13.5035 35.1373 14.5755 35.9795 15.173 36.3875C15.2961 36.4743 15.3312 36.6393 15.2433 36.7608C15.217 36.8043 15.173 36.8303 15.1291 36.8563L8.28382 39.8864L6.5 35.9447C12.2908 31.7426 16.1484 24.2239 16.1484 15.646C16.1484 15.264 16.1396 14.8819 16.1221 14.4999L17.572 13.8575C18.0728 13.6404 18.6528 13.8575 18.8813 14.3523C19.6282 15.9933 21.0605 19.1709 21.6668 20.5079C21.7108 20.6121 21.8338 20.6555 21.9392 20.6121C21.992 20.5861 22.0359 20.5427 22.0535 20.4819C22.5456 18.7368 24.3821 17.7123 26.1484 18.2072C27.9146 18.7021 28.9515 20.5079 28.4506 22.253C28.2046 23.0778 27.651 23.7811 26.8865 24.2152Z"
                    fill="#F5F9FF"
                  />
                  <path
                    d="M10.8516 41.3047L11.789 40.8275L13.0044 43.1585L12.067 43.6356L10.8516 41.3047Z"
                    fill="#171D34"
                  />
                  <path
                    d="M3.27344 43.1484L4.48886 40.8175L5.42629 41.2947L4.21086 43.6256L3.27344 43.1484Z"
                    fill="#171D34"
                  />
                  <path
                    d="M7.59375 44.9766L7.66009 42.3546L8.71457 42.3806L8.64822 45.0026L7.59375 44.9766Z"
                    fill="#171D34"
                  />
                  <path
                    d="M33.1797 1.96875L34.1171 1.49158L35.3325 3.82254L34.3951 4.2997L33.1797 1.96875Z"
                    fill="#171D34"
                  />
                  <path
                    d="M40.75 3.8125L41.9654 1.48154L42.9028 1.95871L41.6874 4.28967L40.75 3.8125Z"
                    fill="#171D34"
                  />
                  <path
                    d="M37.4688 2.72266L37.5351 0.100662L38.5896 0.126709L38.5232 2.7487L37.4688 2.72266Z"
                    fill="#171D34"
                  />
                  <path
                    d="M44.8303 22.2088L37.5632 5.0443L30.5685 7.93544C30.6476 7.11933 30.6564 5.96461 30.2082 5.13112C29.8568 4.47997 29.3207 3.95036 28.6705 3.59439C26.8076 2.57859 24.4702 3.24711 23.442 5.08771C22.4139 6.92832 23.0906 9.23776 24.9535 10.2536L17.9148 13.1621L17.95 13.2489C17.783 13.2489 17.6161 13.2749 17.4579 13.3357C17.2909 12.8148 17.0361 12.3199 16.711 11.8771C16.7989 11.825 16.8867 11.7556 16.9658 11.6861C17.1591 11.4951 17.2646 11.2433 17.2646 10.9742L17.2294 8.13513L17.827 8.12645C18.117 8.12645 18.3542 7.88335 18.3454 7.59684L18.2488 0L17.1943 0.0173642L17.2822 7.09328L16.2453 7.10196C16.1486 7.0846 16.0519 7.07592 15.9553 7.07592L4.53182 7.16274C4.42638 7.16274 4.32972 7.17142 4.23306 7.19746L3.19616 7.20615L3.10828 0L2.05381 0.0173642L2.15047 7.73576C2.15047 8.02226 2.38773 8.248 2.67771 8.248H3.28403L3.32797 11.087C3.32797 11.4083 3.49492 11.6861 3.74975 11.8771C3.54765 12.1984 3.38948 12.4415 3.36312 12.4935C3.21373 12.7193 3.06435 13.0405 2.99405 13.301L1.46506 18.9878L1.86049 20.2206L1.28932 20.4724C0.190908 20.9586 -0.30118 22.2349 0.190908 23.3201L8.0028 40.5628L15.3226 37.3244C15.4544 37.2636 15.5686 37.1768 15.6477 37.0552C15.9026 36.6993 15.8147 36.2044 15.4544 35.9526C14.5142 35.3014 13.8639 34.5982 13.6706 34.0252C13.4333 33.3306 13.4861 32.5839 13.8112 31.9241C14.4878 30.5523 16.1662 29.988 17.5546 30.6565C18.943 31.325 19.5141 32.9833 18.8375 34.3551C18.7409 34.5548 18.7321 34.7805 18.8199 34.9802C18.9869 35.3448 19.4175 35.5098 19.7865 35.3448C21.0958 34.7631 24.1714 33.4001 25.8673 32.6534C26.1661 32.5232 26.4034 32.3148 26.5791 32.063L27.5106 31.6897C27.616 32.5579 27.9499 33.3827 28.4596 34.0859C28.3717 34.138 28.2838 34.1988 28.2047 34.277C28.0114 34.4593 27.906 34.7197 27.906 34.9802L27.9499 37.8192H27.3524C27.0624 37.8279 26.8251 38.0623 26.8339 38.3489L26.9306 44.9038L27.9851 44.8865L27.8972 38.8524L28.9341 38.8437C29.022 38.8611 29.1186 38.8698 29.2241 38.8698H29.2329L40.6563 38.783C40.7618 38.783 40.8584 38.7743 40.9551 38.7482L41.992 38.7396L42.0799 44.9038L43.1343 44.8865L43.0377 38.2099C43.0377 37.9234 42.8004 37.6977 42.5104 37.6977L41.9041 37.7064V37.6977L41.8602 34.8587C41.8602 34.5374 41.6932 34.2596 41.4384 34.0686C41.6405 33.7473 41.7987 33.5042 41.825 33.4521C41.9744 33.2177 42.1238 32.9052 42.1941 32.6447L43.7231 26.9666L43.1607 25.2302L43.6704 25.0218C44.7688 24.5617 45.296 23.3028 44.8303 22.2088ZM5.90264 19.5781L5.929 19.7171C5.93779 19.7518 6.46502 22.9208 6.63198 23.9713C6.72864 24.5964 6.61441 25.2302 6.29807 25.7859C6.0696 26.1071 5.70053 26.3068 5.3051 26.3068C5.12936 26.3155 4.9624 26.22 4.87453 26.0724L3.16101 20.785L3.00284 20.2814L2.84467 19.7778L2.57226 18.9444L4.02216 13.5614C4.0661 13.4052 4.16276 13.1881 4.25063 13.0492L4.25942 13.0318C4.25942 13.0232 4.52304 12.6064 4.83059 12.1289L15.5159 12.0421C15.9729 12.5283 16.3068 13.11 16.4913 13.7351L9.44391 16.852L8.5564 16.4439C8.38944 16.7999 8.2049 17.1472 8.02037 17.4771C7.99401 17.5292 7.95886 17.5726 7.9325 17.6247C7.77433 17.8938 7.5898 18.1282 7.39648 18.3192C6.84288 18.8749 6.25413 19.1267 6.24534 19.1267L5.8587 19.283L5.90264 19.5781ZM4.39123 8.23064L16.1135 8.13513C16.131 8.14381 16.1574 8.1525 16.175 8.16986L16.2101 10.9481C16.1486 10.9915 16.0783 11.0089 16.008 11.0089H15.9816L4.58455 11.0957C4.50546 11.1044 4.43516 11.0784 4.37365 11.035V10.9308L4.3385 8.25668C4.35608 8.248 4.37365 8.23932 4.39123 8.23064ZM25.4455 31.707C24.0044 32.3495 21.5616 33.4261 20.0589 34.0946C20.2435 33.3827 20.2171 32.636 19.9799 31.9415C19.3032 29.9533 17.1152 28.8767 15.1029 29.5539C13.0906 30.2224 12.001 32.3843 12.6864 34.3725C12.9852 35.2407 13.776 36.0047 14.5054 36.5517L8.54761 39.1823L1.1663 22.886C0.911465 22.3217 1.1663 21.6705 1.73747 21.4188L2.20319 21.2104L3.90793 26.4804L3.93429 26.5238C4.19791 27.0187 4.70757 27.3313 5.26995 27.3486H5.35783C6.10475 27.3399 6.79894 26.9579 7.21194 26.3415L7.22073 26.3241C7.66009 25.5688 7.82705 24.6832 7.69524 23.8237C7.69524 23.815 7.69524 23.815 7.69524 23.8063C7.56343 22.9642 7.20316 20.7936 7.05377 19.9167C7.75675 19.5261 8.3455 18.9704 8.78487 18.3019L16.6758 14.8117L17.1943 14.5859L17.704 14.3602L17.8006 14.3168C17.8621 14.2907 17.9236 14.2734 17.9939 14.2734C18.1785 14.2734 18.3454 14.3776 18.4157 14.5425C18.8814 15.567 19.6108 17.1906 20.2435 18.5797V18.5884C20.6125 19.4566 20.9465 20.2554 21.1661 20.7676C21.254 20.9673 21.421 21.1149 21.6319 21.1843C22.0185 21.3059 22.4315 21.0888 22.5545 20.7068C22.7742 20.0123 23.2575 19.4219 23.9078 19.0833C25.2698 18.3627 26.9657 18.8662 27.6951 20.2119C28.0202 20.8197 28.0993 21.4882 27.9587 22.1133C27.7654 22.7818 27.3084 23.3809 26.6582 23.7456C25.8937 24.171 24.5668 24.0668 24.0308 24.006C23.8814 23.9887 23.7408 24.006 23.609 24.0668C23.4684 24.1276 23.363 24.2231 23.2839 24.3359C23.1081 24.4835 23.0027 24.7093 23.0027 24.935C23.0027 25.0392 23.0203 25.1434 23.0642 25.2389L25.7179 31.516C25.6301 31.6029 25.5422 31.6636 25.4455 31.707ZM40.7881 37.7237L29.0659 37.8192C29.0483 37.8106 29.0308 37.8019 29.0132 37.7845L28.9692 35.0062C29.0308 34.9628 29.101 34.9455 29.1713 34.9455H29.1977L40.5948 34.8587C40.6651 34.8587 40.7442 34.876 40.8057 34.9194V35.0236L40.8409 37.6977C40.8233 37.7064 40.8057 37.7151 40.7881 37.7237ZM41.1572 32.3843C41.1133 32.5405 41.0166 32.7576 40.9287 32.8965L40.9199 32.9139C40.9199 32.9225 40.6563 33.348 40.3488 33.8168L29.6722 33.9036C28.9868 33.1917 28.5914 32.2627 28.5387 31.2816L36.1397 28.1387C35.9815 28.4339 35.8233 28.7465 35.6739 29.059L36.6317 29.5018C36.8251 29.0937 37.036 28.6944 37.2556 28.3123C37.5017 27.8869 37.8268 27.557 38.1256 27.3226C38.5562 26.9753 38.9428 26.8103 38.9428 26.8103L39.3294 26.6541L39.2679 26.2807L39.2591 26.2373C39.2591 26.2286 39.224 26.0463 39.1801 25.7511C39.0219 24.8135 38.688 22.7818 38.5562 21.9831C38.4595 21.358 38.5737 20.7155 38.8901 20.1685C39.1185 19.8473 39.4876 19.6476 39.883 19.6476C40.0588 19.6389 40.2257 19.7344 40.3136 19.882L41.8602 24.6485L42.0183 25.1434L42.1765 25.6383L42.6159 27.0013L41.1572 32.3843ZM43.2574 24.0581L42.8268 24.2318L41.2802 19.4653L41.2626 19.4219C40.999 18.927 40.4894 18.6144 39.927 18.5971C39.1537 18.5797 38.4244 18.9617 37.9938 19.5955L37.985 19.6129C37.5456 20.3682 37.3787 21.2451 37.5105 22.1133V22.1307C37.6423 22.9642 38.0026 25.1434 38.1519 26.0203C37.9498 26.1331 37.7477 26.2634 37.5632 26.4023L28.5035 30.1443L27.9851 30.3613L27.4578 30.5784L26.8603 30.8302L26.5879 30.943L24.1714 25.2476C24.2417 25.2562 24.312 25.2562 24.3911 25.2649C25.2522 25.3344 26.2628 25.2823 27.0097 24.8916C27.1239 24.8308 27.2294 24.77 27.3348 24.7006C27.5193 24.579 27.6951 24.4401 27.8533 24.2838C28.0466 24.1015 28.2135 23.9018 28.3717 23.6848C28.4156 23.624 28.4508 23.5719 28.4859 23.5111C28.5123 23.4677 28.5387 23.4156 28.565 23.3722C28.6353 23.242 28.6968 23.1118 28.7583 22.9815C28.8286 22.8079 28.8902 22.6342 28.9341 22.4519C28.9429 22.4172 28.9517 22.3825 28.9605 22.3391C28.9605 22.3391 28.9605 22.3304 28.9605 22.3217C29.3032 20.7242 28.5738 19.0225 27.0536 18.1977C25.1907 17.1819 22.8445 17.8504 21.8252 19.691C21.6407 19.2569 21.4298 18.7533 21.2013 18.2151V18.2064C20.5159 16.5741 19.7075 14.6641 19.3032 13.7177L26.0694 10.9221C26.3594 10.8005 26.5352 10.5227 26.5176 10.2102C26.5 9.90628 26.2979 9.64582 25.9991 9.559C25.2962 9.34194 24.6986 8.86443 24.3559 8.22195C23.6266 6.87623 24.1362 5.20058 25.4983 4.47997C26.8603 3.75935 28.5562 4.26291 29.2856 5.60864C29.6986 6.37266 29.558 7.68366 29.4789 8.21327C29.4613 8.35219 29.4789 8.49978 29.5316 8.63001C29.6986 9.02939 30.1731 9.22908 30.5773 9.05544L37.0008 6.40739L43.8549 22.6082C44.0921 23.1725 43.8285 23.8237 43.2574 24.0581Z"
                    fill="#171D34"
                  />
                </svg>{" "}
                Matters
              </span>

              <div className="control">
                <div class="gridSearch">
                  <i class="fas fa-search"></i>
                  <input
                    type="text"
                    className="form-control rounded-pill"
                    name="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search"
                  />
                </div>
                <button className="btn btnPrimary rounded-pill disabled">
                  Import Matter
                </button>
                <button
                  onClick={() => {
                    createNewMatter();
                  }}
                  className="btn btnPrimary rounded-pill"
                >
                  New Matter
                </button>
              </div>
            </div>

            <div className="pBody">
              <div className="tableOuter m-0">
                <table className="table customGrid">
                  <thead className="thead-primary">
                    <tr>
                      <th>Matter No</th>
                      <th>Client</th>
                      {/* <th>Lawyer</th> */}
                      <th>Open Date</th>
                      <th>Matter Source</th>
                      <th>Profile information completed?</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          {selectMatterError
                            ? "Unable to load matters. Please refresh and try again."
                            : "No matters yet."}
                        </td>
                      </tr>
                    ) : currentItems.map((item, key) => {
                      return (
                      <tr key={key}>
                        <td>{item.matterNumber}</td>
                        <td>{item.client_id}</td>
                        <td>{convertDate(item.created)}</td>
                        <td>{item.source}</td>
                        <td>
                          {item.information_completed === 0 ? (
                            <div className="customBadge customBadge-danger">
                              No
                            </div>
                          ) : (
                            <div className="customBadge customBadge-success">
                              Yes
                            </div>
                          )}
                        </td>
                        <td>
                          <div
                            className="statusBadge statusBadge text-decoration-none"
                            onClick={() => handleOpenMatter(item)}
                          >
                            Open
                          </div>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
                <Container className="container mt-3 pt-2">
                  <Row>
                    <Col md={4} className="mx-auto">
                      <PaginationBStrap className="justify-content-center mt-3">
                        {/* Previous Button */}
                        <PaginationBStrap.Prev
                          disabled={currentPage === 1}
                          onClick={handlePreviousClick}
                        />

                        {/* Page Numbers with Slicing */}
                        {[
                          ...Array(
                            totalPages
                          ),
                        ]
                          .map((_, index) => index + 1) // Generate page numbers
                          .slice(
                            Math.max(0, currentPage - 3), // Show 3 pages before currentPage
                            currentPage + 2 // Show 2 pages after currentPage
                          )
                          .map((i) => (
                            <PaginationBStrap.Item
                              key={i}
                              active={i === currentPage}
                              onClick={() => paginate(i)}
                            >
                              {i}
                            </PaginationBStrap.Item>
                          ))}

                        {/* Next Button */}
                        <PaginationBStrap.Next
                          disabled={
                            currentPage === totalPages
                          }
                          onClick={handleNextClick}
                        />
                      </PaginationBStrap>
                    </Col>
                  </Row>
                </Container>
              </div>

              <NewMatterModal
                show={matterNewModal}
                changeShow={() => setMatterModalShow(false)}
                handleClick={() => setMatterModalShow(false)}
                action=""
                handleContinue={(state) => handleContinue(state)}
                heading="New Matter"
                modalWidth="900px"
                existingData={selectedData}
              ></NewMatterModal>
            </div>
          </div>
          <div className="pb-4"></div>
        </>
      )}
    </Layout>
  );
};

export default MatterDashboard;
