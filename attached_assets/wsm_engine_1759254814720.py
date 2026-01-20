
from dataclasses import dataclass
from typing import List, Sequence, Optional
import math

@dataclass
class StateVector:
    amplitudes: List[float]
    def norm(self) -> float: return math.sqrt(sum(a*a for a in self.amplitudes))
    def normalize(self): n=self.norm(); self.amplitudes=[a/n for a in self.amplitudes] if n else self; return self

@dataclass
class TransitionOperator:
    matrix: List[List[float]]
    def apply(self, state: StateVector) -> StateVector:
        m, v = self.matrix, state.amplitudes
        assert len(m[0]) == len(v)
        out = [sum(m[i][j]*v[j] for j in range(len(v))) for i in range(len(m))]
        return StateVector(out)

def compose(A: TransitionOperator, B: TransitionOperator) -> TransitionOperator:
    assert len(A.matrix[0]) == len(B.matrix)
    m, n, p = len(A.matrix), len(B.matrix), len(B.matrix[0])
    C = [[0.0]*p for _ in range(m)]
    for i in range(m):
        for k in range(p):
            C[i][k] = sum(A.matrix[i][j]*B.matrix[j][k] for j in range(n))
    return TransitionOperator(C)

def resonance_coherence(state: StateVector, mask: Optional[Sequence[int]] = None) -> float:
    idxs = range(len(state.amplitudes)) if mask is None else mask
    return sum(state.amplitudes[i]*state.amplitudes[i] for i in idxs)

def wsm_step(state: StateVector, op: TransitionOperator, normalize=True) -> StateVector:
    s2 = op.apply(state)
    if normalize: s2.normalize()
    return s2

if __name__ == "__main__":
    s = StateVector([1.0, 0.0]); c = 2**-0.5
    R = TransitionOperator([[c, -c],[c, c]])
    s1 = wsm_step(s, R)
    assert 0.99 < s1.norm() < 1.01 and s1.amplitudes[1] > 0.0
    print("[WSM] tests OK")
