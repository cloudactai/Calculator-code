import { useState, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { saveFileData } from '../../utils/Apis/matters/saveFileData/saveFileDataActions';
import { pdfOperations, pdfExport } from '../../utils/pdfForms/pdfUtils';

export const usePDFOperations = (initialScale = 1.5) => {
  const dispatch = useDispatch();
  
  // PDF State
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(initialScale);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);

  // Load PDF document
  const loadPDF = useCallback(async (url) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { document, pageCount } = await pdfOperations.loadPdf(url);
      setPdfDoc(document);
      setNumPages(pageCount);
      setPdfUrl(url);
      return document;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save PDF with fields
  const savePDF = useCallback(async (fields, formData) => {
    if (!pdfDoc) throw new Error('No PDF document loaded');
    
    setIsLoading(true);
    try {
      const modifiedPdf = await pdfOperations.addFieldsToPdf(pdfDoc, fields, scale);
      const blob = await pdfExport.savePdfAsBlob(modifiedPdf);
      const url = pdfExport.createBlobUrl(blob);
      setBlobUrl(url);

      // Save field data to backend
      if (formData) {
        await dispatch(saveFileData({
          matterId: formData.matterNumber,
          active_form: formData.activeForm?.id,
          file_id: formData.file_id,
          folder_id: formData.folder_id,
          doc_id: formData.docId,
          data: fields
        }));
      }

      return url;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [pdfDoc, scale, dispatch]);

  // Page management
  const addNewPage = useCallback(async () => {
    if (!pdfDoc) throw new Error('No PDF document loaded');

    try {
      const { document, pageCount } = await pdfOperations.addNewPage(pdfDoc);
      setPdfDoc(document);
      setNumPages(pageCount);
      return pageCount;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [pdfDoc]);

  // Navigation
  const goToPage = useCallback((pageNumber) => {
    if (pageNumber > 0 && pageNumber <= numPages) {
      setCurrentPage(pageNumber);
    }
  }, [numPages]);

  // Zoom controls
  const zoom = useCallback((newScale) => {
    setScale(Math.max(0.5, Math.min(newScale, 3)));
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (blobUrl) {
        pdfExport.revokeBlobUrl(blobUrl);
      }
    };
  }, [blobUrl]);

  return {
    // State
    pdfDoc,
    pdfUrl,
    blobUrl,
    numPages,
    currentPage,
    scale,
    isLoading,
    error,

    // Operations
    loadPDF,
    savePDF,
    addNewPage,
    goToPage,
    zoom,
    setCurrentPage,
    setScale
  };
};