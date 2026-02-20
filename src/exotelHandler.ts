/**
 * Exotel WebSocket Handler for Telephony Integration
 * Handles bidirectional audio streaming from Exotel to Nova Sonic
 */

import { WebSocket, WebSocketServer } from 'ws';
import { NovaSonicBidirectionalStreamClient, StreamSession } from './client';
import { Buffer } from 'node:buffer';

interface ExotelMessage {
    event: string;
    streamSid?: string;
    callSid?: string;
    media?: {
        payload: string; // base64 encoded audio
        timestamp?: string;
    };
}

export class ExotelWebSocketHandler {
    private wss: WebSocketServer;
    private sessions = new Map<string, StreamSession>();
    private bedrockClient: NovaSonicBidirectionalStreamClient;

    constructor(server: any, bedrockClient: NovaSonicBidirectionalStreamClient) {
        this.bedrockClient = bedrockClient;
        
        // Create WebSocket server on /exotel path
        this.wss = new WebSocketServer({ 
            server,
            path: '/exotel'
        });

        this.wss.on('connection', (ws: WebSocket) => {
            console.log('[Exotel] New connection established');
            this.handleConnection(ws);
        });

        console.log('[Exotel] WebSocket server initialized on /exotel');
    }

    private async handleConnection(ws: WebSocket) {
        let sessionId: string | null = null;
        let session: StreamSession | null = null;

        ws.on('message', async (data: Buffer) => {
            try {
                const message: ExotelMessage = JSON.parse(data.toString());
                
                switch (message.event) {
                    case 'start':
                        // Call started - initialize Nova Sonic session
                        sessionId = message.streamSid || message.callSid || `exotel-${Date.now()}`;
                        console.log(`[Exotel] Call started: ${sessionId}`);
                        
                        session = await this.initializeNovaSession(sessionId, ws);
                        this.sessions.set(sessionId, session);
                        break;

                    case 'media':
                        // Audio data from caller
                        if (session && message.media?.payload) {
                            const audioBuffer = Buffer.from(message.media.payload, 'base64');
                            await session.streamAudio(audioBuffer);
                        }
                        break;

                    case 'stop':
                        // Call ended
                        console.log(`[Exotel] Call ended: ${sessionId}`);
                        if (session) {
                            await session.close();
                            if (sessionId) {
                                this.sessions.delete(sessionId);
                            }
                        }
                        ws.close();
                        break;

                    default:
                        console.log(`[Exotel] Unknown event: ${message.event}`);
                }
            } catch (error) {
                console.error('[Exotel] Error processing message:', error);
            }
        });

        ws.on('close', async () => {
            console.log(`[Exotel] Connection closed: ${sessionId}`);
            if (session) {
                await session.close();
                if (sessionId) {
                    this.sessions.delete(sessionId);
                }
            }
        });

        ws.on('error', (error) => {
            console.error('[Exotel] WebSocket error:', error);
        });
    }

    private async initializeNovaSession(sessionId: string, ws: WebSocket): Promise<StreamSession> {
        // Create Nova Sonic session
        const session = this.bedrockClient.createStreamSession(sessionId, {
            enabledTools: ['search_knowledge_base']
        });

        // Setup session with default config for telephony
        await session.setupSessionAndPromptStart('kiara', 8000); // 8kHz for telephony
        
        // Setup system prompt (load from default)
        const systemPrompt = process.env.EXOTEL_SYSTEM_PROMPT || 
            'You are Riya, a sales executive at Jain Sales Corporation. Answer customer queries about pumps, motors, and cables.';
        await session.setupSystemPrompt(undefined, systemPrompt, 'kiara');
        
        // Start audio
        await session.setupStartAudio();
        
        // Initialize streaming
        this.bedrockClient.initiateBidirectionalStreaming(sessionId);

        // Handle audio output from Nova Sonic
        // TODO: Fix event handling for Exotel
        // session.on('audioOutput', (audioData: Buffer) => {
        //     // Send audio back to Exotel
        //     const message = {
        //         event: 'media',
        //         streamSid: sessionId,
        //         media: {
        //             payload: audioData.toString('base64')
        //         }
        //     };
        //     
        //     if (ws.readyState === WebSocket.OPEN) {
        //         ws.send(JSON.stringify(message));
        //     }
        // });

        // Handle text output (for logging)
        // session.on('textOutput', (text: string) => {
        //     console.log(`[Exotel] Nova response: ${text}`);
        // });

        return session;
    }
}
