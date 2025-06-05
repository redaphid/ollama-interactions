// Setup script to check dependencies and download required models
import { Ollama } from "ollama"

const ollama = new Ollama({ host: "http://localhost:11434" })

export async function checkOllamaConnection() {
    try {
        const models = await ollama.list()
        console.log("✓ Connected to Ollama")
        return true
    } catch (error) {
        console.error("✗ Cannot connect to Ollama. Make sure Ollama is running on localhost:11434")
        console.error("Install Ollama from: https://ollama.ai")
        return false
    }
}

export async function ensureModelsAvailable() {
    console.log("Checking required models...")

    const requiredModels = ["llama3.2", "nomic-embed-text"]
    const availableModels = await ollama.list()
    const installedModels = availableModels.models.map((m) => m.name)

    for (const model of requiredModels) {
        if (!installedModels.some((installed) => installed.includes(model))) {
            console.log(`Installing ${model}...`)
            try {
                await ollama.pull({ model })
                console.log(`✓ ${model} installed`)
            } catch (error) {
                console.error(`✗ Failed to install ${model}:`, error)
            }
        } else {
            console.log(`✓ ${model} already available`)
        }
    }
}

export async function setupEnvironment() {
    console.log("=== Setting up Ollama Experiments Environment ===\n")

    const connected = await checkOllamaConnection()
    if (!connected) {
        process.exit(1)
    }

    await ensureModelsAvailable()

    console.log("\n=== Setup Complete ===")
    console.log("You can now run:")
    console.log("- npm test (run integration tests)")
    console.log("- tsx src/01-simple-interaction.ts (try simple interactions)")
    console.log("- tsx src/02-tool-calling.ts (try tool calling)")
    console.log("- tsx src/03-conversation-flow.ts (try conversation management)")
    console.log("- tsx src/04-rag-system.ts (try RAG system)")
    console.log("- tsx src/05-vector-stores.ts (try vector operations)")
    console.log("- tsx src/06-advanced-ai-concepts.ts (try advanced AI concepts)")
    console.log("- tsx src/mcp/01-mcp-host.ts (try MCP server)")
    console.log("- tsx src/mcp/02-mcp-client.ts (try MCP client)")
    console.log("- tsx src/mcp/03-mcp-features.ts (try MCP features)")
    console.log("- tsx src/mcp/04-ollama-mcp-integration.ts (try Ollama-MCP integration)")
}

if (import.meta.url === `file://${process.argv[1]}`) {
    await setupEnvironment()
}
