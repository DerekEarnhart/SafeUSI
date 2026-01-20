import time
import random
from .agents import AppSynthesizerAgent, StrategicPlannerAgent, CreativeModulatorAgent

class Orchestrator:
    def __init__(self, agi_core, memory_vault):
        self.agi_core = agi_core
        self.memory_vault = memory_vault
        self.app_agent = AppSynthesizerAgent(agi_core)
        self.plan_agent = StrategicPlannerAgent(agi_core)
        self.crea_agent = CreativeModulatorAgent(agi_core)
        self.agents = [self.app_agent, self.plan_agent, self.crea_agent]
        self.coherence = 0
        self.dissonance = False
        self.busy = False
        self.kb_stream = []

    def add_kb_entry(self, msg):
        self.kb_stream.append(f'[{time.strftime("%H:%M:%S", time.localtime())}] {msg}')
        print(f"[KB] {msg}")

    def get_coherence_bar(self):
        return max(0, min(100, self.coherence))

    def run_orchestration(self, task, refine=False):
        if self.busy:
            print("[Orchestrator] System busy, please wait.")
            return

        self.busy = True
        self.dissonance = False
        self.add_kb_entry(f"{'Refinement cycle initiated' if refine else 'Harmonizing intent'} for task: '{task[:50]}'...")
        print(f"[Orchestrator] {'Refinement cycle initiated' if refine else 'Orchestrating'} for task: '{task}'")

        if not task.strip():
            self.add_kb_entry("Please enter a task for the AGI.")
            self.busy = False
            return "Please enter a task for the AGI."

        self.coherence = max(10, self.coherence * 0.8) if refine else 10
        time.sleep(0.35)
        self.coherence += 20
        time.sleep(0.3)
        self.add_kb_entry("Task decomposed; agents entangled.")
        self.coherence += 20

        # Dynamic Orchestration: Entangle agents based on task complexity (conceptual)
        # For this demo, all agents run in parallel
        app_out = self.app_agent.synth_app(task)
        plan_out = self.plan_agent.synth_plan(task)
        crea_out = self.crea_agent.synth_creative(task)

        self.add_kb_entry("Parallel execution complete.")
        self.coherence = min(85, self.coherence + 15)
        time.sleep(0.4)

        final_out = f"Workflow for: \"{task}\"\n-- App Synthesizer ---\n{app_out}\n\n--- Strategic Planner ---\n{plan_out}\n\n--- Creative Modulator ---\n{crea_out}\n\nFinal coherence check: {round(self.get_coherence_bar())}%"

        self.add_kb_entry("Coherence collapse achieved. Output synthesized.")
        self.coherence = 95

        noisy = random.random() < (0.1 if refine else 0.25)
        if noisy:
            self.dissonance = True
            self.coherence = max(40, self.coherence - 20)
            self.add_kb_entry("Dissonance detected → re‑equilibrating...")
            time.sleep(0.9)
            self.dissonance = False
            self.coherence = 100
            self.add_kb_entry("Re‑harmonized. Optimal resonance.")
        else:
            self.coherence = 100
            self.add_kb_entry("System fully harmonized.")

        self.memory_vault.add_entry('orchestration_complete', {'task': task, 'coherence': self.coherence, 'output_preview': final_out[:100]})

        self.busy = False
        return {
            'app_output': app_out,
            'plan_output': plan_out,
            'creative_output': crea_out,
            'final_output': final_out,
            'coherence': self.get_coherence_bar(),
            'dissonance': self.dissonance
        }

    def conceptual_bell_state_dynamics(self, task_priority_A, task_priority_B):
        # Simulates how conceptual 'entanglement' might influence resource allocation
        # Using a simplified Bell-state like correlation for demonstration
        # Theta influences distribution between two conceptual 