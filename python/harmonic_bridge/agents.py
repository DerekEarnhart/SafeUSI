import random
import time
import numpy as np
from typing import Dict, Any, List, Optional

class Agent:
    def __init__(self, agi_core, agent_id: str = None, agent_type: str = "generic"):
        self.agi_core = agi_core
        self.agent_id = agent_id or f"agent_{int(time.time())}"
        self.agent_type = agent_type
        self.harmonic_state = [0.5, 0.5, 0.5, 0.5]
        self.coherence = 0.5
        self.performance_history = []

    def update_harmonic_state(self, new_state: List[float]):
        """Update agent's harmonic state"""
        self.harmonic_state = new_state
        self.coherence = self.agi_core.calculate_coherence(new_state, [0.7, 0.3, 0.5, 0.9])

    def get_performance_metric(self) -> float:
        """Calculate current performance metric"""
        if not self.performance_history:
            return 0.5
        return np.mean(self.performance_history[-10:])  # Average of last 10 tasks


class AppSynthesizerAgent(Agent):
    def __init__(self, agi_core, agent_id: str = None):
        super().__init__(agi_core, agent_id, "app_synthesizer")
        self.specialized_hooks = [
            "prime‑quantum compression", 
            "infinite context surfaces", 
            "safety‑preserving operator", 
            "self‑auditing traces", 
            "harmonic scheduler",
            "neural-symbolic bridge",
            "adaptive coherence controller"
        ]

    def synth_app(self, task: str) -> Dict[str, Any]:
        """Synthesize application architecture with harmonic enhancement"""
        start_time = time.time()
        
        # Generate task-specific harmonic state
        task_harmonics = self.agi_core.calculate_harmonic_state(task)
        self.update_harmonic_state(task_harmonics)
        
        # Select appropriate hooks based on harmonic analysis
        rng_seed = f"app:{task}"
        random.seed(hash(rng_seed))
        
        # Choose hooks based on coherence level
        if self.coherence > 0.8:
            selected_hooks = random.sample(self.specialized_hooks, 3)
        elif self.coherence > 0.5:
            selected_hooks = random.sample(self.specialized_hooks, 2)
        else:
            selected_hooks = [random.choice(self.specialized_hooks)]
        
        # Get planning strategy from AGICore
        strategy = self.agi_core.operational_rules.get('planning_strategy', 'standard')
        
        # Generate architecture with harmonic optimization
        architecture = self._generate_harmonic_architecture(task, selected_hooks, strategy)
        
        processing_time = time.time() - start_time
        performance = min(1.0, self.coherence / processing_time)
        self.performance_history.append(performance)
        
        return {
            'architecture': architecture,
            'selected_hooks': selected_hooks,
            'harmonic_state': self.harmonic_state,
            'coherence': self.coherence,
            'processing_time': processing_time,
            'performance': performance,
            'optimization_level': strategy
        }

    def _generate_harmonic_architecture(self, task: str, hooks: List[str], strategy: str) -> str:
        """Generate architecture description with harmonic principles"""
        base_arch = f"Minimal orchestrator for \"{task}\" with {', '.join(hooks)}"
        
        # Add harmonic enhancements
        harmonic_features = []
        if self.coherence > 0.7:
            harmonic_features.append("coherence-optimized data flow")
        if self.harmonic_state[0] > 0.6:
            harmonic_features.append("resonance-based load balancing")
        if np.std(self.harmonic_state) < 0.3:
            harmonic_features.append("harmonic stability controls")
        
        enhancements = f", {', '.join(harmonic_features)}" if harmonic_features else ""
        
        return f"{base_arch}{enhancements}, typed IO ports, offline‑first state, JSON export. Strategy: {strategy}. Harmonic coherence: {self.coherence:.3f}."


class StrategicPlannerAgent(Agent):
    def __init__(self, agi_core, agent_id: str = None):
        super().__init__(agi_core, agent_id, "strategic_planner")
        self.planning_depth = 3
        self.harmonic_decomposition = True

    def synth_plan(self, task: str) -> Dict[str, Any]:
        """Synthesize strategic plan with harmonic decomposition"""
        start_time = time.time()
        
        # Generate task-specific harmonic state
        task_harmonics = self.agi_core.calculate_harmonic_state(task)
        self.update_harmonic_state(task_harmonics)
        
        # Adjust planning depth based on coherence
        effective_depth = int(self.planning_depth * (0.5 + self.coherence))
        
        # Recursive harmonic decomposition
        overall_plan_steps = self._harmonic_decompose_task(task, effective_depth)
        
        # Add harmonic synthesis steps
        synthesis_steps = [
            "Parallel harmonic search; collect resonant artifacts",
            "Score with coherence + cost + harmonic stability; downselect",
            "Assemble final solution; generate harmonic tests + README"
        ]
        
        final_plan = overall_plan_steps + synthesis_steps
        plan_text = "\n".join(final_plan)
        
        processing_time = time.time() - start_time
        performance = min(1.0, len(final_plan) / (processing_time * 10))
        self.performance_history.append(performance)
        
        return {
            'plan': plan_text,
            'plan_steps': final_plan,
            'planning_depth': effective_depth,
            'harmonic_state': self.harmonic_state,
            'coherence': self.coherence,
            'processing_time': processing_time,
            'performance': performance,
            'total_steps': len(final_plan)
        }

    def _harmonic_decompose_task(self, task: str, depth: int = 0) -> List[str]:
        """Recursive task decomposition with harmonic principles"""
        if depth > self.planning_depth or len(task) < 10:
            return [f"Leaf step: Formalize harmonic micro-operators for '{task}'"]

        steps = [
            f"Define harmonic intent for '{task}' → constraints → success metrics",
            f"Decompose '{task}' into coherent agents; assign harmonic capabilities"
        ]
        
        # Harmonic subdivision
        if self.harmonic_decomposition and depth < 2:
            mid_point = len(task) // 2
            if mid_point > 0:
                # Calculate harmonic resonance points for optimal subdivision
                harmonic_point1 = int(len(task) * self.harmonic_state[0])
                harmonic_point2 = int(len(task) * self.harmonic_state[1])
                
                if harmonic_point1 > 0 and harmonic_point1 < len(task):
                    sub_task1 = task[:harmonic_point1]
                    steps.extend(self._harmonic_decompose_task(sub_task1, depth + 1))
                
                if harmonic_point2 > harmonic_point1 and harmonic_point2 < len(task):
                    sub_task2 = task[harmonic_point1:harmonic_point2]
                    steps.extend(self._harmonic_decompose_task(sub_task2, depth + 1))
                
                if harmonic_point2 < len(task):
                    sub_task3 = task[harmonic_point2:]
                    steps.extend(self._harmonic_decompose_task(sub_task3, depth + 1))
        
        return steps


class CreativeModulatorAgent(Agent):
    def __init__(self, agi_core, agent_id: str = None):
        super().__init__(agi_core, agent_id, "creative_modulator")
        self.creative_palettes = {
            'harmonic': ["neon on slate", "matte indigo", "graphite + cyan", "midnight gradient"],
            'resonant': ["aurora spectrum", "plasma flow", "quantum shimmer", "coherent light"],
            'stable': ["earth tones", "natural harmony", "balanced contrast", "organic gradients"]
        }
        self.motif_library = {
            'wave': ["concentric waves", "interference patterns", "standing waves", "harmonic oscillations"],
            'geometric': ["lattice lines", "fractal structures", "crystalline forms", "sacred geometry"],
            'organic': ["flowing curves", "neural networks", "growth patterns", "evolutionary forms"],
            'quantum': ["phosphor dots", "isometric orbits", "probability clouds", "entanglement lines"]
        }

    def synth_creative(self, task: str) -> Dict[str, Any]:
        """Synthesize creative direction with harmonic aesthetic principles"""
        start_time = time.time()
        
        # Generate task-specific harmonic state
        task_harmonics = self.agi_core.calculate_harmonic_state(task)
        self.update_harmonic_state(task_harmonics)
        
        # Select aesthetic elements based on harmonic state
        palette_type = self._select_palette_type()
        motif_type = self._select_motif_type()
        
        rng_seed = f"crea:{task}"
        random.seed(hash(rng_seed))
        
        selected_palette = random.choice(self.creative_palettes[palette_type])
        selected_motif = random.choice(self.motif_library[motif_type])
        
        # Generate harmonic tone description
        tone = self._generate_harmonic_tone()
        
        # Create aesthetic synthesis
        aesthetic_result = self._synthesize_aesthetic(selected_palette, selected_motif, tone, task)
        
        processing_time = time.time() - start_time
        performance = self.coherence * (1 / max(processing_time, 0.001))
        self.performance_history.append(performance)
        
        return {
            'aesthetic': aesthetic_result,
            'palette': selected_palette,
            'motif': selected_motif,
            'tone': tone,
            'harmonic_state': self.harmonic_state,
            'coherence': self.coherence,
            'processing_time': processing_time,
            'performance': performance,
            'creative_resonance': self._calculate_creative_resonance()
        }

    def _select_palette_type(self) -> str:
        """Select palette type based on harmonic state"""
        harmonic_energy = np.sum(self.harmonic_state)
        
        if harmonic_energy > 2.5:
            return 'resonant'
        elif harmonic_energy < 1.5:
            return 'stable'
        else:
            return 'harmonic'

    def _select_motif_type(self) -> str:
        """Select motif type based on harmonic characteristics"""
        variance = np.var(self.harmonic_state)
        
        if variance > 0.3:
            return 'quantum'
        elif self.harmonic_state[0] > 0.7:
            return 'wave'
        elif self.harmonic_state[1] > 0.7:
            return 'geometric'
        else:
            return 'organic'

    def _generate_harmonic_tone(self) -> str:
        """Generate tone description based on harmonic analysis"""
        base_tones = ["confident", "lucid", "technical‑poetic", "transcendent", "harmonic"]
        
        # Select tones based on harmonic characteristics
        selected_tones = []
        if self.coherence > 0.8:
            selected_tones.append("confident")
        if self.harmonic_state[2] > 0.6:
            selected_tones.append("lucid")
        if np.mean(self.harmonic_state) > 0.5:
            selected_tones.append("technical‑poetic")
        
        if not selected_tones:
            selected_tones = [random.choice(base_tones)]
        
        return ", ".join(selected_tones)

    def _synthesize_aesthetic(self, palette: str, motif: str, tone: str, task: str) -> str:
        """Synthesize final aesthetic description"""
        harmonic_modifier = ""
        if self.coherence > 0.8:
            harmonic_modifier = " with high-coherence resonance"
        elif self.coherence < 0.3:
            harmonic_modifier = " with exploratory variance"
        
        return f"Art direction: {palette}{harmonic_modifier}. Motif: {motif}. Tone: {tone}. Harmonic optimization for '{task[:30]}...' at {self.coherence:.2f} coherence."

    def _calculate_creative_resonance(self) -> float:
        """Calculate creative resonance metric"""
        harmonic_balance = 1 - np.std(self.harmonic_state)
        creative_energy = np.mean(self.harmonic_state)
        coherence_factor = self.coherence
        
        return float((harmonic_balance + creative_energy + coherence_factor) / 3)


class SequenceAnalyzerAgent(Agent):
    def __init__(self, agi_core, agent_id: str = None):
        super().__init__(agi_core, agent_id, "sequence_analyzer")
        self.analysis_modes = ["pattern_detection", "harmonic_analysis", "trend_identification", "anomaly_detection"]

    def analyze_sequence(self, data: List[Any]) -> Dict[str, Any]:
        """Analyze sequences with harmonic pattern detection"""
        start_time = time.time()
        
        # Convert data to numerical sequence for harmonic analysis
        numerical_sequence = self._convert_to_numerical(data)
        
        # Generate harmonic state based on sequence properties
        sequence_harmonics = self.agi_core.calculate_harmonic_state(str(numerical_sequence))
        self.update_harmonic_state(sequence_harmonics)
        
        # Perform multi-mode analysis
        analysis_results = {}
        for mode in self.analysis_modes:
            analysis_results[mode] = self._analyze_with_mode(numerical_sequence, mode)
        
        # Harmonic pattern extraction
        harmonic_patterns = self._extract_harmonic_patterns(numerical_sequence)
        
        processing_time = time.time() - start_time
        performance = min(1.0, len(analysis_results) / processing_time)
        self.performance_history.append(performance)
        
        return {
            'sequence_length': len(data),
            'analysis_results': analysis_results,
            'harmonic_patterns': harmonic_patterns,
            'harmonic_state': self.harmonic_state,
            'coherence': self.coherence,
            'processing_time': processing_time,
            'performance': performance
        }

    def _convert_to_numerical(self, data: List[Any]) -> List[float]:
        """Convert any data sequence to numerical representation"""
        numerical = []
        for item in data:
            if isinstance(item, (int, float)):
                numerical.append(float(item))
            elif isinstance(item, str):
                numerical.append(float(sum(ord(c) for c in item) % 1000))
            elif isinstance(item, dict):
                numerical.append(float(len(str(item))))
            else:
                numerical.append(float(hash(str(item)) % 1000))
        return numerical

    def _analyze_with_mode(self, sequence: List[float], mode: str) -> Dict[str, Any]:
        """Analyze sequence with specific mode"""
        if mode == "pattern_detection":
            return self._detect_patterns(sequence)
        elif mode == "harmonic_analysis":
            return self._harmonic_frequency_analysis(sequence)
        elif mode == "trend_identification":
            return self._identify_trends(sequence)
        elif mode == "anomaly_detection":
            return self._detect_anomalies(sequence)
        else:
            return {"error": f"Unknown analysis mode: {mode}"}

    def _detect_patterns(self, sequence: List[float]) -> Dict[str, Any]:
        """Detect recurring patterns in the sequence"""
        if len(sequence) < 3:
            return {"patterns": [], "confidence": 0.0}
        
        patterns = []
        for length in range(2, min(len(sequence) // 2, 10)):
            for start in range(len(sequence) - length * 2):
                pattern = sequence[start:start + length]
                next_occurrence = sequence[start + length:start + length * 2]
                
                similarity = self.agi_core.calculate_coherence(pattern, next_occurrence)
                if similarity > 0.8:
                    patterns.append({
                        'pattern': pattern,
                        'length': length,
                        'start_position': start,
                        'similarity': similarity
                    })
        
        return {
            'patterns': patterns[:5],  # Top 5 patterns
            'pattern_count': len(patterns),
            'confidence': np.mean([p['similarity'] for p in patterns]) if patterns else 0.0
        }

    def _harmonic_frequency_analysis(self, sequence: List[float]) -> Dict[str, Any]:
        """Perform harmonic frequency analysis"""
        if len(sequence) < 4:
            return {"frequencies": [], "dominant_frequency": 0, "harmonic_energy": 0}
        
        # Simple FFT-like analysis
        fft_result = np.fft.fft(sequence)
        frequencies = np.abs(fft_result)
        dominant_freq_idx = np.argmax(frequencies[1:len(frequencies)//2]) + 1
        
        return {
            'frequencies': frequencies[:min(10, len(frequencies))].tolist(),
            'dominant_frequency': float(dominant_freq_idx),
            'harmonic_energy': float(np.sum(frequencies**2)),
            'spectral_centroid': float(np.sum(frequencies * np.arange(len(frequencies))) / np.sum(frequencies))
        }

    def _identify_trends(self, sequence: List[float]) -> Dict[str, Any]:
        """Identify trends in the sequence"""
        if len(sequence) < 2:
            return {"trend": "insufficient_data", "slope": 0, "confidence": 0}
        
        x = np.arange(len(sequence))
        coeffs = np.polyfit(x, sequence, 1)
        slope = coeffs[0]
        
        trend_type = "increasing" if slope > 0.1 else "decreasing" if slope < -0.1 else "stable"
        
        # Calculate R-squared for trend confidence
        predicted = np.polyval(coeffs, x)
        ss_res = np.sum((sequence - predicted) ** 2)
        ss_tot = np.sum((sequence - np.mean(sequence)) ** 2)
        r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
        
        return {
            'trend': trend_type,
            'slope': float(slope),
            'confidence': float(max(0, r_squared)),
            'predicted_next': float(slope * len(sequence) + coeffs[1])
        }

    def _detect_anomalies(self, sequence: List[float]) -> Dict[str, Any]:
        """Detect anomalies in the sequence"""
        if len(sequence) < 3:
            return {"anomalies": [], "anomaly_count": 0}
        
        mean_val = np.mean(sequence)
        std_val = np.std(sequence)
        threshold = 2 * std_val
        
        anomalies = []
        for i, value in enumerate(sequence):
            if abs(value - mean_val) > threshold:
                anomalies.append({
                    'index': i,
                    'value': float(value),
                    'deviation': float(abs(value - mean_val) / std_val) if std_val > 0 else 0
                })
        
        return {
            'anomalies': anomalies,
            'anomaly_count': len(anomalies),
            'anomaly_rate': len(anomalies) / len(sequence)
        }

    def _extract_harmonic_patterns(self, sequence: List[float]) -> Dict[str, Any]:
        """Extract harmonic patterns from the sequence"""
        if len(sequence) < 4:
            return {"harmonic_strength": 0, "resonance_points": []}
        
        # Calculate harmonic resonance at different points
        resonance_points = []
        window_size = min(4, len(sequence) // 2)
        
        for i in range(len(sequence) - window_size + 1):
            window = sequence[i:i + window_size]
            harmonic_state = self.agi_core.calculate_harmonic_state(str(window))
            coherence = self.agi_core.calculate_coherence(harmonic_state, self.harmonic_state)
            
            if coherence > 0.6:
                resonance_points.append({
                    'position': i,
                    'coherence': float(coherence),
                    'local_harmonics': harmonic_state
                })
        
        harmonic_strength = np.mean([rp['coherence'] for rp in resonance_points]) if resonance_points else 0
        
        return {
            'harmonic_strength': float(harmonic_strength),
            'resonance_points': resonance_points[:10],  # Top 10 resonance points
            'harmonic_stability': float(1 - np.std([rp['coherence'] for rp in resonance_points])) if len(resonance_points) > 1 else 0
        }


# Agent factory for creating specialized agents
def create_agent(agent_type: str, agi_core, agent_id: str = None) -> Agent:
    """Factory function to create specialized agents"""
    agents = {
        'app_synthesizer': AppSynthesizerAgent,
        'strategic_planner': StrategicPlannerAgent,
        'creative_modulator': CreativeModulatorAgent,
        'sequence_analyzer': SequenceAnalyzerAgent,
        'geo_art': CreativeModulatorAgent,  # Alias for geometric art
        'story_builder': StrategicPlannerAgent,  # Alias for narrative planning
        'vfx_sim': AppSynthesizerAgent,  # Alias for VFX simulation
        'music_composer': CreativeModulatorAgent,  # Alias for music composition
    }
    
    agent_class = agents.get(agent_type, Agent)
    return agent_class(agi_core, agent_id)