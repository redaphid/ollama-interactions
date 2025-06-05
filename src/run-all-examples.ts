// Runner script to execute all examples
import { setupEnvironment } from "./setup.js"
import { simpleInteraction, streamingInteraction } from "./01-simple-interaction.js"
import { toolCallingExample } from "./02-tool-calling.js"
import { conversationFlowExample } from "./03-conversation-flow.js"
import { ragExample } from "./04-rag-system.js"
import { vectorStoreExample } from "./05-vector-stores.js"
import { advancedAIConceptsExample } from "./06-advanced-ai-concepts.js"
import { mcpClientExample } from "./mcp/02-mcp-client.js"
import { mcpFeaturesExample } from "./mcp/03-mcp-features.js"
import { ollamaMcpIntegrationExample } from "./mcp/04-ollama-mcp-integration.js"

async function runAllExamples() {
    console.log("=== Running All Ollama & MCP Examples ===\n")

    try {
        // Setup
        await setupEnvironment()

        // Basic Ollama Examples
        console.log("\n" + "=".repeat(50))
        await simpleInteraction()

        console.log("\n" + "=".repeat(50))
        await streamingInteraction()

        console.log("\n" + "=".repeat(50))
        await toolCallingExample()

        console.log("\n" + "=".repeat(50))
        await conversationFlowExample()

        console.log("\n" + "=".repeat(50))
        await ragExample()

        console.log("\n" + "=".repeat(50))
        await vectorStoreExample()

        console.log("\n" + "=".repeat(50))
        await advancedAIConceptsExample()

        // MCP Examples
        console.log("\n" + "=".repeat(50))
        await mcpClientExample()

        console.log("\n" + "=".repeat(50))
        await mcpFeaturesExample()

        console.log("\n" + "=".repeat(50))
        await ollamaMcpIntegrationExample()

        console.log("\n" + "=".repeat(50))
        console.log("=== All Examples Completed Successfully! ===")
    } catch (error) {
        console.error("Error running examples:", error)
        process.exit(1)
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    await runAllExamples()
}
