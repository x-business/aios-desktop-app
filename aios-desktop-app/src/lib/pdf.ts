import { Document } from '@langchain/core/documents';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';

/**
 * Processes a PDF file by parsing it into Document objects.
 * @param file - The PDF file to process.
 * @returns An array of Document objects extracted from the PDF.
 */
export async function processPDF(file: File): Promise<Document[]> {
  try {
    const loader = new PDFLoader(file);
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
