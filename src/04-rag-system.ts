import { Ollama } from "ollama"
import { ChromaApi, OpenAIEmbeddingFunction } from "chromadb"

const ollama = new Ollama({ host: "http://localhost:11434" })

// Simple embedding function using Ollama
class OllamaEmbeddingFunction {
    async generate(texts: string[]) {
        const embeddings = []
        for (const text of texts) {
            const response = await ollama.embeddings({
                model: "nomic-embed-text",
                prompt: text
            })
            embeddings.push(response.embedding)
        }
        return embeddings
    }
}

export class SimpleRAG {
    private documents: { id: string; content: string; metadata?: any }[] = []
    private embeddings: number[][] = []
    private embeddingFunction: OllamaEmbeddingFunction

    constructor() {
        this.embeddingFunction = new OllamaEmbeddingFunction()
    }

    async addDocument(id: string, content: string, metadata?: any) {
        this.documents.push({ id, content, metadata })

        // Generate embedding for the document
        const [embedding] = await this.embeddingFunction.generate([content])
        this.embeddings.push(embedding)
    }

    async addDocuments(docs: { id: string; content: string; metadata?: any }[]) {
        for (const doc of docs) {
            await this.addDocument(doc.id, doc.content, doc.metadata)
        }
    }

    // Simple cosine similarity
    private cosineSimilarity(a: number[], b: number[]) {
        const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0)
        const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0))
        const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0))
        return dotProduct / (magnitudeA * magnitudeB)
    }

    async search(query: string, topK = 3) {
        const [queryEmbedding] = await this.embeddingFunction.generate([query])

        const similarities = this.embeddings.map((embedding, index) => ({
            index,
            similarity: this.cosineSimilarity(queryEmbedding, embedding),
            document: this.documents[index]
        }))

        return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, topK)
    }

    async query(question: string, topK = 3) {
        const relevantDocs = await this.search(question, topK)

        const context = relevantDocs.map((doc) => doc.document.content).join("\n\n")

        const prompt = `Answer the following question based on the provided context. If the answer is not in the context, say so.

Context:
${context}

Question: ${question}

Answer:`

        const response = await ollama.chat({
            model: "llama3.2",
            messages: [{ role: "user", content: prompt }]
        })

        return {
            answer: response.message.content,
            sources: relevantDocs.map((doc) => ({ id: doc.document.id, similarity: doc.similarity }))
        }
    }
}

export async function ragExample() {
    console.log("=== RAG System Example ===")

    const rag = new SimpleRAG()

    // Add some sample documents
    const sampleDocs = [
        {
            id: "doc1",
            content:
                "Machine learning is a subset of artificial intelligence that focuses on algorithms that can learn from data without being explicitly programmed.",
            metadata: { topic: "AI" }
        },
        {
            id: "doc2",
            content:
                "Neural networks are computing systems inspired by biological neural networks. They consist of interconnected nodes called neurons.",
            metadata: { topic: "AI" }
        },
        {
            id: "doc3",
            content:
                "The transformer architecture revolutionized natural language processing with its attention mechanism, allowing models to process sequences in parallel.",
            metadata: { topic: "AI" }
        },
        {
            id: "doc4",
            content:
                "Cooking pasta requires boiling water, adding salt, cooking the pasta until al dente, and serving with your favorite sauce.",
            metadata: { topic: "cooking" }
        },
        {
            id: "doc5",
            content:
                "JavaScript is a programming language commonly used for web development, both on the client-side and server-side with Node.js.",
            metadata: { topic: "programming" }
        }
    ]

    console.log("Adding documents to RAG system...")
    await rag.addDocuments(sampleDocs)

    // Test queries
    const queries = [
        "What is machine learning?",
        "How do neural networks work?",
        "How to cook pasta?",
        "What is JavaScript used for?",
        "What is quantum computing?" // This should not have good matches
    ]

    for (const query of queries) {
        console.log(`\n--- Query: ${query} ---`)
        const result = await rag.query(query)
        console.log("Answer:", result.answer)
        console.log(
            "Sources:",
            result.sources.map((s) => `${s.id} (${s.similarity.toFixed(3)})`)
        )
    }

    return rag
}

if (import.meta.url === `file://${process.argv[1]}`) {
    await ragExample()
}
