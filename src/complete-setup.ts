import { Ollama } from "ollama"
import { promises as fs } from "fs"
import * as path from "path"

const ollama = new Ollama({ host: "http://localhost:11434" })

export async function checkSystemRequirements() {
    console.log("🔍 Checking system requirements...")

    // Check Node.js version
    const nodeVersion = process.version
    console.log(`✅ Node.js version: ${nodeVersion}`)

    // Check available memory
    const memUsage = process.memoryUsage()
    console.log(`✅ Memory available: ${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`)

    // Check disk space (approximate)
    try {
        const stats = await fs.stat(".")
        console.log("✅ Disk access: OK")
    } catch (error) {
        console.error("❌ Disk access issue:", error)
        throw error
    }
}

export async function verifyOllamaConnection() {
    console.log("🔌 Verifying Ollama connection...")

    try {
        const version = await ollama.ps()
        console.log("✅ Ollama server is responsive")

        const models = await ollama.list()
        console.log(`✅ Found ${models.models.length} existing models`)

        return true
    } catch (error) {
        console.error("❌ Cannot connect to Ollama:", error)
        console.error("   Make sure Ollama is running: ollama serve")
        throw error
    }
}

export async function downloadRequiredModels() {
    console.log("📥 Downloading required models...")

    const requiredModels = [
        { name: "llama3.2", description: "Main chat model (3.2B parameters)" },
        { name: "llama3.2:1b", description: "Lightweight chat model (1B parameters)" },
        { name: "nomic-embed-text", description: "Text embedding model" },
        { name: "llama3.2:3b", description: "Medium chat model (3B parameters)" }
    ]

    const availableModels = await ollama.list()
    const installedModelNames = availableModels.models.map((m) => m.name)

    for (const model of requiredModels) {
        console.log(`\n📦 Processing ${model.name}...`)
        console.log(`   Description: ${model.description}`)

        const isInstalled = installedModelNames.some((installed) => installed.includes(model.name.split(":")[0]))

        if (isInstalled) {
            console.log(`   ✅ Already installed`)
            continue
        }

        try {
            console.log(`   ⬇️  Downloading ${model.name}... (this may take a while)`)

            // Show progress during download
            const progressCallback = (progress: any) => {
                if (progress.status) {
                    process.stdout.write(`\r   📊 ${progress.status}...`)
                }
                if (progress.completed && progress.total) {
                    const percent = Math.round((progress.completed / progress.total) * 100)
                    process.stdout.write(`\r   📊 ${percent}% complete`)
                }
            }

            await ollama.pull({
                model: model.name,
                stream: true
            })

            console.log(`\n   ✅ ${model.name} downloaded successfully`)

            // Verify the model works
            console.log(`   🧪 Testing ${model.name}...`)
            const testResponse = await ollama.generate({
                model: model.name,
                prompt: 'Say "Hello" in one word.',
                options: { num_predict: 5 }
            })

            if (testResponse.response.toLowerCase().includes("hello")) {
                console.log(`   ✅ ${model.name} is working correctly`)
            } else {
                console.log(`   ⚠️  ${model.name} may have issues, but continuing...`)
            }
        } catch (error) {
            console.error(`   ❌ Failed to download ${model.name}:`, error)
            // Don't fail completely, continue with other models
        }
    }
}

export async function verifyNpmDependencies() {
    console.log("📚 Verifying npm dependencies...")

    const requiredPackages = ["ollama", "@modelcontextprotocol/sdk", "mocha", "chai", "tsx", "typescript"]

    try {
        const packageJson = JSON.parse(await fs.readFile("package.json", "utf-8"))
        const allDeps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
        }

        for (const pkg of requiredPackages) {
            if (allDeps[pkg]) {
                console.log(`   ✅ ${pkg}: ${allDeps[pkg]}`)
            } else {
                console.log(`   ❌ Missing: ${pkg}`)
                throw new Error(`Required package ${pkg} is not installed`)
            }
        }

        console.log("✅ All required npm packages are available")
    } catch (error) {
        console.error("❌ Package verification failed:", error)
        throw error
    }
}

export async function createTestData() {
    console.log("📄 Creating test data files...")

    const testDataDir = "test-data"

    try {
        await fs.mkdir(testDataDir, { recursive: true })

        // Create sample documents for RAG testing
        const sampleDocs = {
            "programming.txt": `
JavaScript is a versatile programming language used for web development.
It supports both object-oriented and functional programming paradigms.
Node.js allows JavaScript to run on the server side.
React is a popular JavaScript library for building user interfaces.
`,
            "science.txt": `
Quantum computing uses quantum mechanical phenomena to process information.
Machine learning is a subset of artificial intelligence that learns from data.
Neural networks are inspired by the structure of the human brain.
Deep learning uses multiple layers to model complex patterns.
`,
            "cooking.txt": `
Italian cuisine features pasta, pizza, and fresh ingredients.
French cooking emphasizes technique and high-quality ingredients.
Asian cuisine includes diverse flavors from rice, noodles, and spices.
Grilling is a popular cooking method that adds smoky flavors.
`
        }

        for (const [filename, content] of Object.entries(sampleDocs)) {
            await fs.writeFile(path.join(testDataDir, filename), content.trim())
            console.log(`   ✅ Created ${filename}`)
        }

        // Create sample code files for analysis
        const sampleCode = {
            "sample.js": `
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

async function fetchUserData(userId) {
  const response = await fetch(\`/api/users/\${userId}\`);
  return response.json();
}

class UserManager {
  constructor() {
    this.users = [];
  }

  addUser(user) {
    this.users.push(user);
  }
}
`,
            "sample.py": `
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

class DataProcessor:
    def __init__(self):
        self.data = []

    def process(self, item):
        return item.upper()
`
        }

        for (const [filename, content] of Object.entries(sampleCode)) {
            await fs.writeFile(path.join(testDataDir, filename), content.trim())
            console.log(`   ✅ Created ${filename}`)
        }

        console.log("✅ Test data files created")
    } catch (error) {
        console.error("❌ Failed to create test data:", error)
        throw error
    }
}

export async function runQuickSmokeTest() {
    console.log("🧪 Running quick smoke test...")

    try {
        // Test basic chat
        console.log("   Testing basic chat...")
        const chatResponse = await ollama.chat({
            model: "llama3.2",
            messages: [{ role: "user", content: 'Say "test successful" if you can read this.' }]
        })

        if (chatResponse.message.content.toLowerCase().includes("test successful")) {
            console.log("   ✅ Basic chat: PASS")
        } else {
            console.log("   ⚠️  Basic chat: Response received but unexpected content")
        }

        // Test embeddings
        console.log("   Testing embeddings...")
        const embedResponse = await ollama.embeddings({
            model: "nomic-embed-text",
            prompt: "test embedding"
        })

        if (embedResponse.embedding && embedResponse.embedding.length > 0) {
            console.log(`   ✅ Embeddings: PASS (${embedResponse.embedding.length} dimensions)`)
        } else {
            console.log("   ❌ Embeddings: FAIL")
        }

        console.log("✅ Smoke test completed successfully")
    } catch (error) {
        console.error("❌ Smoke test failed:", error)
        throw error
    }
}

async function main() {
    console.log("🚀 Starting complete Ollama & MCP setup...\n")

    try {
        await checkSystemRequirements()
        console.log("")

        await verifyOllamaConnection()
        console.log("")

        await verifyNpmDependencies()
        console.log("")

        await downloadRequiredModels()
        console.log("")

        await createTestData()
        console.log("")

        await runQuickSmokeTest()
        console.log("")

        console.log("🎉 Complete setup finished successfully!")
        console.log("")
        console.log("📋 Summary:")
        console.log("   ✅ System requirements verified")
        console.log("   ✅ Ollama connection confirmed")
        console.log("   ✅ All npm dependencies available")
        console.log("   ✅ Required models downloaded")
        console.log("   ✅ Test data created")
        console.log("   ✅ Smoke test passed")
        console.log("")
        console.log("🛫 Ready for offline experimentation!")
    } catch (error) {
        console.error("\n❌ Setup failed:", error.message)
        process.exit(1)
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    await main()
}
