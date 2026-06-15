import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Routes from './routes/Routes.jsx';
import 'react-datetime/css/react-datetime.css'; 
import { Toaster } from 'react-hot-toast'; 
import UnauthorizedModal from './components/UnauthorizedModal'; // Adjust path as needed
import axios from '../src/utils/axios'; // Import axios to make API calls
import Cookies from 'js-cookie';
import FamilyLawChat, { hasSession } from './components/FamilyLawChat/FamilyLawChat';
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
    try {
      cookies_name.forEach(cookie => Cookies.remove(cookie, { path: '/' }));
      localStorage.clear();
      const response = await axios.post('/logout');
      
      if (response.data && response.data.status === 'success') {
        console.log('Logout successful');
        window.location.replace('/signIn'); 
      } else {
        console.error('Logout failed:', response.data.message);
      }
    } catch (error) {
      console.error('Error during logout request:', error);
    } finally {
      handleCloseModal(); 
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

      {hasSession() && <FamilyLawChat />}

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
