import { Ollama } from "ollama"

const ollama = new Ollama({ host: "http://localhost:11434" })

// Define some example tools
const tools = [
    {
        type: "function",
        function: {
            name: "get_weather",
            description: "Get current weather for a location",
            parameters: {
                type: "object",
                properties: {
                    location: {
                        type: "string",
                        description: "The city and state, e.g. San Francisco, CA"
                    }
                },
                required: ["location"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "calculate",
            description: "Perform mathematical calculations",
            parameters: {
                type: "object",
                properties: {
                    expression: {
                        type: "string",
                        description: "Mathematical expression to evaluate"
                    }
                },
                required: ["expression"]
            }
        }
    }
]

// Tool implementations
async function getWeather(location: string) {
    // Mock weather data for offline use
    const mockWeather = {
        "San Francisco, CA": "Sunny, 72°F",
        "New York, NY": "Cloudy, 65°F",
        "London, UK": "Rainy, 58°F"
    }

    return mockWeather[location as keyof typeof mockWeather] || "Weather data not available for this location"
}

async function calculate(expression: string) {
    try {
        // Simple calculator (be careful with eval in production!)
        const result = eval(expression)
        return `${expression} = ${result}`
    } catch (error) {
        return `Error calculating ${expression}: ${error}`
    }
}

export async function toolCallingExample() {
    console.log("=== Tool Calling Example ===")

    const messages = [
        {
            role: "user" as const,
            content: "What's the weather like in San Francisco and what's 15 * 23?"
        }
    ]

    const response = await ollama.chat({
        model: "llama3.2",
        messages,
        tools
    })

    console.log("Initial response:", response.message.content)

    // Handle tool calls if present
    if (response.message.tool_calls) {
        for (const toolCall of response.message.tool_calls) {
            console.log(`Calling tool: ${toolCall.function.name}`)

            let result: string
            switch (toolCall.function.name) {
                case "get_weather":
                    const args = JSON.parse(toolCall.function.arguments)
                    result = await getWeather(args.location)
                    break
                case "calculate":
                    const calcArgs = JSON.parse(toolCall.function.arguments)
                    result = await calculate(calcArgs.expression)
                    break
                default:
                    result = "Unknown tool"
            }

            console.log(`Tool result: ${result}`)

            // Add tool result back to conversation
            messages.push(response.message)
            messages.push({
                role: "tool" as const,
                content: result,
                tool_call_id: toolCall.function.name
            })
        }

        // Get final response with tool results
        const finalResponse = await ollama.chat({
            model: "llama3.2",
            messages
        })

        console.log("Final response:", finalResponse.message.content)
        return finalResponse.message.content
    }

    return response.message.content
}

if (import.meta.url === `file://${process.argv[1]}`) {
    await toolCallingExample()
}
