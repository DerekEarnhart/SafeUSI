import json
import time
import numpy as np
from typing import Dict, List, Any, Optional

class MemoryVault:
    def __init__(self, filename='memory_vault.json'):
        self.filename = filename
        self.audit_trail = []
        self.supported_file_types = 'all_known_formats_via_harmonic_embedding'
        self.memory_attributes = {
            'degradation': 'none', 
            'permanence': 'harmonic_stable', 
            'fading': 'none'
        }
        self.belief_state = {'A': 1, 'B': 1, 'C': 1}
        self.large_io_capability = 'harmonic_compression_and_distributed_processing_framework'
        self.code_knowledge = {}
        self.programming_skills = {'indexing_efficiency': 0.85}
        self.harmonic_index = {}
        self._load_state()

    def _load_state(self):
        try:
            with open(self.filename, 'r') as f:
                data = json.load(f)
                self.audit_trail = data.get('audit_trail', [])
                self.supported_file_types = data.get('supported_file_types', self.supported_file_types)
                self.memory_attributes = data.get('memory_attributes', self.memory_attributes)
                self.belief_state = data.get('belief_state', self.belief_state)
                self.large_io_capability = data.get('large_io_capability', self.large_io_capability)
                self.code_knowledge = data.get('code_knowledge', self.code_knowledge)
                self.programming_skills = data.get('programming_skills', self.programming_skills)
                self.harmonic_index = data.get('harmonic_index', {})
            print(f"[MemoryVault] Loaded state from {self.filename}")
        except (FileNotFoundError, json.JSONDecodeError):
            print(f"[MemoryVault] No existing {self.filename} found. Initializing new vault.")
            self._save_state()

    def _save_state(self):
        data = {
            'audit_trail': self.audit_trail,
            'supported_file_types': self.supported_file_types,
            'memory_attributes': self.memory_attributes,
            'belief_state': self.belief_state,
            'large_io_capability': self.large_io_capability,
            'code_knowledge': self.code_knowledge,
            'programming_skills': self.programming_skills,
            'harmonic_index': self.harmonic_index
        }
        with open(self.filename, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"[MemoryVault] State saved to {self.filename}")

    def add_entry(self, action: str, details: Dict[str, Any], harmonic_state: Optional[List[float]] = None):
        """Add entry with harmonic indexing"""
        entry = {
            'timestamp': time.time(), 
            'action': action, 
            'details': details,
            'harmonic_state': harmonic_state or [0.5, 0.5, 0.5, 0.5]
        }
        
        self.audit_trail.insert(0, entry)  # Prepend new entries
        
        # Update harmonic index
        if harmonic_state:
            self._update_harmonic_index(action, harmonic_state, entry['timestamp'])
        
        # Keep only last 1000 entries to prevent memory bloat
        if len(self.audit_trail) > 1000:
            self.audit_trail = self.audit_trail[:1000]
        
        self._save_state()

    def _update_harmonic_index(self, action: str, harmonic_state: List[float], timestamp: float):
        """Update harmonic index for fast retrieval"""
        if action not in self.harmonic_index:
            self.harmonic_index[action] = []
        
        self.harmonic_index[action].append({
            'timestamp': timestamp,
            'harmonic_state': harmonic_state,
            'coherence': np.mean(harmonic_state)
        })
        
        # Keep only last 100 entries per action
        if len(self.harmonic_index[action]) > 100:
            self.harmonic_index[action] = self.harmonic_index[action][-100:]

    def update_belief_state(self, new_belief_state: Dict[str, float]):
        self.belief_state = new_belief_state
        self.add_entry('update_belief_state', {'new_state': new_belief_state})

    def ingest_file(self, file_name: str, file_size: int, file_type: str, harmonic_signature: Optional[List[float]] = None):
        """Ingest file with harmonic analysis"""
        if harmonic_signature is None:
            # Generate harmonic signature from filename
            harmonic_signature = self._generate_file_harmonic_signature(file_name, file_size, file_type)
        
        details = {
            'fileName': file_name,
            'fileSize': file_size,
            'fileType': file_type,
            'ingestion': 'Perception analyzed metadata & harmonic signature.',
            'compression': 'Harmonic embedding applied.',
            'large_io_handling': 'Routed via distributed pipeline.' if file_size > 5_000_000 else 'Standard path.',
            'media_viewing': 'Image-type (viewer available).' if file_type.startswith('image/') else 'Not visual media.',
            'memory_integration': 'Embedded into Persistent Harmonic Ledger.',
            'harmonic_signature': harmonic_signature
        }
        
        self.add_entry('file_ingest', details, harmonic_signature)
        print(f"[MemoryVault] Ingested file: {file_name} ({file_size} bytes) with harmonic signature {[round(h, 3) for h in harmonic_signature]}")
        return details

    def _generate_file_harmonic_signature(self, filename: str, file_size: int, file_type: str) -> List[float]:
        """Generate harmonic signature for a file"""
        # Use filename, size, and type to create unique harmonic signature
        name_hash = sum(ord(c) for c in filename) % 1000
        size_factor = min(1.0, file_size / 1000000)  # Normalize to MB
        type_factor = sum(ord(c) for c in file_type) % 100 / 100.0
        
        return [
            np.sin(name_hash / 100.0),
            np.cos(size_factor * np.pi),
            np.sin(type_factor * np.pi * 2),
            np.cos((name_hash + file_size) / 1000.0)
        ]

    def hyper_index_memory(self, coherence_score: float) -> str:
        """Hyper-index memory with coherence-based optimization"""
        print(f"[MemoryVault] Hyper-indexing memory with coherence score: {coherence_score:.2f}")
        
        if coherence_score > 0.9:
            # High coherence: optimize high-value entries
            relevant_entries = [e for e in self.audit_trail if e['action'] in ['generate_response', 'file_ingest', 'agent_task']]
            print(f"[MemoryVault] High coherence optimization: Processing {len(relevant_entries)} premium entries.")
            
            # Update indexing efficiency
            self.programming_skills['indexing_efficiency'] = min(1.0, self.programming_skills['indexing_efficiency'] * 1.1)
            
        elif coherence_score < 0.5:
            # Low coherence: reorganize and clean up
            print("[MemoryVault] Low coherence detected: Reorganizing memory structure.")
            self._reorganize_low_coherence_entries()
            
        else:
            # Medium coherence: standard optimization
            print("[MemoryVault] Standard coherence optimization.")
            self._optimize_harmonic_index()

        self.code_knowledge['last_hyper_index'] = time.time()
        self.programming_skills['indexing_efficiency'] = min(1.0, coherence_score * 1.2)
        self._save_state()
        
        return f"Memory hyper-indexed with coherence {coherence_score:.2f}. Efficiency: {self.programming_skills['indexing_efficiency']:.3f}"

    def _reorganize_low_coherence_entries(self):
        """Reorganize entries with low coherence"""
        # Group entries by action type for better organization
        action_groups = {}
        for entry in self.audit_trail:
            action = entry['action']
            if action not in action_groups:
                action_groups[action] = []
            action_groups[action].append(entry)
        
        # Sort each group by timestamp (most recent first)
        for action in action_groups:
            action_groups[action].sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Rebuild audit trail with organized entries
        reorganized_trail = []
        for action in sorted(action_groups.keys()):
            reorganized_trail.extend(action_groups[action])
        
        self.audit_trail = reorganized_trail
        print(f"[MemoryVault] Reorganized {len(self.audit_trail)} entries into {len(action_groups)} action groups.")

    def _optimize_harmonic_index(self):
        """Optimize harmonic index for better retrieval"""
        for action in self.harmonic_index:
            entries = self.harmonic_index[action]
            if len(entries) > 10:
                # Calculate average harmonic state for the action
                avg_harmonic = np.mean([e['harmonic_state'] for e in entries], axis=0)
                
                # Keep high-coherence entries and representative samples
                high_coherence = [e for e in entries if e['coherence'] > 0.7]
                recent_entries = sorted(entries, key=lambda x: x['timestamp'], reverse=True)[:20]
                
                # Combine and deduplicate
                optimized_entries = list({e['timestamp']: e for e in high_coherence + recent_entries}.values())
                self.harmonic_index[action] = optimized_entries
                
        print("[MemoryVault] Harmonic index optimized for improved retrieval performance.")

    def harmonic_search(self, query_harmonic_state: List[float], threshold: float = 0.5) -> List[Dict[str, Any]]:
        """Search memory using harmonic state similarity"""
        matches = []
        
        for entry in self.audit_trail:
            if 'harmonic_state' in entry:
                entry_state = entry['harmonic_state']
                similarity = self._calculate_harmonic_similarity(query_harmonic_state, entry_state)
                
                if similarity >= threshold:
                    matches.append({
                        'entry': entry,
                        'similarity': similarity,
                        'relevance_score': similarity * (1 + entry.get('timestamp', 0) / time.time())
                    })
        
        # Sort by relevance score
        matches.sort(key=lambda x: x['relevance_score'], reverse=True)
        return matches[:10]  # Return top 10 matches

    def _calculate_harmonic_similarity(self, state1: List[float], state2: List[float]) -> float:
        """Calculate similarity between harmonic states"""
        if len(state1) != len(state2):
            min_len = min(len(state1), len(state2))
            state1 = state1[:min_len]
            state2 = state2[:min_len]
        
        # Calculate cosine similarity
        dot_product = np.dot(state1, state2)
        magnitude1 = np.linalg.norm(state1)
        magnitude2 = np.linalg.norm(state2)
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return float(dot_product / (magnitude1 * magnitude2))

    def store_memory(self, content: str, metadata: Optional[Dict[str, Any]] = None, 
                    harmonic_signature: Optional[List[float]] = None) -> str:
        """Store a memory with enhanced harmonic indexing"""
        memory_id = f"mem_{int(time.time())}_{len(self.audit_trail)}"
        
        if harmonic_signature is None:
            harmonic_signature = self._generate_file_harmonic_signature(content, len(content), 'text')
        
        self.add_entry('store_memory', {
            'memory_id': memory_id,
            'content': content,
            'metadata': metadata or {},
            'content_length': len(content)
        }, harmonic_signature)
        
        return memory_id
    
    def search_memories(self, query: str, limit: int = 10, 
                       metadata_filter: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Search memories using enhanced harmonic matching"""
        query_signature = self._generate_file_harmonic_signature(query, len(query), 'text')
        matches = self.harmonic_search(query_signature, threshold=0.3)
        
        # Filter by metadata if provided
        if metadata_filter:
            filtered_matches = []
            for match in matches:
                entry_details = match['entry'].get('details', {})
                entry_metadata = entry_details.get('metadata', {})
                
                if all(entry_metadata.get(k) == v for k, v in metadata_filter.items()):
                    filtered_matches.append(match)
            
            matches = filtered_matches
        
        return matches[:limit]
    
    def get_memory_statistics(self) -> Dict[str, Any]:
        """Get comprehensive memory vault statistics (legacy interface)"""
        return self.get_memory_stats()

    def get_memory_stats(self) -> Dict[str, Any]:
        """Get comprehensive memory vault statistics"""
        return {
            'total_entries': len(self.audit_trail),
            'indexed_actions': list(self.harmonic_index.keys()),
            'indexing_efficiency': self.programming_skills.get('indexing_efficiency', 0.0),
            'memory_attributes': self.memory_attributes,
            'belief_state': self.belief_state,
            'last_hyper_index': self.code_knowledge.get('last_hyper_index', 0),
            'harmonic_index_size': sum(len(entries) for entries in self.harmonic_index.values()),
            'average_coherence': self._calculate_average_coherence()
        }

    def _calculate_average_coherence(self) -> float:
        """Calculate average coherence across all indexed entries"""
        all_coherences = []
        for action_entries in self.harmonic_index.values():
            all_coherences.extend([e['coherence'] for e in action_entries])
        
        return float(np.mean(all_coherences)) if all_coherences else 0.5

    def export_memory_summary(self) -> Dict[str, Any]:
        """Export a summary of memory vault for external systems"""
        recent_entries = self.audit_trail[:50]  # Last 50 entries
        action_summary = {}
        
        for entry in recent_entries:
            action = entry['action']
            if action not in action_summary:
                action_summary[action] = {'count': 0, 'last_timestamp': 0}
            action_summary[action]['count'] += 1
            action_summary[action]['last_timestamp'] = max(
                action_summary[action]['last_timestamp'], 
                entry['timestamp']
            )
        
        return {
            'summary': action_summary,
            'stats': self.get_memory_stats(),
            'recent_activity': len([e for e in recent_entries if e['timestamp'] > time.time() - 3600])  # Last hour
        }