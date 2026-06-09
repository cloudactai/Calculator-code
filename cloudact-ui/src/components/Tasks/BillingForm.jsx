import React, { useEffect, useState } from "react";
import { getUserId, getUserSID } from "../../utils/helpers";
import axios from "../../utils/axios";
import Multiselect from 'multiselect-react-dropdown';
import Loader from "../../components/Loader";
import toast from "react-hot-toast";
import Dropdown from "react-dropdown";
import { AUTH_ROUTES } from "../../routes/Routes.types"
import { useHistory, useLocation } from 'react-router'
import {
    Accordion,
    Container,
    Row,
    Col,
    Pagination as PaginationBStrap,
} from "react-bootstrap";
import BillingImg from "../../../src/assets/images/Bills.png"
import { CiEdit } from "react-icons/ci";
import { FaCheck } from "react-icons/fa6";
import { RxCross2 } from "react-icons/rx";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { IoMdCheckmark } from "react-icons/io";
import { IoSearchOutline } from "react-icons/io5";
import { FaArrowDownShortWide } from "react-icons/fa6";
import { MdOutlineRefresh } from "react-icons/md";
import { IoIosArrowDown } from "react-icons/io";
import EntryModal from "./Billing/EntryModal";


const BillingForm = () => {
    const [isEditMode, setIsEditMode] = useState(false); // Edit mode toggle
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1); // Page navigation
    const [currentPaginationPage, setCurrentPaginationPage] = useState(1);
    const [timeEntryChangeBtnVisible, setTimeEntryChangeBtnVisible] = useState(false);
    const [isNewBtnVisible, setIsNewBtnVisible] = useState(false);
    const [inputData, setInputData] = useState({});
    const [searchText, setSearchText] = useState("");

    const [formData, setFormData] = useState({
        sid: getUserSID(),
        task_due_date: "",
        task_status: "NOT_STARTED",
        task_bill_preparers: [],
        task_bill_approvers: [],
        task_created_by: getUserId(),
        task_to: "",
        task_from: "",
        taskPeriod: "",
        practice_area: [],
        responsible_attorney: [],
        taskQuestion: "Yes",
        isComplianceForm: 3,
        task_month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
    });

    // const [savedData, setSavedData] = useState({ ...formData });
    const [preparerList, setPreparerList] = useState([]);
    const [reviewerList, setReviewerList] = useState([]);
    const [practiceAreas, setPracticeAreas] = useState([]);
    const [responsibleAttorneys, setResponsibleAttorneys] = useState([]);
    const [billPeriodType, setbillPeriodType] = useState("");
    const history = useHistory()
    const [expandedRow, setExpandedRow] = useState(null); // Track the expanded row
    const [isModalOpen, setIsModalOpen] = useState({
        show: false,
        type: "",
        id: "",
    }); // Modal state
    const [timeEntryData, setTimeEntryData] = useState([]); // Data for the modal
    const [selectedEntries, setSelectedEntries] = useState([]); // Selected entries
    const [editable, setEditable] = useState(false);
    const [activePopupRow, setActivePopupRow] = useState(null); // Tracks the active row for popup
    const [selectedOptions, setSelectedOptions] = useState({}); // Tracks selected options per row
    const [showModal, setShowModal] = useState(false);
    const [filters, setFilters] = useState({
        column: "client", // Default selected column
        order: "asc", // Default sorting order,
        limit: '10'
    });

    const handleFilterClick = () => setShowModal(true);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prevFilters) => ({
            ...prevFilters,
            [name]: value,
        }));
    };

    const options = [
        "Create bill",
        "Create trust request",
        "Write off billable amount",
        "Create Statement of account",
        "Pay by online transfer (Form 9A)",
    ];

    const [globalData, setGlobalData] = useState({});
    const [tableData, setTableData] = useState({
        data: [],
        paginationInfo: {
            currentPage: 1,
            totalCount: 0, // Default total count
            limit: 10, // Default limit per page
        },
    });

    // Handle selection of options
    const handleOptionChange = (rowId, option) => {
        setSelectedOptions((prev) => {
            const rowSelections = prev[rowId] || [];
            const updatedSelections = rowSelections.includes(option)
                ? rowSelections.filter((item) => item !== option) // Remove if already selected
                : [...rowSelections, option]; // Add if not selected

            const newSelectedOptions = {
                ...prev,
                [rowId]: updatedSelections,
            };

            // Update tableData using newSelectedOptions
            setTableData((prevData) => ({
                ...prevData,
                data: prevData.data.map((row) =>
                    row.id === rowId
                        ? {
                            ...row,
                            selectedOptions: newSelectedOptions[rowId],
                        }
                        : row
                ),
            }));

            // Update globalData using newSelectedOptions
            setGlobalData((prevData) => ({
                ...prevData,
                [rowId]: {
                    ...prevData[rowId],
                    selectedOptions: newSelectedOptions[rowId],
                },
            }));

            return newSelectedOptions; // Update selectedOptions state
        });
    };



    // Toggle popup visibility for a specific row
    const togglePopup = (rowId) => {
        setActivePopupRow((prev) => (prev === rowId ? null : rowId));
    };

    // Close popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest(".popup-container")) {
                setActivePopupRow(null);
            }
            if (!e.target.closest(".modal-overlay")) {
                setShowModal(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const handlePaginationClick = async (indexNumber, search = "", currentPage) => {
        if (currentPage != 3) return;
        setCurrentPaginationPage(indexNumber); // Update the current page
        setLoading(true);

        try {
            // Make an API call to fetch data for the selected page
            const response = await axios.post(`/client/billing/detail?page=${indexNumber}&limit=${filters.limit}&orderBy=${filters.column}&orderIn=${filters.order}&search=${search != null ? search : searchText}`, {
                sid: getUserSID(),
                fromDate: formData.task_from,
                to_date: formData.task_to,
                practice_area: formData.practice_area,
                responsible_attorney: formData.responsible_attorney,
            });

            const { data, pagination } = response.data;

            if (!data || !pagination || data.length == 0) {
                console.error("Invalid API response structure.");
                setTableData({
                    data: [],
                    paginationInfo: { limit: filters.limit, currentPage: indexNumber, totalCount: 0 },
                });
                return;
            }

            // Prepare updated global data
            const updatedGlobalData = { ...globalData };

            // Update globalData: Only add new data if not already present
            data.forEach((item) => {
                if (!updatedGlobalData[item.id]) {
                    // Add new data only if the item is not already in globalData
                    updatedGlobalData[item.id] = {
                        ...item, // Add the new data
                    };
                } else {
                    console.log(`Item with id ${item.id} is already present in globalData.`);
                }
            });


            // Generate tableData for the current page
            const tableDataForPage = data.map((item) => updatedGlobalData[item.id]);

            console.log("1qw23er45", updatedGlobalData)

            // Update the state
            setGlobalData(updatedGlobalData); // Persist updated global data
            setTableData({
                data: tableDataForPage, // Use updated global data for the current page
                paginationInfo: {
                    limit: pagination.limit,
                    currentPage: pagination.currentPage,
                    totalCount: pagination.totalRecords,
                },
            });

            console.log("Updated table data:", tableDataForPage);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };



    const timeAndExpenseData = async (id, practice_area, responsible_attorney, client, matter) => {
        setLoading(true);
        try {
            // Check if the data for the given `id` already exists in globalData
            setGlobalData((prevData) => {
                if (prevData[id]) {
                    console.log(`Using existing globalData for id: ${id}`, prevData[id]);

                    // Update tableData with existing globalData
                    setTableData((prevTableData) => ({
                        ...prevTableData,
                        data: prevTableData.data.map((item) =>
                            item.id === id
                                ? { ...item, ...prevData[id] } // Use old content from globalData
                                : item
                        ),
                    }));

                    return prevData; // Retain the current globalData without API call
                }

                console.log(`No old content found in globalData for id: ${id}, fetching from API...`);
                return prevData; // Proceed to fetch new data
            });

            // If old content does not exist, call API to fetch data
            const response = await axios.post(`/client/billing/detail/timeAndExpense`, {
                sid: getUserSID(),
                fromDate: formData.task_from,
                to_date: formData.task_to,
                practice_area,
                responsible_attorney,
                client,
                matter
            });

            // Destructure response data
            const { timeAndExpenseData: data } = response.data; // Assuming the API response contains timeAndExpenseData
            const { timeEntry = [], expenseEntry = [] } = data[0] || { timeEntry: [], expenseEntry: [] }; // Ensure default values if API returns empty

            console.log("Fetched time entry from API:", timeEntry);
            console.log("Fetched expense entry from API:", expenseEntry);

            // Update globalData with new content
            setGlobalData((prevData) => ({
                ...prevData,
                [id]: {
                    ...prevData[id],
                    timeEntry: timeEntry || [],
                    expenseEntry: expenseEntry || [],
                },
            }));

            // Update tableData with new content
            setTableData((prevTableData) => ({
                ...prevTableData,
                data: prevTableData.data.map((item) =>
                    item.id === id
                        ? {
                            ...item,
                            timeEntry: timeEntry || [], // New content
                            expenseEntry: expenseEntry || [], // New content
                        }
                        : item
                ),
            }));

            console.log("Updated table data with new content:", { expenseEntry, timeEntry });

            // Now, set the selected entries after the data is fetched
            setSelectedEntries((prev) => {
                const updatedSelectedEntries = [...prev];

                // Add the timeEntry ids to the selectedEntries
                timeEntry.forEach((entry) => {
                    if (!updatedSelectedEntries.includes(entry.id)) {
                        updatedSelectedEntries.push(entry.id);
                    }
                });

                // Add the expenseEntry ids to the selectedEntries
                expenseEntry.forEach((entry) => {
                    if (!updatedSelectedEntries.includes(entry.id)) {
                        updatedSelectedEntries.push(entry.id);
                    }
                });
                setTimeEntryChangeBtnVisible(updatedSelectedEntries.length > 0);

                return updatedSelectedEntries;
            });
        } catch (err) {
            console.error("Error fetching time and expense data:", err);
        } finally {
            setLoading(false);
        }
    };





    useEffect(() => {
        handlePaginationClick(1, null, currentPage);
    }, [filters]);



    const handleRowClick = async (id) => {
        // Toggle the expanded row
        activePopupRow == null && setExpandedRow((prev) => (prev === id ? null : id));

        // Check if the row data is already cached in globalData
        const matchingItem = globalData[id] || tableData.data.find((item) => item.id === id);

        if (!matchingItem) {
            console.error(`Row with id ${id} not found in tableData or globalData.`);
            return;
        }

        // Check if timeEntry and expenseEntry are empty and fetch data if needed
        console.log("qaswxcd", globalData[id])
        if (
            (matchingItem.timeEntry.length === 0 && matchingItem.expenseEntry.length === 0)
        ) {
            await timeAndExpenseData(
                id,
                matchingItem.practice_area,
                matchingItem.responsibleAttorney,
                matchingItem.client,
                matchingItem.matter
            );
        }
    };


    const openModal = (timeEntry, type, id) => {
        setTimeEntryData(timeEntry); // Set the data for the modal
        setIsModalOpen({
            show: true,
            type,
            id
        });
        setCurrentPage(4);
    };

    const handleCheckboxChange = (entryId, index, e, updateType, rowId) => {
        // Compute the new state of selectedEntries
        let updatedSelectedEntries;
        setSelectedEntries((prev) => {
            updatedSelectedEntries = prev.includes(entryId)
                ? prev.filter((id) => id !== entryId) // Remove if already selected
                : [...prev, entryId]; // Add if not selected
            return updatedSelectedEntries;
        });

        // Function to update the specific field (timeEntry or expenseEntry)
        const updateEntries = (entries, entryId) =>
            entries.map((entry) =>
                entry.id === entryId
                    ? { ...entry, required: updatedSelectedEntries.includes(entryId) ? 1 : 0 } // Set required to 1 if selected, otherwise 0
                    : entry
            );

        // Update both tableData and globalData
        const updateRowData = (prevData, rowId) =>
            prevData.map((row) => {
                if (row.id === rowId) {
                    const updatedRow = { ...row };

                    // Check if updating timeEntry or expenseEntry
                    if (updateType === "timeEntry") {
                        updatedRow.timeEntry = updateEntries(row.timeEntry, entryId);
                    } else if (updateType === "expenseEntry") {
                        updatedRow.expenseEntry = updateEntries(row.expenseEntry, entryId);
                    }

                    return updatedRow;
                }
                return row;
            });

        // Update tableData
        setTableData((prevData) => ({
            ...prevData,
            data: updateRowData(prevData.data, rowId),
        }));

        // Update globalData
        setGlobalData((prevData) => ({
            ...prevData,
            [rowId]: {
                ...prevData[rowId],
                ...(updateType === "timeEntry" && {
                    timeEntry: updateEntries(prevData[rowId]?.timeEntry || [], entryId),
                }),
                ...(updateType === "expenseEntry" && {
                    expenseEntry: updateEntries(
                        prevData[rowId]?.expenseEntry || [],
                        entryId
                    ),
                }),
            },
        }));
        setTimeEntryChangeBtnVisible(updatedSelectedEntries.length > 0);
    };



    const handletextChange = (entryId, index, e, updateType, rowId, fieldType) => {
        console.log("12344", e.target.textContent)
        setInputData((prevInputData) => ({
            ...prevInputData,
            [entryId]: {
                ...prevInputData[entryId], // Retain existing fields for this entryId
                [fieldType]: e.target.textContent, // Update the specific field
                rowId, // Include the rowId for reference
            },
        }));
    };


    const handleNext = (page) => {
        // setSavedData({ ...formData });
        if (page == 3) {
            if (formData.responsible_attorney.length == 0) {
                toast.error("Please select Responsible Attorney");
                return;
            }
            else if (formData.practice_area.length == 0) {
                toast.error("Please select Practice Area");
                return;
            }
            else if (formData.task_bill_preparers.length == 0) {
                toast.error("Please select Bill Preparer");
                return;
            }
            else if (formData.task_bill_approvers.length == 0) {
                toast.error("Please select Bill Approver");
                return;
            }
            handlePaginationClick(currentPaginationPage, null, 3);
        }
        setCurrentPage(page);
    };

    const handleBack = (page) => setCurrentPage(page);

    const handleInputChange = (e) => {
        const { name, value } = e.target;


        console.log("name", name, value);

        // Parse JSON if value is a dropdown with JSON string
        const parsedValue = value.startsWith("{") ? JSON.parse(value) : value;

        setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    };

    const handleNoCaseSubmit = async () => {
        try {
            setLoading(true);

            // Format `tableData` dynamically from `globalData`
            const formattedData = Object.values(globalData).map((item) => ({
                id: item.id,
                client: item.client,
                matter: item.matter,
                responsibleAttorney: item.responsibleAttorney,
                practice_area: item.practice_area,
                timeEntry: item.timeEntry || [], // Include time entries
                expenseEntry: item.expenseEntry || [], // Include expense entries
                discount: item.discount || 0, // Add other necessary fields
                selectedOptions: item.selectedOptions
            }));

            // Send the formatted data to the server
            const response = await axios.post(`/client/billing/type/data`, { data: formattedData, taskDetail: formData });

            setIsEditMode(false);
            if (response.status === 200) {
                toast.success(response.data.message);
            }
        } catch (err) {
            console.error("Error submitting form:", err);
            toast.error("No data found for the particular date range.");
        } finally {
            setLoading(false);
            const currentMonth = new Date().toLocaleString('default', { month: 'long' }); // Get current month name

            history.push({
                pathname: AUTH_ROUTES.COMPLIANCE_BILLING,
                search: `?status=NOT_STARTED&month=${currentMonth}`
            });

        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // List of required fields with corresponding error messages
        const requiredFields = [
            { field: 'task_due_date', message: "Please fill in the 'Due Date'." },
            { field: 'task_from', message: "Please fill in the 'Start Date'." },
            { field: 'task_to', message: "Please fill in the 'End Date'." },
            { field: 'taskPeriod', message: "Please select the 'Billing Period'." },
            { field: 'responsible_attorney', message: "Please select the 'Responsible Attorney'.", isArray: true },
            { field: 'practice_area', message: "Please select the 'Practice Area'.", isArray: true },
            { field: 'task_status', message: "Please select the 'Task Status'." },
            { field: 'task_bill_preparers', message: "Please select at least one 'Bill Preparer'.", isArray: true },
            { field: 'task_bill_approvers', message: "Please select at least one 'Bill Approver'.", isArray: true },
        ];

        // Validation: Loop through required fields and show error if not filled
        for (let { field, message, isArray } of requiredFields) {
            const value = formData[field];
            if (isArray ? value.length === 0 : !value) {
                toast.error(message);
                return;
            }
        }

        // Submit the form if validation passes
        try {
            setLoading(true);
            const response = await axios.post("/add/bill", formData);
            console.log("Form submitted successfully!", formData);
            setIsEditMode(false);

            if (response.status === 200) {
                toast.success(response.data.message);
            }
        } catch (err) {
            console.error("Error submitting form:", err);
            toast.error("No data found for the particular date range.");
        } finally {
            setLoading(false);
            const currentMonth = new Date().toLocaleString('default', { month: 'long' }); // Get current month name
            history.push({
                pathname: AUTH_ROUTES.COMPLIANCE_BILLING,
                search: `?status=NOT_STARTED&month=${currentMonth}`
            });
        }
    };


    const handleCancel = () => {
        setIsEditMode(false);
        // setFormData({ ...savedData }); // Revert changes
    };

    const handleDiscountChange = async (id, discountValue) => {
        setGlobalData((prevData) => {
            const updatedData = { ...prevData };
            if (updatedData[id]) {
                updatedData[id] = { ...updatedData[id], discount: discountValue };
            }
            return updatedData;
        });

        setTableData((prevData) => {
            const updatedData = prevData.data.map((row) =>
                row.id === id ? { ...row, discount: discountValue } : row
            );
            return {
                ...prevData,
                data: updatedData,
            };
        });
    };



    // const saveCheckedData = async () => {
    //     // Filter the data to get only the rows that are marked as required
    //     const checkedtimeEntryRows = tableData.data.map((item) => {
    //         // Ensure you return the filtered rows
    //         return item.timeEntry.filter((row) => row.required);
    //     });

    //     const checkedexpenseEntryRows = tableData.data.map((item) => {
    //         // Ensure you return the filtered rows
    //         return item.expenseEntry.filter((row) => row.required);
    //     });

    //     // Validate if the filtered data is not empty
    //     if (!checkedtimeEntryRows.length && !checkedexpenseEntryRows.length) {
    //         toast.error("No data selected to save.");
    //         return;
    //     }

    //     try {
    //         setLoading(true);

    //         // Send the filtered data to the backend
    //         const response = await axios.post("/save/checked/data", {
    //             timeEntry: checkedtimeEntryRows,
    //             expenseEntry: checkedexpenseEntryRows,
    //         });

    //         // Check if the response status is OK (200)
    //         if (response.status === 200) {
    //             toast.success(response.data.message);
    //         } else {
    //             toast.error("Error saving checked data");
    //         }
    //     } catch (err) {
    //         // Handle any errors during the request
    //         console.error("Error saving checked data:", err);
    //         toast.error("Error saving checked data");
    //     } finally {
    //         setLoading(false);
    //     }
    // };


    useEffect(() => {

        const fetchMatterData = async () => {
            try {
                const allDataResponse = await axios.get(`/matter/list/${getUserSID()}/all`);
                const allData = allDataResponse.data.data; // Access the 'data' array directly

                // Extract and filter unique practice areas, then sort them alphabetically
                const practiceAreaList = allData
                    .map(({ practice_area_name }, index) => ({
                        index, // Include the index in the returned object
                        practice_area_name, // Include the practice area name
                    }))
                    .filter(
                        (area, i, self) =>
                            area.practice_area_name !== null && // Exclude null values
                            self.findIndex((a) => a.practice_area_name === area.practice_area_name) === i // Include only unique practice_area_name
                    )
                    .sort((a, b) => a.practice_area_name.localeCompare(b.practice_area_name)); // Custom sort

                // Extract and filter unique responsible attorneys, then sort them alphabetically
                const attorneyList = allData
                    .map(({ responsible_attorney_name }, index) => ({
                        index, // Include the index in the returned object
                        responsible_attorney_name, // Include the responsible attorney name
                    }))
                    .filter(
                        (attorney, i, self) =>
                            attorney.responsible_attorney_name !== null && // Exclude null values
                            self.findIndex(
                                (a) => a.responsible_attorney_name === attorney.responsible_attorney_name
                            ) === i // Include only unique responsible_attorney_name
                    )
                    .sort((a, b) => a.responsible_attorney_name.localeCompare(b.responsible_attorney_name)); // Custom sort

                console.log("Unique Attorney List:", attorneyList);

                // Set the state with sorted unique values
                setPracticeAreas([...practiceAreaList]); // Use the sorted list
                console.log("Sorted Practice Areas:", practiceAreaList);
                setResponsibleAttorneys([...attorneyList]); // Use the sorted list
            } catch (err) {
                console.error("Error fetching matter data:", err);
            }
        };



        const fetchclientData = async () => {
            try {
                const allDataResponse = await axios.get(
                    `/getBillingDetail/bill/${getUserSID()}/${getUserId()}`
                );
                const allData = allDataResponse.data.data; // Access the 'data' array directly

                // Step 1: Set the billing period type
                const billingFrequency = allData[0]?.billing_info.billing_cycle;
                setbillPeriodType(billingFrequency);
                if (billingFrequency.type === "Monthly") {
                    // Step 1: Get the current date
                    const currentDate = new Date();

                    // Step 2: Calculate the start date (26th of the previous month)
                    const task_from = new Date(currentDate);
                    task_from.setMonth(currentDate.getMonth() - 1); // Move to the previous month
                    task_from.setDate(26); // Set to the 26th of the previous month

                    // Step 3: Calculate the end date (25th of the current month)
                    const task_to = new Date(currentDate);
                    task_to.setDate(25); // Set to the 25th of the current month
                    // Step 3: Set the taskPeriod and update formData with the calculated dates
                    setFormData((prev) => ({
                        ...prev,
                        taskPeriod: "Monthly",
                        task_from: task_from.toLocaleDateString("en-CA"), // Format as 'YYYY-MM-DD'
                        task_to: task_to.toLocaleDateString("en-CA"), // Format as 'YYYY-MM-DD'
                        task_due_date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toLocaleDateString("en-CA"), // Last day is also the due date
                    }));
                }

                else if (billingFrequency?.type === "Weekly") {
                    const weekDay = billingFrequency.data;
                    const weekDayMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
                    const targetDay = weekDayMap[weekDay];

                    if (targetDay === undefined) {
                        console.error("Invalid weekday:", weekDay);
                        return;
                    }

                    const currentDate = new Date();
                    const currentDay = currentDate.getDay();

                    const startOfWeek = new Date(currentDate);
                    const mondayOffset = 1 - currentDay
                    startOfWeek.setDate(currentDate.getDate() + mondayOffset);

                    // Calculate the due date (target weekday)
                    const dueDate = new Date(startOfWeek);
                    dueDate.setDate(startOfWeek.getDate() + targetDay - 1);

                    const task_from = new Date(dueDate);
                    const task_to = new Date(task_from);
                    // Add condition for Mondays and tuesday to exclude saturdays and sundays
                    if (weekDay == "Monday") {
                        task_from.setDate(dueDate.getDate() - 10);
                        task_to.setDate(dueDate.getDate() - 10 + 6);
                    }
                    else if (weekDay == "Tuesday") {
                        task_from.setDate(dueDate.getDate() - 8);
                        task_to.setDate(dueDate.getDate() - 8 + 4);
                    }
                    else {
                        task_from.setDate(dueDate.getDate() - 8);
                        task_to.setDate(dueDate.getDate() - 8 + 6);
                    }




                    setFormData((prev) => ({
                        ...prev,
                        taskPeriod: "Weekly",
                        task_from: task_from.toLocaleDateString("en-CA"),
                        task_to: task_to.toLocaleDateString("en-CA"),
                        task_due_date: dueDate.toLocaleDateString("en-CA"),
                    }));
                }
                else if (billingFrequency?.type === "Daily") {
                    // Step 1: Get the current date
                    const currentDate = new Date();
                    // currentDate.setDate(currentDate.getDate() -2);
                    const currentDay = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

                    let taskFromDate = new Date(currentDate);
                    let dueDate = new Date(currentDate);

                    if (currentDay === 0 || currentDay === 6) {
                        // If it's Sunday (0) or Saturday (6), ignore and return
                        console.log("It's the weekend. Skipping task creation.");
                        return;
                    } else if (currentDay === 1) {
                        // If it's Monday, set task_from as the previous Friday
                        taskFromDate.setDate(currentDate.getDate() - 3); // Go back 3 days to Friday
                    } else {
                        // Otherwise, set task_from as the previous day
                        taskFromDate.setDate(currentDate.getDate() - 1);
                    }

                    // Step 2: Set the taskPeriod and update formData with the calculated dates
                    const taskPeriod = "Daily";
                    setFormData((prev) => ({
                        ...prev,
                        taskPeriod,
                        task_from: taskFromDate.toLocaleDateString("en-CA"), // Format as 'YYYY-MM-DD'
                        task_to: taskFromDate.toLocaleDateString("en-CA"), // Format as 'YYYY-MM-DD'
                        task_due_date: dueDate.toLocaleDateString("en-CA"),
                    }));
                }

                else if (billingFrequency?.type === "Semi-monthly") {
                    const currentDate = new Date();
                    const currentDay = currentDate.getDate(); // Get the day of the month
                    const startDate = new Date(currentDate); // Clone current date for manipulation
                    const task_to = new Date(currentDate); // Clone current date for manipulation
                    const task_due_date = new Date(currentDate);

                    if (currentDay <= 15) {
                        // First half of the month: 26th of previous month to 15th of current month
                        startDate.setMonth(currentDate.getMonth() - 1); // Move to the previous month
                        startDate.setDate(26); // Set to the 26th of the previous month
                        task_to.setDate(13);  // Set to the 13th of the month
                        task_due_date.setDate(15);
                    } else {
                        // Second half of the month: 14th to month's end
                        startDate.setDate(14); // Set to the 14th of the month
                        task_to.setDate(25);
                        task_due_date.setMonth(task_to.getMonth() + 1, 0); // Set to the last day of the month
                    }

                    setFormData((prev) => ({
                        ...prev,
                        taskPeriod: "Semi-monthly",
                        task_from: startDate.toLocaleDateString("en-CA"), // Format as 'YYYY-MM-DD'
                        task_to: task_to.toLocaleDateString("en-CA"), // Format as 'YYYY-MM-DD'
                        task_due_date: task_due_date.toLocaleDateString("en-CA"),
                    }));
                }
                else if (billingFrequency?.type === "Other") {
                    const specificDate = new Date(billingFrequency.data); // Convert the provided date to a Date object

                    if (isNaN(specificDate.getTime())) {
                        console.error("Invalid date provided in billingFrequency.data:", billingFrequency.data);
                        return;
                    }

                    // Extract the specific day
                    const specificDay = specificDate.getDate();
                    const currentDate = new Date();

                    // Clone the current date for task_due_date and set it to the specific day
                    const task_due_date = new Date(currentDate.getFullYear(), currentDate.getMonth(), specificDay);

                    // Clone the date for task_from and set it to two days before the specific day
                    const task_from = new Date(task_due_date);
                    task_from.setDate(task_due_date.getDate() - 2);


                    // Update form data
                    setFormData((prev) => ({
                        ...prev,
                        taskPeriod: "Other",
                        task_from: task_from.toLocaleDateString("en-CA"), // Format as 'YYYY-MM-DD'
                        task_to: task_from.toLocaleDateString("en-CA"), // Format as 'YYYY-MM-DD'
                        task_due_date: task_due_date.toLocaleDateString("en-CA"), // Due date as the specific day
                    }));

                    console.log("Updated taskPeriod:", "Specific-date");
                    console.log("Start Date:", task_from);
                    console.log("Due Date:", task_due_date);
                }



                setPreparerList(allData[0].billing_info.bill_preparer);
                setFormData((prev) => ({ ...prev, task_bill_preparers: allData[0].billing_info.bill_preparer }));
                setReviewerList(allData[0].billing_info.bill_approval);
                setFormData((prev) => ({ ...prev, task_bill_approvers: allData[0].billing_info.bill_approval }));


                const taskPeriod = billingFrequency?.type;
                await new Promise((resolve) => {
                    setFormData((prev) => {
                        resolve();
                        return { ...prev, taskPeriod };
                    });
                });

            } catch (err) {
                console.error("Error fetching matter data:", err);
            }
        };


        const fetchData = async () => {
            await Promise.all([fetchMatterData(), fetchclientData()]);
        };

        fetchData();
    }, []);

    const handleMultiselectChange = (selectedList, type) => {
        const keyMap = {
            bill_approval: { field: "task_bill_approvers", data: selectedList },
            bill_preparer: { field: "task_bill_preparers", data: selectedList },
            practice_area: { field: "practice_area", data: selectedList },
            responsible_attorney: { field: "responsible_attorney", data: selectedList },

        };

        const updateKey = keyMap[type];

        // setSetupDashboardAllData((prev) => ({
        //     ...prev,
        //     billing_info: {
        //         ...prev.billing_info,
        //         [updateKey.field]: updateKey.data,
        //     },
        // }));

        console.log("updateKey", updateKey);

        setFormData((prev) => ({ ...prev, [updateKey.field]: updateKey.data }));
    };

    const handleNewChangeClick = () => {
        setEditable(true);
        setIsNewBtnVisible(true);
    };
    const handleCancelClick = () => {
        setEditable(false);
        setIsNewBtnVisible(false);
        setInputData({});
        setIsModalOpen((prevState) => ({
            ...prevState,
            show: false,
        }));
        setTimeout(() => {
            setIsModalOpen((prevState) => ({
                ...prevState,
                show: true,
            }));
        }, 1);
    };

    const handleSaveClick = () => {
        setEditable(false); // Disable edit mode
        setIsNewBtnVisible(false); // Hide the "New" button

        const updateEntries = (entries, inputData) =>
            entries.map((entry) =>
                inputData[entry.id] ? { ...entry, ...inputData[entry.id] } : entry
            );

        const updateRowData = (row, inputData) => {
            const updatedRow = { ...row };

            // Update timeEntry fields if present in inputData
            if (row.timeEntry) {
                updatedRow.timeEntry = updateEntries(row.timeEntry, inputData);
            }

            // Update expenseEntry fields if present in inputData
            if (row.expenseEntry) {
                updatedRow.expenseEntry = updateEntries(row.expenseEntry, inputData);
            }

            // Calculate total billable amount by summing and converting amounts to integers
            const totalTimeEntryAmount = updatedRow.timeEntry
                ? updatedRow.timeEntry.reduce((sum, entry) => sum + (parseInt(entry.amount, 10) || 0), 0)
                : 0;

            const totalExpenseEntryAmount = updatedRow.expenseEntry
                ? updatedRow.expenseEntry.reduce((sum, entry) => sum + (parseInt(entry.amount, 10) || 0), 0)
                : 0;

            // Update billableAmount at the row level
            if (updatedRow.timeEntry?.length > 0 || updatedRow.expenseEntry?.length > 0) {
                updatedRow.billableAmount = totalTimeEntryAmount + totalExpenseEntryAmount;
            }
            return updatedRow;
        };

        // Update tableData
        setTableData((prevData) => ({
            ...prevData,
            data: prevData.data.map((row) => updateRowData(row, inputData)),
        }));

        // Update globalData
        setGlobalData((prevData) => {
            const updatedData = { ...prevData };
            Object.keys(updatedData).forEach((id) => {
                if (updatedData[id]) {
                    updatedData[id] = updateRowData(updatedData[id], inputData);
                }
            });
            console.log("Updated globalData:", updatedData);
            return updatedData;
        });

        // Clear inputData after saving
        setInputData({});
    };




    return (
        <>
            <Loader isLoading={loading} loadingMsg="Loading..." />
            <h4 className="form-header d-flex gap-3 mb-4 "><img src={BillingImg} />Bills</h4>
            <div className="form-container p-5 billingFormWrap" style={{ border: "1px solid #70bef7", borderRadius: "18px", }}>

                {currentPage == 3 && (
                    <div>
                        {/* Header with Filter */}

                        <div className="form-header d-flex justify-content-between align-items-center mb-2">
                            <label>9. The bill entries are as follows - please select clients to be billed:</label>
                            <div className="d-flex gap-2">
                                <div
                                    className="border-0  p-2 d-flex align-items-center justify-content-center"

                                    style={{ background: "#E3F3FF", borderRadius: "25px", padding: "4px" }}>
                                    <input type="search" placeholder="Search " value={searchText} onChange={(e) => {
                                        setSearchText(e.target.value);
                                    }} style={{
                                        border: "none", outline: "none", background: "transparent", appearance: "none",
                                        WebkitAppearance: "none",
                                    }}></input>
                                    <RxCross2 fontSize={16} onClick={(e) => {
                                        setSearchText("");
                                        handlePaginationClick(1, "", currentPage)
                                    }} />
                                    <IoSearchOutline fontSize={16} style={{ marginLeft: "8px" }} onClick={(e) => {
                                        handlePaginationClick(1, null, currentPage)
                                    }} />
                                </div>


                                <div className="border-0 rounded-circle p-2 d-flex align-items-center justify-content-center"
                                    style={{ background: "#E3F3FF", position: "relative", cursor: "pointer" }}>
                                    <FaArrowDownShortWide onClick={handleFilterClick} fontSize={16} /></div>
                            </div>
                        </div>

                        {/* Modal */}


                        {showModal && (
                            <div className="modal-overlay position-absolute" style={{ background: "rgb(240, 248, 255)", padding: "14px 14px 18px 14px", width: "300px", right: "60px", marginTop: "-10px", borderRadius: "8px", boxShadow: " rgba(17, 12, 46, 0.15) 0px 48px 100px 0px" }}>
                                <div className="modal-content">
                                    <div className="modal-header d-flex justify-content-between">
                                        <MdOutlineRefresh fontSize={24} style={{ color: "rgb(115, 195, 253)", marginLeft: "auto" }} />
                                    </div>

                                    <div className="modal-body d-flex flex-column w-100 gap-3">
                                        {/* Sorting Column Dropdown */}
                                        <div className="d-flex flex-column bills-select-area">
                                            <label htmlFor="filter-column">Sorting Column</label>
                                            {/* <select
                                                id="filter-column"
                                                name="column"
                                                value={filters.column} 
                                                onChange={handleFilterChange}
                                                className="input-select"
                                                style={{
                                                    padding: "6px",
                                                    border: "1px solid rgb(115, 195, 253)",
                                                    borderRadius: "4px",
                                                    zIndex: "1051",
                                                    position: "relative",
                                                    fontSize: "14px"
                                                }}
                                            >
                                                <option value="client">Client</option>
                                                 
                                                <option value="responsibleAttorney">Responsible Attorney</option>
                                             
                                            </select> */}
                                            <Dropdown
                                                options={['Client', 'Responsible Attorney']}
                                                value={filters.column}
                                                onChange={(e) => {
                                                    handleFilterChange({ target: { name: 'column', value: e.value } });
                                                }}
                                                placeholder="Select an option"
                                                className="input-select"

                                            />

                                        </div>

                                        {/* Sorting By Dropdown */}
                                        <div className="d-flex flex-column bills-select-area">
                                            <label htmlFor="filter-order">Sorting By</label>
                                            {/* <select
                                                id="filter-order"
                                                name="order"
                                                value={filters.order}
                                                onChange={handleFilterChange}
                                                className="input-select"
                                                style={{
                                                    padding: "6px",
                                                    border: "1px solid rgb(115, 195, 253)",
                                                    borderRadius: "4px",
                                                    zIndex: "1050",
                                                    position: "relative",
                                                    fontSize: "14px"
                                                }}

                                            >
                                                <option value="asc">Ascending</option>
                                                <option value="desc">Descending</option>
                                            </select> */}

                                            <Dropdown
                                                options={['Ascending', 'Descending']}
                                                value={filters.order === 'asc' ? 'Ascending' : 'Descending'}
                                                onChange={(e) => {
                                                    const value = e.value === 'Ascending' ? 'asc' : 'desc';
                                                    handleFilterChange({ target: { name: 'order', value } });
                                                }}
                                                placeholder="Select an order"
                                                className="input-select"

                                            />

                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}




                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {currentPage === 1 && (
                        <>
                            {/* Page 1 */}
                            <div className="row mb-4">
                                {/* {isEditMode ? (
                                    <div className="col-md-4">
                                        <label htmlFor="billingFrequency">1. Billing frequency</label>
                                        <select
                                            id="billingFrequency"
                                            className="form-control"
                                            value={formData.taskPeriod}
                                            onChange={(e) => setFormData({ ...formData, taskPeriod: e.target.value })} // Update state on selection
                                        >
                                            <option value="Monthly">Monthly</option>
                                            <option value="Weekly">Weekly</option>
                                            <option value="Daily">Daily</option>
                                            <option value="Other">Other</option>
                                            <option value="Semi-monthly">Semi-monthly</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div className="col-md-4">
                                        <label>1. Billing frequency</label>
                                        <p>
                                            {formData?.taskPeriod || "Choose an option"}
                                        </p>
                                    </div>
                                )} */}

                                <div className="col-md-4">
                                    <label>1. Billing frequency</label>
                                    <p>
                                        {formData?.taskPeriod || "Choose an option"}
                                    </p>
                                </div>


                                <div className="col-md-4 bills-input-area">
                                    <label>2. Bill period</label>
                                    {isEditMode ? (
                                        <div className="d-flex align-items-center ">

                                            {/* Input for task_from */}
                                            <input
                                                type="date"
                                                className="form-control me-2"
                                                value={formData.task_from}

                                                onChange={(e) => {
                                                    const newTaskFrom = e.target.value;
                                                    if (new Date(newTaskFrom) <= new Date(formData.task_to) || !formData.task_to) {
                                                        setFormData({ ...formData, task_from: newTaskFrom });
                                                    } else {
                                                        toast.error("Start date cannot be greater than end date");
                                                    }
                                                }}
                                            />

                                            <span className="mx-2">to</span>

                                            {/* Input for task_to */}
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={formData.task_to}
                                                onChange={(e) => {
                                                    const newTaskTo = e.target.value;
                                                    if (new Date(newTaskTo) >= new Date(formData.task_from) || !formData.task_from) {
                                                        setFormData({ ...formData, task_to: newTaskTo });
                                                    } else {
                                                        toast.error("End date cannot be less than start date");
                                                    }
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <p>{formData?.task_from + " - " + formData?.task_to}</p>
                                    )}
                                </div>


                                {/* <div className="col-md-4">
                                    <label>2. Bill period</label>

                                    <p>
                                        {formData.task_from + " - " + formData.task_to}
                                    </p>
                                </div> */}

                                <div className="col-md-4 highlighted-area">
                                    <label>3. Preparer</label>
                                    {isEditMode ? (
                                        <Multiselect
                                            options={preparerList || []}
                                            selectedValues={formData?.task_bill_preparers} // Pass the array directly
                                            onSelect={(selectedList) => {
                                                if (selectedList.length > 1) {
                                                    // Restrict to only one item
                                                    selectedList = [selectedList[selectedList.length - 1]]; // Keep only the last selected item
                                                }
                                                handleMultiselectChange(selectedList, "bill_preparer");
                                            }}
                                            onRemove={(selectedList) => handleMultiselectChange(selectedList, "bill_preparer")}
                                            displayValue="username" // Key used for display in the dropdown
                                            placeholder="Choose an option"
                                        />

                                    ) : (
                                        <p>
                                            {formData.task_bill_preparers && formData.task_bill_preparers.length > 0
                                                ? formData.task_bill_preparers.map((task_bill_preparers) => task_bill_preparers.username).join(", ") // Display usernames as a comma-separated string
                                                : "No preparer selected"}
                                        </p>
                                    )}
                                </div>


                            </div>

                            <div className="row mb-4">
                                <div className="col-md-4 highlighted-area">
                                    <label>4. Approver</label>
                                    {isEditMode ? (
                                        <Multiselect
                                            options={reviewerList || []}
                                            selectedValues={formData?.task_bill_approvers} // Pass the array directly
                                            onSelect={(selectedList) => handleMultiselectChange(selectedList, "bill_approval")}
                                            onRemove={(selectedList) => handleMultiselectChange(selectedList, "bill_approval")}
                                            displayValue="username" // Key used for display in the dropdown
                                            placeholder="Choose an option"
                                        />

                                    ) : (
                                        <p>
                                            {formData.task_bill_approvers && formData.task_bill_approvers.length > 0
                                                ? formData.task_bill_approvers.map((task_bill_approvers) => task_bill_approvers.username).join(", ") // Display usernames as a comma-separated string
                                                : "No approver selected"}
                                        </p>
                                    )}
                                </div>
                                <div className="col-md-4 date-input">
                                    <label>5. Due date to issue bills on Clio</label>
                                    {isEditMode ? (
                                        <div
                                            style={{
                                                padding: "0px", /* Outer padding */
                                                borderRadius: "8px", /* Optional: Rounded container */
                                                border: "1.5px solid #70bef7", /* Optional: Border for container */
                                            }}
                                        >
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="task_due_date"
                                                value={formData.task_due_date}
                                                onChange={handleInputChange}
                                                style={{
                                                    borderRadius: "8px", /* Inner input rounding */
                                                    border: "none", /* Remove input border */
                                                    width: "100%", /* Ensure input fills container */
                                                    boxSizing: "border-box", /* Include padding in width calculation */
                                                }}
                                            />
                                        </div>

                                    ) : (
                                        <p>{formData.task_due_date}</p>
                                    )}
                                </div>



                                <div className="col-md-4 highlighted-area">
                                    {isEditMode ? (
                                        <>
                                            {/* Label and Select/Deselect All Buttons in the Same Row */}
                                            {/* <div className="d-flex align-items-center justify-content-between ">
                                                <label>6. Practice area of matters to be billed</label>
                                                <div>
                                                    <button
                                                        type="button"
                                                        className="bills-btn me-2"  
                                                        onClick={() => handleMultiselectChange(practiceAreas, "practice_area")}
                                                    >
                                                        Select All
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="bills-btn"
                                                        onClick={() => handleMultiselectChange([], "practice_area")}
                                                    >
                                                        Deselect All
                                                    </button>
                                                </div>

                                                

                                            </div> */}

                                            <div className="d-flex align-items-center justify-content-between">
                                                <label>6. Practice area of matters to be billed</label>
                                                <div>
                                                    <button
                                                        type="button"
                                                        className="bills-btn me-2 position-relative"
                                                        onClick={() => handleMultiselectChange(practiceAreas, "practice_area")}

                                                    >
                                                        <i className="fa fa-plus"></i> {/* Font Awesome icon */}
                                                        <span className="tooltip-text">Select All</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="bills-btn position-relative"
                                                        onClick={() => handleMultiselectChange([], "practice_area")}

                                                    >
                                                        <i className="fa fa-minus"></i> {/* Font Awesome icon */}
                                                        <span className="tooltip-text">Deselect All</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Multiselect Dropdown */}
                                            <Multiselect
                                                key={formData?.practice_area?.length}
                                                options={practiceAreas || []}
                                                selectedValues={formData?.practice_area} // Pass the array directly
                                                onSelect={(selectedList) =>
                                                    handleMultiselectChange(selectedList, "practice_area")
                                                }
                                                onRemove={(selectedList) =>
                                                    handleMultiselectChange(selectedList, "practice_area")
                                                }
                                                displayValue="practice_area_name" // Key used for display in the dropdown
                                                placeholder="Choose an option"
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <label>6. Practice area of matters to be billed</label>
                                            <p>
                                                {formData?.practice_area.length > 0
                                                    ? formData.practice_area
                                                        .map((practice_area) => practice_area.practice_area_name)
                                                        .join(", ")
                                                    : "Choose practice area"}
                                            </p>
                                        </>
                                    )}
                                </div>



                            </div>

                            <div className="row mb-4">
                                <div className="col-md-4 highlighted-area">
                                    {isEditMode ? (
                                        <>
                                            {/* Label and Select All Button in the Same Row */}
                                            {/* <div className="d-flex align-items-center justify-content-between">
                                                <label
                                                >
                                                    7. Responsible Attorney
                                                </label>
                                                <button
                                                    type="button"
                                                    className="bills-btn"
                                                    onClick={() =>
                                                        handleMultiselectChange(responsibleAttorneys, "responsible_attorney")
                                                    }

                                                >
                                                    Select All
                                                </button>

                                                <button
                                                    type="button"
                                                    className="bills-btn"
                                                    onClick={() => handleMultiselectChange([], "responsible_attorney")}
                                                >
                                                    Deselect All
                                                </button>
                                            </div> */}
                                            <div className="d-flex align-items-center justify-content-between">
                                                <label>7. Responsible Attorney</label>
                                                <div>
                                                    <button
                                                        type="button"
                                                        className="bills-btn me-2 position-relative"
                                                        onClick={() =>
                                                            handleMultiselectChange(responsibleAttorneys, "responsible_attorney")
                                                        }

                                                    >
                                                        <i className="fa fa-plus"></i> {/* Font Awesome icon */}
                                                        <span className="tooltip-text">Select All</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="bills-btn position-relative"
                                                        onClick={() => handleMultiselectChange([], "responsible_attorney")}

                                                    >
                                                        <i className="fa fa-minus"></i> {/* Font Awesome icon */}
                                                        <span className="tooltip-text">Deselect All</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Multiselect Dropdown */}
                                            <Multiselect
                                                key={formData?.responsible_attorney?.length}
                                                options={responsibleAttorneys || []}
                                                selectedValues={formData?.responsible_attorney}
                                                onSelect={(selectedList) =>
                                                    handleMultiselectChange(selectedList, "responsible_attorney")
                                                }
                                                onRemove={(selectedList) =>
                                                    handleMultiselectChange(selectedList, "responsible_attorney")
                                                }
                                                displayValue="responsible_attorney_name"
                                                placeholder="Choose an option"
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <label
                                            >
                                                7. Responsible Attorney
                                            </label>
                                            <p>
                                                {formData?.responsible_attorney.length > 0
                                                    ? formData.responsible_attorney
                                                        .map(
                                                            (responsible_attorney) =>
                                                                responsible_attorney.responsible_attorney_name
                                                        )
                                                        .join(", ")
                                                    : "Choose responsible attorney"}
                                            </p></>
                                    )}
                                </div>
                            </div>




                            <div className="btnGroup" style={{ justifyContent: 'space-between' }}>
                                {!isEditMode ? (
                                    <>
                                        <button type="button" className="editBtn btn btnPrimary m-0 edit-button" onClick={() => setIsEditMode(true)}>Edit <span><CiEdit size={18} /></span>
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-default"
                                            style={{ background: "#70bef7" }}
                                            onClick={() => {
                                                handleNext(2);
                                            }}
                                        >
                                            Next
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="d-flex">
                                            <button
                                                type="button"
                                                className="btn dismissBtn me-2"
                                                onClick={handleCancel}
                                            >
                                                Cancel <RxCross2 size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} />
                                            </button>
                                            {/* <button class="btn btnPrimary ms-auto" type="button" >Save <FaCheck size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} /></button> */}
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-default"
                                            style={{ background: "#70bef7" }}
                                            onClick={() => {
                                                handleNext(2);
                                            }}
                                        >
                                            Next
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {currentPage === 2 && (
                        <>
                            {/* Page 2 */}
                            <div className="row mb-4">
                                <div className="col-md-5 bills-select-area">
                                    <label>8. Should all billable time and expense entries as posted on Clio be billed?</label>
                                    <Dropdown
                                        options={
                                            ['Yes', 'No']
                                        }
                                        value={formData.taskQuestion}
                                        onChange={(e) => {

                                            setFormData((prev) => ({ ...prev, taskQuestion: e.value }));
                                        }}
                                        placeholder="Select an option"
                                    />
                                </div>
                            </div>

                            <div className="btnGroup d-flex justify-content-between" style={{ paddingTop: "11px" }} >
                                <button
                                    type="button"
                                    className="btn btn-default m-0"
                                    style={{ background: "#70bef7" }}
                                    onClick={() => {
                                        handleBack(currentPage - 1);
                                    }}
                                >
                                    Back
                                </button>
                                {formData.taskQuestion && formData.taskQuestion === "No" ? (
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        style={{ background: "#70bef7", color: "black", border: "none" }}
                                        onClick={() => {
                                            handleNext(3);
                                        }}
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button type="submit" className="btn btnPrimary">
                                        Create bill card
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {currentPage === 3 && (
                        <>
                            {/* Page 3 */}
                            <div className="billingFormTableWrap"  >
                                {/* Main Table */}
                                <table className="table " style={{ marginBottom: "0px" }}

                                >
                                    <thead style={{ padding: "10px" }}>
                                        <tr  >
                                            <th className="text-center">Client</th>
                                            <th className="text-center" >Matter</th>
                                            <th className="text-center" >Practice Area</th>
                                            <th className="text-center" >Responsible Attorney</th>
                                            <th className="text-center" >Billable Amount ($)</th>
                                            <th className="text-center" >Amount in Trust ($)</th>
                                            <th className="text-center"  >Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableData?.data?.length > 0 ? (

                                            tableData.data.map((row) => (

                                                <React.Fragment key={row.id} style={{ boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }}>
                                                    {/* Main Row */}
                                                    <tr onClick={() => handleRowClick(row.id)} style={{ cursor: "pointer", borderBottom: "1px solid rgb(115, 195, 253)" }}>
                                                        <td>{<IoIosArrowDown fontSize={22} style={{ paddingRight: "6px" }} />}{row.client}</td>
                                                        <td className="text-center">{row.matter}</td>
                                                        <td className="text-center">{row.practice_area}</td>
                                                        <td className="text-center">{row.responsibleAttorney}</td>
                                                        <td className="text-center"> {row.billableAmount?.toLocaleString("en-IN")}</td>
                                                        <td className="text-center">{row.amountInTrust?.toLocaleString("en-IN")}</td>
                                                        <td className="text-center dotsVertical">
                                                            <span
                                                                style={{ cursor: "pointer" }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // Prevents the row click event from being triggered
                                                                    togglePopup(row.id);
                                                                }}
                                                            >
                                                                <HiOutlineDotsVertical />
                                                            </span>
                                                            {activePopupRow === row.id && (
                                                                <div
                                                                    className="popup-container billform"
                                                                >
                                                                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                                                        {options.map((option) => (
                                                                            <li key={option} className="text-left" style={{ marginBottom: "5px", color: "black" }}>
                                                                                <label>
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={
                                                                                            selectedOptions[row.id]?.includes(option) || false
                                                                                        }
                                                                                        onChange={() =>
                                                                                            handleOptionChange(row.id, option)
                                                                                        }
                                                                                        style={{ marginRight: "8px" }}
                                                                                    />
                                                                                    {option}
                                                                                </label>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>

                                                    {/* Expanded Details Row */}
                                                    {expandedRow === row.id && (
                                                        <tr className="expanedRowInBillForm">
                                                            <td colSpan={7} style={{ padding: "16px" }}>
                                                                <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
                                                                    <div>
                                                                        <strong>Time Entry:</strong>{" "}
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-link"
                                                                            onClick={() => {
                                                                                if (row.timeEntry.length > 0) {
                                                                                    openModal(row.timeEntry, "timeEntry", expandedRow);
                                                                                }
                                                                            }}
                                                                            disabled={row.timeEntry.length === 0} // Disable button if length is 0
                                                                        >
                                                                            {row.timeEntry.length}
                                                                        </button>
                                                                    </div>

                                                                    <div>
                                                                        <strong>Expense Entry:</strong>{" "}
                                                                        <button
                                                                            type="button"
                                                                            style={{ marginLeft: "22px" }}
                                                                            className="btn btn-link"
                                                                            onClick={() => {
                                                                                if (row.expenseEntry.length > 0) {
                                                                                    openModal(row.expenseEntry, "expenseEntry", expandedRow);
                                                                                }
                                                                            }}
                                                                            disabled={row.expenseEntry.length === 0} // Disable button if length is 0
                                                                        >
                                                                            {row.expenseEntry.length}
                                                                        </button>

                                                                    </div>
                                                                    <div>
                                                                        <strong>Discount:</strong>
                                                                        <input
                                                                            type="text"
                                                                            value={row.discount ? `$${Number(row.discount).toLocaleString()}` : ""} // Format the value with $ and commas
                                                                            onChange={(event) => {
                                                                                const value = event.target.value.replace(/[^\d.]/g, ""); // Remove non-numeric characters except the decimal point
                                                                                if (/^\d*\.?\d*$/.test(value)) { // Allow only valid numbers
                                                                                    handleDiscountChange(row.id, value); // Pass the raw number to the handler
                                                                                }
                                                                            }}
                                                                            className="input-below"
                                                                            style={{ marginTop: "4px", display: "block" }}
                                                                        />



                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}

                                                </React.Fragment>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} style={{ textAlign: "center", padding: "16px" }}>
                                                    No data available
                                                </td>
                                            </tr>
                                        )}


                                    </tbody>
                                </table>




                            </div>
                            {tableData.data.length > 0 && (
                                <div style={{ marginTop: "16px" }}>
                                    <Container>
                                        <Row>
                                            <Col md={5} className="mx-auto d-flex align-items-center bills-select-area custome-dropdown">
                                                <Dropdown
                                                    options={["10", "20", "30", "40", "50"]}
                                                    value={filters.limit}
                                                    onChange={(e) =>
                                                        setFilters({
                                                            ...filters,
                                                            limit: e.value,
                                                        })
                                                    }
                                                />
                                            </Col>
                                            <Col md={7} className="mx-auto d-flex">
                                                <PaginationBStrap className="justify-content-center mt-3">
                                                    {/* Previous Button */}
                                                    <PaginationBStrap.Prev
                                                        disabled={currentPaginationPage === 1}
                                                        onClick={() =>
                                                            handlePaginationClick(currentPaginationPage - 1, null, currentPage)
                                                        }
                                                    />

                                                    {/* Page Numbers */}
                                                    {Array.from(
                                                        {
                                                            length: Math.ceil(
                                                                tableData.paginationInfo.totalCount /
                                                                tableData.paginationInfo.limit
                                                            ),
                                                        },
                                                        (_, index) => index + 1
                                                    )
                                                        .slice(
                                                            Math.max(0, currentPaginationPage - 3), // Show up to 3 pages before current
                                                            currentPaginationPage + 2 // Show up to 2 pages after current
                                                        )
                                                        .map((i) => (
                                                            <PaginationBStrap.Item
                                                                onClick={() => handlePaginationClick(i, null, currentPage)}
                                                                key={i}
                                                                active={i === currentPaginationPage}
                                                            >
                                                                {i}
                                                            </PaginationBStrap.Item>
                                                        ))}

                                                    {/* Next Button */}
                                                    <PaginationBStrap.Next
                                                        disabled={
                                                            currentPaginationPage ===
                                                            Math.ceil(
                                                                tableData.paginationInfo.totalCount /
                                                                tableData.paginationInfo.limit
                                                            )
                                                        }
                                                        onClick={() =>
                                                            handlePaginationClick(currentPaginationPage + 1, null, currentPage)
                                                        }
                                                    />
                                                </PaginationBStrap>
                                            </Col>
                                        </Row>
                                    </Container>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="btnGroup d-flex justify-content-between" style={{ paddingTop: "11px" }}>
                                <button
                                    type="button"
                                    className="btn btn-default"
                                    style={{ background: "#70bef7" }}
                                    onClick={() => {
                                        handleBack(currentPage - 1);
                                    }}
                                >
                                    Back
                                </button>
                                <button type="button" onClick={handleNoCaseSubmit} className="btn btnPrimary">
                                    Create bill card
                                </button>
                            </div>
                        </>
                    )}

                    {isModalOpen.show && currentPage === 4 && (
                        <div>
                            <EntryModal
                                isModalOpen={isModalOpen}
                                currentPage={currentPage}
                                timeEntryData={timeEntryData}
                                selectedEntries={selectedEntries}
                                editable={editable}
                                handleCheckboxChange={handleCheckboxChange}
                                handletextChange={handletextChange}
                                timeEntryChangeBtnVisible={timeEntryChangeBtnVisible}
                                isNewBtnVisible={isNewBtnVisible}
                                handleCancelClick={handleCancelClick}
                                handleSaveClick={handleSaveClick}
                                handleNewChangeClick={handleNewChangeClick}
                                setIsModalOpen={setIsModalOpen}
                                setCurrentPage={setCurrentPage}
                            />
                        </div>
                    )}



                </form>
            </div >
        </>
    );
};

export default BillingForm;
