#!/usr/bin/env python3
"""
Compression Engine - Advanced LZMA-based compression with harmonic analysis
Implements Compressia LZMA L9 compression with quantum-harmonic optimization
"""

import sys
import json
import time
import lzma
import base64
import hashlib
import math
from typing import Dict, Any, Tuple

class HarmonicCompressor:
    """
    Advanced compression engine using LZMA with harmonic analysis
    Implements prime compression techniques for optimal ratios
    """
    
    def __init__(self):
        self.preset = lzma.PRESET_EXTREME  # Level 9 equivalent
        self.filters = [
            {
                "id": lzma.FILTER_LZMA2,
                "preset": self.preset,
                "dict_size": 16 * 1024 * 1024,  # 16MB dictionary
                "lc": 3,  # Literal context bits
                "lp": 0,  # Literal position bits  
                "pb": 2,  # Position bits
                "mode": lzma.MODE_NORMAL,
                "nice_len": 273,  # Maximum nice length
                "mf": lzma.MF_BT4,  # Match finder
                "depth": 512,  # Match finder depth
            }
        ]
    
    def calculate_harmonic_signature(self, data: bytes) -> Tuple[float, List[float]]:
        """
        Calculate harmonic signature of data for compression optimization
        """
        if not data:
            return 0.0, [0.0, 0.0, 0.0, 0.0]
        
        # Analyze byte frequency distribution
        byte_counts = [0] * 256
        for byte in data:
            byte_counts[byte] += 1
        
        total_bytes = len(data)
        frequencies = [count / total_bytes for count in byte_counts]
        
        # Calculate entropy
        entropy = 0.0
        for freq in frequencies:
            if freq > 0:
                entropy -= freq * math.log2(freq)
        
        # Generate harmonic components
        harmonic_signature = []
        
        # Low frequency component (repetition patterns)
        low_freq = sum(freq for freq in frequencies if freq > 0.01) / len([f for f in frequencies if f > 0.01])
        harmonic_signature.append(min(1.0, low_freq))
        
        # Mid frequency component (structure patterns)  
        mid_freq = len([f for f in frequencies if 0.001 < f <= 0.01]) / 256.0
        harmonic_signature.append(mid_freq)
        
        # High frequency component (randomness)
        high_freq = entropy / 8.0  # Normalize to 0-1
        harmonic_signature.append(high_freq)
        
        # Coherence component (overall predictability)
        coherence = 1.0 - (entropy / 8.0)
        harmonic_signature.append(coherence)
        
        return entropy, harmonic_signature
    
    def compress_data(self, data: bytes, filename: str = "") -> Dict[str, Any]:
        """
        Compress data using harmonic-optimized LZMA
        """
        if not data:
            return {
                'success': False,
                'error': 'Empty data provided',
                'ratio': 0.0,
                'processingTime': 0.0
            }
        
        start_time = time.time()
        original_size = len(data)
        
        try:
            # Calculate harmonic signature for optimization
            entropy, harmonic_signature = self.calculate_harmonic_signature(data)
            
            # Adjust compression parameters based on harmonic analysis
            optimized_filters = self._optimize_filters(entropy, harmonic_signature)
            
            # Perform compression
            compressed_data = lzma.compress(
                data, 
                format=lzma.FORMAT_XZ,
                filters=optimized_filters
            )
            
            compressed_size = len(compressed_data)
            compression_ratio = compressed_size / original_size if original_size > 0 else 0.0
            processing_time = time.time() - start_time
            
            # Calculate compression quality metrics
            quality_score = self._calculate_quality_score(
                compression_ratio, entropy, harmonic_signature, processing_time
            )
            
            return {
                'success': True,
                'ratio': compression_ratio,
                'processingTime': processing_time,
                'originalSize': original_size,
                'compressedSize': compressed_size,
                'entropy': entropy,
                'harmonicSignature': harmonic_signature,
                'qualityScore': quality_score,
                'algorithm': 'LZMA-L9-Harmonic',
                'metadata': {
                    'filename': filename,
                    'timestamp': time.time(),
                    'checksum': hashlib.md5(data).hexdigest()[:16]
                }
            }
            
        except Exception as e:
            processing_time = time.time() - start_time
            return {
                'success': False,
                'error': f'Compression failed: {str(e)}',
                'ratio': 0.0,
                'processingTime': processing_time
            }
    
    def _optimize_filters(self, entropy: float, harmonic_signature: List[float]) -> List[Dict]:
        """
        Optimize LZMA filters based on harmonic analysis
        """
        optimized_filters = self.filters.copy()
        
        # Adjust dictionary size based on entropy
        if entropy < 4.0:  # Low entropy - use smaller dictionary
            optimized_filters[0]['dict_size'] = 8 * 1024 * 1024
        elif entropy > 6.0:  # High entropy - use larger dictionary
            optimized_filters[0]['dict_size'] = 32 * 1024 * 1024
        
        # Adjust literal context bits based on structure patterns
        if harmonic_signature[1] > 0.5:  # High structure
            optimized_filters[0]['lc'] = 4
        elif harmonic_signature[1] < 0.2:  # Low structure
            optimized_filters[0]['lc'] = 2
        
        # Adjust match finder depth based on coherence
        if harmonic_signature[3] > 0.7:  # High coherence
            optimized_filters[0]['depth'] = 1024
        elif harmonic_signature[3] < 0.3:  # Low coherence
            optimized_filters[0]['depth'] = 256
        
        return optimized_filters
    
    def _calculate_quality_score(self, ratio: float, entropy: float, signature: List[float], time_taken: float) -> float:
        """
        Calculate overall compression quality score
        """
        # Compression efficiency (lower ratio is better)
        efficiency = max(0.0, 1.0 - ratio)
        
        # Speed factor (faster is better, normalized)
        speed = max(0.0, 1.0 - min(time_taken / 10.0, 1.0))
        
        # Harmonic coherence bonus
        coherence_bonus = signature[3] * 0.1
        
        # Structure preservation bonus
        structure_bonus = (1.0 - abs(signature[1] - 0.5)) * 0.1
        
        quality = (efficiency * 0.6) + (speed * 0.2) + coherence_bonus + structure_bonus
        return min(1.0, quality)

def main():
    compressor = HarmonicCompressor()
    
    try:
        for line in sys.stdin:
            try:
                command = json.loads(line.strip())
                action = command.get('action')
                
                if action == 'compress':
                    filename = command.get('filename', '')
                    content_b64 = command.get('content', '')
                    
                    if not content_b64:
                        result = {
                            'success': False,
                            'error': 'No content provided',
                            'ratio': 0.0,
                            'processingTime': 0.0
                        }
                    else:
                        try:
                            # Decode base64 content
                            content_bytes = base64.b64decode(content_b64)
                            result = compressor.compress_data(content_bytes, filename)
                        except Exception as e:
                            result = {
                                'success': False,
                                'error': f'Failed to decode content: {str(e)}',
                                'ratio': 0.0,
                                'processingTime': 0.0
                            }
                    
                    print(f"COMPRESSION_RESULT:{json.dumps(result)}", flush=True)
                    
                elif action == 'analyze':
                    # Analyze data without compression
                    content_b64 = command.get('content', '')
                    
                    if content_b64:
                        try:
                            content_bytes = base64.b64decode(content_b64)
                            entropy, harmonic_signature = compressor.calculate_harmonic_signature(content_bytes)
                            
                            result = {
                                'success': True,
                                'entropy': entropy,
                                'harmonicSignature': harmonic_signature,
                                'dataSize': len(content_bytes)
                            }
                        except Exception as e:
                            result = {
                                'success': False,
                                'error': f'Analysis failed: {str(e)}'
                            }
                    else:
                        result = {
                            'success': False,
                            'error': 'No content provided for analysis'
                        }
                    
                    print(f"ANALYSIS_RESULT:{json.dumps(result)}", flush=True)
                    
                else:
                    print(f"COMPRESSION_ERROR:Unknown action: {action}", flush=True)
                    
            except json.JSONDecodeError as e:
                print(f"COMPRESSION_ERROR:Invalid JSON: {e}", flush=True)
            except Exception as e:
                print(f"COMPRESSION_ERROR:Processing error: {e}", flush=True)
                
    except KeyboardInterrupt:
        print("COMPRESSION_ENGINE_SHUTDOWN", flush=True)
    except Exception as e:
        print(f"COMPRESSION_FATAL_ERROR:{e}", flush=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
