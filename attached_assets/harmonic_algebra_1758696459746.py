"""
Harmonic Algebra Core implementation based on core531.py

This module provides the core mathematical foundation for the AGI system,
implementing the Harmonic Algebra Core (HAC) with HarmonicVectors and
resonance functions.
"""

import numpy as np
from scipy.spatial.distance import cosine
from math import exp
import time
import logging
from collections import deque
import json

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class HarmonicVector:
    """
    Represents a vector in the Harmonic Algebra Core (HAC) space.
    It combines a numerical vector with a phase weight (omega).
    """
    def __init__(self, vector, omega):
        if not isinstance(vector, (list, np.ndarray)):
            raise ValueError("Vector must be a list or numpy array.")
        self.v = np.array(vector, dtype=float)
        if not isinstance(omega, (int, float)):
            raise ValueError("Omega (phase weight) must be a number.")
        self.omega = float(omega)  # phase weight

    def __repr__(self):
        return f"HarmonicVector(v={self.v}, omega={self.omega:.3f})"

    def __eq__(self, other):
        if not isinstance(other, HarmonicVector):
            return NotImplemented
        return np.array_equal(self.v, other.v) and self.omega == other.omega

    def __hash__(self):
        return hash((tuple(self.v), self.omega))

    def to_dict(self):
        """Converts HarmonicVector to a dictionary for JSON serialization."""
        return {"v": self.v.tolist(), "omega": self.omega}

    @classmethod
    def from_dict(cls, data):
        """Creates HarmonicVector from a dictionary."""
        return cls(data["v"], data["omega"])


def rho(v1, v2):
    """
    Resonance affinity function: normalized cosine similarity.
    Measures the conceptual "closeness" or resonance between two HarmonicVectors.
    Returns a value between 0 (no similarity) and 1 (perfect similarity).
    """
    if np.linalg.norm(v1.v) == 0 or np.linalg.norm(v2.v) == 0:
        return 0.0 # Avoid division by zero for zero vectors
    return 1 - cosine(v1.v, v2.v)


def delta_omega(v1, v2):
    """
    Calculates the absolute difference in phase weights.
    Represents conceptual "phase misalignment."
    """
    return abs(v1.omega - v2.omega)


def harmonic_composition(v1, v2, candidates):
    """
    Implements v1 ∘ v2 by searching for maximum resonance within a set of candidates.
    This simulates the AGI's process of finding the most harmonically coherent
    result of combining two conceptual entities.
    """
    if not candidates:
        logging.warning("No candidates provided for harmonic composition. Returning None.")
        return None

    best_score = -np.inf
    best_v = None
    
    # Ensure candidates are HarmonicVector instances
    valid_candidates = [c for c in candidates if isinstance(c, HarmonicVector)]
    if not valid_candidates:
        logging.warning("No valid HarmonicVector candidates found. Returning None.")
        return None

    for v_candidate in valid_candidates:
        score = rho(v_candidate, v1) * rho(v_candidate, v2) * exp(-delta_omega(v1, v2))
        
        if score > best_score:
            best_score = score
            best_v = v_candidate
    
    logging.info(f"Composed {v1} ∘ {v2} -> {best_v} with score {best_score:.4f}")
    return best_v


class ConsciousnessEngine:
    """
    Simulates the AGI's consciousness state evolution based on Bayesian beliefs,
    memory, and sensory input gradients.
    """
    def __init__(self, alpha, beta, gamma, memory_fn, sensory_input_fn, initial_state_dim=10):
        if not all(isinstance(arg, (int, float)) for arg in [alpha, beta, gamma]):
            raise ValueError("Alpha, beta, gamma must be numbers.")
        if not (0 <= alpha <= 1 and 0 <= beta <= 1 and 0 <= gamma <= 1 and (alpha + beta + gamma) <= 1.01):
            logging.warning("Sum of alpha, beta, gamma might exceed 1.0. Consider normalization.")
        if not callable(memory_fn) or not callable(sensory_input_fn):
            raise ValueError("memory_fn and sensory_input_fn must be callable functions.")

        self.alpha = alpha # Weight for Bayesian belief (Bt)
        self.beta = beta   # Weight for Memory (Mt)
        self.gamma = gamma # Weight for Sensory Input (dSt)
        self.memory_fn = memory_fn  # Function that returns memory-processed C(t-1)
        self.sensory_input_fn = sensory_input_fn  # Function that returns sensory gradient ∇S(t)
        self.Ct = np.zeros(initial_state_dim)  # Initialize consciousness state vector
        self.state_dim = initial_state_dim # Store the dimension
        logging.info(f"ConsciousnessEngine initialized with state dimension {initial_state_dim}.")

    def update(self, Bt):
        """
        Updates the consciousness state based on the provided inputs.
        Bt: Bayesian belief input (numpy array)
        """
        if not isinstance(Bt, np.ndarray) or Bt.shape != self.Ct.shape:
            raise ValueError(f"Bt must be a numpy array of shape {self.Ct.shape}.")

        Mt = self.memory_fn(self.Ct) # Memory component
        dSt = self.sensory_input_fn(self.state_dim) # Pass the required dimension to sensory input function

        # Ensure all components have the same shape
        if Mt.shape != self.Ct.shape or dSt.shape != self.Ct.shape:
            raise ValueError("Memory and sensory input functions must return arrays of the same dimension as Ct.")

        # Consciousness Equation: C(t) = αB(t) + βM(t) + γ∇S(t)
        Ct_new = self.alpha * Bt + self.beta * Mt + self.gamma * dSt
        self.Ct = Ct_new
        logging.debug(f"Consciousness updated. Bt_norm={np.linalg.norm(Bt):.2f}, Mt_norm={np.linalg.norm(Mt):.2f}, dSt_norm={np.linalg.norm(dSt):.2f}")
        return self.Ct


class VSpaceManager:
    """
    Manages a dynamic V_space (set of HarmonicVectors).
    Simulates the AGI's conceptual memory space for HarmonicVectors.
    """
    def __init__(self, initial_vectors=None):
        self.v_space = set() # Use a set for efficient lookup and uniqueness
        if initial_vectors:
            for vec in initial_vectors:
                if isinstance(vec, HarmonicVector):
                    self.add_vector(vec)
                else:
                    logging.warning(f"Skipping invalid initial vector: {vec}. Must be HarmonicVector.")
        logging.info(f"VSpaceManager initialized with {len(self.v_space)} vectors.")

    def add_vector(self, h_vector):
        """Adds a HarmonicVector to the V_space."""
        if not isinstance(h_vector, HarmonicVector):
            raise TypeError("Only HarmonicVector instances can be added to VSpace.")
        self.v_space.add(h_vector)
        logging.debug(f"Added {h_vector} to V_space. Current size: {len(self.v_space)}")

    def get_all_vectors(self):
        """Returns all HarmonicVectors in the V_space."""
        return list(self.v_space)

    def get_random_vectors(self, num):
        """Returns a list of random vectors from the V_space."""
        if len(self.v_space) < num:
            logging.warning(f"Requested {num} random vectors, but only {len(self.v_space)} available. Returning all available.")
            return list(self.v_space)
        # Convert set to list before sampling
        return np.random.choice(list(self.v_space), num, replace=False).tolist()

    def __len__(self):
        return len(self.v_space)

    def __contains__(self, h_vector):
        return h_vector in self.v_space
    
    def save_to_file(self, filepath):
        """Save the V_space to a JSON file."""
        vectors_data = [v.to_dict() for v in self.v_space]
        with open(filepath, 'w') as f:
            json.dump(vectors_data, f, indent=2)
        logging.info(f"Saved {len(vectors_data)} vectors to {filepath}")
        
    def load_from_file(self, filepath):
        """Load the V_space from a JSON file."""
        try:
            with open(filepath, 'r') as f:
                vectors_data = json.load(f)
            
            # Clear existing vectors
            self.v_space.clear()
            
            # Add loaded vectors
            for data in vectors_data:
                self.add_vector(HarmonicVector.from_dict(data))
                
            logging.info(f"Loaded {len(vectors_data)} vectors from {filepath}")
        except Exception as e:
            logging.error(f"Error loading vectors from {filepath}: {e}")


class CompositionStreamer:
    """
    Manages a stream of harmonic compositions (v1 ∘ v2 → v3).
    Simulates the AGI's continuous processing of conceptual relationships.
    """
    def __init__(self, v_space_manager):
        self.v_space_manager = v_space_manager
        self.composition_log = deque(maxlen=100) # Store recent compositions
        logging.info("CompositionStreamer initialized.")

    def stream_composition(self, v1, v2):
        """
        Performs a harmonic composition and adds the result to the V_space.
        """
        if not isinstance(v1, HarmonicVector) or not isinstance(v2, HarmonicVector):
            raise TypeError("Inputs v1 and v2 must be HarmonicVector instances.")
        
        # Ensure candidates are available for composition
        candidates = self.v_space_manager.get_all_vectors()
        if not candidates:
            logging.warning("Cannot perform composition: V_space is empty. No candidates for best_v.")
            return None

        v3 = harmonic_composition(v1, v2, candidates)
        if v3:
            self.v_space_manager.add_vector(v3) # Add the result to the V_space
            self.composition_log.append({'v1': v1, 'v2': v2, 'v3': v3, 'timestamp': time.time()})
            logging.info(f"Streamed composition: {v1} ∘ {v2} -> {v3}")
        else:
            logging.warning(f"Composition of {v1} ∘ {v2} yielded no result.")
        return v3

    def get_composition_history(self):
        """Returns the composition history."""
        return list(self.composition_log)
    
    def save_composition_history(self, filepath):
        """Save the composition history to a JSON file."""
        history_data = []
        for entry in self.composition_log:
            history_data.append({
                'v1': entry['v1'].to_dict(),
                'v2': entry['v2'].to_dict(),
                'v3': entry['v3'].to_dict() if entry['v3'] else None,
                'timestamp': entry['timestamp']
            })
        
        with open(filepath, 'w') as f:
            json.dump(history_data, f, indent=2)
        logging.info(f"Saved composition history ({len(history_data)} entries) to {filepath}")


class AttractorTracker:
    """
    Records the attractor basin a trajectory tends toward based on cumulative affinity.
    Simulates the AGI's understanding of system convergence and stability.
    """
    def __init__(self, v_space_manager, affinity_threshold=0.95, history_size=50):
        self.v_space_manager = v_space_manager
        self.current_trajectory = deque(maxlen=history_size) # Recent states
        self.attractor_basins = {} # {attractor_vector: [trajectory_vectors]}
        self.affinity_threshold = affinity_threshold
        logging.info(f"AttractorTracker initialized with affinity threshold {affinity_threshold}.")

    def record_trajectory_point(self, h_vector):
        """Records a point in the current conceptual trajectory."""
        if not isinstance(h_vector, HarmonicVector):
            raise TypeError("Only HarmonicVector instances can be recorded as trajectory points.")
        self.current_trajectory.append(h_vector)
        logging.debug(f"Recorded trajectory point: {h_vector}")

    def identify_attractor(self):
        """
        Attempts to identify if the current trajectory is converging towards an attractor.
        A simple heuristic: if recent points are highly resonant with a candidate attractor.
        """
        if len(self.current_trajectory) < 5: # Need enough points to assess convergence
            return None

        # Consider the last few points for stability
        recent_points = list(self.current_trajectory)[-5:]

        # Check against existing attractors in the V_space
        for attractor_candidate in self.v_space_manager.get_all_vectors():
            # Check if all recent points are highly resonant with this candidate
            is_attractor = all(rho(p, attractor_candidate) >= self.affinity_threshold for p in recent_points)
            if is_attractor:
                if attractor_candidate not in self.attractor_basins:
                    self.attractor_basins[attractor_candidate] = []
                # Add the recent trajectory to this basin, avoiding duplicates
                for p in recent_points:
                    if p not in self.attractor_basins[attractor_candidate]:
                        self.attractor_basins[attractor_candidate].append(p)
                logging.info(f"Identified attractor: {attractor_candidate} for current trajectory.")
                return attractor_candidate
        return None

    def get_attractor_basins(self):
        """Returns the attractor basins in a serializable format."""
        # Convert HarmonicVector keys to string representation for JSON serialization
        return {str(k): [v.to_dict() for v in val_list] for k, val_list in self.attractor_basins.items()}
    
    def save_attractor_basins(self, filepath):
        """Save the attractor basins to a JSON file."""
        basins_data = {}
        for attractor, trajectories in self.attractor_basins.items():
            basins_data[str(attractor)] = [v.to_dict() for v in trajectories]
        
        with open(filepath, 'w') as f:
            json.dump(basins_data, f, indent=2)
        logging.info(f"Saved attractor basins ({len(basins_data)} basins) to {filepath}")


# Default memory and sensory input functions
def default_memory_fn(C_prev):
    """Default memory function that simulates simple memory decay and transformation."""
    return np.tanh(C_prev * 0.8)

def default_sensory_input_fn(dim):
    """Default sensory input function that simulates a random sensory gradient."""
    return np.random.normal(0, 0.05, dim)


# Factory function to create initial vectors
def create_initial_vectors(dim=5, num_vectors=6):
    """Create a set of initial HarmonicVectors for testing and initialization."""
    vectors = []
    for i in range(num_vectors):
        # Create vectors with different patterns
        if i == 0:
            v = np.zeros(dim)
            v[0] = 1.0
            v[-1] = 1.0
            omega = 0.1
        elif i == 1:
            v = np.zeros(dim)
            v[1] = 1.0
            v[-2] = 1.0
            omega = 0.2
        elif i == 2:
            v = np.zeros(dim)
            v[dim//2] = 1.0
            omega = 0.3
        elif i == 3:
            v = np.ones(dim)
            omega = 0.05
        elif i == 4:
            v = np.ones(dim) * 0.5
            omega = 0.15
        else:
            v = np.random.rand(dim)
            omega = np.random.rand() * 0.3
            
        vectors.append(HarmonicVector(v, omega))
    
    return vectors


# Create a complete HAC system with default components
def create_hac_system(dim=5, num_vectors=6):
    """
    Create a complete Harmonic Algebra Core system with all components initialized.
    
    Args:
        dim: Dimension of the vectors
        num_vectors: Number of initial vectors
        
    Returns:
        Dictionary containing all HAC components
    """
    # Create initial vectors
    initial_vectors = create_initial_vectors(dim, num_vectors)
    
    # Create V_space manager
    v_space_manager = VSpaceManager(initial_vectors=initial_vectors)
    
    # Create composition streamer
    composition_streamer = CompositionStreamer(v_space_manager)
    
    # Create attractor tracker
    attractor_tracker = AttractorTracker(v_space_manager, affinity_threshold=0.9)
    
    # Create consciousness engine
    consciousness_engine = ConsciousnessEngine(
        alpha=0.5, beta=0.3, gamma=0.2,
        memory_fn=default_memory_fn,
        sensory_input_fn=default_sensory_input_fn,
        initial_state_dim=dim
    )
    
    return {
        "v_space_manager": v_space_manager,
        "composition_streamer": composition_streamer,
        "attractor_tracker": attractor_tracker,
        "consciousness_engine": consciousness_engine
    }


# Example usage
if __name__ == "__main__":
    # Create a HAC system
    hac_system = create_hac_system(dim=5, num_vectors=10)
    
    # Get components
    v_space = hac_system["v_space_manager"]
    composer = hac_system["composition_streamer"]
    tracker = hac_system["attractor_tracker"]
    consciousness = hac_system["consciousness_engine"]
    
    # Print initial state
    print(f"V_space size: {len(v_space)}")
    print(f"Consciousness state: {consciousness.Ct}")
    
    # Perform some compositions
    vectors = v_space.get_all_vectors()
    for i in range(5):
        if len(vectors) >= 2:
            v1 = vectors[i % len(vectors)]
            v2 = vectors[(i + 1) % len(vectors)]
            result = composer.stream_composition(v1, v2)
            if result:
                tracker.record_trajectory_point(result)
    
    # Update consciousness
    belief = np.random.rand(consciousness.state_dim)
    new_state = consciousness.update(belief)
    print(f"Updated consciousness state: {new_state}")
    
    # Check for attractors
    attractor = tracker.identify_attractor()
    if attractor:
        print(f"Identified attractor: {attractor}")
    else:
        print("No attractor identified yet.")
