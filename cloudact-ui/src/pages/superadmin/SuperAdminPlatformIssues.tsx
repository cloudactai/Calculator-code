import React from 'react'
import Layout from '../../components/LayoutComponents/Layout'
import { useSelector } from 'react-redux';
import {getSvg} from "./getSuperAdminSvgs"
const SuperAdminPlatformIssues = () => {

  const { userInfo } = useSelector((state) => state.userLogin);

  return (
   <Layout title={`Welcome ${userInfo.username}`}>
      SuperAdminPlatformIssues
    </Layout>
  )
}

export default SuperAdminPlatformIssues
