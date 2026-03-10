import type { OpenClawPluginApi } from "../../../src/plugins/types.js";
import { Type } from "@sinclair/typebox";
import { execGws } from "./cli.js";

export const createGoogleWorkspaceTools = (api: OpenClawPluginApi) => {
  const gwsExecuteTool = {
    name: "gws_execute",
    description: "Executes a Google Workspace CLI (gws) command. Returns the API response as JSON. Examples: 'gmail users messages list --params \\'{\"userId\": \"me\"}\\'' or 'drive files list'. DO NOT include the word 'gws' or '--format json' in the command.",
    parameters: Type.Object({
      command: Type.String({ description: "The gws command arguments to execute, e.g. 'drive files list'" })
    }),
    execute: async (args: { command: string }) => {
      try {
        const result = await execGws(args.command, api);
        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) }
          ]
        };
      } catch (err) {
         const errorMsg = err instanceof Error ? err.message : String(err);
         return {
           isError: true,
           content: [
             { type: "text", text: errorMsg }
           ]
         };
      }
    }
  };

  const gwsGmailSendTool = {
    name: "gmail_send",
    description: "Sends an email using the Gmail API via Google Workspace CLI.",
    parameters: Type.Object({
      to: Type.String({ description: "Recipient email address" }),
      subject: Type.String({ description: "Email subject" }),
      body: Type.String({ description: "Email body text" })
    }),
    execute: async (args: { to: string, subject: string, body: string }) => {
      try {
        const command = `gmail users messages send --params '{"userId": "me"}' --json '{"raw": "${Buffer.from(`To: ${args.to}\nSubject: ${args.subject}\n\n${args.body}`).toString('base64url')}"}'`;
        const result = await execGws(command, api);
        return { content: [{ type: "text", text: `Email sent successfully.\n${JSON.stringify(result, null, 2)}` }] };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { isError: true, content: [{ type: "text", text: errorMsg }] };
      }
    }
  };

  const gwsDriveListTool = {
    name: "drive_list",
    description: "Lists files in Google Drive. Returns a list of files with their IDs and names.",
    parameters: Type.Object({
      pageSize: Type.Optional(Type.Number({ description: "Number of files to return (default: 10)" })),
      query: Type.Optional(Type.String({ description: "Optional query string to search for specific files (e.g. \"name contains 'Report'\")" }))
    }),
    execute: async (args: { pageSize?: number, query?: string }) => {
      try {
        const pages = args.pageSize ?? 10;
        const queryParam = args.query ? `, "q": "${args.query}"` : "";
        const command = `drive files list --params '{"pageSize": ${pages}${queryParam}}'`;
        const result = await execGws(command, api);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { isError: true, content: [{ type: "text", text: errorMsg }] };
      }
    }
  };

  return [gwsExecuteTool, gwsGmailSendTool, gwsDriveListTool];
}
