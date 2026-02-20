/**
 * Tool exports and default registry setup
 */
export type { Tool, ToolSpec } from './Tool';
export { ToolRegistry } from './Tool';
export { RAGKnowledgeBaseTool } from './RAGKnowledgeBaseTool';

import { ToolRegistry } from './Tool';
import { RAGKnowledgeBaseTool } from './RAGKnowledgeBaseTool';

/**
 * Creates a ToolRegistry with RAG tool only
 */
export function createDefaultToolRegistry(): ToolRegistry {
    const registry = new ToolRegistry();
    registry.register(RAGKnowledgeBaseTool);
    return registry;
}
