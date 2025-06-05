import { expect } from "chai"
import { Ollama } from "ollama"
import { SimpleRAG } from "../src/04-rag-system.js"
import { InMemoryVectorStore } from "../src/05-vector-stores.js"

const ollama = new Ollama({ host: "http://localhost:11434" })

describe("⚡ Performance Tests", function () {
    this.timeout(300000) // 5 minutes for performance tests

    it("should measure basic chat response time", async function () {
        const start = Date.now()

        const response = await ollama.chat({
            model: "llama3.2",
            messages: [{ role: "user", content: "Say hello in exactly 3 words" }]
        })

        const duration = Date.now() - start

        expect(response.message.content).to.be.a("string")
        expect(duration).to.be.lessThan(30000) // Should respond within 30 seconds

        console.log(`   ⏱️  Response time: ${duration}ms`)
        console.log(`   📝 Response: ${response.message.content}`)
    })

    it("should measure embedding generation speed", async function () {
        const testTexts = [
            "Machine learning is transforming technology",
            "Natural language processing enables computers to understand text",
            "Deep learning uses neural networks with many layers",
            "Artificial intelligence mimics human cognitive functions",
            "Computer vision allows machines to interpret visual information"
        ]

        const start = Date.now()

        const embeddings = []
        for (const text of testTexts) {
            const response = await ollama.embeddings({
                model: "nomic-embed-text",
                prompt: text
            })
            embeddings.push(response.embedding)
        }

        const duration = Date.now() - start
        const avgTime = duration / testTexts.length

        expect(embeddings.length).to.equal(testTexts.length)
        expect(embeddings.every((e) => e.length > 0)).to.be.true

        console.log(`   ⏱️  Total time: ${duration}ms`)
        console.log(`   📊 Average per embedding: ${avgTime.toFixed(1)}ms`)
        console.log(`   📏 Embedding dimensions: ${embeddings[0].length}`)
    })

    it("should measure RAG system performance at scale", async function () {
        const rag = new SimpleRAG()

        // Add many documents
        console.log("   📚 Adding documents...")
        const docStart = Date.now()

        const documents = []
        for (let i = 0; i < 20; i++) {
            documents.push({
                id: `doc-${i}`,
                content: `Document ${i}: This contains information about topic ${i % 5}. ${
                    i % 2 === 0 ? "Programming" : "Science"
                } related content with details about ${
                    ["JavaScript", "Python", "Physics", "Chemistry", "Biology"][i % 5]
                }.`,
                metadata: { category: i % 2 === 0 ? "tech" : "science" }
            })
        }

        await rag.addDocuments(documents)
        const docDuration = Date.now() - docStart

        // Test query performance
        console.log("   🔍 Testing queries...")
        const queryStart = Date.now()

        const queries = [
            "Tell me about programming languages",
            "What scientific topics are covered?",
            "Information about JavaScript",
            "Physics and chemistry details"
        ]

        const queryResults = []
        for (const query of queries) {
            const result = await rag.query(query)
            queryResults.push(result)
        }

        const queryDuration = Date.now() - queryStart

        expect(queryResults.length).to.equal(queries.length)
        expect(queryResults.every((r) => r.answer && r.sources)).to.be.true

        console.log(`   ⏱️  Document indexing: ${docDuration}ms (${documents.length} docs)`)
        console.log(`   ⏱️  Query processing: ${queryDuration}ms (${queries.length} queries)`)
        console.log(`   📊 Average query time: ${(queryDuration / queries.length).toFixed(1)}ms`)
    })

    it("should measure vector store operations", async function () {
        const store = new InMemoryVectorStore()

        // Measure addition performance
        console.log("   ➕ Adding vectors...")
        const addStart = Date.now()

        const items = []
        for (let i = 0; i < 50; i++) {
            items.push({
                id: `item-${i}`,
                text: `This is test item ${i} about ${
                    ["technology", "science", "art", "music", "sports"][i % 5]
                } with additional content to make it more realistic.`
            })
        }

        for (const item of items) {
            await store.add(item.id, item.text, { index: items.indexOf(item) })
        }

        const addDuration = Date.now() - addStart

        // Measure search performance
        console.log("   🔍 Testing search...")
        const searchStart = Date.now()

        const searchQueries = [
            "technology and innovation",
            "scientific research",
            "artistic expression",
            "musical instruments",
            "competitive sports"
        ]

        const searchResults = []
        for (const query of searchQueries) {
            const results = await store.search(query, 5)
            searchResults.push(results)
        }

        const searchDuration = Date.now() - searchStart

        // Measure clustering performance
        console.log("   🧮 Testing clustering...")
        const clusterStart = Date.now()

        const clusters = await store.cluster(5)

        const clusterDuration = Date.now() - clusterStart

        expect(searchResults.length).to.equal(searchQueries.length)
        expect(clusters.length).to.be.at.most(5)

        const stats = store.getStats()

        console.log(`   ⏱️  Vector addition: ${addDuration}ms (${items.length} items)`)
        console.log(`   ⏱️  Search operations: ${searchDuration}ms (${searchQueries.length} queries)`)
        console.log(`   ⏱️  Clustering: ${clusterDuration}ms`)
        console.log(`   📊 Store stats: ${stats.totalVectors} vectors, ${stats.dimensions} dimensions`)
        console.log(`   💾 Memory usage: ${(stats.memoryUsage / 1024 / 1024).toFixed(2)} MB`)
    })

    it("should measure concurrent operation performance", async function () {
        console.log("   🔄 Testing concurrent operations...")

        const start = Date.now()

        const operations = [
            // Chat operations
            ollama.chat({
                model: "llama3.2",
                messages: [{ role: "user", content: "Count to 3" }]
            }),
            ollama.chat({
                model: "llama3.2",
                messages: [{ role: "user", content: "Say hello" }]
            }),
            // Embedding operations
            ollama.embeddings({
                model: "nomic-embed-text",
                prompt: "concurrent test 1"
            }),
            ollama.embeddings({
                model: "nomic-embed-text",
                prompt: "concurrent test 2"
            }),
            // Generation operations
            ollama.generate({
                model: "llama3.2",
                prompt: "Name a color",
                options: { num_predict: 5 }
            })
        ]

        const results = await Promise.all(operations)
        const duration = Date.now() - start

        expect(results.length).to.equal(operations.length)

        console.log(`   ⏱️  Concurrent operations: ${duration}ms (${operations.length} ops)`)
        console.log(`   📊 Average per operation: ${(duration / operations.length).toFixed(1)}ms`)
    })

    it("should stress test with rapid requests", async function () {
        console.log("   💪 Stress testing...")

        const rapidRequests = []
        const requestCount = 10

        const start = Date.now()

        for (let i = 0; i < requestCount; i++) {
            rapidRequests.push(
                ollama.generate({
                    model: "llama3.2",
                    prompt: `Quick response ${i}`,
                    options: { num_predict: 3 }
                })
            )
        }

        const results = await Promise.allSettled(rapidRequests)
        const duration = Date.now() - start

        const successful = results.filter((r) => r.status === "fulfilled").length
        const failed = results.filter((r) => r.status === "rejected").length

        expect(successful).to.be.greaterThan(0)

        console.log(`   ⏱️  Stress test: ${duration}ms`)
        console.log(`   ✅ Successful: ${successful}/${requestCount}`)
        console.log(`   ❌ Failed: ${failed}/${requestCount}`)
        console.log(`   📊 Success rate: ${((successful / requestCount) * 100).toFixed(1)}%`)
    })
})
