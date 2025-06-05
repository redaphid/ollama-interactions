import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js"

// Create MCP Server (Host)
export class OllamaMCPServer {
    private server: Server

    constructor() {
        this.server = new Server(
            {
                name: "ollama-server",
                version: "1.0.0"
            },
            {
                capabilities: {
                    tools: {},
                    resources: {},
                    prompts: {}
                }
            }
        )

        this.setupTools()
        this.setupResources()
        this.setupPrompts()
    }

    private setupTools() {
        // Register Ollama chat tool
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params

            switch (name) {
                case "ollama_chat":
                    return await this.handleOllamaChat(args)
                case "ollama_generate":
                    return await this.handleOllamaGenerate(args)
                case "ollama_embeddings":
                    return await this.handleOllamaEmbeddings(args)
                default:
                    throw new Error(`Unknown tool: ${name}`)
            }
        })
    }

    private async handleOllamaChat(args: any) {
        const { Ollama } = await import("ollama")
        const ollama = new Ollama({ host: "http://localhost:11434" })

        const response = await ollama.chat({
            model: args.model || "llama3.2",
            messages: args.messages || [{ role: "user", content: args.prompt || "Hello" }],
            stream: false
        })

        return {
            content: [
                {
                    type: "text",
                    text: response.message.content
                }
            ]
        }
    }

    private async handleOllamaGenerate(args: any) {
        const { Ollama } = await import("ollama")
        const ollama = new Ollama({ host: "http://localhost:11434" })

        const response = await ollama.generate({
            model: args.model || "llama3.2",
            prompt: args.prompt,
            stream: false
        })

        return {
            content: [
                {
                    type: "text",
                    text: response.response
                }
            ]
        }
    }

    private async handleOllamaEmbeddings(args: any) {
        const { Ollama } = await import("ollama")
        const ollama = new Ollama({ host: "http://localhost:11434" })

        const response = await ollama.embeddings({
            model: args.model || "nomic-embed-text",
            prompt: args.prompt
        })

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(response.embedding)
                }
            ]
        }
    }

    private setupResources() {
        // Add resource handlers here
        this.server.setRequestHandler("resources/list", async () => {
            return {
                resources: [
                    {
                        uri: "ollama://models",
                        name: "Available Ollama Models",
                        description: "List of available Ollama models",
                        mimeType: "application/json"
                    }
                ]
            }
        })

        this.server.setRequestHandler("resources/read", async (request) => {
            const { uri } = request.params

            if (uri === "ollama://models") {
                const { Ollama } = await import("ollama")
                const ollama = new Ollama({ host: "http://localhost:11434" })

                try {
                    const models = await ollama.list()
                    return {
                        contents: [
                            {
                                uri,
                                mimeType: "application/json",
                                text: JSON.stringify(models.models, null, 2)
                            }
                        ]
                    }
                } catch (error) {
                    return {
                        contents: [
                            {
                                uri,
                                mimeType: "text/plain",
                                text: `Error fetching models: ${error}`
                            }
                        ]
                    }
                }
            }

            throw new Error(`Unknown resource: ${uri}`)
        })
    }

    private setupPrompts() {
        this.server.setRequestHandler("prompts/list", async () => {
            return {
                prompts: [
                    {
                        name: "code_review",
                        description: "Review code for best practices",
                        arguments: [
                            {
                                name: "code",
                                description: "Code to review",
                                required: true
                            },
                            {
                                name: "language",
                                description: "Programming language",
                                required: false
                            }
                        ]
                    }
                ]
            }
        })

        this.server.setRequestHandler("prompts/get", async (request) => {
            const { name, arguments: args } = request.params

            if (name === "code_review") {
                return {
                    description: "Code review prompt",
                    messages: [
                        {
                            role: "user",
                            content: {
                                type: "text",
                                text: `Please review this ${
                                    args?.language || "code"
                                } and provide feedback on best practices, potential issues, and improvements:\n\n${
                                    args?.code
                                }`
                            }
                        }
                    ]
                }
            }

            throw new Error(`Unknown prompt: ${name}`)
        })
    }

    async start() {
        const transport = new StdioServerTransport()
        await this.server.connect(transport)
        console.log("Ollama MCP Server started")
    }
}

// Export for use in tests and other files
export async function createMCPHost() {
    const server = new OllamaMCPServer()
    return server
}

// Run server if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const server = new OllamaMCPServer()
    await server.start()
}
