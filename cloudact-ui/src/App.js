import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Routes from './routes/Routes.jsx';
import 'react-datetime/css/react-datetime.css'; 
import { Toaster } from 'react-hot-toast'; 
import UnauthorizedModal from './components/UnauthorizedModal'; // Adjust path as needed
import axios from '../src/utils/axios'; // Import axios to make API calls
import { AUTH_API_BASE } from './utils/dataAxios';
import Cookies from 'js-cookie';
import FamilyLawChat from './components/FamilyLawChat/FamilyLawChat';
import "flatpickr/dist/flatpickr.css";


const cookies_name = [
  'allUserInfo',
  'currentUserRole',
  'checklistId',
  'access_pages',
  'companyInfo',
  'userProfile',
  'province',
  'authClio',
  'authIntuit',
  'AccessToken',
  'RefreshToken',
  'DiagnoseConnection',
  'calculatorLabel'
];

function App() {
  const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => setShowUnauthorizedModal(true);

    window.addEventListener('unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, []);

  const handleCloseModal = () => setShowUnauthorizedModal(false);

  const handleConfirm = async () => {
    // The local session is already dead, so clearing it must not depend on the
    // server call succeeding. Asking the server to drop its cookies is a
    // courtesy; landing the user on the sign-in page is the point. This used to
    // gate the redirect on a `status === 'success'` body that /logout never
    // returns (it answers `{ ok: true }`), which left the user on a broken page
    // with their cookies already cleared and no way forward.
    cookies_name.forEach(cookie => Cookies.remove(cookie, { path: '/' }));
    localStorage.clear();

    try {
      await axios.post('/logout', null, {
        baseURL: AUTH_API_BASE,
        skipUnauthorizedModal: true,
      });
    } catch (error) {
      console.error('Error during logout request:', error);
    } finally {
      handleCloseModal();
      window.location.replace('/signIn');
    }
  };

  const handleCancel = () => {
    setShowUnauthorizedModal(false); // Close the modal without doing anything
  };

  return (
    <>
      <Toaster 
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          className: '',
          duration: 5000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: 'green',
              secondary: 'black',
            },
          },
        }}
      />
    
      <Router>
        <Routes />
      </Router>

      {/* <FamilyLawChat /> */}

      <UnauthorizedModal
        show={showUnauthorizedModal}
        handleClose={handleCloseModal}
        handleConfirm={handleConfirm}
        handleCancel={handleCancel}
      />
    </>
  );
}

export default App;
