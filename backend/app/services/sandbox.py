import asyncio
import sys
import subprocess
import tempfile
import time
from typing import Optional
import httpx
from app.core.config import settings
from app.schemas.challenge import CodeRunResult


async def execute_code_piston(code: str, stdin: str = "", timeout_sec: int = 10) -> Optional[CodeRunResult]:
    """Execute Python code using the Piston sandbox API."""
    url = f"{settings.PISTON_URL.rstrip('/')}/execute"
    payload = {
        "language": "python",
        "version": "3.10.0",
        "files": [{"name": "solution.py", "content": code}],
        "stdin": stdin or "",
        "run_timeout": timeout_sec * 1000,
        "compile_timeout": 5000,
    }
    
    try:
        async with httpx.AsyncClient(timeout=timeout_sec + 5) as client:
            t0 = time.time()
            resp = await client.post(url, json=payload)
            elapsed_ms = int((time.time() - t0) * 1000)

            if resp.status_code == 200:
                data = resp.json()
                run_data = data.get("run", {})
                stdout = run_data.get("stdout", "")
                stderr = run_data.get("stderr", "")
                exit_code = run_data.get("code", 0)
                return CodeRunResult(
                    stdout=stdout,
                    stderr=stderr,
                    exit_code=exit_code if exit_code is not None else 0,
                    execution_time_ms=elapsed_ms
                )
    except Exception as e:
        # Fall through to local fallback
        pass
    return None


async def execute_code_local(code: str, stdin: str = "", timeout_sec: int = 5) -> CodeRunResult:
    """
    Fallback isolated subprocess runner for local offline development.
    Runs python in a subprocess with strict timeout and clean temp directory.
    """
    t0 = time.time()
    def _run():
        with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False, encoding="utf-8") as f:
            f.write(code)
            temp_path = f.name
        
        try:
            cmd = [sys.executable, "-I", temp_path]
            proc = subprocess.run(
                cmd,
                input=stdin or "",
                text=True,
                capture_output=True,
                timeout=timeout_sec
            )
            return proc.stdout, proc.stderr, proc.returncode
        except subprocess.TimeoutExpired:
            return "", "Execution timed out (exceeded limit).", 124
        except Exception as err:
            return "", f"Execution error: {str(err)}", 1
        finally:
            import os
            try:
                os.remove(temp_path)
            except Exception:
                pass

    loop = asyncio.get_running_loop()
    stdout, stderr, exit_code = await loop.run_in_executor(None, _run)
    elapsed_ms = int((time.time() - t0) * 1000)

    return CodeRunResult(
        stdout=stdout or "",
        stderr=stderr or "",
        exit_code=exit_code,
        execution_time_ms=elapsed_ms
    )


async def execute_python_code(code: str, stdin: str = "", timeout_sec: int = 10) -> CodeRunResult:
    """Executes python code via Piston sandbox first, falling back to local runner if Piston is unreachable."""
    # Attempt Piston first
    result = await execute_code_piston(code, stdin, timeout_sec)
    if result is not None:
        return result
    
    # Fallback to local subprocess
    return await execute_code_local(code, stdin, timeout_sec=min(timeout_sec, 5))
