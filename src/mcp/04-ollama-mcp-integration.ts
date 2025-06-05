import { Ollama } from "ollama"

const ollama = new Ollama({ host: "http://localhost:11434" })

// Enhanced MCP-Ollama Integration
export class OllamaMCPIntegration {
    private conversationHistory: Array<{ role: string; content: string }> = []

    async mcpEnhancedChat(message: string, tools: any[] = []) {
        this.conversationHistory.push({ role: "user", content: message })

        // Use Ollama with tool-like capabilities
        let response
        if (tools.length > 0) {
            // Simulate tool availability in prompt
            const toolDescriptions = tools.map((tool) => `- ${tool.name}: ${tool.description}`).join("\n")

            const enhancedPrompt = `You have access to the following tools:
${toolDescriptions}

User message: ${message}

If you need to use a tool, respond with: USE_TOOL: [tool_name] [arguments]
Otherwise, respond normally.`

            response = await ollama.chat({
                model: "llama3.2",
                messages: [...this.conversationHistory.slice(0, -1), { role: "user", content: enhancedPrompt }]
            })
        } else {
            response = await ollama.chat({
                model: "llama3.2",
                messages: this.conversationHistory
            })
        }

        this.conversationHistory.push({ role: "assistant", content: response.message.content })

        // Check if tool use was requested
        if (response.message.content.includes("USE_TOOL:")) {
            return await this.handleToolUse(response.message.content, tools)
        }

        return response.message.content
    }

    private async handleToolUse(response: string, tools: any[]) {
        const toolMatch = response.match(/USE_TOOL:\s*(\w+)\s*(.*)/)
        if (!toolMatch) return response

        const [, toolName, argsString] = toolMatch
        const tool = tools.find((t) => t.name === toolName)

        if (!tool) {
            return `Tool ${toolName} not found. Available tools: ${tools.map((t) => t.name).join(", ")}`
        }

        // Execute the tool (mock implementation)
        const toolResult = await this.executeTool(toolName, argsString)

        // Get final response with tool result
        const finalPrompt = `Tool ${toolName} returned: ${toolResult}

Based on this result, provide a helpful response to the user.`

        const finalResponse = await ollama.chat({
            model: "llama3.2",
            messages: [...this.conversationHistory, { role: "user", content: finalPrompt }]
        })

        return finalResponse.message.content
    }

    private async executeTool(toolName: string, args: string) {
        // Mock tool implementations
        switch (toolName) {
            case "web_search":
                return `Mock search results for: ${args}`
            case "calculate":
                try {
                    return `Result: ${eval(args)}`
                } catch {
                    return "Calculation error"
                }
            case "get_time":
                return new Date().toISOString()
            case "ollama_models":
                const models = await ollama.list()
                return JSON.stringify(models.models.map((m) => m.name))
            default:
                return "Tool not implemented"
        }
    }

    async createWorkflow(steps: Array<{ action: string; prompt: string }>) {
        console.log("=== MCP Workflow Execution ===")
        const results = []

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i]
            console.log(`Step ${i + 1}: ${step.action}`)

            const response = await ollama.chat({
                model: "llama3.2",
                messages: [
                    { role: "system", content: `You are performing step ${i + 1} of a workflow: ${step.action}` },
                    { role: "user", content: step.prompt }
                ]
            })

            results.push({
                step: i + 1,
                action: step.action,
                result: response.message.content
            })

            console.log(`Result: ${response.message.content.substring(0, 100)}...`)
        }

        return results
    }

    async batchProcess(items: string[], instruction: string) {
        console.log(`=== Batch Processing ${items.length} items ===`)
        const results = []

        for (let i = 0; i < items.length; i++) {
            console.log(`Processing item ${i + 1}/${items.length}`)

            const response = await ollama.chat({
                model: "llama3.2",
                messages: [{ role: "user", content: `${instruction}\n\nItem: ${items[i]}` }]
            })

            results.push({
                item: items[i],
                result: response.message.content
            })
        }

        return results
    }
}

export async function ollamaMcpIntegrationExample() {
    console.log("=== Ollama-MCP Integration Example ===")

    const integration = new OllamaMCPIntegration()

    // Define available tools
    const tools = [
        { name: "web_search", description: "Search the web for information" },
        { name: "calculate", description: "Perform mathematical calculations" },
        { name: "get_time", description: "Get current timestamp" },
        { name: "ollama_models", description: "List available Ollama models" }
    ]

    // Test enhanced chat with tools
    console.log("\n--- Enhanced Chat with Tools ---")
    const response1 = await integration.mcpEnhancedChat("What Ollama models are available?", tools)
    console.log("Response:", response1)

    const response2 = await integration.mcpEnhancedChat("Calculate 25 * 17 + 33", tools)
    console.log("Response:", response2)

    // Test workflow
    console.log("\n--- Workflow Example ---")
    const workflow = [
        { action: "Research", prompt: "What are the key principles of good API design?" },
        { action: "Analyze", prompt: "Based on those principles, what are common API design mistakes?" },
        { action: "Recommend", prompt: "Provide 3 specific recommendations for improving API design" }
    ]

    const workflowResults = await integration.createWorkflow(workflow)
    console.log("Workflow completed with", workflowResults.length, "steps")

    // Test batch processing
    console.log("\n--- Batch Processing ---")
    const codeSnippets = [
        "function add(a, b) { return a + b; }",
        'const users = await fetch("/api/users").then(r => r.json());',
        'if (x == null) { throw new Error("x is null"); }'
    ]

    const batchResults = await integration.batchProcess(
        codeSnippets,
        "Review this JavaScript code and suggest improvements:"
    )

    console.log("Batch processing completed")
    batchResults.forEach((result, i) => {
        console.log(`\nCode ${i + 1} Review:`)
        console.log(result.result.substring(0, 200) + "...")
    })

    return integration
}

if (import.meta.url === `file://${process.argv[1]}`) {
    await ollamaMcpIntegrationExample()
}
