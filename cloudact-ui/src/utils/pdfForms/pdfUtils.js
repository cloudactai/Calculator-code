import { PDFDocument, PDFName, rgb, StandardFonts } from 'pdf-lib';

/**
 * PDF loading and modification utilities
 */
export const pdfOperations = {
  // Load PDF from URL
  loadPdf: async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch PDF');

      const arrayBuffer = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true
      });

      return {
        document: pdfDoc,
        pageCount: pdfDoc.getPageCount()
      };
    } catch (error) {
      throw new Error(`Error loading PDF: ${error.message}`);
    }
  },

  // Add fields to PDF
  addFieldsToPdf: async (pdfDoc, fields, scale = 1) => {
    try {
      const form = pdfDoc.getForm();
      const pages = pdfDoc.getPages();

      fields.forEach(field => {
        const pageIndex = field.page - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) {
          console.warn(`Skip field: Page index ${pageIndex + 1} is out of bounds`);
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

        switch (field.type) {
          case 'TextField':
          case 'Number':
          case 'TextArea':
            addTextField(form, page, field, fieldProperties);
            break;
          case 'CheckBox':
            addCheckBox(form, page, field, fieldProperties);
            break;
          case 'Table':
            addTable(form, page, field, fieldProperties);
            break;
        }
      });

      return pdfDoc;
    } catch (error) {
      throw new Error(`Error adding fields to PDF: ${error.message}`);
    }
  },

  // Add a new page to PDF
  addNewPage: async (pdfDoc, width = 600, height = 400) => {
    try {
      const newPage = pdfDoc.addPage([width, height]);
      return {
        document: pdfDoc,
        pageCount: pdfDoc.getPageCount(),
        newPageIndex: pdfDoc.getPageCount() - 1
      };
    } catch (error) {
      throw new Error(`Error adding new page: ${error.message}`);
    }
  }
};

/**
 * Helper functions for adding specific field types
 */
const addTextField = (form, page, field, properties) => {
  const textField = form.createTextField(field.id.toString());
  textField.addToPage(page, properties);

  // Remove default styling
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

  textField.setText(field.value?.toString() || '');
  textField.setFontSize(field.fontSize || 10);

  if (field.readOnly) {
    textField.enableReadOnly();
  }
};

const addCheckBox = (form, page, field, properties) => {
  const checkbox = form.createCheckBox(field.id.toString());
  checkbox.addToPage(page, {
    ...properties,
    width: 10,
    height: 10,
    borderWidth: 0,
    borderColor: rgb(0, 0, 0, 0)
  });

  const widgets = checkbox.acroField.getWidgets();
  widgets.forEach(widget => {
    const dict = widget.dict;
    dict.delete(PDFName.of('BS'));
    dict.delete(PDFName.of('MK'));
    dict.delete(PDFName.of('BG'));
    dict.set(PDFName.of('DA'), PDFName.of('/ZaDb 0 Tf 0 g'));
  });

  if (field.readOnly) {
    checkbox.enableReadOnly();
  }

  if (field.value === 'checked') {
    checkbox.check();
  } else {
    checkbox.uncheck();
  }
};

const addTable = (form, page, field, properties) => {
  // Implementation depends on how you want to represent tables in the PDF
  // This could be a series of text fields arranged in a grid
  // or a custom appearance stream
};



/**
 * PDF export utilities
 */
export const pdfExport = {
  // Save PDF as blob
  savePdfAsBlob: async (pdfDoc) => {
    try {
      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      throw new Error(`Error saving PDF: ${error.message}`);
    }
  },

  // Create blob URL
  createBlobUrl: (blob) => {
    return URL.createObjectURL(blob);
  },

  // Clean up blob URL
  revokeBlobUrl: (url) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
};