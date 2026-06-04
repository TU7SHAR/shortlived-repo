from sentence_transformers import SentenceTransformer

# This downloads a tiny, high-quality model once and runs locally
model = SentenceTransformer('all-MiniLM-L6-v2')

def get_embedding(text):
    """Fallback for single text queries (like user chat)"""
    return model.encode(text).tolist()

def get_embeddings_batch(texts: list):
    """NEW: Processes hundreds of chunks instantly in parallel"""
    # encode() is highly optimized for lists
    return model.encode(texts).tolist()