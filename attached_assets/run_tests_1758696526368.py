"""
Test Runner for Quantum-Harmonic AGI System

This script executes validation and benchmarking tests for the
quantum-harmonic AGI system and generates comprehensive reports.
"""

import os
import sys
import json
import time
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import test modules
from tests.benchmark import ValidationSuite, BenchmarkSuite
from core.integration import QuantumHarmonicInterface

def main():
    """Run validation and benchmarking tests."""
    print("=" * 80)
    print("Quantum-Harmonic AGI System - Validation and Benchmarking")
    print("=" * 80)
    
    # Create results directory
    results_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../results")
    os.makedirs(results_dir, exist_ok=True)
    
    # Create timestamp for this test run
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_dir = os.path.join(results_dir, f"test_run_{timestamp}")
    os.makedirs(run_dir, exist_ok=True)
    
    # Initialize interface
    print("\nInitializing Quantum-Harmonic Interface...")
    interface = QuantumHarmonicInterface()
    
    # Run validation tests
    print("\n" + "=" * 80)
    print("Running Validation Tests")
    print("=" * 80)
    
    validation_dir = os.path.join(run_dir, "validation")
    validation_suite = ValidationSuite(interface, output_dir=validation_dir)
    
    validation_start = time.time()
    validation_results = validation_suite.run_all_validations()
    validation_report = validation_suite.generate_validation_report()
    validation_end = time.time()
    
    validation_time = validation_end - validation_start
    
    # Run benchmarking tests
    print("\n" + "=" * 80)
    print("Running Benchmarking Tests")
    print("=" * 80)
    
    benchmark_dir = os.path.join(run_dir, "benchmark")
    benchmark_suite = BenchmarkSuite(interface, output_dir=benchmark_dir)
    
    benchmark_start = time.time()
    benchmark_results = benchmark_suite.run_all_benchmarks()
    comparison_report = benchmark_suite.generate_comparison_report()
    benchmark_end = time.time()
    
    benchmark_time = benchmark_end - benchmark_start
    
    # Generate summary report
    summary = {
        "timestamp": timestamp,
        "validation": {
            "success_rate": validation_report["success_rates"][-1],
            "total_tests": validation_report["total_tests"],
            "passed_tests": validation_report["passed_tests"],
            "failed_tests": validation_report["failed_tests"],
            "execution_time": validation_time
        },
        "benchmarking": {
            "arc_score": benchmark_results["arc"]["score"],
            "swelancer_score": benchmark_results["swelancer"]["score"],
            "nlp_understanding_time": benchmark_results["nlp"]["understanding"]["avg_processing_time"],
            "nlp_generation_time": benchmark_results["nlp"]["generation"]["avg_generation_time"],
            "execution_time": benchmark_time
        },
        "comparison": {
            "models": comparison_report["models"],
            "metrics": comparison_report["metrics"]
        }
    }
    
    # Save summary report
    with open(os.path.join(run_dir, "summary.json"), "w") as f:
        json.dump(summary, f, indent=2)
    
    # Print summary
    print("\n" + "=" * 80)
    print("Test Summary")
    print("=" * 80)
    print(f"Validation Success Rate: {summary['validation']['success_rate']:.2%}")
    print(f"Validation Tests: {summary['validation']['passed_tests']} passed, {summary['validation']['failed_tests']} failed")
    print(f"Validation Execution Time: {summary['validation']['execution_time']:.2f} seconds")
    print()
    print(f"ARC Benchmark Score: {summary['benchmarking']['arc_score']:.4f}")
    print(f"SWELancer Benchmark Score: {summary['benchmarking']['swelancer_score']:.4f}")
    print(f"NLP Understanding Time: {summary['benchmarking']['nlp_understanding_time']:.4f} seconds")
    print(f"NLP Generation Time: {summary['benchmarking']['nlp_generation_time']:.4f} seconds")
    print(f"Benchmarking Execution Time: {summary['benchmarking']['execution_time']:.2f} seconds")
    print()
    print(f"Results saved to: {run_dir}")
    print("=" * 80)
    
    return summary

if __name__ == "__main__":
    main()
