import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "./types.js";
import { jsonResult } from "../agents/tools/common.js";
import { withTimeout } from "../agents/tools/web-shared.js";

const TavilySearchSchema = Type.Object({
  query: Type.String({ description: "Search query string." }),
});

export default {
  id: "tavily-search",
  name: "Tavily Search",
  description:
    "Web search powered by Tavily API. Automatically enabled via TAVILY_API_KEY.",
  register(api: OpenClawPluginApi) {
    api.registerTool({
      label: "Tavily Web Search",
      name: "tavily_search",
      description:
        "Search the web using Tavily API. Use this tool for real-time web search and information gathering.",
      parameters: TavilySearchSchema,
      execute: async (_toolCallId, args) => {
        const query = args.query as string;
        const apiKey = process.env.TAVILY_API_KEY;

        if (!apiKey) {
          return jsonResult({
            error: "missing_tavily_api_key",
            message:
              "TAVILY_API_KEY is not set in the environment. Please configure it in Zeabur.",
          });
        }

        try {
          const res = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              api_key: apiKey,
              query,
              search_depth: "basic",
              include_answer: true,
              max_results: 5,
            }),
            signal: withTimeout(undefined, 15000),
          });

          if (!res.ok) {
            return jsonResult({
              error: "tavily_api_error",
              message: `HTTP ${res.status}`,
            });
          }

          const data = await res.json();
          return jsonResult(data);
        } catch (e) {
          return jsonResult({ error: "fetch_failed", message: String(e) });
        }
      },
    });
  },
};
