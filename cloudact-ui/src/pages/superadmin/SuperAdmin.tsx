import React from 'react'
import { useSelector } from 'react-redux';

import Layout from '../../components/LayoutComponents/Layout'
import { AUTH_ROUTES } from '../../routes/Routes.types';
import axios from "../../utils/axios"
import Loader from '../../components/Loader';
import { getSvg } from './getSuperAdminSvgs';
import { RootState } from "./superadmininterface"
import Panel from '../../containers/Superadmin/Panel';
import { useDispatch } from 'react-redux';
import { userProfileInfoAction } from '../../actions/userActions';
const SuperAdmin = () => {

  const { userInfo } = useSelector((state: RootState) => state.userLogin);

  const dispatch = useDispatch();

  const [usersData, setUsersData] = React.useState({
    subscriberscounts: 0,
    unsubscribercounts: 0,
    activeuserscounts: 0,
    inactiveuserscounts: 0,
    dataloadsucesscounts: 0,
    dataloadunsucesscounts: 0,

  })
  const [loader, setLoader] = React.useState(false)
  const fetchData = async () => {
    setLoader(true)
    try {
      const [subscribersData, activeInactiveData, dataLoadCounts] = await Promise.all([
        axios.get('/get/unsubscriber/subscriber/user'),
        axios.get('/get/active/inactive/user'),
        axios.get('/dataLoad/count')
      ]);

      setUsersData((prev) => ({
        ...prev,
        subscriberscounts: subscribersData.data.body.data.total_subscribers,
        unsubscribercounts: subscribersData.data.body.data.total_unsubscribers,
        activeuserscounts: activeInactiveData.data.body.data.totalActiveUsers,
        inactiveuserscounts: activeInactiveData.data.body.data.totalInactiveUsers,
        dataloadsucesscounts: dataLoadCounts.data.body[0].total_successful_batches,
        dataloadunsucesscounts: dataLoadCounts.data.body[0].total_pending_batches
      }));
      setLoader(false)

    } catch (error) {
      console.error('Error fetching data:', error);
      setLoader(false)
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  React.useEffect(() => {
    dispatch(userProfileInfoAction());
  }, []);

  return (
    <Layout title={`Welcome ${userInfo ? userInfo.username : 'Guest'}`}>
      <Loader isLoading={loader} loadingMsg='Loading...' />

      <div className="newDashboard mb-3">
        <div className="row">

          {/* User Panel */}
          <Panel
            icon={getSvg('userAvatar')}
            title="Users"
            activeCount={usersData.activeuserscounts}
            activeLabel="Active users"
            inactiveCount={usersData.inactiveuserscounts}
            inactiveLabel="Inactive users"
            route={AUTH_ROUTES.SUPERADMINUSERS}
          />

          {/* Subscriber Panel */}
          <Panel
            icon={getSvg('subscriberAvatar')}
            title="Subscribers"
            activeCount={usersData.subscriberscounts}
            activeLabel="Active subscribers"
            inactiveCount={usersData.unsubscribercounts}
            inactiveLabel="Inactive subscribers"
            route={AUTH_ROUTES.SUPERADMINSUBSCRIBERS}
          />

          {/* Data load Panel */}
          <Panel
            icon={getSvg('Data load')}
            title="Data Load"
            activeCount={usersData.dataloadsucesscounts}
            activeLabel="Successful loads"
            inactiveCount={usersData.dataloadunsucesscounts}
            inactiveLabel="Failed data loads"
            route={AUTH_ROUTES.SUPERADMINDATALOAD}
          />

          {/* Platform issues Panel */}
          <Panel
            icon={getSvg('Platform issues')}
            title="Platform Issues"
            activeCount={0}
            activeLabel="Issues reported"
            inactiveCount={0}
            inactiveLabel="Issues resolved"
            route={AUTH_ROUTES.SUPERADMINDATAPLATFORMISSUES}
          />

        </div>
      </div>


    </Layout>
  )
}

export default SuperAdmin









