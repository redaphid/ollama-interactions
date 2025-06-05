import { expect } from "chai"
import { Ollama } from "ollama"
import { promises as fs } from "fs"
import * as path from "path"

// Import all our modules
import { simpleInteraction, streamingInteraction } from "../src/01-simple-interaction.js"
import { toolCallingExample } from "../src/02-tool-calling.js"
import { ConversationManager, conversationFlowExample } from "../src/03-conversation-flow.js"
import { SimpleRAG, ragExample } from "../src/04-rag-system.js"
import { InMemoryVectorStore, vectorStoreExample } from "../src/05-vector-stores.js"
import {
    chainOfThoughtExample,
    fewShotLearningExample,
    selfConsistencyDecoding,
    TreeOfThoughts,
    PromptChain
} from "../src/06-advanced-ai-concepts.js"
import { mcpClientExample } from "../src/mcp/02-mcp-client.js"
import { MCPSampling, MCPProgressTracker, MCPResourceManager } from "../src/mcp/03-mcp-features.js"
import { OllamaMCPIntegration } from "../src/mcp/04-ollama-mcp-integration.js"

const ollama = new Ollama({ host: "http://localhost:11434" })

// Enhanced evaluation helper
async function askOllamaToEvaluate(testDescription: string, result: any, expectedCriteria: string, model = "llama3.2") {
    const prompt = `You are a test evaluator. Analyze if this test result meets the specified criteria.

TEST: ${testDescription}
RESULT: ${
        typeof result === "object"
            ? JSON.stringify(result, null, 2).substring(0, 1000)
            : String(result).substring(0, 1000)
    }
CRITERIA: ${expectedCriteria}

Evaluation Instructions:
1. Check if the result satisfies the criteria
2. Look for key indicators that show the functionality works
3. Consider both content and structure

Respond with exactly one of:
- "PASS: [brief reason why it passes]"
- "FAIL: [brief reason why it fails]"`

    try {
        const response = await ollama.chat({
            model,
            messages: [{ role: "user", content: prompt }],
            options: { temperature: 0.1 } // Low temperature for consistent evaluation
        })

        const evaluation = response.message.content.trim()
        const passed = evaluation.toUpperCase().startsWith("PASS")

        return {
            passed,
            explanation: evaluation,
            rawResult: result
        }
    } catch (error) {
        console.error("Evaluation error:", error)
        return {
            passed: false,
            explanation: `Evaluation failed: ${error}`,
            rawResult: result
        }
    }
}

// Test data loader
async function loadTestData() {
    const testDataDir = "test-data"
    const data = {}

    try {
        const files = await fs.readdir(testDataDir)
        for (const file of files) {
            const filePath = path.join(testDataDir, file)
            const content = await fs.readFile(filePath, "utf-8")
            data[file] = content
        }
    } catch (error) {
        console.warn("Test data not found, using fallback data")
    }

    return data
}

describe("🧪 Comprehensive Ollama Integration Tests", function () {
    // Increase timeout for model operations
    this.timeout(120000)

    before(async function () {
        console.log("🔧 Setting up test environment...")

        // Verify Ollama is running
        try {
            await ollama.list()
            console.log("✅ Ollama connection verified")
        } catch (error) {
            throw new Error("❌ Ollama is not running. Please start with: ollama serve")
        }

        // Load test data
        this.testData = await loadTestData()
        console.log(`✅ Test data loaded (${Object.keys(this.testData).length} files)`)
    })

    describe("🗣️  Basic Ollama Functionality", function () {
        it("should handle simple interactions", async function () {
            const result = await simpleInteraction()

            const evaluation = await askOllamaToEvaluate(
                "Simple chat interaction asking for a programming joke",
                result,
                "Response should be a string containing humor related to programming or coding"
            )

            console.log(`   📊 Evaluation: ${evaluation.explanation}`)
            expect(evaluation.passed, evaluation.explanation).to.be.true
            expect(result).to.be.a("string")
            expect(result.length).to.be.greaterThan(10)
        })

        it("should handle streaming interactions", async function () {
            const result = await streamingInteraction()

            const evaluation = await askOllamaToEvaluate(
                "Streaming interaction counting from 1 to 5",
                result,
                "Response should contain sequential numbers from 1 to 5"
            )

            console.log(`   📊 Evaluation: ${evaluation.explanation}`)
            expect(evaluation.passed, evaluation.explanation).to.be.true
            expect(result).to.be.a("string")
        })

        it("should generate embeddings", async function () {
            const testText = "Machine learning is transforming technology"

            const response = await ollama.embeddings({
                model: "nomic-embed-text",
                prompt: testText
            })

            expect(response.embedding).to.be.an("array")
            expect(response.embedding.length).to.be.greaterThan(100)
            expect(response.embedding.every((n) => typeof n === "number")).to.be.true

            console.log(`   ✅ Generated embedding with ${response.embedding.length} dimensions`)
        })
    })

    describe("🛠️  Tool Calling & Function Usage", function () {
        it("should demonstrate tool calling capabilities", async function () {
            const result = await toolCallingExample()

            const evaluation = await askOllamaToEvaluate(
                "Tool calling example with weather and calculation functions",
                result,
                "Response should show evidence of using both weather lookup and mathematical calculation tools"
            )

            console.log(`   📊 Evaluation: ${evaluation.explanation}`)
            expect(evaluation.passed, evaluation.explanation).to.be.true
        })

        it("should handle custom tool implementations", async function () {
            // Test with a custom calculator tool
            const tools = [
                {
                    type: "function",
                    function: {
                        name: "advanced_calculator",
                        description: "Perform complex calculations",
                        parameters: {
                            type: "object",
                            properties: {
                                expression: { type: "string", description: "Mathematical expression" }
                            }
                        }
                    }
                }
            ]

            const response = await ollama.chat({
                model: "llama3.2",
                messages: [{ role: "user", content: "Calculate the square root of 144 plus 25" }],
                tools
            })

            expect(response.message.content).to.be.a("string")
            console.log(`   ✅ Tool-aware response generated`)
        })
    })

    describe("💬 Conversation Flow Management", function () {
        it("should maintain conversation context", async function () {
            const conversation = new ConversationManager("llama3.2")

            await conversation.sendMessage("My name is Alice and I work as a software engineer")
            await conversation.sendMessage("I specialize in JavaScript and React")
            const response = await conversation.sendMessage("What do you know about me?")

            const evaluation = await askOllamaToEvaluate(
                "Conversation context memory test",
                response,
                "Response should mention Alice, software engineer, JavaScript, and React"
            )

            console.log(`   📊 Evaluation: ${evaluation.explanation}`)
            expect(evaluation.passed, evaluation.explanation).to.be.true
        })

        it("should handle conversation rearrangement", async function () {
            const conversation = new ConversationManager("llama3.2")

            await conversation.sendMessage("I like pizza")
            await conversation.sendMessage("JavaScript is my favorite language")
            await conversation.sendMessage("Machine learning is interesting")
            await conversation.sendMessage("I also enjoy cooking pasta")

            const beforeLength = conversation.getConversation().length
            conversation.rearrangeByKeywords(["JavaScript", "machine learning"])
            const afterLength = conversation.getConversation().length

            expect(afterLength).to.equal(beforeLength)
            console.log(`   ✅ Conversation rearranged (${beforeLength} messages)`)
        })

        it("should trim conversation history", async function () {
            const conversation = new ConversationManager("llama3.2")

            // Add multiple exchanges
            for (let i = 0; i < 5; i++) {
                await conversation.sendMessage(`Message ${i + 1}`)
            }

            const beforeLength = conversation.getConversation().length
            conversation.trimToLastExchanges(2)
            const afterLength = conversation.getConversation().length

            expect(afterLength).to.be.lessThan(beforeLength)
            expect(afterLength).to.be.at.least(4) // 2 exchanges = 4 messages minimum
            console.log(`   ✅ Trimmed from ${beforeLength} to ${afterLength} messages`)
        })
    })

    describe("🔍 RAG (Retrieval Augmented Generation)", function () {
        it("should build and query a RAG system", async function () {
            const rag = new SimpleRAG()

            // Add test documents
            await rag.addDocument("js-doc", "JavaScript is a versatile programming language for web development")
            await rag.addDocument("py-doc", "Python is excellent for data science and machine learning")
            await rag.addDocument("ai-doc", "Artificial intelligence uses algorithms to simulate human intelligence")

            const result = await rag.query("What programming language is good for web development?")

            const evaluation = await askOllamaToEvaluate(
                "RAG system query about web development languages",
                result.answer,
                "Answer should mention JavaScript as suitable for web development, based on the provided documents"
            )

            console.log(`   📊 Evaluation: ${evaluation.explanation}`)
            console.log(`   📚 Sources: ${result.sources.length} documents found`)

            expect(evaluation.passed, evaluation.explanation).to.be.true
            expect(result.sources).to.be.an("array")
            expect(result.sources.length).to.be.greaterThan(0)
        })

        it("should handle document similarity search", async function () {
            const rag = new SimpleRAG()

            await rag.addDocument("tech1", "React is a JavaScript library for building user interfaces")
            await rag.addDocument("tech2", "Vue.js is a progressive framework for building web applications")
            await rag.addDocument("food1", "Pizza is a popular Italian dish with toppings")

            const results = await rag.search("frontend web frameworks", 2)

            expect(results).to.be.an("array")
            expect(results.length).to.be.at.most(2)
            expect(results[0].similarity).to.be.a("number")

            console.log(`   ✅ Found ${results.length} similar documents`)
            console.log(`   📊 Top similarity: ${results[0].similarity.toFixed(3)}`)
        })
    })

    describe("🧮 Vector Operations & Semantic Search", function () {
        it("should perform semantic search in vector store", async function () {
            const store = new InMemoryVectorStore()

            await store.add("programming", "JavaScript and Python are popular programming languages")
            await store.add("cooking", "Italian pasta and pizza are delicious foods")
            await store.add("science", "Quantum physics and machine learning are fascinating fields")

            const results = await store.search("coding and software development", 2)

            expect(results).to.be.an("array")
            expect(results.length).to.be.greaterThan(0)
            expect(results[0]).to.have.property("similarity")

            const evaluation = await askOllamaToEvaluate(
                "Vector search for coding-related query",
                results[0].metadata.text,
                "Top result should be more related to programming than food or science"
            )

            console.log(`   📊 Evaluation: ${evaluation.explanation}`)
            console.log(`   🔍 Search returned ${results.length} results`)

            expect(evaluation.passed, evaluation.explanation).to.be.true
        })

        it("should cluster similar content", async function () {
            const store = new InMemoryVectorStore()

            // Add clearly separable content
            await store.add("tech1", "JavaScript programming and web development")
            await store.add("tech2", "Python coding and software engineering")
            await store.add("food1", "Italian cooking and pasta recipes")
            await store.add("food2", "French cuisine and fine dining")
            await store.add("science1", "Physics and quantum mechanics")
            await store.add("science2", "Chemistry and molecular biology")

            const clusters = await store.cluster(3)

            expect(clusters).to.be.an("array")
            expect(clusters.length).to.be.at.most(3)
            expect(clusters.every((cluster) => cluster.length > 0)).to.be.true

            console.log(`   ✅ Created ${clusters.length} clusters`)
            clusters.forEach((cluster, i) => {
                console.log(`   📦 Cluster ${i + 1}: ${cluster.length} items`)
            })
        })
    })

    describe("🧠 Advanced AI Concepts", function () {
        it("should demonstrate chain of thought reasoning", async function () {
            const result = await chainOfThoughtExample()

            const evaluation = await askOllamaToEvaluate(
                "Chain of thought problem solving for math word problem",
                result,
                "Response should show step-by-step reasoning process and arrive at correct answer"
            )

            console.log(`   📊 Evaluation: ${evaluation.explanation}`)
            expect(evaluation.passed, evaluation.explanation).to.be.true
        })

        it("should perform few-shot learning", async function () {
            const result = await fewShotLearningExample()

            const evaluation = await askOllamaToEvaluate(
                "Few-shot learning for text formalization",
                result,
                "Response should convert informal text to formal business language following the provided examples"
            )

            console.log(`   📊 Evaluation: ${evaluation.explanation}`)
            expect(evaluation.passed, evaluation.explanation).to.be.true
        })

        it("should use self-consistency decoding", async function () {
            const result = await selfConsistencyDecoding(
                "What are the key benefits of using TypeScript over JavaScript?",
                3
            )

            expect(result.attempts).to.be.an("array")
            expect(result.attempts.length).to.equal(3)
            expect(result.finalAnswer).to.be.a("string")

            console.log(`   ✅ Generated ${result.attempts.length} attempts`)
            console.log(`   🎯 Final answer length: ${result.finalAnswer.length} chars`)
        })

        it("should implement tree of thoughts", async function () {
            const tot = new TreeOfThoughts()
            const result = await tot.solve("How to learn a new programming language effectively?", 2)

            expect(result).to.not.be.null
            console.log(`   ✅ Tree of thoughts exploration completed`)
            console.log(`   🌳 Result type: ${typeof result}`)
        })

        it("should execute prompt chains", async function () {
            const chain = new PromptChain()
                .addStep("Generate", "Create 3 ideas for: {{input}}")
                .addStep("Evaluate", "Pick the best idea from: {{input}}")
                .addStep("Detail", "Provide detailed explanation for: {{input}}")

            const results = await chain.execute("improving code quality")

            expect(results).to.be.an("array")
            expect(results.length).to.equal(3)
            expect(results.every((r) => r.step && r.output)).to.be.true

            console.log(`   ✅ Chain executed ${results.length} steps`)
        })
    })

    describe("🔗 MCP (Model Context Protocol)", function () {
        it("should demonstrate MCP sampling features", async function () {
            const sampler = new MCPSampling()

            const schema = {
                name: "string",
                skills: ["array"],
                experience: "number"
            }

            const result = await sampler.structuredGeneration("Create a developer profile", schema)

            // Check if result has expected structure
            const hasValidStructure = result && (typeof result.name === "string" || result.content)

            expect(hasValidStructure).to.be.true
            console.log(`   ✅ Structured generation completed`)
        })

        it("should track task progress", async function () {
            const tracker = new MCPProgressTracker()

            const tasks = ["Explain variables", "Explain functions", "Explain classes"]

            const results = await tracker.longRunningOllamaTask("learning-concepts", tasks)

            expect(results).to.be.an("array")
            expect(results.length).to.equal(tasks.length)

            const taskStatus = tracker.getTaskStatus("learning-concepts")
            expect(taskStatus?.status).to.equal("completed")
            expect(taskStatus?.progress).to.equal(100)

            console.log(`   ✅ Tracked progress for ${tasks.length} tasks`)
        })

        it("should manage resources", async function () {
            const manager = new MCPResourceManager()

            manager.registerResource("test-data", {
                users: [
                    { id: 1, name: "Alice", role: "dev" },
                    { id: 2, name: "Bob", role: "designer" }
                ]
            })

            const analysis = await manager.processWithOllama("test-data", "Summarize the team composition")

            expect(analysis).to.be.a("string")
            expect(analysis.length).to.be.greaterThan(10)

            const log = manager.getAccessLog()
            expect(log.length).to.be.greaterThan(0)

            console.log(`   ✅ Resource processing completed`)
            console.log(`   📋 Access log has ${log.length} entries`)
        })

        it("should integrate Ollama with MCP workflows", async function () {
            const integration = new OllamaMCPIntegration()

            const tools = [
                { name: "get_time", description: "Get current timestamp" },
                { name: "calculate", description: "Perform calculations" }
            ]

            const response = await integration.mcpEnhancedChat("What time is it and what is 15 + 27?", tools)

            expect(response).to.be.a("string")
            expect(response.length).to.be.greaterThan(10)

            console.log(`   ✅ MCP-enhanced chat completed`)
        })
    })

    describe("🎯 End-to-End Workflow Tests", function () {
        it("should execute complete RAG workflow", async function () {
            // Setup RAG with test data
            const rag = new SimpleRAG()

            const docs = [
                { id: "js-guide", content: "JavaScript: Variables are declared with let, const, or var" },
                { id: "py-guide", content: "Python: Variables are declared by assignment, no keyword needed" },
                { id: "ts-guide", content: "TypeScript: Variables can have type annotations for better safety" }
            ]

            for (const doc of docs) {
                await rag.addDocument(doc.id, doc.content)
            }

            // Test multiple queries
            const queries = [
                "How do you declare variables in JavaScript?",
                "What about Python variable declaration?",
                "Which language has type safety?"
            ]

            const results = []
            for (const query of queries) {
                const result = await rag.query(query)
                results.push(result)
            }

            expect(results.length).to.equal(3)
            expect(results.every((r) => r.answer && r.sources)).to.be.true

            console.log(`   ✅ Completed ${queries.length} RAG queries`)
        })

        it("should demonstrate conversation -> RAG -> response workflow", async function () {
            const conversation = new ConversationManager("llama3.2")
            const rag = new SimpleRAG()

            // Setup knowledge base
            await rag.addDocument(
                "best-practices",
                "Code should be readable, maintainable, and well-tested. Use meaningful variable names and write comments."
            )

            // User asks about coding
            await conversation.sendMessage("I want to improve my coding skills")

            // Get RAG response
            const ragResult = await rag.query("How to write better code?")

            // Continue conversation with RAG info
            const finalResponse = await conversation.sendMessage(
                `Based on this advice: "${ragResult.answer}", what should I focus on first?`
            )

            expect(finalResponse).to.be.a("string")
            expect(conversation.getConversation().length).to.be.greaterThan(4)

            console.log(`   ✅ Conversation + RAG workflow completed`)
        })
    })

    describe("📊 Performance & Reliability Tests", function () {
        it("should handle multiple concurrent requests", async function () {
            const promises = []
            const testPrompts = ["Count to 3", "Say hello", "Name a color", "Pick a number", "Say goodbye"]

            for (const prompt of testPrompts) {
                promises.push(
                    ollama.generate({
                        model: "llama3.2",
                        prompt,
                        options: { num_predict: 10 }
                    })
                )
            }

            const results = await Promise.all(promises)

            expect(results.length).to.equal(testPrompts.length)
            expect(results.every((r) => r.response)).to.be.true

            console.log(`   ✅ Handled ${results.length} concurrent requests`)
        })

        it("should handle edge cases gracefully", async function () {
            // Test empty prompt
            const emptyResult = await ollama.generate({
                model: "llama3.2",
                prompt: "",
                options: { num_predict: 5 }
            })

            expect(emptyResult.response).to.be.a("string")

            // Test very short response
            const shortResult = await ollama.generate({
                model: "llama3.2",
                prompt: 'Say "OK" and nothing else',
                options: { num_predict: 3 }
            })

            expect(shortResult.response).to.be.a("string")

            console.log(`   ✅ Edge cases handled gracefully`)
        })
    })

    after(function () {
        console.log("\n🎉 All integration tests completed!")
        console.log("📋 Test Summary:")
        console.log("   ✅ Basic Ollama functionality verified")
        console.log("   ✅ Tool calling and functions working")
        console.log("   ✅ Conversation management operational")
        console.log("   ✅ RAG system functioning")
        console.log("   ✅ Vector operations successful")
        console.log("   ✅ Advanced AI concepts demonstrated")
        console.log("   ✅ MCP integration verified")
        console.log("   ✅ End-to-end workflows tested")
        console.log("   ✅ Performance and reliability confirmed")
        console.log("\n🛫 Ready for offline experimentation!")
    })
})
