/**
 * Represents the structure of a file picked and processed through the file picker.
 */
export interface ParsedFilePickerResult {
  success: boolean;
  messageContent: Array<{
    type: string;
    text?: string;
    image_url?: {
      url: string;
      detail: string;
    };
    fileName?: string;
  }>;
  errors?: string[];
  error?: string;
}
