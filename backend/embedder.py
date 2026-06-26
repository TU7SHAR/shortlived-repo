"""
Lightweight local embeddings using fastembed (ONNX runtime).

Why fastembed instead of sentence-transformers:
- sentence-transformers pulls in torch (~1.5GB) + transformers (~500MB),
  which fails to install / OOMs on a low-spec ($4) server.
- fastembed runs the SAME model (all-MiniLM-L6-v2) via onnxruntime (~150MB total)
  and produces the SAME 384-dimensional vectors, so the Supabase vector(384)
  schema and all existing embeddings remain valid. No DB migration needed.

Public API is unchanged:
    get_embedding(text)        -> list[float]   (single)
    get_embeddings_batch(texts)-> list[list[float]] (batch)
"""

import logging
from fastembed import TextEmbedding

logger = logging.getLogger(__name__)

# all-MiniLM-L6-v2 → 384 dims. Model is downloaded once (~90MB) and cached on disk.
_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

_model = None


def _get_model() -> TextEmbedding:
    """Lazy-load the model so import is cheap and startup stays fast."""
    global _model
    if _model is None:
        logger.info(f"Loading fastembed model: {_MODEL_NAME}")
        _model = TextEmbedding(model_name=_MODEL_NAME)
    return _model


def get_embedding(text: str):
    """Single-text embedding (e.g. user chat query). Returns a 384-dim list[float]."""
    model = _get_model()
    # .embed() returns a generator of numpy arrays
    vector = next(iter(model.embed([text])))
    return vector.tolist()


def get_embeddings_batch(texts: list):
    """Batch embedding for many chunks at once. Returns list of 384-dim list[float]."""
    model = _get_model()
    return [vector.tolist() for vector in model.embed(texts)]
