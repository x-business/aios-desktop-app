import { Document } from '@langchain/core/documents';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';

// Set the worker source for PDF.js
// This needs to be done before any PDF processing
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/**
 * Processes a PDF file by parsing it into Document objects.
 * @param file - The PDF file to process.
 * @returns An array of Document objects extracted from the PDF.
 */
export async function processDoc(file: File): Promise<Document[]> {
  try {
    const loader = new DocxLoader(file);
    const docs = await loader.load();
    // Add filename to metadata for each document
    docs.forEach((doc) => {
      doc.metadata.filename = file.name;
    });

    return docs;
  } catch (error: unknown) {
    console.error('Error processing PDF:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to process PDF: ${error.message}`);
    } else {
      throw new Error('Failed to process PDF: Unknown error');
    }
  }
}
