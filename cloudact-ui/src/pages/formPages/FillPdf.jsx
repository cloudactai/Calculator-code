import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import Layout from "../../components/LayoutComponents/Layout";
import { useLocation, useParams } from "react-router-dom";
import { useHistory } from 'react-router-dom';
// import { Margin, usePDF } from "react-to-pdf";
import toast from "react-hot-toast";
import GeneralModal from "../../components/Matters/Modals/GeneralModal";
import { PDFDocument, PDFName, rgb, StandardFonts } from 'pdf-lib';
import { pdfjs } from 'react-pdf';
import '../../components/FormPages/forms/App.css'; // Ensure this CSS file is included for styles
import 'react-resizable/css/styles.css';
import ModernToolbar from "../../components/FormPages/forms/newComponents/ModernToolbar";
import CalculationManager from "../../components/FormPages/forms/newComponents/CalculationManager";
import PDFViewer from "./PDFViewer";
import Loader from "../../components/Loader";
import axios from "../../utils/axios";
import { formsService } from "../../services/formsService";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const FillPdf = ({ currentUserRole }) => {
  const location = useLocation();
  const { matterNumber: routeMatterNumber, documentId: routeDocumentId } = useParams();
  const history = useHistory();
  const formData = location.state?.formData || { matterNumber: routeMatterNumber };
  const [pdfUrl, setPdfUrl] = useState(null);
  const { response } = useSelector((state) => state.userProfileInfo);
  const [fields, setFields] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [fieldsReady, setFieldsReady] = useState(false);
  const [scale, setScale] = useState(1.5); // Zoom level
  const [pdfDoc, setPdfDocument] = useState(null);
  const [selectedField, setSelectedField] = useState(null); // Track selected field for customization
  const [selectedFields, setSelectedFields] = useState([]);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false)
  const [blobUrl, setBlobUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFormLoading, setIsFormLoading] = useState(false); // Add this new state
  const [shouldRenderPdf, setShouldRenderPdf] = useState(true);

  const readOnly = true;
  const [isSaving, setIsSaving] = useState(false);
  const [remoteDocument, setRemoteDocument] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!routeMatterNumber || !routeDocumentId) return;
    formsService.getDocument(routeMatterNumber, routeDocumentId)
      .then((document) => {
        setLoadError("");
        setRemoteDocument(document);
        const form = {
          id: document.id,
          docId: document.docId,
          file_name: document.file_name,
          title: document.file_name,
          shortTitle: document.file_name,
          folder_id: document.folder_id,
          revision: document.revision,
        };
        setForms([form]);
        setActiveForm(form);
      })
      .catch(() => {
        setLoadError("Could not load this saved form. Return to the matter and try again.");
        setIsLoading(false);
        toast.error("Could not load this saved form.");
      });
  }, [routeMatterNumber, routeDocumentId]);

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

  const handleBack = () => {
    if (window.history.length > 1) {
      history.goBack();
    } else {
      history.push('/dashboard'); // <-- Replace with your fallback route
    }
  };

  // First, create a helper function to get the initial forms
  const getInitialForms = () => [];

  // Initialize the forms
  const initialForms = getInitialForms();

  // Set up state with the initial forms
  const [forms, setForms] = useState(initialForms);
  const [activeForm, setActiveForm] = useState(() => {
    // Use a state initializer function to prevent re-computation
    return initialForms.length > 0 ? initialForms[0] : null;
  });

  const fetchFormPdf = async (formName) => {
    try {
      const response = await axios.get(`/fetch-pdf?fileName=${formName}.pdf`, {
        responseType: "blob",
      });
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfUrl);
    } catch (error) {
      console.error("Error fetching the PDF:", error);
    }
  };

  useEffect(() => {
    if (activeForm?.docId) {
      fetchFormPdf(activeForm.docId);
    }
  }, [activeForm]);


  useEffect(() => {
    if (!pdfUrl || !remoteDocument) {
      return;
    }

    const loadPdf = async () => {
      try {


        // Load PDF document
        const response = await fetch(pdfUrl);
        const arrayBuffer = await response.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        setNumPages(pdfDoc.getPageCount());
        setPdfDocument(pdfDoc);

        const staticFields = remoteDocument.mapping?.staticFields;
        if (!Array.isArray(staticFields)) throw new Error('The form field mapping is unavailable.');
        setFields(staticFields.map((field) => remoteDocument.fieldValues?.[field.id] !== undefined
          ? { ...field, value: remoteDocument.fieldValues[field.id] }
          : field));

        setFieldsReady(true);
      } catch (error) {
        console.error('Error loading the PDF:', error);
      } finally {
        setIsLoading(false);
        setIsFormLoading(false); // End loading state
      }
    };
    setIsFormLoading(true); // Ensure loading state is active
    setIsLoading(true);
    loadPdf();
  }, [pdfUrl, activeForm, remoteDocument]);

  // Add this function inside your PDFViewer component
  const formatDate = (date, format = 'MM/DD/YYYY') => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const pad = (num) => num.toString().padStart(2, '0');
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const year = d.getFullYear();

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

  /*
   * Retired legacy client-side prefill engine. Persisted forms now receive
   * their mapping and prefilled values from the authenticated Forms API above.
   * It remains excluded from execution pending its physical removal in a
   * dedicated source-size cleanup; it must not be called by this editor.
   */
  /*
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '';

    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age;
  };

  const generateDetails = (asset) => {
    if (asset.details) return asset.details

    switch (asset.key) {
      case 'bank_accounts_savings_securities_pension':
        return [asset.institution, asset.description]
          .filter(Boolean)
          .join(', ')

      case 'lands':
        return [asset.ownership, asset.address]
          .filter(Boolean)
          .join(', ')

      case 'other_property':
        return asset.details || ''

      case 'money_owed_to_you':
        return asset.details || ''

      case 'business_interest':
        return [asset.firm_name, asset.interest]
          .filter(Boolean)
          .join(', ')

      case 'life_and_disability_insurance':
        return [asset.policy_no, asset.insurance_type]
          .filter(Boolean)
          .join(', ')

      case 'general_household_items_and_vehicles':
        return [asset.description, asset.isInPossession]
          .filter(Boolean)
          .join(', ')

      default:
        return ''
    }
  }

  // Bind fields to the data received from the API
  // Function to bind fields to document data and combined assets
  const bindFieldsToData = (staticFields, documentData, combinedAssets, debtsArray, propertiesAssets) => {
    // First pass: collect all age calculations
    const ageUpdates = new Map();
    staticFields.forEach(field => {
      if (field.type === 'Date' && field.linkedAgeField) {
        const keys = field.bind.split(',').map(key => key.trim());
        const valuesFromDocument = keys.map(key => {
          return key.split('.').reduce((acc, curr) => acc && acc[curr], documentData) || '';
        });
        const bindingValue = valuesFromDocument.length > 1 ? valuesFromDocument.join(', ') : valuesFromDocument[0];
        const age = calculateAge(bindingValue);
        ageUpdates.set(field.linkedAgeField, age.toString());
      }
    });

    // Second pass: update all fields
    const updatedFields = staticFields.map(field => {
      // If this is an age field and we have an update for it, use that value
      if (ageUpdates.has(field.id)) {
        return { ...field, value: ageUpdates.get(field.id) };
      }

      // Rest of your existing field binding logic
      let bindingValue = field.value;
      if (field.bind) {
        // Split the bind string into an array of keys
        const keys = field.bind.split(',').map(key => key.trim());

        // Retrieve values from the document data
        const valuesFromDocument = keys.map(key => {
          return key.split('.').reduce((acc, curr) => acc && acc[curr], documentData) || ''; // Safely traverse the data object
        });

        // If there's only one binding, assign that value; if multiple, join the values
        bindingValue = valuesFromDocument.length > 1 ? valuesFromDocument.join(', ') : valuesFromDocument[0];

        // If this is a date field with a linked age field, recalculate the age
        if (field.type === 'Date' && field.linkedAgeField) {
          const age = calculateAge(bindingValue);
          // Find and update the linked age field
          const linkedField = fields.find(f => f.id === field.linkedAgeField);
          if (linkedField) {
            linkedField.value = age.toString();

          }
        }
      }
      // Add new handling for assets.land
      if (field.source === 'assets.lands' || (field.bind && field.bind.includes("assets.land"))) {
        // Get all land assets where property_status is an empty string
        const landAssets = documentData?.assets?.land?.filter(asset =>
          asset.property_status === ""
        ) || [];
        if (landAssets.length > 0 && (field.sourceType === 'land' || field.sourceType === 'Lands' || (field.bind && field.bind.includes("assets.land")))) {
          // Find the specific land asset based on the index in the bind property
          const bindExpressions = field.bind?.split(',').map(b => b.trim()) || [];
          const values = [];
          for (const bind of bindExpressions) {
            const assetIndexMatch = bind.match(/\[(\d+)\]/);
            if (assetIndexMatch) {
              const index = parseInt(assetIndexMatch[1], 10);
              const landAsset = landAssets[index];

              if (landAsset) {
                if (bind.includes('address')) {
                  values.push(landAsset.address || '');
                }
                if (bind.includes('ownership')) {
                  values.push(landAsset.ownership || '');
                }
                if (bind.includes('today')) {
                  values.push(landAsset.market_value?.client?.today || '');
                }
                if (bind.includes('on_date_of_marriage')) {
                  values.push(landAsset.market_value?.client?.on_date_of_marriage || '');
                }
                if (bind.includes('on_valuation_date')) {
                  values.push(landAsset.market_value?.client?.on_valuation_date || '');
                }
                if (bind.includes('onValuationDate')) {
                  values.push(landAsset.onValuationDate || '');
                }
                // Add more as needed
              }
            }
          }
          bindingValue = values.join(', '); // or just `values` if you want an array
          
        }
      }

      if ((field.bind && field.bind.includes("assets.") && !field.bind.includes("assets.land"))) {
        // Get all land assets where property_status is an empty string
          if(field.bind.includes("household")) {
            const houseAssets = documentData?.assets?.household || [];

            const bindExpressions = field.bind?.split(',').map(b => b.trim()) || [];
            const values = [];
            for (const bind of bindExpressions) {
              const assetIndexMatch = bind.match(/\[(\d+)\]/);
                if (assetIndexMatch) {
                const index = parseInt(assetIndexMatch[1], 10);
                const houseAsset = houseAssets[index];

                if (houseAsset) {
                  if (bind.includes('description')) {
                  values.push(houseAsset.description || '');
                  }
                  if (bind.includes('details')) {
                  values.push(generateDetails(houseAsset) || '');
                  }
                  if (bind.includes('isInPossession')) {
                  values.push(houseAsset.isInPossession || '');
                  }
                  if (bind.includes('market_value.client.today')) {
                  values.push(houseAsset.market_value?.client?.today || houseAsset.today || '');
                  }
                  if (bind.includes('market_value.client.on_valuation_date')) {
                  values.push(houseAsset.market_value?.client?.on_valuation_date || houseAsset.onValuationDate || '');
                  }
                  if (bind.includes('market_value.client.on_date_of_marriage')) {
                  values.push(houseAsset.market_value?.client?.on_date_of_marriage || houseAsset.onDateOfMarriage || '');
                  }
                  if (bind.includes('market_value.opposing_party.today')) {
                  values.push(houseAsset.market_value?.opposing_party?.today || '');
                  }
                  if (bind.includes('market_value.opposing_party.on_valuation_date')) {
                  values.push(houseAsset.market_value?.opposing_party?.on_valuation_date || '');
                  }
                  if (bind.includes('market_value.opposing_party.on_date_of_marriage')) {
                  values.push(houseAsset.market_value?.opposing_party?.on_date_of_marriage || '');
                  }
                  if (bind.includes('onValuationDate')) {
                  values.push(houseAsset.onValuationDate || '');
                  }
                  if (bind.includes('onDateOfMarriage')) {
                  values.push(houseAsset.onDateOfMarriage || '');
                  }
                  if (bind.includes('today')) {
                  values.push(houseAsset.today || '');
                  }
                }
                }
            }
            bindingValue = values.join(', ');
          }

          if (field.bind.includes("bank")) {
              const bankAssets = documentData?.assets?.bank || [];
              const bindExpressions = field.bind?.split(',').map(b => b.trim()) || [];
              const values = [];

              for (const bind of bindExpressions) {
                const assetIndexMatch = bind.match(/\[(\d+)\]/);
                if (assetIndexMatch) {
                  const index = parseInt(assetIndexMatch[1], 10);
                  const bankAsset = bankAssets[index];

                  if (bankAsset) {
                    if (bind.includes('category')) {
                      values.push(bankAsset.category || '');
                    }
                    if (bind.includes('institution')) {
                      values.push(bankAsset.institution || '');
                    }
                    if (bind.includes('description_bassp')) {
                      values.push(bankAsset.description_bassp || '');
                    }
                    if (bind.includes('account_number')) {
                      values.push(bankAsset.account_number || '');
                    }
                    if (bind.includes('property_status')) {
                      values.push(bankAsset.property_status || '');
                    }

                    // Market value - client
                    if (bind.includes('market_value.client.today')) {
                      values.push(bankAsset.market_value?.client?.today || bankAsset.today || '');
                    }
                    if (bind.includes('market_value.client.on_valuation_date')) {
                      values.push(bankAsset.market_value?.client?.on_valuation_date || bankAsset.onValuationDate || '');
                    }
                    if (bind.includes('market_value.client.on_date_of_marriage')) {
                      values.push(bankAsset.market_value?.client?.on_date_of_marriage || bankAsset.onDateOfMarriage || '');
                    }

                    // Market value - opposing party
                    if (bind.includes('market_value.opposing_party.today')) {
                      values.push(bankAsset.market_value?.opposing_party?.today || '');
                    }
                    if (bind.includes('market_value.opposing_party.on_valuation_date')) {
                      values.push(bankAsset.market_value?.opposing_party?.on_valuation_date || '');
                    }
                    if (bind.includes('market_value.opposing_party.on_date_of_marriage')) {
                      values.push(bankAsset.market_value?.opposing_party?.on_date_of_marriage || '');
                    }

                    // Direct fields
                    if (bind.includes('onValuationDate')) {
                      values.push(bankAsset.onValuationDate || '');
                    }
                    if (bind.includes('onDateOfMarriage')) {
                      values.push(bankAsset.onDateOfMarriage || '');
                    }
                    if (bind.includes('today')) {
                      values.push(bankAsset.today || '');
                    }
                  }
                }
              }

              bindingValue = values.join(', ');
            }

            if (field.bind.includes("life")) {
              const lifeAssets = documentData?.assets?.life || [];

              const bindExpressions = field.bind?.split(',').map(b => b.trim()) || [];
              const values = [];

              for (const bind of bindExpressions) {
                const assetIndexMatch = bind.match(/\[(\d+)\]/);
                if (assetIndexMatch) {
                  const index = parseInt(assetIndexMatch[1], 10);
                  const lifeAsset = lifeAssets[index];

                  if (lifeAsset) {
                    if (bind.includes('policy_no')) {
                      values.push(lifeAsset.policy_no || '');
                    }
                    if (bind.includes('owner')) {
                      values.push(lifeAsset.owner || '');
                    }
                    if (bind.includes('beneficiary')) {
                      values.push(lifeAsset.beneficiary || '');
                    }
                    if (bind.includes('face_amount')) {
                      values.push(lifeAsset.face_amount?.toString() || '');
                    }
                    if (bind.includes('property_status')) {
                      values.push(lifeAsset.property_status || '');
                    }

                    // Market value - client
                    if (bind.includes('market_value.client.today')) {
                      values.push(lifeAsset.market_value?.client?.today || lifeAsset.today || '');
                    }
                    if (bind.includes('market_value.client.on_valuation_date')) {
                      values.push(lifeAsset.market_value?.client?.on_valuation_date || lifeAsset.onValuationDate || '');
                    }
                    if (bind.includes('market_value.client.on_date_of_marriage')) {
                      values.push(lifeAsset.market_value?.client?.on_date_of_marriage || lifeAsset.onDateOfMarriage || '');
                    }

                    // Market value - opposing party
                    if (bind.includes('market_value.opposing_party.today')) {
                      values.push(lifeAsset.market_value?.opposing_party?.today || '');
                    }
                    if (bind.includes('market_value.opposing_party.on_valuation_date')) {
                      values.push(lifeAsset.market_value?.opposing_party?.on_valuation_date || '');
                    }
                    if (bind.includes('market_value.opposing_party.on_date_of_marriage')) {
                      values.push(lifeAsset.market_value?.opposing_party?.on_date_of_marriage || '');
                    }

                    // Direct fields
                    if (bind.includes('onValuationDate')) {
                      values.push(lifeAsset.onValuationDate || '');
                    }
                    if (bind.includes('onDateOfMarriage')) {
                      values.push(lifeAsset.onDateOfMarriage || '');
                    }
                    if (bind.includes('today')) {
                      values.push(lifeAsset.today || '');
                    }
                  }
                }
              }

              bindingValue = values.join(', ');
            }

            if (field.bind.includes("interests")) {
                const interestAssets = documentData?.assets?.interests || [];

                const bindExpressions = field.bind?.split(',').map(b => b.trim()) || [];
                const values = [];

                for (const bind of bindExpressions) {
                  const assetIndexMatch = bind.match(/\[(\d+)\]/);
                  if (assetIndexMatch) {
                    const index = parseInt(assetIndexMatch[1], 10);
                    const interestAsset = interestAssets[index];

                    if (interestAsset) {
                      if (bind.includes('firm_name')) {
                        values.push(interestAsset.firm_name || '');
                      }
                      if (bind.includes('interest')) {
                        values.push(interestAsset.interest || '');
                      }
                      if (bind.includes('property_status')) {
                        values.push(interestAsset.property_status || '');
                      }

                      // Market value - client
                      if (bind.includes('market_value.client.today')) {
                        values.push(interestAsset.market_value?.client?.today || interestAsset.today || '');
                      }
                      if (bind.includes('market_value.client.on_valuation_date')) {
                        values.push(interestAsset.market_value?.client?.on_valuation_date || interestAsset.onValuationDate || '');
                      }
                      if (bind.includes('market_value.client.on_date_of_marriage')) {
                        values.push(interestAsset.market_value?.client?.on_date_of_marriage || interestAsset.onDateOfMarriage || '');
                      }

                      // Market value - opposing party
                      if (bind.includes('market_value.opposing_party.today')) {
                        values.push(interestAsset.market_value?.opposing_party?.today || '');
                      }
                      if (bind.includes('market_value.opposing_party.on_valuation_date')) {
                        values.push(interestAsset.market_value?.opposing_party?.on_valuation_date || '');
                      }
                      if (bind.includes('market_value.opposing_party.on_date_of_marriage')) {
                        values.push(interestAsset.market_value?.opposing_party?.on_date_of_marriage || '');
                      }

                      // Direct fields
                      if (bind.includes('onValuationDate')) {
                        values.push(interestAsset.onValuationDate || '');
                      }
                      if (bind.includes('onDateOfMarriage')) {
                        values.push(interestAsset.onDateOfMarriage || '');
                      }
                      if (bind.includes('today')) {
                        values.push(interestAsset.today || '');
                      }
                    }
                  }
                }

                bindingValue = values.join(', ');
              }

              if (field.bind.includes("moneyOwed")) {
                const moneyOwedAssets = documentData?.assets?.moneyOwed || [];

                const bindExpressions = field.bind?.split(',').map(b => b.trim()) || [];
                const values = [];

                for (const bind of bindExpressions) {
                  const assetIndexMatch = bind.match(/\[(\d+)\]/);
                  if (assetIndexMatch) {
                    const index = parseInt(assetIndexMatch[1], 10);
                    const moneyOwedAsset = moneyOwedAssets[index];

                    if (moneyOwedAsset) {
                      if (bind.includes('details')) {
                        values.push(moneyOwedAsset.details || '');
                      }
                      if (bind.includes('property_status')) {
                        values.push(moneyOwedAsset.property_status || '');
                      }

                      // Market value - client
                      if (bind.includes('market_value.client.today')) {
                        values.push(moneyOwedAsset.market_value?.client?.today || moneyOwedAsset.today || '');
                      }
                      if (bind.includes('market_value.client.on_valuation_date')) {
                        values.push(moneyOwedAsset.market_value?.client?.on_valuation_date || moneyOwedAsset.onValuationDate || '');
                      }
                      if (bind.includes('market_value.client.on_date_of_marriage')) {
                        values.push(moneyOwedAsset.market_value?.client?.on_date_of_marriage || moneyOwedAsset.onDateOfMarriage || '');
                      }

                      // Market value - opposing party
                      if (bind.includes('market_value.opposing_party.today')) {
                        values.push(moneyOwedAsset.market_value?.opposing_party?.today || '');
                      }
                      if (bind.includes('market_value.opposing_party.on_valuation_date')) {
                        values.push(moneyOwedAsset.market_value?.opposing_party?.on_valuation_date || '');
                      }
                      if (bind.includes('market_value.opposing_party.on_date_of_marriage')) {
                        values.push(moneyOwedAsset.market_value?.opposing_party?.on_date_of_marriage || '');
                      }

                      // Direct fields
                      if (bind.includes('onValuationDate')) {
                        values.push(moneyOwedAsset.onValuationDate || '');
                      }
                      if (bind.includes('onDateOfMarriage')) {
                        values.push(moneyOwedAsset.onDateOfMarriage || '');
                      }
                      if (bind.includes('today')) {
                        values.push(moneyOwedAsset.today || '');
                      }
                    }
                  }
                }

                bindingValue = values.join(', ');
              }

              if (field.bind.includes("otherProperty")) {
                const otherPropertyAssets = documentData?.assets?.otherProperty || [];

                const bindExpressions = field.bind?.split(',').map(b => b.trim()) || [];
                const values = [];

                for (const bind of bindExpressions) {
                  const assetIndexMatch = bind.match(/\[(\d+)\]/);
                  if (assetIndexMatch) {
                    const index = parseInt(assetIndexMatch[1], 10);
                    const otherPropertyAsset = otherPropertyAssets[index];

                    if (otherPropertyAsset) {
                      if (bind.includes('category')) {
                        values.push(otherPropertyAsset.category || '');
                      }
                      if (bind.includes('details')) {
                        values.push(otherPropertyAsset.details || '');
                      }
                      if (bind.includes('property_status')) {
                        values.push(otherPropertyAsset.property_status || '');
                      }

                      // Market value - client
                      if (bind.includes('market_value.client.today')) {
                        values.push(otherPropertyAsset.market_value?.client?.today || otherPropertyAsset.today || '');
                      }
                      if (bind.includes('market_value.client.on_valuation_date')) {
                        values.push(otherPropertyAsset.market_value?.client?.on_valuation_date || otherPropertyAsset.onValuationDate || '');
                      }
                      if (bind.includes('market_value.client.on_date_of_marriage')) {
                        values.push(otherPropertyAsset.market_value?.client?.on_date_of_marriage || otherPropertyAsset.onDateOfMarriage || '');
                      }

                      // Market value - opposing party
                      if (bind.includes('market_value.opposing_party.today')) {
                        values.push(otherPropertyAsset.market_value?.opposing_party?.today || '');
                      }
                      if (bind.includes('market_value.opposing_party.on_valuation_date')) {
                        values.push(otherPropertyAsset.market_value?.opposing_party?.on_valuation_date || '');
                      }
                      if (bind.includes('market_value.opposing_party.on_date_of_marriage')) {
                        values.push(otherPropertyAsset.market_value?.opposing_party?.on_date_of_marriage || '');
                      }

                      // Direct fields
                      if (bind.includes('onValuationDate')) {
                        values.push(otherPropertyAsset.onValuationDate || '');
                      }
                      if (bind.includes('onDateOfMarriage')) {
                        values.push(otherPropertyAsset.onDateOfMarriage || '');
                      }
                      if (bind.includes('today')) {
                        values.push(otherPropertyAsset.today || '');
                      }
                    }
                  }
                }

                bindingValue = values.join(', ');
              }
      }

      if (field.source === 'assets.combined') {    
        if (field.sourceType === "excluded_property") {
          // Check if combinedAssets exists and has items
          if (combinedAssets?.items && Array.isArray(combinedAssets.items)) {
            // Filter for excluded properties based on property_status
            const excludedProperties = combinedAssets.items.filter(item =>
              item.property_status === 'excluded_property'
            );
            // Get the specific index from the bind property if it exists
            const itemIndex = field.bind ? field.bind.match(/\[(\d+)\]/) : null;
            const index = itemIndex ? parseInt(itemIndex[1], 10) : 0;

            // Get the specific excluded property if it exists
            const excludedItem = excludedProperties[index];

            if (excludedItem) {
              // Bind different properties based on the field.bind path
              if (field.bind.includes('item')) {
                bindingValue = excludedItem.item || '';
              }
              if (field.bind.includes('details')) {
                bindingValue = generateDetails(excludedItem) || '';
              }
              if (field.bind.includes('key')) {
                bindingValue = excludedItem.category || excludedItem.item || '';
              }
              if (field.bind.includes('market_value.client.today')) {
                bindingValue = excludedItem.market_value?.client?.today || '';
              }
              if (field.bind.includes('market_value.client.on_valuation_date')) {
                bindingValue = excludedItem.market_value?.client?.on_valuation_date || '';
              }
              if (field.bind.includes('market_value.opposing_party.today')) {
                bindingValue = excludedItem.market_value?.opposing_party?.today || '';
              }
              if (field.bind.includes('market_value.opposing_party.on_valuation_date')) {
                bindingValue = excludedItem.market_value?.opposing_party?.on_valuation_date || '';
              }
            }
          }
        }

        if (field.sourceType === "disposed_property") {
          // Check if combinedAssets exists and has items
          if (combinedAssets?.items && Array.isArray(combinedAssets.items)) {
            // Filter for excluded properties based on property_status
            const excludedProperties = combinedAssets.items.filter(item =>
              item.property_status === 'disposed_property'
            );

            // Get the specific index from the bind property if it exists
            const itemIndex = field.bind ? field.bind.match(/\[(\d+)\]/) : null;
            const index = itemIndex ? parseInt(itemIndex[1], 10) : 0;

            // Get the specific excluded property if it exists
            const excludedItem = excludedProperties[index];

            if (excludedItem) {
              // Bind different properties based on the field.bind path
              if (field.bind.includes('item')) {
                bindingValue = excludedItem.item || '';
              }
              if (field.bind.includes('details')) {
                bindingValue = generateDetails(excludedItem) || '';
              }
              if (field.bind.includes('key')) {
                bindingValue = excludedItem.category || excludedItem.item || '';
              }
              if (field.bind.includes('market_value.client.today')) {
                bindingValue = excludedItem.market_value?.client?.today || '';
              }
              if (field.bind.includes('market_value.client.on_valuation_date')) {
                bindingValue = excludedItem.market_value?.client?.on_valuation_date || '';
              }
              if (field.bind.includes('market_value.opposing_party.today')) {
                bindingValue = excludedItem.market_value?.opposing_party?.today || '';
              }
              if (field.bind.includes('market_value.opposing_party.on_valuation_date')) {
                bindingValue = excludedItem.market_value?.opposing_party?.on_valuation_date || '';
              }
            }
          }
        }

        if (field.sourceType === "bank_accounts_savings_securities_pension") {
          // Check if combinedAssets exists and has items
          if (combinedAssets?.items && Array.isArray(combinedAssets.items)) {
            // Filter for bank accounts with empty property_status
            const bankAccounts = combinedAssets.items.filter(item =>
              item.key === 'bank_accounts_savings_securities_pension' &&
              item.property_status === ""
            );

            // Get the specific index from the bind property if it exists
            const itemIndex = field.bind ? field.bind.match(/\[(\d+)\]/) : null;
            const index = itemIndex ? parseInt(itemIndex[1], 10) : 0;

            // Get the specific bank account if it exists
            const bankAccount = bankAccounts[index];

            if (bankAccount) {
              // Bind different properties based on the field.bind path
              if (field.bind.includes('category')) {
                bindingValue = bankAccount.category || '';
              }
              if (field.bind.includes('details')) {
                bindingValue = generateDetails(bankAccount) || '';
              }
              if (field.bind.includes('institution')) {
                bindingValue = bankAccount.institution || '';
              }
              if (field.bind.includes('description')) {
                bindingValue = bankAccount.description || '';
              }
              if (field.bind.includes('market_value.client.today')) {
                bindingValue = bankAccount.market_value?.client?.today || '';
              }
              if (field.bind.includes('market_value.client.on_valuation_date')) {
                bindingValue = bankAccount.market_value?.client?.on_valuation_date || '';
              }
              if (field.bind.includes('market_value.client.on_date_of_marriage')) {
                bindingValue = bankAccount.market_value?.client?.on_date_of_marriage || '';
              }
              if (field.bind.includes('market_value.opposing_party.today')) {
                bindingValue = bankAccount.market_value?.opposing_party?.today || '';
              }
              if (field.bind.includes('market_value.opposing_party.on_valuation_date')) {
                bindingValue = bankAccount.market_value?.opposing_party?.on_valuation_date || '';
              }
              if (field.bind.includes('market_value.opposing_party.on_date_of_marriage')) {
                bindingValue = bankAccount.market_value?.opposing_party?.on_date_of_marriage || '';
              }
            }
          }
        }

        if (field.sourceType === "life_and_disability_insurance") {
          // Check if combinedAssets exists and has items
          if (combinedAssets?.items && Array.isArray(combinedAssets.items)) {
            // Filter for life and disability insurance with empty property_status
            const insuranceItems = combinedAssets.items.filter(item =>
              item.key === 'life_and_disability_insurance' &&
              item.property_status === ""
            );
            // Get the specific index from the bind property if it exists
            const itemIndex = field.bind ? field.bind.match(/\[(\d+)\]/) : null;
            const index = itemIndex ? parseInt(itemIndex[1], 10) : 0;

            // Get the specific insurance item if it exists
            const insuranceItem = insuranceItems[index];
            if (insuranceItem) {
              // Bind different properties based on the field.bind path
              if (field.bind.includes('item')) {
                bindingValue = insuranceItem.item || '';
              }
              if (field.bind.includes('details')) {
                bindingValue = generateDetails(insuranceItem) || '';
              }
              if (field.bind.includes('insurance_type')) {
                bindingValue = generateDetails(insuranceItem) || '';
              }
              if (field.bind.includes('owner')) {
                bindingValue = insuranceItem.owner || '';
              }
              if (field.bind.includes('policy_no')) {
                bindingValue = insuranceItem.policy_no || '';
              }
              if (field.bind.includes('beneficiary')) {
                bindingValue = insuranceItem.beneficiary || '';
              }
              if (field.bind.includes('market_value.client.today')) {
                bindingValue = insuranceItem.market_value?.client?.today || '';
              }
              if (field.bind.includes('market_value.client.on_valuation_date')) {
                bindingValue = insuranceItem.market_value?.client?.on_valuation_date || '';
              }
              if (field.bind.includes('market_value.client.on_date_of_marriage')) {
                bindingValue = insuranceItem.market_value?.client?.on_date_of_marriage || '';
              }
              if (field.bind.includes('market_value.opposing_party.today')) {
                bindingValue = insuranceItem.market_value?.opposing_party?.today || '';
              }
              if (field.bind.includes('market_value.opposing_party.on_valuation_date')) {
                bindingValue = insuranceItem.market_value?.opposing_party?.on_valuation_date || '';
              }
              if (field.bind.includes('market_value.opposing_party.on_date_of_marriage')) {
                bindingValue = insuranceItem.market_value?.opposing_party?.on_date_of_marriage || '';
              }
            }
          }
        }

        if (field.sourceType === "business_interest") {
          // Check if combinedAssets exists and has items
          if (combinedAssets?.items && Array.isArray(combinedAssets.items)) {
            // Filter for business interests with empty property_status
            const businessItems = combinedAssets.items.filter(item =>
              item.key === 'business_interest' &&
              item.property_status === ""
            );

            // Get the specific index from the bind property if it exists
            const itemIndex = field.bind ? field.bind.match(/\[(\d+)\]/) : null;
            const index = itemIndex ? parseInt(itemIndex[1], 10) : 0;

            // Get the specific business item if it exists
            const businessItem = businessItems[index];
            if (businessItem) {
              // Bind different properties based on the field.bind path
              if (field.bind.includes('.firm_name')) {
                bindingValue = businessItem.firm_name || '';
              }
              if (field.bind.includes('.interest')) {
                bindingValue = businessItem.interest || '';
              }
              if (field.bind.includes('ownership_type')) {
                bindingValue = businessItem.ownership_type || '';
              }
              if (field.bind.includes('market_value.client.today')) {
                bindingValue = businessItem.market_value?.client?.today || '';
              }
              if (field.bind.includes('market_value.client.on_valuation_date')) {
                bindingValue = businessItem.market_value?.client?.on_valuation_date || '';
              }
              if (field.bind.includes('market_value.opposing_party.today')) {
                bindingValue = businessItem.market_value?.opposing_party?.today || '';
              }
              if (field.bind.includes('market_value.opposing_party.on_valuation_date')) {
                bindingValue = businessItem.market_value?.opposing_party?.on_valuation_date || '';
              }
              if (field.bind.includes('market_value.client.on_date_of_marriage')) {
                bindingValue = businessItem.market_value?.client?.on_date_of_marriage || '';
              }
              if (field.bind.includes('market_value.opposing_party.on_date_of_marriage')) {
                bindingValue = businessItem.market_value?.opposing_party?.on_date_of_marriage || '';
              }
            }
          }
        }

        if (field.sourceType === "money_owed_to_you") {
          // Check if combinedAssets exists and has items
          if (combinedAssets?.items && Array.isArray(combinedAssets.items)) {
            // Filter for money owed items with empty property_status
            const moneyOwedItems = combinedAssets.items.filter(item =>
              item.key === 'money_owed_to_you' &&
              item.property_status === ""
            );

            // Get the specific index from the bind property if it exists
            const itemIndex = field.bind ? field.bind.match(/\[(\d+)\]/) : null;
            const index = itemIndex ? parseInt(itemIndex[1], 10) : 0;

            // Get the specific money owed item if it exists
            const moneyOwedItem = moneyOwedItems[index];

            if (moneyOwedItem) {
              // Bind different properties based on the field.bind path
              if (field.bind.includes('details')) {
                bindingValue = moneyOwedItem.details || '';
              }
              if (field.bind.includes('market_value.client.today')) {
                bindingValue = moneyOwedItem.market_value?.client?.today || '';
              }
              if (field.bind.includes('market_value.client.on_valuation_date')) {
                bindingValue = moneyOwedItem.market_value?.client?.on_valuation_date || '';
              }
              if (field.bind.includes('market_value.client.on_date_of_marriage')) {
                bindingValue = moneyOwedItem.market_value?.client?.on_date_of_marriage || '';
              }
              if (field.bind.includes('market_value.opposing_party.today')) {
                bindingValue = moneyOwedItem.market_value?.opposing_party?.today || '';
              }
              if (field.bind.includes('market_value.opposing_party.on_valuation_date')) {
                bindingValue = moneyOwedItem.market_value?.opposing_party?.on_valuation_date || '';
              }
              if (field.bind.includes('market_value.opposing_party.on_date_of_marriage')) {
                bindingValue = moneyOwedItem.market_value?.opposing_party?.on_date_of_marriage || '';
              }
            }
          }
        }

        if (field.sourceType === "other_property") {
          // Check if combinedAssets exists and has items
          if (combinedAssets?.items && Array.isArray(combinedAssets.items)) {
            // Filter for other property items with empty property_status
            const otherPropertyItems = combinedAssets.items.filter(item =>
              item.key === 'other_property' &&
              item.property_status === ""
            );

            // Get the specific index from the bind property if it exists
            const itemIndex = field.bind ? field.bind.match(/\[(\d+)\]/) : null;
            const index = itemIndex ? parseInt(itemIndex[1], 10) : 0;

            // Get the specific other property item if it exists
            const otherPropertyItem = otherPropertyItems[index];

            if (otherPropertyItem) {
              // Bind different properties based on the field.bind path
              if (field.bind.includes('item')) {
                bindingValue = otherPropertyItem.item || '';
              }
              if (field.bind.includes('details')) {
                bindingValue = generateDetails(otherPropertyItem) || 'a';
              }
              if (field.bind.includes('category')) {
                bindingValue = otherPropertyItem.category || '';
              }
              if (field.bind.includes('market_value.client.today')) {
                bindingValue = otherPropertyItem.market_value?.client?.today || '';
              }
              if (field.bind.includes('market_value.client.on_valuation_date')) {
                bindingValue = otherPropertyItem.market_value?.client?.on_valuation_date || '';
              }
              if (field.bind.includes('market_value.opposing_party.today')) {
                bindingValue = otherPropertyItem.market_value?.opposing_party?.today || '';
              }
              if (field.bind.includes('market_value.opposing_party.on_valuation_date')) {
                bindingValue = otherPropertyItem.market_value?.opposing_party?.on_valuation_date || '';
              }
              if (field.bind.includes('market_value.client.on_date_of_marriage')) {
                bindingValue = otherPropertyItem.market_value?.client?.on_date_of_marriage || '';
              }
              if (field.bind.includes('market_value.opposing_party.on_date_of_marriage')) {
                bindingValue = otherPropertyItem.market_value?.opposing_party?.on_date_of_marriage || '';
              }
            }
          }
        }

        if (field.groupKey === 'general_household_items_and_vehicles' || (field.bind && field.bind.includes("assets.household"))) {
   
          // Check if combinedAssets exists and has items
          if (combinedAssets?.items && Array.isArray(combinedAssets.items)) {
            // Filter for household items based on the subcategory
            const householdItems = combinedAssets.items.filter(item =>
              item.key === 'general_household_items_and_vehicles' &&
              item.item === field.subcategory &&
              item.property_status === ""
            );
            // Get the specific index from the bind property
            const itemIndex = field.bind ? field.bind.match(/\[(\d+)\]/) : null;
            const index = itemIndex ? parseInt(itemIndex[1], 10) : 0;

            // Get the specific household item if it exists
            const householdItem = householdItems[index];

            if (householdItem) {
              // Bind different properties based on the field.bind path
              if (field.bind.includes('description')) {
                bindingValue = householdItem.description || '';
              }
              if (field.bind.includes('details')) {
                bindingValue = generateDetails(householdItem) || '';
              }
              if (field.bind.includes('market_value.client.today')) {
                bindingValue = householdItem.market_value?.client?.today || '';
              }
              if (field.bind.includes('market_value.client.on_valuation_date')) {
                bindingValue = householdItem.market_value?.client?.on_valuation_date || '';
              }
              if (field.bind.includes('market_value.client.on_date_of_marriage')) {
                bindingValue = householdItem.market_value?.client?.on_date_of_marriage || '';
              }
              if (field.bind.includes('market_value.opposing_party.today')) {
                bindingValue = householdItem.market_value?.opposing_party?.today || '';
              }
              if (field.bind.includes('market_value.opposing_party.on_valuation_date')) {
                bindingValue = householdItem.market_value?.opposing_party?.on_valuation_date || '';
              }
              if (field.bind.includes('market_value.opposing_party.on_date_of_marriage')) {
                bindingValue = householdItem.market_value?.opposing_party?.on_date_of_marriage || '';
              }
            }
          }
        }

      }

      if (field.source === 'assets') {
        const assetIndex = field.bind ? field.bind.match(/\[(\d+)\]/) : null;

        if (assetIndex) {
          const index = parseInt(assetIndex[1], 10);
          // Access the items array of combinedAssets
          const asset = combinedAssets?.items?.[index];
          if (asset) {
            // Handle different bind paths
            if (field.bind.includes('.item')) {
              bindingValue = asset.item || '';
            } else if (field.bind.includes('.market_value.client.on_valuation_date')) {
              bindingValue = asset.market_value?.client?.on_valuation_date || '';
            } else if (field.bind.includes('.market_value.opposing_party.on_valuation_date')) {
              bindingValue = asset.market_value?.opposing_party?.on_valuation_date || '';
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

            if (field.bind.includes('on_date_of_marriage')) {
              bindingValue = debtsItem.on_date_of_marriage || ''; // Override with asset value if available
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
            if (field.bind.includes('market_value.client.on_date_of_marriage')) {
              bindingValue = propertiesItem.market_value.client.on_date_of_marriage || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('market_value.client.on_valuation_date')) {
              bindingValue = propertiesItem.market_value.client.on_valuation_date || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('market_value.opposing_party.on_date_of_marriage')) {
              bindingValue = propertiesItem.market_value.opposing_party.on_date_of_marriage || ''; // Override with asset value if available
            }
            if (field.bind.includes('market_value.opposing_party.on_valuation_date')) {
              bindingValue = propertiesItem.market_value.opposing_party.on_valuation_date || ''; // Override with asset value if available
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
        const houseHoldIndex = field.bind ? field.bind.match(/household\[(\d+)\]/) : null;
        if (houseHoldIndex) {
          const index = parseInt(houseHoldIndex[1], 10); // Extract index
          const houseHoldItem = documentData?.assets?.household[index];
          if (houseHoldItem) {
            if (field.bind.includes('description')) {
              bindingValue = houseHoldItem.description || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('.today')) {
              bindingValue = houseHoldItem.market_value.client.today || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('.on_valuation_date')) {
              bindingValue = houseHoldItem.market_value.client.on_valuation_date || bindingValue; // Override with asset value if available
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
            if (field.bind.includes('.address')) {
              bindingValue = + realEstateItem.ownership + ', ' + realEstateItem.address || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('.today')) {
              bindingValue = realEstateItem.market_value.client.today || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('.on_valuation_date')) {
              bindingValue = realEstateItem.market_value.client.on_valuation_date || bindingValue; // Override with asset value if available
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
            if (field.bind.includes('.today')) {
              bindingValue = lifeInsuranceItem.market_value.client.today || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('.on_valuation_date')) {
              bindingValue = lifeInsuranceItem.market_value.client.on_valuation_date || bindingValue; // Override with asset value if available
            }
          } else {
            console.warn(`No life insurance item found at index: ${index}`); // Log if item not found
          }
        }
      }

      if (field.source === 'bank') {
        const bindExpressions = field.bind?.split(',').map(b => b.trim()) || [];
        const values = [];
      
        for (const bind of bindExpressions) {
          const bankIndexMatch = bind.match(/bank\[(\d+)\]/);
          if (bankIndexMatch) {
            const index = parseInt(bankIndexMatch[1], 10); // Extract index
            const bankItem = documentData?.assets?.bank?.[index];
      
            if (bankItem) {
              if (bind.includes('institution')) {
                values.push(bankItem.institution || '');
              }
              if (bind.includes('category')) {
                values.push(bankItem.category || '');
              }
              if (bind.includes('.today')) {
                values.push(bankItem.market_value?.client?.today || '');
              }
              if (bind.includes('.on_valuation_date')) {
                values.push(bankItem.market_value?.client?.on_valuation_date || '');
              }
            } else {
              console.warn(`No bank item found at index: ${index}`); // Log if item not found
            }
          }
        }
      
        // Combine all values
        bindingValue = values.join(', '); // or use `values` as array
      }
      

      if (field.source === 'interests') {
        const bindExpressions = field.bind?.split(',').map(b => b.trim()) || [];
        const values = [];
      
        for (const bind of bindExpressions) {
          const interestsIndexMatch = bind.match(/interests\[(\d+)\]/);
          if (interestsIndexMatch) {
            const index = parseInt(interestsIndexMatch[1], 10); // Extract index
            const interestsItem = documentData?.assets?.interests?.[index];
      
            if (interestsItem) {
              if (bind.includes('firm_name')) {
                values.push(interestsItem.firm_name || '');
              }
              if (bind.includes('].interest')) {
                values.push(interestsItem.interest || '');
              }
              if (bind.includes('.today')) {
                values.push(interestsItem.market_value?.client?.today || '');
              }
              if (bind.includes('.on_valuation_date')) {
                values.push(interestsItem.market_value?.client?.on_valuation_date || '');
              }
            } else {
              console.warn(`No interests item found at index: ${index}`);
            }
          }
        }
      
        // Combine all values (or use `values` as array if needed)
        bindingValue = values.join(', ');
      }
      

      if (field.source === 'moneyOwed') {
        const moneyOwedIndex = field.bind ? field.bind.match(/moneyOwed\[(\d+)\]/) : null;
        if (moneyOwedIndex) {
          const index = parseInt(moneyOwedIndex[1], 10); // Extract index
          const moneyOwedItem = documentData?.assets?.moneyOwed?.[index];
          if (moneyOwedItem) {
            if (field.bind.includes('details')) {
              bindingValue = moneyOwedItem.details || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('category')) {
              bindingValue = moneyOwedItem.details || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('.today')) {
              bindingValue = moneyOwedItem.market_value.client.today || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('.on_valuation_date')) {
              bindingValue = moneyOwedItem.market_value.client.on_valuation_date || bindingValue; // Override with asset value if available
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
            if (field.bind.includes('.today')) {
              bindingValue = otherPossessionsItem.market_value.client.today || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('.on_valuation_date')) {
              bindingValue = otherPossessionsItem.market_value.client.on_valuation_date || bindingValue; // Override with asset value if available
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
            if (field.bind.includes('.today')) {
              bindingValue = investmentsItem.market_value.client.today || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('.on_valuation_date')) {
              bindingValue = investmentsItem.market_value.client.on_valuation_date || bindingValue; // Override with asset value if available
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
            if (field.bind.includes('.today')) {
              bindingValue = savingsItem.market_value.client.today || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('.on_valuation_date')) {
              bindingValue = savingsItem.market_value.client.on_valuation_date || bindingValue; // Override with asset value if available
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
            if (field.bind.includes('.today')) {
              bindingValue = otherAsset.market_value.client.today || bindingValue; // Override with asset value if available
            }
            if (field.bind.includes('.on_valuation_date')) {
              bindingValue = otherAsset.market_value.client.on_valuation_date || bindingValue; // Override with asset value if available
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
            // If fieldName is 'details' and it's empty, use the category instead
            if (fieldName === 'details' && !debtItem[fieldName]) {
              bindingValue = debtItem.category || bindingValue;
            } else {
              // Otherwise use the normal field binding
              bindingValue = debtItem[fieldName] || bindingValue;
            }
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

        // If no direct match, try the regex pattern
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
        const bindValues = field.bind.split(',').map(bind => bind.trim());
        const childValues = bindValues.map(bind => {
          const bindMatch = bind.match(/theChildren\[(\d+)\]\.(\w+)/);
          if (bindMatch) {
            const index = parseInt(bindMatch[1], 10);
            const fieldName = bindMatch[2];
            const childItem = documentData?.theChildren?.[index];
            return childItem ? childItem[fieldName] || '' : '';
          }
          return '';
        });
        bindingValue = childValues.length > 1 ? childValues.join(', ') : childValues[0];
      }
      if (field.data_type === "number") {
        bindingValue = formatNumberWithCommas(bindingValue);
      }

      return { ...field, value: bindingValue }; // Return the updated field with the bound value
    });
    return updatedFields;
  };

      

  const formatNumberWithCommas = (numberStr) => {
    if (!/^\d+(\.\d{0,2})?$/.test(numberStr)) {
      return numberStr;
    }
    const number = parseFloat(numberStr).toFixed(2);
    const [integerPart, decimalPart] = number.split(".");
    const formattedInteger = Number(integerPart).toLocaleString("en-US");

    return `${formattedInteger}.${decimalPart}`;
  };
  */



  const handleSave = async () => {
    setIsSaving(true); // Disable button when save starts
    if (remoteDocument) {
      try {
        const fieldValues = Object.fromEntries(fields.map((field) => [field.id, field.value]));
        const saved = await formsService.saveDocument(formData.matterNumber, remoteDocument.id, remoteDocument.revision, fieldValues, "IN_PROGRESS");
        setRemoteDocument((document) => ({ ...document, revision: saved.revision }));
        toast.success("Data Successfully Saved");
      } catch (error) {
        toast.error(error?.response?.status === 409 ? "This form changed elsewhere. Reload it before saving." : "Could not save this form.");
      } finally {
        setIsSaving(false);
      }
      return;
    }
    setIsSaving(false);
  }

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

          // Add extra newline for textarea fields
          if (field.type === 'TextArea') {
            let fieldValue = value.replace(/\n/g, '\n\n');
            textField.setText(fieldValue);

          }

          if (readOnly) {
            textField.enableReadOnly();
          }
        }
        else if (field.type === 'CheckBox') {
          try {
            // Only create checkbox if it's checked
            if (field.value === 'checked') {
              const checkbox = form.createCheckBox(field.id.toString());

              // Verify checkbox was created successfully
              if (!checkbox) {
                console.error('Failed to create checkbox for field:', field.id);
                return;
              }

              // Add checkbox with minimal properties and adjusted size/position
              checkbox.addToPage(page, {
                x: parseFloat(field.x) || 0,
                y: page.getHeight() - parseFloat(field.y) - (parseFloat(field.height) / scale),
                width: parseFloat(field.width) / scale,
                height: parseFloat(field.height) / scale,
                borderWidth: 0
              });

              // Set appearance characteristics before accessing widgets
              const acroField = checkbox.acroField;
              if (acroField) {
                acroField.setDefaultAppearance('/ZaDb 12 Tf 0 g');
              }

              // Safely handle widget modifications
              try {
                const widget = acroField?.getWidgets()?.[0];
                if (widget?.dict) {
                  const dict = widget.dict;

                  // Clean up appearance
                  ['BS', 'MK', 'BG'].forEach(prop => {
                    if (dict.has(PDFName.of(prop))) {
                      dict.delete(PDFName.of(prop));
                    }
                  });

                  // Set basic appearance
                  dict.set(PDFName.of('DA'), PDFName.of('/ZaDb 12 Tf 0 g'));
                }
              } catch (widgetError) {
                console.warn('Non-critical widget modification error:', widgetError);
              }

              if (readOnly) {
                checkbox.enableReadOnly();
              }

              // Set checked state
              try {
                checkbox.check();
              } catch (checkError) {
                console.warn('Non-critical check state error:', checkError);
              }
            }
          } catch (error) {
            console.error('Error creating checkbox for field:', field.id, error);
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

  // // Modify the updateFields callback to include fields in its dependency array
  // const updateFields = useCallback((newFields) => {
  //   // Only update if the fields have actually changed
  //   if (JSON.stringify(fields) !== JSON.stringify(newFields)) {
  //     setFields(newFields);
  //   }
  // }, [fields]); // Add fields to dependency array

  // Alternative approach if you want to avoid the dependency:
  // Create a ref to store the previous fields value
  const previousFieldsRef = useRef(null);

  const updateFields = useCallback((newFields) => {
    // Compare with previous fields
    if (JSON.stringify(previousFieldsRef.current) !== JSON.stringify(newFields)) {
      previousFieldsRef.current = newFields;
      setFields(newFields);
    }
  }, []); // Empty dependency array

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getFieldHighlight = (field) => {
    // If this field is selected
    if (selectedFields.some(selected => selected.id === field.id)) {
      return 'rgba(0, 123, 255, 0.5)'; // Blue for selected
    }

    // If a calculated field is selected, highlight all its source fields
    if (selectedField?.isCalculated) {
      // Check if current field's ID matches any sourceField
      const isSourceField = selectedField.sourceFields?.some(sourceId =>
        sourceId.toString() === field.id.toString()
      );

      if (isSourceField) {
        return 'rgba(255, 193, 7, 0.5)'; // Yellow for source fields
      }
    }

    return 'transparent';
  };

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

  // Add this new function before the return statement
  const handleFormSelection = (index) => {
    setIsFormLoading(true);
    setShouldRenderPdf(false); // Unmount PDFViewer
    setFields([]); // Clear fields immediately
    setFieldsReady(false);

    // Small delay to ensure clean state before switching
    setTimeout(() => {
      const newForms = [...forms];
      newForms[index].checked = !newForms[index].checked;
      setForms(newForms);
      setActiveForm(newForms[index]);
      setNumPages(null);
      setCurrentPage(1);
      setShouldRenderPdf(true);
    }, 0);
  };

  return (
    <Layout title={`Welcome ${response?.first_name || ""} ${response?.last_name || ""}`}>
      <div className="fill-information-page panel trans">
        <div className="pBody">
          <div className="row">
            <div className={isSidebarOpen ? "col-md-9" : "col-md-12"}>
              <div className="page-content">
                <div className="head d-flex justify-content-between align-items-center">
                  {activeForm?.title || 'No Title'}
                  <div style={{ alignItems: 'right', display: 'flex', gap: '10px' }}>
                  <button className="btn btnSecondary" onClick={handleBack}>
                    Back
                  </button>
                    <button
                      className='btn btnPrimary'
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Document'}
                    </button>

                    <button className='btn btnPrimary' onClick={savePdf}>
                      Download Document
                    </button>
                    <button className='btn btnPrimary' onClick={toggleSidebar}>
                      {isSidebarOpen ? 'Hide Forms List' : 'Show Forms List'}
                    </button>
                  </div>
                </div>
                <div className="body" style={{ backgroundColor: '#e3e3e3' }}>
                  <div id="pdf-content">
                    {loadError ? (
                      <div className="p-4 text-danger" role="alert">{loadError}</div>
                    ) : isLoading || isFormLoading || !shouldRenderPdf ? (
                      <Loader isLoading={true} />
                    ) : pdfUrl && fieldsReady && shouldRenderPdf && fields.length > 0 ? (
                      <>
                        <div className="toolbar">
                          <ModernToolbar
                            currentPage={currentPage}
                            numPages={numPages}
                            setCurrentPage={setCurrentPage}
                            setScale={setScale}
                            scale={scale}
                          />
                        </div>
                        <div id='pdfContainer' style={{
                          flex: 1,
                          position: 'relative',
                        }}>
                          <PDFViewer
                            key={`${activeForm?.file_id}-${fields.length}`}
                            pdfUrl={pdfUrl}
                            currentPage={currentPage}
                            scale={scale}
                            fields={fields}
                            handleFieldSelection={handleFieldSelection}
                            selectedFields={selectedFields}
                            handleEditField={handleEditField}
                            setFields={setFields}
                            getFieldHighlight={getFieldHighlight}
                            formatDate={formatDate}
                          />
                        </div>
                      </>
                    ) : (
                      <Loader isLoading={true} />
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
                    <CalculationManager
                      fields={fields}
                      setFields={updateFields}  // Pass the memoized callback
                      selectedFields={selectedFields}
                      currentPage={currentPage}
                    />

                    {forms.map((form, index) => (

                      <div
                        className="form-checkbox"
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleFormSelection(index);
                        }}
                      >
                        <button disabled={activeForm?.shortTitle === form.shortTitle} className={`btn mb-2 w-100 ${activeForm?.shortTitle === form.shortTitle ? 'btnSecondary' : 'btnPrimary'} btnForm`}>{form.title}</button>
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
        heading={`Preview PDF: ${activeForm?.title || "Form"}`}
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
