# Vomyra Sonic Backend

AWS Nova Sonic voice assistant backend with Socket.IO WebSocket server.

## Features
- Real-time bidirectional audio streaming
- AWS Bedrock Nova Sonic integration
- Tool support (Weather, Wikipedia, RAG, DateTime, etc.)
- TypeScript implementation

## Setup
```bash
npm install
npm run build
npm start
```

## Configuration
Server runs on port 8000 by default.

## Files
- `src/server.ts` - Main Socket.IO server
- `src/client.ts` - AWS Nova Sonic client
- `src/tools/` - Tool implementations
- `public/` - Frontend UI
