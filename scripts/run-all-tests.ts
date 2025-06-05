import { spawn } from "child_process"
import { Ollama } from "ollama"

const ollama = new Ollama({ host: "http://localhost:11434" })

async function checkOllamaHealth() {
    console.log("🏥 Checking Ollama health...")

    try {
        const models = await ollama.list()
        const requiredModels = ["llama3.2", "nomic-embed-text"]
        const availableModels = models.models.map((m) => m.name)

        for (const required of requiredModels) {
            const found = availableModels.some((available) => available.includes(required))
            if (found) {
                console.log(`   ✅ ${required} available`)
            } else {
                console.log(`   ❌ ${required} missing`)
                throw new Error(`Required model ${required} not found`)
            }
        }

        // Quick response test
        const testResponse = await ollama.generate({
            model: "llama3.2",
            prompt: 'Say "OK"',
            options: { num_predict: 2 }
        })

        console.log(`   ✅ Quick test response: "${testResponse.response.trim()}"`)
        console.log("   ✅ Ollama is healthy and ready")
    } catch (error) {
        console.error("   ❌ Ollama health check failed:", error)
        throw error
    }
}

function runCommand(command: string, args: string[]): Promise<number> {
    return new Promise((resolve, reject) => {
        console.log(`\n🚀 Running: ${command} ${args.join(" ")}`)

        const process = spawn(command, args, {
            stdio: "inherit",
            shell: true
        })

        process.on("close", (code) => {
            if (code === 0) {
                console.log(`   ✅ Command completed successfully`)
                resolve(code)
            } else {
                console.log(`   ❌ Command failed with code ${code}`)
                reject(new Error(`Command failed with code ${code}`))
            }
        })

        process.on("error", (error) => {
            console.error(`   ❌ Command error:`, error)
            reject(error)
        })
    })
}

async function main() {
    console.log("🧪 Ollama & MCP Complete Test Suite")
    console.log("=====================================\n")

    const startTime = Date.now()

    try {
        // Health check
        await checkOllamaHealth()

        // Run setup if needed
        console.log("\n📦 Running setup verification...")
        await runCommand("npx", ["tsx", "src/complete-setup.ts"])

        // Run comprehensive integration tests
        console.log("\n🧪 Running comprehensive integration tests...")
        await runCommand("npx", ["mocha", "test/comprehensive-integration.test.ts"])

        // Run performance tests
        console.log("\n⚡ Running performance tests...")
        await runCommand("npx", ["mocha", "test/performance.test.ts"])

        // Run basic integration tests
        console.log("\n🔧 Running basic integration tests...")
        await runCommand("npx", ["mocha", "test/integration.test.ts"])

        // Run all examples
        console.log("\n🎯 Running all examples...")
        await runCommand("npx", ["tsx", "src/run-all-examples.ts"])

        const duration = Date.now() - startTime

        console.log("\n🎉 ALL TESTS COMPLETED SUCCESSFULLY! 🎉")
        console.log("=========================================")
        console.log(`⏱️  Total time: ${(duration / 1000).toFixed(1)} seconds`)
        console.log("")
        console.log("📋 Test Summary:")
        console.log("   ✅ Health check passed")
        console.log("   ✅ Setup verification completed")
        console.log("   ✅ Comprehensive integration tests passed")
        console.log("   ✅ Performance tests completed")
        console.log("   ✅ Basic integration tests passed")
        console.log("   ✅ All examples executed successfully")
        console.log("")
        console.log("🛫 System is ready for offline experimentation!")
        console.log("")
        console.log("💡 Next steps:")
        console.log("   - Try individual examples: npx tsx src/[example-file].ts")
        console.log("   - Run specific tests: npx mocha test/[test-file].ts")
        console.log("   - Experiment with your own prompts")
        console.log("   - Modify examples for your use cases")
    } catch (error) {
        console.error("\n❌ Test suite failed:", error.message)
        console.error("\n🔍 Troubleshooting:")
        console.error("   1. Make sure Ollama is running: ollama serve")
        console.error("   2. Install required models: ollama pull llama3.2 && ollama pull nomic-embed-text")
        console.error("   3. Check npm dependencies: npm install")
        console.error("   4. Verify system requirements: Node.js 18+")

        process.exit(1)
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    await main()
}
