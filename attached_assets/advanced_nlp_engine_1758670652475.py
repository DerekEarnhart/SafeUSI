"""
advanced_nlp_engine.py
======================

This module defines a simple advanced natural‑language processing engine
for the Sovereign AGI system.  It wraps loading of a large harmonic
model and exposes a method to analyse free‑form queries.  The model
file must be located at the path supplied during construction (by
default ``harmonic_model.json``).  Only the vocabulary mapping is
loaded; the heavyweight embeddings are generated on the fly using
harmonic functions to avoid consuming hundreds of megabytes of RAM.

The ``analyze_query`` method returns a dictionary with the following
fields:

``intent``
    A coarse grained classification of the user's goal, e.g. ``CREATE_FUNCTION`` or
    ``DEBUG_CODE``.  See ``classify_intent`` for details.

``domain``
    The broad technical domain inferred from keywords.  Possible values
    include ``algorithm``, ``web_development``, ``data_science``, ``machine_learning``
    and ``system``.

``topics``
    A list of specific keywords identified within the query that hint
    at subject matter (e.g. ``numpy``, ``sql``, ``neural``).

``complexity``
    A qualitative measure of the query's length and specificity:
    ``LOW``, ``MEDIUM`` or ``HIGH``.

``entities``
    A list of named technologies, languages or frameworks referenced in
    the query.

``ambiguous``
    A boolean flag indicating whether the engine considers the query too
    short or unclear to answer directly.

``clarification_questions``
    If ambiguous, a list of follow‑up questions that the system may
    present to the user to gather more information.

The heuristics implemented here are intentionally lightweight and
interpretable.  They do not rely on pre‑trained transformer models or
external APIs, making the engine suitable for offline use with
minimal dependencies.
"""

from __future__ import annotations

import json
import math
import os
import re
from typing import Dict, List, Tuple


class AdvancedNLPEngine:
    """
    A minimalist natural language processing engine that leverages a
    large harmonic vocabulary.  Only the ``word_to_index`` mapping is
    loaded from disk; embeddings are computed on the fly using a
    sinusoidal function.  Query analysis relies on straightforward
    heuristics based around keyword detection and message length.
    """
    def __init__(self, model_path: str = 'harmonic_model.json') -> None:
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file '{model_path}' does not exist.")
        with open(model_path, 'r') as f:
            data = json.load(f)
        # Only load the mapping; embeddings are not loaded to conserve memory
        self.word_to_index: Dict[str, int] = data.get('word_to_index', {})
        # Determine embedding dimension from model length; default to 128
        # if not provided or file is incomplete.
        sample_idx = next(iter(data.get('embeddings', {})), None)
        if sample_idx is not None:
            self.embedding_dim = len(data['embeddings'][sample_idx])
        else:
            self.embedding_dim = 128
        self.phi = (1 + 5**0.5) / 2

    # ---------------------------------------------------------------------
    # Embedding utilities
    def embed(self, text: str) -> List[float]:
        """
        Compute a harmonic embedding for the supplied text.  Each word is
        mapped to an index via ``self.word_to_index``; unknown words are
        assigned a unique index beyond the existing vocabulary.  The
        resulting vector is the mean of the sine‑based embeddings for
        each token.
        """
        tokens = re.findall(r"\b\w+\b", text.lower())
        if not tokens:
            return [0.0] * self.embedding_dim
        vec = [0.0] * self.embedding_dim
        for token in tokens:
            idx = self.word_to_index.get(token)
            if idx is None:
                # Unknown words get assigned to a deterministic index
                idx = len(self.word_to_index) + abs(hash(token)) % 10000
            for i in range(self.embedding_dim):
                vec[i] += math.sin(idx + i * self.phi)
        # Average over tokens
        vec = [v / len(tokens) for v in vec]
        return vec

    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        dot = sum(a*b for a, b in zip(vec1, vec2))
        norm1 = math.sqrt(sum(a*a for a in vec1))
        norm2 = math.sqrt(sum(b*b for b in vec2))
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return dot / (norm1 * norm2)

    # ---------------------------------------------------------------------
    # High level query analysis
    def classify_intent(self, query: str) -> str:
        q = query.lower()
        # Function creation
        if (any(word in q for word in ['create', 'write', 'build', 'generate'])
                and any(word in q for word in ['function', 'class', 'script', 'module'])):
            return 'CREATE_FUNCTION'
        # Optimisation
        if any(word in q for word in ['optimise', 'optimize', 'improve', 'efficient']):
            return 'OPTIMIZE_CODE'
        # Debugging
        if any(word in q for word in ['debug', 'error', 'bug', 'fault']):
            return 'DEBUG_CODE'
        # Explanation
        if any(word in q for word in ['explain', 'describe', 'what is', 'define']):
            return 'EXPLAIN_CONCEPT'
        # Analysis
        if any(word in q for word in ['analyse', 'analyze', 'analysis']):
            return 'ANALYZE'
        return 'GENERAL_QUERY'

    def detect_domain_topic(self, query: str) -> Tuple[str, List[str]]:
        q = query.lower()
        # Domain keyword mapping
        domains = {
            'algorithm': ['sort', 'search', 'graph', 'tree', 'dynamic', 'palindrome', 'array', 'linked list'],
            'web_development': ['html', 'css', 'javascript', 'flask', 'django', 'react', 'angular', 'vue'],
            'data_science': ['numpy', 'pandas', 'dataframe', 'plot', 'chart', 'statistics', 'analysis'],
            'database': ['sql', 'database', 'postgres', 'mysql', 'mongodb', 'query'],
            'machine_learning': ['model', 'train', 'neural', 'regression', 'classification', 'svm', 'cluster'],
            'system': ['thread', 'process', 'memory', 'cpu', 'concurrency', 'network', 'socket'],
        }
        domain = 'general'
        found_topics: List[str] = []
        for dom, keywords in domains.items():
            hits = [kw for kw in keywords if kw in q]
            if hits:
                domain = dom
                found_topics.extend(hits)
        return domain, sorted(set(found_topics))

    def compute_complexity(self, query: str) -> str:
        length = len(query.split())
        if length < 5:
            return 'LOW'
        if length < 20:
            return 'MEDIUM'
        return 'HIGH'

    def extract_entities(self, query: str) -> List[str]:
        q = query.lower()
        languages = ['python', 'javascript', 'java', 'c++', 'c#', 'go', 'ruby', 'swift', 'typescript', 'kotlin']
        frameworks = ['flask', 'django', 'react', 'angular', 'vue', 'fastapi']
        libs = ['numpy', 'pandas', 'matplotlib', 'seaborn', 'tensorflow', 'pytorch', 'keras']
        entities: List[str] = []
        for token in languages + frameworks + libs:
            if token in q:
                entities.append(token)
        return entities

    def detect_ambiguity(self, query: str) -> Tuple[bool, List[str]]:
        """
        Determine whether a query is ambiguous or underspecified.  A query
        is flagged as ambiguous if it is very short or lacks obvious
        intent indicators.  The method returns a tuple of
        ``(is_ambiguous, clarification_questions)``.
        """
        q = query.lower().strip()
        words = q.split()
        ambiguous = False
        questions: List[str] = []
        # Too short or no verbs
        verbs = ['create', 'write', 'build', 'generate', 'debug', 'explain', 'define', 'optimise', 'optimize']
        if len(words) < 3 or not any(verb in q for verb in verbs):
            ambiguous = True
            questions.append('Could you provide more details about what you would like me to do?')
        # Ambiguous function reference
        if 'function' in q and not any(word in q for word in ['create', 'write', 'build', 'generate']):
            ambiguous = True
            questions.append('Do you want to create a new function or modify an existing one?')
        return ambiguous, questions

    def analyze_query(self, query: str) -> Dict[str, any]:
        """
        Perform a full analysis of the supplied query and return a
        dictionary of attributes describing the user's intent and
        context.
        """
        intent = self.classify_intent(query)
        domain, topics = self.detect_domain_topic(query)
        complexity = self.compute_complexity(query)
        entities = self.extract_entities(query)
        ambiguous, clar = self.detect_ambiguity(query)
        return {
            'intent': intent,
            'domain': domain,
            'topics': topics,
            'complexity': complexity,
            'entities': entities,
            'ambiguous': ambiguous,
            'clarification_questions': clar,
        }