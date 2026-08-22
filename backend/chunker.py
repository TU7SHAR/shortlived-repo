"""
Smart Semantic Chunker for large documents (Phase 3).

Instead of dumb fixed-size character splits, this module:
1. Splits on natural boundaries (paragraphs, headings, sections)
2. Respects sentence boundaries (never splits mid-sentence)
3. Applies meaningful overlap (last 1-2 sentences from prev chunk)
4. Handles different content types (tables, lists, prose)
5. Caps chunks at a token-aware size (optimized for Gemini's context window)

Usage:
    from chunker import smart_chunk

    chunks = smart_chunk(raw_text, max_tokens=1500, overlap_sentences=2)
"""

import re
import logging
from typing import List

logger = logging.getLogger(__name__)

# Approximate tokens per character (English text averages ~4 chars per token)
CHARS_PER_TOKEN = 4

# Default settings
DEFAULT_MAX_TOKENS = 1500  # ~6000 chars — fits well in Gemini embedding context
DEFAULT_OVERLAP_SENTENCES = 2
MIN_CHUNK_CHARS = 100  # Ignore chunks smaller than this


def _estimate_tokens(text: str) -> int:
    """Rough token estimate. Gemini uses ~4 chars per token for English."""
    return len(text) // CHARS_PER_TOKEN


def _split_into_sentences(text: str) -> List[str]:
    """Split text into sentences, preserving line breaks as boundaries."""
    # Split on sentence-ending punctuation followed by space or newline
    sentences = re.split(r'(?<=[.!?])\s+|\n{2,}', text)
    return [s.strip() for s in sentences if s.strip()]


def _split_into_sections(text: str) -> List[str]:
    """
    Split on major section boundaries:
    - Markdown headings (# ## ###)
    - ALL-CAPS lines (common in PDFs)
    - Lines followed by === or --- (underline headings)
    - Double newlines (paragraph breaks)
    """
    # Pattern matches heading-like lines
    heading_pattern = re.compile(
        r'(?=^#{1,4}\s)|'           # Markdown headings
        r'(?=^[A-Z][A-Z\s]{5,}$)|'  # ALL-CAPS lines (6+ chars)
        r'(?=^.+\n[=\-]{3,}$)',      # Underline headings
        re.MULTILINE
    )

    # First try splitting on headings
    sections = heading_pattern.split(text)
    sections = [s.strip() for s in sections if s.strip()]

    # If no headings found, fall back to paragraph splits
    if len(sections) <= 1:
        sections = re.split(r'\n{2,}', text)
        sections = [s.strip() for s in sections if s.strip()]

    return sections


def smart_chunk(
    text: str,
    max_tokens: int = DEFAULT_MAX_TOKENS,
    overlap_sentences: int = DEFAULT_OVERLAP_SENTENCES,
) -> List[str]:
    """
    Semantically chunk a document into pieces optimized for embedding + retrieval.

    Strategy:
    1. Split into sections (headings/paragraphs)
    2. If a section fits within max_tokens, keep it as-is
    3. If a section is too large, split on sentence boundaries with overlap
    4. Merge tiny adjacent sections to avoid too-small chunks

    Args:
        text: Raw document text
        max_tokens: Target max tokens per chunk (~1500 = good for embeddings)
        overlap_sentences: Number of sentences from end of prev chunk to prepend

    Returns:
        List of text chunks, each roughly max_tokens or less
    """
    if not text or not text.strip():
        return []

    max_chars = max_tokens * CHARS_PER_TOKEN
    sections = _split_into_sections(text)

    chunks = []
    current_chunk = ""
    overlap_buffer = []  # Last N sentences from previous chunk

    for section in sections:
        # If adding this section still fits, accumulate
        if len(current_chunk) + len(section) + 1 <= max_chars:
            current_chunk = (current_chunk + "\n\n" + section).strip()
        else:
            # Flush current chunk if non-empty
            if current_chunk and len(current_chunk) >= MIN_CHUNK_CHARS:
                chunks.append(current_chunk)
                # Build overlap from end of this chunk
                sentences = _split_into_sentences(current_chunk)
                overlap_buffer = sentences[-overlap_sentences:] if len(sentences) > overlap_sentences else sentences

            # Start new chunk with overlap context
            overlap_text = " ".join(overlap_buffer) if overlap_buffer else ""

            # If the section itself is too large, split on sentences
            if len(section) > max_chars:
                sub_chunks = _split_large_section(section, max_chars, overlap_sentences)
                if overlap_text and sub_chunks:
                    sub_chunks[0] = (overlap_text + "\n\n" + sub_chunks[0]).strip()
                chunks.extend(sub_chunks)
                # Update overlap from last sub-chunk
                if sub_chunks:
                    sentences = _split_into_sentences(sub_chunks[-1])
                    overlap_buffer = sentences[-overlap_sentences:] if len(sentences) > overlap_sentences else sentences
                current_chunk = ""
            else:
                current_chunk = (overlap_text + "\n\n" + section).strip() if overlap_text else section

    # Flush remaining
    if current_chunk and len(current_chunk) >= MIN_CHUNK_CHARS:
        chunks.append(current_chunk)

    # Merge any too-small trailing chunks
    chunks = _merge_small_chunks(chunks, min_size=MIN_CHUNK_CHARS * 2)

    logger.info(f"Smart chunker: {len(text)} chars -> {len(chunks)} chunks (avg {len(text)//max(len(chunks),1)} chars each)")
    return chunks


def _split_large_section(text: str, max_chars: int, overlap_sentences: int) -> List[str]:
    """Split a single large section on sentence boundaries."""
    sentences = _split_into_sentences(text)
    chunks = []
    current = ""

    for sentence in sentences:
        if len(current) + len(sentence) + 1 <= max_chars:
            current = (current + " " + sentence).strip()
        else:
            if current:
                chunks.append(current)
                # Overlap: carry last N sentences
                prev_sentences = _split_into_sentences(current)
                overlap = " ".join(prev_sentences[-overlap_sentences:]) if len(prev_sentences) > overlap_sentences else ""
                current = (overlap + " " + sentence).strip() if overlap else sentence
            else:
                # Single sentence exceeds max — just include it (rare edge case)
                current = sentence

    if current and len(current) >= MIN_CHUNK_CHARS:
        chunks.append(current)

    return chunks


def _merge_small_chunks(chunks: List[str], min_size: int = 200) -> List[str]:
    """Merge adjacent chunks that are too small to be useful."""
    if not chunks:
        return []

    merged = [chunks[0]]
    for chunk in chunks[1:]:
        if len(merged[-1]) < min_size:
            merged[-1] = merged[-1] + "\n\n" + chunk
        else:
            merged.append(chunk)

    # Check if the last chunk is too small — merge into previous
    if len(merged) > 1 and len(merged[-1]) < min_size:
        merged[-2] = merged[-2] + "\n\n" + merged[-1]
        merged.pop()

    return merged


def chunk_for_condensation(text: str) -> List[str]:
    """
    Convenience wrapper for the data_condensation pipeline.
    Uses larger chunks (2000 tokens) since these go to LLM for fact extraction.
    """
    return smart_chunk(text, max_tokens=2000, overlap_sentences=1)


def chunk_for_embedding(text: str) -> List[str]:
    """
    Convenience wrapper for vector embedding storage.
    Uses smaller chunks (1000 tokens) for precise retrieval.
    """
    return smart_chunk(text, max_tokens=1000, overlap_sentences=2)
