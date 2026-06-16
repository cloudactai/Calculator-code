import React from "react";
import Layout from "../components/LayoutComponents/Layout";

const TasksPage = ({ currentUserRole }) => {
  // const history = useHistory();
  // const [pageNumber, setPageNumber] = useState(1);
  // const [activeTabNumber, setActiveTabNumber] = useState(0);
  // const [loaded, setLoaded] = useState(false);

  // const [allTasks, setAllTasks] = useState({});
  // const [notStarted, setNotStarted] = useState([]);
  // const [inProgress, setInProgress] = useState([]);
  // const [completedTasks, setCompletedTasks] = useState([]);
  // const [filteredTaskList, setFilteredTaskList] = useState([]);
  // const [filterTasks, setFilterTasks] = useState({
  //   year: null,
  //   month: new Date(),
  // });

  // const [reportsPerPage, setReportsPerPage] = useState(15);
  // const [showFormToDownload, setShowFormToDownload] = useState({
  //   show: false,
  //   type: "trust",
  // });
  // const [allFormDetailsTrust, setAllFormDetailsTrust] = useState({
  //   form1Data: {},
  //   taskStatus: {},
  //   dateMonth: "",
  // });
  // const [allFormDetailsGeneral, setAllFormDetailsGeneral] = useState({
  //   form2Data: {},
  //   taskStatus: {},
  //   dateMonth: "",
  // });

  // const [allFormDetailsCard, setAllFormDetailsCard] = useState({
  //   form3Data: {},
  //   taskStatus: {},
  //   dateMonth: "",
  // });
  // let printComponent = useRef(null);

  // useEffect(() => {
  //   axios
  //     .get(
  //       `/task/list/${getCurrentUserFromCookies().role
  //       }/${getUserId()}/${getUserSID()}?page=${pageNumber}`
  //     )
  //     .then((res) => {
  //       const {
  //         data: {
  //           data: { body },
  //         },
  //       } = res;
  //       console.log("body", body);
  //       setAllTasks(body);

  //       const InProgressTasksFilter = body.data.filter(
  //         (e) => !e.task_preparer_signoff || !e.task_approverer_signoff
  //       );

  //       const notStartedTasksFilter = body.data.filter((e) => !e.task_preparer_signoff && !e.task_approverer_signoff)

  //       const completedTasksFilter = body.data.filter(
  //         (e) => e.task_approverer_signoff === 1
  //       );

  //       setNotStarted(notStartedTasksFilter);
  //       setInProgress(InProgressTasksFilter);
  //       setCompletedTasks(completedTasksFilter);
  //       setFilteredTaskList(completedTasksFilter);
  //       setLoaded(true);
  //     })
  //     .catch((err) => {
  //       console.log("err", err);
  //       setLoaded(true);
  //     });
  // }, [pageNumber, currentUserRole]);

  // const handlePrint = (e) => {
  //   const { task_month, task_type } = e;
  //   console.log("print component", printComponent);
  //   const task_form_download = document.querySelector("#task_form_download");
  //   console.log("task_form_download", task_form_download);

  //   const settings = {
  //     filename: `${task_type.replaceAll(" ", "_")}_${task_month}`,
  //   };

  //   html2pdf().set(settings).from(task_form_download).save();
  // };

  return (
    <Layout title="Tasks">
      {/* {!loaded && (
        <div className="fullScreen_light heading-5 text-black d-flex flex-column justify-content-center align-items-center">
          <ClipLoader color={"black"} loading={!loaded} size={100} />
          Loading...
        </div>
      )}

      <Container className="pt-3">
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="heading-2 mx-4">
            All Tasks
          </h2>

          <Link to="/tasks/create">
            <button className="btn_primary_colored py-3 px-5">
              Add Task
            </button>
          </Link>
        </div>

        <Tabs
          activeTabNumber={activeTabNumber}
          changeTabNumber={(e) => setActiveTabNumber(e)}
        >
          <Row className="my-3">
            <Col>
              <table className="w-100">
                <thead className="w-100 heading_row">
                  <tr>
                    {["Task", "Client / Period", "Status"].map(
                      (e, index) => {
                        return (
                          <th
                            key={index}
                            style={{
                              textAlign: "left",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {e}
                          </th>
                        );
                      }
                    )}
                  </tr>
                </thead>
                <tbody className="w-100">
                  {allTasks.data?.map((e, index) => {
                    return (
                      <>
                        {e.task_version === 1 && (
                          <EachTask
                            e={e}
                            index={index}
                            hasChild={false}
                            alignCenter={false}
                          />
                        )}

                        {e.task_version > 1 && (
                          <TasksParent
                            e={e}
                            index={index}
                            hasChild={true}
                            alignCenter={false}
                          />
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
              {allTasks.data?.length > 15 && (
                <div className="d-flex justify-content-end mx-5 mt-4 px-5">
                  <div>
                    <div className="heading-5 mx-4">
                      Rows per page: {reportsPerPage}
                    </div>
                  </div>
                  <div className="d-flex">
                    <div className="heading-5">
                      {reportsPerPage * (pageNumber - 1) + 1} -{" "}
                      {reportsPerPage * pageNumber}
                    </div>
                    <div className="heading-5 d-flex">
                      <span
                        className="mx-5 cursor_pointer"
                        onClick={() =>
                          pageNumber > 1
                            ? setPageNumber(pageNumber - 1)
                            : null
                        }
                      >
                        <img src={Pagination} alt="arrowLeft" />
                      </span>
                      <span
                        className="cursor_pointer"
                        onClick={() =>
                          allTasks.data?.length > 15
                            ? setPageNumber(pageNumber + 1)
                            : null
                        }
                      >
                        <img
                          src={Pagination}
                          style={{ transform: "rotate(180deg)" }}
                          alt="arrowRight"
                        />
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {allTasks.data?.length === 0 && (
                <div>
                  {" "}
                  <p className="heading-6 mt-3 text-center">
                    No Tasks Yet
                  </p>{" "}
                </div>
              )}
            </Col>
          </Row>

          <Row className="my-3">
            <Col>
              <table className="w-100">
                <thead className="w-100 heading_row">
                  <tr>
                    {["Task", "Client / Period", "Status"].map(
                      (e, index) => {
                        return (
                          <th
                            key={index}
                            style={{
                              textAlign: "left",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {e}
                          </th>
                        );
                      }
                    )}
                  </tr>
                </thead>
                <tbody className="w-100">
                  {notStarted?.map((e, index) => {
                    return (
                      <>
                        {e.task_version === 1 && (
                          <EachTask
                            e={e}
                            index={index}
                            hasChild={false}
                            alignCenter={false}
                          />
                        )}

                        {e.task_version > 1 && (
                          <TasksParent
                            e={e}
                            index={index}
                            hasChild={true}
                            alignCenter={false}
                          />
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
              {notStarted.length > 15 && (
                <div className="d-flex justify-content-end mx-5 mt-4 px-5">
                  <div>
                    <div className="heading-5 mx-4">
                      Rows per page: {reportsPerPage}
                    </div>
                  </div>
                  <div className="d-flex">
                    <div className="heading-5">
                      {reportsPerPage * (pageNumber - 1) + 1} -{" "}
                      {reportsPerPage * pageNumber}
                    </div>
                    <div className="heading-5 d-flex">
                      <span
                        className="mx-5 cursor_pointer"
                        onClick={() =>
                          pageNumber > 1
                            ? setPageNumber(pageNumber - 1)
                            : null
                        }
                      >
                        <img src={Pagination} alt="arrowLeft" />
                      </span>
                      <span
                        className="cursor_pointer"
                        onClick={() =>
                          notStarted.length > 15
                            ? setPageNumber(pageNumber + 1)
                            : null
                        }
                      >
                        <img
                          src={Pagination}
                          style={{ transform: "rotate(180deg)" }}
                          alt="arrowRight"
                        />
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {notStarted.length === 0 && (
                <div>
                  {" "}
                  <p className="heading-6 mt-3 text-center">
                    No Tasks Yet
                  </p>{" "}
                </div>
              )}
            </Col>
          </Row>

          <Row>
            <Col>
              <table className="w-100">
                <thead className="w-100 heading_row">
                  <tr>
                    {["Task", "Client / Period", "Status"].map(
                      (e, index) => {
                        return (
                          <th
                            key={index}
                            style={{
                              textAlign: "left",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {e}
                          </th>
                        );
                      }
                    )}
                  </tr>
                </thead>
                <tbody className="w-100">
                  {inProgress?.map((e, index) => {
                    return (
                      <>
                        {e.task_version === 1 && (
                          <EachTask
                            e={e}
                            index={index}
                            hasChild={false}
                            alignCenter={false}
                          />
                        )}

                        {e.task_version > 1 && (
                          <TasksParent
                            e={e}
                            index={index}
                            hasChild={true}
                            alignCenter={false}
                          />
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
              {inProgress.length > 15 && (
                <div className="d-flex justify-content-end mx-5 mt-4 px-5">
                  <div>
                    <div className="heading-5 mx-4">
                      Rows per page: {reportsPerPage}
                    </div>
                  </div>
                  <div className="d-flex">
                    <div className="heading-5">
                      {reportsPerPage * (pageNumber - 1) + 1} -{" "}
                      {reportsPerPage * pageNumber}
                    </div>
                    <div className="heading-5 d-flex">
                      <span
                        className="mx-5 cursor_pointer"
                        onClick={() =>
                          pageNumber > 1
                            ? setPageNumber(pageNumber - 1)
                            : null
                        }
                      >
                        <img src={Pagination} alt="arrowLeft" />
                      </span>
                      <span
                        className="cursor_pointer"
                        onClick={() =>
                          inProgress.length > 15
                            ? setPageNumber(pageNumber + 1)
                            : null
                        }
                      >
                        <img
                          src={Pagination}
                          style={{ transform: "rotate(180deg)" }}
                          alt="arrowRight"
                        />
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {inProgress.length === 0 && (
                <div>
                  {" "}
                  <p className="heading-6 mt-3 text-center">
                    No Tasks Yet
                  </p>{" "}
                </div>
              )}
            </Col>


          </Row>


          <Row className="my-3">
            <Col>
              <div className="mb-4">
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    InputProps={{ style: { fontSize: 15 } }}
                    views={["year", "month"]}
                    label="Year and Month"
                    value={filterTasks.year}
                    onChange={(newValue) => {
                      console.log("new value ", newValue);
                      const date = moment(newValue).format("MMMM YYYY");
                      console.log("date", date);

                      const filteringTasks = completedTasks.filter((e) => {
                        console.log("each task", e);
                        console.log("date", date === e.task_month);
                        if (e.task_month === date) {
                          return e;
                        }
                        return null;
                      });

                      setFilteredTaskList(filteringTasks);

                      setFilterTasks({ ...filterTasks, year: newValue });
                    }}
                    renderInput={(params) => (
                      <TextField
                        InputLabelProps={{
                          style: {
                            fontSize: 15,
                            top: "-5px",
                          },
                        }}
                        {...params}
                        helperText={null}
                      />
                    )}
                  />
                </LocalizationProvider>
              </div>

              <table className="w-100">
                <thead className="w-100 heading_row">
                  <tr>
                    {[
                      "Task",
                      "Client / Period",
                      "Status",
                    ].map((e, index) => {
                      return (
                        <th
                          key={index}
                          style={{ textAlign: "left", whiteSpace: "nowrap" }}
                        >
                          {e}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="w-100">
                  {filteredTaskList.map((e, index) => {
                    return (
                      <tr key={index} style={{ textDecoration: "underline" }}>
                        <td
                          style={{
                            whiteSpace: "nowrap",
                            textAlign: "left",
                            textDecoration: "underline",
                            padding: "1rem 0 !important",
                          }}
                        >
                          <Link
                            className="d-inline-block w-100"
                            style={{ textTransform: "uppercase" }}
                            to={{
                              pathname: e.isComplianceForm === 1 ? `/compliance/form` : `/tasks/form`,
                              state: e,
                              search: `step=${determineStep(
                                e.task_type
                              )}&form=1`,
                            }}
                            onClick={() => {
                              Cookies.set("checklistId", JSON.stringify(e));
                            }}
                          >
                            {nameOfChecklist(e.task_type)}

                          </Link>
                        </td>
                        <td
                          style={{
                            whiteSpace: "nowrap",
                            textAlign: "left",
                            textDecoration: "underline",
                            padding: "1rem 0 !important",
                          }}
                        >
                          <Link
                            className="d-inline-block w-100"
                            to={{
                              pathname: e.isComplianceForm === 1 ? `/compliance/form` : `/tasks/form`,
                              state: e,
                              search: `step=${determineStep(
                                e.task_type
                              )}&form=1`,
                            }}
                            onClick={() => {
                              Cookies.set("checklistId", JSON.stringify(e));
                            }}
                          >
                            {e.task_month}
                          </Link>
                        </td>

                        <td
                          style={{
                            whiteSpace: "nowrap",
                            textAlign: "left",
                            textDecoration: "underline",
                            padding: "1rem 0 !important",
                          }}
                        >
                          <Link
                            className="d-inline-block w-100"
                            to={{
                              pathname: e.isComplianceForm === 1 ? `/compliance/form` : `/tasks/form`,
                              state: e,
                              search: `step=${determineStep(
                                e.task_type
                              )}&form=1`,
                            }}
                            onClick={() => {
                              Cookies.set("checklistId", JSON.stringify(e));
                            }}
                          >
                            <p style={{ color: "green" }}>Completed</p>
                          </Link>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ display: "none" }}>
                {showFormToDownload.show &&
                  showFormToDownload.type === "trust" && (
                    <MonthlyChecklistTrust
                      ref={printComponent}
                      form1Data={allFormDetailsTrust.form1Data}
                      taskStatus={allFormDetailsTrust.taskStatus}
                      dateMonth={allFormDetailsTrust.dateMonth}
                    />
                  )}

                {showFormToDownload.show &&
                  showFormToDownload.type === "general" && (
                    <MonthlyChecklistGeneral
                      ref={printComponent}
                      form6Data={allFormDetailsGeneral.form6Data}
                      form2Data={allFormDetailsGeneral.form2Data}
                      taskStatus={allFormDetailsGeneral.taskStatus}
                      dateMonth={allFormDetailsGeneral.dateMonth}
                    />
                  )}

                {showFormToDownload.show &&
                  showFormToDownload.type === "card" && (
                    <MonthlyChecklistCard
                      ref={printComponent}
                      form3Data={allFormDetailsCard.form3Data}
                      taskStatus={allFormDetailsCard.taskStatus}
                      dateMonth={allFormDetailsCard.dateMonth}
                    />
                  )}
              </div>

              {completedTasks.length >= 15 && (
                <div className="d-flex justify-content-end mx-5 mt-4 px-5">
                  <div>
                    <div className="heading-5 mx-4">
                      Rows per page: {reportsPerPage}
                    </div>
                  </div>
                  <div className="d-flex">
                    <div className="heading-5">
                      {reportsPerPage * (pageNumber - 1) + 1} -{" "}
                      {reportsPerPage * pageNumber}
                    </div>
                    <div className="heading-5 d-flex">
                      <span
                        className="mx-5 cursor_pointer"
                        onClick={() =>
                          pageNumber > 1
                            ? setPageNumber(pageNumber - 1)
                            : null
                        }
                      >
                        <img src={Pagination} alt="arrowLeft" />
                      </span>
                      <span
                        className="cursor_pointer"
                        onClick={() =>
                          pageNumber < allTasks.pages
                            ? setPageNumber(pageNumber + 1)
                            : null
                        }
                      >
                        <img
                          src={Pagination}
                          style={{ transform: "rotate(180deg)" }}
                          alt="arrowRight"
                        />
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {completedTasks.length === 0 ||
                (filteredTaskList.length === 0 && (
                  <p className="heading-5 mt-3 text-center">
                    No Completed Tasks in{" "}
                    {moment(filterTasks.year).format("MMMM YYYY")}
                  </p>
                ))}
            </Col>
          </Row>
        </Tabs>
        <FooterDash />
      </Container> */}
    </Layout>

  );
};

export default TasksPage;
