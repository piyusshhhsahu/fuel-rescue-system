"""
FuelSense AI — AMD Acceleration Guide
=======================================
Configuration and utilities for leveraging AMD hardware
for faster model training and inference.

AMD ROCm (Radeon Open Compute) ecosystem support:
    • PyTorch + ROCm for deep learning models
    • ZenDNN for optimized CPU inference on AMD EPYC/Ryzen
    • AMD Instinct GPUs for GPU-accelerated training

This module provides configuration helpers and notes
for AMD-optimized deployment.
"""

import os
import platform


def get_amd_config():
    """
    Returns AMD hardware configuration and recommended settings.

    In a production deployment with AMD hardware:
    1. Install ROCm: https://rocm.docs.amd.com/
    2. Use PyTorch-ROCm builds for GPU training
    3. Set environment variables for optimization
    """
    config = {
        "platform": platform.processor(),
        "os": platform.system(),

        # ── ROCm GPU Acceleration ──────────────────────────────
        "rocm": {
            "description": "AMD GPU acceleration via ROCm for model training",
            "install": "pip install torch torchvision --index-url https://download.pytorch.org/whl/rocm5.7",
            "env_vars": {
                "HSA_OVERRIDE_GFX_VERSION": "10.3.0",  # Adjust for your GPU
                "HIP_VISIBLE_DEVICES": "0",
                "PYTORCH_ROCM_ARCH": "gfx1030",  # Adjust for your GPU arch
            },
            "supported_gpus": [
                "AMD Instinct MI250X",
                "AMD Instinct MI210",
                "AMD Instinct MI100",
                "AMD Radeon PRO W7900",
                "AMD Radeon RX 7900 XTX",
            ],
        },

        # ── ZenDNN CPU Optimization ────────────────────────────
        "zendnn": {
            "description": "Optimized inference on AMD EPYC/Ryzen CPUs",
            "install": "pip install zentorch",
            "env_vars": {
                "ZENDNN_LOG_OPTS": "ALL:0",
                "OMP_NUM_THREADS": str(os.cpu_count()),
                "GOMP_CPU_AFFINITY": f"0-{os.cpu_count() - 1}",
                "ZENDNN_GEMM_ALGO": "3",  # Auto-tuned GEMM
            },
            "benefits": [
                "Up to 2.5x faster inference on AMD EPYC",
                "Optimized matrix operations (GEMM)",
                "Thread pinning for consistent performance",
                "Memory-bandwidth optimized for large batch inference",
            ],
        },

        # ── Scikit-learn on AMD (current model) ────────────────
        "sklearn_optimization": {
            "description": "Optimize scikit-learn GBR on AMD CPUs",
            "settings": {
                "n_jobs": -1,  # Use all CPU cores
                "OMP_NUM_THREADS": str(os.cpu_count()),
            },
            "tips": [
                "scikit-learn uses OpenMP — AMD CPUs benefit from thread affinity",
                "Set OMP_NUM_THREADS to match physical cores (not logical)",
                "For larger datasets, consider AMD-optimized BLAS (AOCL-BLIS)",
                "Install AOCL: https://www.amd.com/en/developer/aocl.html",
            ],
        },
    }
    return config


def print_amd_recommendations():
    """Print AMD acceleration recommendations."""
    config = get_amd_config()
    print("=" * 60)
    print("  AMD Acceleration Recommendations for FuelSense AI")
    print("=" * 60)

    print(f"\n  Platform: {config['platform']}")
    print(f"  OS:       {config['os']}")
    print(f"  Cores:    {os.cpu_count()}")

    print("\n── ROCm GPU Training ──────────────────────────")
    print(f"   {config['rocm']['description']}")
    print(f"   Install: {config['rocm']['install']}")

    print("\n── ZenDNN CPU Inference ────────────────────────")
    print(f"   {config['zendnn']['description']}")
    for b in config["zendnn"]["benefits"]:
        print(f"   • {b}")

    print("\n── Current Model (scikit-learn) ────────────────")
    for tip in config["sklearn_optimization"]["tips"]:
        print(f"   • {tip}")

    print("=" * 60)


if __name__ == "__main__":
    print_amd_recommendations()
