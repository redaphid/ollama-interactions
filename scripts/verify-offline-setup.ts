import { Ollama } from "ollama"
import { promises as fs } from "fs"
import * as path from "path"

const ollama = new Ollama({ host: "http://localhost:11434" })

interface VerificationResult {
    category: string
    checks: Array<{
        name: string
        status: "pass" | "fail" | "warning"
        message: string
        details?: any
    }>
}

async function verifyOllamaSetup(): Promise<VerificationResult> {
    const result: VerificationResult = {
        category: "Ollama Setup",
        checks: []
    }

    try {
        // Check connection
        const models = await ollama.list()
        result.checks.push({
            name: "Connection",
            status: "pass",
            message: "Successfully connected to Ollama server"
        })

        // Check required models
        const requiredModels = ["llama3.2", "nomic-embed-text"]
        const availableModels = models.models.map((m) => m.name)

        for (const required of requiredModels) {
            const found = availableModels.some((available) => available.includes(required))
            result.checks.push({
                name: `Model: ${required}`,
                status: found ? "pass" : "fail",
                message: found ? `${required} is available` : `${required} is missing`,
                details: found ? availableModels.filter((m) => m.includes(required)) : null
            })
        }

        // Test basic functionality
        try {
            const testChat = await ollama.chat({
                model: "llama3.2",
                messages: [{ role: "user", content: 'Respond with exactly "TEST_PASS"' }]
            })

            result.checks.push({
                name: "Chat Function",
                status: testChat.message.content.includes("TEST_PASS") ? "pass" : "warning",
                message: "Chat functionality tested",
                details: testChat.message.content
            })
        } catch (error) {
            result.checks.push({
                name: "Chat Function",
                status: "fail",
                message: `Chat test failed: ${error}`
            })
        }

        // Test embeddings
        try {
            const testEmbed = await ollama.embeddings({
                model: "nomic-embed-text",
                prompt: "test embedding"
            })

            result.checks.push({
                name: "Embeddings Function",
                status: testEmbed.embedding && testEmbed.embedding.length > 0 ? "pass" : "fail",
                message: "Embeddings functionality tested",
                details: `Generated ${testEmbed.embedding?.length || 0} dimensions`
            })
        } catch (error) {
            result.checks.push({
                name: "Embeddings Function",
                status: "fail",
                message: `Embeddings test failed: ${error}`
            })
        }
    } catch (error) {
        result.checks.push({
            name: "Connection",
            status: "fail",
            message: `Cannot connect to Ollama: ${error}`
        })
    }

    return result
}

async function verifyNodeModules(): Promise<VerificationResult> {
    const result: VerificationResult = {
        category: "Node Dependencies",
        checks: []
    }

    try {
        const packageJson = JSON.parse(await fs.readFile("package.json", "utf-8"))
        const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies }

        const criticalPackages = ["ollama", "@modelcontextprotocol/sdk", "mocha", "chai", "tsx", "typescript"]

        for (const pkg of criticalPackages) {
            if (allDeps[pkg]) {
                try {
                    await import(pkg)
                    result.checks.push({
                        name: pkg,
                        status: "pass",
                        message: `${pkg} v${allDeps[pkg]} installed and importable`
                    })
                } catch (error) {
                    result.checks.push({
                        name: pkg,
                        status: "warning",
                        message: `${pkg} installed but import failed: ${error}`
                    })
                }
            } else {
                result.checks.push({
                    name: pkg,
                    status: "fail",
                    message: `${pkg} is not installed`
                })
            }
        }
    } catch (error) {
        result.checks.push({
            name: "Package.json",
            status: "fail",
            message: `Cannot read package.json: ${error}`
        })
    }

    return result
}

async function verifyProjectStructure(): Promise<VerificationResult> {
    const result: VerificationResult = {
        category: "Project Structure",
        checks: []
    }

    const requiredFiles = [
        "src/01-simple-interaction.ts",
        "src/02-tool-calling.ts",
        "src/03-conversation-flow.ts",
        "src/04-rag-system.ts",
        "src/05-vector-stores.ts",
        "src/06-advanced-ai-concepts.ts",
        "src/mcp/01-mcp-host.ts",
        "src/mcp/02-mcp-client.ts",
        "src/mcp/03-mcp-features.ts",
        "src/mcp/04-ollama-mcp-integration.ts",
        "test/integration.test.ts",
        "test/comprehensive-integration.test.ts",
        "tsconfig.json"
    ]

    for (const file of requiredFiles) {
        try {
            await fs.access(file)
            result.checks.push({
                name: file,
                status: "pass",
                message: "File exists"
            })
        } catch (error) {
            result.checks.push({
                name: file,
                status: "fail",
                message: "File missing"
            })
        }
    }

    return result
}

async function verifyExamples(): Promise<VerificationResult> {
    const result: VerificationResult = {
        category: "Example Functionality",
        checks: []
    }

    try {
        // Test simple interaction
        const { simpleInteraction } = await import("../src/01-simple-interaction.js")
        const simpleResult = await simpleInteraction()

        result.checks.push({
            name: "Simple Interaction",
            status: simpleResult && simpleResult.length > 0 ? "pass" : "fail",
            message: "Simple interaction example tested",
            details: simpleResult ? `Response: ${simpleResult.substring(0, 50)}...` : "No response"
        })
    } catch (error) {
        result.checks.push({
            name: "Simple Interaction",
            status: "fail",
            message: `Example failed: ${error}`
        })
    }

    try {
        // Test RAG system
        const { SimpleRAG } = await import("../src/04-rag-system.js")
        const rag = new SimpleRAG()
        await rag.addDocument("test", "This is a test document about programming")
        const ragResult = await rag.query("What is this document about?")

        result.checks.push({
            name: "RAG System",
            status: ragResult && ragResult.answer ? "pass" : "fail",
            message: "RAG system functionality tested",
            details: ragResult ? `Sources found: ${ragResult.sources.length}` : "No result"
        })
    } catch (error) {
        result.checks.push({
            name: "RAG System",
            status: "fail",
            message: `RAG test failed: ${error}`
        })
    }

    return result
}

async function generateReport(results: VerificationResult[]) {
    console.log("🔍 OFFLINE SETUP VERIFICATION REPORT")
    console.log("====================================\n")

    let totalChecks = 0
    let passedChecks = 0
    let failedChecks = 0
    let warningChecks = 0

    for (const category of results) {
        console.log(`📋 ${category.category}`)
        console.log("-".repeat(category.category.length + 3))

        for (const check of category.checks) {
            totalChecks++

            let emoji = ""
            switch (check.status) {
                case "pass":
                    emoji = "✅"
                    passedChecks++
                    break
                case "fail":
                    emoji = "❌"
                    failedChecks++
                    break
                case "warning":
                    emoji = "⚠️"
                    warningChecks++
                    break
            }

            console.log(`   ${emoji} ${check.name}: ${check.message}`)
            if (check.details) {
                console.log(`      ${check.details}`)
            }
        }
        console.log("")
    }

    console.log("📊 SUMMARY")
    console.log("----------")
    console.log(`Total checks: ${totalChecks}`)
    console.log(`✅ Passed: ${passedChecks}`)
    console.log(`⚠️  Warnings: ${warningChecks}`)
    console.log(`❌ Failed: ${failedChecks}`)

    const successRate = ((passedChecks / totalChecks) * 100).toFixed(1)
    console.log(`📈 Success rate: ${successRate}%`)

    console.log("\n🎯 RECOMMENDATIONS")
    console.log("------------------")

    if (failedChecks === 0) {
        console.log("🎉 Perfect! Your system is fully ready for offline experimentation.")
        console.log("")
        console.log("🚀 Quick start commands:")
        console.log("   npm run test:all     - Run all tests")
        console.log("   npm run examples     - Run all examples")
        console.log("   npx tsx src/01-simple-interaction.ts - Try basic chat")
    } else {
        console.log("🔧 Issues detected. Please address the failed checks above.")

        if (results[0].checks.some((c) => c.name === "Connection" && c.status === "fail")) {
            console.log("   1. Start Ollama: ollama serve")
        }

        if (results[0].checks.some((c) => c.name.includes("Model:") && c.status === "fail")) {
            console.log("   2. Install models: ollama pull llama3.2 && ollama pull nomic-embed-text")
        }

        if (results[1].checks.some((c) => c.status === "fail")) {
            console.log("   3. Install dependencies: npm install")
        }
    }

    return failedChecks === 0
}

async function main() {
    const results = await Promise.all([
        verifyOllamaSetup(),
        verifyNodeModules(),
        verifyProjectStructure(),
        verifyExamples()
    ])

    const allGood = await generateReport(results)

    if (!allGood) {
        process.exit(1)
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    await main()
}
