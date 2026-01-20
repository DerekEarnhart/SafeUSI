#!/usr/bin/env python3
"""
Llama Local NLP Processor
Integrates Llama model for local NLP while preserving WSM framework reasoning logic
"""

import json
import sys
import time
import os
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass, asdict
import hashlib

@dataclass
class LlamaConfig:
    """Configuration for Llama model"""
    model_path: Optional[str] = None
    max_tokens: int = 1024
    temperature: float = 0.7
    top_p: float = 0.9
    context_length: int = 4096
    use_local_fallback: bool = True
    preserve_wsm_reasoning: bool = True

@dataclass 
class NLPRequest:
    """NLP processing request structure"""
    text: str
    task_type: str  # 'summarize', 'analyze', 'extract', 'chat'
    context: Optional[str] = None
    wsm_context: Optional[Dict[str, Any]] = None
    preserve_reasoning: bool = True

@dataclass
class NLPResponse:
    """NLP processing response"""
    response: str
    task_type: str
    processing_time: float
    model_used: str
    wsm_enhanced: bool
    reasoning_preserved: bool
    metadata: Dict[str, Any]

class LocalLlamaProcessor:
    """Local Llama processor that integrates with WSM framework"""
    
    def __init__(self, config: Optional[LlamaConfig] = None):
        self.config = config or LlamaConfig()
        self.model = None
        self.is_initialized = False
        self.fallback_enabled = self.config.use_local_fallback
        
        # WSM Integration flags
        self.wsm_reasoning_active = True
        self.preserve_harmonic_context = True
        
    def initialize(self) -> bool:
        """Initialize Llama model with fallback support"""
        try:
            # Try to import and initialize llama-cpp-python if available
            try:
                from llama_cpp import Llama
                if self.config.model_path and os.path.exists(self.config.model_path):
                    self.model = Llama(
                        model_path=self.config.model_path,
                        n_ctx=self.config.context_length,
                        verbose=False
                    )
                    self.is_initialized = True
                    print(f"[LlamaProcessor] Initialized with model: {self.config.model_path}")
                    return True
            except ImportError:
                print("[LlamaProcessor] llama-cpp-python not available, using fallback")
            except Exception as e:
                print(f"[LlamaProcessor] Model loading failed: {e}")
            
            # Fallback: Use local text processing
            if self.fallback_enabled:
                self.model = "local_fallback"
                self.is_initialized = True
                print("[LlamaProcessor] Initialized with local fallback processor")
                return True
                
            return False
            
        except Exception as e:
            print(f"[LlamaProcessor] Initialization failed: {e}")
            return False
    
    def process_request(self, request: NLPRequest) -> NLPResponse:
        """Process NLP request while preserving WSM reasoning framework"""
        start_time = time.time()
        
        try:
            # Ensure WSM reasoning is preserved
            if request.preserve_reasoning and self.wsm_reasoning_active:
                # Process through WSM-enhanced pipeline
                response_text = self._process_with_wsm_preservation(request)
                wsm_enhanced = True
            else:
                # Direct Llama processing
                response_text = self._process_direct(request)
                wsm_enhanced = False
            
            processing_time = time.time() - start_time
            
            return NLPResponse(
                response=response_text,
                task_type=request.task_type,
                processing_time=processing_time,
                model_used=self._get_model_name(),
                wsm_enhanced=wsm_enhanced,
                reasoning_preserved=request.preserve_reasoning,
                metadata={
                    'context_used': bool(request.context),
                    'wsm_context_used': bool(request.wsm_context),
                    'fallback_used': self.model == "local_fallback"
                }
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            return NLPResponse(
                response=f"Error processing request: {str(e)}",
                task_type=request.task_type,
                processing_time=processing_time,
                model_used="error",
                wsm_enhanced=False,
                reasoning_preserved=False,
                metadata={'error': str(e)}
            )
    
    def _process_with_wsm_preservation(self, request: NLPRequest) -> str:
        """Process request while preserving WSM reasoning framework"""
        
        # Step 1: Extract WSM context if available
        wsm_context = request.wsm_context or {}
        harmonic_state = wsm_context.get('harmonic_state', {})
        coherence_level = wsm_context.get('coherence', 0.7)
        
        # Step 2: Prepare prompt with WSM context preservation
        enhanced_prompt = self._create_wsm_enhanced_prompt(request, harmonic_state, coherence_level)
        
        # Step 3: Process with Llama while maintaining WSM structure
        if self.model == "local_fallback":
            return self._local_fallback_processing(enhanced_prompt, request.task_type)
        else:
            return self._llama_processing(enhanced_prompt, request.task_type)
    
    def _process_direct(self, request: NLPRequest) -> str:
        """Direct Llama processing without WSM enhancement"""
        prompt = self._create_basic_prompt(request)
        
        if self.model == "local_fallback":
            return self._local_fallback_processing(prompt, request.task_type)
        else:
            return self._llama_processing(prompt, request.task_type)
    
    def _create_wsm_enhanced_prompt(self, request: NLPRequest, harmonic_state: Dict, coherence: float) -> str:
        """Create prompt that preserves WSM reasoning framework"""
        
        wsm_context = f"""
WSM Framework Context:
- Harmonic Coherence: {coherence:.3f}
- Reasoning Mode: Quantum-harmonic enhanced
- Framework: Weyl State Machine logic preserved
- Task Context: {request.context or 'General processing'}

Critical: Maintain WSM's harmonic reasoning patterns in response.
"""
        
        task_instruction = self._get_task_instruction(request.task_type)
        
        return f"""{wsm_context}

{task_instruction}

Input Text: {request.text}

Respond while preserving the harmonic reasoning framework:"""
    
    def _create_basic_prompt(self, request: NLPRequest) -> str:
        """Create basic prompt for direct processing"""
        task_instruction = self._get_task_instruction(request.task_type)
        context_part = f"\nContext: {request.context}" if request.context else ""
        
        return f"""{task_instruction}{context_part}

Input: {request.text}

Response:"""
    
    def _get_task_instruction(self, task_type: str) -> str:
        """Get task-specific instructions"""
        instructions = {
            'summarize': 'Provide a clear, concise summary of the following text:',
            'analyze': 'Analyze the following text for key themes, patterns, and insights:',
            'extract': 'Extract key information and entities from the following text:',
            'chat': 'Respond to the following message in a helpful and informative way:',
            'enhance': 'Enhance and improve the following text while maintaining its core meaning:',
            'question': 'Answer the following question based on the provided text:'
        }
        return instructions.get(task_type, 'Process the following text:')
    
    def _llama_processing(self, prompt: str, task_type: str) -> str:
        """Process with actual Llama model"""
        try:
            if not self.model or self.model == "local_fallback":
                return self._local_fallback_processing(prompt, task_type)
            
            response = self.model(
                prompt,
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature,
                top_p=self.config.top_p,
                stop=["Input:", "Response:", "\n\n"]
            )
            
            return response['choices'][0]['text'].strip()
            
        except Exception as e:
            print(f"[LlamaProcessor] Llama processing failed: {e}")
            return self._local_fallback_processing(prompt, task_type)
    
    def _local_fallback_processing(self, prompt: str, task_type: str) -> str:
        """Local fallback processing when Llama model unavailable"""
        
        # Extract text from prompt
        if "Input Text:" in prompt:
            text = prompt.split("Input Text:")[-1].split("Respond while")[0].strip()
        elif "Input:" in prompt:
            text = prompt.split("Input:")[-1].split("Response:")[0].strip()
        else:
            text = prompt
        
        # Simple processing based on task type
        if task_type == 'summarize':
            return self._fallback_summarize(text)
        elif task_type == 'analyze':
            return self._fallback_analyze(text)
        elif task_type == 'extract':
            return self._fallback_extract(text)
        elif task_type == 'chat':
            return self._fallback_chat(text)
        else:
            return self._fallback_general(text)
    
    def _fallback_summarize(self, text: str) -> str:
        """Fallback summarization"""
        sentences = text.split('.')
        if len(sentences) <= 3:
            return text
        
        # Take first and last sentences, plus one from middle
        summary_parts = [
            sentences[0].strip(),
            sentences[len(sentences)//2].strip() if len(sentences) > 2 else "",
            sentences[-2].strip() if len(sentences) > 1 else ""
        ]
        
        summary = ". ".join([part for part in summary_parts if part]) + "."
        return f"Summary: {summary}"
    
    def _fallback_analyze(self, text: str) -> str:
        """Fallback analysis"""
        word_count = len(text.split())
        sentence_count = len([s for s in text.split('.') if s.strip()])
        
        # Basic keyword extraction
        words = text.lower().split()
        word_freq = {}
        for word in words:
            if len(word) > 3:  # Only meaningful words
                word_freq[word] = word_freq.get(word, 0) + 1
        
        top_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:5]
        keywords = [word for word, _ in top_keywords]
        
        return f"""Analysis:
- Word Count: {word_count}
- Sentences: {sentence_count}
- Key Terms: {', '.join(keywords)}
- Content Type: {'Technical' if any(kw in text.lower() for kw in ['function', 'algorithm', 'data', 'system']) else 'General'}
"""
    
    def _fallback_extract(self, text: str) -> str:
        """Fallback entity extraction"""
        # Simple pattern matching for common entities
        import re
        
        entities = {
            'emails': re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text),
            'urls': re.findall(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', text),
            'numbers': re.findall(r'\b\d+(?:\.\d+)?\b', text),
            'dates': re.findall(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b', text)
        }
        
        result = "Extracted Entities:\n"
        for entity_type, items in entities.items():
            if items:
                result += f"- {entity_type.title()}: {', '.join(set(items[:5]))}\n"
        
        return result if result != "Extracted Entities:\n" else "No specific entities found."
    
    def _fallback_chat(self, text: str) -> str:
        """Fallback chat response"""
        text_lower = text.lower()
        
        # Simple pattern matching for responses
        if any(word in text_lower for word in ['hello', 'hi', 'hey']):
            return "Hello! How can I assist you today?"
        elif any(word in text_lower for word in ['help', 'assist', 'support']):
            return "I'm here to help! Please let me know what you need assistance with."
        elif '?' in text:
            return "That's an interesting question. Based on the information provided, I'd need more context to give you a complete answer."
        else:
            return "I understand you're asking about this topic. While I can process your request, a full language model would provide more detailed insights."
    
    def _fallback_general(self, text: str) -> str:
        """General fallback processing"""
        return f"Processed text (length: {len(text)} characters). For advanced NLP capabilities, please ensure Llama model is properly configured."
    
    def _get_model_name(self) -> str:
        """Get current model identifier"""
        if self.model == "local_fallback":
            return "local_fallback_processor"
        elif self.model:
            return f"llama_local_{self.config.model_path or 'default'}"
        else:
            return "uninitialized"
    
    def get_status(self) -> Dict[str, Any]:
        """Get processor status"""
        return {
            'initialized': self.is_initialized,
            'model_type': self._get_model_name(),
            'wsm_reasoning_active': self.wsm_reasoning_active,
            'preserve_harmonic_context': self.preserve_harmonic_context,
            'fallback_enabled': self.fallback_enabled,
            'config': asdict(self.config)
        }

def main():
    """Main service loop"""
    processor = LocalLlamaProcessor()
    
    if not processor.initialize():
        print("LLAMA_ERROR:Failed to initialize processor", flush=True)
        sys.exit(1)
    
    print("LLAMA_INITIALIZED:Ready for processing", flush=True)
    
    try:
        for line in sys.stdin:
            try:
                command = json.loads(line.strip())
                action = command.get('action')
                
                if action == 'process':
                    request_data = command.get('request', {})
                    request = NLPRequest(**request_data)
                    
                    response = processor.process_request(request)
                    
                    output = {
                        'action': 'process_response',
                        'response': asdict(response)
                    }
                    
                    print(f"LLAMA_RESULT:{json.dumps(output)}", flush=True)
                
                elif action == 'status':
                    status = processor.get_status()
                    output = {
                        'action': 'status_response', 
                        'status': status
                    }
                    print(f"LLAMA_RESULT:{json.dumps(output)}", flush=True)
                
                elif action == 'configure':
                    config_data = command.get('config', {})
                    processor.config = LlamaConfig(**config_data)
                    print("LLAMA_RESULT:{\"action\":\"configure_response\",\"success\":true}", flush=True)
                
                else:
                    print(f"LLAMA_ERROR:Unknown action: {action}", flush=True)
                    
            except json.JSONDecodeError as e:
                print(f"LLAMA_ERROR:Invalid JSON: {e}", flush=True)
            except Exception as e:
                print(f"LLAMA_ERROR:Processing error: {e}", flush=True)
                
    except KeyboardInterrupt:
        print("LLAMA_PROCESSOR_SHUTDOWN", flush=True)
    except Exception as e:
        print(f"LLAMA_FATAL_ERROR:{e}", flush=True)
        sys.exit(1)

if __name__ == "__main__":
    main()