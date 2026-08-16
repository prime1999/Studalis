import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

/**
 * Executes a tool on CockroachDB Cloud's Managed MCP Endpoint via Streamable HTTP.
 */
export async function runManagedCockroachMcp(
  toolName: string,
  toolArgs: Record<string, any>,
) {
  const apiKey = process.env.COCKROACH_CLOUD_API_KEY;
  const clusterId = process.env.COCKROACH_CLUSTER_ID;

  if (!apiKey || !clusterId) {
    throw new Error(
      "Missing COCKROACH_CLOUD_API_KEY or COCKROACH_CLUSTER_ID in environment variables.",
    );
  }

  const endpoint = new URL("https://cockroachlabs.cloud/mcp");

  const transport = new StreamableHTTPClientTransport(endpoint, {
    requestInit: {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "x-cockroach-cluster-id": clusterId,
      },
    },
  });

  const client = new Client(
    { name: "studalis-backend", version: "1.0.0" },
    { capabilities: {} },
  );

  try {
    await client.connect(transport);

    const result: any = await client.callTool({
      name: toolName,
      arguments: toolArgs,
    });
    // Optional: Parse JSON text automatically if present
    const firstContent = result.content?.[0];
    if (
      firstContent?.type === "text" &&
      typeof firstContent.text === "string"
    ) {
      try {
        return JSON.parse(firstContent.text);
      } catch {
        return firstContent.text;
      }
    }

    return result;
  } catch (error) {
    console.error(
      `[Cockroach Managed MCP Error - Cluster: ${clusterId} - Tool: ${toolName}]:`,
      error,
    );
    throw error;
  } finally {
    await client.close();
  }
}
