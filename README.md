# Ollama & MCP Offline Experiments

This project contains comprehensive examples for experimenting with Ollama and Model Context Protocol (MCP) while offline on a plane.

## Quick Start

1. **Install dependencies:**

    ```bash
    npm install
    ```

2. **Make sure Ollama is running:**

    ```bash
    # Install Ollama first from https://ollama.ai
    ollama serve
    ```

3. **Setup and download required models:**

    ```bash
    tsx src/setup.ts
    ```

4. **Run all examples:**

    ```bash
    tsx src/run-all-examples.ts
    ```

5. **Run integration tests:**
    ```bash
    npm test
    ```

## Project Structure

### Basic Ollama Examples

-   `src/01-simple-interaction.ts` - Basic chat and streaming
-   `src/02-tool-calling.ts` - Function calling with tools
-   `src/03-conversation-flow.ts` - Conversation management and history
-   `src/04-rag-system.ts` - Retrieval Augmented Generation
-   `src/05-vector-stores.ts` - Vector operations and semantic search
-   `src/06-advanced-ai-concepts.ts` - Chain of thought, few-shot, etc.

### MCP Examples

-   `src/mcp/01-mcp-host.ts` - Creating an MCP server
-   `src/mcp/02-mcp-client.ts` - MCP client implementation
-   `src/mcp/03-mcp-features.ts` - Advanced MCP features
-   `src/mcp/04-ollama-mcp-integration.ts` - Ollama + MCP integration

### Tests

-   `test/integration.test.ts` - Integration tests using Ollama to evaluate results

## Required Models

The setup script will automatically download:

-   `llama3.2` - Main chat model
-   `nomic-embed-text` - Embeddings model

## Individual Examples

Run any example individually:

```bash
tsx src/01-simple-interaction.ts
tsx src/02-tool-calling.ts
# etc.
```

## Key Features Demonstrated

### Ollama Concepts

-   ✅ Simple chat interactions
-   ✅ Streaming responses
-   ✅ Tool/function calling
-   ✅ Conversation history management
-   ✅ RAG (Retrieval Augmented Generation)
-   ✅ Vector stores and semantic search
-   ✅ Embeddings generation
-   ✅ Chain of thought prompting
-   ✅ Few-shot learning
-   ✅ Self-consistency decoding
-   ✅ Tree of thoughts
-   ✅ Prompt chaining

### MCP Concepts

-   ✅ MCP server implementation
-   ✅ MCP client implementation
-   ✅ Tools, resources, and prompts
-   ✅ Structured generation
-   ✅ Progress tracking
-   ✅ Resource management
-   ✅ Ollama-MCP integration
-   ✅ Workflow execution
-   ✅ Batch processing

### Cloudflare-Ready

All examples are designed to work in Node.js and can be adapted for Cloudflare Workers with minimal changes.

## Testing

Tests use Mocha + Chai with a unique approach: Ollama itself evaluates whether test results meet the criteria, making the tests truly intelligent.

```bash
npm test
```

## Offline Usage

This project is designed for offline experimentation:

-   All dependencies are installed locally
-   No external API calls (except to local Ollama)
-   Mock data for all examples
-   Self-contained vector operations
-   Local embedding generation

Perfect for learning AI concepts during flights! ✈️
