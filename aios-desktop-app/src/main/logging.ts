import { app } from 'electron';
import * as log from 'electron-log';
import { join } from 'path';

/**
 * Sets up application logging using electron-log.
 * This should be called very early in the application startup process.
 */
export function setupLogging(): void {
  // Set log level (optional, default is 'info')
  log.default.transports.file.level = 'debug';

  // Configure file logging
  log.default.transports.file.resolvePathFn = () => join(app.getPath('userData'), 'logs', 'main.log');
  log.default.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {processType} - {file}:{line} - {text}';
  log.default.transports.file.maxSize = 5 * 1024 * 1024; // 5 MB max log size

  // Override console methods (IMPORTANT: Do this early)
  Object.assign(console, log.default.functions);

  // Log basic info on startup (now uses electron-log)
  console.log(`App starting... PID: ${process.pid}`);
  console.log(`App version: ${app.getVersion()}`);
  console.log(`Electron version: ${process.versions.electron}`);
  console.log(`Node version: ${process.versions.node}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Arch: ${process.arch}`);
  console.log(`User data path: ${app.getPath('userData')}`);
  console.log(`Logs path: ${join(app.getPath('userData'), 'logs', 'main.log')}`);
  console.log(`App is packaged: ${app.isPackaged}`);
} 