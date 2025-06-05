import { Ollama } from "ollama"

const ollama = new Ollama({ host: "http://localhost:11434" })

interface ConversationMessage {
    role: "user" | "assistant" | "system"
    content: string
    timestamp?: Date
    metadata?: any
}

export class ConversationManager {
    private messages: ConversationMessage[] = []
    private model: string

    constructor(model = "llama3.2", systemPrompt?: string) {
        this.model = model
        if (systemPrompt) {
            this.addMessage("system", systemPrompt)
        }
    }

    addMessage(role: ConversationMessage["role"], content: string, metadata?: any) {
        this.messages.push({
            role,
            content,
            timestamp: new Date(),
            metadata
        })
    }

    // Rearrange conversation by priority/relevance
    rearrangeByKeywords(keywords: string[]) {
        const keywordMessages = this.messages.filter((msg) =>
            keywords.some((keyword) => msg.content.toLowerCase().includes(keyword.toLowerCase()))
        )

        const otherMessages = this.messages.filter(
            (msg) => !keywords.some((keyword) => msg.content.toLowerCase().includes(keyword.toLowerCase()))
        )

        // Keep system messages at the start, then prioritized messages, then others
        const systemMessages = this.messages.filter((msg) => msg.role === "system")
        this.messages = [...systemMessages, ...keywordMessages, ...otherMessages]
    }

    // Keep only last N exchanges
    trimToLastExchanges(count: number) {
        const systemMessages = this.messages.filter((msg) => msg.role === "system")
        const nonSystemMessages = this.messages.filter((msg) => msg.role !== "system")

        // Keep last count*2 messages (user + assistant pairs)
        const trimmed = nonSystemMessages.slice(-count * 2)
        this.messages = [...systemMessages, ...trimmed]
    }

    // Summarize old messages
    async summarizeHistory(keepLast = 4) {
        if (this.messages.length <= keepLast + 2) return // +2 for system messages

        const systemMessages = this.messages.filter((msg) => msg.role === "system")
        const recentMessages = this.messages.slice(-keepLast)
        const oldMessages = this.messages.slice(systemMessages.length, -keepLast)

        if (oldMessages.length === 0) return

        const summaryPrompt = `Summarize this conversation history in 2-3 sentences:
${oldMessages.map((msg) => `${msg.role}: ${msg.content}`).join("\n")}`

        const summary = await ollama.chat({
            model: this.model,
            messages: [{ role: "user", content: summaryPrompt }]
        })

        this.messages = [
            ...systemMessages,
            {
                role: "system",
                content: `Previous conversation summary: ${summary.message.content}`,
                timestamp: new Date()
            },
            ...recentMessages
        ]
    }

    async sendMessage(userMessage: string) {
        this.addMessage("user", userMessage)

        const response = await ollama.chat({
            model: this.model,
            messages: this.messages.map((msg) => ({ role: msg.role, content: msg.content }))
        })

        this.addMessage("assistant", response.message.content)
        return response.message.content
    }

    getConversation() {
        return this.messages
    }

    exportConversation() {
        return JSON.stringify(this.messages, null, 2)
    }

    importConversation(jsonString: string) {
        this.messages = JSON.parse(jsonString)
    }
}

export async function conversationFlowExample() {
    console.log("=== Conversation Flow Management ===")

    const conversation = new ConversationManager("llama3.2", "You are a helpful assistant that remembers context well.")

    // Have a conversation
    await conversation.sendMessage("Hi, I'm learning about AI and machine learning.")
    await conversation.sendMessage("Can you explain neural networks?")
    await conversation.sendMessage("What about transformers?")
    await conversation.sendMessage("I'm also interested in cooking. What's a good pasta recipe?")
    await conversation.sendMessage("Back to AI - what is attention mechanism?")

    console.log("Original conversation length:", conversation.getConversation().length)

    // Demonstrate rearrangement by keywords
    console.log("\n--- Rearranging by AI keywords ---")
    conversation.rearrangeByKeywords(["AI", "neural", "transformer", "attention"])

    // Continue conversation
    const response = await conversation.sendMessage("Can you summarize what we discussed about AI?")
    console.log("AI Summary Response:", response)

    // Demonstrate trimming
    console.log("\n--- Trimming to last 3 exchanges ---")
    conversation.trimToLastExchanges(3)
    console.log("Conversation length after trimming:", conversation.getConversation().length)

    // Demonstrate summarization
    console.log("\n--- Testing summarization ---")
    const newConv = new ConversationManager("llama3.2")
    await newConv.sendMessage("Tell me about cats")
    await newConv.sendMessage("What about dogs?")
    await newConv.sendMessage("Compare cats and dogs")
    await newConv.sendMessage("Which is better for apartments?")
    await newConv.sendMessage("What about fish?")

    await newConv.summarizeHistory(2)
    console.log("Conversation after summarization:", newConv.getConversation().length)

    return conversation.exportConversation()
}

if (import.meta.url === `file://${process.argv[1]}`) {
    await conversationFlowExample()
}
