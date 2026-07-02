import React, { useEffect, useRef, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import Layout from "../components/LayoutComponents/Layout";
import ProfilePic from "../assets/images/profile_pic.jpeg";
import axios from "../utils/axios";
import Spinner from 'react-bootstrap/Spinner';
import  "./profile.css";

import {
  getAllUserInfo,
  getCompanyInfo,
  getUserId,
  getUserProfileInfo,
} from "../utils/helpers";
import BreadCrumb from "../components/BreadCrumb";
import InputCustom from "../components/InputCustom";
import Switch from "@mui/material/Switch";
import ModalInputCenter from "../components/ModalInputCenter";
import ProfileNumberInput from "../components/Profile/ProfileNumberInput";
import "react-phone-number-input/style.css";
import PhoneInput from "react-phone-number-input";
import { Alert } from "react-bootstrap";
import {
  user2FAVerificationAction,
  userOPTMatchAction,
  userProfileInfoAction,
  userProfileInfoChangeAction,
} from "../actions/userActions";
import { useHistory } from "react-router-dom";
import { USER_PROFILE_INFO_CHANGE_EMPTY } from "../constants/userConstants";
import { uploadProfilePic } from "../utils/Apis/uploadProfilePhoto";
import CookiesParser from "../utils/cookieParser/Cookies";
import { AUTH_ROUTES } from "../routes/Routes.types";
import toast from "react-hot-toast";

import { userLogoutAction } from "../actions/userActions";

const ProfileEdit = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  let number1 = useRef(null);
  let number2 = useRef(null);
  let number3 = useRef(null);
  let number4 = useRef(null);

  const [profileErrors, setProfileErrors] = useState({
    firstName: "",
    lastName: "",
    oldPassword:"",
    newPassword:"",
    confirmPassword:""
  });

  const [isActive, setActive] = useState(false);
  const [loader , setLoader] = useState({
    updatePassword : false
  })

  const currentUserInfo = getAllUserInfo() || {};
  const currentProfileInfo = getUserProfileInfo() || {};
  const currentCompanyInfo = getCompanyInfo() || {};
  const currentDisplayName =
    currentUserInfo.username ||
    currentUserInfo.name ||
    currentUserInfo.email ||
    "";

  console.log('getUserProfileInfo',currentProfileInfo)

  const [profileInfo, setProfileInfo] = useState({
    profilePhoto: currentProfileInfo.profile_pic || currentUserInfo.profile_pic || "",
    firstName: currentUserInfo.first_name || currentDisplayName,
    lastName: currentUserInfo.last_name || "",
    username: currentDisplayName,
    email: currentUserInfo.email || "",
    street: currentCompanyInfo?.legaladdress?.Line1 ?? '',
    province:
      currentCompanyInfo?.legaladdress?.CountrySubDivisionCode ??
      currentUserInfo.province ??
      '',
    Country: currentCompanyInfo?.legaladdress?.Country ?? '',
    // location: getAllUserInfo().province,
    bio: currentUserInfo?.description ?? '',
    areInputDisabled: parseInt(currentUserInfo.TFA) ?? '',
    multiVerification: currentUserInfo?.TFA === 0 ? false : true,
    phone: currentUserInfo?.phone_number ?? '',
    verificationRequested: false,
    verificationDone: false,
    changePasswordRequest: false,
    otp: "",
    alert: "",
  });

  const [signature , setSignature] = useState(currentProfileInfo.signature ? 
    currentProfileInfo.signature : ProfilePic);


  const user2FAState = useSelector((state) => state.user2FAVerification);
  const userProfile = useSelector((state) => state.userProfileInfo);
  const userOPTState = useSelector((state) => state.userOPTMatch);
  const userProfileChange = useSelector((state) => state.userProfileInfoChange);
  const [changePassword, setChangePassword] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const onDeletePhone = (event) => {
    event.preventDefault();

    setProfileInfo((prev) => ({ ...prev, profilePhoto: "" }));
    setActive(false)
  };
  const toggleClass = () => {
    setActive(!isActive);
  };
  const editPhoto = (event) => {
    console.log("event", event.target.files[0]);
    if (event.target.files && event.target.files[0]) {
      const formData = new FormData();

      formData.append(
        "profile_pic",
        event.target.files[0],
        event.target.files[0].name
      );

      console.log("edit photo event", event.target);

      const data = {
        uid: getUserId(),
        photo: formData,
      };

      uploadProfilePic(data)
        .then((res) => {
          console.log("res", res);
          setProfileInfo((prev) => ({
            ...prev,
            profilePhoto: res.profileUrl.location,
          }));
        })
        .catch((err) => {
          console.log("err", err);
          toast.error(`Something went wrong ${err}`);
          alert("Error ", err);
        }).finally((res)=>{
          setActive(false)
        })
    }
  };

  const handleSignatureUpload = (event) => {
    console.log("Singature", event.target.files[0]);
    if (event.target.files && event.target.files[0]) {
      const formData = new FormData();

      formData.append(
        "signature",
        event.target.files[0],
        event.target.files[0].name
      );

      const data = {
        uid: getUserId(),
        photo: formData,
      };
       axios.post(`/signature/${data.uid}`, 
        data.photo
       ).then((res) => {
        let userProfileInfoAction = getUserProfileInfo();
        userProfileInfoAction.signature = res.data.data.body.profileUrl.location;
        CookiesParser.set("userProfile", userProfileInfoAction);
        
        setSignature(res.data.data.body.profileUrl.location);
       }).catch((err) => {
        toast.error('Something went wrong')
         console.log("err", err);
       })
     

     
    }
  }

  useEffect(() => {
    if (userProfileChange.response && !userProfileChange.loading) {
      dispatch({ type: USER_PROFILE_INFO_CHANGE_EMPTY });
      // history.push("/dashboard");
    }
  }, [userProfileChange]);

  useEffect(() => {
    console.log("user 2 fa state", user2FAState);
    if (user2FAState.response) {
      setProfileInfo({
        ...profileInfo,
        verificationRequested: true,
      });
    }
  }, [user2FAState]);

  useEffect(() => {
    dispatch(userProfileInfoAction());
  }, []);

  useEffect(() => {
    if (userProfile.response && !userProfile.loading) {
      const { first_name, TFA, last_name, email, description ,username} =
        userProfile.response;

      setProfileInfo({
        ...profileInfo,
        email: email,
        bio: description,
        lastName: last_name,
        firstName: first_name,
        verificationDone: TFA,
        username:username
      });
    }
  }, [userProfile]);

  useEffect(() => {
    console.log("user OPT match", userOPTState);

    if (userOPTState.response && !userOPTState.loading) {
      setProfileInfo({
        ...profileInfo,
        verificationDone: true,
        verificationRequested: false,
      });
    } else if (userOPTState.response === false) {
      setProfileInfo({
        ...profileInfo,
        alert: "OTP invalid!. Please enter a valid OTP.",
      });
    }
  }, [userOPTState]);

  const saveChanges = (e) => {
    e.preventDefault();
    const {
      verificationDone,
      email,
      bio,
      firstName,
      lastName,
      phone,
      profilePhoto,
      username
    } = profileInfo;
    const obj = {
      TFA: verificationDone,
      first_name: firstName,
      last_name: lastName,
      username:username,
      phone_number: phone,
      profile_pic: profilePhoto,
      email: email,
      description: bio,
      // username: getAllUserInfo().username,
    };

    if (!firstName) {
      setProfileErrors((prev) => ({
        ...prev,
        firstName: "First name cannot be empty",
      }));

     return; 
    }
    if (!lastName) {
      setProfileErrors((prev) => ({
        ...prev,
        lastName: "Last name cannot be empty",
      }));
     return; 

    }

    dispatch(userProfileInfoChangeAction(obj));

    // history.replace("/");
  };

  const updatePassword = async () => {
    // setProfileInfo({
    //   ...profileInfo,
    //   changePasswordRequest: false,
    // });

    if (changePassword.newPassword === changePassword.confirmNewPassword) {

    
      if (profileInfo.email && changePassword.oldPassword) {

        try {
          setLoader((prev)=>({
            ...prev , 
            updatePassword : true
          }))
          const res = await axios.post(`/updatePassword`, {
            oldPassword : changePassword.oldPassword , 
            newPassword : changePassword.newPassword,
            confirmPassword :changePassword.confirmNewPassword
          });

          if(res.status == 200){

            history.push(AUTH_ROUTES.LOGOUT)
            return ;


          }

        } catch (error) {
          console.log("error",error.response.data.message)
          if(error?.response?.status ==  400){
            setProfileErrors((prev)=>({
              ...prev,
              oldPassword : error.response.data.message
            }))
          }
        } finally {
          setLoader((prev)=>({
            ...prev , 
            updatePassword : false
          }))
        }


      }
    }else{

      setProfileErrors((prev)=>({
        ...prev,
        confirmPassword : "Password not matched"
      }))

    }
  };

  return (
    <Layout title="My Profile">
      {/* <BreadCrumb currentPage="Edit Profile" options={[{ option: "Profile", link: "/profile" }]}/> */}
      <div className="profilePage">
        <div className="row">
          <div className="col-md-8 offset-md-2">
            <form enctype="multipart/form-data">
              <div className="panel">
                <div className="pBody userProfilePage">
                  <div className="userPhoto">
                    <img
                      src={
                        profileInfo.profilePhoto
                          ? profileInfo.profilePhoto
                          : ProfilePic
                      }
                      alt="Unknown Person"
                    />
                    <div className="controls">
                      <a
                        href="javascript:void(0)"
                        className="profileControlBtn"
                        onClick={toggleClass}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M10.8571 19.9997H20M17.7143 7.42832L18.8571 8.57118M19.4286 4.57118C19.6537 4.79627 19.8324 5.06353 19.9542 5.35767C20.0761 5.65181 20.1388 5.96708 20.1388 6.28546C20.1388 6.60385 20.0761 6.91911 19.9542 7.21325C19.8324 7.5074 19.6537 7.77465 19.4286 7.99975L8.57143 18.8569L4 19.9997L5.14286 15.4923L16.0046 4.57575C16.4327 4.14554 17.0069 3.89205 17.6133 3.86558C18.2196 3.83912 18.8137 4.04162 19.2777 4.43289L19.4286 4.57118Z"
                            stroke="#171D34"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </a>
                      <div
                        className={
                          isActive ? "open controlsView" : "controlsView"
                        }
                      >
                        <span>
                          <input
                            type="file"
                            onChange={editPhoto}
                            accept="image/png, image/jpeg"
                            name="profile_pic"
                            placeholder="Edit Photo"
                          />
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 32 32"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            {" "}
                            <rect
                              width="32"
                              height="32"
                              rx="16"
                              fill="#73C3FD"
                            />{" "}
                            <path
                              d="M8 17V23C8 23.5304 8.21071 24.0391 8.58579 24.4142C8.96086 24.7893 9.46957 25 10 25H22C22.5304 25 23.0391 24.7893 23.4142 24.4142C23.7893 24.0391 24 23.5304 24 23V17M16 7V19M16 19L12.5 15.5M16 19L19.5 15.5"
                              stroke="white"
                              stroke-width="1.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />{" "}
                          </svg>{" "}
                          Import Image
                        </span>
                        <span onClick={(e) => onDeletePhone(e)}>
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 32 32"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            {" "}
                            <rect
                              width="32"
                              height="32"
                              rx="16"
                              fill="#73C3FD"
                            />{" "}
                            <path
                              d="M6 10H26M14 15V20M18 15V20M8 10H24L22.42 24.22C22.3658 24.7094 22.1331 25.1616 21.7663 25.49C21.3994 25.8184 20.9244 26 20.432 26H11.568C11.0756 26 10.6006 25.8184 10.2337 25.49C9.86693 25.1616 9.63416 24.7094 9.58 24.22L8 10ZM11.345 7.147C11.5068 6.80397 11.7627 6.514 12.083 6.31091C12.4033 6.10782 12.7747 6 13.154 6H18.846C19.2254 5.99981 19.5971 6.10755 19.9176 6.31064C20.2381 6.51374 20.4942 6.80381 20.656 7.147L22 10H10L11.345 7.147Z"
                              stroke="white"
                              stroke-width="1.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />{" "}
                          </svg>{" "}
                          Delete Image
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="userInfo">
                    <strong>
                      {profileInfo.firstName} {profileInfo.lastName}
                    </strong>
                    <span>{profileInfo.bio}</span>
                    <span>
                      {profileInfo.street}, {profileInfo.Country}
                    </span>
                  </div>
                  {/* <button className="btn btnPrimary ms-auto">Edit</button> */}
                </div>
              </div>
              <div className="panel">
                <div className="pHead">
                  <span className="h5">Personal Information</span>
                </div>
                <div className="pBody">
                  <div className="row">
                    <div className="col-md-6">
                      <InputCustom
                        label="First Name"
                        classNames={
                          profileErrors.firstName
                            ? "border_red form-control"
                            : "form-control"
                        }
                        handleChange={(e) => {
                          setProfileErrors((prev) => ({
                            ...prev,
                            firstName: "",
                          }));
                          setProfileInfo({
                            ...profileInfo,
                            firstName: e.target.value,
                          });
                        }}
                        type="text"
                        value={profileInfo.firstName}
                      />
                      {profileErrors.firstName && (
                        <span className="redText">
                          First name should not be empty
                        </span>
                      )}
                    </div>
                    <div className="col-md-6">
                      <InputCustom
                        label="Last Name"
                        classNames={
                          profileErrors.lastName
                            ? "border_red form-control"
                            : "form-control"
                        }
                        handleChange={(e) => {
                          setProfileErrors((prev) => ({
                            ...prev,
                            lastName: "",
                          }));
                          setProfileInfo({
                            ...profileInfo,
                            lastName: e.target.value,
                          });
                        }}
                        type="text"
                        value={profileInfo.lastName}
                      />
                      {profileErrors.lastName && (
                        <span className="redText">
                          Last name should not be empty
                        </span>
                      )}
                    </div>
                    <div className="col-md-6">
                      <div className="form-group mb-0">
                        <label>Job Title</label>
                        <input
                          required
                          type="text"
                          label="Username"
                          className="form-control"
                          name="Username"
                          id="Username"
                          value={profileInfo.bio}
                          onChange={(e) => {
                            const text = e.target.value;
                            setProfileInfo({ ...profileInfo, bio: text });
                          }}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group mb-0">
                        <label>Display Name</label>
                        <input
                          required
                          type="text"
                          label="Displayname"
                          className="form-control"
                          name="username"
                          id="Username"
                          value={profileInfo.username}
                          onChange={(e) => {
                            const text = e.target.value;
                            console.log("checkusername",text)
                            setProfileInfo({ ...profileInfo, username: text });
                          }}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">

                      
                      <div className="form-group mt-2">
                        <label>Signature image</label>
                        {signature && <img 
                         src={signature} 
                        alt="signature" style={{width:"100px"}}
                        />}
                        <br/>
                        <input
                            type="file"
                            onChange={handleSignatureUpload}
                            accept="image/png, image/jpeg"
                            name="signature_pic"
                            placeholder="Edit Photo"
                            id="signature_pic"
                            className="inputClass"
                          />
                      </div>
                    </div>

                  </div>
                </div>
              </div>
              <div className="panel">
                <div className="pHead">
                  <span className="h5">Address</span>
                </div>
                <div className="pBody">
                  <div className="row">
                  <div className="col-md-6">
                    <label>Street</label>

                    <div className="form-group">

                      <input
                        required
                        type="text"
                        id="outlined-basic"
                        label="Street"
                        className="form-control"
                        value={profileInfo.street}
                        name="street"
                        onChange={(e) => {
                          const text = e.target.value;
                          setProfileInfo({ ...profileInfo, street: text });
                        }}
                      />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Province</label>
                        <input
                          required
                          type="text"
                          id="outlined-basic"
                          label="Registered Address"
                          variant="outlined"
                          className="form-control"
                          value={profileInfo.province}
                          name="province"
                          onChange={(e) => {
                            const text = e.target.value;
                            setProfileInfo({ ...profileInfo, province: text });
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group mb-0">
                        <label>Country</label>
                        <input
                          required
                          type="text"
                          id="outlined-basic"
                          label="Registered Address"
                          variant="outlined"
                          className="form-control"
                          name="Country"
                          value={profileInfo.Country}
                          onChange={(e) => {
                            const text = e.target.value;
                            setProfileInfo({ ...profileInfo, Country: text });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="pHead">
                  <span className="h5">Security</span>
                </div>
                <div className="pBody">
                  <div className="row">
                    <div className="col-md-6">
                      <InputCustom
                        label="Email"
                        disabled={true}
                        handleChange={(e) =>
                          setProfileInfo({
                            ...profileInfo,
                            email: e.target.value,
                          })
                        }
                        type="text"
                        value={profileInfo.email}
                      />
                    </div>
                    <div className="col-md-6">
                      <div className="form-group password">
                        <label>Password</label>
                        <input
                          className="form-control"
                          readOnly
                          placeholder="********"
                        ></input>
                        <button
                          className="change"
                          onClick={(e) => {
                            e.preventDefault();
                            setProfileInfo({
                              ...profileInfo,
                              changePasswordRequest: true,
                            });
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M10.8571 19.9997H20M17.7143 7.42832L18.8571 8.57118M19.4286 4.57118C19.6537 4.79627 19.8324 5.06353 19.9542 5.35767C20.0761 5.65181 20.1388 5.96708 20.1388 6.28546C20.1388 6.60385 20.0761 6.91911 19.9542 7.21325C19.8324 7.5074 19.6537 7.77465 19.4286 7.99975L8.57143 18.8569L4 19.9997L5.14286 15.4923L16.0046 4.57575C16.4327 4.14554 17.0069 3.89205 17.6133 3.86558C18.2196 3.83912 18.8137 4.04162 19.2777 4.43289L19.4286 4.57118Z"
                              stroke="#171D34"
                              stroke-width="1.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
              {/* this part is commented as per client requirement will uncomment when work on MFA */}

                  {/* <label className="authentication">
                    Enable Multi Factor Authentication
                    <Switch
                      checked={profileInfo.multiVerification}
                      onClick={(e) => {
                        setProfileInfo({
                          ...profileInfo,
                          multiVerification: !profileInfo.multiVerification,
                        });
                      }}
                      inputProps={{ "aria-label": "Switch demo" }}
                    />
                  </label> */}
                  <div className="row">
                    {profileInfo.multiVerification && (
                      <>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Phone number</label>
                            <PhoneInput
                              defaultCountry="CA"
                              value={profileInfo.phone}
                              disabled={
                                profileInfo.verificationDone ||
                                profileInfo.areInputDisabled
                              }
                              placeholder="Enter Phone Number"
                              onChange={(e) => {
                                setProfileInfo({ ...profileInfo, phone: e });
                              }}
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <button
                            style={{ margin: "20px 0 0 0" }}
                            disabled={
                              profileInfo.verificationDone ||
                              profileInfo.areInputDisabled
                            }
                            type="button"
                            onClick={() => {
                              const obj = {
                                uid: getUserId(),
                                phone_number: profileInfo.phone,
                                two_factor_auth: "YES",
                              };
                              dispatch(user2FAVerificationAction(obj));
                            }}
                            className={`btn btnPrimary ${
                              (profileInfo.verificationDone ||
                                profileInfo.areInputDisabled) &&
                              "disabled"
                            }`}
                          >
                            Verify
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {profileInfo.verificationRequested && (
                <ModalInputCenter
                  show={profileInfo.verificationRequested}
                  changeShow={() => {
                    setProfileInfo({
                      ...profileInfo,
                      verificationRequested: false,
                    });
                  }}
                  action="Verify Code"
                  handleClick={() => {
                    const otp =
                      number1.current.value +
                      number2.current.value +
                      number3.current.value +
                      number4.current.value;

                    setProfileInfo({ ...profileInfo, otp });
                    const obj = {
                      authkey: user2FAState.response.authkey,
                      otp: otp,
                      type: "validate",
                    };

                    dispatch(userOPTMatchAction(obj));
                  }}
                >
                  <div className="text-center">
                    <p className="heading-4">Mobile number notification</p>
                    <p className="heading-5 fw-light" style={{ color: "gray" }}>
                      A verification code has been sent to your mobile number{" "}
                      {profileInfo.phone}
                    </p>

                    <div className="my-4">
                      <div className="heading-normal my-3">
                        Please enter code to verify your mobile number
                      </div>

                      <ProfileNumberInput ref={number1} />

                      <ProfileNumberInput ref={number2} />

                      <ProfileNumberInput ref={number3} />

                      <ProfileNumberInput ref={number4} />

                      <div className="heading-normal my-3">
                        Did not receive code?
                        <span
                          className="text-primary-color cursor_pointer"
                          onClick={(e) => {
                            console.log("resend message");
                            const obj = {
                              uid: getUserId(),
                              phone_number: profileInfo.phone,
                              two_factor_auth: "YES",
                            };

                            setProfileInfo({
                              ...profileInfo,
                              alert: "New OTP Sent!",
                            });
                            dispatch(user2FAVerificationAction(obj));
                          }}
                        >
                          {" "}
                          Resend SMS
                        </span>
                      </div>

                      {profileInfo.alert && (
                        <Alert className="heading-normal" variant="warning">
                          {profileInfo.alert}
                        </Alert>
                      )}
                    </div>
                  </div>
                </ModalInputCenter>
              )}
              {profileInfo.changePasswordRequest && (
                <ModalInputCenter
                  show={profileInfo.changePasswordRequest}
                  changeShow={() => {
                     setProfileInfo({
                       ...profileInfo,
                      changePasswordRequest: false,
                    });
                  }}
                  heading="Change Password"
                  handleClick={updatePassword}
                  action={loader.updatePassword ? <> <Spinner animation="border" size="sm" className='mx-1'/> Saving... </>  : "Save" }
                >
                  <InputCustom
                    handleChange={(e) => {

                      setChangePassword({
                        ...changePassword,
                        oldPassword: e.target.value,
                      })

                      setProfileErrors((prev)=>({
                        ...prev,
                        oldPassword : ""
                      }))
                    }
                    }
                    type="text"
                    value={changePassword.oldPassword}
                    label="Old Password"
                  />

                         {profileErrors.oldPassword && (
                        <span className="text-danger">
                         {profileErrors.oldPassword}
                        </span>
                      )}

                  <InputCustom
                    handleChange={(e) =>
                      setChangePassword({
                        ...changePassword,
                        newPassword: e.target.value,
                      })
                    }
                    type="text"
                    value={changePassword.newPassword}
                    label="New Password"
                  />{" "}
                  <InputCustom
                    handleChange={(e) => {

                      setChangePassword({
                        ...changePassword,
                        confirmNewPassword: e.target.value,
                      })

                      setProfileErrors((prev)=>({
                        ...prev,
                        confirmPassword : ""
                      }))
                    }

                     
                    }
                    type="text"
                    value={changePassword.confirmNewPassword}
                    label="Confirm Password"
                  />

                   {profileErrors.confirmPassword && (
                        <span className="text-danger">
                         {profileErrors.confirmPassword}
                        </span>
                      )}

                </ModalInputCenter>
              )}
              <button className="btn btnPrimary ms-auto" onClick={saveChanges}>
                Save
              </button>
              <div className="pb-4"></div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfileEdit;
