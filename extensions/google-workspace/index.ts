import type { OpenClawPluginApi } from "../../src/plugins/types.js";
import { createGoogleWorkspaceTools } from "./src/tools.js";

export default function register(api: OpenClawPluginApi) {
  const tools = createGoogleWorkspaceTools(api);
  for (const tool of tools) {
    api.registerTool(tool, { optional: true });
  }
}
