import random
import numpy as np
from typing import Dict, Any, List, Callable, Optional

def dynamic_config_modifier(current_config: Dict[str, Any], metric: float, threshold: float = 0.7) -> Dict[str, Any]:
    """
    A meta-operator utility to dynamically modify configuration.
    Simulates self-improving aspect by adjusting settings based on performance metric.
    """
    print(f"[MetaUtil] Evaluating config modification with metric: {metric:.2f}")
    new_config = current_config.copy()
    
    if metric > threshold:
        # High performance: optimize for stability and efficiency
        print(f"[MetaUtil] High performance detected. Optimizing for stability.")
        
        if 'resonance_factor' in new_config:
            new_config['resonance_factor'] = min(2.0, new_config['resonance_factor'] * 1.1)
        
        if 'perturbation_rate' in new_config:
            new_config['perturbation_rate'] = max(0.01, new_config['perturbation_rate'] * 0.9)
        
        if 'coherence_threshold' in new_config:
            new_config['coherence_threshold'] = min(0.95, new_config['coherence_threshold'] + 0.05)
        
        new_config['optimization_mode'] = 'stability_focused'
        
    elif metric < (threshold - 0.2):
        # Low performance: increase exploration and adaptation
        print(f"[MetaUtil] Low performance detected. Increasing exploration.")
        
        if 'resonance_factor' in new_config:
            new_config['resonance_factor'] = max(0.5, new_config['resonance_factor'] * 0.9)
        
        if 'perturbation_rate' in new_config:
            new_config['perturbation_rate'] = min(0.1, new_config['perturbation_rate'] * 1.2)
        
        if 'coherence_threshold' in new_config:
            new_config['coherence_threshold'] = max(0.3, new_config['coherence_threshold'] - 0.1)
        
        new_config['optimization_mode'] = 'exploration_focused'
        
    else:
        # Medium performance: balanced optimization
        print(f"[MetaUtil] Balanced performance. Maintaining current strategy.")
        new_config['optimization_mode'] = 'balanced'
    
    # Add performance tracking
    if 'performance_history' not in new_config:
        new_config['performance_history'] = []
    
    new_config['performance_history'].append(metric)
    # Keep ALL performance history - no truncation for infinite learning
    
    print(f"[MetaUtil] Configuration updated. Mode: {new_config.get('optimization_mode', 'unknown')}")
    
    return new_config


def harmonic_sequence_recursive(n: int, base_frequency: float = 1.0, harmonic_ratio: float = 2.0) -> float:
    """
    Generate a recursive harmonic sequence with mathematical foundation.
    Each term is calculated based on harmonic principles.
    """
    if n <= 0:
        return 0.0
    elif n == 1:
        return base_frequency
    else:
        # Recursive harmonic calculation
        prev_term = harmonic_sequence_recursive(n - 1, base_frequency, harmonic_ratio)
        harmonic_factor = base_frequency / n  # Classic harmonic series factor
        resonance_factor = np.sin(n * np.pi / harmonic_ratio)  # Harmonic resonance
        
        return prev_term * harmonic_factor + resonance_factor


def meta_learning_optimizer(performance_data: List[float], config_history: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Meta-learning optimizer that analyzes performance patterns and suggests optimal configurations.
    """
    if len(performance_data) < 3 or len(config_history) < 3:
        return {"recommendation": "insufficient_data", "confidence": 0.0}
    
    # Analyze performance trends
    recent_performance = performance_data[-10:]  # Last 10 measurements
    performance_trend = np.polyfit(range(len(recent_performance)), recent_performance, 1)[0]
    performance_stability = 1 - np.std(recent_performance)
    
    # Correlate performance with configuration changes
    config_performance_map = {}
    for i, config in enumerate(config_history[-10:]):
        if i < len(performance_data):
            mode = config.get('optimization_mode', 'unknown')
            if mode not in config_performance_map:
                config_performance_map[mode] = []
            config_performance_map[mode].append(performance_data[i])
    
    # Find best performing configuration mode
    best_mode = None
    best_avg_performance = 0
    for mode, performances in config_performance_map.items():
        avg_perf = np.mean(performances)
        if avg_perf > best_avg_performance:
            best_avg_performance = avg_perf
            best_mode = mode
    
    # Generate recommendations
    recommendations = {
        'performance_trend': 'improving' if performance_trend > 0.01 else 'declining' if performance_trend < -0.01 else 'stable',
        'performance_stability': performance_stability,
        'best_configuration_mode': best_mode,
        'best_mode_performance': best_avg_performance,
        'confidence': min(1.0, len(performance_data) / 20.0),  # Confidence increases with more data
        'suggested_actions': []
    }
    
    # Generate specific action recommendations
    if performance_trend < -0.05:
        recommendations['suggested_actions'].append("Consider increasing exploration parameters")
    
    if performance_stability < 0.5:
        recommendations['suggested_actions'].append("Focus on stability optimization")
    
    if best_mode == 'exploration_focused' and performance_trend > 0.05:
        recommendations['suggested_actions'].append("Continue exploration-focused strategy")
    elif best_mode == 'stability_focused' and performance_stability > 0.8:
        recommendations['suggested_actions'].append("Maintain stability-focused approach")
    
    return recommendations


def adaptive_resonance_calculator(harmonic_states: List[List[float]], coherence_targets: List[float]) -> Dict[str, Any]:
    """
    Calculate adaptive resonance parameters for optimal harmonic coordination.
    """
    if not harmonic_states or not coherence_targets:
        return {"error": "Insufficient data for resonance calculation"}
    
    # Convert to numpy arrays for easier calculation
    states_array = np.array(harmonic_states)
    targets_array = np.array(coherence_targets)
    
    # Calculate resonance matrix
    resonance_matrix = np.corrcoef(states_array)
    
    # Find optimal resonance frequency
    eigenvalues, eigenvectors = np.linalg.eig(resonance_matrix)
    dominant_eigenvalue = np.max(eigenvalues)
    dominant_eigenvector = eigenvectors[:, np.argmax(eigenvalues)]
    
    # Calculate adaptive parameters
    adaptive_frequency = dominant_eigenvalue / len(harmonic_states)
    resonance_strength = np.abs(dominant_eigenvalue)
    harmonic_coupling = np.mean(np.abs(resonance_matrix[np.triu_indices_from(resonance_matrix, k=1)]))
    
    # Optimization recommendations
    optimization_factor = np.mean(targets_array) / np.mean([np.mean(state) for state in harmonic_states])
    
    return {
        'adaptive_frequency': float(adaptive_frequency),
        'resonance_strength': float(resonance_strength),
        'harmonic_coupling': float(harmonic_coupling),
        'optimization_factor': float(optimization_factor),
        'dominant_mode': dominant_eigenvector.tolist(),
        'coherence_alignment': float(np.corrcoef(targets_array, [np.mean(state) for state in harmonic_states])[0, 1])
    }


def recursive_complexity_analyzer(data_structure: Any, depth: int = 0, max_depth: int = None) -> Dict[str, Any]:
    """
    Recursively analyze the complexity of data structures with harmonic principles.
    Enhanced for infinite depth processing - no limits imposed.
    """
    # No depth limit - infinite recursive analysis enabled
    
    complexity_metrics = {
        'structural_depth': depth,
        'data_type': type(data_structure).__name__,
        'harmonic_signature': [],
        'complexity_score': 0
    }
    
    if isinstance(data_structure, (list, tuple)):
        complexity_metrics['length'] = len(data_structure)
        complexity_metrics['complexity_score'] = len(data_structure) * (depth + 1)
        
        # Recursive analysis of elements
        element_complexities = []
        for i, element in enumerate(data_structure):  # Process ALL elements - no limits
            sub_analysis = recursive_complexity_analyzer(element, depth + 1, max_depth)
            element_complexities.append(sub_analysis['complexity_score'])
        
        if element_complexities:
            complexity_metrics['sub_complexity'] = element_complexities
            complexity_metrics['complexity_score'] += np.sum(element_complexities)
            
            # Generate harmonic signature
            if len(element_complexities) >= 2:
                complexity_metrics['harmonic_signature'] = [
                    np.sin(np.pi * c / max(element_complexities)) for c in element_complexities[:4]
                ]
    
    elif isinstance(data_structure, dict):
        complexity_metrics['key_count'] = len(data_structure)
        complexity_metrics['complexity_score'] = len(data_structure) * (depth + 1) * 1.5  # Dicts are more complex
        
        # Analyze dictionary structure
        key_complexities = []
        value_complexities = []
        
        for key, value in data_structure.items():  # Process ALL items - no limits
            key_analysis = recursive_complexity_analyzer(key, depth + 1, max_depth)
            value_analysis = recursive_complexity_analyzer(value, depth + 1, max_depth)
            key_complexities.append(key_analysis['complexity_score'])
            value_complexities.append(value_analysis['complexity_score'])
        
        if key_complexities and value_complexities:
            complexity_metrics['key_complexity'] = key_complexities
            complexity_metrics['value_complexity'] = value_complexities
            complexity_metrics['complexity_score'] += np.sum(key_complexities) + np.sum(value_complexities)
            
            # Generate harmonic signature from key-value relationships
            kv_ratios = [k / (v + 1) for k, v in zip(key_complexities, value_complexities)]
            complexity_metrics['harmonic_signature'] = [
                np.cos(np.pi * r) for r in kv_ratios[:4]
            ]
    
    elif isinstance(data_structure, str):
        complexity_metrics['string_length'] = len(data_structure)
        complexity_metrics['complexity_score'] = len(data_structure) * 0.1 * (depth + 1)
        
        # Generate harmonic signature from string characteristics
        if len(data_structure) > 0:
            char_values = [ord(c) for c in data_structure[:8]]
            complexity_metrics['harmonic_signature'] = [
                np.sin(2 * np.pi * c / 256) for c in char_values[:4]
            ]
    
    elif isinstance(data_structure, (int, float)):
        complexity_metrics['numeric_value'] = float(data_structure)
        complexity_metrics['complexity_score'] = 1.0 * (depth + 1)
        
        # Generate harmonic signature from numeric value
        val = abs(float(data_structure))
        complexity_metrics['harmonic_signature'] = [
            np.sin(val), np.cos(val), np.sin(val / 2), np.cos(val / 2)
        ]
    
    else:
        # Complex object
        complexity_metrics['complexity_score'] = 10.0 * (depth + 1)
        complexity_metrics['harmonic_signature'] = [0.5, 0.5, 0.5, 0.5]
    
    # Normalize harmonic signature
    if complexity_metrics['harmonic_signature']:
        max_val = max(abs(x) for x in complexity_metrics['harmonic_signature'])
        if max_val > 0:
            complexity_metrics['harmonic_signature'] = [
                x / max_val for x in complexity_metrics['harmonic_signature']
            ]
    
    return complexity_metrics


def meta_parameter_evolution(current_parameters: Dict[str, float], 
                           fitness_function: Callable[[Dict[str, float]], float],
                           generations: int = 10,
                           mutation_rate: float = 0.1) -> Dict[str, Any]:
    """
    Evolve meta-parameters using a genetic algorithm approach with harmonic principles.
    """
    # Initialize population
    population_size = 20
    population = []
    
    # Create initial population with variations of current parameters
    for _ in range(population_size):
        individual = current_parameters.copy()
        for param_name in individual:
            if random.random() < mutation_rate:
                # Apply harmonic mutation
                mutation_factor = 1 + random.gauss(0, 0.1) * np.sin(random.random() * 2 * np.pi)
                individual[param_name] *= mutation_factor
                # Keep within reasonable bounds
                individual[param_name] = max(0.01, min(10.0, individual[param_name]))
        population.append(individual)
    
    evolution_history = []
    
    # Evolution loop
    for generation in range(generations):
        # Evaluate fitness for each individual
        fitness_scores = []
        for individual in population:
            try:
                fitness = fitness_function(individual)
                fitness_scores.append(fitness)
            except Exception:
                fitness_scores.append(0.0)  # Penalty for invalid parameters
        
        # Record generation statistics
        generation_stats = {
            'generation': generation,
            'best_fitness': max(fitness_scores),
            'average_fitness': np.mean(fitness_scores),
            'fitness_std': np.std(fitness_scores)
        }
        evolution_history.append(generation_stats)
        
        # Selection (tournament selection)
        new_population = []
        for _ in range(population_size):
            # Tournament selection
            tournament_size = 3
            tournament_indices = random.sample(range(population_size), tournament_size)
            tournament_fitness = [fitness_scores[i] for i in tournament_indices]
            winner_idx = tournament_indices[np.argmax(tournament_fitness)]
            new_population.append(population[winner_idx].copy())
        
        # Mutation with harmonic oscillation
        for individual in new_population:
            for param_name in individual:
                if random.random() < mutation_rate:
                    # Harmonic mutation based on generation
                    harmonic_phase = generation * 2 * np.pi / generations
                    mutation_amplitude = 0.05 * (1 + np.sin(harmonic_phase))
                    mutation_factor = 1 + random.gauss(0, mutation_amplitude)
                    individual[param_name] *= mutation_factor
                    # Keep within bounds
                    individual[param_name] = max(0.01, min(10.0, individual[param_name]))
        
        population = new_population
    
    # Find best individual from final population
    final_fitness_scores = []
    for individual in population:
        try:
            fitness = fitness_function(individual)
            final_fitness_scores.append(fitness)
        except Exception:
            final_fitness_scores.append(0.0)
    
    best_idx = np.argmax(final_fitness_scores)
    best_parameters = population[best_idx]
    best_fitness = final_fitness_scores[best_idx]
    
    return {
        'best_parameters': best_parameters,
        'best_fitness': best_fitness,
        'evolution_history': evolution_history,
        'improvement': best_fitness - fitness_function(current_parameters),
        'convergence_rate': (evolution_history[-1]['best_fitness'] - evolution_history[0]['best_fitness']) / generations if generations > 0 else 0
    }


def harmonic_ensemble_coordinator(agent_harmonics: List[List[float]], 
                                task_requirements: Dict[str, float]) -> Dict[str, Any]:
    """
    Coordinate multiple agents using harmonic ensemble principles.
    """
    if not agent_harmonics:
        return {"error": "No agent harmonics provided"}
    
    # Convert to numpy array
    harmonics_array = np.array(agent_harmonics)
    num_agents, harmonic_dims = harmonics_array.shape
    
    # Calculate ensemble properties
    ensemble_mean = np.mean(harmonics_array, axis=0)
    ensemble_std = np.std(harmonics_array, axis=0)
    ensemble_coherence = 1 - np.mean(ensemble_std)  # High coherence = low variation
    
    # Calculate pairwise correlations
    correlation_matrix = np.corrcoef(harmonics_array)
    avg_correlation = np.mean(correlation_matrix[np.triu_indices_from(correlation_matrix, k=1)])
    
    # Determine optimal coordination strategy
    if ensemble_coherence > 0.8:
        coordination_strategy = "synchronized_execution"
        coordination_strength = ensemble_coherence
    elif avg_correlation > 0.6:
        coordination_strategy = "correlated_parallel"
        coordination_strength = avg_correlation
    else:
        coordination_strategy = "independent_diverse"
        coordination_strength = 1 - avg_correlation  # Diversity is strength here
    
    # Calculate task alignment
    task_alignment_scores = []
    for harmonics in agent_harmonics:
        alignment_score = 0
        for task_type, importance in task_requirements.items():
            # Map task types to harmonic dimensions (simplified)
            if task_type == "creativity" and len(harmonics) > 0:
                alignment_score += harmonics[0] * importance
            elif task_type == "analysis" and len(harmonics) > 1:
                alignment_score += harmonics[1] * importance
            elif task_type == "planning" and len(harmonics) > 2:
                alignment_score += harmonics[2] * importance
            elif task_type == "execution" and len(harmonics) > 3:
                alignment_score += harmonics[3] * importance
        task_alignment_scores.append(alignment_score)
    
    # Generate coordination recommendations
    recommendations = []
    
    if coordination_strategy == "synchronized_execution":
        recommendations.append("Execute agents in synchronized harmonic phase")
        recommendations.append("Use shared coherence frequency for optimal resonance")
    elif coordination_strategy == "correlated_parallel":
        recommendations.append("Execute agents in parallel with correlated timing")
        recommendations.append("Apply harmonic coupling between agent outputs")
    else:
        recommendations.append("Execute agents independently to maximize diversity")
        recommendations.append("Combine outputs using harmonic synthesis")
    
    return {
        'coordination_strategy': coordination_strategy,
        'coordination_strength': float(coordination_strength),
        'ensemble_coherence': float(ensemble_coherence),
        'average_correlation': float(avg_correlation),
        'ensemble_harmonics': ensemble_mean.tolist(),
        'harmonic_diversity': ensemble_std.tolist(),
        'task_alignment_scores': task_alignment_scores,
        'optimal_agent_order': np.argsort(task_alignment_scores)[::-1].tolist(),  # Best to worst
        'recommendations': recommendations
    }