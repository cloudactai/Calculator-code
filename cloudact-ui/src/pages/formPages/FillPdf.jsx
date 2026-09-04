import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import Layout from "../../components/LayoutComponents/Layout";
import { useLocation, useParams } from "react-router-dom";
import { useHistory } from 'react-router-dom';
// import { Margin, usePDF } from "react-to-pdf";
import toast from "react-hot-toast";
import GeneralModal from "../../components/Matters/Modals/GeneralModal";
import { PDFDocument, PDFName, degrees, rgb, StandardFonts } from 'pdf-lib';
import { pdfjs } from 'react-pdf';
import '../../components/FormPages/forms/App.css'; // Ensure this CSS file is included for styles
import 'react-resizable/css/styles.css';
import ModernToolbar from "../../components/FormPages/forms/newComponents/ModernToolbar";
import CalculationManager from "../../components/FormPages/forms/newComponents/CalculationManager";
import PDFViewer from "./PDFViewer";
import {
  VERTICAL_TEXT_FIELD_TYPE,
  getFieldMaxLength,
  getPdfOverrides,
  normalizeVerticalRotation,
} from "./verticalTextField";
import { ensureMinimumTextFieldHeights } from "./textFieldGeometry";
import Loader from "../../components/Loader";
import axios from "../../utils/axios";
import { formsService } from "../../services/formsService";
import { isUnauthorized } from "../../utils/sessionExpiry";

pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ""}/pdf.worker.min.mjs`;

const SESSION_EXPIRED_MESSAGE =
  "Your session has expired, so this form could not be loaded. Sign in again to continue — nothing is wrong with the form itself.";

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

  useEffect(() => () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  }, [pdfUrl]);

  useEffect(() => () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
  }, [blobUrl]);

  useEffect(() => {
    if (!routeMatterNumber || !routeDocumentId) return;
    let active = true;
    setLoadError("");
    setIsLoading(true);
    setIsFormLoading(true);
    setFieldsReady(false);
    setPdfUrl(null);

    Promise.all([
      formsService.getDocument(routeMatterNumber, routeDocumentId),
      formsService.listDocuments(routeMatterNumber),
    ])
      .then(([document, documents]) => {
        if (!active) return;
        setLoadError("");
        setRemoteDocument(document);
        const savedForms = (Array.isArray(documents) ? documents : []).map((savedDocument) => ({
          id: savedDocument.id,
          docId: savedDocument.docId,
          file_name: savedDocument.file_name,
          title: savedDocument.file_name,
          shortTitle: savedDocument.file_name,
          folder_id: savedDocument.folder_id,
          revision: savedDocument.revision,
          template_version: savedDocument.template_version,
        }));
        const selectedForm = savedForms.find((form) => String(form.id) === String(document.id)) || {
          id: document.id,
          docId: document.docId,
          file_name: document.file_name,
          title: document.file_name,
          shortTitle: document.file_name,
          folder_id: document.folder_id,
          revision: document.revision,
          template_version: document.template_version,
        };
        if (!savedForms.some((form) => String(form.id) === String(selectedForm.id))) {
          savedForms.unshift(selectedForm);
        }
        setForms(savedForms);
        setActiveForm(selectedForm);
      })
      .catch((error) => {
        if (!active) return;
        setLoadError(isUnauthorized(error)
          ? SESSION_EXPIRED_MESSAGE
          : "Could not load this saved form. Return to the matter and try again.");
        setIsLoading(false);
        setIsFormLoading(false);
        toast.error(isUnauthorized(error)
          ? "Your session has expired."
          : "Could not load this saved form.");
      });
    return () => { active = false; };
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

  const fetchFormPdf = async (form) => {
    setLoadError("");
    setIsLoading(true);
    setIsFormLoading(true);
    try {
      const response = await axios.get(`/form-templates/${encodeURIComponent(form.docId)}/versions/${form.template_version}/pdf`, {
        responseType: "blob",
      });
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfUrl);
    } catch (error) {
      console.error("Error fetching the PDF:", error);
      // An expired session fails this call for every form in every province.
      // Blaming the PDF sends people hunting for a broken template instead of
      // signing back in, so say which one it actually is.
      setLoadError(isUnauthorized(error)
        ? SESSION_EXPIRED_MESSAGE
        : "Could not load this form's PDF. Return to the matter and try again.");
      setIsLoading(false);
      setIsFormLoading(false);
      toast.error(isUnauthorized(error)
        ? "Your session has expired."
        : "Could not load this form's PDF.");
    }
  };

  useEffect(() => {
    if (activeForm?.docId) {
      fetchFormPdf(activeForm);
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
        const fieldsWithValues = staticFields.map((field) => (
          remoteDocument.fieldValues?.[field.id] !== undefined
            ? { ...field, value: remoteDocument.fieldValues[field.id] }
            : field
        ));
        setFields(ensureMinimumTextFieldHeights(fieldsWithValues));

        setFieldsReady(true);
      } catch (error) {
        console.error('Error loading the PDF:', error);
        setLoadError("Could not open this form's PDF. Return to the matter and try again.");
        toast.error("Could not open this form's PDF.");
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
    const generationStartedAt = Date.now();
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

        // Use PDF-specific overrides when the field defines them (e.g.
        // VerticalTextFields whose editing box is smaller than where the
        // text should land on the printed form).
        const pdf = getPdfOverrides(field);

        const fieldProperties = {
          x: parseFloat(pdf.x) || 0,
          y: page.getHeight() - parseFloat(pdf.y) - (parseFloat(pdf.height) / scale),
          width: parseFloat(pdf.width) / scale,
          height: parseFloat(pdf.height) / scale,
          textColor: rgb(0, 0, 0),
          borderWidth: 0
        };

        if (field.type === VERTICAL_TEXT_FIELD_TYPE) {
          // Draw vertical text directly on the page with rotation so it
          // reliably appears rotated in every PDF viewer (the MK /R widget
          // flag is not universally respected).
          const value = field.value != null ? String(field.value) : '';
          if (value) {
            const rotation = normalizeVerticalRotation(field.rotation);
            const fontSize = 8;
            const pdfW = parseFloat(pdf.width) / scale;
            const pdfH = parseFloat(pdf.height) / scale;
            const pdfX = parseFloat(pdf.x) || 0;
            const pdfYBottom = page.getHeight() - parseFloat(pdf.y) - pdfH;

            // Measure text so we can center it within the column
            const textWidth = helveticaFont.widthOfTextAtSize(value, fontSize);

            if (rotation === 270) {
              // Bottom-to-top (degrees(90) in pdf-lib = 90° CCW).
              // After rotation the text height (~fontSize) runs horizontally
              // and the text width runs vertically (upward).
              page.drawText(value, {
                x: pdfX + (pdfW + fontSize) / 2,          // centred in column
                y: pdfYBottom + (pdfH - textWidth) / 2,   // centred along line
                size: fontSize,
                font: helveticaFont,
                color: rgb(0, 0, 0),
                rotate: degrees(90),
              });
            } else {
              // Top-to-bottom (rotation === 90)
              page.drawText(value, {
                x: pdfX + (pdfW - fontSize) / 2,
                y: pdfYBottom + pdfH - (pdfH - textWidth) / 2,
                size: fontSize,
                font: helveticaFont,
                color: rgb(0, 0, 0),
                rotate: degrees(-90),
              });
            }
          }
        }
        else if (field.type === 'TextField' || field.type === 'Number' || field.type === 'TextArea') {
          // Draw a white rectangle behind the field to mask any printed
          // anchor text (bracket tokens, underscore runs) on the background.
          page.drawRectangle({
            x: fieldProperties.x,
            y: fieldProperties.y,
            width: fieldProperties.width,
            height: fieldProperties.height,
            color: rgb(1, 1, 1),
            borderWidth: 0,
          });

          if (field.rule === 'bottom') {
            page.drawLine({
              start: { x: fieldProperties.x, y: fieldProperties.y },
              end: { x: fieldProperties.x + fieldProperties.width, y: fieldProperties.y },
              thickness: 0.7,
              color: rgb(0, 0, 0),
            });
          }

          const textField = form.createTextField(field.id.toString());
          textField.addToPage(page, fieldProperties);

          const widgets = textField.acroField.getWidgets();
          widgets.forEach(widget => {
            const dict = widget.dict;
            dict.delete(PDFName.of('BS'));
            dict.delete(PDFName.of('MK'));
            dict.delete(PDFName.of('BG'));
          });

          const maxLength = getFieldMaxLength(field);
          if (maxLength) {
            textField.setMaxLength(maxLength);
          }

          if (field.type === 'TextArea') {
            textField.enableMultiline();
          }

          const value = field.value != null ? String(field.value) : '';
          textField.setText(value);
          textField.setFontSize(Number(field.fontSize) || 8);

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
    try {
      const saved = await formsService.saveGeneratedPdf(
        routeMatterNumber,
        remoteDocument.id,
        remoteDocument.generated_pdf_revision,
        blob,
        Date.now() - generationStartedAt
      );
      setRemoteDocument((document) => ({ ...document, generated_pdf_revision: saved.revision }));
      toast.success(`Completed PDF revision ${saved.revision} saved.`);
    } catch (error) {
      URL.revokeObjectURL(pdfBlobUrl);
      toast.error(error?.response?.status === 409 ? "This completed PDF changed elsewhere. Reload it before saving." : "Could not save the completed PDF.");
      return;
    }
    const download = document.createElement("a");
    download.href = pdfBlobUrl;
    download.download = `${activeForm?.file_name || "completed-form"}`.replace(/\.pdf$/i, "") + "-completed.pdf";
    download.click();
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
    const selectedForm = forms[index];
    // The button is disabled for the current form, but its wrapper remains
    // clickable. Re-selecting the same object cleared the viewer without
    // changing activeForm, so the PDF effect never ran again.
    if (!selectedForm || selectedForm.id === activeForm?.id) return;

    setIsFormLoading(true);
    setFields([]);
    setFieldsReady(false);
    setNumPages(null);
    setCurrentPage(1);
    history.push(`/matters/${encodeURIComponent(routeMatterNumber)}/forms/${selectedForm.id}`);
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
                            key={`${activeForm?.id}-${fields.length}`}
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

                    {forms.map((form, index) => {
                      const isActive = String(activeForm?.id) === String(form.id);
                      return (
                        <div className="form-checkbox" key={form.id}>
                          <button
                            type="button"
                            disabled={isActive}
                            aria-current={isActive ? "page" : undefined}
                            className={`btn mb-2 w-100 btnForm form-list-button${isActive ? " is-active" : ""}`}
                            onClick={() => handleFormSelection(index)}
                          >
                            {form.title}
                          </button>
                        </div>
                      );
                    })}
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
