
import json, re
from typing import List, Dict, Any
CODE_BLOCK_RE = re.compile(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", re.IGNORECASE)
JSON_OBJ_RE   = re.compile(r"\{[\s\S]*\}")

def grid_to_str(grid: List[List[int]]) -> str:
    return "\n".join(" ".join(str(x) for x in row) for row in grid)

def build_prompt(task: Dict[str, Any], test_idx: int) -> str:
    lines = ["You are solving an ARC-style grid reasoning task.",
             "Colors are 0-9. Output JSON only: {\"output\": [[...],[...]]}.",
             "Train examples:"]
    for ex in task.get("train", []):
        lines.append("INPUT:\n" + grid_to_str(ex["input"]))
        lines.append("OUTPUT:\n" + grid_to_str(ex["output"]))
    test = task["test"][test_idx]
    lines.append("Now solve TEST INPUT. Return JSON ONLY.")
    lines.append("TEST INPUT:\n" + grid_to_str(test["input"]))
    return "\n\n".join(lines)

def parse_model_grid(raw: str):
    m = CODE_BLOCK_RE.search(raw) or JSON_OBJ_RE.search(raw or "")
    if not m: return None
    try:
        obj = json.loads(m.group(1))
        grid = obj.get("output")
        if not isinstance(grid, list) or not all(isinstance(r, list) for r in grid): return None
        for r in grid:
            if not all(isinstance(x, int) and 0 <= x <= 9 for x in r): return None
        return grid
    except Exception:
        return None

def local_solve(prompt: str):
    two = "OUTPUT:\n" in prompt and any("2" in block for block in re.findall(r"OUTPUT:\n([0-9\n ]+)", prompt))
    _tail = prompt.split("TEST INPUT:", 1)[1].strip()
    grid = []
    for line in _tail.splitlines():
        line=line.strip()
        if not line or not re.fullmatch(r"[0-9 ]+", line): break
        grid.append([int(tok) for tok in line.split()])
    if not grid: return {"text": json.dumps({"output": []})}
    out = [[(2 if x==1 else x) for x in row] for row in grid] if two else [list(reversed(row)) for row in grid]
    return {"text": json.dumps({"output": out})}

if __name__ == "__main__":
    task = {"id":"sample_recolor","train":[{"input": [[0,1],[1,0]], "output": [[0,2],[2,0]]}],
            "test":[{"input": [[1,0,1],[0,1,0]], "output": [[2,0,2],[0,2,0]]}]}
    prompt = build_prompt(task, 0); resp = local_solve(prompt)
    pred = parse_model_grid(resp["text"])
    assert pred == task["test"][0]["output"]
    print("[GRID] tests OK")
