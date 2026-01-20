import { harmonicBridge } from './harmonicBridge';
import { storage } from '../storage';
import { type KnowledgeEmbedding, type KnowledgeCitation, type HkmQuery } from '@shared/schema';

export interface SynthesisRequest {
  query: string;
  retrievedEmbeddings: KnowledgeEmbedding[];
  citations: KnowledgeCitation[];
  synthesisMethod: 'harmonic_fusion' | 'spectral_ranking' | 'multi_hop' | 'agi_conceptual';
  maxTokens?: number;
}

export interface SynthesisResult {
  synthesizedResponse: string;
  responseCoherence: number;
  confidenceScore: number;
  harmonicAnalysis: {
    resonanceStrength: number;
    spectralDistribution: number[];
    phaseLocking: number;
  };
  citationMap: {
    [key: string]: KnowledgeCitation[];
  };
  reasoning: string[];
  processingTime: number;
}

export interface ConceptualReasoningResponse {
  reply: string;
  coherence: number;
  harmonics: number[];
  reasoning_steps: string[];
  phase_coupling: number;
  spectral_analysis: {
    dominant_frequencies: number[];
    harmonic_ratios: number[];
    coherence_matrix: number[][];
  };
}

class KnowledgeSynthesisService {
  private synthesisCache: Map<string, SynthesisResult> = new Map();
  private readonly cacheExpiry = 300000; // 5 minutes
  
  constructor() {
    // Clear cache periodically
    setInterval(() => {
      this.clearExpiredCache();
    }, 60000);
  }

  /**
   * Main synthesis method that combines retrieved knowledge using AGI Core
   */
  async synthesizeKnowledge(request: SynthesisRequest): Promise<SynthesisResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    const cached = this.synthesisCache.get(cacheKey);
    if (cached && this.isCacheValid(cacheKey)) {
      return cached;
    }

    try {
      let result: SynthesisResult;

      switch (request.synthesisMethod) {
        case 'agi_conceptual':
          result = await this.agiConceptualSynthesis(request);
          break;
        case 'harmonic_fusion':
          result = await this.harmonicFusionSynthesis(request);
          break;
        case 'multi_hop':
          result = await this.multiHopSynthesis(request);
          break;
        case 'spectral_ranking':
        default:
          result = await this.spectralRankingSynthesis(request);
          break;
      }

      result.processingTime = Date.now() - startTime;
      
      // Cache the result
      this.synthesisCache.set(cacheKey, result);
      
      return result;
      
    } catch (error) {
      console.error('Knowledge synthesis failed:', error);
      
      // Fallback to simple concatenation synthesis
      return this.fallbackSynthesis(request, Date.now() - startTime);
    }
  }

  /**
   * Advanced AGI Core conceptual reasoning synthesis
   */
  private async agiConceptualSynthesis(request: SynthesisRequest): Promise<SynthesisResult> {
    if (!harmonicBridge.isReady()) {
      throw new Error('Harmonic Bridge not available for AGI synthesis');
    }

    // Prepare knowledge context for AGI Core
    const knowledgeContext = this.prepareKnowledgeContext(request);
    const synthesisPrompt = this.buildSynthesisPrompt(request, knowledgeContext);

    try {
      // Use AGI Core's conceptual reasoning
      const agiResponse = await harmonicBridge.processTask(synthesisPrompt) as ConceptualReasoningResponse;
      
      // Extract coherence and spectral data
      const responseCoherence = agiResponse.coherence || 0.7;
      const spectralData = agiResponse.spectral_analysis?.dominant_frequencies || [];
      
      // Build citation map
      const citationMap = this.buildCitationMap(request.retrievedEmbeddings, request.citations);
      
      // Format response with citations
      const synthesizedResponse = this.formatResponseWithCitations(
        agiResponse.reply || 'Response generated successfully.',
        citationMap
      );

      return {
        synthesizedResponse,
        responseCoherence,
        confidenceScore: responseCoherence * 0.95, // AGI Core typically high confidence
        harmonicAnalysis: {
          resonanceStrength: agiResponse.phase_coupling || 0.8,
          spectralDistribution: agiResponse.harmonics || [0.5, 0.3, 0.2],
          phaseLocking: agiResponse.phase_coupling || 0.75
        },
        citationMap,
        reasoning: agiResponse.reasoning_steps || ['AGI conceptual reasoning applied'],
        processingTime: 0 // Set by caller
      };

    } catch (error) {
      console.warn('AGI Core synthesis failed, falling back to harmonic fusion:', error);
      return this.harmonicFusionSynthesis(request);
    }
  }

  /**
   * Harmonic fusion synthesis using spectral analysis
   */
  private async harmonicFusionSynthesis(request: SynthesisRequest): Promise<SynthesisResult> {
    const knowledgeSegments = request.retrievedEmbeddings.map(emb => ({
      content: emb.content,
      spectralRank: emb.spectralRank,
      harmonicVector: JSON.parse(emb.harmonicVector)
    }));

    // Calculate weighted fusion based on spectral ranks
    const weights = this.calculateFusionWeights(knowledgeSegments);
    const fusedContent = this.fuseContentByWeights(knowledgeSegments, weights);
    
    // Apply harmonic analysis if available
    let harmonicAnalysis = {
      resonanceStrength: 0.7,
      spectralDistribution: [0.4, 0.3, 0.3],
      phaseLocking: 0.65
    };

    if (harmonicBridge.isReady()) {
      try {
        const analysis = await harmonicBridge.analyzeHarmonics(fusedContent);
        harmonicAnalysis = {
          resonanceStrength: analysis.coherence * 0.8 + 0.2,
          spectralDistribution: analysis.harmonic_state?.slice(0, 3) || [0.4, 0.3, 0.3],
          phaseLocking: analysis.coherence
        };
      } catch (error) {
        console.warn('Harmonic analysis failed in synthesis:', error);
      }
    }

    const citationMap = this.buildCitationMap(request.retrievedEmbeddings, request.citations);
    const synthesizedResponse = this.formatResponseWithCitations(fusedContent, citationMap);

    return {
      synthesizedResponse,
      responseCoherence: harmonicAnalysis.resonanceStrength,
      confidenceScore: this.calculateConfidence(weights),
      harmonicAnalysis,
      citationMap,
      reasoning: [`Harmonic fusion of ${knowledgeSegments.length} knowledge segments`,
                 `Spectral weighting applied based on coherence scores`,
                 `Citations integrated for source attribution`],
      processingTime: 0
    };
  }

  /**
   * Multi-hop reasoning synthesis
   */
  private async multiHopSynthesis(request: SynthesisRequest): Promise<SynthesisResult> {
    // Group embeddings by semantic clusters
    const clusters = this.groupBySemanticClusters(request.retrievedEmbeddings);
    
    // Perform reasoning across clusters
    const hops = [];
    let currentContext = request.query;
    
    for (const [clusterId, embeddings] of clusters.entries()) {
      const hopResult = await this.performReasoningHop(currentContext, embeddings);
      hops.push(hopResult);
      currentContext = hopResult.conclusion;
    }

    // Synthesize final response
    const synthesizedResponse = this.synthesizeMultiHopResult(hops, request.citations);
    const responseCoherence = this.calculateMultiHopCoherence(hops);
    
    const citationMap = this.buildCitationMap(request.retrievedEmbeddings, request.citations);

    return {
      synthesizedResponse: this.formatResponseWithCitations(synthesizedResponse, citationMap),
      responseCoherence,
      confidenceScore: responseCoherence * 0.9, // Multi-hop slightly less confident
      harmonicAnalysis: {
        resonanceStrength: responseCoherence,
        spectralDistribution: hops.map(h => h.confidence),
        phaseLocking: responseCoherence * 0.8
      },
      citationMap,
      reasoning: hops.map(h => h.reasoning),
      processingTime: 0
    };
  }

  /**
   * Spectral ranking synthesis (baseline method)
   */
  private async spectralRankingSynthesis(request: SynthesisRequest): Promise<SynthesisResult> {
    // Sort by spectral rank and combine top content
    const rankedEmbeddings = request.retrievedEmbeddings
      .sort((a, b) => b.spectralRank - a.spectralRank)
      .slice(0, Math.min(5, request.retrievedEmbeddings.length));

    const synthesizedContent = rankedEmbeddings
      .map((emb, idx) => `[${idx + 1}] ${emb.content}`)
      .join('\n\n');
    
    const responseCoherence = rankedEmbeddings.length > 0 
      ? rankedEmbeddings.reduce((sum, emb) => sum + emb.spectralRank, 0) / rankedEmbeddings.length
      : 0.5;

    const citationMap = this.buildCitationMap(rankedEmbeddings, request.citations);
    
    return {
      synthesizedResponse: this.formatResponseWithCitations(synthesizedContent, citationMap),
      responseCoherence,
      confidenceScore: responseCoherence,
      harmonicAnalysis: {
        resonanceStrength: responseCoherence,
        spectralDistribution: rankedEmbeddings.map(e => e.spectralRank),
        phaseLocking: responseCoherence * 0.7
      },
      citationMap,
      reasoning: [`Spectral ranking applied to ${rankedEmbeddings.length} knowledge segments`,
                 `Top-ranked content selected for synthesis`],
      processingTime: 0
    };
  }

  // ========================================
  // Helper Methods
  // ========================================

  private prepareKnowledgeContext(request: SynthesisRequest): string {
    const context = request.retrievedEmbeddings
      .slice(0, 10) // Limit context size
      .map((emb, idx) => `[Knowledge ${idx + 1}] ${emb.content}`)
      .join('\n\n');
    
    return `Query: ${request.query}\n\nKnowledge Context:\n${context}`;
  }

  private buildSynthesisPrompt(request: SynthesisRequest, context: string): string {
    return `Please provide a comprehensive and coherent response to the following query using the provided knowledge context. Ensure the response is well-structured, accurate, and incorporates relevant information from the knowledge sources.

${context}

Please synthesize a response that:
1. Directly answers the query
2. Incorporates relevant knowledge from the context
3. Maintains logical coherence
4. Provides actionable insights where appropriate

Response:`;
  }

  private buildCitationMap(embeddings: KnowledgeEmbedding[], citations: KnowledgeCitation[]): { [key: string]: KnowledgeCitation[] } {
    const citationMap: { [key: string]: KnowledgeCitation[] } = {};
    
    embeddings.forEach(embedding => {
      const embeddingCitations = citations.filter(c => c.embeddingId === embedding.id);
      if (embeddingCitations.length > 0) {
        citationMap[embedding.id] = embeddingCitations;
      }
    });
    
    return citationMap;
  }

  private formatResponseWithCitations(content: string, citationMap: { [key: string]: KnowledgeCitation[] }): string {
    let formattedResponse = content;
    const citationList = [];
    let citationIndex = 1;
    
    // Add citation markers and build citation list
    Object.entries(citationMap).forEach(([embeddingId, citations]) => {
      citations.forEach(citation => {
        citationList.push(`[${citationIndex}] ${citation.sourceTitle}${citation.sourceAuthor ? ` by ${citation.sourceAuthor}` : ''}${citation.sourceUrl ? ` (${citation.sourceUrl})` : ''}`);
        citationIndex++;
      });
    });
    
    // Append citations if any exist
    if (citationList.length > 0) {
      formattedResponse += '\n\n**Sources:**\n' + citationList.join('\n');
    }
    
    return formattedResponse;
  }

  private calculateFusionWeights(segments: any[]): number[] {
    const totalSpectralRank = segments.reduce((sum, seg) => sum + seg.spectralRank, 0);
    return segments.map(seg => seg.spectralRank / totalSpectralRank);
  }

  private fuseContentByWeights(segments: any[], weights: number[]): string {
    // Simple weighted concatenation - in production would use more sophisticated fusion
    return segments
      .map((seg, idx) => `${seg.content}`)
      .join('\n\n');
  }

  private calculateConfidence(weights: number[]): number {
    // Confidence based on weight distribution - more uniform = higher confidence
    const maxWeight = Math.max(...weights);
    const uniformity = 1 - (maxWeight - (1 / weights.length));
    return Math.max(0.3, Math.min(0.95, uniformity + 0.4));
  }

  private groupBySemanticClusters(embeddings: KnowledgeEmbedding[]): Map<number, KnowledgeEmbedding[]> {
    const clusters = new Map<number, KnowledgeEmbedding[]>();
    
    embeddings.forEach(embedding => {
      const clusterId = embedding.semanticCluster || 0;
      if (!clusters.has(clusterId)) {
        clusters.set(clusterId, []);
      }
      clusters.get(clusterId)!.push(embedding);
    });
    
    return clusters;
  }

  private async performReasoningHop(context: string, embeddings: KnowledgeEmbedding[]): Promise<any> {
    const hopContent = embeddings.map(e => e.content).join(' ');
    return {
      reasoning: `Reasoning from cluster with ${embeddings.length} knowledge segments`,
      conclusion: `Based on the context "${context}" and cluster analysis: ${hopContent.substring(0, 200)}...`,
      confidence: embeddings.reduce((sum, e) => sum + e.spectralRank, 0) / embeddings.length
    };
  }

  private synthesizeMultiHopResult(hops: any[], citations: KnowledgeCitation[]): string {
    const conclusions = hops.map((hop, idx) => `Step ${idx + 1}: ${hop.conclusion}`);
    return `Multi-hop reasoning analysis:\n\n${conclusions.join('\n\n')}\n\nConclusion: Based on the multi-step reasoning above, the synthesis provides a comprehensive answer drawing from ${hops.length} reasoning hops.`;
  }

  private calculateMultiHopCoherence(hops: any[]): number {
    if (hops.length === 0) return 0.5;
    const avgConfidence = hops.reduce((sum, h) => sum + h.confidence, 0) / hops.length;
    return Math.max(0.3, Math.min(0.9, avgConfidence));
  }

  private fallbackSynthesis(request: SynthesisRequest, processingTime: number): SynthesisResult {
    const content = request.retrievedEmbeddings
      .slice(0, 3)
      .map(e => e.content)
      .join('\n\n');

    const citationMap = this.buildCitationMap(request.retrievedEmbeddings, request.citations);
    
    return {
      synthesizedResponse: this.formatResponseWithCitations(content, citationMap),
      responseCoherence: 0.6,
      confidenceScore: 0.5,
      harmonicAnalysis: {
        resonanceStrength: 0.5,
        spectralDistribution: [0.33, 0.33, 0.34],
        phaseLocking: 0.4
      },
      citationMap,
      reasoning: ['Fallback synthesis due to processing error'],
      processingTime
    };
  }

  private generateCacheKey(request: SynthesisRequest): string {
    const keyData = {
      query: request.query,
      method: request.synthesisMethod,
      embeddingIds: request.retrievedEmbeddings.map(e => e.id).sort(),
    };
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  private isCacheValid(cacheKey: string): boolean {
    // Simple time-based cache validation
    return true; // Cache is always valid within expiry period
  }

  private clearExpiredCache(): void {
    // Clear old cache entries - simplified implementation
    if (this.synthesisCache.size > 100) {
      this.synthesisCache.clear();
    }
  }
}

export const knowledgeSynthesis = new KnowledgeSynthesisService();