import React from 'react'
import Layout from '../../components/LayoutComponents/Layout'
import { useSelector } from 'react-redux';
import Loader from '../../components/Loader';
import { useHistory } from 'react-router';
import { AUTH_ROUTES } from '../../routes/Routes.types';
import { RootState } from "./superadmininterface"
import axios from "../../utils/axios"
import { getSvg } from "./getSuperAdminSvgs"
const SuperAdminDataload = () => {

  const { userInfo } = useSelector((state: RootState) => state.userLogin);
  const [loading, setLoading] = React.useState(false)
  const [sortedBy, setSortedBy] = React.useState('All')
  const [dataloadlist, setDataloadList] = React.useState({
    list: [],
    filteredList: []
  })

  const history = useHistory();

  const fetchSubscriber = () => {
    setLoading(true)
    axios.get('/dataLoad/listing').then((response) => {
      setDataloadList((prev) => ({
        ...prev,
        list: response.data.body,
        filteredList: response.data.body
      }))
      console.log('checkResOFlistDatkkiad', response)
      setLoading(false)

    }).catch((error) => {
      setLoading(false)

      console.log('error', error)
    })
  }

  const headings = ["Date", "Display name", "Status"]

  React.useEffect(() => {
    fetchSubscriber()
  }, [])

  const formatDateTime = (dateString: string | Date, includeSeconds: boolean = false): string => {
    let date: Date;

    // Check if dateString is a Date object or a string
    if (dateString instanceof Date) {
      date = dateString;
    } else {
      date = new Date(dateString);
    }

    // Validate the date
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date format");
    }

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Extract individual components
    const year = date.getFullYear();
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');

    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    // Format the output string
    let formattedTime = `${month} ${day}, ${year} at ${hours}:${minutes} ${ampm}`;

    // Include seconds if specified
    if (includeSeconds) {
      const seconds = String(date.getSeconds()).padStart(2, '0');
      formattedTime = `${month} ${day}, ${year} at ${hours}:${minutes}:${seconds} ${ampm}`;
    }

    return formattedTime;
  };

  const onSortEvent = (e : any) => {
    let { value } = e.target;
    setSortedBy(value)
    let filteredData;


    switch (value) {
      case 'All':
        filteredData = dataloadlist.list
        break;
      case 'Processed':
        filteredData = dataloadlist.list.filter((element) => element.status === 'Processed')
        break;
      case 'Pending':
        filteredData = dataloadlist.list.filter((element) => element.status === 'Pending')
        break;

      default: filteredData = dataloadlist.list
        break;
    }


    setDataloadList((prev) => ({
      ...prev,
      filteredList: filteredData
    }));



  }




  return (
    <Layout title={`Welcome ${userInfo ? userInfo.username : 'Guest'}`}>
      <Loader isLoading={loading} />

      <div className="panel" style={{ backgroundColor: "#F5F9FF" }}>
        <div className="pHead">
          <span className="h5">
            {getSvg('Data load')}
            Data load
          </span>
          <div className="control">

            <div className="control">

              <select
                className="form-select rounded-pill"
                aria-label="Default select example"
                onChange={(e) => {
                  onSortEvent(e);

                }}
                value={sortedBy}
              >
                <option value="All" selected>All</option>
                <option value="Processed">Processed</option>
                <option value="Pending">Pending</option>
              </select>


            </div>


            <button className="btn btnPrimary" type="button"
              onClick={() => { history.push(AUTH_ROUTES.SUPERADMINDB) }}
            >Home
            </button>


          </div>
        </div>
        <div className="pBody pb-0">
          <div className="tableOuter">
            {dataloadlist && dataloadlist.filteredList.length > 0 ? (
              <table className="table customGrid">
                <thead>
                  <tr>
                    {headings.map((e, index) => {
                      return <th key={index}>{e}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {dataloadlist.filteredList.map((e, key) => {
                    console.log('checkKjdINF', e)
                    return (
                      <>
                        <tr className="highlight_blue" >

                          <td className={"tdCheckBox"}>
                            <span>{formatDateTime(e?.date)}</span>

                          </td>

                          <td>
                            <span>{e?.display_firmname}</span>
                          </td>

                          <td>
                            <span>
                              {e.status == 'Processed' ? <span className='active' style={{ marginRight: '8px' }}>
                                <svg width="8" height="9" viewBox="0 0 8 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="4" cy="4.5" r="4" fill="#4CB528" />
                                </svg>

                              </span> : <span className='inactive' style={{ marginRight: '8px' }}>
                                <svg width="8" height="9" viewBox="0 0 8 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="4" cy="4.5" r="4" fill="#FB554A" />
                                </svg>
                              </span>}
                              {e.status}

                            </span>
                          </td>


                        </tr>


                      </>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="heading-6 text-center">No Reports to Show</p>
            )}
          </div>
        </div>
        <span className='moreBtn'><svg width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M2.5625 1.625C2.5625 1.81042 2.50752 1.99168 2.4045 2.14585C2.30149 2.30002 2.15507 2.42018 1.98377 2.49114C1.81246 2.56209 1.62396 2.58066 1.4421 2.54449C1.26025 2.50831 1.0932 2.41902 0.962088 2.28791C0.830976 2.1568 0.741688 1.98975 0.705514 1.8079C0.669341 1.62604 0.687906 1.43754 0.758863 1.26623C0.829821 1.09493 0.949982 0.948511 1.10415 0.845498C1.25832 0.742484 1.43958 0.6875 1.625 0.6875C1.87364 0.6875 2.1121 0.786272 2.28791 0.962088C2.46373 1.1379 2.5625 1.37636 2.5625 1.625ZM8 0.6875C7.81458 0.6875 7.63332 0.742484 7.47915 0.845498C7.32498 0.948511 7.20482 1.09493 7.13386 1.26623C7.06291 1.43754 7.04434 1.62604 7.08051 1.8079C7.11669 1.98975 7.20598 2.1568 7.33709 2.28791C7.4682 2.41902 7.63525 2.50831 7.8171 2.54449C7.99896 2.58066 8.18746 2.56209 8.35877 2.49114C8.53007 2.42018 8.67649 2.30002 8.7795 2.14585C8.88252 1.99168 8.9375 1.81042 8.9375 1.625C8.9375 1.37636 8.83873 1.1379 8.66291 0.962088C8.4871 0.786272 8.24864 0.6875 8 0.6875ZM14.375 2.5625C14.5604 2.5625 14.7417 2.50752 14.8958 2.4045C15.05 2.30149 15.1702 2.15507 15.2411 1.98377C15.3121 1.81246 15.3307 1.62396 15.2945 1.4421C15.2583 1.26025 15.169 1.0932 15.0379 0.962088C14.9068 0.830976 14.7398 0.741688 14.5579 0.705514C14.376 0.66934 14.1875 0.687906 14.0162 0.758864C13.8449 0.829821 13.6985 0.949982 13.5955 1.10415C13.4925 1.25832 13.4375 1.43958 13.4375 1.625C13.4375 1.87364 13.5363 2.1121 13.7121 2.28791C13.8879 2.46373 14.1264 2.5625 14.375 2.5625ZM1.625 7.4375C1.43958 7.4375 1.25832 7.49248 1.10415 7.5955C0.949982 7.69851 0.829821 7.84493 0.758863 8.01624C0.687906 8.18754 0.669341 8.37604 0.705514 8.5579C0.741688 8.73975 0.830976 8.9068 0.962088 9.03791C1.0932 9.16903 1.26025 9.25831 1.4421 9.29449C1.62396 9.33066 1.81246 9.3121 1.98377 9.24114C2.15507 9.17018 2.30149 9.05002 2.4045 8.89585C2.50752 8.74168 2.5625 8.56042 2.5625 8.375C2.5625 8.12636 2.46373 7.8879 2.28791 7.71209C2.1121 7.53627 1.87364 7.4375 1.625 7.4375ZM8 7.4375C7.81458 7.4375 7.63332 7.49248 7.47915 7.5955C7.32498 7.69851 7.20482 7.84493 7.13386 8.01624C7.06291 8.18754 7.04434 8.37604 7.08051 8.5579C7.11669 8.73975 7.20598 8.9068 7.33709 9.03791C7.4682 9.16903 7.63525 9.25831 7.8171 9.29449C7.99896 9.33066 8.18746 9.3121 8.35877 9.24114C8.53007 9.17018 8.67649 9.05002 8.7795 8.89585C8.88252 8.74168 8.9375 8.56042 8.9375 8.375C8.9375 8.12636 8.83873 7.8879 8.66291 7.71209C8.4871 7.53627 8.24864 7.4375 8 7.4375ZM14.375 7.4375C14.1896 7.4375 14.0083 7.49248 13.8542 7.5955C13.7 7.69851 13.5798 7.84493 13.5089 8.01624C13.4379 8.18754 13.4193 8.37604 13.4555 8.5579C13.4917 8.73975 13.581 8.9068 13.7121 9.03791C13.8432 9.16903 14.0102 9.25831 14.1921 9.29449C14.374 9.33066 14.5625 9.3121 14.7338 9.24114C14.9051 9.17018 15.0515 9.05002 15.1545 8.89585C15.2575 8.74168 15.3125 8.56042 15.3125 8.375C15.3125 8.12636 15.2137 7.8879 15.0379 7.71209C14.8621 7.53627 14.6236 7.4375 14.375 7.4375Z" fill="#171D34" /> </svg></span>
      </div>
    </Layout>
  )
}

export default SuperAdminDataload
