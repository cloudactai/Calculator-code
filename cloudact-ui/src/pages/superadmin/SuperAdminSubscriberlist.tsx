import React from "react";
import Layout from "../../components/LayoutComponents/Layout";
import axios from "../../utils/axios";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import Loader from "../../components/Loader";
import { AUTH_ROUTES } from "../../routes/Routes.types";
import { useHistory } from "react-router";
import {
  Modal,
  Button,
  Container,
  Row,
  Col,
  Card,
  Form,
} from "react-bootstrap";
import toast from "react-hot-toast";
import { MdOutlinePublishedWithChanges } from "react-icons/md";
import {
  RootState,
  ModalData,
  User,
  filterElement,
  ModalConfig,
} from "./superadmininterface";
import { getSvg } from "./getSuperAdminSvgs";

const permissionConfigs = [
  {
    label: "Dashboard",
    name: "auth_dashboard",
  },
  {
    label: "Tasks",
    name: "auth_tasks",
    children: [
      { label: "Monthly Checklists", name: "auth_monthly_checklists" },
      { label: "Compliance Forms", name: "auth_compliance_forms" },
      { label: "Billing", name: "auth_compliance_billing" },
      { label: "Trust Deposit Slip", name: "auth_trust_deposit_slip" },
      { label: "Bank reconciliation workflow", name: "auth_workflow" },
    ],
  },
  {
    label: "Reports",
    name: "auth_reports",
    children: [
      { label: "Report History", name: "auth_report_history" },
      { label: "Operational Report", name: "auth_operational_report" },
      { label: "Law Society reports", name: "auth_run_report" },
    ],
  },
  {
    label: "Law Tools",
    name: "auth_law_tools",
    children: [
      { label: "Matters", name: "auth_matters" },
      { label: "Support Calculator", name: "auth_calculator" },
      { label: "Forms", name: "auth_forms" },
    ],
  },
  {
    label: "Archive",
    name: "auth_archive",
  },
  {
    label: "Settings",
    name: "auth_settings",
  },
];

const SuperAdminSubscriberlist = () => {
  const [subscriberinfo, setSubscriberinfo] = React.useState({
    users: [],
    filteredUsers: [],
  });

  const history = useHistory();

  const [modalConfig, setModalConfig] = React.useState<{
    visible: boolean;
    data: ModalData | null;
  }>({
    visible: false,
    data: null,
  });
  const [sortedBy, setSortedBy] = React.useState("All");

  const toggleModal = (data = null) => {
    setModalConfig({ visible: !!data, data });
  };

  const [loader, setLoader] = React.useState(false);

  const { userInfo } = useSelector((state: RootState) => state.userLogin);

  const fetchSubscriber = () => {
    setLoader(true);
    axios
      .get("/listing/unsubscriber/subscriber/user")
      .then((response) => {
        setSubscriberinfo((prev) => ({
          ...prev,
          users: response.data.body,
          filteredUsers: response.data.body,
        }));

        setLoader(false);

        console.log("checkResOFlist", response);
      })
      .catch((error) => {
        setLoader(false);

        console.log("error", error);
      });
  };

  const buttonStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    padding: "8px 12px",
    fontSize: "16px",
    fontWeight: "bold",
    borderRadius: "20px",
    border: "none",
    cursor: "pointer",
  };

  const deleteButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#FDEDEC",
    color: "#E74C3C",
  };

  const actionsButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#f6bd3d",
    color: "#171d34",
  };

  React.useEffect(() => {
    fetchSubscriber();
  }, []);

  const handleDelete = (sid: number, short_firmname: string) => {
    const deletedUsers = subscriberinfo.users.filter(
      (element) => element.id !== sid
    );

    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#73c3fd",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(
            `/unsubscriber/user/${sid}/cloudact-${short_firmname.toLowerCase()}`
          )
          .then((res) => {
            Swal.fire({
              title: `Deleted! `,
              text: "Your file has been deleted.",
              icon: "success",
              confirmButtonColor: "#73c3fd",
            });

            setSubscriberinfo((prev) => ({
              ...prev,
              users: deletedUsers,
              filteredUsers: deletedUsers,
            }));

            console.log("deleted", res);
          })
          .catch((err) => {
            console.log("catche", err);
          });
      }
    });
  };

  const handleEditUserPermissions = () => {
    // Build the data object dynamically based on permissionConfigs
    const data: any = {
      sid: modalConfig?.data?.id,
    };

    permissionConfigs.forEach((config) => {
      data[`${config.name}`] = modalConfig?.data?.[config.name] ?? 0;
      if (config.children) {
        config.children.forEach((child) => {
          data[`${child.name}`] = modalConfig?.data?.[child.name] ?? 0;
        });
      }
    });

    console.log("checkDataForCal0", data);

    axios
      .patch(`/update/subscriber/key`, data)
      .then((response) => {
        toast.success("Updated successfully");
        console.log("checkResUpdatkeys", response);
      })
      .catch((error) => {
        console.log("error", error);
      });
  };

  const handleChangeEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    // Helper: find if it's a parent with children
    const parentConfig = permissionConfigs.find(
      (config) => config.name === name
    );
    // Helper: find if it's a child and who the parent is
    const parentOfChild = permissionConfigs.find((config) =>
      config.children?.some((child) => child.name === name)
    );
  
    setModalConfig((prev) => {
      let updatedData = {
        ...prev.data,
        [name]: checked ? 1 : 0,
      };

      // ✅ If a parent is turned OFF, turn off all its children
      if (parentConfig && parentConfig.children && !checked) {
        parentConfig.children.forEach((child) => {
          updatedData[`${child.name}`] = 0;
        });
      }

      
      if (parentConfig && parentConfig.children && checked) {
        parentConfig.children.forEach((child) => {
          updatedData[`${child.name}`] = 1;
        });
      }

     
      if (parentOfChild && checked) {
        updatedData[`${parentOfChild.name}`] = 1;
      }

      return {
        ...prev,
        data: updatedData,
      };
    });

    // Update user list as well
    const updatedUsers = subscriberinfo.users.map((user) => {
      if (user.id === modalConfig?.data?.id) {
        let updatedUser = {
          ...user,
          [name]: checked ? 1 : 0,
        };

        if (parentConfig && parentConfig.children && !checked) {
          parentConfig.children.forEach((child) => {
            updatedUser[`${child.name}`] = 0;
          });
        }

        if (parentConfig && parentConfig.children && checked) {
          parentConfig.children.forEach((child) => {
            updatedUser[`${child.name}`] = 1;
          });
        }

        if (parentOfChild && checked) {
          updatedUser[`${parentOfChild.name}`] = 1;
        }

        return updatedUser;
      }
      return user;
    });

    setSubscriberinfo((prev) => ({
      ...prev,
      users: updatedUsers,
      filteredUsers: updatedUsers,
    }));
  };

  const onSortEvent = (e: any) => {
    let { value } = e.target;
    setSortedBy(value);
    let filteredData;

    switch (value) {
      case "All":
        filteredData = subscriberinfo.users;
        break;
      case "Active":
        filteredData = subscriberinfo.users.filter(
          (element: filterElement) => element.status === "Active"
        );
        break;
      case "Inactive":
        filteredData = subscriberinfo.users.filter(
          (element: filterElement) => element.status === "Inactive"
        );
        break;

      default:
        filteredData = subscriberinfo.users;
        break;
    }
    setSubscriberinfo((prev) => ({
      ...prev,
      filteredUsers: filteredData,
    }));
  };

  const headings = [
    "Name",
    "Short firm name",
    "Province",
    "Region",
    "Total Connected User",
    "Status",
    "Actions",
  ];

  return (
    <Layout title={`Welcome ${userInfo ? userInfo.username : "Guest"}`}>
      <Loader isLoading={loader} />

      {modalConfig.visible && (
        <Modal
          centered
          size="md"
          show={modalConfig.visible}
          onHide={() => toggleModal()}
        >
          <Modal.Header closeButton>
            <Modal.Title>Edit Subscriber Permissions</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Container>
              {/* <Row className="mb-3 text-center">
              <Col>
                <h5 className="fw-bold">Editing permissions for {modalConfig?.data?.short_firmname || "user"}</h5>
              </Col>
            </Row> */}

              <Row>
                {permissionConfigs.map(
                  ({ label, name, readOnly, disabled, children }) => (
                    <Col xs={12} key={`${name}`}>
                      <Card className="p-3 mb-3 shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-bold">{label}</span>
                            <Form.Check
                              type="switch"
                              className="align-self-center"
                              style={{
                                marginTop: "-24px",
                              }}
                              id={`${name}-switch`}
                              name={`${name}`}
                              onChange={(e) => handleChangeEdit(e)}
                              checked={!!modalConfig?.data?.[`${name}`]}
                              readOnly={readOnly}
                              disabled={disabled}
                            />
                          </div>

                          {children && (
                            <div style={{ paddingLeft: "1.5rem" }}>
                              {children.map((child) => (
                                <div
                                  className="d-flex justify-content-between align-items-center mb-2"
                                  key={child.name}
                                >
                                  <Card.Text className="mb-0">
                                    {child.label}
                                  </Card.Text>
                                  <Form.Check
                                    type="switch"
                                    id={`${child.name}-switch`}
                                    className="align-self-center"
                                    style={{
                                      marginTop: "-24px",
                                      paddingRight: "36px",
                                    }}
                                    name={`${child.name}`}
                                    onChange={(e) => handleChangeEdit(e)}
                                    checked={!!modalConfig?.data?.[`${child.name}`]}
                                    readOnly={child.readOnly}
                                    disabled={child.disabled}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  )
                )}
              </Row>
            </Container>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => toggleModal()}
              style={{
                color: "black",
                background: "white",
                border: "1px solid grey",
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              style={{
                background: "#73c3fd",
                border: "none",
                color: "#333333",
              }}
              onClick={handleEditUserPermissions}
            >
              Apply
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      <div className="panel" style={{ backgroundColor: "#F5F9FF" }}>
        <div className="pHead">
          <span className="h5">
            {getSvg("subscriberAvatar")}
            Subscribers
          </span>
          <div className="control">
            <select
              className="form-select rounded-pill"
              aria-label="Default select example"
              onChange={(e) => {
                onSortEvent(e);
              }}
              value={sortedBy}
            >
              <option value="All" selected>
                All
              </option>
              <option value="Active">Active</option>
              <option value="Inactive">In Active</option>
            </select>

            <button
              className="btn btnPrimary"
              type="button"
              onClick={() => {
                history.push(AUTH_ROUTES.SUPERADMINDB);
              }}
            >
              Home
            </button>
          </div>
        </div>
        <div className="pBody pb-0">
          <div className="tableOuter">
            {subscriberinfo.filteredUsers.length > 0 ? (
              <table className="table customGrid">
                <thead>
                  <tr>
                    {headings.map((e, index) => {
                      return <th key={index}>{e}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {subscriberinfo.filteredUsers.map((e: User, key: number) => {
                    return (
                      <>
                        <tr className="highlight_blue">
                          <td className={"tdCheckBox"}>
                            <span>{e.display_firmname}</span>
                          </td>
                          <td>
                            <span>{e?.short_firmname}</span>
                          </td>

                          <td>
                            <span>{e?.province}</span>
                          </td>

                          <td>
                            <span>{e?.region}</span>
                          </td>

                          <td>
                            <span>{e.totalConnectedUsers}</span>
                          </td>
                          <td>
                            <span>
                              {e.status == "Active" ? (
                                <span
                                  className="active"
                                  style={{ marginRight: "8px" }}
                                >
                                  <svg
                                    width="8"
                                    height="9"
                                    viewBox="0 0 8 9"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <circle
                                      cx="4"
                                      cy="4.5"
                                      r="4"
                                      fill="#4CB528"
                                    />
                                  </svg>
                                </span>
                              ) : (
                                <span
                                  className="inactive"
                                  style={{ marginRight: "8px" }}
                                >
                                  <svg
                                    width="8"
                                    height="9"
                                    viewBox="0 0 8 9"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <circle
                                      cx="4"
                                      cy="4.5"
                                      r="4"
                                      fill="#FB554A"
                                    />
                                  </svg>
                                </span>
                              )}
                              {e.status == "Active" ? "Active" : "In Active"}
                            </span>
                          </td>

                          <td>
                            <div
                              className="btnGroup"
                              style={{ display: "flex", gap: "10px" }}
                            >
                              {/* Delete button */}
                              <button
                                onClick={() =>
                                  handleDelete(e.id, e.short_firmname)
                                }
                                style={deleteButtonStyle}
                              >
                                <i className="fa-solid fa-trash"></i>
                                <span>Delete</span>
                              </button>

                              {/* Actions button */}
                              <button
                                onClick={() => toggleModal(e)}
                                style={actionsButtonStyle}
                              >
                                <MdOutlinePublishedWithChanges size={20} />
                                <span>Actions</span>
                              </button>
                            </div>
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
        <span className="moreBtn">
          <svg
            width="16"
            height="10"
            viewBox="0 0 16 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {" "}
            <path
              d="M2.5625 1.625C2.5625 1.81042 2.50752 1.99168 2.4045 2.14585C2.30149 2.30002 2.15507 2.42018 1.98377 2.49114C1.81246 2.56209 1.62396 2.58066 1.4421 2.54449C1.26025 2.50831 1.0932 2.41902 0.962088 2.28791C0.830976 2.1568 0.741688 1.98975 0.705514 1.8079C0.669341 1.62604 0.687906 1.43754 0.758863 1.26623C0.829821 1.09493 0.949982 0.948511 1.10415 0.845498C1.25832 0.742484 1.43958 0.6875 1.625 0.6875C1.87364 0.6875 2.1121 0.786272 2.28791 0.962088C2.46373 1.1379 2.5625 1.37636 2.5625 1.625ZM8 0.6875C7.81458 0.6875 7.63332 0.742484 7.47915 0.845498C7.32498 0.948511 7.20482 1.09493 7.13386 1.26623C7.06291 1.43754 7.04434 1.62604 7.08051 1.8079C7.11669 1.98975 7.20598 2.1568 7.33709 2.28791C7.4682 2.41902 7.63525 2.50831 7.8171 2.54449C7.99896 2.58066 8.18746 2.56209 8.35877 2.49114C8.53007 2.42018 8.67649 2.30002 8.7795 2.14585C8.88252 1.99168 8.9375 1.81042 8.9375 1.625C8.9375 1.37636 8.83873 1.1379 8.66291 0.962088C8.4871 0.786272 8.24864 0.6875 8 0.6875ZM14.375 2.5625C14.5604 2.5625 14.7417 2.50752 14.8958 2.4045C15.05 2.30149 15.1702 2.15507 15.2411 1.98377C15.3121 1.81246 15.3307 1.62396 15.2945 1.4421C15.2583 1.26025 15.169 1.0932 15.0379 0.962088C14.9068 0.830976 14.7398 0.741688 14.5579 0.705514C14.376 0.66934 14.1875 0.687906 14.0162 0.758864C13.8449 0.829821 13.6985 0.949982 13.5955 1.10415C13.4925 1.25832 13.4375 1.43958 13.4375 1.625C13.4375 1.87364 13.5363 2.1121 13.7121 2.28791C13.8879 2.46373 14.1264 2.5625 14.375 2.5625ZM1.625 7.4375C1.43958 7.4375 1.25832 7.49248 1.10415 7.5955C0.949982 7.69851 0.829821 7.84493 0.758863 8.01624C0.687906 8.18754 0.669341 8.37604 0.705514 8.5579C0.741688 8.73975 0.830976 8.9068 0.962088 9.03791C1.0932 9.16903 1.26025 9.25831 1.4421 9.29449C1.62396 9.33066 1.81246 9.3121 1.98377 9.24114C2.15507 9.17018 2.30149 9.05002 2.4045 8.89585C2.50752 8.74168 2.5625 8.56042 2.5625 8.375C2.5625 8.12636 2.46373 7.8879 2.28791 7.71209C2.1121 7.53627 1.87364 7.4375 1.625 7.4375ZM8 7.4375C7.81458 7.4375 7.63332 7.49248 7.47915 7.5955C7.32498 7.69851 7.20482 7.84493 7.13386 8.01624C7.06291 8.18754 7.04434 8.37604 7.08051 8.5579C7.11669 8.73975 7.20598 8.9068 7.33709 9.03791C7.4682 9.16903 7.63525 9.25831 7.8171 9.29449C7.99896 9.33066 8.18746 9.3121 8.35877 9.24114C8.53007 9.17018 8.67649 9.05002 8.7795 8.89585C8.88252 8.74168 8.9375 8.56042 8.9375 8.375C8.9375 8.12636 8.83873 7.8879 8.66291 7.71209C8.4871 7.53627 8.24864 7.4375 8 7.4375ZM14.375 7.4375C14.1896 7.4375 14.0083 7.49248 13.8542 7.5955C13.7 7.69851 13.5798 7.84493 13.5089 8.01624C13.4379 8.18754 13.4193 8.37604 13.4555 8.5579C13.4917 8.73975 13.581 8.9068 13.7121 9.03791C13.8432 9.16903 14.0102 9.25831 14.1921 9.29449C14.374 9.33066 14.5625 9.3121 14.7338 9.24114C14.9051 9.17018 15.0515 9.05002 15.1545 8.89585C15.2575 8.74168 15.3125 8.56042 15.3125 8.375C15.3125 8.12636 15.2137 7.8879 15.0379 7.71209C14.8621 7.53627 14.6236 7.4375 14.375 7.4375Z"
              fill="#171D34"
            />{" "}
          </svg>
        </span>
      </div>
    </Layout>
  );
};

export default SuperAdminSubscriberlist;
