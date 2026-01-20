"""
Harmonic Transformer Core Implementation

This module implements a custom transformer architecture optimized for quantum-harmonic processing,
featuring self-attention with harmonic resonance patterns, multi-head attention, and spectral
activation functions.
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F


class HarmonicPositionalEncoding(nn.Module):
    """
    Quantum-inspired positional encoding that uses harmonic phase relationships
    to represent token positions in a sequence.
    """
    def __init__(self, d_model, max_seq_length=2048, dropout=0.1):
        super().__init__()
        self.dropout = nn.Dropout(p=dropout)
        
        # Create positional encoding matrix
        pe = torch.zeros(max_seq_length, d_model)
        position = torch.arange(0, max_seq_length, dtype=torch.float).unsqueeze(1)
        
        # Use quantum-inspired phase encoding with golden ratio influence
        phi = (1 + math.sqrt(5)) / 2  # Golden ratio
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        
        # Apply harmonic phase encoding
        pe[:, 0::2] = torch.sin(position * div_term * phi)
        pe[:, 1::2] = torch.cos(position * div_term / phi)
        
        # Register as buffer (not a parameter)
        self.register_buffer('pe', pe.unsqueeze(0))
        
    def forward(self, x):
        """
        Args:
            x: Tensor, shape [batch_size, seq_len, embedding_dim]
        """
        x = x + self.pe[:, :x.size(1)]
        return self.dropout(x)


class SpectralActivation(nn.Module):
    """
    Custom activation function based on harmonic principles,
    combining aspects of GELU with spectral characteristics.
    """
    def __init__(self, alpha=0.5, beta=1.0):
        super().__init__()
        self.alpha = alpha
        self.beta = beta
        
    def forward(self, x):
        # Combine GELU-like behavior with harmonic components
        gelu_like = 0.5 * x * (1 + torch.tanh(math.sqrt(2 / math.pi) * (x + 0.044715 * torch.pow(x, 3))))
        harmonic_mod = self.alpha * torch.sin(self.beta * x)
        return gelu_like + harmonic_mod


class HarmonicMultiHeadAttention(nn.Module):
    """
    Multi-head attention with harmonic resonance patterns for enhanced
    relationship modeling between tokens.
    """
    def __init__(self, d_model, num_heads, dropout=0.1):
        super().__init__()
        self.d_model = d_model
        self.num_heads = num_heads
        self.head_dim = d_model // num_heads
        assert self.head_dim * num_heads == d_model, "d_model must be divisible by num_heads"
        
        # Linear projections for Q, K, V
        self.q_proj = nn.Linear(d_model, d_model)
        self.k_proj = nn.Linear(d_model, d_model)
        self.v_proj = nn.Linear(d_model, d_model)
        self.out_proj = nn.Linear(d_model, d_model)
        
        # Harmonic resonance parameters
        self.resonance_factor = nn.Parameter(torch.ones(num_heads, 1, 1))
        self.phase_shift = nn.Parameter(torch.zeros(num_heads, 1, 1))
        
        self.dropout = nn.Dropout(dropout)
        
    def forward(self, query, key, value, mask=None):
        batch_size = query.size(0)
        
        # Linear projections and reshape for multi-head attention
        q = self.q_proj(query).view(batch_size, -1, self.num_heads, self.head_dim).transpose(1, 2)
        k = self.k_proj(key).view(batch_size, -1, self.num_heads, self.head_dim).transpose(1, 2)
        v = self.v_proj(value).view(batch_size, -1, self.num_heads, self.head_dim).transpose(1, 2)
        
        # Scaled dot-product attention with harmonic resonance
        scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(self.head_dim)
        
        # Apply harmonic resonance patterns
        harmonic_mod = self.resonance_factor * torch.sin(scores + self.phase_shift)
        scores = scores + harmonic_mod
        
        # Apply mask if provided
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        
        # Apply softmax and dropout
        attn_weights = F.softmax(scores, dim=-1)
        attn_weights = self.dropout(attn_weights)
        
        # Apply attention weights to values
        output = torch.matmul(attn_weights, v)
        
        # Reshape and apply output projection
        output = output.transpose(1, 2).contiguous().view(batch_size, -1, self.d_model)
        output = self.out_proj(output)
        
        return output, attn_weights


class HarmonicFeedForward(nn.Module):
    """
    Feed-forward network with spectral activation functions.
    """
    def __init__(self, d_model, d_ff, dropout=0.1):
        super().__init__()
        self.linear1 = nn.Linear(d_model, d_ff)
        self.activation = SpectralActivation()
        self.dropout = nn.Dropout(dropout)
        self.linear2 = nn.Linear(d_ff, d_model)
        
    def forward(self, x):
        x = self.linear1(x)
        x = self.activation(x)
        x = self.dropout(x)
        x = self.linear2(x)
        return x


class HarmonicLayerNorm(nn.Module):
    """
    Layer normalization with harmonic stabilization.
    """
    def __init__(self, d_model, eps=1e-6):
        super().__init__()
        self.gamma = nn.Parameter(torch.ones(d_model))
        self.beta = nn.Parameter(torch.zeros(d_model))
        self.eps = eps
        
        # Harmonic stabilization parameters
        self.stabilizer = nn.Parameter(torch.ones(1) * 0.1)
        
    def forward(self, x):
        mean = x.mean(-1, keepdim=True)
        std = x.std(-1, keepdim=True)
        
        # Apply harmonic stabilization
        std = std + self.stabilizer * torch.sin(std * math.pi)
        
        # Normalize
        x = (x - mean) / (std + self.eps)
        
        # Scale and shift
        x = self.gamma * x + self.beta
        return x


class HarmonicTransformerLayer(nn.Module):
    """
    A single layer of the Harmonic Transformer.
    """
    def __init__(self, d_model, num_heads, d_ff, dropout=0.1):
        super().__init__()
        self.self_attn = HarmonicMultiHeadAttention(d_model, num_heads, dropout)
        self.norm1 = HarmonicLayerNorm(d_model)
        self.ff = HarmonicFeedForward(d_model, d_ff, dropout)
        self.norm2 = HarmonicLayerNorm(d_model)
        self.dropout = nn.Dropout(dropout)
        
    def forward(self, x, mask=None):
        # Self-attention with residual connection and normalization
        attn_output, _ = self.self_attn(x, x, x, mask)
        x = x + self.dropout(attn_output)
        x = self.norm1(x)
        
        # Feed-forward with residual connection and normalization
        ff_output = self.ff(x)
        x = x + self.dropout(ff_output)
        x = self.norm2(x)
        
        return x


class HarmonicTransformer(nn.Module):
    """
    Complete Harmonic Transformer model optimized for quantum-harmonic processing.
    """
    def __init__(self, vocab_size, d_model=768, num_heads=12, num_layers=12, 
                 d_ff=3072, max_seq_length=2048, dropout=0.1):
        super().__init__()
        self.d_model = d_model
        
        # Token embedding
        self.token_embedding = nn.Embedding(vocab_size, d_model)
        self.pos_encoding = HarmonicPositionalEncoding(d_model, max_seq_length, dropout)
        
        # Transformer layers
        self.layers = nn.ModuleList([
            HarmonicTransformerLayer(d_model, num_heads, d_ff, dropout)
            for _ in range(num_layers)
        ])
        
        # Output normalization
        self.norm = HarmonicLayerNorm(d_model)
        
        # Initialize parameters
        self._init_parameters()
        
    def _init_parameters(self):
        """Initialize model parameters with harmonic-aware initialization."""
        for p in self.parameters():
            if p.dim() > 1:
                # Use Xavier initialization with harmonic adjustment
                nn.init.xavier_uniform_(p)
                # Apply small harmonic perturbation
                with torch.no_grad():
                    phi = (1 + math.sqrt(5)) / 2  # Golden ratio
                    p.data = p.data + 0.01 * torch.sin(phi * p.data)
        
    def forward(self, x, mask=None):
        # Apply token embedding and positional encoding
        x = self.token_embedding(x) * math.sqrt(self.d_model)
        x = self.pos_encoding(x)
        
        # Apply transformer layers
        for layer in self.layers:
            x = layer(x, mask)
        
        # Apply final normalization
        x = self.norm(x)
        
        return x
