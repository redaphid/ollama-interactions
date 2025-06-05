import { Ollama } from "ollama"

const ollama = new Ollama({ host: "http://localhost:11434" })

// Chain of Thought Prompting
export async function chainOfThoughtExample() {
    console.log("=== Chain of Thought Prompting ===")

    const problem =
        "A store sells apples for $0.50 each and oranges for $0.75 each. If someone buys 8 apples and 6 oranges, how much do they spend in total?"

    const cotPrompt = `${problem}

Let me solve this step by step:
1) First, I'll calculate the cost of apples
2) Then, I'll calculate the cost of oranges
3) Finally, I'll add them together

Step 1:`

    const response = await ollama.chat({
        model: "llama3.2",
        messages: [{ role: "user", content: cotPrompt }]
    })

    console.log("Chain of Thought Response:", response.message.content)
    return response.message.content
}

// Few-Shot Learning
export async function fewShotLearningExample() {
    console.log("=== Few-Shot Learning ===")

    const fewShotPrompt = `Here are some examples of converting informal text to formal business language:

Informal: "Hey, can you get back to me ASAP about that thing we talked about?"
Formal: "Could you please provide an update on our previous discussion at your earliest convenience?"

Informal: "The meeting was a total disaster and nothing got done."
Formal: "The meeting did not achieve the intended objectives and requires follow-up action."

Informal: "This project is way behind schedule and we're kinda screwed."
Formal: "This project is experiencing significant delays and requires immediate attention to meet deadlines."

Now convert this informal text to formal business language:
Informal: "Can you fix this bug? It's driving everyone crazy and customers are super mad."
Formal:`

    const response = await ollama.chat({
        model: "llama3.2",
        messages: [{ role: "user", content: fewShotPrompt }]
    })

    console.log("Few-Shot Learning Response:", response.message.content)
    return response.message.content
}

// Self-Consistency Decoding
export async function selfConsistencyDecoding(question: string, numAttempts = 3) {
    console.log("=== Self-Consistency Decoding ===")

    const attempts = []

    for (let i = 0; i < numAttempts; i++) {
        const response = await ollama.generate({
            model: "llama3.2",
            prompt: question,
            options: {
                temperature: 0.8 // Higher temperature for diversity
            }
        })
        attempts.push(response.response)
        console.log(`Attempt ${i + 1}:`, response.response.substring(0, 100) + "...")
    }

    // Now ask the model to find the most consistent answer
    const consistencyPrompt = `I asked the same question multiple times and got these different answers:

${attempts.map((answer, i) => `Answer ${i + 1}: ${answer}`).join("\n\n")}

Which answer is most likely to be correct? Provide the best answer and explain why.`

    const finalResponse = await ollama.chat({
        model: "llama3.2",
        messages: [{ role: "user", content: consistencyPrompt }]
    })

    console.log("Final Consistent Answer:", finalResponse.message.content)
    return { attempts, finalAnswer: finalResponse.message.content }
}

// Tree of Thoughts
export class TreeOfThoughts {
    async solve(problem: string, depth = 2) {
        console.log("=== Tree of Thoughts ===")
        console.log("Problem:", problem)

        return await this.exploreThoughts(problem, depth, 0, [])
    }

    private async exploreThoughts(problem: string, maxDepth: number, currentDepth: number, path: string[]) {
        if (currentDepth >= maxDepth) {
            // Evaluate this path
            const pathDescription = path.join(" → ")
            const evaluation = await this.evaluatePath(problem, pathDescription)
            return { path, evaluation, depth: currentDepth }
        }

        // Generate possible next thoughts
        const thoughts = await this.generateThoughts(problem, path)
        const results = []

        for (const thought of thoughts) {
            const newPath = [...path, thought]
            const result = await this.exploreThoughts(problem, maxDepth, currentDepth + 1, newPath)
            results.push(result)
        }

        return results
    }

    private async generateThoughts(problem: string, currentPath: string[]) {
        const context = currentPath.length > 0 ? `Current thinking: ${currentPath.join(" → ")}` : ""

        const prompt = `Problem: ${problem}
${context}

Generate 2-3 different approaches or next steps to solve this problem. Each should be a single clear sentence.
Format as:
1. [approach 1]
2. [approach 2]
3. [approach 3]`

        const response = await ollama.chat({
            model: "llama3.2",
            messages: [{ role: "user", content: prompt }]
        })

        // Parse the numbered responses
        const thoughts = response.message.content
            .split("\n")
            .filter((line) => /^\d+\./.test(line))
            .map((line) => line.replace(/^\d+\.\s*/, ""))
            .slice(0, 3)

        return thoughts
    }

    private async evaluatePath(problem: string, path: string) {
        const prompt = `Problem: ${problem}
Approach taken: ${path}

Rate this approach on a scale of 1-10 for likely success in solving the problem. Provide the rating and a brief explanation.`

        const response = await ollama.chat({
            model: "llama3.2",
            messages: [{ role: "user", content: prompt }]
        })

        return response.message.content
    }
}

// Prompt Chaining
export class PromptChain {
    private steps: Array<{ name: string; prompt: string; transform?: (input: string) => string }> = []

    addStep(name: string, prompt: string, transform?: (input: string) => string) {
        this.steps.push({ name, prompt, transform })
        return this
    }

    async execute(initialInput: string) {
        console.log("=== Prompt Chaining ===")
        let currentInput = initialInput
        const results = []

        for (let i = 0; i < this.steps.length; i++) {
            const step = this.steps[i]
            console.log(`\nStep ${i + 1}: ${step.name}`)

            const fullPrompt = step.prompt.replace("{{input}}", currentInput)

            const response = await ollama.chat({
                model: "llama3.2",
                messages: [{ role: "user", content: fullPrompt }]
            })

            let output = response.message.content
            if (step.transform) {
                output = step.transform(output)
            }

            results.push({
                step: step.name,
                input: currentInput,
                output: output
            })

            currentInput = output
            console.log("Output:", output.substring(0, 100) + "...")
        }

        return results
    }
}

export async function advancedAIConceptsExample() {
    console.log("=== Advanced AI Concepts Example ===")

    // Chain of Thought
    await chainOfThoughtExample()

    // Few-Shot Learning
    await fewShotLearningExample()

    // Self-Consistency
    await selfConsistencyDecoding("What are the three most important factors for a successful startup?")

    // Tree of Thoughts
    const tot = new TreeOfThoughts()
    const totResults = await tot.solve("How can I improve my programming skills?")
    console.log("Tree of Thoughts Results:", JSON.stringify(totResults, null, 2))

    // Prompt Chaining
    const chain = new PromptChain()
        .addStep("Brainstorm", "Generate 5 creative ideas for: {{input}}")
        .addStep("Evaluate", "Evaluate these ideas and pick the best one: {{input}}")
        .addStep("Plan", "Create a step-by-step plan to implement: {{input}}")

    const chainResults = await chain.execute("a mobile app for learning languages")
    console.log("Prompt Chain completed with", chainResults.length, "steps")

    return { tot, chain }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    await advancedAIConceptsExample()
}
