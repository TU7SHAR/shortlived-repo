"""
CONTEXT RANKER - Production Grade

Fixes the "Lost in the Middle" phenomenon using intelligent reranking.
Arranges context chunks to maximize LLM attention.

Academic research shows LLMs attend to:
- Position 1 (TOP):     90% attention
- Position 2:           85% attention  
- Position 3:           70% attention
- Position 4-5 (MID):   40-50% attention  <-- DEAD ZONE
- Position 6:           65% attention
- Position 7 (BOTTOM):  90% attention

Solution: Use "sandwich pattern" - put best matches top and bottom.

Author: Architecture Team
Date: 2025
"""

import logging
from typing import List, Dict, Tuple, Optional

logger = logging.getLogger(__name__)


class ContextRanker:
    """
    Reranks retrieved context chunks using intelligent patterns.
    
    Goal: Maximize LLM attention to important information.
    
    Patterns:
    1. SANDWICH: [Best] [Middle Low] [Middle] [Middle Low] [Second-Best]
    2. HIERARCHY: Mark chunks with importance levels for LLM
    """
    
    # Scoring multipliers for different content characteristics
    KEYWORD_BOOST = {
        "budget": 0.30,          # Financial constraints are critical
        "price": 0.25,
        "cost": 0.25,
        "deadline": 0.30,        # Time constraints are critical
        "timeline": 0.25,
        "requirement": 0.20,     # Hard requirements
        "must": 0.20,
        "critical": 0.25,
        "essential": 0.20,
        "urgent": 0.25,
    }
    
    # Length scoring (content length quality)
    OPTIMAL_LENGTH_MIN = 200    # Too short = not specific enough
    OPTIMAL_LENGTH_MAX = 1500   # Too long = probably noisy
    
    @staticmethod
    def score_chunk(
        chunk: Dict,
        user_constraints: Optional[Dict] = None,
        user_query: Optional[str] = None
    ) -> float:
        """
        Scores a single chunk for importance.
        
        Factors:
        1. Vector similarity (from retrieval)
        2. Content length (specificity indicator)
        3. Keyword presence (matches constraints or critical terms)
        4. Source type (if available)
        
        Args:
            chunk: Dict with keys: 'content', 'score' (and optional others)
            user_constraints: User's extracted constraints
            user_query: Original user query (for keyword matching)
        
        Returns:
            Importance score (0.0 to 1.0)
        """
        
        try:
            # Base score: vector similarity
            similarity_score = chunk.get("score", 0.5)
            if similarity_score > 1.0:
                similarity_score = similarity_score / 100  # Normalize if percentage
            
            importance = similarity_score
            
            content = chunk.get("content", "")
            content_lower = content.lower()
            
            # ===== FACTOR 1: Content Length =====
            content_length = len(content)
            
            if ContextRanker.OPTIMAL_LENGTH_MIN <= content_length <= ContextRanker.OPTIMAL_LENGTH_MAX:
                # Just right - specific and concise
                importance += 0.15
            elif content_length < ContextRanker.OPTIMAL_LENGTH_MIN:
                # Too short - probably lacks specificity
                importance -= 0.05
            # else: Too long, don't penalize (might be comprehensive)
            
            # ===== FACTOR 2: Keyword Boost (Constraints) =====
            if user_constraints:
                for category, entries in user_constraints.items():
                    if entries:
                        for entry in entries:
                            constraint_value = entry.get("value", "").lower()
                            
                            # Check if constraint is mentioned in chunk
                            if constraint_value in content_lower or any(
                                term in content_lower 
                                for term in constraint_value.split()[:2]
                            ):
                                importance += 0.25  # Strong boost for constraint-relevant content
            
            # ===== FACTOR 3: Keyword Boost (Critical Terms) =====
            for keyword, boost in ContextRanker.KEYWORD_BOOST.items():
                if keyword in content_lower:
                    importance += boost
                    # Cap at boost to avoid double-counting
                    break
            
            # ===== FACTOR 4: Query Relevance =====
            if user_query:
                query_lower = user_query.lower()
                query_terms = [t for t in query_lower.split() if len(t) > 3]
                
                matching_terms = sum(1 for term in query_terms if term in content_lower)
                
                if matching_terms > 0:
                    importance += min(0.10, matching_terms * 0.03)
            
            # ===== FACTOR 5: Source Type =====
            source_type = chunk.get("source_type", "")
            if source_type == "constraint_extraction":
                # Content extracted from constraints is very important
                importance += 0.20
            elif source_type == "vector_db":
                # Normal vector retrieval
                importance += 0.0
            elif source_type == "uploaded_file":
                # User-provided content is reliable
                importance += 0.10
            
            # Cap between 0 and 1
            importance = max(0.0, min(1.0, importance))
            
            return importance
        
        except Exception as e:
            logger.error(f"Error scoring chunk: {e}")
            return chunk.get("score", 0.5)  # Return original score on error
    
    @staticmethod
    def score_all_chunks(
        chunks: List[Dict],
        user_constraints: Optional[Dict] = None,
        user_query: Optional[str] = None
    ) -> List[Dict]:
        """
        Scores all chunks and adds importance_score field.
        
        Args:
            chunks: List of chunks
            user_constraints: User's constraints
            user_query: Original query
        
        Returns:
            Chunks with added importance_score field
        """
        
        scored = []
        
        for chunk in chunks:
            chunk_copy = chunk.copy()
            chunk_copy["importance_score"] = ContextRanker.score_chunk(
                chunk,
                user_constraints=user_constraints,
                user_query=user_query
            )
            scored.append(chunk_copy)
        
        return scored
    
    @staticmethod
    def sandwich_rerank(
        chunks: List[Dict],
        max_chunks: int = 5,
        user_constraints: Optional[Dict] = None,
        user_query: Optional[str] = None
    ) -> List[Dict]:
        """
        Reranks chunks using the sandwich pattern.
        
        Algorithm:
        1. Score all chunks based on multiple factors
        2. Sort by score (descending)
        3. Take top N chunks
        4. Rearrange: [Best] [Middle] [Second-Best]
           (puts second-best at bottom for attention recovery)
        
        This is based on research showing LLM attention patterns:
        - Highest at positions 1 and last
        - Lower in the middle
        
        Args:
            chunks: Retrieved context chunks
            max_chunks: How many chunks to use (recommend 4-6)
            user_constraints: User's constraints for scoring
            user_query: Original query for scoring
        
        Returns:
            Reordered chunks optimized for LLM attention
        """
        
        if not chunks:
            return []
        
        if len(chunks) <= 2:
            return chunks  # Too few chunks, don't reorder
        
        # ===== STEP 1: Score all chunks =====
        scored_chunks = ContextRanker.score_all_chunks(
            chunks,
            user_constraints=user_constraints,
            user_query=user_query
        )
        
        # ===== STEP 2: Sort by importance (descending) =====
        sorted_chunks = sorted(
            scored_chunks,
            key=lambda x: x.get("importance_score", 0),
            reverse=True
        )
        
        # ===== STEP 3: Take top N chunks =====
        top_chunks = sorted_chunks[:max_chunks]
        
        # ===== STEP 4: Rearrange using sandwich pattern =====
        reordered = []
        
        if len(top_chunks) == 1:
            reordered = top_chunks
        
        elif len(top_chunks) == 2:
            # [Best] [Second]
            reordered = top_chunks
        
        else:
            # [Best] [Middle chunks] [Second-Best]
            reordered.append(top_chunks[0])               # Best at TOP
            
            if len(top_chunks) > 2:
                # Add middle chunks (3rd, 4th, etc.)
                reordered.extend(top_chunks[2:-1])
            
            reordered.append(top_chunks[1])              # Second-best at BOTTOM
        
        # Log reranking action
        logger.info(
            f"Sandwich rerank: {len(top_chunks)} chunks, "
            f"scores: {[round(c.get('importance_score', 0), 2) for c in reordered]}, "
            f"pattern: {'[#1] [#3...] [#2]' if len(reordered) > 2 else '[#1] [#2]'}"
        )
        
        return reordered
    
    @staticmethod
    def format_context_with_hierarchy(
        chunks: List[Dict],
        user_constraints: Optional[Dict] = None,
        user_query: Optional[str] = None
    ) -> str:
        """
        Formats reranked chunks with visual hierarchy markers.
        Helps LLM understand importance levels.
        
        Output:
        ═══ CRITICAL CONTEXT ═══
        [Highest importance]
        
        ═══ SUPPORTING CONTEXT ═══
        [Medium importance]
        
        ═══ REFERENCE ═══
        [Lower importance]
        
        Args:
            chunks: Reordered chunks (from sandwich_rerank)
            user_constraints: For display in context
            user_query: For context
        
        Returns:
            Formatted context string for LLM prompt
        """
        
        if not chunks:
            return ""
        
        output = []
        
        # ===== SECTION 1: User Constraints (Highest Priority) =====
        if user_constraints:
            output.append("┏" + "━" * 63 + "┓")
            output.append("┃  USER CONSTRAINTS (ABSOLUTE - NEVER IGNORE THIS)        ┃")
            output.append("┗" + "━" * 63 + "┛")
            
            for category, entries in user_constraints.items():
                if entries:
                    cat_name = category.upper().replace("_", " ")
                    output.append(f"\n▸ {cat_name}:")
                    
                    for entry in entries:
                        value = entry.get("value", "").strip()
                        confidence = entry.get("confidence", "")
                        
                        if value:
                            confidence_mark = "✓" if confidence == "high" else "?"
                            output.append(f"    {confidence_mark} {value}")
            
            output.append("\n")
        
        # ===== SECTION 2: Critical Context (Top Chunk) =====
        if chunks:
            output.append("┏" + "━" * 63 + "┓")
            output.append("┃  PRIMARY CONTEXT (Answer questions using this first)    ┃")
            output.append("┗" + "━" * 63 + "┛")
            
            chunk = chunks[0]
            content = chunk.get("content", "")
            score = chunk.get("importance_score", 0)
            
            output.append(f"\n[Importance: {score:.0%}]")
            output.append(content)
            output.append("")
        
        # ===== SECTION 3: Supporting Context (Middle Chunks) =====
        if len(chunks) > 2:
            output.append("┏" + "━" * 63 + "┓")
            output.append("┃  SUPPORTING CONTEXT (Use if primary doesn't answer)    ┃")
            output.append("┗" + "━" * 63 + "┛\n")
            
            for i, chunk in enumerate(chunks[1:-1], 1):
                content = chunk.get("content", "")
                score = chunk.get("importance_score", 0)
                
                output.append(f"[Context {i} - Importance: {score:.0%}]")
                output.append(content)
                output.append("")
        
        # ===== SECTION 4: Reference Context (Bottom Chunk) =====
        if len(chunks) > 1:
            output.append("┏" + "━" * 63 + "┓")
            output.append("┃  REFERENCE CONTEXT (Additional details for completeness) ┃")
            output.append("┗" + "━" * 63 + "┛\n")
            
            chunk = chunks[-1]
            content = chunk.get("content", "")
            score = chunk.get("importance_score", 0)
            
            output.append(f"[Importance: {score:.0%}]")
            output.append(content)
        
        output.append("\n" + "═" * 65)
        
        return "\n".join(output)
    
    @staticmethod
    def create_context_block(
        chunks: List[Dict],
        user_constraints: Optional[Dict] = None,
        user_query: Optional[str] = None,
        max_chunks: int = 5,
        include_hierarchy: bool = True
    ) -> str:
        """
        All-in-one context creation:
        1. Rerank chunks using sandwich pattern
        2. Format with hierarchy markers
        3. Return ready-to-inject context block
        
        This is your main integration point.
        
        Args:
            chunks: Raw retrieved chunks
            user_constraints: User's constraints
            user_query: Original query
            max_chunks: Max chunks to include
            include_hierarchy: Whether to add section headers
        
        Returns:
            Fully formatted context block ready for LLM prompt
        """
        
        # Step 1: Rerank using sandwich pattern
        reranked = ContextRanker.sandwich_rerank(
            chunks,
            max_chunks=max_chunks,
            user_constraints=user_constraints,
            user_query=user_query
        )
        
        # Step 2: Format with hierarchy
        if include_hierarchy:
            return ContextRanker.format_context_with_hierarchy(
                reranked,
                user_constraints=user_constraints,
                user_query=user_query
            )
        else:
            # Simple concatenation for backward compatibility
            return "\n\n".join([chunk.get("content", "") for chunk in reranked])


# ============================================================================
# USAGE EXAMPLES
# ============================================================================

"""
# In handlers.py, inside handle_message():

from context_ranker import ContextRanker

# Step 1: Retrieve chunks (your existing code)
relevant_chunks = find_relevant_context(user_text, google_id)

if relevant_chunks:
    # Convert to dict format if needed
    chunk_dicts = []
    for i, chunk_text in enumerate(relevant_chunks):
        chunk_dicts.append({
            "content": chunk_text,
            "score": 0.8 - (i * 0.1),  # Decay score for later chunks
            "source_type": "vector_db"
        })
    
    # Step 2: Create reranked context block with all the magic
    context_block = ContextRanker.create_context_block(
        chunk_dicts,
        user_constraints=merged_constraints,
        user_query=user_text,
        max_chunks=5,
        include_hierarchy=True
    )
    
    # Step 3: Add to full context
    full_context = constraint_block + "\\n\\n" + context_block + "\\n\\n" + ai_rules

# Step 4: LLM call (with optimized context)
response = await get_groq_response(user_text, full_context, temperature=0.3)
"""