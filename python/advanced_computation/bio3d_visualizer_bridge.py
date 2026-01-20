"""
BIO-3D Visualizer Bridge
Advanced biological system visualization with psychomotor observer effect modeling
Based on experimental framework for consciousness-environment interaction studies
"""

import numpy as np
import asyncio
from typing import Dict, List, Any, Optional, Tuple, Union
from dataclasses import dataclass
from enum import Enum
import json
import time
from collections import deque
import scipy.signal as signal
from scipy.spatial.distance import cdist

class ObserverMode(Enum):
    UNOBSERVED = "unobserved"
    PASSIVE_OBSERVED = "passive_observed"
    ACTIVE_MONITORED = "active_monitored"
    INTRUSIVE_FEEDBACK = "intrusive_feedback"

class BiologicalSystem(Enum):
    NEURAL_NETWORK = "neural_network"
    FUNGAL_NETWORK = "fungal_network"
    CELLULAR_AUTOMATA = "cellular_automata"
    ECOSYSTEM_DYNAMICS = "ecosystem_dynamics"
    CONSCIOUSNESS_FIELD = "consciousness_field"

@dataclass
class PsychomotorMetrics:
    """Psychomotor performance metrics under observation"""
    reaction_time_mean: float
    reaction_time_std: float
    accuracy_rate: float
    precision_index: float
    attention_focus: float
    stress_indicators: Dict[str, float]
    uncertainty_index: float  # Analogous to quantum uncertainty

@dataclass
class ObserverEffect:
    """Observer effect measurement and quantification"""
    baseline_performance: PsychomotorMetrics
    observed_performance: PsychomotorMetrics
    effect_magnitude: float
    uncertainty_change: float
    attention_shift: np.ndarray
    temporal_dynamics: np.ndarray

@dataclass
class BiologicalVisualization:
    """3D visualization data for biological systems"""
    system_type: BiologicalSystem
    spatial_coordinates: np.ndarray
    temporal_evolution: np.ndarray
    interaction_matrix: np.ndarray
    emergence_indicators: np.ndarray
    observer_influence: np.ndarray

class PsychomotorObserverEngine:
    """Engine for modeling psychomotor observer effects"""
    
    def __init__(self):
        self.baseline_cache = {}
        self.observation_history = deque()  # No limit - infinite observation history
        self.uncertainty_threshold = 0.1
        self.observer_sensitivity = 1.0
        
    def establish_baseline(self, participant_id: str, trials: int = 50) -> PsychomotorMetrics:
        """Establish baseline psychomotor performance"""
        
        # Simulate baseline trials without observation
        reaction_times = np.random.normal(250, 30, trials)  # ms
        accuracies = np.random.beta(8, 2, trials)  # High accuracy baseline
        
        # Calculate baseline metrics
        baseline_metrics = PsychomotorMetrics(
            reaction_time_mean=float(np.mean(reaction_times)),
            reaction_time_std=float(np.std(reaction_times)),
            accuracy_rate=float(np.mean(accuracies)),
            precision_index=float(1 - np.std(accuracies)),
            attention_focus=0.85,  # Default focused state
            stress_indicators={
                'cortisol_proxy': np.random.uniform(0.1, 0.3),
                'heart_rate_variability': np.random.uniform(0.7, 0.9),
                'galvanic_skin_response': np.random.uniform(0.2, 0.4)
            },
            uncertainty_index=float(np.std(reaction_times) / np.mean(reaction_times))
        )
        
        self.baseline_cache[participant_id] = baseline_metrics
        return baseline_metrics
    
    def measure_observer_effect(self, participant_id: str, observer_mode: ObserverMode, 
                              trials: int = 50) -> ObserverEffect:
        """Measure observer effect under different observation conditions"""
        
        baseline = self.baseline_cache.get(participant_id)
        if not baseline:
            baseline = self.establish_baseline(participant_id)
        
        # Apply observer effect modulation
        effect_strength = self._get_observer_effect_strength(observer_mode)
        
        # Generate observed performance with effect
        observed_metrics = self._apply_observer_effect(baseline, effect_strength, observer_mode)
        
        # Calculate effect magnitude
        effect_magnitude = self._calculate_effect_magnitude(baseline, observed_metrics)
        
        # Calculate uncertainty change (Heisenberg analogy)
        uncertainty_change = observed_metrics.uncertainty_index - baseline.uncertainty_index
        
        # Generate attention shift pattern
        attention_shift = self._model_attention_shift(observer_mode, trials)
        
        # Generate temporal dynamics
        temporal_dynamics = self._model_temporal_dynamics(effect_strength, trials)
        
        observer_effect = ObserverEffect(
            baseline_performance=baseline,
            observed_performance=observed_metrics,
            effect_magnitude=effect_magnitude,
            uncertainty_change=uncertainty_change,
            attention_shift=attention_shift,
            temporal_dynamics=temporal_dynamics
        )
        
        self.observation_history.append({
            'timestamp': time.time(),
            'participant_id': participant_id,
            'observer_mode': observer_mode,
            'effect': observer_effect
        })
        
        return observer_effect
    
    def _get_observer_effect_strength(self, observer_mode: ObserverMode) -> float:
        """Get effect strength based on observation mode"""
        strengths = {
            ObserverMode.UNOBSERVED: 0.0,
            ObserverMode.PASSIVE_OBSERVED: 0.15,
            ObserverMode.ACTIVE_MONITORED: 0.35,
            ObserverMode.INTRUSIVE_FEEDBACK: 0.65
        }
        return strengths.get(observer_mode, 0.0)
    
    def _apply_observer_effect(self, baseline: PsychomotorMetrics, 
                             effect_strength: float, observer_mode: ObserverMode) -> PsychomotorMetrics:
        """Apply observer effect to baseline performance"""
        
        # Reaction time changes (usually increases under observation)
        rt_increase = effect_strength * 50  # ms increase
        rt_variability_increase = effect_strength * 15  # increased variability
        
        new_rt_mean = baseline.reaction_time_mean + rt_increase
        new_rt_std = baseline.reaction_time_std + rt_variability_increase
        
        # Accuracy changes (can decrease under pressure)
        accuracy_change = -effect_strength * 0.1  # slight decrease
        new_accuracy = max(0.1, baseline.accuracy_rate + accuracy_change)
        
        # Precision changes
        precision_change = -effect_strength * 0.2
        new_precision = max(0.1, baseline.precision_index + precision_change)
        
        # Attention focus changes
        if observer_mode == ObserverMode.INTRUSIVE_FEEDBACK:
            attention_change = -effect_strength * 0.3  # Distraction
        else:
            attention_change = effect_strength * 0.1  # Slight increase in focus
        new_attention = np.clip(baseline.attention_focus + attention_change, 0.1, 1.0)
        
        # Stress indicator changes
        stress_multiplier = 1 + effect_strength
        new_stress = {
            key: min(1.0, value * stress_multiplier) 
            for key, value in baseline.stress_indicators.items()
        }
        
        # Uncertainty index (key metric for Heisenberg analogy)
        new_uncertainty = new_rt_std / new_rt_mean
        
        return PsychomotorMetrics(
            reaction_time_mean=new_rt_mean,
            reaction_time_std=new_rt_std,
            accuracy_rate=new_accuracy,
            precision_index=new_precision,
            attention_focus=new_attention,
            stress_indicators=new_stress,
            uncertainty_index=new_uncertainty
        )
    
    def _calculate_effect_magnitude(self, baseline: PsychomotorMetrics, 
                                  observed: PsychomotorMetrics) -> float:
        """Calculate overall magnitude of observer effect"""
        
        # Normalize changes and compute composite effect
        rt_change = abs(observed.reaction_time_mean - baseline.reaction_time_mean) / baseline.reaction_time_mean
        accuracy_change = abs(observed.accuracy_rate - baseline.accuracy_rate) / baseline.accuracy_rate
        precision_change = abs(observed.precision_index - baseline.precision_index) / baseline.precision_index
        uncertainty_change = abs(observed.uncertainty_index - baseline.uncertainty_index) / baseline.uncertainty_index
        
        # Weighted composite
        effect_magnitude = (rt_change * 0.3 + accuracy_change * 0.25 + 
                          precision_change * 0.25 + uncertainty_change * 0.2)
        
        return float(effect_magnitude)
    
    def _model_attention_shift(self, observer_mode: ObserverMode, trials: int) -> np.ndarray:
        """Model attention shift pattern during observation"""
        
        time_points = np.linspace(0, trials, trials)
        
        if observer_mode == ObserverMode.UNOBSERVED:
            # Stable attention
            shift = np.zeros(trials)
        elif observer_mode == ObserverMode.PASSIVE_OBSERVED:
            # Initial attention increase, then habituation
            shift = 0.2 * np.exp(-time_points / 20)
        elif observer_mode == ObserverMode.ACTIVE_MONITORED:
            # Sustained attention with fluctuations
            base_shift = 0.3 * np.exp(-time_points / 30)
            fluctuations = 0.1 * np.sin(time_points / 5)
            shift = base_shift + fluctuations
        else:  # INTRUSIVE_FEEDBACK
            # Disruptive attention pattern
            base_shift = 0.4 * (1 - np.exp(-time_points / 10))
            disruptions = 0.2 * np.random.random(trials)
            shift = base_shift + disruptions
        
        return shift
    
    def _model_temporal_dynamics(self, effect_strength: float, trials: int) -> np.ndarray:
        """Model temporal dynamics of observer effect"""
        
        time_points = np.linspace(0, 1, trials)
        
        # Initial shock response
        initial_response = effect_strength * np.exp(-time_points * 5)
        
        # Adaptation/habituation
        adaptation = -effect_strength * 0.5 * (1 - np.exp(-time_points * 2))
        
        # Random fluctuations
        noise = effect_strength * 0.1 * np.random.normal(0, 1, trials)
        
        dynamics = initial_response + adaptation + noise
        return dynamics

class BiologicalSystemVisualizer:
    """3D visualizer for biological systems with observer effects"""
    
    def __init__(self):
        self.system_cache = {}
        self.visualization_history = []
        self.default_resolution = 64
        
    def create_biological_visualization(self, system_type: BiologicalSystem,
                                      observer_effect: Optional[ObserverEffect] = None,
                                      time_steps: int = 100) -> BiologicalVisualization:
        """Create 3D visualization of biological system"""
        
        # Generate spatial coordinates
        spatial_coords = self._generate_spatial_structure(system_type)
        
        # Generate temporal evolution
        temporal_evolution = self._simulate_temporal_evolution(system_type, time_steps)
        
        # Generate interaction matrix
        interaction_matrix = self._compute_interaction_matrix(spatial_coords)
        
        # Generate emergence indicators
        emergence_indicators = self._detect_emergence_patterns(temporal_evolution)
        
        # Apply observer influence if present
        observer_influence = self._apply_observer_influence(
            temporal_evolution, observer_effect
        ) if observer_effect else np.zeros_like(temporal_evolution)
        
        visualization = BiologicalVisualization(
            system_type=system_type,
            spatial_coordinates=spatial_coords,
            temporal_evolution=temporal_evolution,
            interaction_matrix=interaction_matrix,
            emergence_indicators=emergence_indicators,
            observer_influence=observer_influence
        )
        
        self.visualization_history.append({
            'timestamp': time.time(),
            'system_type': system_type,
            'visualization': visualization,
            'observer_effect': observer_effect
        })
        
        return visualization
    
    def _generate_spatial_structure(self, system_type: BiologicalSystem) -> np.ndarray:
        """Generate spatial structure for different biological systems"""
        
        n_points = self.default_resolution
        
        if system_type == BiologicalSystem.NEURAL_NETWORK:
            # Neural network-like structure
            coords = np.random.random((n_points, 3))
            # Add some clustering for brain regions
            cluster_centers = np.random.random((8, 3))
            for i in range(n_points):
                nearest_cluster = np.argmin(cdist([coords[i]], cluster_centers)[0])
                coords[i] += 0.1 * (cluster_centers[nearest_cluster] - coords[i])
        
        elif system_type == BiologicalSystem.FUNGAL_NETWORK:
            # Branching mycelial structure
            coords = np.zeros((n_points, 3))
            coords[0] = [0.5, 0.5, 0.5]  # Start at center
            
            for i in range(1, n_points):
                parent_idx = max(0, i - np.random.poisson(3))
                direction = np.random.normal(0, 1, 3)
                direction /= np.linalg.norm(direction)
                branch_length = np.random.exponential(0.1)
                coords[i] = coords[parent_idx] + direction * branch_length
        
        elif system_type == BiologicalSystem.CELLULAR_AUTOMATA:
            # Grid-based cellular structure
            grid_size = int(np.cbrt(n_points))
            x, y, z = np.meshgrid(
                np.linspace(0, 1, grid_size),
                np.linspace(0, 1, grid_size),
                np.linspace(0, 1, grid_size)
            )
            coords = np.column_stack([x.flatten(), y.flatten(), z.flatten()])[:n_points]
        
        elif system_type == BiologicalSystem.ECOSYSTEM_DYNAMICS:
            # Spatial ecosystem distribution
            coords = np.random.beta(2, 2, (n_points, 3))  # More natural distribution
        
        else:  # CONSCIOUSNESS_FIELD
            # Consciousness field distribution
            coords = np.random.random((n_points, 3))
            # Add harmonic structure
            for i in range(3):
                coords[:, i] += 0.1 * np.sin(coords[:, i] * 2 * np.pi * 3)
        
        return coords
    
    def _simulate_temporal_evolution(self, system_type: BiologicalSystem, 
                                   time_steps: int) -> np.ndarray:
        """Simulate temporal evolution of biological system"""
        
        n_points = self.default_resolution
        evolution = np.zeros((time_steps, n_points))
        
        if system_type == BiologicalSystem.NEURAL_NETWORK:
            # Neural activity patterns
            for t in range(time_steps):
                # Base oscillations with coupling
                base_freq = 40  # Gamma frequency
                phase = 2 * np.pi * base_freq * t / time_steps
                evolution[t] = np.sin(phase + np.random.random(n_points) * 2 * np.pi)
                
                # Add synchronization effects
                if t > 0:
                    coupling_strength = 0.1
                    evolution[t] += coupling_strength * np.mean(evolution[t-1])
        
        elif system_type == BiologicalSystem.FUNGAL_NETWORK:
            # Growth and resource flow patterns
            for t in range(time_steps):
                growth_rate = 0.05
                diffusion_rate = 0.02
                
                if t == 0:
                    evolution[t] = np.random.exponential(0.1, n_points)
                else:
                    # Growth
                    evolution[t] = evolution[t-1] * (1 + growth_rate)
                    # Diffusion between connected nodes
                    evolution[t] += diffusion_rate * np.roll(evolution[t-1], 1)
                    # Resource limitations
                    evolution[t] = np.clip(evolution[t], 0, 1)
        
        elif system_type == BiologicalSystem.CELLULAR_AUTOMATA:
            # Conway's Game of Life-like dynamics
            evolution[0] = np.random.binomial(1, 0.3, n_points)
            
            for t in range(1, time_steps):
                evolution[t] = evolution[t-1].copy()
                # Simple CA rule (placeholder)
                for i in range(n_points):
                    neighbors = evolution[t-1][(i-1)%n_points:(i+2)%n_points]
                    neighbor_sum = np.sum(neighbors)
                    if evolution[t-1][i] == 1:
                        evolution[t][i] = 1 if neighbor_sum in [2, 3] else 0
                    else:
                        evolution[t][i] = 1 if neighbor_sum == 3 else 0
        
        elif system_type == BiologicalSystem.ECOSYSTEM_DYNAMICS:
            # Population dynamics
            for t in range(time_steps):
                if t == 0:
                    evolution[t] = np.random.uniform(0.1, 0.9, n_points)
                else:
                    # Logistic growth with interactions
                    growth_rate = 0.1
                    carrying_capacity = 1.0
                    interaction_strength = 0.05
                    
                    evolution[t] = evolution[t-1] + growth_rate * evolution[t-1] * (
                        1 - evolution[t-1] / carrying_capacity
                    )
                    
                    # Species interactions
                    evolution[t] += interaction_strength * (
                        np.roll(evolution[t-1], 1) - np.roll(evolution[t-1], -1)
                    )
                    
                    evolution[t] = np.clip(evolution[t], 0, carrying_capacity)
        
        else:  # CONSCIOUSNESS_FIELD
            # Consciousness field dynamics
            for t in range(time_steps):
                # Harmonic oscillations with emergence
                base_freq = 8  # Alpha frequency
                harmonic_freq = 40  # Gamma frequency
                
                base_oscillation = np.sin(2 * np.pi * base_freq * t / time_steps)
                harmonic_modulation = 0.3 * np.sin(2 * np.pi * harmonic_freq * t / time_steps)
                
                evolution[t] = base_oscillation + harmonic_modulation
                evolution[t] += 0.1 * np.random.normal(0, 1, n_points)
        
        return evolution
    
    def _compute_interaction_matrix(self, spatial_coords: np.ndarray) -> np.ndarray:
        """Compute interaction matrix between system components"""
        
        n_points = len(spatial_coords)
        interaction_matrix = np.zeros((n_points, n_points))
        
        # Compute distance-based interactions
        distances = cdist(spatial_coords, spatial_coords)
        
        # Apply interaction function (e.g., exponential decay)
        interaction_range = 0.2
        interaction_matrix = np.exp(-distances / interaction_range)
        
        # Zero self-interactions
        np.fill_diagonal(interaction_matrix, 0)
        
        return interaction_matrix
    
    def _detect_emergence_patterns(self, temporal_evolution: np.ndarray) -> np.ndarray:
        """Detect emergence patterns in temporal evolution"""
        
        time_steps, n_points = temporal_evolution.shape
        emergence_indicators = np.zeros((time_steps, n_points))
        
        for t in range(1, time_steps):
            # Calculate local complexity
            local_variance = np.var(temporal_evolution[max(0, t-5):t+1], axis=0)
            
            # Calculate synchronization
            mean_activity = np.mean(temporal_evolution[t])
            synchronization = 1 - np.var(temporal_evolution[t]) / (mean_activity + 1e-6)
            
            # Emergence as combination of complexity and synchronization
            emergence_indicators[t] = local_variance * synchronization
        
        return emergence_indicators
    
    def _apply_observer_influence(self, temporal_evolution: np.ndarray,
                                observer_effect: ObserverEffect) -> np.ndarray:
        """Apply observer influence to system evolution"""
        
        time_steps, n_points = temporal_evolution.shape
        influence = np.zeros_like(temporal_evolution)
        
        # Observer effect strength
        effect_strength = observer_effect.effect_magnitude
        
        # Temporal dynamics from observer effect
        temporal_dynamics = observer_effect.temporal_dynamics
        
        # Interpolate temporal dynamics to match evolution time steps
        if len(temporal_dynamics) != time_steps:
            time_indices = np.linspace(0, len(temporal_dynamics)-1, time_steps)
            temporal_dynamics = np.interp(time_indices, 
                                        np.arange(len(temporal_dynamics)), 
                                        temporal_dynamics)
        
        # Apply influence with spatial variation
        for t in range(time_steps):
            spatial_variation = np.random.random(n_points)
            influence[t] = effect_strength * temporal_dynamics[t] * spatial_variation
        
        return influence

class Bio3DVisualizerBridge:
    """Main bridge interface for BIO-3D visualization with observer effects"""
    
    def __init__(self):
        self.psychomotor_engine = PsychomotorObserverEngine()
        self.visualizer = BiologicalSystemVisualizer()
        self.experiments = {}
        self.active_sessions = {}
        
    async def initialize_experiment(self, experiment_id: str, 
                                  participant_ids: List[str],
                                  system_type: BiologicalSystem) -> Dict[str, Any]:
        """Initialize a new experiment with participants and biological system"""
        
        # Establish baselines for all participants
        baselines = {}
        for participant_id in participant_ids:
            baseline = self.psychomotor_engine.establish_baseline(participant_id)
            baselines[participant_id] = baseline
        
        # Create initial biological visualization
        initial_viz = self.visualizer.create_biological_visualization(system_type)
        
        experiment = {
            'experiment_id': experiment_id,
            'participant_ids': participant_ids,
            'system_type': system_type,
            'baselines': baselines,
            'initial_visualization': initial_viz,
            'sessions': [],
            'created_timestamp': time.time()
        }
        
        self.experiments[experiment_id] = experiment
        
        return {
            'experiment_initialized': True,
            'participant_count': len(participant_ids),
            'system_type': system_type.value,
            'baseline_metrics': {pid: {
                'reaction_time': b.reaction_time_mean,
                'accuracy': b.accuracy_rate,
                'uncertainty_index': b.uncertainty_index
            } for pid, b in baselines.items()}
        }
    
    async def run_observation_session(self, experiment_id: str, 
                                    participant_id: str,
                                    observer_mode: ObserverMode,
                                    duration_minutes: float = 5.0) -> Dict[str, Any]:
        """Run an observation session with real-time visualization"""
        
        if experiment_id not in self.experiments:
            raise ValueError(f"Experiment {experiment_id} not found")
        
        experiment = self.experiments[experiment_id]
        
        # Calculate number of trials based on duration
        trials_per_minute = 20
        total_trials = int(duration_minutes * trials_per_minute)
        
        # Measure observer effect
        observer_effect = self.psychomotor_engine.measure_observer_effect(
            participant_id, observer_mode, total_trials
        )
        
        # Create biological visualization with observer influence
        bio_visualization = self.visualizer.create_biological_visualization(
            experiment['system_type'], observer_effect, total_trials
        )
        
        # Session data
        session = {
            'session_id': f"{experiment_id}_{participant_id}_{int(time.time())}",
            'timestamp': time.time(),
            'participant_id': participant_id,
            'observer_mode': observer_mode,
            'duration_minutes': duration_minutes,
            'total_trials': total_trials,
            'observer_effect': observer_effect,
            'bio_visualization': bio_visualization
        }
        
        experiment['sessions'].append(session)
        self.active_sessions[session['session_id']] = session
        
        # Analysis results
        results = {
            'session_id': session['session_id'],
            'observer_effect_magnitude': observer_effect.effect_magnitude,
            'uncertainty_change': observer_effect.uncertainty_change,
            'performance_changes': {
                'reaction_time_change': (
                    observer_effect.observed_performance.reaction_time_mean - 
                    observer_effect.baseline_performance.reaction_time_mean
                ),
                'accuracy_change': (
                    observer_effect.observed_performance.accuracy_rate - 
                    observer_effect.baseline_performance.accuracy_rate
                ),
                'uncertainty_change': observer_effect.uncertainty_change
            },
            'biological_patterns': {
                'emergence_peaks': int(np.sum(bio_visualization.emergence_indicators > 0.5)),
                'system_coherence': float(np.mean(bio_visualization.interaction_matrix)),
                'observer_influence_strength': float(np.max(np.abs(bio_visualization.observer_influence)))
            },
            'heisenberg_analogy': {
                'measurement_disturbance': observer_effect.effect_magnitude,
                'uncertainty_principle_analog': observer_effect.uncertainty_change,
                'complementarity_observed': observer_effect.uncertainty_change > 0.05
            }
        }
        
        return results
    
    def get_experiment_summary(self, experiment_id: str) -> Dict[str, Any]:
        """Get comprehensive summary of experiment results"""
        
        if experiment_id not in self.experiments:
            raise ValueError(f"Experiment {experiment_id} not found")
        
        experiment = self.experiments[experiment_id]
        sessions = experiment['sessions']
        
        if not sessions:
            return {'experiment_id': experiment_id, 'status': 'no_sessions'}
        
        # Aggregate results across sessions
        effect_magnitudes = [s['observer_effect'].effect_magnitude for s in sessions]
        uncertainty_changes = [s['observer_effect'].uncertainty_change for s in sessions]
        
        observer_modes = [s['observer_mode'] for s in sessions]
        mode_effects = {}
        for mode in set(observer_modes):
            mode_sessions = [s for s in sessions if s['observer_mode'] == mode]
            mode_effects[mode.value] = {
                'mean_effect': np.mean([s['observer_effect'].effect_magnitude for s in mode_sessions]),
                'mean_uncertainty_change': np.mean([s['observer_effect'].uncertainty_change for s in mode_sessions]),
                'session_count': len(mode_sessions)
            }
        
        summary = {
            'experiment_id': experiment_id,
            'system_type': experiment['system_type'].value,
            'total_sessions': len(sessions),
            'participant_count': len(experiment['participant_ids']),
            'overall_statistics': {
                'mean_observer_effect': float(np.mean(effect_magnitudes)),
                'std_observer_effect': float(np.std(effect_magnitudes)),
                'mean_uncertainty_change': float(np.mean(uncertainty_changes)),
                'std_uncertainty_change': float(np.std(uncertainty_changes))
            },
            'observer_mode_analysis': mode_effects,
            'heisenberg_analogy_validation': {
                'observation_induced_disturbance': float(np.mean(effect_magnitudes)) > 0.1,
                'uncertainty_increase_observed': float(np.mean(uncertainty_changes)) > 0,
                'strong_effect_threshold_exceeded': float(np.mean(effect_magnitudes)) > 0.2
            },
            'biological_system_response': {
                'emergence_events_detected': any(
                    np.sum(s['bio_visualization'].emergence_indicators > 0.5) > 5 
                    for s in sessions
                ),
                'observer_influence_significant': any(
                    np.max(np.abs(s['bio_visualization'].observer_influence)) > 0.3 
                    for s in sessions
                )
            }
        }
        
        return summary

# Example usage and demonstration
async def demonstrate_bio3d_bridge():
    """Demonstrate BIO-3D Visualizer Bridge capabilities"""
    
    bridge = Bio3DVisualizerBridge()
    
    # Initialize experiment with fungal system (mushroom connection!)
    experiment_result = await bridge.initialize_experiment(
        "mushroom_consciousness_001",
        ["participant_001", "participant_002"],
        BiologicalSystem.FUNGAL_NETWORK
    )
    
    print("=== BIO-3D Visualizer Bridge Experiment ===")
    print(f"Experiment initialized: {experiment_result}")
    
    # Run observation sessions with different modes
    observer_modes = [
        ObserverMode.UNOBSERVED,
        ObserverMode.PASSIVE_OBSERVED,
        ObserverMode.ACTIVE_MONITORED,
        ObserverMode.INTRUSIVE_FEEDBACK
    ]
    
    for mode in observer_modes:
        session_result = await bridge.run_observation_session(
            "mushroom_consciousness_001",
            "participant_001",
            mode,
            duration_minutes=2.0
        )
        
        print(f"\n=== {mode.value.upper()} Session Results ===")
        print(f"Observer Effect Magnitude: {session_result['observer_effect_magnitude']:.3f}")
        print(f"Uncertainty Change: {session_result['uncertainty_change']:.3f}")
        print(f"Heisenberg Analogy Valid: {session_result['heisenberg_analogy']['complementarity_observed']}")
        print(f"Biological Emergence Events: {session_result['biological_patterns']['emergence_peaks']}")
    
    # Get experiment summary
    summary = bridge.get_experiment_summary("mushroom_consciousness_001")
    print(f"\n=== Experiment Summary ===")
    print(f"Mean Observer Effect: {summary['overall_statistics']['mean_observer_effect']:.3f}")
    print(f"Heisenberg Analogy Validated: {summary['heisenberg_analogy_validation']['observation_induced_disturbance']}")
    print(f"Biological Response Detected: {summary['biological_system_response']['emergence_events_detected']}")
    
    return bridge, summary

if __name__ == "__main__":
    asyncio.run(demonstrate_bio3d_bridge())