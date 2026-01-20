import time
import random
import numpy as np
from typing import Dict, List, Any, Optional
from agents import create_agent, Agent
from harmonic_core import AGICore
from memory_vault import MemoryVault

class HarmonicOrchestrator:
    def __init__(self, agi_core: AGICore, memory_vault: MemoryVault):
        self.agi_core = agi_core
        self.memory_vault = memory_vault
        self.active_agents = {}
        self.coherence = 0.5
        self.dissonance = False
        self.busy = False
        self.kb_stream = []
        self.harmonic_resonance = 1.0
        self.orchestration_history = []

    def add_kb_entry(self, msg: str):
        """Add knowledge base entry with timestamp"""
        timestamp = time.strftime("%H:%M:%S", time.localtime())
        entry = f'[{timestamp}] {msg}'
        self.kb_stream.append(entry)
        print(f"[HarmonicOrch] {msg}")
        
        # Keep only last 100 entries
        if len(self.kb_stream) > 100:
            self.kb_stream = self.kb_stream[-100:]

    def get_coherence_bar(self) -> int:
        """Get coherence as percentage"""
        return max(0, min(100, int(self.coherence * 100)))

    def create_agent(self, agent_type: str, agent_id: str = None) -> str:
        """Create and register a new agent"""
        if agent_id is None:
            agent_id = f"{agent_type}_{int(time.time())}"
        
        if agent_id in self.active_agents:
            return f"Agent {agent_id} already exists"
        
        try:
            agent = create_agent(agent_type, self.agi_core, agent_id)
            self.active_agents[agent_id] = agent
            self.add_kb_entry(f"Created {agent_type} agent: {agent_id}")
            
            # Update system coherence
            self._update_system_coherence()
            
            return agent_id
        except Exception as e:
            error_msg = f"Failed to create agent {agent_id}: {str(e)}"
            self.add_kb_entry(error_msg)
            return error_msg

    def remove_agent(self, agent_id: str) -> bool:
        """Remove an agent from the orchestrator"""
        if agent_id in self.active_agents:
            del self.active_agents[agent_id]
            self.add_kb_entry(f"Removed agent: {agent_id}")
            self._update_system_coherence()
            return True
        return False

    def get_agent_status(self) -> Dict[str, Any]:
        """Get status of all active agents"""
        agent_status = {}
        for agent_id, agent in self.active_agents.items():
            agent_status[agent_id] = {
                'type': agent.agent_type,
                'harmonic_state': agent.harmonic_state,
                'coherence': agent.coherence,
                'performance': agent.get_performance_metric(),
                'task_count': len(agent.performance_history)
            }
        return agent_status

    def run_orchestration(self, task: str, agent_selection: Optional[List[str]] = None, refine: bool = False) -> Dict[str, Any]:
        """Run orchestrated task execution with harmonic coordination"""
        if self.busy:
            return {"error": "System busy, please wait", "coherence": self.get_coherence_bar()}

        self.busy = True
        self.dissonance = False
        start_time = time.time()
        
        orchestration_id = f"orch_{int(start_time)}"
        
        task_preview = task[:50] if len(task) > 50 else task
        self.add_kb_entry(f"{'Refinement cycle' if refine else 'Harmonic orchestration'} initiated for: '{task_preview}...'")
        
        if not task.strip():
            self.add_kb_entry("Empty task provided")
            self.busy = False
            return {"error": "Please provide a task", "coherence": self.get_coherence_bar()}

        # Initialize coherence
        self.coherence = max(0.1, self.coherence * 0.8) if refine else 0.1
        
        # Task analysis and harmonic preparation
        task_harmonics = self.agi_core.calculate_harmonic_state(task)
        task_coherence = self.agi_core.calculate_coherence(task_harmonics, [0.7, 0.3, 0.5, 0.9])
        
        self.add_kb_entry(f"Task harmonic analysis: coherence {task_coherence:.3f}")
        self.coherence += 0.2
        
        # Agent selection and entanglement
        selected_agents = self._select_agents(task, agent_selection, task_harmonics)
        if not selected_agents:
            self.add_kb_entry("No suitable agents available")
            self.busy = False
            return {"error": "No agents available for task", "coherence": self.get_coherence_bar()}
        
        self.add_kb_entry(f"Entangling {len(selected_agents)} agents: {list(selected_agents.keys())}")
        self.coherence += 0.2
        
        # Parallel harmonic execution
        execution_results = self._execute_parallel_harmonic(task, selected_agents, task_harmonics)
        self.add_kb_entry("Parallel harmonic execution complete")
        self.coherence += 0.3
        
        # Harmonic synthesis and coherence optimization
        synthesis_result = self._synthesize_results(task, execution_results, task_harmonics)
        self.add_kb_entry("Harmonic synthesis achieved")
        self.coherence += 0.2
        
        # Coherence stability check
        final_coherence = self._stability_check(synthesis_result)
        
        # Handle dissonance if detected
        if random.random() < (0.1 if refine else 0.25):
            self._handle_dissonance()
        else:
            self.coherence = min(1.0, self.coherence + 0.1)
            self.add_kb_entry("System fully harmonized")
        
        # Record orchestration
        orchestration_record = {
            'id': orchestration_id,
            'task': task,
            'agents_used': list(selected_agents.keys()),
            'task_harmonics': task_harmonics,
            'execution_time': time.time() - start_time,
            'final_coherence': final_coherence,
            'synthesis_result': synthesis_result
        }
        
        self.orchestration_history.append(orchestration_record)
        self.memory_vault.add_entry('harmonic_orchestration', orchestration_record, task_harmonics)
        
        self.busy = False
        
        return {
            'orchestration_id': orchestration_id,
            'task': task,
            'agents_used': list(selected_agents.keys()),
            'execution_results': execution_results,
            'synthesis_result': synthesis_result,
            'task_harmonics': task_harmonics,
            'final_coherence': final_coherence,
            'coherence_bar': self.get_coherence_bar(),
            'dissonance': self.dissonance,
            'execution_time': time.time() - start_time,
            'kb_stream': self.kb_stream[-10:]  # Last 10 entries
        }

    def _select_agents(self, task: str, agent_selection: Optional[List[str]], task_harmonics: List[float]) -> Dict[str, Agent]:
        """Select optimal agents for the task based on harmonic analysis"""
        selected = {}
        
        # If specific agents requested, use them
        if agent_selection:
            for agent_id in agent_selection:
                if agent_id in self.active_agents:
                    selected[agent_id] = self.active_agents[agent_id]
            return selected
        
        # Auto-select based on task characteristics and harmonic resonance
        task_lower = task.lower()
        
        # Analyze task type and select appropriate agents
        for agent_id, agent in self.active_agents.items():
            agent_coherence = self.agi_core.calculate_coherence(agent.harmonic_state, task_harmonics)
            
            # Task-specific agent selection
            should_select = False
            
            if 'app' in task_lower or 'software' in task_lower or 'system' in task_lower:
                if agent.agent_type in ['app_synthesizer', 'vfx_sim']:
                    should_select = True
            
            if 'plan' in task_lower or 'strategy' in task_lower or 'organize' in task_lower:
                if agent.agent_type in ['strategic_planner', 'story_builder']:
                    should_select = True
                    
            if 'creative' in task_lower or 'design' in task_lower or 'art' in task_lower or 'visual' in task_lower:
                if agent.agent_type in ['creative_modulator', 'geo_art', 'music_composer']:
                    should_select = True
                    
            if 'analyze' in task_lower or 'pattern' in task_lower or 'data' in task_lower:
                if agent.agent_type == 'sequence_analyzer':
                    should_select = True
            
            # Also select if high harmonic resonance
            if agent_coherence > 0.7:
                should_select = True
            
            if should_select:
                selected[agent_id] = agent
        
        # If no specific matches, select best performing agents
        if not selected and self.active_agents:
            best_agents = sorted(
                self.active_agents.items(), 
                key=lambda x: x[1].get_performance_metric() + self.agi_core.calculate_coherence(x[1].harmonic_state, task_harmonics),
                reverse=True
            )
            # Select top 3 agents
            for agent_id, agent in best_agents[:3]:
                selected[agent_id] = agent
        
        return selected

    def _execute_parallel_harmonic(self, task: str, agents: Dict[str, Agent], task_harmonics: List[float]) -> Dict[str, Any]:
        """Execute task across agents with harmonic coordination"""
        results = {}
        
        for agent_id, agent in agents.items():
            try:
                # Prepare agent-specific task context
                agent_task = self._prepare_agent_task(task, agent, task_harmonics)
                
                # Execute based on agent type
                if agent.agent_type in ['app_synthesizer', 'vfx_sim']:
                    result = agent.synth_app(agent_task)
                elif agent.agent_type in ['strategic_planner', 'story_builder']:
                    result = agent.synth_plan(agent_task)
                elif agent.agent_type in ['creative_modulator', 'geo_art', 'music_composer']:
                    result = agent.synth_creative(agent_task)
                elif agent.agent_type == 'sequence_analyzer':
                    # For sequence analyzer, convert task to data points
                    task_data = [ord(c) for c in task[:32]]
                    result = agent.analyze_sequence(task_data)
                else:
                    # Generic task processing
                    result = self.agi_core.process_agent_task('generic', {'task': agent_task})
                
                results[agent_id] = {
                    'agent_type': agent.agent_type,
                    'result': result,
                    'harmonic_resonance': self.agi_core.calculate_coherence(agent.harmonic_state, task_harmonics)
                }
                
            except Exception as e:
                results[agent_id] = {
                    'agent_type': agent.agent_type,
                    'error': str(e),
                    'harmonic_resonance': 0.0
                }
        
        return results

    def _prepare_agent_task(self, task: str, agent: Agent, task_harmonics: List[float]) -> str:
        """Prepare task for specific agent with harmonic optimization"""
        # Calculate agent-task resonance
        resonance = self.agi_core.calculate_coherence(agent.harmonic_state, task_harmonics)
        
        # Enhance task description based on agent type and resonance
        if agent.agent_type in ['app_synthesizer', 'vfx_sim']:
            if resonance > 0.7:
                return f"High-coherence {task} with optimal harmonic architecture"
            else:
                return f"Stabilized {task} with adaptive harmonic controls"
                
        elif agent.agent_type in ['strategic_planner', 'story_builder']:
            if resonance > 0.7:
                return f"Strategic decomposition of {task} with harmonic optimization"
            else:
                return f"Balanced planning approach for {task}"
                
        elif agent.agent_type in ['creative_modulator', 'geo_art', 'music_composer']:
            if resonance > 0.7:
                return f"Creative harmonic interpretation of {task}"
            else:
                return f"Artistic exploration of {task}"
        
        return task

    def _synthesize_results(self, task: str, execution_results: Dict[str, Any], task_harmonics: List[float]) -> Dict[str, Any]:
        """Synthesize results from multiple agents with harmonic optimization"""
        synthesis = {
            'task': task,
            'agent_contributions': {},
            'harmonic_synthesis': {},
            'coherence_map': {},
            'unified_result': ''
        }
        
        unified_parts = []
        total_coherence = 0
        agent_count = 0
        
        for agent_id, result_data in execution_results.items():
            if 'error' in result_data:
                synthesis['agent_contributions'][agent_id] = f"Error: {result_data['error']}"
                continue
            
            agent_type = result_data['agent_type']
            result = result_data['result']
            resonance = result_data['harmonic_resonance']
            
            # Extract key information based on agent type
            if agent_type in ['app_synthesizer', 'vfx_sim']:
                if isinstance(result, dict) and 'architecture' in result:
                    contribution = result['architecture']
                else:
                    contribution = str(result)
                unified_parts.append(f"Architecture: {contribution}")
                
            elif agent_type in ['strategic_planner', 'story_builder']:
                if isinstance(result, dict) and 'plan' in result:
                    contribution = result['plan']
                else:
                    contribution = str(result)
                unified_parts.append(f"Strategy: {contribution}")
                
            elif agent_type in ['creative_modulator', 'geo_art', 'music_composer']:
                if isinstance(result, dict) and 'aesthetic' in result:
                    contribution = result['aesthetic']
                else:
                    contribution = str(result)
                unified_parts.append(f"Creative Direction: {contribution}")
                
            elif agent_type == 'sequence_analyzer':
                if isinstance(result, dict) and 'analysis_results' in result:
                    contribution = f"Analysis: {result['analysis_results']}"
                else:
                    contribution = f"Analysis: {str(result)}"
                unified_parts.append(contribution)
            
            synthesis['agent_contributions'][agent_id] = contribution
            synthesis['coherence_map'][agent_id] = resonance
            synthesis['harmonic_synthesis'][agent_id] = result.get('harmonic_state', []) if isinstance(result, dict) else []
            
            total_coherence += resonance
            agent_count += 1
        
        # Calculate overall harmonic coherence
        avg_coherence = total_coherence / agent_count if agent_count > 0 else 0
        
        # Create unified result
        if unified_parts:
            synthesis['unified_result'] = f"Harmonic Orchestration Result for '{task}':\n\n" + "\n\n".join(unified_parts)
            synthesis['unified_result'] += f"\n\nOverall Harmonic Coherence: {avg_coherence:.3f}"
        else:
            synthesis['unified_result'] = f"No successful agent contributions for task: {task}"
        
        synthesis['overall_coherence'] = avg_coherence
        synthesis['harmonic_stability'] = 1 - np.std(list(synthesis['coherence_map'].values())) if len(synthesis['coherence_map']) > 1 else 1.0
        
        return synthesis

    def _stability_check(self, synthesis_result: Dict[str, Any]) -> float:
        """Perform coherence stability check"""
        overall_coherence = synthesis_result.get('overall_coherence', 0.5)
        harmonic_stability = synthesis_result.get('harmonic_stability', 0.5)
        
        # Calculate final coherence based on multiple factors
        final_coherence = (overall_coherence + harmonic_stability + self.coherence) / 3
        
        # Apply system resonance factor
        final_coherence *= self.harmonic_resonance
        
        # Clamp to valid range
        final_coherence = max(0.0, min(1.0, final_coherence))
        
        self.coherence = final_coherence
        return final_coherence

    def _handle_dissonance(self):
        """Handle system dissonance and re-harmonization"""
        self.dissonance = True
        original_coherence = self.coherence
        self.coherence = max(0.4, self.coherence - 0.2)
        
        self.add_kb_entry("Dissonance detected → re‑equilibrating...")
        
        # Simulate re-harmonization process
        time.sleep(0.5)  # Brief pause for dramatic effect
        
        # Apply harmonic correction
        correction_factor = self.agi_core.current_resonance / (1 + self.agi_core.current_perturbation)
        self.coherence = min(1.0, self.coherence + correction_factor * 0.3)
        
        self.dissonance = False
        self.add_kb_entry(f"Re‑harmonized: {original_coherence:.3f} → {self.coherence:.3f}")

    def _update_system_coherence(self):
        """Update system coherence based on active agents"""
        if not self.active_agents:
            self.coherence = 0.5
            return
        
        # Calculate average agent coherence
        agent_coherences = [agent.coherence for agent in self.active_agents.values()]
        avg_agent_coherence = np.mean(agent_coherences)
        
        # Factor in system resonance
        system_factor = self.agi_core.current_resonance / (1 + self.agi_core.current_perturbation)
        
        # Update system coherence
        self.coherence = (avg_agent_coherence + system_factor) / 2
        self.coherence = max(0.0, min(1.0, self.coherence))

    def conceptual_bell_state_dynamics(self, task_priority_a: float, task_priority_b: float) -> Dict[str, Any]:
        """Simulate Bell-state dynamics for resource allocation"""
        # Calculate entanglement coefficient
        theta = np.pi * (task_priority_a + task_priority_b) / 2
        
        # Bell state probability amplitudes
        prob_00 = np.cos(theta / 2) ** 2
        prob_11 = np.sin(theta / 2) ** 2
        prob_01 = prob_10 = 0  # Simplified Bell state
        
        # Resource allocation based on probabilities
        allocation_a = prob_00 + prob_01
        allocation_b = prob_11 + prob_10
        
        # Normalize allocations
        total_allocation = allocation_a + allocation_b
        if total_allocation > 0:
            allocation_a /= total_allocation
            allocation_b /= total_allocation
        
        return {
            'entanglement_angle': theta,
            'resource_allocation_a': allocation_a,
            'resource_allocation_b': allocation_b,
            'quantum_coherence': np.abs(np.cos(theta / 2) * np.sin(theta / 2)),
            'bell_state_purity': prob_00 + prob_11
        }

    def get_orchestrator_status(self) -> Dict[str, Any]:
        """Get comprehensive orchestrator status"""
        return {
            'active_agents': len(self.active_agents),
            'system_coherence': self.coherence,
            'harmonic_resonance': self.harmonic_resonance,
            'is_busy': self.busy,
            'dissonance_detected': self.dissonance,
            'total_orchestrations': len(self.orchestration_history),
            'recent_kb_entries': self.kb_stream[-5:],
            'agent_status': self.get_agent_status(),
            'agi_core_state': self.agi_core.get_system_state(),
            'memory_stats': self.memory_vault.get_memory_stats()
        }

    def optimize_harmonic_parameters(self):
        """Optimize harmonic parameters based on orchestration history"""
        if len(self.orchestration_history) < 3:
            return
        
        # Analyze recent performance
        recent_orchestrations = self.orchestration_history[-10:]
        avg_coherence = np.mean([orch['final_coherence'] for orch in recent_orchestrations])
        avg_execution_time = np.mean([orch['execution_time'] for orch in recent_orchestrations])
        
        # Apply recursive self-improvement
        performance_metric = avg_coherence / (1 + avg_execution_time)
        improvement_result = self.agi_core.recursive_self_improve(performance_metric)
        
        # Update harmonic resonance
        self.harmonic_resonance = improvement_result['harmonic_stability']
        
        self.add_kb_entry(f"Harmonic optimization: resonance {self.harmonic_resonance:.3f}, stability improved")

    def export_orchestration_summary(self) -> Dict[str, Any]:
        """Export summary for external systems"""
        if not self.orchestration_history:
            return {'summary': 'No orchestrations completed'}
        
        recent = self.orchestration_history[-20:]  # Last 20 orchestrations
        
        summary = {
            'total_orchestrations': len(self.orchestration_history),
            'average_coherence': np.mean([orch['final_coherence'] for orch in recent]),
            'average_execution_time': np.mean([orch['execution_time'] for orch in recent]),
            'most_used_agents': self._get_most_used_agents(recent),
            'harmonic_stability': self.harmonic_resonance,
            'system_performance': self.coherence
        }
        
        return summary

    def _get_most_used_agents(self, orchestrations: List[Dict[str, Any]]) -> Dict[str, int]:
        """Get most frequently used agents"""
        agent_usage = {}
        for orch in orchestrations:
            for agent_id in orch['agents_used']:
                if agent_id in agent_usage:
                    agent_usage[agent_id] += 1
                else:
                    agent_usage[agent_id] = 1
        
        # Sort by usage count
        sorted_usage = sorted(agent_usage.items(), key=lambda x: x[1], reverse=True)
        return dict(sorted_usage[:5])  # Top 5 most used agents