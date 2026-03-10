import { exec } from "child_process";
import { promisify } from "util";
import type { OpenClawPluginApi } from "../../../src/plugins/types.js";

const execAsync = promisify(exec);

export async function execGws(commandArgs: string, api: OpenClawPluginApi): Promise<unknown> {
  try {
    api.logger.info(`Executing GWS command: ${commandArgs}`);
    // Always append --format json for structured output
    const { stdout, stderr } = await execAsync(`gws ${commandArgs} --format json`);
    
    if (stderr && stderr.trim().length > 0) {
      if (stderr.toLowerCase().includes("warn")) {
        api.logger.warn(`GWS Stderr: ${stderr}`);
      }
    }
    
    // Attempt to parse the stdout as JSON
    try {
      return JSON.parse(stdout);
    } catch {
      // If it's not JSON, return the raw stdout (e.g. some commands might not output json despite --format json)
      // Or in page-all mode (NDJSON), we might need to handle it.
      return { rawOutput: stdout };
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    api.logger.error(`GWS execution failed: ${errorMsg}`);
    
    const execErr = err as { stdout?: string | Buffer, stderr?: string | Buffer };
    const stdOutStr = execErr.stdout ? String(execErr.stdout) : "";
    const stdErrStr = execErr.stderr ? String(execErr.stderr) : "";

    // Auth specific error handling
    if (stdErrStr.includes("credentials") || stdErrStr.includes("auth") || stdErrStr.includes("Token") || errorMsg.includes("credentials")) {
      throw new Error(`Google Workspace Auth Error. Please ensure you have authenticated via 'gws auth login' or your Zeabur Volume is mounted correctly at /root/.openclaw.\nDetails: ${stdErrStr || errorMsg}`, { cause: err });
    }

    throw new Error(`Google Workspace CLI Error: ${errorMsg}\nSTDOUT: ${stdOutStr}\nSTDERR: ${stdErrStr}`, { cause: err });
  }
}
