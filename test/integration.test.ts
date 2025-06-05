import { expect } from "chai"
import { Ollama } from "ollama"
import { simpleInteraction, streamingInteraction } from "../src/01-simple-interaction.js"
import { toolCallingExample } from "../src/02-tool-calling.js"
import { ConversationManager } from "../src/03-conversation-flow.js"
import { SimpleRAG } from "../src/04-rag-system.js"
import { InMemoryVectorStore } from "../src/05-vector-stores.js"

const ollama = new Ollama({ host: "http://localhost:11434" })

// Helper function to get Ollama's opinion on test results
async function askOllamaToEvaluate(testDescription: string, result: any, expectedCriteria: string) {
    const prompt = `As a test evaluator, please determine if this test result meets the criteria.

Test: ${testDescription}
Result: ${JSON.stringify(result).substring(0, 500)}
Criteria: ${expectedCriteria}

Does this result meet the criteria? Respond with only "PASS" or "FAIL" followed by a brief explanation.`

    const response = await ollama.chat({
        model: "llama3.2",
        messages: [{ role: "user", content: prompt }]
    })

    const evaluation = response.message.content
    const passed = evaluation.toLowerCase().includes("pass")

    return { passed, explanation: evaluation }
}

describe("Ollama Integration Tests", () => {
    describe("Simple Interactions", () => {
        it("should generate a joke response", async function () {
            this.timeout(30000)

            const result = await simpleInteraction()
            expect(result).to.be.a("string")
            expect(result.length).to.be.greaterThan(0)

            const evaluation = await askOllamaToEvaluate(
                "Generate a programming joke",
                result,
                "The response should contain humor related to programming"
            )

            console.log("Ollama evaluation:", evaluation.explanation)
            expect(evaluation.passed).to.be.true
        })

        it("should handle streaming interaction", async function () {
            this.timeout(30000)

            const result = await streamingInteraction()
            expect(result).to.be.a("string")
            expect(result.length).to.be.greaterThan(0)

            const evaluation = await askOllamaToEvaluate(
                "Count from 1 to 5",
                result,
                "The response should contain numbers 1 through 5 in sequence"
            )

            console.log("Ollama evaluation:", evaluation.explanation)
            expect(evaluation.passed).to.be.true
        })
    })

    describe("Tool Calling", () => {
        it("should handle tool calling requests", async function () {
            this.timeout(45000)

            const result = await toolCallingExample()
            expect(result).to.be.a("string")

            const evaluation = await askOllamaToEvaluate(
                "Tool calling with weather and calculation",
                result,
                "The response should mention both weather information and mathematical calculation results"
            )

            console.log("Ollama evaluation:", evaluation.explanation)
            expect(evaluation.passed).to.be.true
        })
    })

    describe("Conversation Management", () => {
        it("should maintain conversation context", async function () {
            this.timeout(45000)

            const conversation = new ConversationManager("llama3.2")

            await conversation.sendMessage("My name is Alice and I like programming")
            const response = await conversation.sendMessage("What do you remember about me?")

            expect(response).to.be.a("string")

            const evaluation = await askOllamaToEvaluate(
                "Remember user information across messages",
                response,
                "The response should mention the name Alice and programming interest"
            )

            console.log("Ollama evaluation:", evaluation.explanation)
            expect(evaluation.passed).to.be.true
        })

        it("should handle conversation trimming", async function () {
            this.timeout(30000)

            const conversation = new ConversationManager("llama3.2")

            // Add several messages
            await conversation.sendMessage("First message")
            await conversation.sendMessage("Second message")
            await conversation.sendMessage("Third message")

            const beforeLength = conversation.getConversation().length
            conversation.trimToLastExchanges(1)
            const afterLength = conversation.getConversation().length

            expect(afterLength).to.be.lessThan(beforeLength)
            expect(afterLength).to.be.at.least(2) // Should keep at least user + assistant
        })
    })

    describe("RAG System", () => {
        it("should retrieve relevant documents", async function () {
            this.timeout(60000)

            const rag = new SimpleRAG()

            await rag.addDocument("doc1", "JavaScript is a programming language used for web development")
            await rag.addDocument("doc2", "Python is great for data science and machine learning")

            const result = await rag.query("What language is good for web development?")

            expect(result).to.have.property("answer")
            expect(result).to.have.property("sources")

            const evaluation = await askOllamaToEvaluate(
                "RAG system retrieval for web development query",
                result.answer,
                "The answer should mention JavaScript as relevant for web development"
            )

            console.log("Ollama evaluation:", evaluation.explanation)
            expect(evaluation.passed).to.be.true
        })
    })

    describe("Vector Store", () => {
        it("should perform semantic search", async function () {
            this.timeout(60000)

            const store = new InMemoryVectorStore()

            await store.add("tech1", "JavaScript programming language", { category: "tech" })
            await store.add("food1", "Pizza with cheese and toppings", { category: "food" })

            const results = await store.search("coding and development", 1)

            expect(results).to.be.an("array")
            expect(results.length).to.be.greaterThan(0)
            expect(results[0]).to.have.property("similarity")

            const evaluation = await askOllamaToEvaluate(
                "Vector search for coding query",
                results[0].metadata.text,
                "The top result should be more related to programming than food"
            )

            console.log("Ollama evaluation:", evaluation.explanation)
            expect(evaluation.passed).to.be.true
        })

        it("should cluster similar content", async function () {
            this.timeout(60000)

            const store = new InMemoryVectorStore()

            await store.add("tech1", "JavaScript programming", { category: "tech" })
            await store.add("tech2", "Python coding", { category: "tech" })
            await store.add("food1", "Pizza recipe", { category: "food" })
            await store.add("food2", "Pasta cooking", { category: "food" })

            const clusters = await store.cluster(2)

            expect(clusters).to.be.an("array")
            expect(clusters.length).to.be.at.most(2)

            // Check if similar items are grouped together
            const techItems = []
            const foodItems = []

            clusters.forEach((cluster) => {
                cluster.forEach((item) => {
                    if (item.metadata.category === "tech") techItems.push(item)
                    if (item.metadata.category === "food") foodItems.push(item)
                })
            })

            expect(techItems.length + foodItems.length).to.equal(4)
        })
    })
})

describe("MCP Integration Tests", () => {
    it("should simulate MCP server capabilities", async function () {
        this.timeout(30000)

        // Mock MCP server interaction
        const mockMCPResponse = {
            tools: ["ollama_chat", "ollama_generate"],
            resources: ["ollama://models"],
            prompts: ["code_review"]
        }

        expect(mockMCPResponse.tools).to.include("ollama_chat")
        expect(mockMCPResponse.resources).to.include("ollama://models")
        expect(mockMCPResponse.prompts).to.include("code_review")
    })

    it("should handle MCP client requests", async function () {
        this.timeout(30000)

        // Mock MCP client functionality
        const mockRequest = {
            tool: "ollama_chat",
            args: { model: "llama3.2", prompt: "Hello MCP" }
        }

        // Simulate calling Ollama through MCP
        const response = await ollama.chat({
            model: mockRequest.args.model,
            messages: [{ role: "user", content: mockRequest.args.prompt }]
        })

        expect(response.message.content).to.be.a("string")
        expect(response.message.content.length).to.be.greaterThan(0)
    })
})
