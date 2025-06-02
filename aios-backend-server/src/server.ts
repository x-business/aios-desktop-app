import './config/env';  // This must be the first import
import app from "./app";
import logger from "./utils/logger";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  logger.error("Unhandled Rejection:", err);
  process.exit(1);
});
