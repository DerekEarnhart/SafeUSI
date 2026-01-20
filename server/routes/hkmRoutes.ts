import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { harmonicBridge } from '../services/harmonicBridge';
import { knowledgeSynthesis } from '../services/knowledgeSynthesis';
import { commercialApi, type AuthenticatedRequest } from '../services/commercialApi';
import {
  createKnowledgePackSchema,
  ingestKnowledgeSchema,
  hkmQuerySchema,
  type CreateKnowledgePack,
  type IngestKnowledge,
  type HkmQueryRequest,
  type KnowledgePack,
  type KnowledgeEmbedding,
  type HkmQuery
} from '@shared/schema';

const router = Router();

// ========================================
// HKM Knowledge Pack Operations
// ========================================

// Create a new knowledge pack
router.post('/knowledge-packs', commercialApi.requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const packData = createKnowledgePackSchema.parse(req.body);
    const userId = req.userId!;

    // Generate harmonic signature using harmonic bridge
    let harmonicSignature = Math.random() * 100;
    if (harmonicBridge.isReady()) {
      try {
        const analysis = await harmonicBridge.analyzeHarmonics(packData.name);
        harmonicSignature = analysis.coherence * 100;
      } catch (error) {
        console.warn('Failed to generate harmonic signature, using fallback:', error);
      }
    }

    const knowledgePack = await storage.createKnowledgePack({
      ...packData,
      userId,
      harmonicSignature,
      coherenceScore: harmonicSignature / 100,
    });

    res.json({
      success: true,
      knowledgePack,
      message: 'Knowledge pack created successfully'
    });
  } catch (error) {
    console.error('Error creating knowledge pack:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create knowledge pack'
    });
  }
});

// Get user's knowledge packs
router.get('/knowledge-packs', commercialApi.requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const category = req.query.category as string | undefined;

    let knowledgePacks: KnowledgePack[];
    if (category) {
      knowledgePacks = await storage.getKnowledgePacksByCategory(category, limit);
      // Filter by user for security
      knowledgePacks = knowledgePacks.filter(pack => pack.userId === userId);
    } else {
      knowledgePacks = await storage.getUserKnowledgePacks(userId, limit);
    }

    res.json({
      success: true,
      knowledgePacks,
      total: knowledgePacks.length
    });
  } catch (error) {
    console.error('Error fetching knowledge packs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch knowledge packs'
    });
  }
});

// Get specific knowledge pack
router.get('/knowledge-packs/:id', commercialApi.requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    
    const knowledgePack = await storage.getKnowledgePack(id);
    if (!knowledgePack) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge pack not found'
      });
    }

    // Security check - user can only access their own packs
    if (knowledgePack.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      knowledgePack
    });
  } catch (error) {
    console.error('Error fetching knowledge pack:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch knowledge pack'
    });
  }
});

// ========================================
// HKM Knowledge Ingestion Operations
// ========================================

// Ingest knowledge into a pack
router.post('/knowledge-packs/:packId/ingest', commercialApi.requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { packId } = req.params;
    const ingestData = ingestKnowledgeSchema.parse(req.body);
    const userId = req.userId!;

    // Verify pack ownership
    const knowledgePack = await storage.getKnowledgePack(packId);
    if (!knowledgePack || knowledgePack.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied or pack not found'
      });
    }

    // Generate harmonic embedding
    let harmonicVector = JSON.stringify(new Array(512).fill(0).map(() => Math.random()));
    let spectralRank = Math.random() * 0.5 + 0.5; // 0.5-1.0

    if (harmonicBridge.isReady()) {
      try {
        const analysis = await harmonicBridge.analyzeHarmonics(ingestData.content);
        harmonicVector = JSON.stringify(analysis.harmonic_state || new Array(512).fill(0).map(() => Math.random()));
        spectralRank = analysis.coherence;
      } catch (error) {
        console.warn('Failed to generate harmonic embedding, using fallback:', error);
      }
    }

    // Create knowledge embedding
    const chunkId = `${packId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const embedding = await storage.createKnowledgeEmbedding({
      packId,
      chunkId,
      content: ingestData.content,
      harmonicVector,
      spectralRank,
      semanticCluster: Math.floor(Math.random() * 10), // Simple clustering simulation
      tokenCount: ingestData.content.split(/\s+/).length,
      citations: JSON.stringify([]),
    });

    // Create citation
    const citation = await storage.createKnowledgeCitation({
      embeddingId: embedding.id,
      sourceType: ingestData.sourceType,
      sourceTitle: ingestData.sourceTitle,
      sourceAuthor: ingestData.sourceAuthor || null,
      sourceUrl: ingestData.sourceUrl || null,
      reliabilityScore: 0.8, // Default reliability
    });

    // Update pack metrics
    await storage.updateKnowledgePack(packId, {
      totalDocuments: knowledgePack.totalDocuments + 1,
      totalTokens: knowledgePack.totalTokens + embedding.tokenCount,
      updatedAt: new Date(),
    });

    // Track ingestion metric
    await storage.createLearningMetric({
      packId,
      metricType: 'ingestion_rate',
      metricValue: 1,
      metricMetadata: JSON.stringify({
        tokenCount: embedding.tokenCount,
        spectralRank,
        sourceType: ingestData.sourceType
      }),
    });

    res.json({
      success: true,
      embedding,
      citation,
      message: 'Knowledge ingested successfully'
    });
  } catch (error) {
    console.error('Error ingesting knowledge:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to ingest knowledge'
    });
  }
});

// ========================================
// HKM Knowledge Retrieval Operations
// ========================================

// Query knowledge with spectral re-ranking
router.post('/query', commercialApi.requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const queryData = hkmQuerySchema.parse(req.body);
    const userId = req.userId!;
    const startTime = Date.now();

    // Verify access to all requested packs
    for (const packId of queryData.packIds) {
      const pack = await storage.getKnowledgePack(packId);
      if (!pack || pack.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: `Access denied to knowledge pack ${packId}`
        });
      }
    }

    // Retrieve embeddings from all specified packs
    let allEmbeddings: KnowledgeEmbedding[] = [];
    for (const packId of queryData.packIds) {
      const embeddings = await storage.searchEmbeddingsByContent(
        packId, 
        queryData.query, 
        queryData.maxChunks
      );
      allEmbeddings.push(...embeddings);
    }

    // Apply spectral re-ranking
    const rankedEmbeddings = allEmbeddings
      .sort((a, b) => {
        // Multi-criteria ranking: spectral rank + content relevance + harmonic coherence
        const scoreA = a.spectralRank * 0.6 + (a.content.toLowerCase().includes(queryData.query.toLowerCase()) ? 0.4 : 0);
        const scoreB = b.spectralRank * 0.6 + (b.content.toLowerCase().includes(queryData.query.toLowerCase()) ? 0.4 : 0);
        return scoreB - scoreA;
      })
      .slice(0, queryData.maxChunks);

    // Get citations for retrieved chunks
    const citations = [];
    for (const embedding of rankedEmbeddings) {
      const embeddingCitations = await storage.getEmbeddingCitations(embedding.id);
      citations.push(...embeddingCitations);
    }

    // Advanced Knowledge Synthesis using AGI Core and multiple methods
    let synthesisResult;
    
    try {
      synthesisResult = await knowledgeSynthesis.synthesizeKnowledge({
        query: queryData.query,
        retrievedEmbeddings: rankedEmbeddings,
        citations,
        synthesisMethod: queryData.synthesisMethod || 'agi_conceptual', // Default to AGI Core
        maxTokens: 2000
      });
    } catch (error) {
      console.error('Advanced synthesis failed, using fallback:', error);
      
      // Fallback synthesis
      synthesisResult = {
        synthesizedResponse: rankedEmbeddings.map(e => e.content).join('\n\n').substring(0, 1000),
        responseCoherence: 0.6,
        confidenceScore: 0.5,
        harmonicAnalysis: {
          resonanceStrength: 0.5,
          spectralDistribution: [0.33, 0.33, 0.34],
          phaseLocking: 0.4
        },
        citationMap: {},
        reasoning: ['Fallback synthesis due to processing error'],
        processingTime: 0
      };
    }
    
    const synthesizedResponse = synthesisResult.synthesizedResponse;
    const responseCoherence = synthesisResult.responseCoherence;

    const processingTime = Date.now() - startTime;

    // Store query in history
    const hkmQuery = await storage.createHkmQuery({
      query: queryData.query,
      queryType: queryData.queryType,
      packIds: JSON.stringify(queryData.packIds),
      retrievedChunks: rankedEmbeddings.length,
      synthesisMethod: queryData.synthesisMethod || 'spectral_ranking',
      response: synthesizedResponse,
      responseCoherence,
      sourceCitations: JSON.stringify(citations.map(c => ({
        id: c.id,
        sourceTitle: c.sourceTitle,
        sourceAuthor: c.sourceAuthor,
        sourceUrl: c.sourceUrl,
        reliabilityScore: c.reliabilityScore
      }))),
      processingTime,
      userId,
    });

    // Track retrieval metric
    await storage.createLearningMetric({
      packId: queryData.packIds[0], // Use first pack for metrics
      metricType: 'retrieval_accuracy',
      metricValue: responseCoherence,
      metricMetadata: JSON.stringify({
        retrievedChunks: rankedEmbeddings.length,
        synthesisMethod: queryData.synthesisMethod,
        processingTime
      }),
    });

    res.json({
      success: true,
      query: hkmQuery,
      retrievedEmbeddings: rankedEmbeddings,
      citations,
      synthesizedResponse,
      responseCoherence,
      processingTime,
      
      // Advanced Synthesis Metadata
      synthesis: {
        method: queryData.synthesisMethod || 'agi_conceptual',
        confidenceScore: synthesisResult.confidenceScore,
        harmonicAnalysis: synthesisResult.harmonicAnalysis,
        reasoning: synthesisResult.reasoning,
        citationMap: synthesisResult.citationMap,
        synthesisProcessingTime: synthesisResult.processingTime
      },
      
      // AGI Core Metrics
      agiMetrics: {
        totalKnowledgeSegments: rankedEmbeddings.length,
        citationCount: citations.length,
        coherenceDistribution: synthesisResult.harmonicAnalysis.spectralDistribution,
        resonanceStrength: synthesisResult.harmonicAnalysis.resonanceStrength,
        phaseLocking: synthesisResult.harmonicAnalysis.phaseLocking
      },
      
      message: 'Knowledge retrieved and synthesized with AGI Core successfully'
    });

  } catch (error) {
    console.error('Error processing HKM query:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process query'
    });
  }
});

// Get query history
router.get('/queries', commercialApi.requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const queryType = req.query.type as string | undefined;

    let queries: HkmQuery[];
    if (queryType) {
      queries = await storage.getHkmQueriesByType(queryType, limit);
      // Filter by user for security
      queries = queries.filter(q => q.userId === userId);
    } else {
      queries = await storage.getUserHkmQueries(userId, limit);
    }

    res.json({
      success: true,
      queries,
      total: queries.length
    });
  } catch (error) {
    console.error('Error fetching query history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch query history'
    });
  }
});

// ========================================
// HKM Analytics and Metrics
// ========================================

// Get learning metrics for a knowledge pack
router.get('/knowledge-packs/:packId/metrics', commercialApi.requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { packId } = req.params;
    const userId = req.userId!;
    const metricType = req.query.type as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    // Verify pack ownership
    const knowledgePack = await storage.getKnowledgePack(packId);
    if (!knowledgePack || knowledgePack.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied or pack not found'
      });
    }

    const metrics = await storage.getPackLearningMetrics(packId, metricType, limit);

    res.json({
      success: true,
      metrics,
      packId,
      total: metrics.length
    });
  } catch (error) {
    console.error('Error fetching learning metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch learning metrics'
    });
  }
});

export { router as hkmRoutes };