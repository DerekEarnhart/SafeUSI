import json, re
from pathlib import Path

PHRASEBOOK_PATH = Path(__file__).with_name("idiom_operators.json")

def _canonicalize(text: str) -> str:
    t = text.lower().strip()
    t = re.sub(r"[^a-z0-9\s]", " ", t)     # remove punctuation
    t = re.sub(r"\s+", " ", t).strip()
    # quick synonyms to help match variants
    t = t.replace("do not", "dont").replace("don't", "dont")
    t = t.replace("two x", "twice").replace("2x", "twice")
    t = t.replace("cut 1x", "cut once").replace("cut one time", "cut once")
    t = t.replace("kill two birds with one stone", "solve two goals with one step")
    return t

def compile_idiom(phrase: str) -> dict:
    pb = json.loads(PHRASEBOOK_PATH.read_text())
    key = _canonicalize(phrase)
    # try exact
    if key in pb:
        spec = pb[key].copy()
        spec["canonical"] = key
        spec["matched"] = "exact"
        return spec
    # try fuzzy containment
    best = None
    for k in pb.keys():
        if all(tok in key for tok in k.split()):
            best = k
            break
    if best:
        spec = pb[best].copy()
        spec["canonical"] = best
        spec["matched"] = "fuzzy"
        return spec
    return {"type": "none", "canonical": key, "error": "unrecognized_idiom"}

if __name__ == "__main__":
    tests = [
        "Measure twice, cut once.",
        "A stitch in time saves nine",
        "The squeaky wheel gets the grease",
        "Don’t reinvent the wheel",
        "Kill two birds with one stone",
        "Garbage in, garbage out!",
        "Keep it simple."
    ]
    out = []
    for t in tests:
        out.append({"input": t, "compiled": compile_idiom(t)})
    Path("compiled_examples.json").write_text(json.dumps(out, indent=2))
    print("Wrote compiled_examples.json")