import { Ollama } from "ollama"

const ollama = new Ollama({ host: "http://localhost:11434" })

// In-memory vector store for offline use
export class InMemoryVectorStore {
    private vectors: { id: string; vector: number[]; metadata: any }[] = []

    async add(id: string, text: string, metadata: any = {}) {
        const response = await ollama.embeddings({
            model: "nomic-embed-text",
            prompt: text
        })

        this.vectors.push({
            id,
            vector: response.embedding,
            metadata: { ...metadata, text }
        })
    }

    async search(query: string, topK = 5) {
        const queryResponse = await ollama.embeddings({
            model: "nomic-embed-text",
            prompt: query
        })

        const queryVector = queryResponse.embedding

        const similarities = this.vectors.map((item) => {
            const similarity = this.cosineSimilarity(queryVector, item.vector)
            return { ...item, similarity }
        })

        return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, topK)
    }

    private cosineSimilarity(a: number[], b: number[]) {
        const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0)
        const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0))
        const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0))
        return dotProduct / (magnitudeA * magnitudeB)
    }

    async cluster(numClusters = 3) {
        // Simple k-means clustering
        if (this.vectors.length < numClusters) {
            return [this.vectors]
        }

        // Initialize centroids randomly
        const centroids = []
        for (let i = 0; i < numClusters; i++) {
            const randomIndex = Math.floor(Math.random() * this.vectors.length)
            centroids.push([...this.vectors[randomIndex].vector])
        }

        let clusters: (typeof this.vectors)[][] = []
        let iterations = 0
        const maxIterations = 100

        while (iterations < maxIterations) {
            // Assign points to clusters
            clusters = Array(numClusters)
                .fill(null)
                .map(() => [])

            for (const vector of this.vectors) {
                let bestCluster = 0
                let bestSimilarity = -1

                for (let i = 0; i < centroids.length; i++) {
                    const similarity = this.cosineSimilarity(vector.vector, centroids[i])
                    if (similarity > bestSimilarity) {
                        bestSimilarity = similarity
                        bestCluster = i
                    }
                }

                clusters[bestCluster].push(vector)
            }

            // Update centroids
            let changed = false
            for (let i = 0; i < centroids.length; i++) {
                if (clusters[i].length === 0) continue

                const newCentroid = Array(centroids[i].length).fill(0)
                for (const vector of clusters[i]) {
                    for (let j = 0; j < vector.vector.length; j++) {
                        newCentroid[j] += vector.vector[j]
                    }
                }

                for (let j = 0; j < newCentroid.length; j++) {
                    newCentroid[j] /= clusters[i].length
                }

                // Check if centroid changed significantly
                const change = this.cosineSimilarity(centroids[i], newCentroid)
                if (change < 0.99) {
                    changed = true
                }

                centroids[i] = newCentroid
            }

            if (!changed) break
            iterations++
        }

        return clusters.filter((cluster) => cluster.length > 0)
    }

    getStats() {
        return {
            totalVectors: this.vectors.length,
            dimensions: this.vectors[0]?.vector.length || 0,
            memoryUsage: JSON.stringify(this.vectors).length
        }
    }
}

export async function vectorStoreExample() {
    console.log("=== Vector Store Examples ===")

    const store = new InMemoryVectorStore()

    // Add various types of content
    const content = [
        { id: "tech1", text: "JavaScript is a versatile programming language", category: "technology" },
        { id: "tech2", text: "Python is great for data science and machine learning", category: "technology" },
        { id: "tech3", text: "React is a popular frontend framework", category: "technology" },
        { id: "food1", text: "Pizza is a delicious Italian dish with cheese and toppings", category: "food" },
        { id: "food2", text: "Sushi is a Japanese cuisine featuring raw fish and rice", category: "food" },
        { id: "food3", text: "Tacos are Mexican food with meat and vegetables in tortillas", category: "food" },
        { id: "nature1", text: "Mountains are tall landforms with peaks and valleys", category: "nature" },
        { id: "nature2", text: "Oceans are large bodies of salt water covering Earth", category: "nature" },
        { id: "nature3", text: "Forests contain many trees and diverse wildlife", category: "nature" }
    ]

    console.log("Adding content to vector store...")
    for (const item of content) {
        await store.add(item.id, item.text, { category: item.category })
    }

    console.log("Store stats:", store.getStats())

    // Test semantic search
    const queries = [
        "programming languages for web development",
        "delicious international cuisine",
        "natural landscapes and environments"
    ]

    for (const query of queries) {
        console.log(`\n--- Search: "${query}" ---`)
        const results = await store.search(query, 3)
        results.forEach((result, i) => {
            console.log(
                `${i + 1}. ${result.metadata.text} (${result.similarity.toFixed(3)}) [${result.metadata.category}]`
            )
        })
    }

    // Test clustering
    console.log("\n--- Clustering Results ---")
    const clusters = await store.cluster(3)
    clusters.forEach((cluster, i) => {
        console.log(`Cluster ${i + 1}:`)
        cluster.forEach((item) => {
            console.log(`  - ${item.metadata.text} [${item.metadata.category}]`)
        })
        console.log()
    })

    return store
}

if (import.meta.url === `file://${process.argv[1]}`) {
    await vectorStoreExample()
}
