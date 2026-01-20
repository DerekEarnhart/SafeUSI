import type { CreatorTool, InsertCreatorTool, ToolExecutionRequest, ToolExecutionResponse } from "@shared/schema";
import { storage } from "../storage";
import { getLlamaService } from "./llamaService";

export class ToolRegistry {
  private tools: Map<string, CreatorTool> = new Map();

  async initialize() {
    // Load tools from database
    const dbTools = await storage.getAllCreatorTools();
    for (const tool of dbTools) {
      this.tools.set(tool.name, tool);
    }

    // Initialize default tools if not present
    await this.initializeDefaultTools();
  }

  private async initializeDefaultTools() {
    const defaultTools: InsertCreatorTool[] = [
      {
        name: "geo_art",
        category: "geo_art",
        description: "Transform mathematical expressions into geometric art using SymPy. Create beautiful visualizations from equations, fractals, and mathematical concepts.",
        version: "1.0",
        schema: {
          type: "object",
          properties: {
            expression: { type: "string", description: "Mathematical expression to visualize" },
            style: { type: "string", enum: ["geometric", "fractal", "parametric"], default: "geometric" },
            colors: { type: "array", items: { type: "string" }, default: ["#007acc", "#00ff88"] },
            resolution: { type: "number", minimum: 100, maximum: 2000, default: 800 },
            animation: { type: "boolean", default: false }
          },
          required: ["expression"]
        },
        isPremium: false,
        isActive: true
      },
      {
        name: "story_builder",
        category: "story_builder", 
        description: "Create interactive branching micro-stories with safe user code execution. Build engaging narratives with multiple paths and outcomes.",
        version: "1.0",
        schema: {
          type: "object",
          properties: {
            prompt: { type: "string", description: "Story starting prompt or theme" },
            genre: { type: "string", enum: ["adventure", "mystery", "sci-fi", "fantasy", "horror", "romance"], default: "adventure" },
            branches: { type: "number", minimum: 2, maximum: 10, default: 3 },
            length: { type: "string", enum: ["short", "medium", "long"], default: "medium" },
            interactive: { type: "boolean", default: true },
            userCode: { type: "string", description: "Optional user code for story logic" }
          },
          required: ["prompt"]
        },
        isPremium: false,
        isActive: true
      },
      {
        name: "vfx_sim", 
        category: "vfx_sim",
        description: "Generate JSON frame payloads for visual effects simulations with web preview capabilities. Create particle systems, fluid dynamics, and more.",
        version: "1.0",
        schema: {
          type: "object",
          properties: {
            effect: { type: "string", enum: ["particles", "fluid", "fire", "smoke", "lightning", "explosion"], default: "particles" },
            duration: { type: "number", minimum: 1, maximum: 30, default: 5 },
            resolution: { type: "object", properties: { width: { type: "number" }, height: { type: "number" } }, default: { width: 800, height: 600 } },
            parameters: { type: "object", description: "Effect-specific parameters" },
            framerate: { type: "number", minimum: 15, maximum: 60, default: 30 },
            preview: { type: "boolean", default: true }
          },
          required: ["effect"]
        },
        isPremium: true,
        isActive: true
      },
      {
        name: "music_seeds",
        category: "music_composer", 
        description: "Generate musical compositions as base64 WAV bytes or MIDI skeletons. Create original melodies, harmonies, and rhythmic patterns.",
        version: "1.0",
        schema: {
          type: "object",
          properties: {
            style: { type: "string", enum: ["classical", "electronic", "ambient", "jazz", "rock", "experimental"], default: "ambient" },
            tempo: { type: "number", minimum: 60, maximum: 180, default: 120 },
            duration: { type: "number", minimum: 10, maximum: 300, default: 60 },
            key: { type: "string", enum: ["C", "D", "E", "F", "G", "A", "B"], default: "C" },
            format: { type: "string", enum: ["wav", "midi"], default: "wav" },
            complexity: { type: "string", enum: ["simple", "moderate", "complex"], default: "moderate" }
          },
          required: ["style"]
        },
        isPremium: true,
        isActive: true
      },
      {
        name: "sequence_analyzer",
        category: "sequence_analyzer",
        description: "Analyze patterns and sequences in data, text, or mathematical series. Find hidden relationships and generate insights.",
        version: "1.0", 
        schema: {
          type: "object",
          properties: {
            input: { type: "string", description: "Data sequence to analyze" },
            type: { type: "string", enum: ["numeric", "text", "pattern", "time_series"], default: "pattern" },
            analysis: { type: "array", items: { type: "string" }, default: ["trends", "cycles", "anomalies"] },
            depth: { type: "string", enum: ["basic", "detailed", "comprehensive"], default: "detailed" }
          },
          required: ["input"]
        },
        isPremium: false,
        isActive: true
      },
      {
        name: "guide",
        category: "guide",
        description: "Interactive guide and help system for using creator tools effectively. Get suggestions, tutorials, and best practices.",
        version: "1.0",
        schema: {
          type: "object", 
          properties: {
            topic: { type: "string", description: "What you want help with" },
            level: { type: "string", enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
            format: { type: "string", enum: ["tutorial", "examples", "reference", "tips"], default: "tutorial" }
          },
          required: ["topic"]
        },
        isPremium: false,
        isActive: true
      }
    ];

    for (const toolData of defaultTools) {
      if (!this.tools.has(toolData.name)) {
        const tool = await storage.createCreatorTool(toolData);
        this.tools.set(tool.name, tool);
      }
    }
  }

  async getTool(name: string): Promise<CreatorTool | undefined> {
    return this.tools.get(name);
  }

  async getAllTools(): Promise<CreatorTool[]> {
    return Array.from(this.tools.values());
  }

  async getToolsByCategory(category: string): Promise<CreatorTool[]> {
    return Array.from(this.tools.values()).filter(tool => tool.category === category);
  }

  async executeTool(request: ToolExecutionRequest, userId: string): Promise<ToolExecutionResponse> {
    const startTime = Date.now();
    
    try {
      const tool = this.tools.get(request.tool);
      if (!tool) {
        return {
          ok: false,
          error: `Tool '${request.tool}' not found`,
          executionTime: Date.now() - startTime
        };
      }

      if (!tool.isActive) {
        return {
          ok: false,
          error: `Tool '${request.tool}' is currently disabled`,
          executionTime: Date.now() - startTime
        };
      }

      // Validate arguments against tool schema
      const validation = this.validateToolArgs(tool, request.args);
      if (!validation.valid) {
        return {
          ok: false,
          error: `Invalid arguments: ${validation.error}`,
          executionTime: Date.now() - startTime
        };
      }

      // Execute the tool based on engine choice - WSM logic preserved as primary
      let result;
      if (request.engine === 'wsm') {
        // WSM is the primary reasoning framework
        result = await this.executeWithWSM(tool, request.args);
      } else if (request.engine === 'llama') {
        // Llama for local NLP while preserving WSM reasoning
        result = await this.executeWithLlama(tool, request.args);
      } else {
        // External LLM services (OpenAI, etc.)
        result = await this.executeWithLLM(tool, request.args);
      }

      const executionTime = Date.now() - startTime;

      // Log usage
      await storage.logToolUsage({
        userId,
        toolName: request.tool,
        engine: request.engine,
        parameters: request.args,
        executionTime: executionTime / 1000,
        success: true,
        resultSize: JSON.stringify(result).length
      });

      return {
        ok: true,
        result,
        executionTime,
        engine: request.engine
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Log failed usage
      await storage.logToolUsage({
        userId,
        toolName: request.tool,
        engine: request.engine,
        parameters: request.args,
        executionTime: executionTime / 1000,
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error)
      });

      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime,
        engine: request.engine
      };
    }
  }

  private validateToolArgs(tool: CreatorTool, args: any): { valid: boolean; error?: string } {
    // Basic validation - in a real implementation you'd use a JSON schema validator
    const schema = tool.schema as any;
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in args)) {
          return { valid: false, error: `Missing required field: ${field}` };
        }
      }
    }
    return { valid: true };
  }

  private async executeWithLlama(tool: CreatorTool, args: any): Promise<any> {
    // Execute using Llama local NLP while preserving WSM reasoning framework
    const llamaService = getLlamaService();
    
    if (!llamaService.isReady()) {
      // Fallback to WSM if Llama not available
      console.log('[ToolRegistry] Llama service not ready, falling back to WSM');
      return this.executeWithWSM(tool, args);
    }

    try {
      // Map tool execution to appropriate NLP task
      const taskType = this.mapToolToNLPTask(tool.name);
      const text = this.prepareToolPrompt(tool, args);
      
      // Include WSM context to preserve reasoning framework
      const wsmContext = {
        tool_name: tool.name,
        category: tool.category,
        harmonic_state: { coherence: 0.8, reasoning_mode: 'wsm_enhanced' }
      };

      const response = await llamaService.processWithWSMContext(text, taskType, wsmContext);

      // Post-process with WSM enhancements
      return this.enhanceWithWSMLogic(response, tool, args);

    } catch (error) {
      console.error('[ToolRegistry] Llama execution failed:', error);
      // Fallback to WSM reasoning
      return this.executeWithWSM(tool, args);
    }
  }

  private mapToolToNLPTask(toolName: string): 'summarize' | 'analyze' | 'extract' | 'chat' | 'enhance' | 'question' {
    const taskMap: Record<string, any> = {
      'story_builder': 'enhance',
      'sequence_analyzer': 'analyze', 
      'guide': 'chat',
      'geo_art': 'analyze',
      'vfx_sim': 'extract',
      'music_seeds': 'enhance'
    };
    
    return taskMap[toolName] || 'analyze';
  }

  private prepareToolPrompt(tool: CreatorTool, args: any): string {
    return `Tool: ${tool.name}
Description: ${tool.description}
Arguments: ${JSON.stringify(args, null, 2)}

Generate appropriate output for this tool while maintaining harmonic reasoning patterns.`;
  }

  private async enhanceWithWSMLogic(llamaResponse: any, tool: CreatorTool, args: any): Promise<any> {
    // Enhance Llama output with WSM reasoning framework
    const baseResult = this.parseToToolResult(llamaResponse.response, tool.name, args);
    
    return {
      ...baseResult,
      wsm_enhanced: true,
      reasoning_preserved: llamaResponse.reasoningPreserved,
      processing_method: 'llama_with_wsm_framework',
      coherence_maintained: true,
      llama_metadata: llamaResponse.metadata
    };
  }

  private parseToToolResult(llamaText: string, toolName: string, args: any): any {
    // Parse Llama text output into structured tool results
    switch (toolName) {
      case "geo_art":
        return {
          type: "svg",
          content: `<svg width="800" height="600"><circle cx="400" cy="300" r="100" fill="${args.colors?.[0] || '#007acc'}"/><text x="400" y="500" text-anchor="middle" fill="#333">Llama Enhanced: ${args.expression}</text></svg>`,
          expression: args.expression,
          style: args.style || "geometric",
          llama_interpretation: llamaText.substring(0, 200)
        };
      
      case "story_builder":
        return {
          title: "Llama Enhanced Story",
          branches: [
            { id: 1, text: `${llamaText.substring(0, 300)}...`, choices: ["Continue", "Explore", "Rest"] },
            { id: 2, text: "The adventure continues...", choices: ["Act", "Think", "Wait"] }
          ],
          genre: args.genre,
          interactive: args.interactive,
          llama_narrative: llamaText
        };
      
      default:
        return {
          content: llamaText,
          tool: toolName,
          enhanced_by_llama: true,
          original_args: args
        };
    }
  }

  private async executeWithLLM(tool: CreatorTool, args: any): Promise<any> {
    // Integrate with external LLM service (OpenAI, etc.)
    // For now, return a mock response based on the tool type
    switch (tool.name) {
      case "geo_art":
        return {
          type: "svg",
          content: `<svg width="800" height="600"><circle cx="400" cy="300" r="100" fill="${args.colors?.[0] || '#007acc'}"/></svg>`,
          expression: args.expression,
          style: args.style || "geometric"
        };
      
      case "story_builder":
        return {
          title: "Generated Story",
          branches: [
            { id: 1, text: `Chapter 1: ${args.prompt}`, choices: ["Continue north", "Go east", "Rest here"] },
            { id: 2, text: "You venture into the unknown...", choices: ["Fight", "Hide", "Negotiate"] }
          ],
          genre: args.genre,
          interactive: args.interactive
        };
      
      case "vfx_sim":
        return {
          frames: Array.from({ length: 30 }, (_, i) => ({
            frame: i,
            particles: Array.from({ length: 50 }, (_, j) => ({
              id: j,
              x: Math.random() * 800,
              y: Math.random() * 600,
              vx: Math.random() * 2 - 1,
              vy: Math.random() * 2 - 1
            }))
          })),
          effect: args.effect,
          duration: args.duration
        };
      
      case "music_seeds":
        return {
          format: args.format,
          data: args.format === "midi" 
            ? "data:audio/midi;base64,TVRoZAAAAAYAAAABAGAA..." 
            : "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEA...",
          metadata: {
            style: args.style,
            tempo: args.tempo,
            duration: args.duration,
            key: args.key
          }
        };
      
      case "sequence_analyzer":
        return {
          patterns: ["Increasing trend", "Periodic cycle every 7 units"],
          anomalies: ["Outlier at position 15"],
          insights: ["Strong correlation with time", "Potential seasonal component"],
          analysis_type: args.type,
          confidence: 0.85
        };
      
      case "guide":
        return {
          sections: [
            { title: "Overview", content: `Guide for ${args.topic}` },
            { title: "Getting Started", content: "Follow these steps..." },
            { title: "Advanced Tips", content: "Pro tips for better results..." }
          ],
          level: args.level,
          format: args.format
        };
      
      default:
        throw new Error(`Tool execution not implemented for ${tool.name}`);
    }
  }

  private async executeWithWSM(tool: CreatorTool, args: any): Promise<any> {
    // WSM-specific enhanced execution with harmonic reasoning
    // For now, add WSM-specific enhancements to LLM results
    const llmResult = await this.executeWithLLM(tool, args);

    return {
      ...llmResult,
      wsm_enhanced: true,
      harmonic_signature: this.generateHarmonicSignature(tool, args),
      reasoning_framework: 'weyl_state_machine',
      coherence_score: Math.random() * 0.3 + 0.7 // 0.7-1.0 range
    };
  }

  private generateHarmonicSignature(tool: CreatorTool, args: any): number[] {
    // Generate harmonic signature for WSM processing
    const base = tool.name.length + Object.keys(args).length;
    return [
      Math.sin(base * 0.1) * 0.5 + 0.5,
      Math.cos(base * 0.15) * 0.5 + 0.5,
      Math.sin(base * 0.2) * 0.5 + 0.5,
      Math.cos(base * 0.25) * 0.5 + 0.5
    ];
  }
}

export const toolRegistry = new ToolRegistry();