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

const ComplianceFormON = () => {

  // Get the query parameters and the task state from the history
  const query = useQuery();
  const step = parseInt(query.get("step"));
  const history = useHistory();
  const taskState = history.location.state;



  // State variables
  const [htmlContent, setHtmlContent] = useState('');
  const [fileNumberValue, setFileNumberValue] = useState({});
  const [tableData, setTableData] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formInitialized, setformInitialized] = useState(false);
  const [formData, setformdata] = useState(false);
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
    general_account_details: {},
    task_preparer_signoff_date: taskState.task_preparer_signoff_date,
    FirmAddress: '',
    reason_of_payment: ['Settlement of invoices', 'Return to client funds', 'Payment to third party', 'Other'],
  });

  const [selectionState, setSelectionState] = useState({
    selectedOptionid: 'Select an option',
  });

  const [cliobillingData, setClioBillingData] = useState([]);
  const [clioBillingforAfterSave, setClioBillingForAfterSave] = useState([])

  // Reference to the form element
  const formTarget = useRef();
  const tableRef = useRef();


  useEffect(() => {
    if (step === 15 || step === 17 || step === 18) {
      let firmName = document.getElementById('firmName9B');
      if (firmName) {
        firmName.textContent = getCurrentUserFromCookies().display_firmname;
      }

      setSectionA((prev) => ({
        ...prev,
        reason_of_payment: ['Document registration fees', 'Land transfer tax', 'Other']
      }))
    } else if (step == 16) {
      setSectionA((prev) => ({
        ...prev,
        reason_of_payment: ['Balance due on closing', 'Other']
      }))
    }
  }, [step, htmlContent])

  useEffect(() => {
    const updateTaskCompletion = async () => {
      try {
        await getComplienceForm();
        setformInitialized(true);
      } catch (error) {
        console.error("Error updating task completion status:", error);
      }
    };
  
    // Call the function inside the effect
    updateTaskCompletion();
  
    // Additional logic if necessary
  }, [step, sectionA.requisition]); // Dependencies to trigger the effect
  

  const getComplienceForm = async () => {
    await axios.get("/compliance/" + taskState.id).then(async (res) => {
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
        await axios.get(`/getcomplienceform/${step}/${getCurrentUserFromCookies().province}`).then((res) => {
          const updatedHtml = replacePlaceholders(res.data, sectionA);
          setHtmlContent(updatedHtml);
          setNewForm(true);
          getAccountDeatils()
          
        }).catch((err) => {
          console.log('getApi then error',err)
          toast.error('something went wrong')
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
        selectElement.setAttribute("data-width", 'fit');
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
          // element.style.borderRadius = '10px';
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
      console.log('getApi then error in clio-account',err)
      toast.error('something went wrong')
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
      console.log('selectElementValueee', value)
      console.log('selectElementselectElement', selectElement)


      let checkotherdetails = gerneralDropdownDataAfterSave.find(element => element.account_name === value);



      if (checkotherdetails) {

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


  document.addEventListener('change', (event) => {
     if (event.target.classList.contains('inTextSelect') || event.target.classList.contains('inTextInput')) {
       const element = event.target;
       const labelSpan = element.previousElementSibling;

       element.setAttribute('value', element.value);

       if (labelSpan && labelSpan.tagName === 'SPAN') {
        labelSpan.textContent = element.value;
      }


     }
   });




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
      populateDropdown('Selectboxtaskaccount', sectionA.task_account);
      populateDropdown('Person_entering_details', sectionA.persons);

      if(step == 14){
        let getReasonOFpayment = document.getElementById('reason_of_payment');
        if (getReasonOFpayment) {
          getReasonOFpayment.textContent = taskState.reason_of_payment
        }
      }else{
        populateDropdown('reason_of_payment', sectionA.reason_of_payment);
      }

  
    }
  }, [sectionA.persons, sectionA.task_account])


  const populateTable = () => {
    const tableElement = document.querySelector('table');
    let totalamountafterReduce = tableData.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)


    var totalValueInput = document.querySelector('.totalValueInput');
    if (totalValueInput) {
       if(taskState.reason_of_payment == 'Settlement of invoices'){
        totalValueInput.textContent = '$' + formatNumberWithCommasAndDecimals(totalamountafterReduce);
       }
    }



    if (tableElement) {
      tableRef.current = tableElement;
      const thead = tableElement.querySelector('thead');
      if (thead) {
        thead.innerHTML = `
          <tr>
            <th>Client</th>
            <th>File Number</th>
            <th>Matter Description</th>
            <th>Reference</th> 
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
            // toast.success('No data found for the account') 
            const newColumnInput = document.createElement('input');
            newColumnInput.type = 'text';
            newColumnInput.className = 'form-control';
          
            // Set the input value based on reference condition
            if (data.reference) {
              newColumnInput.setAttribute("value", data.reference);
            } else {
              newColumnInput.setAttribute("value", data.newColumn || '');
            }
          
            // Handle value changes in the input field
            newColumnInput.onchange = (e) => {
              e.target.setAttribute("value", e.target.value);
              const newTableData = [...tableData];
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
          amountInput.readOnly = taskState.reason_of_payment === 'Settlement of invoices';
          
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

          row.appendChild(newColumnCell); // Add new column cell to the row
          row.appendChild(amountCell);
          tbody.appendChild(row);
        });

        const totalRow = document.createElement('tr');
        const totalClientCell = document.createElement('td');
        totalClientCell.colSpan = 4; // Update colspan to include new column
        totalClientCell.textContent = 'Total';

        const totalAmountCell = document.createElement('td');
        totalAmountCell.classList.add('totalValue');
        // totalAmountCell.textContent = '$' + formatNumberWithCommasAndDecimals(totalAmount);
        totalAmountCell.textContent = '$' + (taskState.reason_of_payment === 'Settlement of invoices' ? formatNumberWithCommasAndDecimals(totalamountafterReduce) : formatNumberWithCommasAndDecimals(totalAmount)) ;
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
    if (newForm && (selectionState.selectedOptionid == 'Settlement of invoices'
      || selectionState.selectedOptionid == 'Return to client funds'
      || selectionState.selectedOptionid == 'Payment to third party'
      || selectionState.selectedOptionid == 'Other'
      || selectionState.selectedOptionid == 'Select an option')
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

      if (event.target.matches('table input')) {

        var total = 0;

        var inputs = event.target.closest('tbody').querySelectorAll('input');
        inputs.forEach(function (input) {
          input.setAttribute("value", input.value);
          if (input.id.includes('amount')) {
            total += Number(input.value || 0);
          }
        });

        var totalValueElements = document.getElementsByClassName('totalValue');

        for (var i = 0; i < totalValueElements.length; i++) {
          totalValueElements[i].textContent = '$' + formatNumberWithCommasAndDecimals(total);
        }

        var totalValueInput = document.querySelector('.totalValueInput');
        if (totalValueInput) {
          totalValueInput.textContent ='$' +  formatNumberWithCommasAndDecimals(total);
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
    if(totalUpperCase){

      totalUpperCase.textContent ='$' + formatNumberWithCommasAndDecimals(total);
    }

    setSectionA(prev => ({
      ...prev,
      totalAmounttbl: '$' + formatNumberWithCommasAndDecimals(total)
    }));
  };

  useEffect(() => {

    manageRequisition()
    populateTableData()
    getCompanyinfo()

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
      if (res.data.data.body.length > 0) {

        let trustAccountToBeDebited = document.getElementById('trustAccountToBeDebited');

        if (trustAccountToBeDebited) {

          trustAccountToBeDebited.textContent = res.data.data.body[0].account_name;
        }

        let nameOfFinancialInst = document.getElementById('nameOffinancialinstitution');
        if (nameOfFinancialInst) {
          nameOfFinancialInst.textContent = res.data.data.body[0].bank_name;
        }

        let accountNumber = document.getElementById('accountNumberfirst');
        if (accountNumber) {
          accountNumber.textContent = res.data.data.body[0].account_number;
        }
      } else {
        console.log('No data found for the account')
      }
    }).catch((err) => {
      console.log('getApi then error in clio-account0-details',err)
      toast.error('something went wrong')
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
    let modifyyinto = JSON.parse(taskState.client_files_details).flatMap((entry) => {
      const client = entry.client.client_name;
      return entry.fileNumber.map((file, index) => ({

        client: client,
        filenumber: file.matter_display_nbr,
        matter_description: file.matter_description,
        amount: file.amount,
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
      pdfname : sectionA.FormTitle,
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

      let signature = document.getElementById('signature');
  
      if (signature) {
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
          task_preparer_signoff_date: body.data.data.body[0].task_preparer_signoff_date,
          general_account_details: JSON.parse(body.data.data.body[0].generalAccount) || {},
        }));
        setformdata(true);

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
      {/* {title}  */}
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
  
      if (res.data.data.code === 400) {
        throw new Error(res.data.data.message.message); // Throw error to be caught in the catch block
      }
      // Parse companyInfo to get legaladdress object
      const { companyInfo, province } = res?.data?.data[0] || {};  // Safely access data
      let parsedCompanyInfo = {};
  
      if (companyInfo) {
        try {
          parsedCompanyInfo = JSON.parse(companyInfo); // Parse companyInfo string
        } catch (error) {
          console.error("Error parsing companyInfo:", error);
        }
      }
  
      // Destructure City and Country from the parsed companyInfo
      const { City, Country } = parsedCompanyInfo?.legaladdress || {}; // Safe access
  
      // Log the legal address for debugging
      console.log("City:", City, "Country:", Country);
  
      // Safely access FirmAddress element
      let FirmAddress = document.getElementById('FirmAddress');
      if (FirmAddress && City && Country) {
        FirmAddress.textContent = `${City}, ${Country}`;
      } else {
        console.log('Missing legaladdress or FirmAddress element');
      }
  
    }).catch((err) => {
      console.log('Error in companyinfo API:', err);
      toast.error(`Error: ${err.message || err}`);
    });
  };
  

  const handleGerneralUpdates = () => {
    console.log("2323232323")
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
        console.log("geygeydgdygdydg",getCurrentUserFromCookies().display_firmname)

        let firmName = document.getElementById('firmName');
        if (firmName) {
          firmName.textContent = getCurrentUserFromCookies().display_firmname;
        }

        console.log('✌️gdyegdyegdyegyegdye --->', newArrupdate[0].branch_address);

        let branch_address = document.getElementById('branchNameAndAddressgerneral');
console.log('✌️branch_address --->', branch_address);
        if (branch_address) {
          branch_address.textContent = newArrupdate[0].branch_address;
        }

      } else if (newArrupdate.length > 1) {
        const dropdown = document.createElement('select');
        dropdown.id = 'accountToBeCreditedgerneralDropdown';
      
        const defaultOption = document.createElement('option');
        const personAuthorizingElement = document.getElementById('accountToBeCreditedgerneral');
        if (personAuthorizingElement) {
          personAuthorizingElement.textContent = '';
        }
        defaultOption.value = '';
        defaultOption.textContent = 'Select an option';
        dropdown.appendChild(defaultOption);
      
        var prepopulatedData = false;
      
        newArrupdate.forEach((item) => {
          const option = document.createElement('option');
          option.value = item.account_name;
          option.textContent = item.account_name;
      
          // Set "general account" as the default selected value
          console.log("item.account_name",item.account_name, sectionA?.general_account_details?.name)
          if (item.account_name === sectionA?.general_account_details?.name) {
            option.selected = true;
            prepopulatedData = true;
      
            const personAuthorizingElement = document.getElementById('accountToBeCreditedgerneral') ? document.getElementById('accountToBeCreditedgerneral') : document.getElementById('accountToBeCreditedgerneralDropdown');
            if (personAuthorizingElement) {

              // Create a span element for static text
              const staticTextElement = document.createElement('span');
              staticTextElement.id = 'accountToBeCreditedgerneralStaticText'; // Assign a unique ID
              staticTextElement.textContent = item.account_name || 'No account selected'; // Set static text from item.account_name

              // Replace the select tag with the static text element
              personAuthorizingElement.parentNode.replaceChild(staticTextElement, personAuthorizingElement);

            }
      
            // Find and handle the relevant details for the selected account
            const checkOtherDetails = newArrupdate.find(
              (element) => element.account_name === sectionA?.general_account_details?.name
            );
            handleDynamicData(checkOtherDetails);
          }
      
          dropdown.appendChild(option);
        });
      
        // Replace the element with the dropdown if no prepopulated data is set
        if (prepopulatedData === false) {
          const personAuthorizingElement = document.getElementById('accountToBeCreditedgerneral');
          if (taskState.reason_of_payment == 'Settlement of invoices') {
            if (personAuthorizingElement) {
              personAuthorizingElement.parentNode.replaceChild(dropdown, personAuthorizingElement);
            }

            dropdown.addEventListener('change', (event) => {
              handleChangeDropdownforGerneral(event, newArrupdate)
            })
          }
          else {
            // For other reasons of payment, handle adding an input field
            if (personAuthorizingElement) {
              const inputField = document.createElement('input');
              inputField.type = 'text';
              inputField.id = 'inputFieldForOtherReasons';
              inputField.style.border = 'none';
              inputField.style.outline = 'none'; 
              inputField.style.background = 'transparent'; 

              // Replace or append the input field as required
              personAuthorizingElement.parentNode.replaceChild(inputField, personAuthorizingElement);
            }
          }

        }
      }
       else {
        console.log('No data found for the account')
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

    handleDynamicData(checkotherdetails);


  };

  function handleDynamicData(checkotherdetails) {
    
    const personAuthorizingElement2 = document.getElementById('nameOfFinancialInst2gerneral');
    if (personAuthorizingElement2) {
      personAuthorizingElement2.textContent = checkotherdetails?.bank_name;
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
    console.log('checkConsole', firmName, getCurrentUserFromCookies().display_firmname)
    if (firmName) {
      firmName.textContent = getCurrentUserFromCookies().display_firmname;
    }
  }

  const getDataofclioBilling = () => {
    axios.get(`/clio-billing/${getUserSID()}`).then((res) => {
      if (res.data.data.body.length > 0) {
        setClioBillingData(res.data.data.body)

      } else {
        console.log('No data found for the account')
      }
    }
    ).catch((err) => {
      toast.error('something went wrong')
    })
  }

  const getDataofClioAfterBilling = () => {
    axios.get(`/clio-billing/${getUserSID()}`).then((res) => {
      if (res.data.data.body.length > 0) {
        setClioBillingForAfterSave(res.data.data.body)
      } else {
        console.log('No data found for the account')
      }
    }
    ).catch((err) => {
      toast.error('something went wrong')
    })
  }


  useEffect(() => {

   if(step === 14){
    if (taskState.reason_of_payment !== 'other' && taskState.reason_of_payment !== 'Select an option') {
      getDataofclioBilling()
    }

   

    if (taskState.reason_of_payment == 'Settlement of invoices') {
      handleGerneralUpdates()
    } else {
      clearTextContentByIds([
        'accountToBeCreditedgerneral',
        'nameOfFinancialInst2gerneral',
        'branchNameAndAddressgerneral',
        'accountNumber2gerneral',
        'firmName'
      ]);
    }
   }else{
    if (selectionState.selectedOptionid !== 'other' && selectionState.selectedOptionid !== 'Select an option') {
      getDataofclioBilling()
    }

    if (selectionState.selectedOptionid == 'Settlement of invoices') {
      handleGerneralUpdates()
    } else {
      clearTextContentByIds([
        'accountToBeCreditedgerneral',
        'nameOfFinancialInst2gerneral',
        'branchNameAndAddressgerneral',
        'accountNumber2gerneral',
        'firmName'
      ]);
    }
   }

    populateTableData();

    // let totalValueElements = document.getElementsByClassName('totalValue');

    // for (var i = 0; i < totalValueElements.length; i++) {
    //   totalValueElements[i].textContent = '';
    //   setTotalAmount(0);
    // }

    // const totalUpperCase = document.querySelector('.totalValueInput');
    // if (totalUpperCase) {

    //   totalUpperCase.textContent = '';
    // }

  }, [selectionState.selectedOptionid, formInitialized, formData ]);

  useEffect(() => {
    if(step === 16){
      handleGerneralUpdates()
    }
  },[step])

  useEffect(() => {
    if (newForm) {
      populateTable();
    }
  }, [newForm , htmlContent]);

  const clearTextContentByIds = ids => ids.forEach(id => {
    const element = document.getElementById(id);
    // if (element) element.textContent = '';
  });


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

        {/* <div className="col-3 d-flex gap-3 flex-column position-fixed end-0" style={{ marginTop: '173px' }}> */}
         
       
         

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
            
            onClick={handleDownloadClick}>
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
            } />

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
            } />

          {/* Display the date the preparer signed off */}
          <SignOffDate date={sectionA.task_preparer_signoff_date} title={'Preparer'} />
        </div>

      </div>

    </>

  );
};

export default ComplianceFormON;

