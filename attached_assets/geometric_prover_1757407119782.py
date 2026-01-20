from sympy import symbols, Eq

def prove_midpoint():
    # Toy symbolic statement: midpoint M between A and B obeys 2M = A + B
    A, B, M = symbols('A B M')
    return Eq(2*M, A + B)
