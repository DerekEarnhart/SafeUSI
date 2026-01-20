import threading, uuid, traceback
from dataclasses import dataclass
from typing import Callable, Dict, Any, List
from .sandbox_runner import run_user_code
from .geometric_prover import prove_midpoint
from .image_gen import generate_image_stub

@dataclass
class Tool:
    name: str
    version: str
    schema: Dict[str, Any]
    runner: Callable[[Dict[str, Any]], Dict[str, Any]]

TOOLS: List[Tool] = []

def _sandbox_runner(args: Dict[str, Any]):
    code = args.get("code", "print('hello')")
    inputs = args.get("inputs", {})
    return run_user_code(code, inputs=inputs, time_limit=2.0)

def _geo_runner(args: Dict[str, Any]):
    return {"theorem": str(prove_midpoint())}

def _img_runner(args: Dict[str, Any]):
    prompt = args.get("prompt", "abstract geometry")
    return {"url": generate_image_stub(prompt)}

TOOLS.append(Tool(
    name="sandbox",
    version="0.1",
    schema={"type":"object","properties":{"code":{"type":"string"}, "inputs":{"type":"object"}},"required":["code"]},
    runner=_sandbox_runner
))
TOOLS.append(Tool(
    name="geometric_prover",
    version="0.1",
    schema={"type":"object","properties":{}},
    runner=_geo_runner
))
TOOLS.append(Tool(
    name="image_gen",
    version="0.1",
    schema={"type":"object","properties":{"prompt":{"type":"string"}}},
    runner=_img_runner
))

JOBS: Dict[str, Dict[str, Any]] = {}

def run_tool_job(name: str, args: Dict[str, Any]) -> str:
    job_id = str(uuid.uuid4())
    JOBS[job_id] = {"status": "running", "result": None, "error": None}
    tool = next((t for t in TOOLS if t.name == name), None)
    if not tool:
        JOBS[job_id] = {"status": "error", "result": None, "error": "unknown tool"}
        return job_id
    def _work():
        try:
            res = tool.runner(args)
            JOBS[job_id] = {"status": "done", "result": res, "error": None}
        except Exception as e:
            JOBS[job_id] = {"status": "error", "result": None, "error": traceback.format_exc()}
    threading.Thread(target=_work, daemon=True).start()
    return job_id
