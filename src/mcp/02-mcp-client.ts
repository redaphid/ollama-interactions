import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { spawn } from "child_process"

export class OllamaMCPClient {
    private client: Client
    private transport: StdioClientTransport | null = null

    constructor() {
        this.client = new Client(
            {
                name: "ollama-client",
                version: "1.0.0"
            },
            {
                capabilities: {}
            }
        )
    }

    async connect(serverCommand?: string[]) {
        if (serverCommand) {
            // Connect to external MCP server
            const serverProcess = spawn(serverCommand[0], serverCommand.slice(1))
            this.transport = new StdioClientTransport(serverProcess.stdout, serverProcess.stdin)
        } else {
            // For demo purposes, we'll simulate connecting to our own server
            // In real usage, you'd connect to a separate process
            console.log("Note: This is a demo client. In production, connect to a separate MCP server process.")
            return
        }

        await this.client.connect(this.transport)
        console.log("Connected to MCP server")
    }

    async listTools() {
        try {
            const response = await this.client.listTools()
            return response.tools
        } catch (error) {
            console.error("Error listing tools:", error)
            return []
        }
    }

    async callTool(name: string, args: any) {
        try {
            const response = await this.client.callTool({ name, arguments: args })
            return response
        } catch (error) {
            console.error(`Error calling tool ${name}:`, error)
            throw error
        }
    }

    async listResources() {
        try {
            const response = await this.client.listResources()
            return response.resources
        } catch (error) {
            console.error("Error listing resources:", error)
            return []
        }
    }

    async readResource(uri: string) {
        try {
            const response = await this.client.readResource({ uri })
            return response
        } catch (error) {
            console.error(`Error reading resource ${uri}:`, error)
            throw error
        }
    }

    async listPrompts() {
        try {
            const response = await this.client.listPrompts()
            return response.prompts
        } catch (error) {
            console.error("Error listing prompts:", error)
            return []
        }
    }

    async getPrompt(name: string, args?: any) {
        try {
            const response = await this.client.getPrompt({ name, arguments: args })
            return response
        } catch (error) {
            console.error(`Error getting prompt ${name}:`, error)
            throw error
        }
    }

    async disconnect() {
        if (this.transport) {
            await this.client.close()
        }
    }
}

export async function mcpClientExample() {
    console.log("=== MCP Client Example ===")

    const client = new OllamaMCPClient()

    // Simulate MCP interactions without actual server connection
    console.log("MCP Client initialized")
    console.log("In a real scenario, you would:")
    console.log("1. Connect to an MCP server")
    console.log("2. List available tools, resources, and prompts")
    console.log("3. Call tools and read resources")
    console.log("4. Use prompts for structured interactions")

    // Mock demonstration of what the interactions would look like
    const mockTools = [
        { name: "ollama_chat", description: "Chat with Ollama models" },
        { name: "ollama_generate", description: "Generate text with Ollama" },
        { name: "ollama_embeddings", description: "Create embeddings with Ollama" }
    ]

    console.log("\nMock Tools Available:")
    mockTools.forEach((tool) => {
        console.log(`- ${tool.name}: ${tool.description}`)
    })

    // Simulate tool call result
    console.log("\nMock Tool Call Result:")
    console.log("Tool: ollama_chat")
    console.log('Args: { model: "llama3.2", prompt: "Hello from MCP!" }')
    console.log('Result: { content: [{ type: "text", text: "Hello! I\'m responding through MCP." }] }')

    return client
}

if (import.meta.url === `file://${process.argv[1]}`) {
    await mcpClientExample()
}
