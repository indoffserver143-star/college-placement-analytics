import os
import signal
import socket
import subprocess
import sys
import time

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

IS_WINDOWS = os.name == "nt"
VENV_PYTHON = os.path.join(
    BACKEND_DIR,
    ".venv",
    "Scripts" if IS_WINDOWS else "bin",
    "python.exe" if IS_WINDOWS else "python",
)
NPM_CMD = "npm.cmd" if IS_WINDOWS else "npm"


def find_free_port(preferred: int, max_tries: int = 20) -> int:
    for port in range(preferred, preferred + max_tries):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", port)) != 0:
                return port
    raise RuntimeError(f"No free port found near {preferred}")


def ensure_backend():
    if not os.path.exists(VENV_PYTHON):
        print("[setup] Creating Python virtual environment...")
        subprocess.check_call([sys.executable, "-m", "venv", os.path.join(BACKEND_DIR, ".venv")])
        print("[setup] Installing backend dependencies...")
        subprocess.check_call([VENV_PYTHON, "-m", "pip", "install", "-r", os.path.join(BACKEND_DIR, "requirements.txt")])


def ensure_frontend():
    node_modules = os.path.join(FRONTEND_DIR, "node_modules")
    if not os.path.exists(node_modules):
        print("[setup] Installing frontend dependencies...")
        subprocess.check_call([NPM_CMD, "install"], cwd=FRONTEND_DIR)


def main():
    ensure_backend()
    ensure_frontend()

    backend_port = find_free_port(8000)
    frontend_port = find_free_port(8002)

    if backend_port != 8000:
        print(f"[launcher] Port 8000 is in use; using backend port {backend_port} instead.")
    if frontend_port != 8002:
        print(f"[launcher] Port 8002 is in use; using frontend port {frontend_port} instead.")

    print("\n========================================================")
    print("  Interactive College Placement & Skills Analytics")
    print(f"  Backend API : http://127.0.0.1:{backend_port} (Docs: /docs)")
    print(f"  Frontend UI : http://localhost:{frontend_port}")
    print("  Press Ctrl+C to stop both servers.")
    print("========================================================\n")

    backend_proc = subprocess.Popen(
        [VENV_PYTHON, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", str(backend_port)],
        cwd=BACKEND_DIR,
    )

    frontend_env = os.environ.copy()
    frontend_env["VITE_API_TARGET"] = f"http://127.0.0.1:{backend_port}"

    frontend_proc = subprocess.Popen(
        [NPM_CMD, "run", "dev", "--", "--port", str(frontend_port)],
        cwd=FRONTEND_DIR,
        env=frontend_env,
    )

    def shutdown(signum=None, frame=None):
        print("\n[launcher] Shutting down servers...")
        for proc in (frontend_proc, backend_proc):
            if proc.poll() is None:
                proc.terminate()
        time.sleep(1)
        for proc in (frontend_proc, backend_proc):
            if proc.poll() is None:
                proc.kill()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        while True:
            b_code = backend_proc.poll()
            if b_code is not None:
                print(f"[launcher] Backend process exited (code {b_code}).")
                shutdown()
            f_code = frontend_proc.poll()
            if f_code is not None:
                print(f"[launcher] Frontend process exited (code {f_code}).")
                shutdown()
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown()


if __name__ == "__main__":
    main()
