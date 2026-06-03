import fs from 'fs';
import path from 'path';

export function debugLog(message: string, error?: any) {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] ${message}\n`;
  
  if (error) {
    if (error instanceof Error) {
      logMessage += `Error: ${error.message}\nStack: ${error.stack}\n`;
    } else {
      logMessage += `Error details: ${JSON.stringify(error, null, 2)}\n`;
    }
  }
  
  logMessage += '-------------------------------------------\n';
  
  try {
    fs.appendFileSync(path.resolve(process.cwd(), 'debug.log'), logMessage);
  } catch (err) {
    console.error('Failed to write to debug.log:', err);
  }
}
