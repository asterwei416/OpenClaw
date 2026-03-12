import { exec } from "child_process";
import { promisify } from "util";
import type { OpenClawPluginApi } from "../../../src/plugins/types.js";

const execAsync = promisify(exec);

/**
 * Escapes a string for use in a shell command.
 * Specifically handles the double-quotes within JSON strings for Windows PowerShell/CMD.
 */
function escapeShellArg(arg: string): string {
  if (process.platform === "win32") {
    // In PowerShell/CMD, double quotes in a string that is already double-quoted
    // need to be escaped with a backtick (`) or sometimes doubled up.
    // However, since we wrap the whole --params in single quotes usually, 
    // but Windows doesn't always handle single quotes as expected for nesting JSON.
    // The most reliable way for GWS CLI on Windows is often to use backslashes before quotes
    // or doubling them if we use double quotes for the outer wrapper.
    return arg.replace(/"/g, '\\"');
  }
  return arg;
}

export async function execGws(commandArgs: string, api: OpenClawPluginApi): Promise<unknown> {
  try {
    api.logger.info(`Executing GWS command: ${commandArgs}`);
    
    // Construct the command. On Windows, we might need to be more careful with how we wrap the whole command if it contains JSON.
    const fullCommand = `gws ${commandArgs} --format json`;
    
    const { stdout, stderr } = await execAsync(fullCommand);
    
    if (stderr && stderr.trim().length > 0) {
      if (stderr.toLowerCase().includes("warn")) {
        api.logger.warn(`GWS Stderr: ${stderr}`);
      }
    }
    
    // Attempt to parse the stdout as JSON
    try {
      return JSON.parse(stdout);
    } catch {
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
