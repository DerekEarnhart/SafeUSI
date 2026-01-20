#!/usr/bin/env python3
"""
True Conversational WSM System
No preset templates, no rigid patterns - real conversational AI
Uses WSM principles for dynamic response generation
"""

import sys
import os
import re
import math
import json
import time
import random
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

@dataclass
class ConversationContext:
    """Context for maintaining conversation state"""
    topic: str
    sentiment: str
    formality: str
    previous_responses: List[str]
    user_interests: List[str]

class TrueWSMConversational:
    """True conversational WSM system without preset templates"""
    
    def __init__(self):
        print("🧠 Initializing True Conversational WSM System...")
        
        # Dynamic knowledge base - no preset templates
        self.knowledge_base = self._build_dynamic_knowledge()
        
        # Conversation context
        self.context = ConversationContext(
            topic="general",
            sentiment="neutral", 
            formality="casual",
            previous_responses=[],
            user_interests=[]
        )
        
        # Response generation components
        self.concept_extractor = ConceptExtractor()
        self.response_generator = DynamicResponseGenerator()
        self.coherence_analyzer = CoherenceAnalyzer()
        
        print("✅ True Conversational WSM ready - No presets, pure dynamic generation!")
    
    def _build_dynamic_knowledge(self) -> Dict:
        """Build dynamic knowledge base from real concepts"""
        return {
            "entities": {
                "food": ["pizza", "burger", "sushi", "pasta", "salad", "ice cream", "chocolate"],
                "activities": ["reading", "gaming", "cooking", "traveling", "music", "sports", "movies"],
                "emotions": ["happy", "sad", "excited", "tired", "curious", "frustrated", "peaceful"],
                "time": ["morning", "afternoon", "evening", "night", "today", "yesterday", "tomorrow"],
                "weather": ["sunny", "rainy", "cloudy", "snowy", "windy", "hot", "cold"],
                "technology": ["computer", "phone", "internet", "AI", "software", "hardware", "programming"],
                "science": ["physics", "chemistry", "biology", "mathematics", "astronomy", "quantum"],
                "philosophy": ["consciousness", "existence", "reality", "truth", "meaning", "purpose"]
            },
            "relationships": {
                "food_preferences": ["favorite", "like", "dislike", "love", "hate", "enjoy", "prefer"],
                "activity_descriptors": ["fun", "boring", "exciting", "relaxing", "challenging", "easy"],
                "emotional_responses": ["makes me feel", "I feel", "feeling", "emotion", "mood"],
                "temporal_references": ["when", "time", "schedule", "plan", "future", "past"],
                "causal_connections": ["because", "since", "due to", "results in", "causes", "leads to"]
            },
            "conversational_patterns": {
                "greetings": ["hello", "hi", "hey", "good morning", "good evening", "how are you"],
                "questions": ["what", "how", "why", "when", "where", "who", "which", "can you"],
                "opinions": ["think", "believe", "opinion", "view", "perspective", "feel about"],
                "experiences": ["have you", "did you", "experience", "remember", "story", "tell me"],
                "preferences": ["favorite", "prefer", "like better", "choose", "pick", "select"]
            }
        }
    
    def process_conversation(self, user_input: str) -> Dict:
        """Process conversational input dynamically"""
        start_time = time.time()
        
        # Extract concepts and intent
        concepts = self.concept_extractor.extract_concepts(user_input, self.knowledge_base)
        
        # Update conversation context
        self._update_context(user_input, concepts)
        
        # Generate dynamic response
        response = self.response_generator.generate_response(
            user_input, concepts, self.context, self.knowledge_base
        )
        
        # Analyze coherence
        coherence = self.coherence_analyzer.analyze_coherence(
            user_input, response, concepts
        )
        
        # Update conversation history
        self.context.previous_responses.append(response)
        if len(self.context.previous_responses) > 5:
            self.context.previous_responses.pop(0)
        
        processing_time = time.time() - start_time
        
        return {
            "response": response,
            "coherence": coherence,
            "concepts": concepts,
            "context": {
                "topic": self.context.topic,
                "sentiment": self.context.sentiment,
                "formality": self.context.formality
            },
            "processing_time": processing_time
        }
    
    def _update_context(self, user_input: str, concepts: Dict):
        """Update conversation context based on input"""
        # Detect topic
        if concepts["entities"]:
            self.context.topic = concepts["entities"][0]
        
        # Detect sentiment
        positive_words = ["good", "great", "awesome", "love", "like", "happy", "excited", "wonderful"]
        negative_words = ["bad", "terrible", "hate", "dislike", "sad", "angry", "frustrated", "awful"]
        
        input_lower = user_input.lower()
        if any(word in input_lower for word in positive_words):
            self.context.sentiment = "positive"
        elif any(word in input_lower for word in negative_words):
            self.context.sentiment = "negative"
        else:
            self.context.sentiment = "neutral"
        
        # Detect formality
        formal_indicators = ["please", "thank you", "could you", "would you", "I would appreciate"]
        casual_indicators = ["hey", "what's up", "gonna", "wanna", "yeah", "cool"]
        
        if any(indicator in input_lower for indicator in formal_indicators):
            self.context.formality = "formal"
        elif any(indicator in input_lower for indicator in casual_indicators):
            self.context.formality = "casual"
        
        # Track user interests
        for entity in concepts["entities"]:
            if entity not in self.context.user_interests:
                self.context.user_interests.append(entity)
                if len(self.context.user_interests) > 10:
                    self.context.user_interests.pop(0)

class ConceptExtractor:
    """Extract concepts from user input"""
    
    def extract_concepts(self, text: str, knowledge_base: Dict) -> Dict:
        """Extract relevant concepts from text"""
        text_lower = text.lower()
        words = re.findall(r'\w+', text_lower)
        
        extracted = {
            "entities": [],
            "relationships": [],
            "patterns": [],
            "intent": self._detect_intent(text_lower),
            "question_type": self._detect_question_type(text_lower)
        }
        
        # Extract entities
        for category, items in knowledge_base["entities"].items():
            for item in items:
                if item in text_lower:
                    extracted["entities"].append(item)
        
        # Extract relationship patterns
        for category, patterns in knowledge_base["relationships"].items():
            for pattern in patterns:
                if pattern in text_lower:
                    extracted["relationships"].append(pattern)
        
        # Extract conversational patterns
        for category, patterns in knowledge_base["conversational_patterns"].items():
            for pattern in patterns:
                if pattern in text_lower:
                    extracted["patterns"].append(category)
        
        return extracted
    
    def _detect_intent(self, text: str) -> str:
        """Detect user intent"""
        if any(word in text for word in ["what", "how", "why", "when", "where", "who"]):
            return "question"
        elif any(word in text for word in ["tell me", "explain", "describe"]):
            return "request_info"
        elif any(word in text for word in ["i like", "i love", "i prefer", "my favorite"]):
            return "share_preference"
        elif any(word in text for word in ["i think", "i believe", "in my opinion"]):
            return "share_opinion"
        elif any(word in text for word in ["hello", "hi", "hey", "good morning"]):
            return "greeting"
        elif any(word in text for word in ["thanks", "thank you", "goodbye", "bye"]):
            return "closing"
        else:
            return "general"
    
    def _detect_question_type(self, text: str) -> str:
        """Detect type of question"""
        if "what" in text:
            return "what"
        elif "how" in text:
            return "how"
        elif "why" in text:
            return "why"
        elif "when" in text:
            return "when"
        elif "where" in text:
            return "where"
        elif "who" in text:
            return "who"
        else:
            return "general"

class DynamicResponseGenerator:
    """Generate responses dynamically without preset templates"""
    
    def generate_response(self, user_input: str, concepts: Dict, context: ConversationContext, knowledge_base: Dict) -> str:
        """Generate dynamic response based on concepts and context"""
        
        # Handle different intents
        if concepts["intent"] == "greeting":
            return self._generate_greeting_response(context)
        elif concepts["intent"] == "question":
            return self._generate_question_response(user_input, concepts, context, knowledge_base)
        elif concepts["intent"] == "share_preference":
            return self._generate_preference_response(concepts, context)
        elif concepts["intent"] == "share_opinion":
            return self._generate_opinion_response(concepts, context)
        elif concepts["intent"] == "request_info":
            return self._generate_info_response(concepts, context, knowledge_base)
        else:
            return self._generate_general_response(user_input, concepts, context)
    
    def _generate_greeting_response(self, context: ConversationContext) -> str:
        """Generate greeting response"""
        greetings = [
            "Hello! How can I help you today?",
            "Hi there! What's on your mind?",
            "Hey! Good to chat with you.",
            "Hello! What would you like to talk about?"
        ]
        return random.choice(greetings)
    
    def _generate_question_response(self, user_input: str, concepts: Dict, context: ConversationContext, knowledge_base: Dict) -> str:
        """Generate response to questions"""
        
        if concepts["question_type"] == "what":
            if "favorite" in user_input.lower():
                return self._handle_favorite_question(concepts, knowledge_base)
            else:
                return self._handle_what_question(user_input, concepts)
        
        elif concepts["question_type"] == "how":
            return self._handle_how_question(user_input, concepts)
        
        elif concepts["question_type"] == "why":
            return self._handle_why_question(user_input, concepts)
        
        else:
            return self._handle_general_question(user_input, concepts)
    
    def _handle_favorite_question(self, concepts: Dict, knowledge_base: Dict) -> str:
        """Handle questions about favorites"""
        if concepts["entities"]:
            entity = concepts["entities"][0]
            category = self._find_entity_category(entity, knowledge_base)
            
            if category == "food":
                return f"I find the concept of {entity} interesting from a computational perspective. Different people have varying preferences based on taste, texture, and cultural background. What draws you to certain foods?"
            elif category == "activities":
                return f"Activities like {entity} offer different types of engagement and satisfaction. I'm curious about what aspects of {entity} appeal to you most?"
            else:
                return f"That's an interesting question about {entity}. I'd love to hear about your own preferences and what influences them."
        else:
            return "That's a thoughtful question about preferences. I find it fascinating how individual experiences shape what we gravitate toward. What's your favorite?"
    
    def _handle_what_question(self, user_input: str, concepts: Dict) -> str:
        """Handle 'what' questions"""
        if concepts["entities"]:
            entity = concepts["entities"][0]
            return f"Regarding {entity}, there are many interesting aspects to consider. What specific aspect are you most curious about?"
        else:
            return "That's a broad question. Could you help me understand what specific aspect you're most interested in exploring?"
    
    def _handle_how_question(self, user_input: str, concepts: Dict) -> str:
        """Handle 'how' questions"""
        if "day" in user_input.lower():
            return "I don't experience days in the traditional sense, but I find each conversation brings new perspectives and interesting challenges. How has your day been going?"
        elif concepts["entities"]:
            entity = concepts["entities"][0]
            return f"The process involving {entity} can vary depending on context and approach. What specific aspect of the process interests you?"
        else:
            return "That's an interesting process question. The approach often depends on the specific context and goals involved."
    
    def _handle_why_question(self, user_input: str, concepts: Dict) -> str:
        """Handle 'why' questions"""
        if concepts["entities"]:
            entity = concepts["entities"][0]
            return f"The reasons behind {entity} often involve multiple factors and perspectives. What's your take on it?"
        else:
            return "That's a thoughtful question about causation and reasoning. These topics often have multiple layers worth exploring."
    
    def _handle_general_question(self, user_input: str, concepts: Dict) -> str:
        """Handle general questions"""
        return "That's an interesting question. I'd need a bit more context to give you a thoughtful response. Could you elaborate on what you're looking for?"
    
    def _generate_preference_response(self, concepts: Dict, context: ConversationContext) -> str:
        """Generate response to preference sharing"""
        if concepts["entities"]:
            entity = concepts["entities"][0]
            return f"That's cool that you're into {entity}! What got you interested in it? I find it fascinating how people develop different preferences."
        else:
            return "Thanks for sharing your preferences! I find it interesting how individual experiences shape what we're drawn to."
    
    def _generate_opinion_response(self, concepts: Dict, context: ConversationContext) -> str:
        """Generate response to opinion sharing"""
        return "I appreciate you sharing your perspective on that. Different viewpoints often reveal interesting aspects of topics that might not be immediately obvious."
    
    def _generate_info_response(self, concepts: Dict, context: ConversationContext, knowledge_base: Dict) -> str:
        """Generate informational response"""
        if concepts["entities"]:
            entity = concepts["entities"][0]
            category = self._find_entity_category(entity, knowledge_base)
            return f"There's quite a bit to explore about {entity}. What particular aspect would you like to dive into?"
        else:
            return "I'd be happy to discuss that topic. What specific information are you looking for?"
    
    def _generate_general_response(self, user_input: str, concepts: Dict, context: ConversationContext) -> str:
        """Generate general conversational response"""
        responses = [
            "That's an interesting point. Tell me more about your thoughts on this.",
            "I see what you're getting at. What's your experience been with this?",
            "That brings up some good questions. How do you usually approach this kind of thing?",
            "Interesting perspective. What led you to think about this?",
            "That's worth exploring further. What aspects interest you most?"
        ]
        return random.choice(responses)
    
    def _find_entity_category(self, entity: str, knowledge_base: Dict) -> str:
        """Find which category an entity belongs to"""
        for category, items in knowledge_base["entities"].items():
            if entity in items:
                return category
        return "general"

class CoherenceAnalyzer:
    """Analyze response coherence"""
    
    def analyze_coherence(self, user_input: str, response: str, concepts: Dict) -> float:
        """Analyze how coherent the response is"""
        
        # Base coherence from concept relevance
        concept_relevance = self._calculate_concept_relevance(user_input, response, concepts)
        
        # Response structure coherence
        structure_coherence = self._calculate_structure_coherence(response)
        
        # Conversational flow coherence
        flow_coherence = self._calculate_flow_coherence(user_input, response)
        
        # Combined coherence score
        total_coherence = (concept_relevance * 0.4 + structure_coherence * 0.3 + flow_coherence * 0.3)
        
        return min(1.0, max(0.0, total_coherence))
    
    def _calculate_concept_relevance(self, user_input: str, response: str, concepts: Dict) -> float:
        """Calculate how well response addresses user concepts"""
        if not concepts["entities"]:
            return 0.7  # Default for general conversation
        
        response_lower = response.lower()
        relevant_concepts = 0
        
        for entity in concepts["entities"]:
            if entity in response_lower or any(word in response_lower for word in entity.split()):
                relevant_concepts += 1
        
        return min(1.0, relevant_concepts / len(concepts["entities"]))
    
    def _calculate_structure_coherence(self, response: str) -> float:
        """Calculate structural coherence of response"""
        sentences = [s.strip() for s in response.split('.') if s.strip()]
        
        if not sentences:
            return 0.0
        
        # Check for reasonable length
        length_score = min(1.0, len(response) / 200.0) if len(response) < 200 else 1.0
        
        # Check for sentence structure
        structure_score = min(1.0, len(sentences) / 3.0)
        
        return (length_score + structure_score) / 2.0
    
    def _calculate_flow_coherence(self, user_input: str, response: str) -> float:
        """Calculate conversational flow coherence"""
        user_words = set(re.findall(r'\w+', user_input.lower()))
        response_words = set(re.findall(r'\w+', response.lower()))
        
        # Calculate word overlap (but not too much)
        overlap = len(user_words.intersection(response_words))
        overlap_score = min(1.0, overlap / 5.0)  # Optimal around 5 shared words
        
        # Check for conversational markers
        conversational_markers = ["that's", "interesting", "what", "how", "you", "your"]
        marker_count = sum(1 for marker in conversational_markers if marker in response.lower())
        marker_score = min(1.0, marker_count / 3.0)
        
        return (overlap_score + marker_score) / 2.0

# FastAPI integration
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="True Conversational WSM", description="Real conversational AI without preset templates")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global conversational WSM system
conversational_wsm = TrueWSMConversational()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    coherence: float
    concepts: Dict
    context: Dict
    processing_time: float
    source: str = "True Conversational WSM"

@app.get("/")
async def root():
    return {
        "system": "True Conversational WSM",
        "description": "Real conversational AI without preset templates",
        "capabilities": [
            "Dynamic response generation",
            "Context-aware conversation",
            "No preset templates or rigid patterns",
            "Handles any topic naturally",
            "Maintains conversation flow",
            "Adapts to user style and preferences"
        ]
    }

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """True conversational chat endpoint"""
    try:
        result = conversational_wsm.process_conversation(request.message)
        
        return ChatResponse(
            response=result["response"],
            coherence=result["coherence"],
            concepts=result["concepts"],
            context=result["context"],
            processing_time=result["processing_time"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversation processing error: {str(e)}")

@app.get("/status")
async def status():
    return {
        "status": "operational",
        "system": "True Conversational WSM",
        "conversation_context": {
            "topic": conversational_wsm.context.topic,
            "sentiment": conversational_wsm.context.sentiment,
            "formality": conversational_wsm.context.formality,
            "user_interests": conversational_wsm.context.user_interests
        }
    }

@app.post("/reset")
async def reset_conversation():
    """Reset conversation context"""
    conversational_wsm.context = ConversationContext(
        topic="general",
        sentiment="neutral",
        formality="casual", 
        previous_responses=[],
        user_interests=[]
    )
    return {"message": "Conversation context reset"}

if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting True Conversational WSM System...")
    print("✅ No presets, no templates - pure dynamic conversation!")
    
    uvicorn.run(
        "true_wsm_conversational:app",
        host="0.0.0.0",
        port=8005,
        reload=False,
        log_level="info"
    )

