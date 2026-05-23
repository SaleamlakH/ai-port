# ai-port

> A secure CLI-driven AI agent system that connects a local development agent to a backend MCP server for controlled tool execution, code analysis, and project interaction.

---

## Overview

ai-port connects AI systems to local development environments through an MCP-based bridge. The AI issues tool calls to the MCP server, which forwards them to a local agent. The local agent performs the requested tasks and returns results back through the MCP server to the AI.

---

## Features

- CLI-based local agent (`aiport`) for interacting with the system
- Email/password authentication system
- API key management for agent access control
- Secure WebSocket bridge between CLI and server
- AST-based code analysis (TypeScript/JavaScript)
- Controlled tool execution via MCP server
- Session-based authentication handling
- **Policy-based command control via `aiport.config.json`**
  - Define which commands are allowed or restricted
  - Enables safe and configurable execution rules per project

---

## API / Core Concept

- AI initiates actions based on user prompts
- AI interacts with MCP server using tool calls (MCP protocol)
- MCP server acts as a relay and control layer
- MCP forwards requests to the local agent
- Local agent executes tasks (code, files, commands, analysis)
- Local agent returns results to MCP server
- MCP server forwards results back to the AI
- AI responds to the user with the final output

---

## Architecture

### AI (Client)

- Decides what to do based on user input
- Uses MCP tools to perform actions

### MCP Server

- Communication bridge between AI and local environment
- Handles authentication (API key, session)
- Routes requests and responses

### Local Agent

- Executes all local operations:
  - file system access
  - code reading/writing
  - AST parsing
  - command execution (guarded)
- Enforces local policies (`aiport.config.json`)
- Returns structured results

### Flow

```
User → AI → MCP Server → Local Agent → MCP Server → AI → User
```

---

## Tech Stack

### Local Agent

- Node.js, TypeScript
- Commander.js (CLI)
- ws (WebSocket client)
- ts-morph (AST parsing)
- Vitest (testing)

### MCP Server

- Node.js, Express
- TypeScript
- PostgreSQL + Prisma
- WebSocket (ws)
- JWT (jose), bcryptjs
- Zod validation
- MCP SDK (@modelcontextprotocol/sdk)

---

## Installation

### 1. Start MCP Server

```bash
cd ai-port/mcp-server
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Create `.env`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/aiport
JWT_SECRET=your_secret
```

---

### 2. Setup Local Agent

```bash
cd ai-port/local-agent
npm install
npm run build
npm link
```

---

## Usage

```bash
aiport register <email> <password>
aiport login <email> <password>

aiport key --create <label>
aiport key --revoke <key>

aiport connect
```

---

## Configuration (Target project directory)

### .env

```
AIPORT_API_KEY=your_api_key
AIPORT_MCP_SERVER_URL=http://localhost:3000
```

### aiport.config.json

```json
{
  "language": "typescript",
  "commands": {
    "npm test": "allowed"
  }
}
```
