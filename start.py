#!/usr/bin/env python3
"""
Content Proof Agent - Startup Script
This script helps you start both the backend and frontend services.
"""

import os
import sys
import subprocess
import time
import signal
from pathlib import Path

def check_python_version():
    """Check if Python version is 3.8 or higher"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        sys.exit(1)
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")

def check_node_version():
    """Check if Node.js is installed"""
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✅ Node.js {version} detected")
            return True
    except FileNotFoundError:
        pass
    
    print("❌ Node.js not found. Please install Node.js 16+ from https://nodejs.org/")
    return False

def setup_backend():
    """Set up the backend environment"""
    print("\n🔧 Setting up backend...")
    
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print("❌ Backend directory not found")
        return False
    
    # Check if virtual environment exists
    venv_dir = backend_dir / "venv"
    if not venv_dir.exists():
        print("📦 Creating virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", str(venv_dir)], cwd=backend_dir)
    
    # Determine the correct python executable
    if os.name == 'nt':  # Windows
        python_exe = venv_dir / "Scripts" / "python.exe"
        pip_exe = venv_dir / "Scripts" / "pip.exe"
    else:  # Unix/Linux/macOS
        python_exe = venv_dir / "bin" / "python"
        pip_exe = venv_dir / "bin" / "pip"
    
    # Install dependencies
    print("📦 Installing Python dependencies...")
    subprocess.run([str(pip_exe), "install", "-r", "requirements.txt"], cwd=backend_dir)
    
    # Check if .env exists
    env_file = backend_dir / ".env"
    if not env_file.exists():
        print("📝 Creating .env file from template...")
        env_example = backend_dir / ".env.example"
        if env_example.exists():
            import shutil
            shutil.copy(env_example, env_file)
            print("⚠️  Please edit backend/.env with your configuration")
    
    return python_exe

def setup_frontend():
    """Set up the frontend environment"""
    print("\n🔧 Setting up frontend...")
    
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return False
    
    # Check if node_modules exists
    node_modules = frontend_dir / "node_modules"
    if not node_modules.exists():
        print("📦 Installing Node.js dependencies...")
        subprocess.run(["npm", "install"], cwd=frontend_dir)
    
    return True

def start_backend(python_exe):
    """Start the backend server"""
    print("\n🚀 Starting backend server...")
    backend_dir = Path("backend")
    
    # Start uvicorn server
    cmd = [
        str(python_exe), "-m", "uvicorn", 
        "app.main:app", 
        "--reload", 
        "--host", "0.0.0.0", 
        "--port", "8000"
    ]
    
    return subprocess.Popen(cmd, cwd=backend_dir)

def start_frontend():
    """Start the frontend development server"""
    print("\n🚀 Starting frontend server...")
    frontend_dir = Path("frontend")
    
    return subprocess.Popen(["npm", "start"], cwd=frontend_dir)

def main():
    """Main startup function"""
    print("🎯 Content Proof Agent - Startup Script")
    print("=" * 50)
    
    # Check prerequisites
    check_python_version()
    if not check_node_version():
        sys.exit(1)
    
    # Setup environments
    python_exe = setup_backend()
    if not python_exe:
        sys.exit(1)
    
    if not setup_frontend():
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("🎉 Setup complete! Starting services...")
    print("=" * 50)
    
    # Start services
    backend_process = start_backend(python_exe)
    time.sleep(3)  # Give backend time to start
    
    frontend_process = start_frontend()
    
    print("\n✅ Services started successfully!")
    print("📊 Frontend: http://localhost:3000")
    print("🔧 Backend API: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("\n💡 Press Ctrl+C to stop all services")
    
    # Handle shutdown
    def signal_handler(sig, frame):
        print("\n🛑 Shutting down services...")
        backend_process.terminate()
        frontend_process.terminate()
        
        # Wait for processes to terminate
        backend_process.wait()
        frontend_process.wait()
        
        print("✅ All services stopped")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    # Wait for processes
    try:
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    main()
