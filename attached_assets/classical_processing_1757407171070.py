from typing import Any, Dict
from tools.geometric_prover import prove_midpoint

class ClassicalProcessor:
    def process(self, task: Dict[str, Any]) -> str:
        kind = task.get("kind")
        if kind == "symbolic_geo":
            return f"Proved relation: {prove_midpoint()}"
        # fallback
        return "Classical processing path executed."
