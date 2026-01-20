import numpy as np
from scipy.spatial.distance import cosine
from math import exp
import time
import logging
from collections import deque
from flask import Flask, request, jsonify
from flask_cors import CORS # For cross-origin requests from a web frontend

# Configure logging for better visibility
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- 1. Core: HAC Definition ---
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

# --- 2. Consciousness Equation Engine ---
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

# --- 3. Runtime Sandbox Components ---

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
        return list(self.composition_log)

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
        # Convert HarmonicVector keys to string representation for JSON serialization
        return {str(k): [v.to_dict() for v in val_list] for k, val_list in self.attractor_basins.items()}


# --- Mock functions for ConsciousnessEngine (used by API) ---
def memory_fn_mock(C_prev):
    """Simulates simple memory decay and transformation."""
    return np.tanh(C_prev * 0.8)

def sensory_input_fn_mock(dim):
    """Simulates a random sensory gradient of the specified dimension."""
    return np.random.normal(0, 0.05, dim)

# --- Flask API Setup ---
app = Flask(__name__)
CORS(app) # Enable CORS for frontend integration

# Global instances of the simulation components
# These will hold the state of our conceptual AGI runtime
initial_h_vectors = [
    HarmonicVector([1, 0, 0, 0, 1], 0.1),
    HarmonicVector([0, 1, 0, 1, 0], 0.2),
    HarmonicVector([0, 0, 1, 0, 0], 0.3),
    HarmonicVector([1, 1, 1, 1, 1], 0.05),
    HarmonicVector([0.5, 0.5, 0.5, 0.5, 0.5], 0.15),
    HarmonicVector([0.1, 0.9, 0.2, 0.8, 0.3], 0.25),
]
# Determine initial state dimension from initial vectors
initial_state_dim = initial_h_vectors[0].v.shape[0] if initial_h_vectors else 5 # Default to 5 if no initial vectors

v_space_manager = VSpaceManager(initial_vectors=initial_h_vectors)
composition_streamer = CompositionStreamer(v_space_manager)
attractor_tracker = AttractorTracker(v_space_manager, affinity_threshold=0.9)
consciousness_engine = ConsciousnessEngine(
    alpha=0.5, beta=0.3, gamma=0.2,
    memory_fn=memory_fn_mock,
    sensory_input_fn=sensory_input_fn_mock,
    initial_state_dim=initial_state_dim
)

# --- API Endpoints ---

@app.route('/')
def index():
    return "Harmonic Algebra Core (HAC) + Consciousness Equations API is running!"

@app.route('/status', methods=['GET'])
def get_status():
    """Returns the current status of the AGI runtime."""
    return jsonify({
        "v_space_size": len(v_space_manager),
        "consciousness_state": consciousness_engine.Ct.tolist(),
        "recent_compositions_count": len(composition_streamer.get_composition_history()),
        "attractor_basins_count": len(attractor_tracker.get_attractor_basins()),
        "message": "AGI Core operational."
    })

@app.route('/consciousness/update', methods=['POST'])
def update_consciousness():
    """
    Updates the consciousness state.
    Expects JSON: {"bt_input": [float, ...]}
    """
    data = request.get_json()
    if not data or "bt_input" not in data:
        return jsonify({"error": "Missing 'bt_input' in request body."}), 400
    
    try:
        bt_input = np.array(data["bt_input"], dtype=float)
        updated_ct = consciousness_engine.update(bt_input)
        return jsonify({
            "status": "success",
            "consciousness_state": updated_ct.tolist()
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logging.error(f"Error updating consciousness: {e}")
        return jsonify({"error": "Internal server error during consciousness update."}), 500

@app.route('/vspace/add', methods=['POST'])
def add_harmonic_vector():
    """
    Adds a new HarmonicVector to the V_space.
    Expects JSON: {"vector": [float, ...], "omega": float}
    """
    data = request.get_json()
    if not data or "vector" not in data or "omega" not in data:
        return jsonify({"error": "Missing 'vector' or 'omega' in request body."}), 400
    
    try:
        h_vector = HarmonicVector(data["vector"], data["omega"])
        v_space_manager.add_vector(h_vector)
        return jsonify({
            "status": "success",
            "message": "HarmonicVector added.",
            "v_space_size": len(v_space_manager)
        })
    except (ValueError, TypeError) as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logging.error(f"Error adding vector to VSpace: {e}")
        return jsonify({"error": "Internal server error adding HarmonicVector."}), 500

@app.route('/vspace/all', methods=['GET'])
def get_all_vspace_vectors():
    """Returns all HarmonicVectors in the V_space."""
    vectors = [vec.to_dict() for vec in v_space_manager.get_all_vectors()]
    return jsonify({"vectors": vectors, "count": len(vectors)})

@app.route('/composition/stream', methods=['POST'])
def stream_composition():
    """
    Performs a harmonic composition between two vectors from V_space.
    Expects JSON: {"v1_index": int, "v2_index": int}
    (or later, direct vector data)
    """
    data = request.get_json()
    if not data or "v1_index" not in data or "v2_index" not in data:
        return jsonify({"error": "Missing v1_index or v2_index."}), 400
    
    try:
        all_vectors = v_space_manager.get_all_vectors()
        idx1, idx2 = data["v1_index"], data["v2_index"]
        if not (0 <= idx1 < len(all_vectors) and 0 <= idx2 < len(all_vectors)):
            return jsonify({"error": "Invalid vector indices."}), 400
        
        v1 = all_vectors[idx1]
        v2 = all_vectors[idx2]
        
        composed_v = composition_streamer.stream_composition(v1, v2)
        if composed_v:
            attractor_tracker.record_trajectory_point(composed_v) # Record for attractor tracking
            return jsonify({
                "status": "success",
                "composed_vector": composed_v.to_dict(),
                "message": "Composition streamed and result added to V_space."
            })
        else:
            return jsonify({"status": "failed", "message": "Composition yielded no valid result."}), 500
    except Exception as e:
        logging.error(f"Error streaming composition: {e}")
        return jsonify({"error": "Internal server error during composition."}), 500

@app.route('/composition/history', methods=['GET'])
def get_composition_history():
    """Returns the recent composition history."""
    history = [
        {"v1": entry["v1"].to_dict(), "v2": entry["v2"].to_dict(), "v3": entry["v3"].to_dict(), "timestamp": entry["timestamp"]}
        for entry in composition_streamer.get_composition_history()
    ]
    return jsonify({"history": history, "count": len(history)})

@app.route('/attractors', methods=['GET'])
def get_attractor_basins():
    """Returns identified attractor basins."""
    basins = attractor_tracker.get_attractor_basins()
    # AttractorTracker.get_attractor_basins already converts to dict for JSON
    return jsonify({"attractor_basins": basins})

@app.route('/simulate_step', methods=['POST'])
def simulate_single_step():
    """
    Performs a single step of the full simulation loop.
    This combines composition, consciousness update, and attractor identification.
    """
    try:
        # 1. Simulate streaming compositions
        new_composed_v = None
        if len(v_space_manager) >= 2:
            v1, v2 = np.random.choice(v_space_manager.get_all_vectors(), 2, replace=False)
            new_composed_v = composition_streamer.stream_composition(v1, v2)
            if new_composed_v:
                attractor_tracker.record_trajectory_point(new_composed_v)
        else:
            logging.warning("Not enough vectors for composition in simulate_step.")

        # 2. Simulate Bayesian belief (Bt) input
        bt_input = np.random.rand(consciousness_engine.Ct.shape[0]) * 2 - 1
        
        # 3. Update Consciousness State
        current_consciousness_state = consciousness_engine.update(bt_input)

        # 4. Identify Attractors
        identified_attractor = attractor_tracker.identify_attractor()
        
        return jsonify({
            "status": "success",
            "consciousness_state": current_consciousness_state.tolist(),
            "new_composed_vector": new_composed_v.to_dict() if new_composed_v else None,
            "identified_attractor": identified_attractor.to_dict() if identified_attractor else None,
            "message": "Single simulation step executed."
        })
    except Exception as e:
        logging.error(f"Error during single simulation step: {e}")
        return jsonify({"error": "Internal server error during simulation step."}), 500

# To run the Flask app:
if __name__ == '__main__':
    # You can specify host and port, e.g., host='0.0.0.0' for external access
    # In a production environment, use a WSGI server like Gunicorn or uWSGI
    logging.info("Starting Flask API for HAC Runtime Sandbox...")
    app.run(debug=True, port=5000) # debug=True is for development, set to False for production
