import sys, io, contextlib, ast, builtins, time

ALLOWED_BUILTINS = {"abs","min","max","sum","range","len","enumerate","zip","sorted","map","filter"}
SAFE_GLOBALS = {k: getattr(builtins, k) for k in ALLOWED_BUILTINS}

class Timeout(RuntimeError): ...

def run_user_code(code:str, inputs:dict=None, time_limit=2.0, mem_hint_mb=64)->dict:
    # Parse to AST and forbid dangerous nodes
    tree = ast.parse(code, mode="exec")
    for node in ast.walk(tree):
        if isinstance(node, (ast.Import, ast.ImportFrom, ast.With, ast.Try, ast.Attribute, ast.Call)):
            # We block function calls for hard safety in MVP; relax with an allow-list later.
            raise ValueError("Blocked syntax in sandbox.")
    ns = {"__builtins__": SAFE_GLOBALS, "inputs": inputs or {}}
    buf = io.StringIO()
    start = time.time()
    with contextlib.redirect_stdout(buf):
        exec(compile(tree, "<sandbox>", "exec"), ns, ns)
    if time.time() - start > time_limit:
        raise Timeout("Time limit exceeded.")
    return {"stdout": buf.getvalue(), "globals": {k:v for k,v in ns.items() if k not in {"__builtins__"}}}
