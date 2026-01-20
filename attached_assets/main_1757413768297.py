from harmonic_core import AGICore
from memory_vault import MemoryVault
from orchestrator import Orchestrator
from meta_recursive_utilities import dynamic_config_modifier, harmonic_sequence_recursive
import time
import random

def main():
    print("\n--- Initializing Harmonic Sovereign Console ---")
    memory_vault = MemoryVault()
    agi_core = AGICore(memory_vault=memory_vault, mathematical_rigor_mode=False)
    orchestrator = Orchestrator(agi_core=agi_core, memory_vault=memory_vault)

    # Simulate initial boot process
    print("Booting AGICore with Quantum Harmonic Principles and Agent Interaction Models.")
    memory_vault.add_entry('system_boot', {'status': 'Initialized', 'timestamp': time.time()})

    # --- Demonstration 1: Basic Orchestration ---
    print("\n--- DEMO 1: Basic Task Orchestration ---")
    task_1 = "Develop a conceptual framework for distributed quantum entanglement in AI agents."
    orchestration_result_1 = orchestrator.run_orchestration(task_1)
    print(f"\nFinal Output for Task 1:\n{orchestration_result_1['final_output']}")

    # --- Demonstration 2: AGICore Conceptual Reasoning ---
    print("\n--- DEMO 2: AGICore Conceptual Reasoning ---")
    reasoning_query = "Explain spectral multiplication and memory retrieval in harmonic context."
    reasoning_output = agi_core.generate_conceptual_reasoning(reasoning_query)
    print(f"Query: {reasoning_query}\nReply: {reasoning_output['reply']}\nReasoning Steps:\n{reasoning_output['reasoning']}")
    memory_vault.add_entry('conceptual_reasoning', {'query': reasoning_query, 'reply_preview': reasoning_output['reply'][:50]})

    # --- Demonstration 3: Recursive Self-Improvement Loop (Conceptual) ---
    print("\n--- DEMO 3: Recursive Self-Improvement Cycle ---")
    # Simulate a performance metric (e.g., from a benchmark, higher is better)
    simulated_performance = random.uniform(0.6, 0.95)
    print(f"Simulated current system performance: {simulated_performance:.2f}")
    agi_core.recursive_self_improve(simulated_performance)
    print(f"AGICore's new conceptual resonance: {agi_core.current_resonance:.2f}")
    print(f"AGICore's new conceptual perturbation: {agi_core.current_perturbation:.3f}")
    memory_vault.add_entry('self_improvement_cycle', {'performance': simulated_performance, 'new_resonance': agi_core.current_resonance})

    # --- Demonstration 4: Meta-Operator (Dynamic Rule Adjustment) ---
    print("\n--- DEMO 4: Meta-Operator (Dynamic Rule Adjustment) ---")
    # Assume a feedback score indicates how well the 'hierarchical' planning strategy worked
    feedback_score_for_planning = random.uniform(0.5, 0.99)
    print(f"Feedback for current planning strategy: {feedback_score_for_planning:.2f}")
    agi_core.conceptual_meta_operator_logic('planning_strategy', 'adaptive_harmonic_fusion', feedback_score_for_planning)
    print(f"Updated planning strategy: {agi_core.operational_rules['planning_strategy']}")
    memory_vault.add_entry('meta_rule_adjustment', {'rule': 'planning_strategy', 'new_value': agi_core.operational_rules['planning_strategy']})

    # --- Demonstration 5: Hyper-Indexed Memory (Conceptual) ---
    print("\n--- DEMO 5: Hyper-Indexed Memory ---")
    current_system_coherence = agi_core.current_resonance * (1 - agi_core.current_perturbation) # Simple derivation
    hyper_index_message = memory_vault.hyper_index_memory(current_system_coherence)
    print(hyper_index_message)
    print(f"Memory Vault's conceptual indexing efficiency: {memory_vault.programming_skills['indexing_efficiency']:.2f}")

    # --- Demonstration 6: Recursive Utility Function ---
    print("\n--- DEMO 6: Recursive Harmonic Sequence ---")
    n_terms = 5
    sequence = [harmonic_sequence_recursive(i) for i in range(1, n_terms + 1)]
    print(f"First {n_terms} terms of conceptual harmonic sequence: {sequence}")

    print("\n--- Harmonic Sovereign Console Demonstrations Complete ---")
    # Final save of the memory vault
    memory_vault._save_state()

if __name__ == "__main__":
    main()
