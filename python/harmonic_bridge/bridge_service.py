#!/usr/bin/env python3
"""
Harmonic Bridge Service
Provides a bridge between the Node.js WSM agent orchestrator and the Python harmonic core.
"""

import json
import sys
import time
import traceback
import asyncio
from typing import Dict, Any, List, Optional
from harmonic_core import AGICore
from memory_vault import MemoryVault
from orchestrator import HarmonicOrchestrator
from agents import create_agent
from meta_recursive_utilities import (
    dynamic_config_modifier, 
    harmonic_sequence_recursive,
    meta_learning_optimizer,
    adaptive_resonance_calculator,
    harmonic_ensemble_coordinator
)

# Import advanced observation interpreter
import os
import sys
advanced_path = os.path.join(os.path.dirname(__file__), '..', 'advanced_computation')
sys.path.append(advanced_path)
from dynamic_observation_interpreter import DynamicObservationInterpreter

# Import advanced capabilities
try:
    from advanced_capabilities import initialize_advanced_capabilities, handle_advanced_request
    ADVANCED_CAPABILITIES_AVAILABLE = True
except ImportError:
    ADVANCED_CAPABILITIES_AVAILABLE = False
    print("Advanced capabilities not available", file=sys.stderr)

class HarmonicBridgeService:
    def __init__(self):
        self.memory_vault = MemoryVault('harmonic_bridge_memory.json')
        self.agi_core = AGICore(self.memory_vault, mathematical_rigor_mode=True)
        self.orchestrator = HarmonicOrchestrator(self.agi_core, self.memory_vault)
        self.observation_interpreter = DynamicObservationInterpreter(
            novelty_amplification_factor=0.3,
            stability_emphasis_factor=0.2, 
            volatility_sensitivity_factor=0.2
        )
        self.initialized = True
        self.advanced_capabilities_ready = False
        
        # Initialize default agents
        self._initialize_default_agents()
        
        # Initialize advanced capabilities if available
        if ADVANCED_CAPABILITIES_AVAILABLE:
            try:
                # Use asyncio to run the async initialization
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                init_result = loop.run_until_complete(initialize_advanced_capabilities())
                self.advanced_capabilities_ready = init_result.get('status') == 'success'
                if self.advanced_capabilities_ready:
                    print("Advanced capabilities initialized successfully", file=sys.stderr)
            except Exception as e:
                print(f"Failed to initialize advanced capabilities: {e}", file=sys.stderr)
        
        # Small delay to ensure Node.js listener is ready
        time.sleep(0.1)
        
        print(json.dumps({
            'type': 'bridge_initialized',
            'status': 'ready',
            'message': 'Harmonic Bridge Service initialized successfully',
            'advanced_capabilities': self.advanced_capabilities_ready
        }))
        sys.stdout.flush()

    def _initialize_default_agents(self):
        """Initialize a set of default agents for immediate use"""
        default_agents = [
            ('app_synthesizer', 'default_app_synth'),
            ('strategic_planner', 'default_planner'),
            ('creative_modulator', 'default_creative'),
            ('sequence_analyzer', 'default_analyzer')
        ]
        
        for agent_type, agent_id in default_agents:
            try:
                self.orchestrator.create_agent(agent_type, agent_id)
            except Exception as e:
                print(json.dumps({
                    'type': 'warning',
                    'message': f'Failed to create default agent {agent_id}: {str(e)}'
                }))

    def process_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Process a request from the Node.js orchestrator"""
        try:
            command = request.get('command')
            params = request.get('params', {})
            
            if command == 'process_task':
                return self._process_task(params)
            elif command == 'create_agent':
                return self._create_agent(params)
            elif command == 'analyze_harmonics':
                return self._analyze_harmonics(params)
            elif command == 'calculate_coherence':
                return self._calculate_coherence(params)
            elif command == 'orchestrate_agents':
                return self._orchestrate_agents(params)
            elif command == 'recursive_improve':
                return self._recursive_improve(params)
            elif command == 'get_system_status':
                return self._get_system_status(params)
            elif command == 'spectral_multiply':
                return self._spectral_multiply(params)
            elif command == 'memory_search':
                return self._memory_search(params)
            elif command == 'optimize_parameters':
                return self._optimize_parameters(params)
            elif command == 'coordinate_ensemble':
                return self._coordinate_ensemble(params)
            elif command == 'advanced_request' and ADVANCED_CAPABILITIES_AVAILABLE:
                return self._handle_advanced_request(params)
            else:
                available_commands = [
                    'process_task', 'create_agent', 'analyze_harmonics', 
                    'calculate_coherence', 'orchestrate_agents', 'recursive_improve',
                    'get_system_status', 'spectral_multiply', 'memory_search',
                    'optimize_parameters', 'coordinate_ensemble'
                ]
                if ADVANCED_CAPABILITIES_AVAILABLE:
                    available_commands.append('advanced_request')
                
                return {
                    'success': False,
                    'error': f'Unknown command: {command}',
                    'available_commands': available_commands,
                    'advanced_capabilities_available': ADVANCED_CAPABILITIES_AVAILABLE
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc()
            }
    
    def _handle_advanced_request(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle advanced capability requests"""
        if not self.advanced_capabilities_ready:
            return {
                'success': False,
                'error': 'Advanced capabilities not available or not initialized'
            }
        
        try:
            request_type = params.get('type')
            parameters = params.get('parameters', {})
            
            # Run the async advanced request handler
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(handle_advanced_request(request_type, parameters))
            
            return {
                'success': True,
                'result': result,
                'advanced_capability_type': request_type
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Advanced request failed: {str(e)}',
                'traceback': traceback.format_exc()
            }

    def _process_task(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Process a task using the AGI core"""
        task_type = params.get('type', 'generic')
        payload = params.get('payload', {})
        agent_config = params.get('agent_config', {})
        
        result = self.agi_core.process_agent_task(task_type, payload, agent_config)
        
        return {
            'success': True,
            'result': result,
            'system_state': self.agi_core.get_system_state()
        }

    def _create_agent(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new agent"""
        agent_type = params.get('type', 'generic')
        agent_id = params.get('id')
        
        # Generate agent_id if not provided
        if agent_id is None:
            import uuid
            agent_id = f"{agent_type}_{str(uuid.uuid4())[:8]}"
        
        result = self.orchestrator.create_agent(agent_type, agent_id)
        
        if result.startswith('Error:') or result.startswith('Failed'):
            return {'success': False, 'error': result}
        
        return {
            'success': True,
            'agent_id': result,
            'agent_status': self.orchestrator.get_agent_status()
        }

    def _analyze_harmonics(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze harmonic properties of input data"""
        input_data = params.get('data')
        if input_data is None:
            return {'success': False, 'error': 'No data provided for harmonic analysis'}
        
        harmonic_state = self.agi_core.calculate_harmonic_state(input_data)
        
        # Additional harmonic analysis
        if isinstance(input_data, str):
            reasoning_result = self.agi_core.generate_conceptual_reasoning(input_data)
            harmonic_analysis = reasoning_result.get('harmonic_analysis', {})
        else:
            harmonic_analysis = {
                'state': harmonic_state,
                'coherence': self.agi_core.calculate_coherence(harmonic_state, [0.5, 0.5, 0.5, 0.5]),
                'resonance': self.agi_core.current_resonance,
                'perturbation': self.agi_core.current_perturbation
            }
        
        return {
            'success': True,
            'harmonic_state': harmonic_state,
            'harmonic_analysis': harmonic_analysis,
            'input_type': type(input_data).__name__
        }

    def _calculate_coherence(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate coherence between two harmonic states"""
        state1 = params.get('state1', [])
        state2 = params.get('state2', [])
        
        if not state1 or not state2:
            return {'success': False, 'error': 'Both state1 and state2 are required'}
        
        coherence = self.agi_core.calculate_coherence(state1, state2)
        
        return {
            'success': True,
            'coherence': coherence,
            'state1': state1,
            'state2': state2
        }

    def _orchestrate_agents(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Orchestrate multiple agents for a task"""
        task = params.get('task', '')
        agent_selection = params.get('agents')
        refine = params.get('refine', False)
        
        if not task:
            return {'success': False, 'error': 'Task is required for orchestration'}
        
        result = self.orchestrator.run_orchestration(task, agent_selection, refine)
        
        if 'error' in result:
            return {'success': False, 'error': result['error']}
        
        return {
            'success': True,
            'orchestration_result': result,
            'system_status': self.orchestrator.get_orchestrator_status()
        }

    def _recursive_improve(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Apply recursive self-improvement"""
        performance_metric = params.get('performance_metric', 0.5)
        
        improvement_result = self.agi_core.recursive_self_improve(performance_metric)
        
        # Also optimize orchestrator parameters
        self.orchestrator.optimize_harmonic_parameters()
        
        return {
            'success': True,
            'improvement_result': improvement_result,
            'new_system_state': self.agi_core.get_system_state(),
            'orchestrator_status': self.orchestrator.get_orchestrator_status()
        }

    def _get_system_status(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Get comprehensive system status including advanced capabilities"""
        include_memory = params.get('include_memory', False)
        include_agents = params.get('include_agents', True)
        include_advanced = params.get('include_advanced', True)
        
        status = {
            'agi_core': self.agi_core.get_system_state(),
            'orchestrator': self.orchestrator.get_orchestrator_status()
        }
        
        if include_memory:
            status['memory_vault'] = self.memory_vault.get_memory_stats()
            status['memory_summary'] = self.memory_vault.export_memory_summary()
        
        if include_agents:
            status['agent_details'] = self.orchestrator.get_agent_status()
        
        # Get advanced capabilities status if available and requested
        if include_advanced and self.advanced_capabilities_ready:
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                advanced_status = loop.run_until_complete(
                    handle_advanced_request('get_status', {})
                )
                status['advanced_capabilities'] = advanced_status
            except Exception as e:
                status['advanced_capabilities'] = {'error': f'Failed to get advanced status: {str(e)}'}
        elif include_advanced:
            status['advanced_capabilities'] = {
                'available': ADVANCED_CAPABILITIES_AVAILABLE,
                'ready': self.advanced_capabilities_ready,
                'status': 'not_initialized'
            }
        
        return {
            'success': True,
            'system_status': status,
            'timestamp': self.agi_core.memory_vault['audit_trail'][0]['timestamp'] if self.agi_core.memory_vault['audit_trail'] else 0,
            'advanced_capabilities_info': {
                'available': ADVANCED_CAPABILITIES_AVAILABLE,
                'ready': self.advanced_capabilities_ready
            }
        }

    def _spectral_multiply(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Perform spectral multiplication"""
        freq1 = params.get('freq1', 1.0)
        amp1 = params.get('amp1', 1.0)
        phase1 = params.get('phase1', 0.0)
        freq2 = params.get('freq2', 2.0)
        amp2 = params.get('amp2', 0.5)
        phase2 = params.get('phase2', 0.0)
        num_samples = params.get('num_samples', 128)
        
        result = self.agi_core.spectral_multiply(freq1, amp1, phase1, freq2, amp2, phase2, num_samples)
        
        return {
            'success': True,
            'spectral_result': result
        }

    def _memory_search(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Search memory using harmonic similarity"""
        query = params.get('query', '')
        threshold = params.get('threshold', 0.5)
        
        if not query:
            return {'success': False, 'error': 'Query is required for memory search'}
        
        # Get harmonic state for query
        query_harmonics = self.agi_core.calculate_harmonic_state(query)
        
        # Search memory
        matches = self.memory_vault.harmonic_search(query_harmonics, threshold)
        
        # Also get conceptual memory retrieval
        memory_result = self.agi_core.retrieve_memory(query)
        
        return {
            'success': True,
            'harmonic_matches': matches,
            'conceptual_matches': memory_result,
            'query_harmonics': query_harmonics
        }

    def _optimize_parameters(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize system parameters using meta-learning"""
        performance_data = params.get('performance_data', [])
        config_history = params.get('config_history', [])
        current_config = params.get('current_config', {})
        
        # Apply dynamic config modification
        if performance_data:
            recent_performance = performance_data[-1] if performance_data else 0.5
            new_config = dynamic_config_modifier(current_config, recent_performance)
        else:
            new_config = current_config
        
        # Apply meta-learning optimization if enough data
        meta_recommendations = {}
        if len(performance_data) >= 3 and len(config_history) >= 3:
            meta_recommendations = meta_learning_optimizer(performance_data, config_history)
        
        return {
            'success': True,
            'optimized_config': new_config,
            'meta_recommendations': meta_recommendations,
            'applied_optimizations': ['dynamic_config_modifier']
        }

    def _coordinate_ensemble(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Coordinate ensemble of agents using harmonic principles"""
        agent_harmonics = params.get('agent_harmonics', [])
        task_requirements = params.get('task_requirements', {})
        
        if not agent_harmonics:
            # Use current active agents
            agent_status = self.orchestrator.get_agent_status()
            agent_harmonics = [status['harmonic_state'] for status in agent_status.values()]
        
        if not agent_harmonics:
            return {'success': False, 'error': 'No agent harmonics available for coordination'}
        
        coordination_result = harmonic_ensemble_coordinator(agent_harmonics, task_requirements)
        
        return {
            'success': True,
            'coordination_strategy': coordination_result,
            'active_agents': len(agent_harmonics)
        }


def main():
    """Main service loop"""
    bridge = HarmonicBridgeService()
    
    try:
        # Read requests from stdin and send responses to stdout
        for line in sys.stdin:
            try:
                line = line.strip()
                if not line:
                    continue
                
                request = json.loads(line)
                response = bridge.process_request(request)
                
                print(json.dumps(response))
                sys.stdout.flush()
                
            except json.JSONDecodeError as e:
                error_response = {
                    'success': False,
                    'error': f'Invalid JSON: {str(e)}',
                    'received_line': line
                }
                print(json.dumps(error_response))
                sys.stdout.flush()
                
            except KeyboardInterrupt:
                break
                
    except KeyboardInterrupt:
        pass
    
    print(json.dumps({
        'type': 'bridge_shutdown',
        'message': 'Harmonic Bridge Service shutting down'
    }))


if __name__ == '__main__':
    main()