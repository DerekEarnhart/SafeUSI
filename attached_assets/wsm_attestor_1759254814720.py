import json, sys

def load(path): 
    with open(path, 'r') as f: 
        return json.load(f)

def check_no_training(manifest, trace):
    return int(manifest["system"]["param_hash_pre"] == manifest["system"]["param_hash_post"] == trace["param_hash_pre"] == trace["param_hash_post"])

def check_ops_declared(manifest, trace):
    declared = set(sum([manifest["operators"].get(k,[]) for k in ["kin","relations","macros","phrase_macros"]], []))
    used = set(s["op"] for s in trace["steps"])
    return int(used.issubset(declared))

def check_operator_chain_consistency(trace):
    ok = 1
    for s in trace["steps"]:
        if s.get("energy_j", 0.0) > 5.0: ok = 0
        if s.get("evidence") not in {"permute","lookup","project","compose"}: ok = 0
    return ok

def score(manifest_path, trace_path):
    m = load(manifest_path)
    t = load(trace_path)
    return {
        "no_training_integrity": check_no_training(m,t),
        "operator_library_completeness": check_ops_declared(m,t),
        "operator_trace_match": check_operator_chain_consistency(t)
    }

if __name__ == "__main__":
    mp = sys.argv[1]
    tp = sys.argv[2]
    print(json.dumps(score(mp,tp), indent=2))
