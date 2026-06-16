import { useHistory } from "react-router";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useReactToPrint } from 'react-to-print';
import Cookies from "js-cookie";

import useQuery from "../../hooks/useQuery";
import { momentFunction } from "../../utils/moment";
import { Task } from "../../components/Tasks/Task";
import Layout from "../../components/LayoutComponents/Layout";
import Loader from "../../components/Loader";
import axios from "../../utils/axios";
import { getSvg } from "./Compliance_assets";
import {
  generateUniqueIdentifier,
  getUserSID,
  getUserId,
  getCurrentDate,
  getCurrentUserFromCookies,
  getShortFirmname,
  getLayoutTitle,
  getUserProfileInfo
} from "../../utils/helpers";




import {
  formatNumberWithCommasAndDecimals
} from "../../utils/helpers/Formatting";
import flatpickr from 'flatpickr';

const ComplianceFormAB = () => {

  // Get the query parameters and the task state from the history
  const query = useQuery();
  const step = parseInt(query.get("step"));
  const history = useHistory();
  const taskState = history.location.state;

  console.log("taskStateAlldaata", taskState.reason_of_payment);



  // State variables
  const [htmlContent, setHtmlContent] = useState('');
  const [fileNumberValue, setFileNumberValue] = useState({});
  const [tableData, setTableData] = useState([]);

  const [totalAmount, setTotalAmount] = useState(0);
  const [staticTotalAmount, setStaticTotalAmount] = useState(0)
  const [loading, setLoading] = useState(false);
  const [loadingApprover, setLoadingApprover] = useState({
    approverLoader: false,
    preparerLoader: false,
    saveForm: false
  });

  const [newForm, setNewForm] = useState(false)
  const [sectionA, setSectionA] = useState({
    requisition: `${generateUniqueIdentifier()}001`,
    amountOfFunds: "",
    Re: "",
    client_matter: taskState.client_matter,
    task_account: taskState.task_account?.split(','),
    reasonForPayment: "",
    trustAccountToBeDebited: "",
    nameOfFinancialInst: "",
    accountNumber: "",
    nameOfRecipient: "",
    accountToBeCredited: "",
    nameOfFinancialInst2: "",
    branchNameAndAddress: "",
    accountNumber2: "",
    personRequisElecTrustTransfer: "",
    date: getCurrentDate(),
    signature: "",
    additionalTransactionParticulars: "",
    personEnteringDetailsOfTransfer: "",
    namePreparer: taskState.task_preparer_name,
    personAuthorizingTransferAtComputerTerminal: "",
    nameReviewer: taskState.task_approverer_name,
    persons: [],
    selectedTaskAccount: '',
    FormTitle: '',
    totalAmounttbl: '',
    task_approverer_signoff: taskState.task_approverer_signoff,
    task_approverer_signoff_date: taskState.task_approverer_signoff_date,
    task_preparer_signoff: taskState.task_preparer_signoff,
    task_preparer_signoff_date: taskState.task_preparer_signoff_date,
    FirmAddress: '',
    reason_of_payment: ['Settlement of invoices', 'Return to client funds', 'Payment to third party', 'Other'],
    nature_of_matter: [
      "Real estate",
      "Family/Matrimonial",
      "Corporate/Commercial",
      "Personal Injury (defendant)",
      "Wills/Estates/Trusts",
      "Civil Litigation",
      "Other",],
    corresponding_reasons: ['Client/payee cannot be located', 'Client/payee refuses to accept amount', 'Cheque is stale-dated', "Bank error (deposit or cheque cleared at the wrong amount)"
      , "Addition/transposition error on trust ledger card", "Other"
    ]
  });
  const [allclientwithdetails, setAllclientwithdetails] = useState([]);




  const [selectionState, setSelectionState] = useState({
    selectedOptionid: 'Select an option',
  });

  const [cliobillingData, setClioBillingData] = useState([]);
  const [clioBillingforAfterSave, setClioBillingForAfterSave] = useState([])

  // Reference to the form element
  const formTarget = useRef();
  const tableRef = useRef();


  useEffect(() => {
    if (step == 4 || step == 5 || step == 6 || step == 7 || step == 8 || step == 9

      || step == 10 || step == 11 || step == 12
    ) {
      let firmName = document.getElementById('firmName');
      let firmName2 = document.getElementById('firmName-2');


      if (firmName) {
        firmName.textContent = getCurrentUserFromCookies().display_firmname;
      }

      if (firmName2) {
        firmName2.textContent = getCurrentUserFromCookies().display_firmname;
      }



    }
  }, [step, htmlContent])


  useEffect(() => {
    // console.log('CalledASSINm', `cloudact-${getShortFirmname().toLowerCase()}`)
    getComplienceForm();

    // ".filter-options" d-flex align-items-center

  }, [step, sectionA.requisition]);

  const getComplienceForm = () => {
    axios.get("/compliance/" + taskState.id).then(async (res) => {
      if (res.data.data.body.length > 0) {
        let formDetailsLink = res.data.data.body[0].formDetails
        formDetailsLink = formDetailsLink.replace(/^"|"$/g, '');
        try {
          const response = await fetch(formDetailsLink);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.text();

          setHtmlContent(data);
        } catch (error) {
          toast.error('Error fetching the HTML content');
        }
      } else {
        axios.get(`/getcomplienceform/${step}/${getCurrentUserFromCookies().province}`).then((res) => {
          const updatedHtml = replacePlaceholders(res.data, sectionA);
          setHtmlContent(updatedHtml);
          setNewForm(true);
          populateTable();
          dynamicTablebankingwithdrawal();
          // populdatefinancialdetailsTable();
          populatetableCorrespondingreasons();
          populateTablewithAreaofPractice();
          TransferDetailsMatterToMatter();
          getAccountDeatils();
          getCompanyinfo();

        }).catch((err) => {
          console.log("why issue to get complienece", err)
          toast.error('something went wrong in get complience')
        })

      }
    }).catch((err) => {
      toast.error('error occureed', err);
    }).finally((err) => {
      getDataofClioAfterBilling()

    })
  }

  const populateDropdown = (elementId, options) => {

    const selectElement = document.getElementById(elementId);

    if (selectElement) {
      selectElement.style.borderRadius = '10px';
      selectElement.innerHTML = '';
      const emptyOption = document.createElement('option');

      if (elementId == 'reason_of_payment' && step == 15) {
        selectElement.setAttribute("multiple", "true");
        selectElement.setAttribute("class", 'getSelectpicker showPrint');
        selectElement.setAttribute("id", 'reason_of_payment');
        selectElement.setAttribute("title", 'Select an option');
      }

      emptyOption.textContent = 'Select an option';

      selectElement.appendChild(emptyOption);
      options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        selectElement.appendChild(optionElement);
      });
      selectElement.addEventListener('change', handleChangeDropdown);

      let getSelectpicker = document.getElementsByClassName('getSelectpicker');
      if (getSelectpicker) {
        Array.from(getSelectpicker).forEach((element) => {
          element.style.borderRadius = '10px';
          window.$(element).selectpicker('destroy');
          window.$(element).selectpicker();
        });
      }

    }
  };


  let gerneralDropdownDataAfterSave = []

  useEffect(() => {

    axios.get(`/clio-account-details-general/${getUserSID()}`
    ).then((res) => {
      gerneralDropdownDataAfterSave = [...res.data.data.body];
    }).catch((err) => {
      toast.error('something went wrong in clio-account')
    }
    )
  }, []);


  const handleChangeDropdown = (event) => {
    const value = event.target.value;
    const selectElement = event.target;
    // Remove the 'selected' attribute from all options
    Array.from(selectElement.options).forEach(option => {
      option.removeAttribute("selected");
    });

    // Set the 'selected' attribute on the newly selected option
    selectElement.querySelector('option[value="' + value + '"]')?.setAttribute("selected", "selected");

    if (event.target.id === 'Person_entering_details') {
      setSectionA((prev) => ({
        ...prev,
        personRequisElecTrustTransfer: value
      }));

      const personAuthorizingElement = document.getElementById('trust_transferName');
      if (personAuthorizingElement) {
        personAuthorizingElement.textContent = value;
      }

    } else if (event.target.id === 'Person_authorizing') {
      setSectionA((prev) => ({
        ...prev,
        personAuthorizingTransferAtComputerTerminal: value
      }));

      const personAuthorizingElement = document.getElementById('Person_authorizingvalue');
      if (personAuthorizingElement) {
        personAuthorizingElement.textContent = value;
      }

    } else if (event.target.id === 'Selectboxtaskaccount') {

      setSectionA((prev) => ({
        ...prev,
        selectedTaskAccount: value
      }));

      const taskAccountElement = document.getElementById('Selectboxtaskaccount');
      if (taskAccountElement) {
        let inputElement = document.getElementById('taskAccountInput');
        if (!inputElement) {
          inputElement = document.createElement('input');
          inputElement.type = 'text';
          inputElement.id = 'taskAccountInput';
          inputElement.oninput = handleDynamicInputChange;
          taskAccountElement.parentNode.insertBefore(inputElement, taskAccountElement.nextSibling);
        }
        inputElement.value = fileNumberValue[value] || '';
      }
    } else if (event.target.id === 'reason_of_payment') {
      setSelectionState((prev) => ({
        ...prev,
        selectedOptionid: value
      }));

    } else if (event.target.id === 'accountToBeCreditedgerneralDropdown') {

      const value = event.target.value;
      const selectElement = event.target;


      let checkotherdetails = gerneralDropdownDataAfterSave.find(element => element.account_name === value);



      if (checkotherdetails) {

        const personAuthorizingElement2 = document.getElementById('nameOfFinancialInst2gerneral');
        if (personAuthorizingElement2) {
          personAuthorizingElement2.textContent = checkotherdetails.bank_name;
        }

        const personAuthorizingElement3 = document.getElementById('branchNameAndAddressgerneral');
        if (personAuthorizingElement3) {
          personAuthorizingElement3.textContent = '';
        }

        const personAuthorizingElement4 = document.getElementById('accountNumber2gerneral');
        if (personAuthorizingElement4) {
          personAuthorizingElement4.textContent = checkotherdetails.account_number;
        }
      }


    }
  };


  useEffect(() => {

    if (!newForm) {
      document.addEventListener('change', function (event) {
        if (event.target.matches('select:not(.getSelectpicker)')) {
          handleChangeDropdown(event);
        }
      });
    }

  }, [newForm])


  const handleDynamicInputChange = (event) => {

    const { value } = event.target;
    setFileNumberValue((prev) => ({
      ...prev,
      [sectionA.selectedTaskAccount]: value
    }));
  };

  const replacePlaceholders = (html, data) => {
    let updatedHtml = html;
    for (const key in data) {
      const regex = new RegExp(`{${key}}`, 'g');
      updatedHtml = updatedHtml.replace(regex, data[key]);
    }
    return updatedHtml;
  };


  useEffect(() => {
    if (newForm) {
      axios.get(`/user/list/${getUserSID()}/${getUserId()}`).then((response) => {
        if (response?.data?.data?.body.length > 0) {
          setSectionA((prev) => ({
            ...prev,
            persons: response?.data?.data?.body.filter((element) => element.username).map(element => element.username)
          }));
        } else {
          toast.error("Something went wrong in user list");
        }
      }).catch((err) => {
        throw err;
      })
    }
  }, [newForm]);

  useEffect(() => {
    if (newForm) {
      populateDropdown('Person_requisitioning', sectionA.persons);
      populateDropdown('Person_authorizing', sectionA.persons);
      let AddResonOFpayment = document.getElementById('reason_of_payment');
      if (AddResonOFpayment) {
        AddResonOFpayment.textContent = taskState.reason_of_payment
      }
      // populateDropdown('reason_of_payment', sectionA.reason_of_payment);
    }
  }, [sectionA.persons, sectionA.task_account])


  // const populateTable = () => {
  //   const tableElement = document.querySelector('#dynamicTable');
  //   if (tableElement) {
  //     tableRef.current = tableElement;
  //     const thead = tableElement.querySelector('thead');
  //     if (thead) {
  //       thead.innerHTML = `
  //         <tr>
  //           <th>Client</th>
  //             ${(step == 13 || step == 10 ) ? '<th>Matter Number</th>' : '<th>File Number</th>'}

  //           <th>Matter Description</th>
  //           <th>Reference</th> 
  //           <th>Amount</th>
  //         </tr>
  //       `;
  //     }
  //     const tbody = tableElement.querySelector('tbody');
  //     if (tbody) {
  //       tbody.innerHTML = '';
  //       tableData.forEach((data, index) => {
  //         const row = document.createElement('tr');

  //         const clientCell = document.createElement('td');
  //         clientCell.textContent = data.client;

  //         const fileNumberCell = document.createElement('td');
  //         fileNumberCell.textContent = data.filenumber;

  //         const fileDescription = document.createElement('td');
  //         fileDescription.textContent = data.matter_description;



  //         const newColumnCell = document.createElement('td');

  //         if (selectionState.selectedOptionid == 'Settlement of invoices'
  //         ) {

  //           const label = document.createElement('span');
  //           label.textContent = 'Invoice: ';
  //           newColumnCell.appendChild(label);

  //           const newColumnInput = document.createElement("select");
  //           newColumnInput.style.borderRadius = '10px';

  //           newColumnInput.setAttribute("multiple", "true");
  //           newColumnInput.setAttribute("class", 'getSelectpicker showPrint');


  //           const arroptions = [{ option: 'Select an option', amount: '' }];


  //           cliobillingData.filter(element => element.matter_display_number === data.filenumber).forEach(element => {
  //             const displayText = `${element.number}`;
  //             arroptions.push({ option: displayText, amount: element.total });
  //           });
  //           newColumnInput.disabled = arroptions.length === 1;
  //           newColumnInput.setAttribute("title", 'Select an option');


  //           if (arroptions.length === 1) {
  //             newColumnInput.setAttribute("title", 'No invoice found');
  //             arroptions.pop();
  //             arroptions.push({ option: 'No invoices found', amount: '' });
  //           }


  //           arroptions.forEach(option => {
  //             const optionElement = document.createElement('option');
  //             optionElement.value = option.option;
  //             optionElement.textContent = option.option;
  //             optionElement.selected = data.reason_of_payment === option.option;
  //             newColumnInput.appendChild(optionElement);
  //           });

  //           newColumnCell.appendChild(newColumnInput);

  //           const Span = document.createElement('span');
  //           Span.className = 'hidePrint';

  //           Span.textContent = ' ';
  //           newColumnCell.appendChild(Span);

  //         } else {
  //           const newColumnInput = document.createElement('input');
  //           newColumnInput.type = 'text';
  //           newColumnInput.className = 'form-control';
  //           newColumnInput.setAttribute("value", data.newColumn || '');
  //           newColumnInput.onchange = (e) => {
  //             e.target.setAttribute("value", e.target.value);
  //             const newTableData = [...tableData];
  //             newTableData[index].newColumn = e.target.value;
  //             setTableData(newTableData);
  //           };


  //           newColumnCell.appendChild(newColumnInput);
  //         }

  //         const amountCell = document.createElement('td');
  //         const amountInput = document.createElement('input');
  //         amountInput.type = 'text';
  //         amountInput.id = `amount-${index}`;
  //         amountInput.className = 'form-control';
  //         amountInput.setAttribute("value", data.amount || '');

  //         amountInput.addEventListener('input', function (e) {
  //           e.target.value = e.target.value.replace(/[^0-9]/g, '');
  //         });

  //         amountInput.onchange = (e) => {

  //           e.target.setAttribute("value", e.target.value);
  //           const newTableData = [...tableData];
  //           newTableData[index].amount = e.target.value;
  //           setTableData(newTableData);
  //           calculateTotal(newTableData);
  //         };
  //         amountCell.appendChild(amountInput);

  //         row.appendChild(clientCell);
  //         row.appendChild(fileNumberCell);
  //         row.appendChild(fileDescription);

  //         row.appendChild(newColumnCell); // Add new column cell to the row
  //         row.appendChild(amountCell);
  //         tbody.appendChild(row);
  //       });

  //       const totalRow = document.createElement('tr');
  //       const totalClientCell = document.createElement('td');
  //       totalClientCell.colSpan = 4; // Update colspan to include new column
  //       totalClientCell.textContent = 'Total';

  //       const totalAmountCell = document.createElement('td');
  //       totalAmountCell.classList.add('totalValue');
  //       totalAmountCell.textContent = formatNumberWithCommasAndDecimals(totalAmount);
  //       totalRow.appendChild(totalClientCell);
  //       totalRow.appendChild(totalAmountCell);
  //       tbody.appendChild(totalRow);
  //     }
  //   }

  //   let getSelectpicker = document.getElementsByClassName('getSelectpicker');
  //   if (getSelectpicker) {
  //     Array.from(getSelectpicker).forEach((element) => {
  //       element.style.borderRadius = '10px';
  //       window.$(element).selectpicker();
  //     });
  //   }

  // };


  const populateTable = () => {
    const tableElement = document.querySelector('#dynamicTable');
    let totalamountafterReduce = tableData.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)

    let rowsPerPage = 17; // Rows per page for printing

    if (step == 10) {
      rowsPerPage = 21
    }

    if (tableElement) {
      tableRef.current = tableElement;
      const thead = tableElement.querySelector('thead');
      if (thead) {
        thead.innerHTML = `
          <tr>
            <th>Client</th>
              ${(step == 13 || step == 10) ? '<th>Matter Number</th>' : '<th>File Number</th>'}

            <th>Matter Description</th>
            <th>Reference</th> 
            <th>Amount</th>
          </tr>
        `;
      }
      const tbody = tableElement.querySelector('tbody');

      if ((tableData.length == 1 || tableData.length == 2 || tableData.length == 3) && step == 13) {
        let getElementById = document.getElementById('section6');
        getElementById.classList.add('page-break-section');
      }

      if ((tableData.length == 1 || tableData.length == 2 || tableData.length == 3) && step == 10) {
        let getElementById = document.getElementById('section5');
        getElementById.classList.add('page-break-section');
      }

      if (tbody) {
        tbody.innerHTML = '';
        let currentPageRows = 0;
        tableData.forEach((data, index) => {
          console.log('dataForEachhdngjs', data)
          const row = document.createElement('tr');

          const clientCell = document.createElement('td');
          clientCell.textContent = data.client;

          const fileNumberCell = document.createElement('td');
          fileNumberCell.textContent = data.filenumber;

          const fileDescription = document.createElement('td');
          fileDescription.textContent = data.matter_description;



          const newColumnCell = document.createElement('td');

          if (selectionState.selectedOptionid == 'Settlement of invoices'
          ) {

            const label = document.createElement('span');
            label.textContent = 'Invoice: ';
            newColumnCell.appendChild(label);

            const newColumnInput = document.createElement("select");
            newColumnInput.style.borderRadius = '10px';

            newColumnInput.setAttribute("multiple", "true");
            newColumnInput.setAttribute("class", 'getSelectpicker showPrint');


            const arroptions = [{ option: 'Select an option', amount: '' }];


            cliobillingData.filter(element => element.matter_display_number === data.filenumber).forEach(element => {
              const displayText = `${element.number}`;
              arroptions.push({ option: displayText, amount: element.total });
            });
            newColumnInput.disabled = arroptions.length === 1;
            newColumnInput.setAttribute("title", 'Select an option');


            if (arroptions.length === 1) {
              newColumnInput.setAttribute("title", 'No invoice found');
              arroptions.pop();
              arroptions.push({ option: 'No invoices found', amount: '' });
            }


            arroptions.forEach(option => {
              const optionElement = document.createElement('option');
              optionElement.value = option.option;
              optionElement.textContent = option.option;
              optionElement.selected = data.reason_of_payment === option.option;
              newColumnInput.appendChild(optionElement);
            });

            newColumnCell.appendChild(newColumnInput);

            const Span = document.createElement('span');
            Span.className = 'hidePrint';

            Span.textContent = ' ';
            newColumnCell.appendChild(Span);

          } else {
            const newColumnInput = document.createElement('input');
            newColumnInput.type = 'text';
            newColumnInput.className = 'form-control';

            // Set the input value conditionally
            const inputValue = data.reference ? data.reference : (data.newColumn || '');
            newColumnInput.setAttribute("value", inputValue);

            // Handle input value change
            newColumnInput.onchange = (e) => {
              e.target.setAttribute("value", e.target.value);
              const newTableData = [...tableData];

              // Update the value in the table data
              newTableData[index].newColumn = e.target.value;
              setTableData(newTableData);
            };

            // Append the input to the column cell
            newColumnCell.appendChild(newColumnInput);
          }


          const amountCell = document.createElement('td');
          const amountInput = document.createElement('input');
          amountInput.type = 'text';
          amountInput.id = `amount-${index}`;
          amountInput.className = 'form-control';
          amountInput.readOnly = taskState.reason_of_payment === 'Settlement of invoices'
          amountInput.setAttribute("value", data.amount || '');

          amountInput.addEventListener('input', function (e) {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
          });

          amountInput.onchange = (e) => {

            e.target.setAttribute("value", e.target.value);
            const newTableData = [...tableData];
            newTableData[index].amount = e.target.value;
            setTableData(newTableData);
            calculateTotal(newTableData);
          };
          amountCell.appendChild(amountInput);

          row.appendChild(clientCell);
          row.appendChild(fileNumberCell);
          row.appendChild(fileDescription);

          row.appendChild(newColumnCell); // Add new column cell to the row
          row.appendChild(amountCell);
          tbody.appendChild(row);
          currentPageRows++;

          if (currentPageRows === rowsPerPage) {
            const pageBreak = document.createElement('tr');
            pageBreak.classList.add('page-break-section'); // Class for print page break
            tbody.appendChild(pageBreak);
            currentPageRows = 0; // Reset the row count
          }

        });

        const totalRow = document.createElement('tr');
        const totalClientCell = document.createElement('td');
        totalClientCell.colSpan = 4; // Update colspan to include new column
        totalClientCell.textContent = 'Total';

        const totalAmountCell = document.createElement('td');
        totalAmountCell.classList.add('totalValue');
        totalAmountCell.textContent = '$' + (taskState.reason_of_payment === 'Settlement of invoices' ? formatNumberWithCommasAndDecimals(totalamountafterReduce) : formatNumberWithCommasAndDecimals(totalAmount));
        totalRow.appendChild(totalClientCell);
        totalRow.appendChild(totalAmountCell);
        tbody.appendChild(totalRow);
      }
    }

    let getSelectpicker = document.getElementsByClassName('getSelectpicker');
    if (getSelectpicker) {
      Array.from(getSelectpicker).forEach((element) => {
        element.style.borderRadius = '10px';
        window.$(element).selectpicker();
      });
    }

  };


  const populateTablewithAreaofPractice = () => {
    const tableElement = document.querySelector('#dynamicTableAreaOfPractice');
    if (tableElement) {
      tableRef.current = tableElement;
      const thead = tableElement.querySelector('thead');
      if (thead) {
        thead.innerHTML = `
          <tr>
            <th>Client</th>
            <th>File Number</th>
            <th>Matter Description</th>
            <th>Area of Law</th>
            <th>Reference</th> 
            <th>Amount</th>
          </tr>
        `;
      }

      if (tableData.length > 2 && tableData.length < 7) {
        let linelength = document.getElementById('section3');
        linelength.classList.add('page-break-section');
      }
      const tbody = tableElement.querySelector('tbody');
      if (tbody) {
        tbody.innerHTML = '';
        tableData.forEach((data, index) => {
          const row = document.createElement('tr');

          const clientCell = document.createElement('td');
          clientCell.textContent = data.client;

          const fileNumberCell = document.createElement('td');
          fileNumberCell.textContent = data.filenumber;

          const fileDescription = document.createElement('td');
          fileDescription.textContent = data.matter_description;

          const AreaofPractice = document.createElement('td');
          AreaofPractice.textContent = data.practice_area_name;



          const newColumnCell = document.createElement('td');

          if (selectionState.selectedOptionid == 'Settlement of invoices'
          ) {

            const label = document.createElement('span');
            label.textContent = 'Invoice: ';
            newColumnCell.appendChild(label);

            const newColumnInput = document.createElement("select");
            newColumnInput.style.borderRadius = '10px';

            newColumnInput.setAttribute("multiple", "true");
            newColumnInput.setAttribute("class", 'getSelectpicker showPrint');


            const arroptions = [{ option: 'Select an option', amount: '' }];


            cliobillingData.filter(element => element.matter_display_number === data.filenumber).forEach(element => {
              const displayText = `${element.number}`;
              arroptions.push({ option: displayText, amount: element.total });
            });
            newColumnInput.disabled = arroptions.length === 1;
            newColumnInput.setAttribute("title", 'Select an option');


            if (arroptions.length === 1) {
              newColumnInput.setAttribute("title", 'No invoice found');
              arroptions.pop();
              arroptions.push({ option: 'No invoices found', amount: '' });
            }


            arroptions.forEach(option => {
              const optionElement = document.createElement('option');
              optionElement.value = option.option;
              optionElement.textContent = option.option;
              optionElement.selected = data.reason_of_payment === option.option;
              newColumnInput.appendChild(optionElement);
            });

            newColumnCell.appendChild(newColumnInput);

            const Span = document.createElement('span');
            Span.className = 'hidePrint';

            Span.textContent = ' ';
            newColumnCell.appendChild(Span);

          } else {
            const newColumnInput = document.createElement('input');
            newColumnInput.type = 'text';
            newColumnInput.className = 'form-control';
            newColumnInput.setAttribute("value", data.newColumn || '');
            newColumnInput.onchange = (e) => {
              e.target.setAttribute("value", e.target.value);
              const newTableData = [...tableData];
              newTableData[index].newColumn = e.target.value;
              setTableData(newTableData);
            };


            newColumnCell.appendChild(newColumnInput);
          }

          const amountCell = document.createElement('td');
          const amountInput = document.createElement('input');
          amountInput.type = 'text';
          amountInput.id = `amount-${index}`;
          amountInput.className = 'form-control';
          amountInput.setAttribute("value", data.amount || '');

          amountInput.addEventListener('input', function (e) {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
          });

          amountInput.onchange = (e) => {

            e.target.setAttribute("value", e.target.value);
            const newTableData = [...tableData];
            newTableData[index].amount = e.target.value;
            setTableData(newTableData);
            calculateTotal(newTableData);
          };
          amountCell.appendChild(amountInput);

          row.appendChild(clientCell);
          row.appendChild(fileNumberCell);
          row.appendChild(fileDescription);
          row.appendChild(AreaofPractice);




          row.appendChild(newColumnCell); // Add new column cell to the row
          row.appendChild(amountCell);
          tbody.appendChild(row);
        });

        const totalRow = document.createElement('tr');
        const totalClientCell = document.createElement('td');
        totalRow.style.backgroundColor = '#e3f3ff';
        totalClientCell.colSpan = 5; // Update colspan to include new column
        totalClientCell.textContent = 'Total';

        const totalAmountCell = document.createElement('td');
        totalAmountCell.classList.add('totalValue');
        totalAmountCell.textContent = '$' + formatNumberWithCommasAndDecimals(totalAmount);
        totalRow.appendChild(totalClientCell);
        totalRow.appendChild(totalAmountCell);
        tbody.appendChild(totalRow);
      }
    }

    let getSelectpicker = document.getElementsByClassName('getSelectpicker');
    if (getSelectpicker) {
      Array.from(getSelectpicker).forEach((element) => {
        element.style.borderRadius = '10px';
        window.$(element).selectpicker();
      });
    }

  };


  const dynamicTablebankingwithdrawal = () => {
    const tableElement = document.querySelector('#dynamicTablebankingwithdrawal');
    if (tableElement) {
      tableRef.current = tableElement;
      const thead = tableElement.querySelector('thead');
      if (thead) {
        thead.innerHTML = `
          <tr>
            <th>Client</th>
            <th>Matter Number</th>
            <th>Method of Withdrawal</th> 
            <th>Recipient Name</th>
          </tr>
        `;
      }
      const tbody = tableElement.querySelector('tbody');
      if (tbody) {
        tbody.innerHTML = '';
        tableData.forEach((data, index) => {
          const row = document.createElement('tr');

          const clientCell = document.createElement('td');
          clientCell.textContent = data.client;

          const fileNumberCell = document.createElement('td');
          fileNumberCell.textContent = data.filenumber;




          const newColumnCell = document.createElement('td');

          if (selectionState.selectedOptionid == 'Settlement of invoices'
          ) {

            const label = document.createElement('span');
            label.textContent = 'Invoice: ';
            newColumnCell.appendChild(label);

            const newColumnInput = document.createElement("select");
            newColumnInput.style.borderRadius = '10px';

            newColumnInput.setAttribute("multiple", "true");
            newColumnInput.setAttribute("class", 'getSelectpicker showPrint');


            const arroptions = [{ option: 'Select an option', amount: '' }];


            cliobillingData.filter(element => element.matter_display_number === data.filenumber).forEach(element => {
              const displayText = `${element.number}`;
              arroptions.push({ option: displayText, amount: element.total });
            });
            newColumnInput.disabled = arroptions.length === 1;
            newColumnInput.setAttribute("title", 'Select an option');


            if (arroptions.length === 1) {
              newColumnInput.setAttribute("title", 'No invoice found');
              arroptions.pop();
              arroptions.push({ option: 'No invoices found', amount: '' });
            }


            arroptions.forEach(option => {
              const optionElement = document.createElement('option');
              optionElement.value = option.option;
              optionElement.textContent = option.option;
              optionElement.selected = data.reason_of_payment === option.option;
              newColumnInput.appendChild(optionElement);
            });

            newColumnCell.appendChild(newColumnInput);

            const Span = document.createElement('span');
            Span.className = 'hidePrint';

            Span.textContent = ' ';
            newColumnCell.appendChild(Span);

          } else {
            const newColumnInput = document.createElement('input');
            newColumnInput.type = 'text';
            newColumnInput.className = 'form-control';
            newColumnInput.setAttribute("value", data.newColumn || '');
            newColumnInput.onchange = (e) => {
              e.target.setAttribute("value", e.target.value);
              const newTableData = [...tableData];
              newTableData[index].newColumn = e.target.value;
              setTableData(newTableData);
            };


            newColumnCell.appendChild(newColumnInput);
          }

          const amountCell = document.createElement('td');
          const amountInput = document.createElement('input');
          amountInput.type = 'text';
          amountInput.id = `amount-${index}`;
          amountInput.className = 'form-control';
          amountInput.setAttribute("value", data.amount || '');


          amountInput.onchange = (e) => {

            e.target.setAttribute("value", e.target.value);
            const newTableData = [...tableData];
            newTableData[index].amount = e.target.value;
            setTableData(newTableData);
            calculateTotal(newTableData);
          };
          amountCell.appendChild(amountInput);

          row.appendChild(clientCell);
          row.appendChild(fileNumberCell);

          row.appendChild(newColumnCell); // Add new column cell to the row
          row.appendChild(amountCell);
          tbody.appendChild(row);
        });


      }
    }

    let getSelectpicker = document.getElementsByClassName('getSelectpicker');
    if (getSelectpicker) {
      Array.from(getSelectpicker).forEach((element) => {
        element.style.borderRadius = '10px';
        window.$(element).selectpicker();
      });
    }

  };


  //   const populdatefinancialdetailsTable = () => {
  //     const tableElement = document.querySelector('#financial_details_tbl');

  //   const createTableWithHeader = () => {
  //     const thead = tableElement.querySelector('thead');
  //     thead.innerHTML = `
  //         <tr>
  //             <th>Client</th>
  //             <th>File Number</th>
  //             <th>Nature of matter</th>
  //             <th>Date Received (mm/dd/yyyy)</th>
  //             <th>Amount</th>
  //         </tr>
  //     `;
  //     return thead;
  // };


  //     if (tableElement) {
  //       tableRef.current = tableElement;
  //        const tbody = tableElement.querySelector('tbody');
  //         tableElement.appendChild(createTableWithHeader());
  //         tableElement.appendChild(tbody);

  //       if (tbody) {
  //         tbody.innerHTML = '';
  //         tableData.forEach((data, index) => {
  //           const row = document.createElement('tr');

  //           const clientCell = document.createElement('td');
  //           clientCell.textContent = data.client;

  //           const fileNumberCell = document.createElement('td');
  //           fileNumberCell.textContent = data.filenumber;

  //           const fileDescription = document.createElement('td');
  //           const SelectforNatureofMatter = document.createElement("select");
  //           SelectforNatureofMatter.style.borderRadius = '10px';



  //           const optionElementSelectforNatureofMatter2 = document.createElement('option');
  //           optionElementSelectforNatureofMatter2.value = 'select an option';
  //           //  optionElementSelectforNatureofMatter2.disabled = true;
  //           optionElementSelectforNatureofMatter2.textContent = 'select an option';
  //           SelectforNatureofMatter.appendChild(optionElementSelectforNatureofMatter2);


  //           sectionA.nature_of_matter.forEach((element) => {
  //             const optionElementSelectforNatureofMatter = document.createElement('option');
  //             optionElementSelectforNatureofMatter.value = element;
  //             optionElementSelectforNatureofMatter.textContent = element;
  //             SelectforNatureofMatter.appendChild(optionElementSelectforNatureofMatter);

  //           })



  //           fileDescription.appendChild(SelectforNatureofMatter);



  //           const newColumnCell = document.createElement('td');

  //           const newColumnInput = document.createElement('input');
  //           newColumnInput.type = 'date';
  //           newColumnInput.id = "dateInput";
  //           newColumnInput.placeholder = "select date...";

  //           newColumnInput.className = 'form-control';
  //           newColumnInput.setAttribute("value", data.newColumn || '');
  //           newColumnInput.onchange = (e) => {
  //             e.target.setAttribute("value", e.target.value);
  //             const newTableData = [...tableData];
  //             newTableData[index].newColumn = e.target.value;
  //             setTableData(newTableData);
  //           };


  //           newColumnCell.appendChild(newColumnInput);


  //           const amountCell = document.createElement('td');
  //           const amountInput = document.createElement('input');
  //           amountInput.type = 'text';
  //           amountInput.id = `amount-${index}`;
  //           amountInput.className = 'form-control';
  //           amountInput.setAttribute("value", data.amount || '');

  //           amountInput.addEventListener('input', function (e) {
  //             e.target.value = e.target.value.replace(/[^0-9]/g, '');
  //           });

  //           amountInput.onchange = (e) => {

  //             e.target.setAttribute("value", e.target.value);
  //             const newTableData = [...tableData];
  //             newTableData[index].amount = e.target.value;
  //             setTableData(newTableData);
  //             calculateTotal(newTableData);
  //           };
  //           amountCell.appendChild(amountInput);

  //           row.appendChild(clientCell);
  //           row.appendChild(fileNumberCell);
  //           row.appendChild(fileDescription);

  //           row.appendChild(newColumnCell); // Add new column cell to the row
  //           row.appendChild(amountCell);
  //           tbody.appendChild(row);
  //         });

  //         const totalRow = document.createElement('tr');
  //         const totalClientCell = document.createElement('td');
  //         totalClientCell.colSpan = 4; // Update colspan to include new column
  //         totalClientCell.textContent = 'Total';

  //         const totalAmountCell = document.createElement('td');
  //         totalAmountCell.classList.add('totalValue');
  //         totalAmountCell.textContent = formatNumberWithCommasAndDecimals(totalAmount);
  //         totalRow.appendChild(totalClientCell);
  //         totalRow.appendChild(totalAmountCell);
  //         tbody.appendChild(totalRow);
  //       }
  //     }

  //     flatpickr('#dateInput', {
  //       dateFormat: 'm-d-Y',
  //     });

  //   }

  const populdatefinancialdetailsTable = () => {
    const tableElement = document.querySelector('#financial_details_tbl');
    const firstPageRows = 6; // Limit for the first page

    // Helper function to create table header
    const createTableWithHeader = () => {
      const thead = document.createElement('thead');
      thead.innerHTML = `
            <tr>
                <th>Client</th>
                <th>File Number</th>
                <th>Nature of matter</th>
                <th>Date Received (mm/dd/yyyy)</th>
                <th>Amount</th>
            </tr>
        `;
      return thead;
    };

    // Clear the existing table (if any)
    if (tableElement) {
      tableElement.innerHTML = ''; // Clear the existing table content
      const tbody = document.createElement('tbody');
      tableElement.appendChild(createTableWithHeader());
      tableElement.appendChild(tbody);

      let currentPageRows = 0;

      tableData.forEach((data, index) => {
        // Create a new row
        const row = document.createElement('tr');

        const clientCell = document.createElement('td');
        clientCell.textContent = data.client;

        const fileNumberCell = document.createElement('td');
        fileNumberCell.textContent = data.filenumber;

        const fileDescription = document.createElement('td');
        const SelectforNatureofMatter = document.createElement('select');
        SelectforNatureofMatter.style.borderRadius = '10px';

        const optionElementSelectforNatureofMatter2 = document.createElement('option');
        optionElementSelectforNatureofMatter2.value = 'select an option';
        optionElementSelectforNatureofMatter2.textContent = 'select an option';
        SelectforNatureofMatter.appendChild(optionElementSelectforNatureofMatter2);

        sectionA.nature_of_matter.forEach((element) => {
          const optionElementSelectforNatureofMatter = document.createElement('option');
          optionElementSelectforNatureofMatter.value = element;
          optionElementSelectforNatureofMatter.textContent = element;
          SelectforNatureofMatter.appendChild(optionElementSelectforNatureofMatter);
        });

        fileDescription.appendChild(SelectforNatureofMatter);

        const newColumnCell = document.createElement('td');
        const newColumnInput = document.createElement('input');
        newColumnInput.type = 'date';
        newColumnInput.className = 'form-control';
        newColumnInput.placeholder = "select date...";
        newColumnInput.setAttribute('value', data.newColumn || '');
        newColumnInput.onchange = (e) => {
          e.target.setAttribute("value", e.target.value);
          const newTableData = [...tableData];
          newTableData[index].newColumn = e.target.value;
          setTableData(newTableData);
        };
        newColumnCell.appendChild(newColumnInput);

        const amountCell = document.createElement('td');
        const amountInput = document.createElement('input');
        amountInput.type = 'text';
        amountInput.id = `amount-${index}`;
        amountInput.className = 'form-control';
        amountInput.setAttribute('value', data.amount || '');
        amountInput.addEventListener('input', function (e) {
          e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
        amountInput.onchange = (e) => {
          e.target.setAttribute("value", e.target.value);
          const newTableData = [...tableData];
          newTableData[index].amount = e.target.value;
          setTableData(newTableData);
          calculateTotal(newTableData);
        };
        amountCell.appendChild(amountInput);

        // Append cells to the row
        row.appendChild(clientCell);
        row.appendChild(fileNumberCell);
        row.appendChild(fileDescription);
        row.appendChild(newColumnCell);
        row.appendChild(amountCell);

        tbody.appendChild(row);
        currentPageRows++;

        // Apply page-break logic for print (break after 5 rows)
        if (currentPageRows === firstPageRows || currentPageRows > 19) {
          const pageBreak = document.createElement('tr');
          pageBreak.classList.add('page-break-section'); // Adding class to identify the page break
          tbody.appendChild(pageBreak);
        }
      });

      // Append total row to the last table
      const totalRow = document.createElement('tr');
      const totalClientCell = document.createElement('td');
      totalClientCell.colSpan = 4; // Update colspan to include new column
      totalClientCell.textContent = 'Total';

      const totalAmountCell = document.createElement('td');
      totalAmountCell.classList.add('totalValue');
      totalAmountCell.textContent = '$' + formatNumberWithCommasAndDecimals(totalAmount);
      totalRow.appendChild(totalClientCell);
      totalRow.appendChild(totalAmountCell);
      tbody.appendChild(totalRow);
    }

    // Initialize date picker for all date inputs
    flatpickr('.form-control[type="date"]', {
      dateFormat: 'm-d-Y',
    });
  };




  // const populatetableCorrespondingreasons = () => {
  //   const tableElement = document.querySelector('#corresponding_reason_tbl');
  //   if (tableElement) {
  //     tableRef.current = tableElement;
  //     const thead = tableElement.querySelector('thead');
  //     if (thead) {
  //       thead.innerHTML = `
  //         <tr>
  //           <th>Reason</th>
  //           <th>Explanation of Other</th>
  //         </tr>
  //       `;
  //     }
  //     const tbody = tableElement.querySelector('tbody');
  //     if (tbody) {
  //       // Clear the existing table body content
  //       tbody.innerHTML = '';

  //       // Iterate over the tableData to create rows
  //       tableData.forEach((data, index) => {
  //         // Create a new table row
  //         const row = document.createElement('tr');

  //         // Create the client cell with a select element
  //         const clientCell = document.createElement('td');
  //         const selectForNatureOfMatter = document.createElement('select');
  //         selectForNatureOfMatter.style.borderRadius = '10px';

  //         // Create and append the default option to the select element
  //         const defaultOption = document.createElement('option');
  //         defaultOption.value = 'select an option';
  //         defaultOption.textContent = 'select an option';
  //         selectForNatureOfMatter.appendChild(defaultOption);

  //         // Populate the select element with options from sectionA.corresponding_reasons
  //         sectionA.corresponding_reasons.forEach((element) => {
  //           const optionElement = document.createElement('option');
  //           optionElement.value = element;
  //           optionElement.textContent = element;
  //           selectForNatureOfMatter.appendChild(optionElement);
  //         });

  //         // Append the select element to the client cell
  //         clientCell.appendChild(selectForNatureOfMatter);

  //         // Create the file number cell with an input element
  //         const fileNumberCell = document.createElement('td');
  //         const newColumnInput = document.createElement('input');
  //         newColumnInput.type = 'text';
  //         newColumnInput.className = 'form-control';
  //         newColumnInput.id = 'corresponding_input';

  //         newColumnInput.setAttribute('value', '');

  //         // Update the value attribute on change
  //         newColumnInput.onchange = (e) => {
  //           e.target.setAttribute('value', e.target.value);
  //         };

  //         // Append the input element to the file number cell
  //         fileNumberCell.appendChild(newColumnInput);

  //         // Append the cells to the row
  //         row.appendChild(clientCell);
  //         row.appendChild(fileNumberCell);

  //         // Append the row to the table body
  //         tbody.appendChild(row);
  //       });
  //     }


  //   }
  // }

  const populatetableCorrespondingreasons = () => {
    const tableElement = document.querySelector('#corresponding_reason_tbl');
    const rowsPerPage = 12; // Limit rows per page for print

    const createTableWithHeader = () => {
      const thead = document.createElement('thead');
      thead.innerHTML = `
            <tr>
                <th>Reason</th>
                <th>Explanation of Other</th>
            </tr>
        `;
      return thead;
    };

    if (tableElement) {
      tableElement.innerHTML = ''; // Clear existing content
      const tbody = document.createElement('tbody');
      tableElement.appendChild(createTableWithHeader());
      tableElement.appendChild(tbody);

      let currentPageRows = 0;
      if (tableData.length == 2) {
        tableElement.nextElementSibling.classList.add('page-break-section');
      }

      // Iterate over tableData to create rows
      tableData.forEach((data, index) => {
        const row = document.createElement('tr');

        // Reason cell with a select element
        const clientCell = document.createElement('td');
        const selectForNatureOfMatter = document.createElement('select');
        selectForNatureOfMatter.style.borderRadius = '10px';

        // Default option for select
        const defaultOption = document.createElement('option');
        defaultOption.value = 'select an option';
        defaultOption.textContent = 'select an option';
        selectForNatureOfMatter.appendChild(defaultOption);

        // Populate the select with options from sectionA.corresponding_reasons
        sectionA.corresponding_reasons.forEach((element) => {
          const optionElement = document.createElement('option');
          optionElement.value = element;
          optionElement.textContent = element;
          selectForNatureOfMatter.appendChild(optionElement);
        });

        clientCell.appendChild(selectForNatureOfMatter);

        // Explanation cell with an input element
        const fileNumberCell = document.createElement('td');
        const newColumnInput = document.createElement('input');
        newColumnInput.type = 'text';
        newColumnInput.className = 'form-control';
        newColumnInput.id = `corresponding_input_${index}`;

        newColumnInput.setAttribute('value', '');

        // Update value on change
        newColumnInput.onchange = (e) => {
          e.target.setAttribute('value', e.target.value);
        };

        fileNumberCell.appendChild(newColumnInput);

        // Append cells to the row
        row.appendChild(clientCell);
        row.appendChild(fileNumberCell);

        // Append the row to the table body
        tbody.appendChild(row);
        currentPageRows++;

        // Apply page-break logic for print (break after 12 rows)
        if (currentPageRows === rowsPerPage) {
          const pageBreak = document.createElement('tr');
          pageBreak.classList.add('page-break-section'); // Adding class to identify the page break
          tbody.appendChild(pageBreak);
          currentPageRows = 0; // Reset the row count after the break
        }
      });
    }
  };





  const TransferDetailsMatterToMatter = () => {
    const tableElement = document.querySelector('#Transfer_details_matter_to_matter');
    // sectionCLawyer

    if (tableElement) {
      tableRef.current = tableElement;
      const thead = tableElement.querySelector('thead');
      if (thead) {
        thead.innerHTML = `
          <tr>
            <th>Client</th>
            <th>Source Matter Number</th>
            <th>Destination Client</th>
            <th>Destination Matter Number</th>
            <th>Reason for Transfer</th> 
            <th>Amount</th>
          </tr>
        `;
      }
      const tbody = tableElement.querySelector('tbody');
      if (tbody) {
        tbody.innerHTML = '';
        tableData.forEach((data, index) => {
          const row = document.createElement('tr');

          const clientCell = document.createElement('td');
          clientCell.textContent = data.client;






          const filenewCell = document.createElement('td');
          filenewCell.textContent = data.filenumber;


          const clientlistCell = document.createElement('td');



          let allclientCell = document.createElement('select');
          const clientoptions = document.createElement('option');
          clientoptions.value = 'Select an option';
          clientoptions.textContent = 'Select an option';
          allclientCell.appendChild(clientoptions);
          allclientCell.id = 'clientlistdropdown';


          allclientwithdetails.forEach((item, index) => {
            const option = document.createElement('option');
            option.value = item.client_id;
            option.textContent = item.client_name;
            allclientCell.appendChild(option);
          });

          clientlistCell.appendChild(allclientCell)


          const fileNumberCell = document.createElement('td');

          let destinationSoureFile = document.createElement('select');
          const option = document.createElement('option');
          option.value = 'Select an option';
          option.textContent = 'Select an option';
          destinationSoureFile.appendChild(option);

          const newColumnCell = document.createElement('td');

          if (selectionState.selectedOptionid == 'Settlement of invoices') {

            const label = document.createElement('span');
            label.textContent = 'Invoice: ';
            newColumnCell.appendChild(label);

            const newColumnInput = document.createElement("select");
            newColumnInput.style.borderRadius = '10px';

            newColumnInput.setAttribute("multiple", "true");
            newColumnInput.setAttribute("class", 'getSelectpicker showPrint');


            const arroptions = [{ option: 'Select an option', amount: '' }];


            cliobillingData.filter(element => element.matter_display_number === data.filenumber).forEach(element => {
              const displayText = `${element.number}`;
              arroptions.push({ option: displayText, amount: element.total });
            });
            newColumnInput.disabled = arroptions.length === 1;
            newColumnInput.setAttribute("title", 'Select an option');


            if (arroptions.length === 1) {
              newColumnInput.setAttribute("title", 'No invoice found');
              arroptions.pop();
              arroptions.push({ option: 'No invoices found', amount: '' });
            }


            arroptions.forEach(option => {
              const optionElement = document.createElement('option');
              optionElement.value = option.option;
              optionElement.textContent = option.option;
              optionElement.selected = data.reason_of_payment === option.option;
              newColumnInput.appendChild(optionElement);
            });

            newColumnCell.appendChild(newColumnInput);

            const Span = document.createElement('span');
            Span.className = 'hidePrint';

            Span.textContent = ' ';
            newColumnCell.appendChild(Span);

          } else {
            const newColumnInput = document.createElement('input');
            newColumnInput.type = 'text';
            newColumnInput.className = 'form-control';
            newColumnInput.setAttribute("value", data.newColumn || '');
            newColumnInput.onchange = (e) => {
              e.target.setAttribute("value", e.target.value);
              const newTableData = [...tableData];
              newTableData[index].newColumn = e.target.value;
              setTableData(newTableData);
            };


            newColumnCell.appendChild(newColumnInput);
          }

          const amountCell = document.createElement('td');
          const amountInput = document.createElement('input');
          amountInput.type = 'text';
          amountInput.id = `amount-${index}`;
          amountInput.className = 'form-control';
          amountInput.setAttribute("value", data.amount || '');

          amountInput.addEventListener('input', function (e) {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
          });

          amountInput.onchange = (e) => {

            e.target.setAttribute("value", e.target.value);
            const newTableData = [...tableData];
            newTableData[index].amount = e.target.value;
            setTableData(newTableData);
            calculateTotal(newTableData);
          };
          // satrt from here
          allclientCell.addEventListener('change', (event) => {
            const selectedClientId = event.target.value;
            console.log('selectedClientId', selectedClientId);

            if (selectedClientId !== 'Select an option') {
              // Call your API based on the selected client ID

              axios.get(`/matterdisplayNumber/${getUserSID()}/${selectedClientId}`).then((res) => {
                console.log('checkresClojgifgg', res);
                destinationSoureFile.innerHTML = '';
                const newDefaultOption = document.createElement('option');
                newDefaultOption.value = 'Select an option';
                newDefaultOption.textContent = 'Select an option';
                destinationSoureFile.appendChild(newDefaultOption);

                res.data.data.body.forEach((item) => {
                  const option = document.createElement('option');
                  option.value = item.matter_display_nbr;
                  option.textContent = item.matter_display_nbr;
                  destinationSoureFile.appendChild(option);
                });


              }).catch((err) => {
                console.log('getclienjngt', err);
              });

            }
          });


          fileNumberCell.appendChild(destinationSoureFile)
          amountCell.appendChild(amountInput);

          row.appendChild(clientCell);
          row.appendChild(filenewCell);
          row.appendChild(clientlistCell);
          row.appendChild(fileNumberCell);
          row.appendChild(newColumnCell);
          row.appendChild(amountCell);
          tbody.appendChild(row);
        });

        const totalRow = document.createElement('tr');
        const totalClientCell = document.createElement('td');
        totalRow.style.backgroundColor = '#e3f3ff';
        totalClientCell.colSpan = 5; // Update colspan to include new column
        totalClientCell.textContent = 'Total';

        const totalAmountCell = document.createElement('td');
        totalAmountCell.classList.add('totalValue');
        totalAmountCell.textContent = '$' + formatNumberWithCommasAndDecimals(totalAmount);
        totalRow.appendChild(totalClientCell);
        totalRow.appendChild(totalAmountCell);
        tbody.appendChild(totalRow);
      }
    }

    let getSelectpicker = document.getElementsByClassName('getSelectpicker');
    if (getSelectpicker) {
      Array.from(getSelectpicker).forEach((element) => {
        element.style.borderRadius = '10px';
        window.$(element).selectpicker();
      });
    }

  };



  window.$(document).on('changed.bs.select', '.getSelectpicker', function (event) {

    if (event.target.id === 'reason_of_payment') {
      var element = window.$(this);
      var selected = window.$(this).val();

      var targetPAyuemnt = document.getElementById('ResionOFPayment')

      let selectedValues = [];
      selected.forEach((input) => {
        if (input) {
          selectedValues.push(input);
        }
      });

      let aggregatedValues = selectedValues.join(' ,');
      targetPAyuemnt.textContent = aggregatedValues;




      setTimeout(function () {
        element.find('option').each(function () {
          if (selected.includes(this.value)) {
            window.$(this).attr('selected', true);
          } else {
            window.$(this).removeAttr('selected');
          }
        });
      }, 100);

    } else {

      var element = window.$(this);
      var selected = window.$(this).val();


      var inputs = event.target.closest('tbody').querySelectorAll('select');
      var inputAmount = event.target.closest('tbody').querySelectorAll('input');
      var inputSpan = event.target.closest('tbody').querySelectorAll('span.hidePrint');


      let selectedValues = [];
      selected.forEach((input) => {
        if (input) {
          selectedValues.push(input);
        }
      });

      let aggregatedValues = selectedValues.join(' ,');

      let selectIndex = Array.from(inputs).indexOf(event.target);

      if (inputSpan[selectIndex]) {
        inputSpan[selectIndex].textContent = aggregatedValues;
      }

      var Alltotal = 0;

      if (selected.length === 0) {
        const selectedIndex = Array.from(inputs).indexOf(event.target);
        if (selectedIndex !== -1) {
          let currentInput = inputAmount[selectedIndex];
          currentInput.setAttribute("value", Number(Alltotal)); // Assuming 'total' is defined elsewhere in your code
        }
      } else {
        selected.forEach((value, index) => {
          let checkSAmount = clioBillingforAfterSave.filter(element => selected.includes(element.number));

          let total = checkSAmount.reduce((acc, item) => acc + Number(item.total), 0);
          if (checkSAmount.length > 0) {
            const selectedIndex = Array.from(inputs).indexOf(event.target);

            if (selectedIndex !== -1) {
              let currentInput = inputAmount[selectedIndex];
              currentInput.setAttribute("value", total);
            }
          }
        });
      }


      var inputs = event.target.closest('tbody').querySelectorAll('input');
      inputs.forEach(function (input) {
        input.setAttribute("value", input.value);
        if (input.id.includes('amount')) {
          Alltotal += Number(input.value || 0);
        }
      });

      var totalValueElements = document.getElementsByClassName('totalValue');
      for (var i = 0; i < totalValueElements.length; i++) {
        totalValueElements[i].textContent = '$' + formatNumberWithCommasAndDecimals(Alltotal);
      }
      var totalValueInput = document.querySelector('.totalValueInput');
      if (totalValueInput) {
        totalValueInput.textContent = '$' + formatNumberWithCommasAndDecimals(Alltotal);
      }


      // setTimeout(function () {
      //   for (var i = 0; i < selected.length; i++) {
      //     element.find('option[value="' + selected[i] + '"]').attr('selected', true);
      //   }
      // }, 100);

      setTimeout(function () {
        element.find('option').each(function () {
          if (selected.includes(this.value)) {
            window.$(this).attr('selected', true);
          } else {
            window.$(this).removeAttr('selected');
          }
        });
      }, 100);



    }



  });



  if (!newForm) {
    window.$('.bootstrap-select + .dropdown-toggle').remove();
    window.$('.bootstrap-select + .dropdown-menu').remove();
    window.$('.getSelectpicker').selectpicker('destroy');
    window.$('.getSelectpicker').selectpicker();
    window.$("td>.bootstrap-select>.bootstrap-select").unwrap();
    window.$("td>button, td>.dropdown-menu").remove();
  }


  useEffect(() => {
    if (newForm || selectionState.selectedOptionid == 'Settlement of invoices'
      || selectionState.selectedOptionid == 'Return to client funds'
      || selectionState.selectedOptionid == 'Payment to third party'
      || selectionState.selectedOptionid == 'Other'
      || selectionState.selectedOptionid == 'Select an option'
    ) {
      populateTable();
    }
  }, [
    cliobillingData,
    newForm,
    selectionState.selectedOptionid
  ]);


  if (!newForm) {
    document.addEventListener('change', function (event) {

      // corresponding_input

      if (event.target.matches('table input')) {

        var total = 0;

        var inputs = event.target.closest('tbody').querySelectorAll('input');
        inputs.forEach(function (input) {
          input.setAttribute("value", input.value);
          if (input.id.includes('amount')) {
            total += Number(input.value || 0);
          }
        });
        if (event.target.id !== 'corresponding_input') {
          var totalValueElements = document.getElementsByClassName('totalValue');

          for (var i = 0; i < totalValueElements.length; i++) {
            totalValueElements[i].textContent = '$' + formatNumberWithCommasAndDecimals(total);
          }

          var totalValueInput = document.querySelector('.totalValueInput');
          if (totalValueInput) {
            totalValueInput.textContent = '$' + formatNumberWithCommasAndDecimals(total);
          }
        }
      }
    });
  }


  const calculateTotal = (newTableData) => {
    const total = newTableData.reduce((acc, item) => {
      const amount = parseFloat(item.amount) || 0;
      return acc + amount;
    }, 0);
    setTotalAmount(total);
    const totalUpperCase = document.querySelector('.totalValueInput');
    if (totalUpperCase) {
      totalUpperCase.textContent = '$' + formatNumberWithCommasAndDecimals(total);
    }
    setSectionA(prev => ({
      ...prev,
      totalAmounttbl: formatNumberWithCommasAndDecimals(total)
    }));
  };

  useEffect(() => {

    manageRequisition()
    populateTableData()

    let result = getLayoutTitle(step);

    setSectionA((prev) => ({
      ...prev,
      FormTitle: result
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const handlePrint = useReactToPrint({
    content: () => formTarget.current,
    documentTitle: sectionA.FormTitle,

    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
      body {
        margin: 0;
      }
    `,
  });

  const getAccountDeatils = () => {
    axios.get(`/clio-account-details/${parseInt(taskState.clio_trust_account)}/${getUserSID()}`
    ).then((res) => {
      console.log('checkAccountDeatilsClio', res.data.data.body);
      if (res.data.data.body.length > 0) {

        let trustAccountToBeDebited = document.getElementById('trustAccountToBeDebited');

        if (trustAccountToBeDebited) {

          trustAccountToBeDebited.textContent = res.data.data.body[0].account_name;
        }

        let nameOfFinancialInst = document.getElementById('nameOffinancialinstitution');
        if (nameOfFinancialInst) {
          nameOfFinancialInst.textContent = res.data.data.body[0].bank_name;
        }

        let nameOfFinancialInst2 = document.getElementById('nameOffinancialinstitution-2');
        if (nameOfFinancialInst2) {
          nameOfFinancialInst2.textContent = res.data.data.body[0].bank_name;
        }

        let accountNumber = document.getElementById('accountNumberfirst');
        if (accountNumber) {
          accountNumber.textContent = res.data.data.body[0].account_number;
        }

        let transitNUmber = document.getElementById('transitNumber');
        if (transitNUmber) {
          transitNUmber.textContent = res.data.data.body[0].transit_number;
        }

        let branch_address = document.getElementById('branch_address');
        if (branch_address) {
          branch_address.textContent = res.data.data.body[0].branch_address;
        }
      } else {
        console.error('No data found for the account')
      }
    }).catch((err) => {
      toast.error('something went wrong in get clio-account-details')
    }).finally((err) => {
    })

  }

  const manageRequisition = () => {
    const currentDate = getCurrentDate();
    const { id } = taskState;
    let count = 1;
    let complianceForms = Cookies.get("complianceForms");
    if (complianceForms) {
      complianceForms = JSON.parse(complianceForms);
      complianceForms = complianceForms.filter(form => form.formDate === currentDate);
      Cookies.set("complianceForms", JSON.stringify(complianceForms));
      count = complianceForms.length + 1;
    } else {
      complianceForms = [];
    }

    let formExists = complianceForms.find(form => form.formid === id);

    if (formExists) {
      const { sid, formid, requisition, formDate, formCount } = formExists;
      if (formid === id && currentDate === formDate && sid === getUserSID()) {
        setSectionA(prev => ({
          ...prev,
          requisition: requisition.replace(' ', '')
        }));
      } else if (formid === id && currentDate !== formDate && sid === getUserSID()) {
        setSectionA(prev => ({
          ...prev,
          requisition: (`${requisition}001`).replace(' ', '')
        }));
        formExists.formDate = currentDate;
        formExists.formCount = 1;
      } else if (formid === id && currentDate === formDate && sid !== getUserSID()) {
        setSectionA(prev => ({
          ...prev,
          requisition: (`${generateUniqueIdentifier()}001`).replace(' ', '')
        }));
        formExists.sid = getUserSID();
        formExists.formCount = 1;
      } else if (formid !== id && currentDate === formDate && sid === getUserSID()) {
        const newFormCount = (parseInt(formCount, 10) + 1).toString().padStart(3, '0');
        setSectionA(prev => ({
          ...prev,
          requisition: (`${generateUniqueIdentifier()}${newFormCount}`).replace(' ', '')
        }));
        formExists.formCount = newFormCount;
      }
    } else {
      const newRequisition = `${generateUniqueIdentifier()}00${count}`;
      setSectionA(prev => ({
        ...prev,
        requisition: newRequisition.replace(' ', '')
      }));
      complianceForms.push({
        sid: getUserSID(),
        formid: id,
        requisition: newRequisition.replace(' ', ''),
        formDate: currentDate,
        formCount: 1
      });
    }
    // Update the cookies
    Cookies.set("complianceForms", JSON.stringify(complianceForms));
  }

  const populateTableData = () => {
    console.log("taskState.client_files_details", taskState.client_files_details);
    let totalAmount = 0
    let modifyyinto = JSON.parse(taskState.client_files_details).flatMap((entry) => {
      console.log("entryOfamunt", entry);
      const client = entry.client.client_name;
      const practice_area_name = entry.client.practice_area_name
      return entry.fileNumber.map((file, index) => ({
        client_id: entry.client.client_id,
        client: client,
        filenumber: file.matter_display_nbr,
        matter_description: file.matter_description,
        practice_area_name: practice_area_name,
        amount: file.amount,
        // totalAmount : totalAmount += file.amount
        reference: entry.client.reference && `Bill No. ${entry.client.reference}`
      }));
    })
    setTableData(modifyyinto);
  }

  const handleDownloadClick = () => {
    handlePrint();
  }

  const handleSaveClick = (key) => {
    setLoadingApprover((prev) => ({
      ...prev,
      saveForm: true
    }))
    let data = {
      sid: getUserSID(),
      uid: getUserId(),
      content: formTarget.current.innerHTML,
      task_id: taskState.id,
      pdfname: sectionA.FormTitle,
      bucket: `cloudact-${getShortFirmname().toLowerCase()}`
    }
    axios.post('/save_complienceform', data).then((res) => {
      window.location.reload();
    }).catch((err) => {
    }).finally((err) => {
      setLoadingApprover((prev) => ({
        ...prev,
        saveForm: false
      }))
    })
  }

  // Function to handle sign off
  const handleSignOFFHandler = (identity) => {
    // Set the corresponding loader to true
    if (identity == 'prepar') {
      setLoadingApprover((prev) => ({
        ...prev,
        [`${identity}erLoader`]: true,
      }));

    } else {
      setLoadingApprover((prev) => ({
        ...prev,
        [`${identity}Loader`]: true,
      }));

      //asssign sign when signoff by approver
      let signature = document.getElementById('signature');

      if (signature && getUserProfileInfo().signature) {
        signature.innerHTML =
          `<img src="${getUserProfileInfo().signature}" alt="Signature" width="200" height="50" />`;
      }
    }

    // Prepare the data to be sent in the request
    const data = {
      sid: getUserSID(),
      uid: getUserId(),
      task_id: taskState.id,
      identity: identity
    }

    // Make a PUT request to the signoff endpoint
    axios.put('/complianceForm/signoff', data)
      .then((res) => {

        const personAuthorizingElement = document.getElementById(`task_${identity}er_signoff_date`);
        if (personAuthorizingElement) {
          personAuthorizingElement.textContent = momentFunction.formatDate(new Date().toISOString());
        }
        // On successful response, update the signoff date and status
        setSectionA((prev) => ({
          ...prev,

          [`task_${identity}er_signoff_date`]: new Date().toISOString(),
          [`task_${identity}er_signoff`]: 1
        }));

        handleSaveClick('loader')
      })
      .catch((error) => {
        toast.error('Preparer must sign off before approver can proceed');
      })
      .finally((err) => {
        // Regardless of success or failure, set the loaders to false
        setLoadingApprover((prev) => ({
          ...prev,
          approverLoader: false,
          preparerLoader: false,
        }));
      })
  }

  useEffect(() => {
    getComplianceDataafterChange()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionA.task_approverer_signoff, sectionA.task_preparer_signoff,
  sectionA.task_approverer_signoff_date, sectionA.task_preparer_signoff_date])

  const getComplianceDataafterChange = async () => {
    try {
      const body = await axios.get(`/getsinglecompliance/${taskState.id}`);
      if (body?.data?.data?.body?.length > 0) {
        setSectionA((prev) => ({
          ...prev,
          task_approverer_signoff: body.data.data.body[0].task_approverer_signoff,
          task_approverer_signoff_date: body.data.data.body[0].task_approverer_signoff_date,
          task_preparer_signoff: body.data.data.body[0].task_preparer_signoff,
          task_preparer_signoff_date: body.data.data.body[0].task_preparer_signoff_date
        }));
      } else {
        toast.error('No data found');
      }
    } catch (error) {
      toast.error('error occureed', error);
    }
  }

  // Component to display the sign off date
  const SignOffDate = ({ date, title }) => (
    date !== '0000-00-00 00:00:00' &&
    <div className="signoff-date" style={{ color: "green" }}>
      {/* {title} */}
      Sign Off Done at {momentFunction.formatDate(date)}
    </div>
  );

  // Component to display a button with a loader
  const ButtonWithLoader = ({ isLoading, onClick, text, disabled }) => (
    <button className="btn btnPrimary btn-sm mb-2" disabled={disabled} onClick={onClick}>
      {isLoading ?
        <>
          <i class="fa fa-refresh fa-spin " style={{ marginRight: '5px' }}></i>
          Loading...
        </>
        : text
      }
    </button>
  );

  var editableElements = document.getElementsByClassName('editable');

  Array.from(editableElements).forEach(function (element) {
    element.addEventListener('click', function () {
      var currentText = this.textContent.trim();
      // Check if content is already empty or contains only whitespace
      if (currentText === '') {
        this.textContent = '\u00A0'; // Inserting &nbsp; for non-breaking space
      } else {
        this.textContent = ''; // Clear the content
      }
    });
  });

  const getCompanyinfo = () => {

    axios.get(`/getcompanydata/${getUserSID()}`).then((res) => {
      // Check if data exists
      const companyData = res?.data?.data[0];
      if (!companyData) {
        toast.error('Company data not found');
        return;
      }
  
      // Parse companyInfo if available (stringified JSON)
      const { companyInfo, province } = companyData;
      let parsedCompanyInfo = {};
  
      // Parse companyInfo if it's a string
      if (companyInfo) {
        try {
          parsedCompanyInfo = JSON.parse(companyInfo); // Parse the stringified JSON
        } catch (error) {
          console.error("Error parsing companyInfo:", error);
          toast.error('Error parsing company data');
        }
      }
  
      // Destructure the required fields from the parsed companyInfo
      const { City, PostalCode, Country, CountrySubDivisionCode, Line1 } = parsedCompanyInfo?.legaladdress || {};
  
      // Set city text content
      let city = document.getElementById('city');
      if (city) {
        city.textContent = City;
      }
  
      // Set firm phone number
      let firmPhone = document.getElementById('firmPhone');
      if (firmPhone) {
        firmPhone.textContent = companyData?.body?.firmNumber; // Fallback if firmNumber is undefined
      }
  
      // Set postal code text content
      let postalCode = document.getElementById('postalCode');
      if (postalCode) {
        postalCode.textContent = PostalCode;
      }
  
      // Set country text content
      let country = document.getElementById('country');
      if (country) {
        country.textContent = Country;
      }
  
      // Set country subdivision code text content
      let countrySubDivisionCode = document.getElementById('countrySubDivisionCode');
      if (countrySubDivisionCode) {
        countrySubDivisionCode.textContent = CountrySubDivisionCode;
      }
  
      // Set line1 text content
      let line1 = document.getElementById('line1');
      if (line1) {
        line1.textContent = Line1;
      }
  
      // Set firm address text content
      let FirmAddress = document.getElementById('FirmAddress');
      if (FirmAddress) {
        FirmAddress.textContent = `${City} , ${Country}`;
      }
  
      // Set second firm address text content
      let FirmAddress2 = document.getElementById('FirmAddress-2');
      if (FirmAddress2) {
        FirmAddress2.textContent = `${City} , ${Country}`;
      }
  
    }).catch((err) => {
      console.error("Error fetching company info:", err);
      toast.error('Something went wrong while fetching company info or token expired');
    });
  
  }
  

  const handleGerneralUpdates = () => {
    axios.get(`/clio-account-details-general/${getUserSID()}`
    ).then((res) => {

      let newArrupdate = [...res.data.data.body];

      if (newArrupdate.length === 1) {

        const personAuthorizingElement = document.getElementById('accountToBeCreditedgerneral');
        if (personAuthorizingElement) {
          personAuthorizingElement.textContent = newArrupdate[0].account_name;
        }

        const personAuthorizingElement2 = document.getElementById('nameOfFinancialInst2gerneral');
        if (personAuthorizingElement2) {
          personAuthorizingElement2.textContent = newArrupdate[0].bank_name;
        }

        const personAuthorizingElement3 = document.getElementById('branchNameAndAddressgerneral');
        if (personAuthorizingElement3) {
          personAuthorizingElement3.textContent = '';
        }

        const personAuthorizingElement4 = document.getElementById('accountNumber2gerneral');
        if (personAuthorizingElement4) {
          personAuthorizingElement4.textContent = newArrupdate[0].account_number;
        }
        let firmName = document.getElementById('firmName');
        if (firmName) {
          firmName.textContent = getCurrentUserFromCookies().display_firmname;
        }
      } else if (newArrupdate.length > 1) {
        const dropdown = document.createElement('select');
        dropdown.id = 'accountToBeCreditedgerneralDropdown';
        const option = document.createElement('option');
        option.value = 'Select an option';
        option.textContent = 'Select an option';
        dropdown.appendChild(option);
        newArrupdate.forEach((item, index) => {
          const option = document.createElement('option');
          option.value = item.account_name;
          option.textContent = item.account_name;
          dropdown.appendChild(option);
        });
        const personAuthorizingElement = document.getElementById('accountToBeCreditedgerneral');
        if (personAuthorizingElement) {
          personAuthorizingElement.parentNode.replaceChild(dropdown, personAuthorizingElement);
        }
        dropdown.addEventListener('change', (event) => {
          handleChangeDropdownforGerneral(event, newArrupdate)
        })
      } else {
        console.error('No data found for the account')
      }
    }).catch((err) => {
      toast.error('something went wrong')
    })
  }


  const handleChangeDropdownforGerneral = (event, data) => {
    const value = event.target.value;
    const selectElement = event.target;
    let checkotherdetails = data.find(element => element.account_name === value);

    Array.from(selectElement.options).forEach(option => {
      option.removeAttribute("selected");
    });

    selectElement.querySelector('option[value="' + value + '"]')?.setAttribute("selected", "selected");

    const personAuthorizingElement2 = document.getElementById('nameOfFinancialInst2gerneral');
    if (personAuthorizingElement2) {
      personAuthorizingElement2.textContent = checkotherdetails.bank_name;
    }

    const personAuthorizingElement3 = document.getElementById('branchNameAndAddressgerneral');
    if (personAuthorizingElement3) {
      personAuthorizingElement3.textContent = checkotherdetails.branch_address;
    }

    const personAuthorizingElement4 = document.getElementById('accountNumber2gerneral');
    if (personAuthorizingElement4) {
      personAuthorizingElement4.textContent = checkotherdetails.account_number;
    }

    let firmName = document.getElementById('firmName');
    if (firmName) {
      firmName.textContent = getCurrentUserFromCookies().display_firmname;
    }

  };

  const getDataofclioBilling = () => {
    axios.get(`/clio-billing/${getUserSID()}`).then((res) => {
      if (res.data.data.body.length > 0) {
        setClioBillingData(res.data.data.body)
      } else {
        console.error('No data found for the account')
      }
    }).catch((err) => {
      toast.error('something went wrong in clio-billing api')
    })
  }

  const getDataofClioAfterBilling = () => {
    axios.get(`/clio-billing/${getUserSID()}`).then((res) => {
      if (res.data.data.body.length > 0) {
        setClioBillingForAfterSave(res.data.data.body)
      } else {
        console.error('No data found for the account')
      }
    }
    ).catch((err) => {
      toast.error('something went wrong in clio-billing api')
    })
  }


  useEffect(() => {
    handleGerneralUpdates()
    if (selectionState.selectedOptionid !== 'other' && selectionState.selectedOptionid !== 'Select an option') {
      getDataofclioBilling()
    }

    populateTableData();

    let totalValueElements = document.getElementsByClassName('totalValue');

    for (var i = 0; i < totalValueElements.length; i++) {
      totalValueElements[i].textContent = '';
      setTotalAmount(0);
    }

    const totalUpperCase = document.querySelector('.totalValueInput');
    if (totalUpperCase) {

      totalUpperCase.textContent = '';
    }
    if (selectionState.selectedOptionid === "Settlement of invoices") {
      let firmName_recpient = document.getElementById('firmName_recpient');
      if (firmName_recpient) {
        firmName_recpient.textContent = getCurrentUserFromCookies().display_firmname;
      }
    } else {
      let firmName_recpient = document.getElementById('firmName_recpient');
      if (firmName_recpient) {
        firmName_recpient.textContent = '';
      }
    }
  }, [selectionState.selectedOptionid]);

  useEffect(() => {
    const mydata = JSON.parse(taskState.client_all_info);
    console.log("mydataCCCity", JSON.parse(taskState.client_all_info));
    if ((step === 5 || step === 6 ||
      step === 7 || step === 8 ||
      step === 9 || step === 10 ||
      step === 11) && newForm
    ) {
      let clientname = document.getElementById('client_name');
      if (clientname) {
        clientname.textContent = mydata[0].name;
      }

      let client_city = document.getElementById('client_city');
      if (client_city) {
        client_city.textContent = mydata[0].city;
      }

      let client_country = document.getElementById('client_country');
      if (client_country) {
        client_country.textContent = mydata[0].country;
      }

      let client_postal_code = document.getElementById('client_postal_code');
      if (client_postal_code) {
        client_postal_code.textContent = mydata[0].postal_code;
      }

      let client_primary_email_address = document.getElementById('client_primary_email_address');
      if (client_primary_email_address) {
        client_primary_email_address.textContent = mydata[0].primary_email_address;
      }

      let client_primary_phone_number = document.getElementById('client_primary_phone_number');
      if (client_primary_phone_number) {
        client_primary_phone_number.textContent = mydata[0].primary_phone_number;
      }

      let client_province = document.getElementById('client_province');
      if (client_province) {
        client_province.textContent = mydata[0].province;
      }
      const clientFilesDetails = JSON.parse(taskState.client_files_details);
      clientFilesDetails.map((element, index) => {
        let lawFirmLawyer = document.getElementById('lawfirmlawyer_responsible');
        if (lawFirmLawyer) {
          lawFirmLawyer.textContent = element.client.responsible_attorney_name
        }

        let lawFirmresponsibleEmail = document.getElementById('responsible_attorney_email');
        if (lawFirmresponsibleEmail) {
          lawFirmresponsibleEmail.textContent = element.client.responsible_attorney_email
        }

        let lawFirmresponsibleEmail2 = document.getElementById('responsible_attorney_email2');
        if (lawFirmresponsibleEmail2) {
          lawFirmresponsibleEmail2.textContent = element.client.responsible_attorney_email
        }

        let lawFirmLawyer2 = document.getElementById('lawfirmlawyer_responsible2');
        if (lawFirmLawyer2) {
          lawFirmLawyer2.textContent = element.client.responsible_attorney_name
        }

        let lawFirmLawyerorg = document.getElementById('lawfirmlawyer_org');
        if (lawFirmLawyerorg) {
          lawFirmLawyerorg.textContent = element.client.originating_attorney_name
        }


        element.fileNumber.map((file, fileIndex) => {
          const filNUmberD = document.getElementById('file-number');
          const clientnameandmatter = document.getElementById('clientnameandmatter');


          if (filNUmberD) {
            const fileItem = document.createElement('span');
            fileItem.textContent = file.matter_display_nbr + (fileIndex < element.fileNumber.length - 1 ? ' , ' : ' ');
            filNUmberD.appendChild(fileItem);
          }
          if (clientnameandmatter) {
            const fileItem = document.createElement('span');
            fileItem.textContent = file.matter_display_nbr + ' , ' + file.matter_description
            clientnameandmatter.appendChild(fileItem);
          }
        });
      });
    }
  }, [htmlContent, newForm]);


  useEffect(() => {

    // if (newForm) {
    let totalValues = document.getElementsByClassName('total-amount');
    if (totalValues) {
      Array.from(totalValues).forEach(element => {
        element.textContent = '$' + staticTotalAmount;
      });
    }
    // }

  }, [staticTotalAmount, newForm]);

  useEffect(() => {
    const handleChange = (event) => {
      console.log('checkJKKGJK', event.target.classList)
      if (event.target.classList.contains('amount_col')) {
        setStaticTotalAmount((prev) => prev + Number(event.target.value));
      }
    };

    document.addEventListener('change', handleChange);

    return () => {
      document.removeEventListener('change', handleChange);
    };
  }, []);

  //target checkboxes
  document.addEventListener('change', (event) => {
    if (event.target && event.target.type === 'radio' && event.target.name) {
      const radioButtons = document.querySelectorAll(`input[name="${event.target.name}"]`);

      radioButtons.forEach(radio => {
        if (radio === event.target) {
          radio.setAttribute('checked', 'true');
        } else {
          radio.removeAttribute('checked');
        }
      });

    }
  });

  document.addEventListener('change', (event) => {
    if (event.target && event.target.type === 'checkbox' && event.target.name) {
      const checkboxes = document.querySelectorAll(`input[name="${event.target.name}"]`);

      checkboxes.forEach(checkbox => {
        if (checkbox === event.target) {
          if (checkbox.checked) {
            checkbox.setAttribute('checked', 'true');
          } else {
            checkbox.removeAttribute('checked');
          }
        }
      });

    }
  });

  document.addEventListener('change', (event) => {
    if (event.target && event.target.type === 'textarea') {
      event.target.innerHTML = event.target.value;
    }
  });

  // change date format using flatpickr with target id
  useEffect(() => {
    flatpickr("#dateInput", {
      dateFormat: "m-d-Y",
      onChange: function (selectedDates, dateStr) {
        // Set the selected date as the content of the element with ID 'dateInput'
        const dateInputElement = document.getElementById("dateInput");
        if (dateInputElement) {
          dateInputElement.textContent = dateStr; // Set selected date as content
        }
      },
    });
  }, [htmlContent]);

  useEffect(() => {
    axios.get(`/clients?sid=${getUserSID()}`).then((res) => {
      if (res.data.data.body.length > 0) {
        setAllclientwithdetails(res.data.data.body)
      } else {
        console.error('No data found for the account')
      }
    }).catch((err) => {
      console.log('erroccureedshfgh', err.message)
      toast.error('error occureed', err)
    })
  }, [htmlContent]);

  useEffect(() => {
    if (allclientwithdetails.length !== 0 && newForm) {
      TransferDetailsMatterToMatter();
    }
  }, [allclientwithdetails, htmlContent]);

  useEffect(() => {
    if (newForm) {
      populdatefinancialdetailsTable();
      populatetableCorrespondingreasons();
    }
  }, [htmlContent, newForm]);


  return (
    <>
      {/* Display a loader while the page is loading */}
      <Loader isLoading={loading} />

      <div className="row">
        <div className="col-9">
          {/* If htmlContent is available, display it. Otherwise, show a loader */}
          {htmlContent ? (
            <div
              className={`print-container ${sectionA.task_approverer_signoff && sectionA.task_preparer_signoff ? "printDisabled" : ""}`}
              ref={formTarget}
              // contentEditable={
              //   (step === 17 || step === 18) || (sectionA.task_approverer_signoff && sectionA.task_preparer_signoff) ? "false" : "true"
              // }
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          ) : (
            <Loader isLoading={true} />
          )}
        </div>

        <div className="col-3 d-flex gap-3 flex-column position-fixed end-0" style={{ marginTop: '173px', width: 'calc(25% - 50px)' }}>
          <h5>
            {/* Display the SVG for the compliance form */}
            {getSvg('Compliance form')}
            Compliance form
          </h5>

          Сheck the information in the document <br />
          and then you can save it or print it:

          <div className="d-flex gap-4">
            <ButtonWithLoader
              isLoading={loadingApprover.saveForm}
              onClick={handleSaveClick}
              text='Save Document'
            />

            <button className="btn btnPrimary btn-sm mb-2"
              // disabled={!(sectionA.task_approverer_signoff && sectionA.task_preparer_signoff)}
              onClick={handleDownloadClick}
            >
              Print/Download
            </button>
          </div>

          <div className="d-flex">
            {/* Display the SVG for the sign off */}
            {getSvg('sign off')}
            Sign off
          </div>

          Almost there, please sign off...

          <ButtonWithLoader
            isLoading={loadingApprover.approverLoader}
            onClick={() => handleSignOFFHandler('approver')}
            text='Sign Off - Approver'
            disabled={
              (sectionA.task_approverer_signoff && sectionA.task_preparer_signoff)
              || sectionA.task_approverer_signoff ||
              getCurrentUserFromCookies().role == 'PREPARER'
            }

          />

          {/* Display the date the approver signed off */}
          <SignOffDate date={sectionA.task_approverer_signoff_date} title={'Approver'} />

          <ButtonWithLoader
            isLoading={loadingApprover.preparerLoader}
            onClick={() => handleSignOFFHandler('prepar')}
            text='Sign Off - Preparer'
            disabled={
              (sectionA.task_approverer_signoff && sectionA.task_preparer_signoff)
              || sectionA.task_preparer_signoff
              ||
              getCurrentUserFromCookies().role == 'REVIEWER'
            }
          />

          {/* Display the date the preparer signed off */}
          <SignOffDate date={sectionA.task_preparer_signoff_date} title={'Preparer'} />
        </div>

      </div>

    </>

  );
};

export default ComplianceFormAB;

