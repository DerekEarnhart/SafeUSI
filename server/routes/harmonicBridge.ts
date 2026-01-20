import { Router } from 'express';
import { harmonicBridge } from '../services/harmonicBridge';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

// Harmonic analysis endpoint
const HarmonicAnalysisSchema = z.object({
  data: z.union([z.string(), z.array(z.any()), z.number()]),
});

router.post('/analyze', async (req, res) => {
  try {
    const { data } = HarmonicAnalysisSchema.parse(req.body);
    
    if (!harmonicBridge.isReady()) {
      return res.status(503).json({ 
        success: false, 
        error: 'Harmonic bridge not available',
        fallback: true
      });
    }

    const result = await harmonicBridge.analyzeHarmonics(data);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    });
  }
});

// Coherence calculation endpoint
const CoherenceSchema = z.object({
  state1: z.array(z.number()),
  state2: z.array(z.number()),
});

router.post('/coherence', async (req, res) => {
  try {
    const { state1, state2 } = CoherenceSchema.parse(req.body);
    
    if (!harmonicBridge.isReady()) {
      return res.status(503).json({ 
        success: false, 
        error: 'Harmonic bridge not available' 
      });
    }

    const coherence = await harmonicBridge.calculateCoherence(state1, state2);
    
    res.json({
      success: true,
      coherence,
      state1,
      state2
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Coherence calculation failed'
    });
  }
});

// Agent creation with harmonic enhancement
const CreateHarmonicAgentSchema = z.object({
  agentType: z.enum(['app_synthesizer', 'strategic_planner', 'creative_modulator', 'sequence_analyzer', 'geo_art', 'story_builder', 'vfx_sim', 'music_composer']),
  agentId: z.string().optional(),
  name: z.string(),
  userId: z.string(),
  vmInstanceId: z.string().optional(),
});

router.post('/agents', async (req, res) => {
  try {
    const { agentType, agentId, name, userId, vmInstanceId } = CreateHarmonicAgentSchema.parse(req.body);
    
    // Create agent in Python harmonic bridge first
    let harmonicAgentResult = null;
    if (harmonicBridge.isReady()) {
      try {
        harmonicAgentResult = await harmonicBridge.createAgent(agentType, agentId);
      } catch (error) {
        console.warn('Failed to create harmonic agent, continuing with basic agent:', error);
      }
    }

    // Create agent in our database
    const agent = await storage.createAgent({
      userId,
      vmInstanceId,
      name,
      type: agentType,
      status: 'active',
      configuration: {
        harmonicEnabled: harmonicAgentResult !== null,
        agentType,
        specializationLevel: harmonicAgentResult ? 'enhanced' : 'standard'
      },
      tools: getDefaultToolsForAgentType(agentType),
      harmonicState: harmonicAgentResult?.agent_status?.[harmonicAgentResult.agent_id]?.harmonic_state || [0.5, 0.5, 0.5, 0.5],
      coherence: harmonicAgentResult?.agent_status?.[harmonicAgentResult.agent_id]?.coherence || 0.5
    });

    res.json({
      success: true,
      agent,
      harmonicEnhanced: harmonicAgentResult !== null,
      harmonicAgentId: harmonicAgentResult?.agent_id
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Agent creation failed'
    });
  }
});

// Harmonic orchestration endpoint
const OrchestrationSchema = z.object({
  task: z.string(),
  agents: z.array(z.string()).optional(),
  refine: z.boolean().default(false),
});

router.post('/orchestrate', async (req, res) => {
  try {
    const { task, agents, refine } = OrchestrationSchema.parse(req.body);
    
    if (!harmonicBridge.isReady()) {
      return res.status(503).json({ 
        success: false, 
        error: 'Harmonic bridge not available for orchestration' 
      });
    }

    const orchestrationResult = await harmonicBridge.orchestrateAgents(task, agents, refine);
    
    res.json({
      success: true,
      orchestration: orchestrationResult
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Orchestration failed'
    });
  }
});

// Spectral multiplication endpoint
const SpectralMultiplySchema = z.object({
  freq1: z.number(),
  amp1: z.number(),
  phase1: z.number(),
  freq2: z.number(),
  amp2: z.number(),
  phase2: z.number(),
  numSamples: z.number().optional().default(128),
});

router.post('/spectral-multiply', async (req, res) => {
  try {
    const { freq1, amp1, phase1, freq2, amp2, phase2, numSamples } = SpectralMultiplySchema.parse(req.body);
    
    if (!harmonicBridge.isReady()) {
      return res.status(503).json({ 
        success: false, 
        error: 'Harmonic bridge not available' 
      });
    }

    const result = await harmonicBridge.spectralMultiply(freq1, amp1, phase1, freq2, amp2, phase2, numSamples);
    
    res.json({
      success: true,
      spectral_result: result.spectral_result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Spectral multiplication failed'
    });
  }
});

// Memory search endpoint
const MemorySearchSchema = z.object({
  query: z.string(),
  threshold: z.number().optional().default(0.5),
});

router.post('/memory/search', async (req, res) => {
  try {
    const { query, threshold } = MemorySearchSchema.parse(req.body);
    
    if (!harmonicBridge.isReady()) {
      return res.status(503).json({ 
        success: false, 
        error: 'Harmonic bridge not available' 
      });
    }

    const result = await harmonicBridge.searchMemory(query, threshold);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Memory search failed'
    });
  }
});

// System status endpoint
router.get('/status', async (req, res) => {
  try {
    const includeMemory = req.query.memory === 'true';
    const includeAgents = req.query.agents !== 'false';
    
    if (!harmonicBridge.isReady()) {
      return res.json({
        success: true,
        bridge_available: false,
        message: 'Harmonic bridge not connected'
      });
    }

    const systemStatus = await harmonicBridge.getSystemStatus(includeMemory, includeAgents);
    
    res.json({
      success: true,
      bridge_available: true,
      system_status: systemStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status retrieval failed'
    });
  }
});

// Recursive improvement endpoint
const RecursiveImprovementSchema = z.object({
  performanceMetric: z.number().min(0).max(1),
});

router.post('/improve', async (req, res) => {
  try {
    const { performanceMetric } = RecursiveImprovementSchema.parse(req.body);
    
    if (!harmonicBridge.isReady()) {
      return res.status(503).json({ 
        success: false, 
        error: 'Harmonic bridge not available' 
      });
    }

    const improvementResult = await harmonicBridge.recursiveImprove(performanceMetric);
    
    res.json({
      success: true,
      improvement: improvementResult
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Recursive improvement failed'
    });
  }
});

// Ensemble coordination endpoint
const EnsembleCoordinationSchema = z.object({
  agentHarmonics: z.array(z.array(z.number())).optional(),
  taskRequirements: z.record(z.number()).optional(),
});

router.post('/coordinate', async (req, res) => {
  try {
    const { agentHarmonics, taskRequirements } = EnsembleCoordinationSchema.parse(req.body);
    
    if (!harmonicBridge.isReady()) {
      return res.status(503).json({ 
        success: false, 
        error: 'Harmonic bridge not available' 
      });
    }

    const coordinationResult = await harmonicBridge.coordinateEnsemble(agentHarmonics, taskRequirements);
    
    res.json({
      success: true,
      coordination: coordinationResult
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Ensemble coordination failed'
    });
  }
});

// Helper function to get default tools for agent types
function getDefaultToolsForAgentType(agentType: string): string[] {
  const toolMappings: Record<string, string[]> = {
    'app_synthesizer': ['code_generation', 'architecture_design', 'system_integration', 'harmonic_optimization'],
    'strategic_planner': ['task_decomposition', 'workflow_design', 'resource_planning', 'harmonic_coordination'],
    'creative_modulator': ['aesthetic_generation', 'style_synthesis', 'creative_optimization', 'harmonic_aesthetics'],
    'sequence_analyzer': ['pattern_detection', 'data_analysis', 'trend_identification', 'harmonic_analysis'],
    'geo_art': ['geometric_generation', 'spatial_analysis', 'visual_synthesis'],
    'story_builder': ['narrative_generation', 'plot_development', 'character_creation'],
    'vfx_sim': ['physics_simulation', 'visual_effects', 'rendering'],
    'music_composer': ['musical_composition', 'harmonic_theory', 'sound_synthesis'],
  };
  
  return toolMappings[agentType] || ['basic_tools'];
}

export default router;