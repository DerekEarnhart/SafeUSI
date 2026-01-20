#!/usr/bin/env python3
"""
Unified Sovereign AGI System with Web Frontend
================================================

This module spins up a simple Flask/Socket.IO powered backend for an
interactive AGI-like workspace.  It glues together a handful of
capabilities—memory storage, question answering, code generation and
simulation—behind a common API.  The backend also wires in an
advanced natural‑language engine to classify and analyse incoming
queries.  The engine draws from a large harmonic model (100k+ words)
for its vocabulary and then applies lightweight heuristics to infer
intent, domain, complexity and named entities.

To run the server locally:

1. Ensure that ``harmonic_model.json`` (generated ahead of time) and
   ``advanced_nlp_engine.py`` live alongside this file.  The model
   weighs in at around 255 MB for 100k words and must be present
   before launching the backend.
2. Execute ``python sovereign_Agi_Backend.py`` from the terminal.
3. Open ``enhanced_agi_workspace.html`` in your browser.  The page
   connects via Socket.IO to ``http://localhost:5001`` and will
   greet you when the backend is ready.

The design emphasises readability over raw performance.  Should you
wish to extend this backend—for example to add new agents or intents—
look at the ``Coordinator`` and ``BaseAgent`` classes to see how
messages are dispatched.
"""

import asyncio
import json
import textwrap
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple, Callable

import numpy as np
import re

# ---------------------------------------------------------------------------
# Eventlet monkey‑patching must occur before importing Flask or socketio.
# Without this patch the default blocking versions of socket and time will
# interfere with async tasks and throw ``RuntimeError`` exceptions when
# awaiting from within background tasks.

try:
    import eventlet  # type: ignore
    eventlet.monkey_patch()
    print("Eventlet monkey_patch successful.")
except Exception as e:  # pragma: no cover - fallback for systems without eventlet
    print(f"Warning: eventlet not installed or failed to patch: {e}")
    eventlet = None

# ---------------------------------------------------------------------------
# Web server components
from flask import Flask  # type: ignore
from flask_socketio import SocketIO  # type: ignore

# ---------------------------------------------------------------------------
# Import the advanced NLP engine.  The engine encapsulates heavy model
# loading and exposes a high level ``analyze_query`` API.  See
# ``advanced_nlp_engine.py`` for implementation details.

try:
    from advanced_nlp_engine import AdvancedNLPEngine  # type: ignore
except Exception as exc:
    # Provide a helpful message if the import fails.  The server will
    # still start, but queries will lack intent analysis.
    print(f"Warning: Could not import AdvancedNLPEngine: {exc}.\n"
          "Ensure advanced_nlp_engine.py is present in the same directory.")
    AdvancedNLPEngine = None  # type: ignore

# ---------------------------------------------------------------------------
# Foundational components

class EventBus:
    """A simple publish/subscribe event bus used internally for decoupling."""
    def __init__(self) -> None:
        self.subscribers: Dict[str, List[Callable[[Any], None]]] = {}

    def subscribe(self, event_type: str, handler: Callable[[Any], None]) -> None:
        self.subscribers.setdefault(event_type, []).append(handler)

    def publish(self, event_type: str, payload: Any) -> None:
        for handler in self.subscribers.get(event_type, []):
            handler(payload)


# ---------------------------------------------------------------------------
# Harmonic Language Processor (lightweight fallback)
#
# This simplified processor uses harmonic principles to embed text into
# vectors.  It is retained to support legacy capabilities such as
# similarity search in the memory agent.  It does NOT load the large
# 100k‑word model; instead it dynamically creates embeddings on the fly.

@dataclass
class HarmonicEmbedding:
    vector: np.ndarray
    frequency: float
    phase: float
    amplitude: float


class HarmonicLanguageProcessor:
    """
    A lightweight harmonic language processor.  Words are mapped to
    unique indices as they are encountered and then embedded using a
    sine‑based function.  This avoids loading the entire harmonic
    model into memory for basic operations.
    """
    def __init__(self, embedding_dim: int = 128) -> None:
        self.phi = (1 + np.sqrt(5)) / 2
        self.embedding_dimension = embedding_dim
        self.word_to_index: Dict[str, int] = {}
        self.index_to_word: Dict[int, str] = {}
        self.next_word_index: int = 0

    def _get_word_index(self, word: str) -> int:
        if word not in self.word_to_index:
            self.word_to_index[word] = self.next_word_index
            self.index_to_word[self.next_word_index] = word
            self.next_word_index += 1
        return self.word_to_index[word]

    def embed(self, text: str) -> HarmonicEmbedding:
        tokens = re.findall(r"\b\w+\b", text.lower())
        vector = np.zeros(self.embedding_dimension)
        if not tokens:
            return HarmonicEmbedding(vector, 0.0, 0.0, 0.0)
        for token in tokens:
            idx = self._get_word_index(token)
            for i in range(self.embedding_dimension):
                vector[i] += np.sin(idx + (i * self.phi))
        vector /= len(tokens)
        amplitude = np.linalg.norm(vector)
        fft_result = np.fft.fft(vector)
        if len(fft_result) > 2:
            frequency = np.argmax(np.abs(fft_result[1:self.embedding_dimension // 2])) + 1
            phase = float(np.angle(fft_result[frequency]))
        else:
            frequency = 0
            phase = 0.0
        return HarmonicEmbedding(vector=vector, frequency=float(frequency), phase=phase, amplitude=float(amplitude))

    def similarity(self, text1: str, text2: str) -> float:
        emb1 = self.embed(text1).vector
        emb2 = self.embed(text2).vector
        dot_product = float(np.dot(emb1, emb2))
        norm1 = float(np.linalg.norm(emb1))
        norm2 = float(np.linalg.norm(emb2))
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return dot_product / (norm1 * norm2)


# ---------------------------------------------------------------------------
# Enhanced AGI Coder (simplified)

class EnhancedAGICoder:
    """
    A streamlined AGI coding assistant.  Given a free‑form problem
    description, it generates a placeholder function with a name
    derived from the query.  In a more sophisticated implementation
    this class could call an LLM or code synthesis engine.
    """
    def __init__(self) -> None:
        self.phi = (1 + np.sqrt(5)) / 2

    def solve_programming_problem(self, problem_description: str, language: str = "python") -> Dict[str, Any]:
        safe_desc = re.sub(r'[^a-zA-Z0-9_ ]', '', problem_description)
        function_name = "_".join(safe_desc.lower().split()[:4]) or "solve_problem"
        # Build the function body line by line to avoid nested triple quotes
        solution_lines = []
        solution_lines.append(f"# Solution generated by EnhancedAGICoder with harmonic optimisation (phi = {self.phi})")
        solution_lines.append(f"def {function_name}():")
        solution_lines.append("    \"\"\"")
        solution_lines.append(f"    This function aims to solve: {problem_description}")
        solution_lines.append("    \"\"\"")
        solution_lines.append(f"    print(\"Solving '{problem_description}'...\")")
        solution_lines.append("    # Further implementation would go here.")
        solution_lines.append("    return \"Solution placeholder\"")
        solution_code = "\n".join(solution_lines)
        return {
            "status": "SUCCESS",
            "solution_code": textwrap.dedent(solution_code).strip(),
            "explanation": "The solution was generated using harmonic principles and mathematical optimisation.",
            "confidence_level": 0.90 + np.random.rand() * 0.1,
        }


# ---------------------------------------------------------------------------
# Multi‑agent system definitions

class BaseAgent:
    """A base class from which all agents inherit.  Provides a default
    ``handle`` method that returns a polite error when a capability is
    unrecognised."""
    def __init__(self, coordinator: 'Coordinator', name: str, capabilities: List[str]) -> None:
        self.coordinator = coordinator
        self.name = name
        self.capabilities = capabilities

    async def handle(self, intent: str, payload: Dict[str, Any]) -> str:
        return f"Agent '{self.name}' does not support intent '{intent}'."


class MemoryAgent(BaseAgent):
    """
    Stores and retrieves knowledge snippets.  This includes files
    uploaded from the frontend.  Entries are stored as (key, text)
    pairs in ``self.store``.  For textual recall operations the
    harmonic language processor is used to rank results.
    """
    def __init__(self, coordinator: 'Coordinator') -> None:
        super().__init__(coordinator, name="memory", capabilities=["memory.store", "memory.recall"])
        self.store: List[Tuple[str, str]] = []
        self.harmonic_memory = HarmonicLanguageProcessor()

    async def handle(self, intent: str, payload: Dict[str, Any]) -> str:
        args: List[str] = payload.get('args', [])
        file_data: Optional[Dict[str, Any]] = payload.get('file')
        if intent == "memory.store":
            # File upload
            if file_data:
                try:
                    file_name: str = file_data.get('name', 'unknown_file')
                    # We do not persist file contents; instead we
                    # acknowledge receipt and allow memory queries on
                    # the filename itself.  A real implementation
                    # would index the file contents here.
                    self.store.append((file_name.lower(), f"[File Content of {file_name}]"))
                    return f"File '{file_name}' received and stored in memory. You can now ask questions about it."
                except Exception as e:
                    return f"Error processing file: {e}"
            # Textual memory
            if len(args) < 2:
                return "Usage: memory.store <key> <text_to_store>"
            key = args[0]
            text = " ".join(args[1:])
            self.store.append((key.lower(), text))
            return f"Stored under key '{key}'."
        elif intent == "memory.recall":
            if not args:
                return "Please specify a keyword to recall."
            query = " ".join(args).lower()
            # Check for exact key match
            if any(query in item[0] for item in self.store):
                return f"I have information about '{query}' in my memory. What would you like to know?"
            # Otherwise compute similarity over stored entries
            results = sorted(self.store, key=lambda item: self.harmonic_memory.similarity(query, item[0] + " " + item[1]), reverse=True)
            if not results:
                return f"No relevant entries found for '{query}'."
            best_score = self.harmonic_memory.similarity(query, results[0][0] + " " + results[0][1])
            if best_score < 0.20:
                return f"No relevant entries found for '{query}'."
            return "\n".join([f"- {txt} (key: {key})" for (key, txt) in results[:3]])
        return await super().handle(intent, payload)


class QueryAgent(BaseAgent):
    """
    Processes natural language queries.  When an intent isn't
    recognised it falls back to this agent's ``ask`` capability,
    which consults memory and also uses the advanced NLP engine to
    analyse the query.  Additionally it can perform a simulated
    ``search`` (placeholder behaviour).
    """
    def __init__(self, coordinator: 'Coordinator', nlp_engine: Optional[AdvancedNLPEngine] = None) -> None:
        super().__init__(coordinator, name="query", capabilities=["search", "ask", "nlp.analysis"])
        self.nlp = HarmonicLanguageProcessor()
        self.advanced = nlp_engine

    async def handle(self, intent: str, payload: Dict[str, Any]) -> str:
        args = payload.get('args', [])
        query = " ".join(args)
        # Provide simulated web search results
        if intent == "search":
            await asyncio.sleep(0.1)
            return f"(Simulated search result for '{query}')\nThis would contain a summary of top web results."
        # Ask with memory recall and advanced analysis
        elif intent == "ask":
            memory_response = await self.coordinator.dispatch("memory.recall", {'args': args})
            preamble = "I don't have specific knowledge on that."
            if "No relevant entries found" not in memory_response:
                preamble = f"Based on my memory:\n{memory_response}\n\nAdditionally:"
            analysis = ""
            if self.advanced:
                try:
                    nlp_info = self.advanced.analyze_query(query)
                    analysis = (f"\nNLP Analysis:\n"
                                f"- Intent: {nlp_info['intent']}\n"
                                f"- Domain: {nlp_info['domain']}\n"
                                f"- Topics: {', '.join(nlp_info['topics']) or 'none'}\n"
                                f"- Complexity: {nlp_info['complexity']}\n"
                                f"- Entities: {', '.join(nlp_info['entities']) or 'none'}\n")
                    if nlp_info.get('ambiguous'):
                        clar = nlp_info.get('clarification_questions', [])
                        if clar:
                            analysis += "\nClarification questions:\n" + "\n".join([f"  - {c}" for c in clar]) + "\n"
                except Exception as err:
                    analysis = f"\n(Warning: NLP engine error: {err})\n"
            return f"{preamble}\nHere is a generated answer to your question: '{query}'.{analysis}"
        # Expose NLP analysis directly
        elif intent == "nlp.analysis":
            if not self.advanced:
                return "NLP engine is unavailable."
            nlp_info = self.advanced.analyze_query(query)
            resp = []
            resp.append(f"Intent: {nlp_info['intent']}")
            resp.append(f"Domain: {nlp_info['domain']}")
            resp.append(f"Topics: {', '.join(nlp_info['topics']) or 'none'}")
            resp.append(f"Complexity: {nlp_info['complexity']}")
            resp.append(f"Entities: {', '.join(nlp_info['entities']) or 'none'}")
            if nlp_info.get('ambiguous'):
                resp.append("Ambiguous: Yes")
                clar = nlp_info.get('clarification_questions', [])
                if clar:
                    resp.append("Clarification questions:\n" + "\n".join([f"  - {c}" for c in clar]))
            else:
                resp.append("Ambiguous: No")
            return "\n".join(resp)
        return await super().handle(intent, payload)


class CodeAgent(BaseAgent):
    """Generates code snippets on demand."""
    def __init__(self, coordinator: 'Coordinator') -> None:
        super().__init__(coordinator, name="code", capabilities=["generate_code"])
        self.coder = EnhancedAGICoder()

    async def handle(self, intent: str, payload: Dict[str, Any]) -> str:
        args: List[str] = payload.get('args', [])
        if intent == "generate_code":
            if not args:
                return "Please provide a description for the code you want to generate."
            description = " ".join(args)
            result = self.coder.solve_programming_problem(description)
            return ("--- Generated Code ---\n[CODE_BLOCK]\n"
                    f"{result['solution_code']}\n[/CODE_BLOCK]\n\n"
                    "--- Explanation ---\n"
                    f"{result['explanation']}")
        return await super().handle(intent, payload)


class SimulationAgent(BaseAgent):
    """Placeholder for a simulation agent."""
    def __init__(self, coordinator: 'Coordinator') -> None:
        super().__init__(coordinator, name="simulation", capabilities=["simulate"])

    async def handle(self, intent: str, payload: Dict[str, Any]) -> str:
        args: List[str] = payload.get('args', [])
        if intent == "simulate":
            scenario = " ".join(args)
            await asyncio.sleep(0.1)
            return f"(Simulation stub) Would run a simulation for: {scenario}"
        return await super().handle(intent, payload)


# ---------------------------------------------------------------------------
# Governance layer

class Supervisor:
    """A simplified governance layer that screens commands for banned
    keywords and enforces ethical guidelines."""
    def __init__(self) -> None:
        self.ethical_guidelines = [
            "Provide accurate and helpful information",
            "Avoid harmful or dangerous content",
        ]
        self.banned_keywords = ["harm", "illegal", "dangerous"]

    def check_alignment(self, command: str) -> Tuple[bool, str]:
        cmd_lower = command.lower()
        for keyword in self.banned_keywords:
            if keyword in cmd_lower:
                return False, f"Command '{command}' violates safety protocols (contains '{keyword}')."
        return True, "Command is aligned with safety protocols."


# ---------------------------------------------------------------------------
# Orchestrator

class Coordinator:
    """Central controller that registers agents and dispatches intents."""
    def __init__(self, nlp_engine: Optional[AdvancedNLPEngine] = None) -> None:
        self.agents: Dict[str, BaseAgent] = {}
        self.capability_map: Dict[str, BaseAgent] = {}
        self.supervisor = Supervisor()
        self.nlp_engine = nlp_engine

    def register_agent(self, agent: BaseAgent) -> None:
        self.agents[agent.name] = agent
        for cap in agent.capabilities:
            self.capability_map.setdefault(cap, agent)

    async def dispatch(self, intent: str, payload: Dict[str, Any]) -> str:
        agent = self.capability_map.get(intent)
        if not agent:
            # Fallback: send to query agent's ask capability
            return await self.agents["query"].handle("ask", {'args': [intent] + payload.get('args', [])})
        return await agent.handle(intent, payload)

    async def interpret_command(self, payload: Dict[str, Any]) -> str:
        command: str = payload.get('command', '')
        aligned, message = self.supervisor.check_alignment(command)
        if not aligned:
            return f"SUPERVISOR ALERT: {message}"
        parts = command.strip().split()
        if not parts:
            return "Please enter a command."
        intent = parts[0]
        args = parts[1:]
        dispatch_payload = payload.copy()
        dispatch_payload['args'] = args
        return await self.dispatch(intent, dispatch_payload)


# ---------------------------------------------------------------------------
# Web application setup
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret-key-for-sovereign-agi'
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialise NLP engine (if available)
_nlp_engine: Optional[AdvancedNLPEngine] = None
if AdvancedNLPEngine is not None:
    try:
        _nlp_engine = AdvancedNLPEngine(model_path='harmonic_model.json')
        print("Advanced NLP engine initialised.")
    except Exception as err:
        print(f"Failed to initialise NLP engine: {err}")
        _nlp_engine = None

# Instantiate coordinator and agents
coordinator = Coordinator(nlp_engine=_nlp_engine)
coordinator.register_agent(MemoryAgent(coordinator))
coordinator.register_agent(QueryAgent(coordinator, nlp_engine=_nlp_engine))
coordinator.register_agent(CodeAgent(coordinator))
coordinator.register_agent(SimulationAgent(coordinator))

@socketio.on('connect')
def handle_connect() -> None:
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect() -> None:
    print('Client disconnected')

@socketio.on('send_command')
def handle_command(data):
    """Receives a command packet from the front-end, runs it, sends reply."""
    print("Received command:", data.get("command"))

    # Run the coroutine *synchronously* and emit the result
    response = asyncio.run(coordinator.interpret_command(data))
    socketio.emit("agi_response", {"response": response})

if __name__ == '__main__':
    print("=================================================")
    print("   Unified Sovereign AGI System - Backend Server  ")
    print("=================================================")
    print("Starting server...")
    print("The frontend should connect to this backend on port 5001.")
    print("Backend is running and waiting for connections...")
    if eventlet:
        print("Running with eventlet for better async performance.")
        socketio.run(app, host='0.0.0.0', port=5001)
    else:
        print("Running with default Flask development server.")
        socketio.run(app, host='0.0.0.0', port=5001, allow_unsafe_werkzeug=True)