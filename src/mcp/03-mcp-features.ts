import { Ollama } from "ollama"

const ollama = new Ollama({ host: "http://localhost:11434" })

// MCP Sampling - Advanced prompting with structured outputs
export class MCPSampling {
    async structuredGeneration(prompt: string, schema: any) {
        const structuredPrompt = `${prompt}

Please respond in the following JSON format:
${JSON.stringify(schema, null, 2)}

Ensure your response is valid JSON that matches this schema exactly.`

        const response = await ollama.chat({
            model: "llama3.2",
            messages: [{ role: "user", content: structuredPrompt }]
        })

        try {
            return JSON.parse(response.message.content)
        } catch (error) {
            // Fallback if JSON parsing fails
            return { content: response.message.content, error: "Failed to parse as JSON" }
        }
    }

    async generateWithTemperature(prompt: string, temperature: number) {
        const response = await ollama.generate({
            model: "llama3.2",
            prompt,
            options: {
                temperature
            }
        })

        return response.response
    }

    async multiModalPrompt(textPrompt: string, imageDescription: string) {
        // Simulate multimodal by combining text and image description
        const combinedPrompt = `Text Input: ${textPrompt}
Image Description: ${imageDescription}

Based on both the text input and image description, provide a comprehensive response:`

        const response = await ollama.chat({
            model: "llama3.2",
            messages: [{ role: "user", content: combinedPrompt }]
        })

        return response.message.content
    }
}

// MCP Progress Tracking
export class MCPProgressTracker {
    private tasks: Map<string, { status: string; progress: number; result?: any }> = new Map()

    async startTask(taskId: string, description: string) {
        this.tasks.set(taskId, { status: "started", progress: 0 })
        console.log(`Task ${taskId} started: ${description}`)
    }

    updateProgress(taskId: string, progress: number, status?: string) {
        const task = this.tasks.get(taskId)
        if (task) {
            task.progress = progress
            if (status) task.status = status
            console.log(`Task ${taskId}: ${task.status} (${progress}%)`)
        }
    }

    async completeTask(taskId: string, result: any) {
        const task = this.tasks.get(taskId)
        if (task) {
            task.status = "completed"
            task.progress = 100
            task.result = result
            console.log(`Task ${taskId} completed`)
        }
    }

    getTaskStatus(taskId: string) {
        return this.tasks.get(taskId)
    }

    async longRunningOllamaTask(taskId: string, prompts: string[]) {
        await this.startTask(taskId, `Processing ${prompts.length} prompts`)

        const results = []
        for (let i = 0; i < prompts.length; i++) {
            this.updateProgress(taskId, Math.round((i / prompts.length) * 100), "processing")

            const response = await ollama.chat({
                model: "llama3.2",
                messages: [{ role: "user", content: prompts[i] }]
            })

            results.push(response.message.content)
        }

        await this.completeTask(taskId, results)
        return results
    }
}

// MCP Resource Management
export class MCPResourceManager {
    private resources: Map<string, any> = new Map()
    private accessLog: { resource: string; timestamp: Date; action: string }[] = []

    registerResource(name: string, resource: any, metadata?: any) {
        this.resources.set(name, { data: resource, metadata, created: new Date() })
        this.logAccess(name, "registered")
    }

    getResource(name: string) {
        const resource = this.resources.get(name)
        if (resource) {
            this.logAccess(name, "accessed")
        }
        return resource
    }

    private logAccess(resource: string, action: string) {
        this.accessLog.push({ resource, timestamp: new Date(), action })
    }

    getAccessLog() {
        return this.accessLog
    }

    async processWithOllama(resourceName: string, instruction: string) {
        const resource = this.getResource(resourceName)
        if (!resource) {
            throw new Error(`Resource ${resourceName} not found`)
        }

        const prompt = `${instruction}

Resource Data:
${JSON.stringify(resource.data, null, 2)}`

        const response = await ollama.chat({
            model: "llama3.2",
            messages: [{ role: "user", content: prompt }]
        })

        this.logAccess(resourceName, "processed")
        return response.message.content
    }
}

export async function mcpFeaturesExample() {
    console.log("=== MCP Advanced Features Example ===")

    // Structured Generation
    console.log("\n--- Structured Generation ---")
    const sampler = new MCPSampling()

    const personSchema = {
        name: "string",
        age: "number",
        occupation: "string",
        skills: ["array of strings"]
    }

    const structuredResult = await sampler.structuredGeneration(
        "Create a profile for a software engineer",
        personSchema
    )
    console.log("Structured Result:", JSON.stringify(structuredResult, null, 2))

    // Temperature variation
    console.log("\n--- Temperature Variation ---")
    const lowTemp = await sampler.generateWithTemperature("Write a haiku about coding", 0.1)
    const highTemp = await sampler.generateWithTemperature("Write a haiku about coding", 0.9)

    console.log("Low Temperature (0.1):", lowTemp)
    console.log("High Temperature (0.9):", highTemp)

    // Multimodal simulation
    console.log("\n--- Multimodal Simulation ---")
    const multiModalResult = await sampler.multiModalPrompt(
        "Analyze this scene",
        "A sunset over mountains with a lake in the foreground"
    )
    console.log("Multimodal Result:", multiModalResult)

    // Progress Tracking
    console.log("\n--- Progress Tracking ---")
    const tracker = new MCPProgressTracker()

    const prompts = ["What is JavaScript?", "Explain async/await", "What are closures?", "How does event loop work?"]

    const results = await tracker.longRunningOllamaTask("learning-js", prompts)
    console.log("Task completed with", results.length, "results")

    // Resource Management
    console.log("\n--- Resource Management ---")
    const resourceManager = new MCPResourceManager()

    resourceManager.registerResource("user-data", {
        users: [
            { id: 1, name: "Alice", role: "developer" },
            { id: 2, name: "Bob", role: "designer" },
            { id: 3, name: "Charlie", role: "manager" }
        ]
    })

    const analysis = await resourceManager.processWithOllama(
        "user-data",
        "Analyze the team composition and suggest improvements"
    )
    console.log("Resource Analysis:", analysis)

    console.log("\nAccess Log:", resourceManager.getAccessLog())

    return { sampler, tracker, resourceManager }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    await mcpFeaturesExample()
}
