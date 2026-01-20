# voynich_harmonic_embedder.py
# This module prepares Voynich data for harmonic analysis by converting
# tokens into multi-dimensional embeddings, the first step towards applying
# the Hodge filter and other concepts from the Harmonic Algebra framework.

import hashlib
import numpy as np
import json
from typing import List, Dict, Tuple, Optional
import asyncio

# Placeholder for the Standard Token Alphabet (STA)
# In a real system, this would be a complete, well-defined mapping of all Voynich glyphs.
STA_MAPPING = {
    'qokedy': 1, 'dal': 2, 'shol': 3, 'aiin': 4, 'iin': 5, 'eee': 6,
    'chedy': 7, 'shedy': 8, 'kedy': 9, 'qo': 10, 'ar': 11, 'ol': 12,
    'dy': 13, 'fachys': 14, 'ykal': 15, 'at': 16, 'aiin': 17, 'shory': 18,
    'cthres': 19, 'y': 20, 'kor': 21, 'sholdy': 22, 'dain': 23, 'sheky': 24,
    'kol': 25, 'cheal': 26, 'chol': 27, 'qotedy': 28, 'qokain': 29, 'fchedy': 30,
    'edy': 31, 'or': 32, 'al': 33, 'sho': 34, 'cho': 35, 'she': 36, 'che': 37,
    'dar': 38, 'shear': 39, 'qol': 40, 'dair': 41, 'shey': 42, 'sheol': 43,
    'chor': 44, 'shor': 45, 'ytain': 46, 'ykaiin': 47, 'ytor': 48, 'ytol': 49,
    'sal': 50, 'daiin': 51, 'qotchedy': 52, 'qockhedy': 53, 'thor': 54, 'fhor': 55
}

class HarmonicEmbedder:
    """
    Converts a sequence of Voynich tokens into harmonic embeddings.
    Enhanced for integration with WSM advanced computational paradigms.
    """
    def __init__(self, sta_mapping: dict, embedding_dim: int = 101):
        """
        Initializes the embedder with a STA mapping and embedding dimension.
        The 101-dimensional space is based on the Hodge diamond concepts
        from the harmonic algebra framework.
        """
        self.sta_mapping = sta_mapping
        self.embedding_dim = embedding_dim
        self.embedding_cache = {}
        self.harmonic_resonance_patterns = {}
        self.phase_locked_states = []
        
    def _generate_harmonic_vector(self, token: str) -> np.ndarray:
        """
        Generates a unique, high-dimensional vector for a given token.
        This is a placeholder for a more complex process that would involve
        the Quantum-Harmonic Constraint Solver (HCS) to learn the embeddings.
        For now, we use a simple, deterministic approach based on hashing.
        """
        # A deterministic hash ensures the same token always gets the same vector
        token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
        np.random.seed(int(token_hash[:8], 16)) # Use a portion of the hash as a seed
        
        # Generate harmonic embedding with golden ratio frequencies
        vector = np.zeros(self.embedding_dim)
        phi = 1.618033988749  # Golden ratio
        
        for i in range(self.embedding_dim):
            # Create harmonic oscillations at golden ratio frequencies
            frequency = phi ** (i / 10.0)
            phase = int(token_hash[i % len(token_hash)], 16) / 16.0 * 2 * np.pi
            amplitude = np.sin(frequency + phase) * 0.5
            vector[i] = amplitude
        
        # Normalize for stability
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
            
        return vector

    def get_embedding(self, token: str) -> np.ndarray:
        """
        Retrieves the harmonic embedding for a token, using a cache to
        avoid recomputing.
        """
        if token not in self.embedding_cache:
            if token not in self.sta_mapping:
                print(f"Warning: Token '{token}' not found in STA mapping. Generating a random vector.")
                self.sta_mapping[token] = len(self.sta_mapping) + 1
            
            self.embedding_cache[token] = self._generate_harmonic_vector(token)
            
        return self.embedding_cache[token]

    def embed_corpus(self, corpus_tokens: list) -> list:
        """
        Converts an entire list of tokenized words into a list of
        harmonic embeddings.
        """
        embeddings = []
        for word in corpus_tokens:
            word_embedding = [self.get_embedding(token) for token in word]
            embeddings.append(word_embedding)
        return embeddings

    def analyze_harmonic_resonance(self, embeddings: List[np.ndarray]) -> Dict[str, float]:
        """
        Analyzes harmonic resonance patterns in the embeddings
        to detect phase-locked states and coherent structures.
        """
        if len(embeddings) < 2:
            return {"resonance": 0.0, "coherence": 0.0, "phase_lock": 0.0}
        
        # Calculate cross-correlation matrix
        correlation_matrix = np.zeros((len(embeddings), len(embeddings)))
        for i, emb1 in enumerate(embeddings):
            for j, emb2 in enumerate(embeddings):
                if np.linalg.norm(emb1) > 0 and np.linalg.norm(emb2) > 0:
                    correlation = np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
                    correlation_matrix[i, j] = correlation
        
        # Calculate resonance metrics
        resonance = float(np.mean(np.abs(correlation_matrix)))
        coherence = float(1.0 - np.std(correlation_matrix))  # Lower std = higher coherence
        phase_lock = float(np.max(correlation_matrix) - np.min(correlation_matrix))
        
        return {
            "resonance": resonance,
            "coherence": max(0.0, coherence),
            "phase_lock": phase_lock,
            "correlation_matrix": correlation_matrix.tolist()
        }

    def detect_topological_features(self, word_embeddings: List[List[np.ndarray]]) -> Dict[str, any]:
        """
        Detects topological features in the embedded Voynich text
        using harmonic analysis principles.
        """
        all_embeddings = []
        word_boundaries = []
        current_pos = 0
        
        # Flatten embeddings while tracking word boundaries
        for word in word_embeddings:
            all_embeddings.extend(word)
            word_boundaries.append((current_pos, current_pos + len(word)))
            current_pos += len(word)
        
        if not all_embeddings:
            return {"features": [], "word_resonances": []}
        
        # Calculate harmonic features
        resonance_analysis = self.analyze_harmonic_resonance(all_embeddings)
        
        # Analyze word-level resonances
        word_resonances = []
        for start, end in word_boundaries:
            word_embs = all_embeddings[start:end]
            if len(word_embs) > 1:
                word_res = self.analyze_harmonic_resonance(word_embs)
                word_resonances.append(word_res)
            else:
                word_resonances.append({"resonance": 0.0, "coherence": 0.0, "phase_lock": 0.0})
        
        return {
            "global_resonance": resonance_analysis,
            "word_resonances": word_resonances,
            "topological_invariants": {
                "betti_numbers": [len(word_boundaries), len(all_embeddings)],
                "euler_characteristic": len(word_boundaries) - len(all_embeddings) + 1
            }
        }

class VoynichHarmonicAnalyzer:
    """
    High-level analyzer for Voynich manuscript harmonic patterns.
    Integrates with WSM advanced computational paradigms.
    """
    
    def __init__(self):
        self.embedder = HarmonicEmbedder(STA_MAPPING)
        self.manuscript_patterns = {}
        self.harmonic_signatures = {}
        
    async def analyze_manuscript_section(self, tokens: List[List[str]], section_id: str) -> Dict[str, any]:
        """
        Analyzes a section of the Voynich manuscript for harmonic patterns.
        """
        # Embed the tokens
        embeddings = self.embedder.embed_corpus(tokens)
        
        # Detect topological features
        topological_features = self.embedder.detect_topological_features(embeddings)
        
        # Calculate harmonic signature
        all_embeddings = []
        for word_embs in embeddings:
            all_embeddings.extend(word_embs)
        
        harmonic_signature = None
        if all_embeddings:
            # Create a unique harmonic signature for this section
            combined_embedding = np.mean(all_embeddings, axis=0)
            harmonic_signature = {
                "mean_embedding": combined_embedding.tolist(),
                "harmonic_frequencies": np.fft.fft(combined_embedding).real.tolist(),
                "dominant_modes": np.argsort(np.abs(combined_embedding))[-10:].tolist()
            }
        
        analysis_result = {
            "section_id": section_id,
            "token_count": sum(len(word) for word in tokens),
            "word_count": len(tokens),
            "topological_features": topological_features,
            "harmonic_signature": harmonic_signature,
            "embedding_dimensions": self.embedder.embedding_dim,
            "coherence_score": topological_features["global_resonance"]["coherence"],
            "resonance_score": topological_features["global_resonance"]["resonance"]
        }
        
        # Store for future analysis
        self.manuscript_patterns[section_id] = analysis_result
        if harmonic_signature:
            self.harmonic_signatures[section_id] = harmonic_signature
        
        return analysis_result
    
    async def compare_sections(self, section_id1: str, section_id2: str) -> Dict[str, float]:
        """
        Compares harmonic patterns between two manuscript sections.
        """
        if section_id1 not in self.harmonic_signatures or section_id2 not in self.harmonic_signatures:
            return {"error": "One or both sections not analyzed yet"}
        
        sig1 = self.harmonic_signatures[section_id1]
        sig2 = self.harmonic_signatures[section_id2]
        
        # Compare harmonic signatures
        emb1 = np.array(sig1["mean_embedding"])
        emb2 = np.array(sig2["mean_embedding"])
        
        # Calculate similarity metrics
        if np.linalg.norm(emb1) > 0 and np.linalg.norm(emb2) > 0:
            cosine_similarity = np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
        else:
            cosine_similarity = 0.0
            
        euclidean_distance = float(np.linalg.norm(emb1 - emb2))
        
        # Compare frequency domains
        freq1 = np.array(sig1["harmonic_frequencies"])
        freq2 = np.array(sig2["harmonic_frequencies"])
        
        if len(freq1) > 1 and len(freq2) > 1:
            frequency_correlation = float(np.corrcoef(freq1, freq2)[0, 1])
        else:
            frequency_correlation = 0.0
        
        return {
            "cosine_similarity": float(cosine_similarity),
            "euclidean_distance": euclidean_distance,
            "frequency_correlation": frequency_correlation,
            "harmonic_compatibility": float((cosine_similarity + frequency_correlation) / 2)
        }
    
    def get_analysis_summary(self) -> Dict[str, any]:
        """
        Returns a summary of all analyzed sections.
        """
        if not self.manuscript_patterns:
            return {"message": "No sections analyzed yet"}
        
        coherence_scores = [pattern["coherence_score"] for pattern in self.manuscript_patterns.values()]
        resonance_scores = [pattern["resonance_score"] for pattern in self.manuscript_patterns.values()]
        
        return {
            "total_sections": len(self.manuscript_patterns),
            "average_coherence": float(np.mean(coherence_scores)),
            "average_resonance": float(np.mean(resonance_scores)),
            "coherence_std": float(np.std(coherence_scores)),
            "sections": list(self.manuscript_patterns.keys()),
            "embedding_dimensions": self.embedder.embedding_dim,
            "total_unique_tokens": len(self.embedder.embedding_cache)
        }

# Global analyzer instance
voynich_analyzer = VoynichHarmonicAnalyzer()

async def analyze_voynich_manuscript(tokens: List[List[str]], section_id: str) -> Dict[str, any]:
    """
    Main function to analyze Voynich manuscript sections.
    """
    return await voynich_analyzer.analyze_manuscript_section(tokens, section_id)

async def compare_voynich_sections(section_id1: str, section_id2: str) -> Dict[str, float]:
    """
    Compare harmonic patterns between two sections.
    """
    return await voynich_analyzer.compare_sections(section_id1, section_id2)

def get_voynich_analysis_summary() -> Dict[str, any]:
    """
    Get summary of all Voynich analyses.
    """
    return voynich_analyzer.get_analysis_summary()

# --- Example Usage ---
async def main():
    """
    Example run to demonstrate the harmonic embedding process.
    """
    print("--- Starting Voynich Harmonic Analysis Demonstration ---")
    
    # 1. Prepare sample data (from the test output)
    sample_corpus = [
        ['qokedy', 'dal', 'qokedy', 'qokedy'],
        ['chedy', 'qo', 'shedy', 'qo', 'kedy', 'qo', 'edy', 'qo', 'dy'],
        ['sal', 'daiin', 'sal', 'shol', 'sal', 'chol']
    ]

    # 2. Analyze the sample corpus
    analysis_result = await analyze_voynich_manuscript(sample_corpus, "sample_section_1")
    
    # 3. Print results
    print("\nCorpus successfully analyzed for harmonic patterns.")
    print(f"Coherence Score: {analysis_result['coherence_score']:.3f}")
    print(f"Resonance Score: {analysis_result['resonance_score']:.3f}")
    print(f"Token Count: {analysis_result['token_count']}")
    print(f"Word Count: {analysis_result['word_count']}")
    
    # 4. Get summary
    summary = get_voynich_analysis_summary()
    print(f"\nAnalysis Summary:")
    print(f"Average Coherence: {summary['average_coherence']:.3f}")
    print(f"Total Unique Tokens: {summary['total_unique_tokens']}")

if __name__ == "__main__":
    asyncio.run(main())