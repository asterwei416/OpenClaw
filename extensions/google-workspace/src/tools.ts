import type { OpenClawPluginApi } from "../../../src/plugins/types.js";
import { Type } from "@sinclair/typebox";
import { execGws } from "./cli.js";

/**
 * Escapes a string for use in a shell command.
 */
function escapeShellArg(arg: string): string {
  if (process.platform === "win32") {
    return arg.replace(/"/g, '\\"');
  }
  return arg;
}

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
        const params = JSON.stringify({ userId: "me" });
        const jsonBody = JSON.stringify({ raw: Buffer.from(`To: ${args.to}\nSubject: ${args.subject}\n\n${args.body}`).toString('base64url') });
        const command = `gmail users messages send --params "${escapeShellArg(params)}" --json "${escapeShellArg(jsonBody)}"`;
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
        const paramsObj: Record<string, any> = { pageSize: pages };
        if (args.query) paramsObj.q = args.query;
        
        const params = JSON.stringify(paramsObj);
        const command = `drive files list --params "${escapeShellArg(params)}"`;
        const result = await execGws(command, api);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { isError: true, content: [{ type: "text", text: errorMsg }] };
      }
    }
  };

  const gwsCalendarListEventsTool = {
    name: "calendar_list_events",
    description: "Lists upcoming events from the primary calendar.",
    parameters: Type.Object({
      maxResults: Type.Optional(Type.Number({ description: "Maximum number of events to return (default: 10)" })),
      timeMin: Type.Optional(Type.String({ description: "Lower bound (exclusive) for an event's end time to filter by (RFC3339 timestamp)" }))
    }),
    execute: async (args: { maxResults?: number, timeMin?: string }) => {
      try {
        const paramsObj: Record<string, any> = { calendarId: "primary", maxResults: args.maxResults ?? 10 };
        if (args.timeMin) paramsObj.timeMin = args.timeMin;
        
        const params = JSON.stringify(paramsObj);
        const command = `calendar events list --params "${escapeShellArg(params)}"`;
        const result = await execGws(command, api);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { isError: true, content: [{ type: "text", text: errorMsg }] };
      }
    }
  };

  const gwsCalendarCreateEventTool = {
    name: "calendar_create_event",
    description: "Creates a new event in the primary calendar.",
    parameters: Type.Object({
      summary: Type.String({ description: "Title of the event" }),
      description: Type.Optional(Type.String({ description: "Description of the event" })),
      start: Type.String({ description: "Start time (RFC3339 timestamp, e.g. 2026-03-28T09:00:00Z) or for all-day events use YYYY-MM-DD" }),
      end: Type.String({ description: "End time (RFC3339 timestamp) or for all-day events use YYYY-MM-DD" }),
      isAllDay: Type.Optional(Type.Boolean({ description: "Whether it is an all-day event (default: false)" }))
    }),
    execute: async (args: { summary: string, description?: string, start: string, end: string, isAllDay?: boolean }) => {
      try {
        const event: Record<string, any> = {
          summary: args.summary,
          description: args.description ?? ""
        };

        if (args.isAllDay) {
          event.start = { date: args.start };
          event.end = { date: args.end };
        } else {
          event.start = { dateTime: args.start };
          event.end = { dateTime: args.end };
        }

        const params = JSON.stringify({ calendarId: "primary" });
        const jsonBody = JSON.stringify(event);
        const command = `calendar events insert --params "${escapeShellArg(params)}" --json "${escapeShellArg(jsonBody)}"`;
        const result = await execGws(command, api);
        return { content: [{ type: "text", text: `Event created successfully.\n${JSON.stringify(result, null, 2)}` }] };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { isError: true, content: [{ type: "text", text: errorMsg }] };
      }
    }
  };

  return [
    gwsExecuteTool, 
    gwsGmailSendTool, 
    gwsDriveListTool, 
    gwsCalendarListEventsTool, 
    gwsCalendarCreateEventTool
  ];
}
