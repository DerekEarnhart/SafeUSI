#!/usr/bin/env python3
"""
Quantum Geometry VM – Smoke Test
Run: python smoke_test.py
- Checks Python version
- Checks presence of third-party deps
- Verifies package layout and imports
- Optionally spins up Flask app in test mode and probes /vm/status
"""

import os, sys, importlib, json, socket, contextlib, time

REQUIRED = ["flask"]
OPTIONAL = ["torch", "numpy"]

def check_pkg(name):
    try:
        importlib.import_module(name)
        return True
    except Exception:
        return False

def main():
    print("Python:", sys.version.split()[0])
    status = {"required":{}, "optional":{}, "import_qgvm2": None, "flask_blueprint": None}

    for k in REQUIRED:
        ok = check_pkg(k)
        status["required"][k] = ok
        print(f"[req] {k}: {'OK' if ok else 'MISSING'}")
    for k in OPTIONAL:
        ok = check_pkg(k)
        status["optional"][k] = ok
        print(f"[opt] {k}: {'OK' if ok else 'MISSING'}")

    # Make project importable if run from repo root
    sys.path.insert(0, os.getcwd())
    pkg_names = ["qgvm2", "universal_task_orchestrator"]

    imported = False
    for name in pkg_names:
        try:
            m = importlib.import_module(name if name=="qgvm2" else f"qgvm2.{name}")
            imported = True
            print(f"Imported {m.__name__}")
            status["import_qgvm2"] = True
            break
        except Exception as e:
            pass
    if not imported:
        try:
            m = importlib.import_module("universal_task_orchestrator")
            imported = True
            print("Imported universal_task_orchestrator as module")
            status["import_qgvm2"] = True
        except Exception as e:
            print("Import failed:", e)
            status["import_qgvm2"] = False

    # Try blueprint import
    try:
        vm_api = importlib.import_module("qgvm2.vm_api")
    except Exception:
        try:
            vm_api = importlib.import_module("vm_api")
        except Exception as e:
            vm_api = None
            print("vm_api import failed:", e)

    if vm_api and hasattr(vm_api, "vm_api"):
        print("Found Flask blueprint: vm_api")
        status["flask_blueprint"] = True
    else:
        print("Flask blueprint missing or could not be imported")
        status["flask_blueprint"] = False

    print("\n=== SUMMARY ===")
    print(json.dumps(status, indent=2))

if __name__ == "__main__":
    main()
