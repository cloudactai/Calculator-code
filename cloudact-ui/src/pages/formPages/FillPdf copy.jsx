import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Layout from "../../components/LayoutComponents/Layout";
import { useLocation } from "react-router-dom";
// import { Margin, usePDF } from "react-to-pdf";
import { selectSaveFileData, selectSaveFileDataError, selectSaveFileDataLoading } from "../../utils/Apis/matters/saveFileData/saveFileDataSelector";
import { saveFileData, saveFileDataReset } from "../../utils/Apis/matters/saveFileData/saveFileDataActions";
import toast from "react-hot-toast";
import GeneralModal from "../../components/Matters/Modals/GeneralModal";
import { FormInformation } from "../../utils/Apis/matters/CustomHook/PDFData";
import { PDFDocument, PDFName, rgb, StandardFonts } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import '../../components/FormPages/forms/App.css'; // Ensure this CSS file is included for styles
import { Rnd } from 'react-rnd';
import 'react-resizable/css/styles.css';
import { AssetsData } from "../../utils/Apis/matters/CustomHook/DocumentViewDataUpdate";
import { AssetsDetails } from "../../utils/Apis/matters/CustomHook/AssetsData";
import CurrencyFormat from 'react-currency-format';
import { fetchFieldData } from "../../utils/Apis/matters/CustomHook/fetchFieldData";
import { selectGetFileData, selectGetFileDataLoading } from "../../utils/Apis/matters/getFileData/getFileDataSelector";
import { getFileData } from "../../utils/Apis/matters/getFileData/getFileDataActions";
import ModernToolbar from "../../components/FormPages/forms/newComponents/ModernToolbar";
import CalculationManager from "../../components/FormPages/forms/newComponents/CalculationManager";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const FillPdf = ({ currentUserRole }) => {
  const location = useLocation();
  const formData = location.state?.formData;
  // Sidebars
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // For Forms List
  const [isDataSidebarOpen, setIsDataSidebarOpen] = useState(false); // For Data List
  const [fields, setFields] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [selectedField, setSelectedField] = useState(null); // Track selected field for customization
  const [selectedFields, setSelectedFields] = useState([]);
  const [scale, setScale] = useState(1.5); // Zoom level
  const [draggedField, setDraggedField] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { documentInfo, loading } = FormInformation(formData.matterNumber);
  const [documentData, setDocumentData] = useState(null);
  const [pdfDoc, setPdfDocument] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null)
  const { response } = useSelector((state) => state.userProfileInfo);
  const [fieldsReady, setFieldsReady] = useState(false); // New state to track readiness of fields
  const readOnly = true;
  const resizeEnabled = false;
  // Add these new state variables
  const [history, setHistory] = useState([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [bindData, setBindData] = useState(false);
  // Add useEffect to handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentHistoryIndex]);

  // Add this function to handle undo
  const undo = () => {
    if (currentHistoryIndex > 0) {
      setCurrentHistoryIndex(currentHistoryIndex - 1);
      setFields(history[currentHistoryIndex - 1]);
    }
  };

  // Modify any function that changes fields to add to history
  const updateHistory = (newFields) => {
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    newHistory.push(newFields);
    setHistory(newHistory);
    setCurrentHistoryIndex(currentHistoryIndex + 1);
  };

  useEffect(() => {
    if (documentInfo) {
      // setCourtNumber(documentInfo.court_info.courtFileNumber)
      setDocumentData(documentInfo);
    }
  }, [loading, formData, documentInfo])

  const dispatch = useDispatch();
  const pdfContentRef = useRef(null); // Use ref instead of getElementById
  const [showAddFolderModal, setShowAddFolderModal] = useState(false)
  const [pdfUrl, setPdfUrl] = useState(null);

  let selectedForms = useSelector((state) => state.selectedForms);
  // First, create a helper function to get the initial forms
  const getInitialForms = () => {
    if (selectedForms && selectedForms.length > 0) {
      return selectedForms;
    }
    const serializedCheckedForms = localStorage.getItem("checkedForms");
    return serializedCheckedForms ? JSON.parse(serializedCheckedForms) : [];
  };

  // Initialize the forms
  const initialForms = getInitialForms();

  // Set up state with the initial forms
  const [forms, setForms] = useState(initialForms);
  const [activeForm, setActiveForm] = useState(() => {
    // Use a state initializer function to prevent re-computation
    return initialForms.length > 0 ? initialForms[0] : null;
  });

  const { selectAssetsData, selectAssetsDataLoading } = AssetsData(formData.matterNumber)
  const { debtsArray, combinedAssets, propertiesAssets } = AssetsDetails(selectAssetsData, formData.matterNumber)


  useEffect(() => {
    if (activeForm?.file_name) {
      setPdfUrl(`/documents/${activeForm.file_name}.pdf`);
    }
  }, [activeForm?.file_name]);

  const selectSaveData = useSelector(selectSaveFileData);
  const selectSaveDataLoading = useSelector(selectSaveFileDataLoading);
  const selectSaveDataError = useSelector(selectSaveFileDataError);

  const handleSave = () => {
    let data = {
      matterId: formData.matterNumber,
      active_form: activeForm.id,
      file_id: activeForm.file_id,
      folder_id: activeForm.folder_id,
      doc_id: activeForm.docId,
      data: fields
    }

    dispatch(saveFileData(data))
  }

  const handleSaveFields = () => {
    try {
      // Prepare the data to save
      const jsonData = {
        matterId: formData.matterNumber,
        active_form: activeForm.id,
        file_id: activeForm.file_id,
        folder_id: activeForm.folder_id,
        doc_id: activeForm.docId,
        lastModified: new Date().toISOString(),
        data: fields
      };

      // Convert the data to a JSON string with pretty formatting
      const jsonString = JSON.stringify(jsonData, null, 2);

      // Create a blob from the JSON string
      const blob = new Blob([jsonString], { type: 'application/json' });

      // Create a URL for the blob
      const url = URL.createObjectURL(blob);

      // Create a temporary anchor element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeForm.file_name || 'form'}_fields.json`;

      // Append the link to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      URL.revokeObjectURL(url);

      toast.success("Fields file downloaded successfully", {
        position: "top-right",
        style: {
          borderRadius: '10px',
          background: '#FFF',
          color: '#000',
        },
      });
    } catch (error) {
      console.error('Error downloading fields:', error);
      toast.error("Error downloading fields file", {
        position: "top-right",
        style: {
          borderRadius: '10px',
          background: '#FFF',
          color: '#000',
        },
      });
    }
  };

  useEffect(() => {
    if (selectSaveData) {
      toast.success("Data Successfully Saved",
        {
          position: "top-right",
          style: {
            borderRadius: '10px',
            background: '#FFF',
            color: '#000',
          },
        })
      dispatch(saveFileDataReset())
    }
  }, [selectSaveDataLoading, selectSaveData])

  useEffect(() => {
    let data = {
      matterId: formData.matterNumber,
      file_id: activeForm.file_id,
      folder_id: activeForm.folder_id,
    }
    dispatch(getFileData(data))
  }, [selectFileData])

  const selectFileData = useSelector(selectGetFileData);
  const selectFileDataLoading = useSelector(selectGetFileDataLoading);
  // console.log("🚀 ~ FillPdf ~ selectFileData:", selectFileData[0].file_data)

  useEffect(async () => {
    if (selectFileData && selectFileData[0]?.file_data) {
      console.log("🚀 ~ useEffect ~ selectFileData:", selectFileData)
      const fileData = JSON.parse(selectFileData[0].file_data)
      setFields(fileData);
      setBindData(false)
      setFieldsReady(true);
    }
    else if (documentInfo) {
      const staticFields = await fetchFieldData(activeForm?.file_name);
      setFields(staticFields);
      setFieldsReady(true);
    }
  }, [selectFileDataLoading,selectFileData])

  // Load PDF
  useEffect(() => {
    const loadPdf = async () => {
      if (pdfUrl) {
        try {
          const response = await fetch(pdfUrl);
          const arrayBuffer = await response.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          setNumPages(pdfDoc.getPageCount());
          setPdfDocument(pdfDoc);
          const staticFields = await fetchFieldData(activeForm?.file_name);

          if (staticFields) {
            // First set the fields
            setFields(staticFields);
            setFieldsReady(true);
          }

        } catch (error) {
          console.error('Error loading the PDF:', error);
        }
      }
    };

    if (pdfUrl) {
      loadPdf();
    }
  }, [pdfUrl]);

  const addNewPage = async () => {
    if (!pdfDoc) {
      console.error("PDF document is not loaded.");
      return;
    }
    pdfDoc.addPage([600, 400]); // Add a new page with specified dimensions

    // Update the number of pages in the state
    setNumPages(numPages + 1);
  };

  // Bind fields to the data received from the API
  // Function to bind fields to document data and combined assets
  const bindFieldsToData = (documentData, combinedAssets, debtsArray, propertiesAssets) => {
    const updatedFields = fields.map(field => {
      // Initialize the binding value
      let bindingValue = '';

      // Check if the bind property is defined
      if (field.bind) {
        // Split the bind string into an array of keys
        const keys = field.bind.split(',').map(key => key.trim());

        // Retrieve values from the document data
        const valuesFromDocument = keys.map(key => {
          return key.split('.').reduce((acc, curr) => acc && acc[curr], documentData) || ''; // Safely traverse the data object
        });

        // If there's only one binding, assign that value; if multiple, join the values
        bindingValue = valuesFromDocument.length > 1 ? valuesFromDocument.join(', ') : valuesFromDocument[0];
      }

      if (field.source === 'assets') {
        // Check for combined assets binding only if field.bind is defined
        const assetIndex = field.bind ? field.bind.match(/items\[(\d+)\]/) : null;
        if (assetIndex) {
          const index = assetIndex[1]; // Extract index
          const assetItem = combinedAssets?.items[index];
          if (assetItem) {
            if (field.bind.includes('item')) {
              bindingValue = assetItem.item || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('market_value.client.today')) {
              bindingValue = assetItem.market_value.client.today || ''; // Override with asset value if available
            }
            if (field.bind.includes('market_value.opposing_party.today')) {
              bindingValue = assetItem.market_value.opposing_party.today || ''; // Override with asset value if available
            }
          }
        }
      }

      if (field.source === 'debts') {
        // Check for combined assets binding only if field.bind is defined
        const debtsIndex = field.bind ? field.bind.match(/items\[(\d+)\]/) : null;
        if (debtsIndex) {
          const index = debtsIndex[1]; // Extract index
          const debtsItem = debtsArray?.items[index];
          if (debtsItem) {

            if (field.bind.includes('category')) {
              bindingValue = debtsItem.category || ''; // Override with asset value if available
            }
            if (field.bind.includes('details')) {
              bindingValue = debtsItem.details || ''; // Override with asset value if available
            }
            if (field.bind.includes('on_date_of_marriage')) {
              bindingValue = debtsItem.on_date_of_marriage || ''; // Override with asset value if available
            }
            if (field.bind.includes('today')) {
              bindingValue = debtsItem.today || ''; // Override with asset value if available
            }

            if (field.bind.includes('on_valuation_date')) {
              bindingValue = debtsItem.on_valuation_date || ''; // Override with asset value if available
            }

            if (field.bind.includes('client')) {
              bindingValue = ''; // Override with asset value if available
            }
          }
        }
      }

      if (field.source === 'debtsMarriage') {
        // Check for combined assets binding only if field.bind is defined
        const debtsIndex = field.bind ? field.bind.match(/items\[(\d+)\]/) : null;
        if (debtsIndex) {
          const index = debtsIndex[1]; // Extract index
          const debtsItem = debtsArray?.items[index];
          if (debtsItem) {

            if (field.bind.includes('category')) {
              bindingValue = debtsItem.category || ''; // Override with asset value if available
            }

            if (field.bind.includes('on_valuation_date')) {
              bindingValue = debtsItem.on_valuation_date || ''; // Override with asset value if available
            }

            if (field.bind.includes('client')) {
              bindingValue = ''; // Override with asset value if available
            }
          }
        }
      }

      if (field.source === 'properties') {
        // Check for combined assets binding only if field.bind is defined
        const propertiesIndex = field.bind ? field.bind.match(/items\[(\d+)\]/) : null;
        if (propertiesIndex) {
          const index = propertiesIndex[1]; // Extract index
          const propertiesItem = propertiesAssets?.items[index];
          if (propertiesItem) {
            if (field.bind.includes('item')) {
              bindingValue = propertiesItem.item || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('market_value.client.today')) {
              bindingValue = propertiesItem.market_value.client.on_date_of_marriage || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('market_value.opposing_party.today')) {
              bindingValue = propertiesItem.market_value.opposing_party.on_date_of_marriage || ''; // Override with asset value if available
            }
          }
        }
      }

      // New logic for excluded properties
      if (field.source === 'property_excluded') {
        const excludedIndex = field.bind ? field.bind.match(/items\[(\d+)\]/) : null;
        if (excludedIndex) {
          const index = excludedIndex[1]; // Extract index
          const excludedItem = propertiesAssets?.items[index]; // Assume you are using propertiesAssets for excluded items
          if (excludedItem) {
            if (field.bind.includes('item')) {
              bindingValue = excludedItem.item || bindingValue; // Override with excluded asset value if available
            }
            if (field.bind.includes('market_value.client.on_valuation_date')) {
              bindingValue = excludedItem.market_value.client.on_valuation_date || bindingValue; // Override with excluded asset value if available
            }
            if (field.bind.includes('market_value.opposing_party.on_valuation_date')) {
              bindingValue = excludedItem.market_value.opposing_party.on_valuation_date || bindingValue; // Override with excluded asset value if available
            }
            if (field.bind.includes('market_value.client.today')) {
              bindingValue = excludedItem.market_value.client.today || bindingValue; // Override with excluded asset value if available
            }
            if (field.bind.includes('market_value.opposing_party.today')) {
              bindingValue = excludedItem.market_value.opposing_party.today || bindingValue; // Override with excluded asset value if available
            }
          }
        }
      }

      if (field.source === 'houseHold') {
        const houseHoldIndex = field.bind ? field.bind.match(/assets\[(\d+)\]/) : null;
        if (houseHoldIndex) {
          const index = parseInt(houseHoldIndex[1], 10); // Extract index
          const houseHoldItem = documentData?.assets?.household?.[index];

          if (houseHoldItem) {
            if (field.bind.includes('description')) {
              bindingValue = houseHoldItem.description || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('today')) {
              bindingValue = houseHoldItem.today || bindingValue; // Override with asset value if available
            }
          } else {
            console.warn(`No household item found at index: ${index}`); // Log if item not found
          }
        }
      }

      if (field.source === 'realEstate') {
        const realEstateIndex = field.bind ? field.bind.match(/assets\[(\d+)\]/) : null;
        if (realEstateIndex) {
          const index = parseInt(realEstateIndex[1], 10); // Extract index
          const realEstateItem = documentData?.assets?.land?.[index];

          if (realEstateItem) {
            if (field.bind.includes('address')) {
              bindingValue = realEstateItem.address || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('today')) {
              bindingValue = realEstateItem.today || bindingValue; // Override with asset value if available
            }
          } else {
            console.warn(`No real estate item found at index: ${index}`); // Log if item not found
          }
        }
      }

      if (field.source === 'lifeInsurance') {
        const lifeInsuranceIndex = field.bind ? field.bind.match(/assets\[(\d+)\]/) : null;
        if (lifeInsuranceIndex) {
          const index = parseInt(lifeInsuranceIndex[1], 10); // Extract index
          const lifeInsuranceItem = documentData?.assets?.life?.[index];

          if (lifeInsuranceItem) {
            if (field.bind.includes('category')) {
              bindingValue = lifeInsuranceItem.beneficiary || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('today')) {
              bindingValue = lifeInsuranceItem.today || bindingValue; // Override with asset value if available
            }
          } else {
            console.warn(`No life insurance item found at index: ${index}`); // Log if item not found
          }
        }
      }

      if (field.source === 'bank') {
        const bankIndex = field.bind ? field.bind.match(/assets\[(\d+)\]/) : null;
        if (bankIndex) {
          const index = parseInt(bankIndex[1], 10); // Extract index
          const bankItem = documentData?.assets?.bank?.[index];


          if (bankItem) {
            if (field.bind.includes('category')) {
              bindingValue = bankItem.institution || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('today')) {
              bindingValue = bankItem.today || bindingValue; // Override with asset value if available
            }
          } else {
            console.warn(`No bank item found at index: ${index}`); // Log if item not found
          }
        }
      }

      if (field.source === 'interests') {
        const interestsIndex = field.bind ? field.bind.match(/assets\[(\d+)\]/) : null;
        if (interestsIndex) {
          const index = parseInt(interestsIndex[1], 10); // Extract index
          const interestsItem = documentData?.assets?.interests?.[index];

          if (interestsItem) {
            if (field.bind.includes('firm_name')) {
              bindingValue = interestsItem.firm_name || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('today')) {
              bindingValue = interestsItem.today || bindingValue; // Override with asset value if available
            }
          } else {
            console.warn(`No interests item found at index: ${index}`); // Log if item not found
          }
        }
      }

      if (field.source === 'moneyOwed') {
        const moneyOwedIndex = field.bind ? field.bind.match(/assets\[(\d+)\]/) : null;
        if (moneyOwedIndex) {
          const index = parseInt(moneyOwedIndex[1], 10); // Extract index
          const moneyOwedItem = documentData?.assets?.moneyOwed?.[index];
          if (moneyOwedItem) {
            if (field.bind.includes('category')) {
              bindingValue = moneyOwedItem.details || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('today')) {
              bindingValue = moneyOwedItem.today || bindingValue; // Override with asset value if available
            }
          } else {
            console.warn(`No money owed item found at index: ${index}`); // Log if item not found
          }
        }
      }

      if (field.source === 'otherPossessions') {
        const otherPossessionsIndex = field.bind ? field.bind.match(/assets\[(\d+)\]/) : null;
        if (otherPossessionsIndex) {
          const index = parseInt(otherPossessionsIndex[1], 10); // Extract index
          const otherPossessionsItem = documentData?.assets?.otherpossessions?.[index];

          if (otherPossessionsItem) {
            if (field.bind.includes('address')) {
              bindingValue = otherPossessionsItem.address || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('today')) {
              bindingValue = otherPossessionsItem.today || bindingValue; // Override with asset value if available
            }
          } else {
            console.warn(`No other possessions item found at index: ${index}`); // Log if item not found
          }
        }
      }

      if (field.source === 'investments') {
        const investmentsIndex = field.bind ? field.bind.match(/assets\[(\d+)\]/) : null;
        if (investmentsIndex) {
          const index = parseInt(investmentsIndex[1], 10); // Extract index
          const investmentsItem = documentData?.assets?.investments?.[index];

          if (investmentsItem) {
            if (field.bind.includes('type')) {
              bindingValue = investmentsItem.type || ''; // Override with asset value if available
            }
            if (field.bind.includes('today')) {
              bindingValue = investmentsItem.today || ''; // Override with asset value if available
            }
          } else {
            console.warn(`No investments item found at index: ${index}`); // Log if item not found
          }
        }
      }

      if (field.source === 'savings') {
        // Check for combined assets binding only if field.bind is defined
        const savingsIndexMatch = field.bind ? field.bind.match(/assets\[(\d+)\]/) : null; // Changed variable name to avoid confusion
        if (savingsIndexMatch) {
          const index = parseInt(savingsIndexMatch[1], 10); // Extract index and convert to an integer
          const savingsItem = documentData?.assets?.savings ? documentData.assets.savings[index] : undefined;

          // Check if savingsItem exists and handle the binding
          if (savingsItem) {
            if (field.bind.includes('description')) {
              bindingValue = savingsItem.description || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('today')) {
              bindingValue = savingsItem.today || bindingValue; // Override with asset value if available
            }
          } else {
            console.warn(`No savings asset found at index: ${index}. Keeping previous binding value: ${bindingValue}`); // Log a warning if the asset does not exist
          }
        } else {
          console.warn(`Binding format not recognized: ${field.bind}`); // Log a warning if the binding format is incorrect
        }
      }

      if (field.source === 'Other') {
        // Check for combined assets binding only if field.bind is defined
        const otherIndexMatch = field.bind ? field.bind.match(/assets\[(\d+)\]/) : null; // Changed variable name to avoid shadowing
        if (otherIndexMatch) {
          const index = parseInt(otherIndexMatch[1], 10); // Extract index and convert it to an integer
          const otherAsset = documentData?.assets?.other ? documentData.assets.other[index] : undefined;

          // Check if otherAsset exists and handle the binding
          if (otherAsset) {
            if (field.bind.includes('description')) {
              bindingValue = otherAsset.description || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('today')) {
              bindingValue = otherAsset.today || bindingValue; // Override with asset value if available
            }
          } else {
            console.warn(`No asset found at index: ${index}. Keeping previous binding value: ${bindingValue}`); // Log a warning if the asset does not exist
          }
        } else {
          console.warn(`Binding format not recognized: ${field.bind}`); // Log a warning if the binding format is incorrect
        }
      }

      if (field.source === 'debts') {
        const bindMatch = field.bind ? field.bind.match(/(\w+)\[(\d+)\]\.(\w+)/) : null;

        if (bindMatch) {
          const debtType = bindMatch[1]; // Extract the debt type (e.g., mortgages, lineofcredits)
          const index = parseInt(bindMatch[2], 10); // Extract the index from the binding
          const fieldName = bindMatch[3]; // Extract the specific field name (e.g., monthlyPayment)

          const debtItem = documentData?.debts?.[debtType]?.[index];

          if (debtItem) {
            // Bind the appropriate field value based on its bind property
            bindingValue = debtItem[fieldName] || bindingValue; // Override with debt item value if available
          } else {
            console.warn(`No debt item found at index: ${index} for debt type: ${debtType}`); // Log if item not found
          }
        }
      }

      if (field.source?.startsWith('specialExpenses')) {
        const bindMatch = field.bind ? field.bind.match(/specialExpenses\.(\w+)\[(\d+)\]\.(\w+)/) : null;

        if (bindMatch) {
          const entity = bindMatch[1]; // Extract the entity (client or opposingParty)
          const index = parseInt(bindMatch[2], 10); // Extract the index
          const fieldName = bindMatch[3]; // Extract the specific field name (e.g., amount, tax)

          const specialExpenseItem = documentData?.specialExpenses?.[entity]?.[index];

          if (specialExpenseItem) {
            // Bind the appropriate field value based on its bind property
            bindingValue = specialExpenseItem[fieldName] || bindingValue; // Override with special expense item value if available
          } else {
            console.warn(`No special expense item found at index: ${index} for entity: ${entity}`); // Log if item not found
          }
        }
      }

      if (field.source === 'assets.property') {
        // Extract the specific property, index, and field name from the bind string
        const bindMatch = field.bind ? field.bind.match(/assets\.property\.(\w+)\.(\w+)/) : null;

        if (bindMatch) {
          const propertyType = bindMatch[1]; // Extract the property type (e.g., land, household, bank)
          const fieldName = bindMatch[2]; // Extract the specific field name (e.g., assets, liabilities)

          // Retrieve the specific property data from documentData
          const propertyData = documentData?.assets?.property?.[propertyType];

          if (propertyData && propertyData[fieldName] !== undefined) {
            // Override the field value with the data from documentData if available
            field.value = propertyData[fieldName];
          } else {
            console.warn(`No data found for property: ${propertyType}, field: ${fieldName}`); // Log if item not found
          }
        }
      }


      // Handling binding for 'assets.tables'
      if (field.source === 'assets.table') {
        const bindMatch = field.bind ? field.bind.match(/assets\.(\w+)\[(\d+)\]\.(\w+)/) : null;


        if (bindMatch) {
          const category = bindMatch[1]; // Extract the category (e.g., land, bank)
          const index = parseInt(bindMatch[2], 10); // Extract the index (e.g., 0, 1, 2)
          const fieldName = bindMatch[3]; // Extract the field name (e.g., today, onValuationDate)



          // Check that the sourceType matches the category in the bind string
          if (field.sourceType === category) {
            const assetItem = documentData?.assets?.[category]?.[index];
            if (assetItem) {
              // If data exists, update the field's value based on the document data
              bindingValue = assetItem[fieldName] || bindingValue;

            } else {
              console.warn(`No asset item found at index: ${index} for category: ${category}`);
            }
          } else {
            console.warn(`Field sourceType '${field.sourceType}' does not match category '${category}' in binding.`);
          }
        }
      }

      if (field.source === 'children') {
        // Check if the field has a bind property and extract the relevant information
        const bindMatch = field.bind ? field.bind.match(/theChildren\[(\d+)\]\.(\w+)/) : null;

        if (bindMatch) {
          const index = parseInt(bindMatch[1], 10); // Extract the index from the binding, e.g., 0
          const fieldName = bindMatch[2]; // Extract the specific field name, e.g., fullLegalName

          const childItem = documentData?.theChildren?.[index]; // Get the corresponding child item

          if (childItem) {
            // Bind the appropriate field value based on its bind property
            bindingValue = childItem[fieldName] || bindingValue; // Assign the value from the data or set to empty if not available
          } else {
            console.warn(`No child item found at index: ${index} for field: ${fieldName}`); // Log a warning if the item is not found
          }
        } else {
          console.error(`Failed to parse bind value: ${field.bind} for source: children`); // Log an error if the binding pattern doesn't match
        }
      }

      return { ...field, value: bindingValue }; // Return the updated field with the bound value
    });

    setFields(updatedFields); // Update state with the new fields
  };

  // 1. Add a new state to track if binding has occurred
  const [hasBindingOccurred, setHasBindingOccurred] = useState(false);

  // 2. Modify the useEffect to prevent infinite loops
  useEffect(() => {
    // Only proceed if we haven't bound the data yet and all required data is available
    if (!hasBindingOccurred && fieldsReady && documentData && combinedAssets?.items && debtsArray?.items && propertiesAssets?.items) {
      if (bindData === true) {
        bindFieldsToData(documentData, combinedAssets, debtsArray, propertiesAssets);
        setHasBindingOccurred(true); // Mark that binding has occurred
      }
    }
  }, [fieldsReady]); // Remove dependencies that change frequently

  // 3. Reset the binding flag when the form changes
  useEffect(() => {
    if (activeForm?.file_name) {
      setHasBindingOccurred(false); // Reset when form changes
      setPdfUrl(`/documents/${activeForm.file_name}.pdf`);
    }
  }, [activeForm?.file_name]);

  const addDynamicField = () => {
    const newField = {
      id: Date.now(),
      type: "TextField", // Default type, can change as needed
      x: 50, // Starting x position
      y: 200, // Adjusted y position for visibility
      width: 150,
      height: 20,
      value: "New Dynamic Field", // Default value
      fontSize: 10,
      color: [0, 0, 0], // RGB format
      background: 'none',
      border: 'none',
      page: currentPage, // Assign to current page
      source: ''
    };
    setFields([...fields, newField]); // Add new field to the existing fields
  };

  const addDateField = () => {
    const newField = {
      id: Date.now(),
      type: "Date",
      x: 50,
      y: 200,
      width: 150,
      height: 20,
      value: "",
      fontSize: 10,
      color: [0, 0, 0],
      background: 'none',
      border: 'none',
      page: currentPage,
      dateFormat: 'MM/DD/YYYY'
    };
    setFields([...fields, newField]);
  };

  const addDynamicNumberField = () => {
    const newField = {
      id: Date.now(),
      type: "Number", // Default type, can change as needed
      x: 50, // Starting x position
      y: 200, // Adjusted y position for visibility
      width: 150,
      height: 20,
      value: "New Dynamic Field", // Default value
      fontSize: 10,
      color: [0, 0, 0], // RGB format
      background: 'none',
      border: 'none',
      page: currentPage, // Assign to current page
      source: ''
    };
    setFields([...fields, newField]); // Add new field to the existing fields
  };

  const addDynamicTextArea = () => {
    const newField = {
      id: Date.now(),
      type: "TextArea", // Default type, can change as needed
      x: 50, // Starting x position
      y: 200, // Adjusted y position for visibility
      width: 150,
      height: 25,
      value: "New Dynamic TextArea", // Default value
      fontSize: 10,
      color: [0, 0, 0], // RGB format
      background: 'none',
      border: 'none',
      page: currentPage // Assign to current page
    };
    setFields([...fields, newField]); // Add new field to the existing fields
  };

  const addCheckboxField = () => {
    const newField = {
      id: fields.length + 1, // Assign a new ID (or use a more robust ID generation method)
      type: 'CheckBox',
      x: 0, // Default x position
      y: 0, // Default y position
      width: 20, // Default width
      height: 20, // Default height
      value: 'unchecked', // Initial state of checkbox
      fontSize: 10, // Default font size
      color: [0, 0, 0], // Default color (RGB)
      page: currentPage // Associate with the current page
    };

    setFields((prevFields) => [...prevFields, newField]);
  };

  // TABLES
  const handleEditField = (id, value) => {



    setFields(fields.map(field =>
      field.id === id ? { ...field, value } : field
    ));
  };

  // Modify the handleFieldSelection function
  const handleFieldSelection = (event, field) => {
    if (event.shiftKey) {
      setSelectedFields(prev => {
        const isSelected = prev.some(f => f.id === field.id);
        if (isSelected) {
          return prev.filter(f => f.id !== field.id);
        }
        return [...prev, field];
      });
    } else if (!selectedFields.some(f => f.id === field.id)) {
      setSelectedFields([field]);
    }
    setSelectedField(field);
  };

  const savePdf = async () => {
    if (!fields || !Array.isArray(fields)) {
      console.error("Fields is null or not an array.");
      return;
    }

    const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const form = pdfDoc.getForm();

    if (fields.length > 0) {
      fields.forEach(field => {
        const pageIndex = field.page - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) {
          console.error(`Page index ${pageIndex + 1} is out of bounds.`);
          return;
        }

        const page = pages[pageIndex];

        const fieldProperties = {
          x: parseFloat(field.x) || 0,
          y: page.getHeight() - parseFloat(field.y) - (parseFloat(field.height) / scale),
          width: parseFloat(field.width) / scale,
          height: parseFloat(field.height) / scale,
          textColor: rgb(0, 0, 0),
          borderWidth: 0
        };

        if (field.type === 'TextField' || field.type === 'Number' || field.type === 'TextArea') {
          const textField = form.createTextField(field.id.toString());
          textField.addToPage(page, fieldProperties);

          const widgets = textField.acroField.getWidgets();
          widgets.forEach(widget => {
            const dict = widget.dict;
            dict.delete(PDFName.of('BS'));
            dict.delete(PDFName.of('MK'));
            dict.delete(PDFName.of('BG'));
          });

          if (field.type === 'TextArea') {
            textField.enableMultiline();
          }

          const value = field.value != null ? String(field.value) : '';
          textField.setText(value);
          textField.setFontSize(8);

          if (readOnly) {
            textField.enableReadOnly();
          }
        }
        else if (field.type === 'CheckBox') {
          const checkbox = form.createCheckBox(field.id.toString());

          // Add checkbox with minimal properties
          checkbox.addToPage(page, {
            x: parseFloat(field.x) || 0,
            y: page.getHeight() - parseFloat(field.y) - (15 / scale),
            width: 10,
            height: 10,
            borderWidth: 0,
            borderColor: rgb(0, 0, 0, 0)  // Fully transparent border color
          });

          // Set appearance characteristics for the checkbox
          const widgets = checkbox.acroField.getWidgets();
          widgets.forEach(widget => {
            const dict = widget.dict;

            // Remove border and background settings
            dict.delete(PDFName.of('BS'));
            dict.delete(PDFName.of('MK'));
            dict.delete(PDFName.of('BG'));

            // Set default appearance for text color (for the checkmark)
            dict.set(PDFName.of('DA'), PDFName.of('/ZaDb 0 Tf 0 g'));
          });

          if (readOnly) {
            checkbox.enableReadOnly();
          }

          // Set the checkbox state
          if (field.value === 'checked') {
            checkbox.check();
          } else {
            checkbox.uncheck();
          }
        }
      });
    } else {
      console.error("No fields available to save.");
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const pdfBlobUrl = URL.createObjectURL(blob);
    setShowAddFolderModal(true);
    setBlobUrl(pdfBlobUrl);
  };


  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // Handle mouse move to update the mouse position
  // const handleMouseMove = (e) => {
  //   const pdfCanvas = document.querySelector('#pdfContainer');
  //   const rect = pdfCanvas.getBoundingClientRect();

  //   // Adjust mouse position based on the canvas's bounding rectangle
  //   const mouseX = e.clientX - rect.left;
  //   const mouseY = e.clientY - rect.top;

  //   setMousePosition({ x: mouseX, y: mouseY });
  // };

  const handleClickOutside = (e) => {
    const pdfCanvas = document.querySelector('.pdf-canvas');
    const isDragging = document.querySelector('.react-draggable-dragging');

    if (pdfCanvas &&
      pdfCanvas.contains(e.target) &&
      !e.target.closest('.react-draggable') &&
      !isDragging) {
      setSelectedField(null);
      setSelectedFields([]);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();

    if (draggedField) {
      const pdfCanvas = document.querySelector('#pdfContainer');
      const rect = pdfCanvas.getBoundingClientRect();

      // Calculate the adjusted position
      const adjustedX = (mousePosition.x - rect.left) / scale; // Adjusted for scale
      const adjustedY = (mousePosition.y - rect.top) / scale; // Adjusted for scale

      // Add the new field at the adjusted position
      setFields(prevFields => [
        ...prevFields,
        {
          id: Date.now(), // Use a unique ID
          value: draggedField.value,
          width: 150,
          height: 25,
          x: adjustedX,
          y: adjustedY,
          fontSize: 10,
          color: [0, 0, 0], // RGB format
          background: 'none',
          border: 'none',
          page: currentPage, // Assign to current page
          type: "TextField", // Default type
        },
      ]);

      setDraggedField(null); // Clear the dragged field
    }
  };

  const [initialPositions, setInitialPositions] = useState(null);

  const handleDragStart = (e, field) => {
    if (selectedFields.length > 1) {
      // Store the initial positions of all selected fields when dragging starts
      const positions = selectedFields.map(selectedField => ({
        id: selectedField.id,
        startX: selectedField.x,
        startY: selectedField.y,
      }));
      setInitialPositions(positions);
    }
  };

  const handleDrag = (e, d, field) => {
    if (selectedFields.length > 1 && initialPositions) {
      const initialPosition = initialPositions.find(pos => pos.id === field.id);

      if (!initialPosition) {
        console.error(`Error: Initial position not found for field with ID: ${field.id}`);
        return;
      }

      const deltaX = (d.x / scale) - initialPosition.startX;
      const deltaY = (d.y / scale) - initialPosition.startY;

      setFields((prevFields) => {
        const newFields = prevFields.map((f) => {
          const pos = initialPositions.find(position => position.id === f.id);
          if (selectedFields.some(selected => selected.id === f.id) && pos) {
            return {
              ...f,
              x: pos.startX + deltaX,
              y: pos.startY + deltaY,
            };
          }
          return f;
        });
        updateHistory(newFields);
        return newFields;
      });
    } else {
      const newX = d.x / scale;
      const newY = d.y / scale;

      setFields((prevFields) => {
        const newFields = prevFields.map((f) =>
          f.id === field.id ? { ...f, x: newX, y: newY } : f
        );
        updateHistory(newFields);
        return newFields;
      });
    }
  };

  const handleDeleteField = () => {
    if (selectedField) {
      setFields(fields.filter(field => field.id !== selectedField.id)); // Remove the selected field
      setSelectedField(null); // Clear selection after deletion
      setSelectedField(null)
    }
  };

  const updateField = (updatedField) => {
    if (selectedFields.length > 1) {
      // Handle multi-field update
      setFields((prevFields) =>
        prevFields.map((field) => {
          // Check if this field is one of the selected fields
          if (selectedFields.some(selectedField => selectedField.id === field.id)) {
            // Only update width and height for multiple selections
            return {
              ...field,
              width: updatedField.width || field.width,
              height: updatedField.height || field.height
            };
          }
          return field;
        })
      );

      // Update the selected fields state to reflect the changes
      setSelectedFields(prevSelected =>
        prevSelected.map(field => ({
          ...field,
          width: updatedField.width || field.width,
          height: updatedField.height || field.height
        }))
      );
    } else {
      setFields((prevFields) =>
        prevFields.map((field) => (field.id === updatedField.id ? updatedField : field))
      );
    }
    setSelectedField(updatedField); // Update selected field state
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    if (isDataSidebarOpen) {
      setIsDataSidebarOpen(false); // Close Data List if Forms List is opened
    }
  };

  // Add these utility functions at the top of your file
  const formatCellValue = (value, type) => {
    if (value === null || value === undefined) return '';

    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'number':
        return Number(value).toLocaleString();
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
    }
  };

  // Enhanced table creation handler
  const handleCreateTable = (tableData) => {
    // Detect column types from the first row of data
    const columnTypes = tableData.headers.reduce((types, header) => {
      const firstValue = tableData.rows[0]?.[tableData.headers.indexOf(header)];
      let type = 'string';

      if (!isNaN(Date.parse(firstValue))) {
        type = 'date';
      } else if (!isNaN(firstValue) && typeof firstValue !== 'boolean') {
        type = 'number';
      } else if (typeof firstValue === 'boolean' || firstValue === 'true' || firstValue === 'false') {
        type = 'boolean';
      }

      return { ...types, [header]: type };
    }, {});

    // Format the data for display
    const formattedRows = tableData.rows.map(row =>
      row.map((cell, index) => formatCellValue(cell, columnTypes[tableData.headers[index]]))
    );

    // Calculate column widths based on content
    const columnWidths = tableData.headers.map(header => {
      const headerLength = header.length;
      const maxContentLength = Math.max(
        headerLength,
        ...tableData.rows.map(row =>
          String(row[tableData.headers.indexOf(header)] || '').length
        )
      );
      return Math.min(Math.max(maxContentLength * 8, 60), 200); // Min 60px, Max 200px
    });

    // Calculate total width if not provided
    const calculatedWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    const finalWidth = tableData.width || calculatedWidth;

    // Calculate row height based on content
    const baseRowHeight = 25; // Base height for single line
    const rowHeights = [baseRowHeight]; // Header row height
    formattedRows.forEach(row => {
      const maxLines = Math.max(...row.map(cell =>
        Math.ceil(String(cell).length * 8 / (finalWidth / row.length))
      ));
      rowHeights.push(Math.max(baseRowHeight, maxLines * 20));
    });

    // Calculate total height if not provided
    const calculatedHeight = rowHeights.reduce((sum, height) => sum + height, 0);
    const finalHeight = tableData.height || calculatedHeight;

    const newField = {
      id: Date.now(),
      type: "Table",
      x: 50,
      y: 200,
      width: finalWidth,
      height: finalHeight,
      data: [
        tableData.headers,
        ...formattedRows
      ],
      styles: {
        columnWidths,
        rowHeights,
        headerStyle: {
          backgroundColor: '#f3f4f6',
          fontWeight: 'bold',
          fontSize: 11
        },
        cellStyle: {
          fontSize: 10,
          padding: 4,
          borderColor: '#e5e7eb'
        },
        columnTypes, // Store column types for proper formatting
      },
      fontSize: 10,
      color: [0, 0, 0],
      page: currentPage,
      source: 'children',
      isEditable: false, // Control whether users can edit table contents
      sortable: true, // Enable column sorting
      metadata: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        originalData: {
          headers: tableData.headers,
          rows: tableData.rows // Store original unformatted data
        }
      }
    };

    // Add to fields array
    setFields(prevFields => [...prevFields, newField]);

    // Optional: Scroll to the newly added table
    setTimeout(() => {
      const tableElement = document.getElementById(`table-${newField.id}`);
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    return newField; // Return the created field for further use if needed
  };

  // Add these functions to handle alignment
  const alignFields = (direction) => {
    if (selectedFields.length < 2) return;

    setFields(prevFields => {
      const newFields = [...prevFields];
      const selectedIds = selectedFields.map(f => f.id);

      // For distribute evenly
      if (direction === 'distributeHorizontal') {
        const sortedFields = selectedFields.sort((a, b) => a.x - b.x);
        const start = sortedFields[0].x;
        const end = sortedFields[sortedFields.length - 1].x;
        const totalWidth = end - start;
        const spacing = totalWidth / (selectedFields.length - 1);

        return newFields.map(field => {
          if (selectedIds.includes(field.id)) {
            const index = sortedFields.findIndex(f => f.id === field.id);
            return {
              ...field,
              x: start + (spacing * index)
            };
          }
          return field;
        });
      }

      if (direction === 'distributeVertical') {
        const sortedFields = selectedFields.sort((a, b) => a.y - b.y);
        const start = sortedFields[0].y;
        const end = sortedFields[sortedFields.length - 1].y;
        const totalHeight = end - start;
        const spacing = totalHeight / (selectedFields.length - 1);

        return newFields.map(field => {
          if (selectedIds.includes(field.id)) {
            const index = sortedFields.findIndex(f => f.id === field.id);
            return {
              ...field,
              y: start + (spacing * index)
            };
          }
          return field;
        });
      }

      // Original alignment logic...
      let targetX, targetY;
      switch (direction) {
        case 'left':
          targetX = Math.min(...selectedFields.map(f => f.x));
          break;
        case 'right':
          targetX = Math.max(...selectedFields.map(f => f.x));
          break;
        case 'top':
          targetY = Math.min(...selectedFields.map(f => f.y));
          break;
        case 'bottom':
          targetY = Math.max(...selectedFields.map(f => f.y));
          break;
        case 'center':
          const minX = Math.min(...selectedFields.map(f => f.x));
          const maxX = Math.max(...selectedFields.map(f => f.x + f.width));
          targetX = minX + (maxX - minX) / 2;
          break;
      }

      return newFields.map(field => {
        if (selectedIds.includes(field.id)) {
          switch (direction) {
            case 'left':
            case 'right':
              return { ...field, x: targetX };
            case 'top':
              return { ...field, y: targetY };
            case 'bottom':
              return { ...field, y: targetY };
            case 'center':
              return { ...field, x: targetX - (field.width / 2) };
            default:
              return field;
          }
        }
        return field;
      });
    });
  };

  const formatDate = (date, format) => {
    const pad = (num) => num.toString().padStart(2, '0');
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const year = date.getFullYear();

    switch (format) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        return `${month}/${day}/${year}`;
    }
  };

  // Handle cell editing
  const handleCellEdit = (fieldId, rowIndex, cellIndex, newValue) => {
    setFields(prevFields => prevFields.map(field => {
      if (field.id === fieldId) {
        const newData = [...field.data];
        newData[rowIndex + 1][cellIndex] = newValue;
        return {
          ...field,
          data: newData,
          metadata: {
            ...field.metadata,
            lastModified: new Date().toISOString()
          }
        };
      }
      return field;
    }));
  };

  // Handle column sorting
  const handleSort = (fieldId, columnIndex) => {
    setFields(prevFields => prevFields.map(field => {
      if (field.id === fieldId) {
        const headers = field.data[0];
        const rows = field.data.slice(1);

        const sortedRows = rows.sort((a, b) => {
          const aVal = a[columnIndex];
          const bVal = b[columnIndex];

          const columnType = field.styles.columnTypes[headers[columnIndex]];

          switch (columnType) {
            case 'date':
              return new Date(aVal) - new Date(bVal);
            case 'number':
              return Number(aVal) - Number(bVal);
            default:
              return String(aVal).localeCompare(String(bVal));
          }
        });

        return {
          ...field,
          data: [headers, ...sortedRows],
          metadata: {
            ...field.metadata,
            lastModified: new Date().toISOString()
          }
        };
      }
      return field;
    }));
  };

  // Add these state variables at the top with your other states
  const [isDragging, setIsDragging] = useState(false);
  const [selectionBox, setSelectionBox] = useState({ startX: 0, startY: 0, endX: 0, endY: 0 });
  const [dragStartPosition, setDragStartPosition] = useState(null);

  // Add these helper functions
  const getFieldsInSelectionBox = (box) => {
    const normalizedBox = {
      left: Math.min(box.startX, box.endX),
      right: Math.max(box.startX, box.endX),
      top: Math.min(box.startY, box.endY),
      bottom: Math.max(box.startY, box.endY)
    };

    return fields.filter(field => {
      if (field.page !== currentPage) return false;
      
      const fieldBox = {
        left: field.x * scale,
        right: (field.x * scale) + (field.width),
        top: field.y * scale,
        bottom: (field.y * scale) + (field.height)
      };

      return fieldBox.left < normalizedBox.right &&
             fieldBox.right > normalizedBox.left &&
             fieldBox.top < normalizedBox.bottom &&
             fieldBox.bottom > normalizedBox.top;
    });
  };

  // // Update your handleMouseMove function
  const handleMouseMove = (e) => {
    if (isDragging) {
      const pdfCanvas = document.querySelector('#pdfContainer');
      const rect = pdfCanvas.getBoundingClientRect();
      
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      
      setSelectionBox(prev => ({
        ...prev,
        endX: currentX,
        endY: currentY
      }));
    }
  };

  // Add these new handlers
  const handleMouseDown = (e) => {
    // Only start dragging if it's a left click and not on a field
    if (e.button === 0 && !e.target.closest('.react-draggable')) {
      const pdfCanvas = document.querySelector('#pdfContainer');
      const rect = pdfCanvas.getBoundingClientRect();
      
      const startX = e.clientX - rect.left;
      const startY = e.clientY - rect.top;
      
      setIsDragging(true);
      setSelectionBox({
        startX,
        startY,
        endX: startX,
        endY: startY
      });
      setDragStartPosition({ x: startX, y: startY });
    }
  };

  const handleMouseUp = (e) => {
    if (isDragging) {
      const selectedFields = getFieldsInSelectionBox(selectionBox);
      setSelectedFields(selectedFields);
      if (selectedFields.length === 1) {
        setSelectedField(selectedFields[0]);
      }
      setIsDragging(false);
    }
  };

  return (
    <Layout title={`Welcome ${response.first_name} ${response.last_name}`}>
      <div className="fill-information-page panel trans">
        <div className="pBody">
          <div className="row">
            <div className={isSidebarOpen ? "col-md-9" : "col-md-12"}>
              <div className="page-content">
                <div className="head d-flex justify-content-between align-items-center">
                  {activeForm?.title || 'No Title'}
                  {/* <button className='btn btnPrimary' onClick={toggleSidebar}>
                    {isSidebarOpen ? 'Hide Forms List' : 'Show Forms List'}
                  </button> */}
                  <div style={{alignItems:'right', display:'flex', gap:'10px'}}>
                  <button className='btn btnPrimary' onClick={handleSave}>
                   Save Document
                  </button>
                  
                  <button className='btn btnPrimary' onClick={savePdf}>
                   Download Document
                  </button>
                  </div>
                </div>
                <div className="body">
                  {/* Toolbar */}
                  <div className="toolbar">
                    <ModernToolbar
                      currentPage={currentPage}
                      numPages={numPages}
                      setCurrentPage={setCurrentPage}
                      selectedField={selectedField}
                      handleDeleteField={handleDeleteField}
                      addDynamicNumberField={addDynamicNumberField}
                      addDynamicField={addDynamicField}
                      addDynamicTextArea={addDynamicTextArea}
                      addCheckboxField={addCheckboxField}
                      handleSave={handleSave}
                      savePdf={savePdf}
                      selectedFields={selectedFields}
                      onAlignFields={alignFields}
                      addDateField={addDateField}
                      saveFields={handleSaveFields}
                      documentData={documentData}
                      setFields={setFields}
                    />
                  </div>
                  <div id="pdf-content" >
                    {pdfUrl && (
                      <div 
                        id='pdfContainer' 
                        style={{ 
                          flex: 1, 
                          position: 'relative',
                          cursor: isDragging ? 'crosshair' : 'default'
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                      >
                        {/* Add the selection box overlay */}
                        {isDragging && (
                          <div
                            style={{
                              position: 'absolute',
                              left: Math.min(selectionBox.startX, selectionBox.endX),
                              top: Math.min(selectionBox.startY, selectionBox.endY),
                              width: Math.abs(selectionBox.endX - selectionBox.startX),
                              height: Math.abs(selectionBox.endY - selectionBox.startY),
                              border: '2px dashed black',
                              pointerEvents: 'none'
                            }}
                          ></div>
                        )}
                        {/* PDF Viewer */}
                        <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
                          <Page
                            className="pdf-canvas"
                            pageNumber={currentPage}
                            scale={scale}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            // onMouseMove={handleMouseMove} // Capture mouse position while dragging
                            onDrop={handleDrop} // Handle drop event
                            onDragOver={(e) => e.preventDefault()} // Prevent default to allow dropping
                          >
                            {fields.map(field => (
                              field.page === currentPage && (
                                <Rnd
                                  key={field.id}
                                  size={{ width: field.width, height: field.height }} // Set Rnd size based on field properties
                                  position={{ x: field.x * scale, y: field.y * scale }} // Use scaled x and y position
                                  enableResizing={resizeEnabled} // Disable resizing completely
                                  onDragStart={(e) => handleDragStart(e, field)}
                                  onDrag={(e, d) => handleDrag(e, d, field)} // Real-time position updates
                                  onResizeStop={(e, direction, ref, delta, position) => {
                                    // Prevent resizing for Checkbox type
                                    if (field.type === 'Checkbox') return; // Do nothing if it's a checkbox

                                    const newWidth = ref.offsetWidth; // Get the new width
                                    const newHeight = ref.offsetHeight; // Get the new height

                                    // Update fields state with new width, height, and position
                                    setFields((prevFields) =>
                                      prevFields.map((f) =>
                                        f.id === field.id ? {
                                          ...f,
                                          width: newWidth,
                                          height: newHeight,
                                          x: position.x / scale, // Convert position to original scale
                                          y: position.y / scale, // Convert position to original scale
                                        } : f
                                      )
                                    );
                                  }}
                                  bounds="parent"
                                  style={{
                                    border: field.border,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    background: 'white',
                                  }}
                                  onClick={(event) => handleFieldSelection(event, field)} // Pass the event to detect Shift key
                                >
                                  <div
                                    style={{
                                      position: 'relative',
                                      width: '100%', // Fill the parent width
                                      height: '100%', // Fill the parent height
                                      fontSize: field.fontSize,
                                      padding: '0',
                                      backgroundColor: selectedFields.some(selected => selected.id === field.id) ? 'rgba(0, 123, 255, 0.5)' : 'transparent',
                                      cursor: selectedFields.length > 0 ? 'move' : 'pointer',
                                    }}

                                  >
                                    {field.type === 'TextField' ? (
                                      <input
                                        type="text"
                                        value={field.value}
                                        onChange={(e) => handleEditField(field.id, e.target.value)}
                                        style={{
                                          fontSize: field.fontSize,
                                          color: `rgb(${field.color[0]}, ${field.color[1]}, ${field.color[2]})`,
                                          width: '100%',
                                          border: `1px solid rgb(255, 144, 0, 0.5)`,
                                          background: field.background,
                                          height: '100%',
                                          boxSizing: 'border-box',
                                          backgroundColor: `rgb(255, 144, 0, 0.2)`,
                                        }}
                                      />
                                    ) : field.type === 'TextArea' ? (
                                      <textarea
                                        value={field.value}
                                        onChange={(e) => handleEditField(field.id, e.target.value)}
                                        style={{
                                          fontSize: field.fontSize,
                                          color: `rgb(${field.color[0]}, ${field.color[1]}, ${field.color[2]})`,
                                          width: '100%',
                                          height: '100%',
                                          border: `1px solid rgb(255, 144, 0, 0.5)`,
                                          backgroundColor: `rgb(255, 144, 0, 0.2)`,
                                          boxSizing: 'border-box',
                                        }}
                                      />
                                    ) : field.type === 'Table' ? (
                                      <>
                                        <div
                                          id={`table-${field.id}`}
                                          style={{
                                            width: '100%',
                                            height: '100%',
                                            overflow: 'auto'
                                          }}
                                        >
                                          <table style={{
                                            width: '100%',
                                            borderCollapse: 'collapse',
                                            fontSize: field.fontSize
                                          }}>
                                            <thead>
                                              <tr>
                                                {field.data[0].map((header, index) => (
                                                  <th
                                                    key={index}
                                                  >
                                                    {header}
                                                    {field.sortable && (
                                                      <button
                                                        onClick={() => handleSort(field.id, index)}
                                                        style={{ marginLeft: 4 }}
                                                      >
                                                        ↕️
                                                      </button>
                                                    )}
                                                  </th>
                                                ))}
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {field.data.slice(1).map((row, rowIndex) => (
                                                <tr key={rowIndex}>
                                                  {row.map((cell, cellIndex) => (
                                                    <td
                                                      key={cellIndex}
                                                    >
                                                      {field.isEditable ? (
                                                        <input
                                                          type="text"
                                                          value={cell}
                                                          onChange={(e) => handleCellEdit(field.id, rowIndex, cellIndex, e.target.value)}
                                                          style={{ width: '100%', border: 'none', background: 'transparent' }}
                                                        />
                                                      ) : (
                                                        cell
                                                      )}
                                                    </td>
                                                  ))}
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </>
                                    ) : field.type === 'Number' ? (
                                      <>

                                        <CurrencyFormat
                                          style={{
                                            fontSize: field.fontSize,
                                            color: `rgb(${field.color[0]}, ${field.color[1]}, ${field.color[2]})`,
                                            width: '100%',
                                            border: `1px solid rgb(255, 144, 0, 0.5)`,
                                            background: field.background,
                                            height: '100%',
                                            boxSizing: 'border-box',
                                            backgroundColor: `rgb(255, 144, 0, 0.2)`,
                                          }}
                                          id={field.id}
                                          value={field.value}
                                          thousandSeparator={true}
                                          prefix={''}
                                          onValueChange={(values) => {
                                            const { formattedValue, value } = values;
                                          }}
                                          onChange={(e) => handleEditField(field.id, e.target.value)}
                                        />
                                      </>
                                    ) :
                                      field.type === 'Date' ? (
                                        <>
                                          <input
                                            type="date"
                                            value={field.value}
                                            onChange={(e) => {
                                              const date = new Date(e.target.value);
                                              const formattedDate = formatDate(date, field.dateFormat);
                                              handleEditField(field.id, formattedDate);
                                            }}
                                            style={{
                                              fontSize: field.fontSize,
                                              color: `rgb(${field.color[0]}, ${field.color[1]}, ${field.color[2]})`,
                                              width: '100%',
                                              border: `1px solid rgb(255, 144, 0, 0.5)`,
                                              background: field.background,
                                              height: '100%',
                                              boxSizing: 'border-box',
                                              backgroundColor: `rgb(255, 144, 0, 0.2)`,
                                            }}
                                          />
                                        </>
                                      ) : (
                                        <label style={{ display: 'flex', alignItems: 'center' }}>
                                          <input
                                            type="checkbox"
                                            checked={field.value === 'checked'}
                                            onChange={() => {
                                              setFields((prevFields) =>
                                                prevFields.map((f) =>
                                                  f.id === field.id ? { ...f, value: f.value === 'checked' ? 'unchecked' : 'checked' } : f
                                                )
                                              );
                                            }}
                                            style={{
                                              width: '20px',
                                              height: '20px',
                                              cursor: 'pointer',
                                              marginRight: '5px'
                                            }}
                                          />
                                        </label>
                                      )}
                                  </div>
                                </Rnd>


                              )
                            ))}
                          </Page>
                        </Document>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className={`col-md-3 sidebar-container ${isSidebarOpen ? 'open' : 'closed'}`}>
              <div className="page-sidebar">
                <div className="head">List of Forms</div>
                <div className="body">
                  <div className="content">
                    {/* {selectedFields && (
                      <>
                        <CustomizationToolbar selectedField={selectedField} updateField={updateField} sampleData={documentInfo} />
                      </>
                    )} */}

                    <CalculationManager
                      fields={fields}
                      setFields={setFields}
                      selectedFields={selectedFields} // Pass the selected fields
                      currentPage={currentPage}  // Add this prop
                    />

                    {forms.map((form, index) => (
                      <div
                        className="form-checkbox"
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const newForms = [...forms];
                          newForms[index].checked = !newForms[index].checked;
                          setForms(newForms);
                          setActiveForm(newForms[index]);
                          setNumPages(null);
                          setCurrentPage(1)
                          setFields([])
                          setFieldsReady(false);
                        }}
                      >
                        <button className={`btn btnPrimary mb-2 w-100 ${activeForm.shortTitle === form.shortTitle ? 'button-active' : ''}`}>{form.shortTitle}</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <GeneralModal
        show={showAddFolderModal}
        changeShow={() => setShowAddFolderModal(false)}
        handleClick={() => setShowAddFolderModal(false)}
        heading={`Preview PDF: ${activeForm.title}`}
        size='sm'
        dialogClassName={'matterModal'}
      >
        {pdfUrl && (
          <iframe src={blobUrl} style={{ width: '100%', height: '500px' }} title="PDF Preview"></iframe>
        )}
      </GeneralModal>
    </Layout>
  );
};

export default FillPdf;
