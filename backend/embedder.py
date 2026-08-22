"""
Gemini Embeddings — replaces local fastembed (CPU-heavy, 90MB model download).

Uses Google's gemini-embedding-001 via the Gemini API:
- API-based: no local model, no ONNX, no torch, no CPU load
- output_dimensionality=384 to match existing pgvector schema (vector(384))
- task_type optimization: RETRIEVAL_QUERY for searches, RETRIEVAL_DOCUMENT for indexing
- Batch support: up to 100 texts per API call

Public API is unchanged (drop-in replacement):
    get_embedding(text)         -> list[float]   (single, 384-dim)
    get_embeddings_batch(texts) -> list[list[float]] (batch, 384-dim each)
"""

import logging
from config import GEMINI_API_KEY

logger = logging.getLogger(__name__)

_client = None
_genai = None

# Match existing DB schema: file_chunks.embedding vector(384), embeddings.vector vector(384)
EMBEDDING_DIM = 384
EMBEDDING_MODEL = "gemini-embedding-001"


def _get_client():
    """Lazy-init the Gemini client."""
    global _client, _genai
    if _client is None:
        if not GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY not configured in .env")
        from google import genai
        _genai = genai
        _client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info(f"Gemini embedding client initialized ({EMBEDDING_MODEL}, dim={EMBEDDING_DIM})")
    return _client


def get_embedding(text: str, task_type: str = "RETRIEVAL_QUERY") -> list:
    """
    Single-text embedding (e.g. user chat query).
    Returns a 384-dim list[float].

    task_type options:
      - RETRIEVAL_QUERY: for search queries (default for chat)
      - RETRIEVAL_DOCUMENT: for indexing documents
      - QUESTION_ANSWERING: for Q&A queries
      - CLASSIFICATION: for classification tasks
    """
    if not text or not text.strip():
        return []

    client = _get_client()
    try:
        result = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=text,
            config=_genai.types.EmbedContentConfig(
                task_type=task_type,
                output_dimensionality=EMBEDDING_DIM,
            ),
        )
        if result.embeddings:
            return list(result.embeddings[0].values)
        return []
    except Exception as e:
        logger.error(f"Gemini embedding failed: {e}")
        return []


def get_embeddings_batch(texts: list, task_type: str = "RETRIEVAL_DOCUMENT") -> list:
    """
    Batch embedding for many chunks at once.
    Returns list of 384-dim list[float].

    Uses RETRIEVAL_DOCUMENT by default (for indexing uploaded files).
    Gemini supports up to 100 texts per batch call.
    """
    if not texts:
        return []

    client = _get_client()
    all_embeddings = []

    # Process in batches of 100 (Gemini's limit per call)
    BATCH_SIZE = 100
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i + BATCH_SIZE]
        try:
            # Each text needs to be in its own Content object for individual embeddings
            results = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=batch,
                config=_genai.types.EmbedContentConfig(
                    task_type=task_type,
                    output_dimensionality=EMBEDDING_DIM,
                ),
            )
            for emb in results.embeddings:
                all_embeddings.append(list(emb.values))
        except Exception as e:
            logger.error(f"Gemini batch embedding failed (batch {i//BATCH_SIZE}): {e}")
            # Fill with empty vectors for this failed batch so indexes stay aligned
            all_embeddings.extend([] for _ in batch)

    return all_embeddings
