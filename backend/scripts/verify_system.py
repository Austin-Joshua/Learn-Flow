#!/usr/bin/env python3
"""
Learnflow LMS — System Verification Runner (Backend Wrapper)
Invokes root scripts/verify_system.py.
"""
import os
import sys

root_script = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "scripts", "verify_system.py"))
if os.path.exists(root_script):
    import runpy
    runpy.run_path(root_script, run_name="__main__")
else:
    print(f"Error: Could not locate {root_script}")
    sys.exit(1)

