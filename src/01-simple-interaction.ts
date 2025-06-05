import { Ollama } from "ollama"

const ollama = new Ollama({ host: "http://localhost:11434" })

export async function simpleInteraction() {
    console.log("=== Simple Ollama Interaction ===")

    const response = await ollama.chat({
        model: "llama3.2",
        messages: [{ role: "user", content: "Tell me a short joke about programming" }]
    })

    console.log("Response:", response.message.content)
    return response.message.content
}

export async function streamingInteraction() {
    console.log("=== Streaming Interaction ===")

    const stream = await ollama.chat({
        model: "llama3.2",
        messages: [{ role: "user", content: "Count from 1 to 5 slowly" }],
        stream: true
    })

    let fullResponse = ""
    for await (const chunk of stream) {
        process.stdout.write(chunk.message.content)
        fullResponse += chunk.message.content
    }

    console.log("\n--- End of stream ---")
    return fullResponse
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    await simpleInteraction()
    await streamingInteraction()
}
