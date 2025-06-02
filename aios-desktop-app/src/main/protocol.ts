import { app } from 'electron';
import { execSync } from 'child_process';
import path from 'path';

export function registerProtocolHandlerWindows() {
  if (process.platform !== 'win32') return;

  try {
    // Get the path to your app's executable
    const exePath = process.defaultApp 
      ? process.execPath
      : process.env.PORTABLE_EXECUTABLE_FILE || app.getPath('exe');
      
    // Properly escape the paths
    const escapedExePath = exePath.replace(/\\/g, '\\\\');
    const appPath = process.defaultApp
      ? `"${escapedExePath}" "${path.resolve(process.argv[1])}" "%1"`
      : `"${escapedExePath}" "%1"`;

    console.log('[Protocol] Registering with exePath:', exePath);
    console.log('[Protocol] Using appPath:', appPath);

    // Registry commands
    const commands = [
      `REG ADD "HKEY_CLASSES_ROOT\\aios" /f /ve /t REG_SZ /d "URL:AIOS Protocol"`,
      `REG ADD "HKEY_CLASSES_ROOT\\aios" /f /v "URL Protocol" /t REG_SZ /d ""`,
      `REG ADD "HKEY_CLASSES_ROOT\\aios\\DefaultIcon" /f /ve /t REG_SZ /d "${escapedExePath},1"`,
      `REG ADD "HKEY_CLASSES_ROOT\\aios\\shell\\open\\command" /f /ve /t REG_SZ /d "${appPath}"`,
    ];

    // Execute registry commands
    commands.forEach(command => {
      console.log('[Protocol] Executing command:', command);
      execSync(command);
    });

    console.log('[Protocol] Successfully registered aios:// protocol handler');
  } catch (error) {
    console.error('[Protocol] Failed to register protocol handler:', error);
  }
} 