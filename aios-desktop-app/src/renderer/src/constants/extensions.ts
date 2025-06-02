export const ALLOWED_FILE_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".doc",
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".md",
  ".markdown",
];
export const ALLOWED_FILE_EXTENSIONS_REGEX = new RegExp(
  `(${ALLOWED_FILE_EXTENSIONS.join("|")})$`
);