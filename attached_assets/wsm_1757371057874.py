# wsm.py — minimal WSM with drift test
from __future__ import annotations
from dataclasses import dataclass
from typing import List
import math

@dataclass
class StateVector:
    a: List[float]
    def norm(self) -> float:
        return math.sqrt(sum(x*x for x in self.a))
    def normalize(self) -> "StateVector":
        n = self.norm() or 1.0
        self.a = [x / n for x in self.a]
        return self

@dataclass
class TransitionOperator:
    m: List[List[float]]
    def apply(self, s: StateVector) -> StateVector:
        v = s.a
        out = [sum(self.m[i][j] * v[j] for j in range(len(v))) for i in range(len(self.m))]
        return StateVector(out)

def rotation(theta: float) -> TransitionOperator:
    c, s = math.cos(theta), math.sin(theta)
    return TransitionOperator([[c, -s],[s, c]])

def step(s: StateVector, O: TransitionOperator) -> StateVector:
    return O.apply(s).normalize()

def drift_test(steps=1000, theta=0.01):
    s = StateVector([1.0, 0.0])
    O = rotation(theta)
    n0 = s.norm()
    for _ in range(steps):
        s = step(s, O)
    drift = abs(s.norm() - n0) / max(1e-9, n0)
    return drift

if __name__ == "__main__":
    d = drift_test()
    assert d < 0.01, f"Drift too high: {d}"
    print("[WSM] drift OK", d)
