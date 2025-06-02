/**
 * Converts a file to a base64 data URL
 * @param filePath The path to the file to convert
 * @returns A promise that resolves to the base64 data URL
 */
export function fileToBase64(filePath: string): Promise<string> {
  const fs = require('fs');

  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err: any, data: Buffer) => {
      if (err) {
        reject(err);
        return;
      }

      // Determine MIME type based on file extension
      const extension = filePath.split('.').pop()?.toLowerCase();
      let mimeType = 'application/octet-stream'; // default

      if (extension === 'png') mimeType = 'image/png';
      else if (extension === 'jpg' || extension === 'jpeg')
        mimeType = 'image/jpeg';
      else if (extension === 'gif') mimeType = 'image/gif';

      // Convert to base64 and create data URL
      const base64 = data.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;

      resolve(dataUrl);
    });
  });
}
