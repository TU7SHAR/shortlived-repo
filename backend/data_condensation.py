import json
import logging
import time
from typing import Dict, List, Any, Tuple, Optional
from groq import Groq
import hashlib
from dataclasses import dataclass
from datetime import datetime
from config import model
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import euclidean_distances
import re
import time


try:
    from database import supabase  
    from schema_map import TblFiles  
except ImportError:
    supabase = None
    TblFiles = None

logger = logging.getLogger(__name__)
groq_client = Groq()

@dataclass
class CondensationMetrics:
    """Tracks Phase 2 processing metrics for monitoring."""
    original_size_bytes: int
    condensed_size_bytes: int
    original_chunk_count: int
    condensed_chunk_count: int
    processing_time_seconds: float
    extraction_calls: int
    reduction_calls: int
    embedding_count: int
    
    @property
    def compression_ratio(self) -> float:
        """Calculate compression as percentage reduction."""
        if self.original_size_bytes == 0:
            return 0
        return (1 - self.condensed_size_bytes / self.original_size_bytes) * 100

import time
import random
from concurrent.futures import ThreadPoolExecutor, as_completed

class FactExtractionEngine:
    """Extracts structured facts from text chunks using Groq dynamically for ANY industry."""
    
    GENERALIZED_EXTRACTION_PROMPT = """You are a highly advanced, industry-agnostic Data Extraction AI for a Corporate Sales Assistant.
      CONTEXT: You are extracting data for {context_name}. All products, services, and features described below belong to this specific entity unless explicitly stated otherwise.
      
      Your job is to read the text chunk and extract the core offerings, products, services, or key informational topics into a structured JSON format.
      This system is completely generalized. Adapt dynamically. Extract ANY product, service, or key topic mentioned in the text, regardless of industry.
      {
        "catalog": [
          {
            "product_name": "Name of the product, service, or main topic (e.g., 'Enterprise Pro Plan', 'BMW X1', 'Q3 Revenue')",
            "category": "Classification of the item",
            "summary": "Brief description of the item or topic",
            "features": ["Key detail 1", "Key detail 2"],
            "specifications": {"key": "value", "key2": "value"} 
          }
        ],
        "support_channels": ["Any emails or phone numbers found"],
        "reference_urls": ["Any URLs found"]
      }
      
      RULES:
      1. ONLY return valid JSON. Do not include markdown wrappers like ```json.
      2. If no distinct items/topics are found, return an empty catalog array [].
      3. Keep the JSON strictly formatted so it does not truncate.
      
      TEXT CHUNK:
      {text_chunk}"""

    @staticmethod
    def extract_facts_from_chunk(text_chunk: str, chunk_index: int, context_name: str = "Unknown Context", max_retries: int = 5) -> Optional[Dict[str, Any]]:
        """Processes a chunk through Groq and dynamically reads 429 wait times."""
        prompt = FactExtractionEngine.GENERALIZED_EXTRACTION_PROMPT.replace("{text_chunk}", text_chunk[:8000]).replace("{context_name}", context_name)
        
        for attempt in range(max_retries):
            try:
                time.sleep(2)  # Base delay between chunks to prevent hitting the limit in the first place
                
                completion = groq_client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are a generalized data extraction AI. Output ONLY valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.1,
                    max_tokens=4000, 
                    response_format={"type": "json_object"} 
                )
                
                response_text = completion.choices[0].message.content
                clean_json = response_text.replace("```json", "").replace("```", "").strip()
                return json.loads(clean_json)
                
            except Exception as e:
                error_str = str(e)
                if "429" in error_str or "Too Many Requests" in error_str:
                    # Look for Groq telling us exactly how long to wait (e.g., "in 35.000000 seconds")
                    match = re.search(r'in (\d+\.?\d*) seconds', error_str)
                    if match:
                        sleep_time = float(match.group(1)) + 1.0 # Add 1s buffer
                    else:
                        sleep_time = (2 ** attempt) * 2  # Fallback if we can't find the exact number
                        
                    logger.warning(f"Groq API Limit. Pausing for {sleep_time:.1f} seconds before retrying chunk {chunk_index}...")
                    time.sleep(sleep_time)
                else:
                    logger.error(f"Extraction failed for chunk {chunk_index}: {e}")
                    return None
                    
        logger.error(f"Failed to extract chunk {chunk_index} after {max_retries} attempts.")
        return None

class FactReductionEngine:
    """Merges clustered multi-page website data into a structured catalog."""
    
    REDUCTION_PROMPT = """You are an enterprise data integration specialist. 
Your job is to merge multi-page website crawl extractions into a comprehensive corporate catalog.

FACTS EXTRACTED FROM CRAWLED WEBPAGES:
{facts_json}

Consolidate these into a unified master directory containing EVERY unique product discovered. 
Return ONLY this JSON structure:
{{
  "company_name": "e.g., BMW India or Audi India",
  "category": "Our Product | Competitor | Unrelated",
  "catalog": [
    {{
      "product_name": "Full Model Name (e.g., BMW X3 xDrive20d)",
      "summary": "Brief description of this specific variant.",
      "core_specifications": {{
        "engine": "value",
        "price": "value",
        "emi": "value",
        "fuel_type": "Electric | Petrol | Diesel"
      }},
      "features": ["feature1", "feature2"],
      "competitive_advantages": []
    }}
  ],
  "support_and_training": ["Hotline numbers", "emails"],
  "reference_links": ["All unique crawled URLs extracted from data"]
}}

MERGE RULES:
1. Extract EVERY unique vehicle model/product name found across the text chunks. Do NOT overwrite them or limit the array to 1 item.
2. Group specifications clearly under their respective product dictionary.
3. Keep clean financial numbers (EMIs, Lakhs, Crores) intact.
4. Return ONLY valid JSON, no other text."""

    @staticmethod
    def merge_facts(extracted_facts: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not extracted_facts:
            return None
        
        try:
            facts_json = json.dumps(extracted_facts, indent=2)
            prompt = FactReductionEngine.REDUCTION_PROMPT.format(facts_json=facts_json)
            
            response = groq_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a JSON merging specialist. Return ONLY valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1500,
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # --- ROBUST JSON PARSING ---
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}')
            
            if start_idx != -1 and end_idx != -1:
                clean_json = response_text[start_idx:end_idx+1]
            else:
                clean_json = response_text
            
            card = json.loads(clean_json)
            logger.info(f"Merged {len(extracted_facts)} facts into unified card")
            return card
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse merged card JSON - {e}")
            return None
        except Exception as e:
            logger.error(f"Reduction pipeline failed - {e}")
            return None

# STAGE 3: ASYMMETRIC EMBEDDING GENERATION

class AsymmetricEmbeddingGenerator:
    """Generates human-readable Q&A pairs for vector search."""
    
    @staticmethod
    def generate_embedding_anchors(
        knowledge_card: Dict[str, Any],
        filename: str,
        admin_id: str
    ) -> List[Dict[str, Any]]:
        anchors = []
        try:
            # 1. Generate anchors from the PDF/Website Catalog items
            catalog = knowledge_card.get("catalog", [])
            for item in catalog:
                name = item.get("product_name") or item.get("item_name") or "this product"
                
                # Overview Anchor
                anchors.append({
                    "embedding_text": f"What is {name}? Tell me about {name} from {filename}.",
                    "linked_field": "catalog.product_name",
                    "content_type": "product_overview",
                    "confidence": 0.98
                })
                
                # Features Anchor
                if item.get("features"):
                    anchors.append({
                        "embedding_text": f"What are the features of {name}?",
                        "linked_field": "catalog.features",
                        "content_type": "features",
                        "confidence": 0.95
                    })
                
                # Specifications Anchor
                if item.get("specifications") or item.get("core_specifications"):
                    anchors.append({
                        "embedding_text": f"What are the technical specifications and details of {name}?",
                        "linked_field": "catalog.specifications",
                        "content_type": "specifications",
                        "confidence": 0.94
                    })

            # 2. Support Channels Anchor
            support = knowledge_card.get("support_channels", []) or knowledge_card.get("support_and_training", [])
            if support:
                anchors.append({
                    "embedding_text": f"How do I contact support for {filename}? What are the support channels, emails, or phone numbers?",
                    "linked_field": "support_channels",
                    "content_type": "support",
                    "confidence": 0.91
                })
            
            logger.info(f"Generated {len(anchors)} asymmetric embedding anchors for {filename}")
            return anchors
            
        except Exception as e:
            logger.error(f"Failed to generate embedding anchors: {e}")
            return anchors
        
# MAIN: CONDENSATION PIPELINE

class DataCondensationEngine:
    CHUNK_SIZE = 3000
    CHUNK_OVERLAP = int(CHUNK_SIZE * 0.1)
    
    @staticmethod
    def process_file(
        filename: str,
        raw_content: str,
        admin_id: str,
        uploaded_by_username: str,
        progress_state: dict = None
    ) -> Tuple[Optional[Dict[str, Any]], List[Dict[str, Any]], CondensationMetrics, List[str]]:
        
        def push_log(msg):
            logger.info(msg)
            if progress_state: progress_state["msg"] = msg

        start_time = time.time()
        push_log(f"Starting semantic chunking for {filename}...")
        
        chunks = DataCondensationEngine._chunk_text(raw_content)
        extracted_results = []
        
        push_log(f"Queued {len(chunks)} chunks for AI Extraction...")
        logger.info(f"Extracting {len(chunks)} chunks sequentially to respect API limits...")
        
        for i, chunk in enumerate(chunks):
            push_log(f"AI Engine: Extracting facts from chunk {i+1} of {len(chunks)}...")
            facts_dict = FactExtractionEngine.extract_facts_from_chunk(chunk, i, context_name=filename)
            if facts_dict:
                extracted_results.append(facts_dict)

        master_catalog = []
        global_support_channels = set()
        global_reference_links = set()
        
        for facts_dict in extracted_results:
            try:
                if "catalog" in facts_dict and isinstance(facts_dict["catalog"], list):
                    for item in facts_dict["catalog"]:
                        name = item.get("item_name") or item.get("product_name")
                        if name and str(name).strip() != "null":
                            item["product_name"] = name
                            if "item_name" in item:
                                del item["item_name"]
                            master_catalog.append(item)
                
                if "support_channels" in facts_dict and isinstance(facts_dict["support_channels"], list):
                    for channel in facts_dict["support_channels"]:
                        if channel and str(channel).strip() != "null":
                            global_support_channels.add(str(channel))
                            
                if "reference_urls" in facts_dict and isinstance(facts_dict["reference_urls"], list):
                    for link in facts_dict["reference_urls"]:
                        if link and str(link).strip() != "null":
                            global_reference_links.add(str(link))
            except Exception as e:
                logger.error(f"Failed to stitch JSON: {e}")

        unique_catalog = []
        seen_items = set()
        for item in master_catalog:
            item_name = item.get("product_name")
            if item_name not in seen_items:
                seen_items.add(item_name)
                unique_catalog.append(item)

        knowledge_card = {
            "company_name": filename,
            "category": "Document Condensation",
            "summary": f"Master catalog containing {len(unique_catalog)} unique items/topics extracted from {filename}.",
            "support_channels": list(global_support_channels),
            "reference_links": list(global_reference_links),
            "catalog": unique_catalog
        }

        try:
            logger.info("Generating embedding anchors...")
            embedding_anchors = AsymmetricEmbeddingGenerator.generate_embedding_anchors(
                knowledge_card,
                filename,
                admin_id
            )
        except Exception as e:
            logger.error(f"Anchor generation failed: {e}")
            embedding_anchors = []

        metrics = CondensationMetrics(
            original_size_bytes=len(raw_content.encode('utf-8')),
            condensed_size_bytes=len(json.dumps(knowledge_card).encode('utf-8')),
            original_chunk_count=len(chunks),
            condensed_chunk_count=len(embedding_anchors),
            processing_time_seconds=time.time() - start_time,
            extraction_calls=len(extracted_results),
            reduction_calls=0, 
            embedding_count=len(embedding_anchors)
        )

        logger.info(f"[{admin_id}] Condensation complete: {filename} | {metrics.compression_ratio:.1f}% compression | {metrics.processing_time_seconds:.1f}s")
        return knowledge_card, embedding_anchors, metrics, chunks
   
    @staticmethod
    def rolling_website_condensation(
        url: str,
        page_content: str,
        existing_knowledge_card: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Incrementally condenses a single webpage and merges it with the rolling master card."""
        
        logger.info(f"Running rolling condensation for: {url}")
        
        # 1. Chunk and extract facts from THIS specific page
        chunks = DataCondensationEngine._chunk_text(page_content)
        new_facts = []
        for i, chunk in enumerate(chunks):
            facts = FactExtractionEngine.extract_facts_from_chunk(chunk, i, context_name=url)
            if facts:
                new_facts.append(facts)
        
        if not new_facts:
            return existing_knowledge_card
            
        # 2. Merge this page's facts into a mini-card
        page_card = FactReductionEngine.merge_facts(new_facts)
        
        # 3. If this is the first page, it becomes the master card
        if not existing_knowledge_card:
            return page_card
            
        logger.info(f"Merging {url} into Master Rolling Card...")
        combined_facts = [existing_knowledge_card, page_card]
        updated_master_card = FactReductionEngine.merge_facts(combined_facts)
        
        return updated_master_card

    @staticmethod
    def process_website_clusters(
        website_name: str,
        all_chunks: List[str],
        all_embeddings: List[List[float]],
        admin_id: str,
        uploaded_by_username: str
    ) -> Tuple[Optional[Dict[str, Any]], List[Dict[str, Any]], CondensationMetrics]:
        
        start_time = time.time()
        
        # 1. Cluster the website into thematic pages/blocks
        thematic_blocks = SemanticClusterEngine.cluster_website_data(all_chunks, all_embeddings)
        
        master_catalog = []
        global_support_channels = set()
        global_reference_links = set()
        successful_extractions = 0
        
        logger.info(f"Extracting facts from {len(thematic_blocks)} document/website sections using ThreadPool...")
        
        # --- THREADED EXTRACTION ---
        extracted_results = []
        # Use max_workers=3 or 4 to avoid slamming Groq too hard at once
        with ThreadPoolExecutor(max_workers=4) as executor:
            # Submit all chunks to the thread pool
            future_to_chunk = {
                executor.submit(FactExtractionEngine.extract_facts_from_chunk, block, i, website_name): i 
                for i, block in enumerate(thematic_blocks)
            }
            
            # As threads finish, collect the results
            for future in as_completed(future_to_chunk):
                chunk_index = future_to_chunk[future]
                try:
                    facts_dict = future.result()
                    if facts_dict:
                        extracted_results.append(facts_dict)
                except Exception as e:
                    logger.error(f"Thread failed for chunk {chunk_index}: {e}")
        # ----------------------------

        logger.info("Stitching extracted data...")
        
        # 2. Process the collected results
        for facts_dict in extracted_results:
            try:
                # 1. Safely extract items/topics
                if "catalog" in facts_dict and isinstance(facts_dict["catalog"], list):
                    for item in facts_dict["catalog"]:
                        if item.get("product_name") and str(item.get("product_name")).strip() != "null":
                            master_catalog.append(item)
                
                # 2. Safely extract global company data
                if "support_channels" in facts_dict and isinstance(facts_dict["support_channels"], list):
                    for channel in facts_dict["support_channels"]:
                        if channel and str(channel).strip() != "null":
                            global_support_channels.add(str(channel))
                            
                if "reference_urls" in facts_dict and isinstance(facts_dict["reference_urls"], list):
                    for link in facts_dict["reference_urls"]:
                        if link and str(link).strip() != "null":
                            global_reference_links.add(str(link))
                            
                successful_extractions += 1
            except Exception as e:
                logger.error(f"Failed to stitch JSON: {e}")
        # Deduplicate the catalog dynamically
        unique_catalog = []
        seen_items = set()
        for item in master_catalog:
            item_name = item.get("product_name")
            if item_name not in seen_items:
                seen_items.add(item_name)
                unique_catalog.append(item)
                
        # 3. Create the master card cleanly
        master_knowledge_card = {
            "company_name": website_name,
            "category": "Knowledge Base Data",
            "summary": f"Master catalog containing {len(unique_catalog)} unique items/topics.",
            "support_channels": list(global_support_channels),
            "reference_links": list(global_reference_links),
            "catalog": unique_catalog
        }
        
        # 4. Generate Embedding Anchors for searchability
        try:
            logger.info("Generating embedding anchors...")
            # THE FIX: Correctly call the AsymmetricEmbeddingGenerator
            embedding_anchors = AsymmetricEmbeddingGenerator.generate_embedding_anchors(
                master_knowledge_card, website_name, admin_id
            )
        except Exception as e:
            logger.error(f"Anchor generation failed: {e}")
            embedding_anchors = []

        metrics = CondensationMetrics(
            original_size_bytes=sum(len(c.encode()) for c in all_chunks),
            condensed_size_bytes=len(json.dumps(master_knowledge_card).encode()),
            original_chunk_count=len(all_chunks),
            condensed_chunk_count=len(thematic_blocks),
            processing_time_seconds=time.time() - start_time,
            extraction_calls=len(thematic_blocks),
            reduction_calls=1,
            embedding_count=len(embedding_anchors)
        )
        
        logger.info(f"Python Stitching Complete! Successfully compiled {len(master_catalog)} products into the Master Card.")
        
        return master_knowledge_card, embedding_anchors, metrics   
    
    @staticmethod
    def _chunk_text(text: str, chunk_size: int = CHUNK_SIZE) -> List[str]:
        chunks = []
        overlap = int(chunk_size * 0.1)
        for i in range(0, len(text), chunk_size - overlap):
            chunk = text[i:i + chunk_size]
            if len(chunk) > 100:
                chunks.append(chunk)
        return chunks if chunks else [text]

# DATABASE INTEGRATION

class CondensationDatabaseManager:
    """Handles saving condensed data to Supabase."""
    
    @staticmethod
    def save_condensed_file(
        filename: str,
        knowledge_card: Dict[str, Any],
        embedding_anchors: List[Dict[str, Any]],
        metrics: CondensationMetrics,
        admin_id: str,
        uploaded_by_id: int,
        uploaded_by_username: str,
        category: str = "Product",
        raw_chunks: List[str] = None,
        progress_state: dict = None
    ) -> bool:
        if not supabase:
            logger.warning("Supabase not configured - skipping database save")
            return False
        
        def push_log(msg):
            logger.info(msg)
            if progress_state: progress_state["msg"] = msg

        try:
            file_record = {
                TblFiles.FILENAME: filename,
                TblFiles.CREATED_BY: admin_id,
                TblFiles.UPLOADED_BY_ID: uploaded_by_id,
                TblFiles.CATEGORY: category,
                "vector_text_count": len(embedding_anchors),
                "condensation_status": "completed"
            }
            file_response = supabase.table(TblFiles.TABLE).insert(file_record).execute()
            file_uuid = file_response.data[0]["id"] if file_response.data else None

            if raw_chunks and file_uuid:
                try:
                    from embedder import get_embeddings_batch
                    push_log(f"Generating vector embeddings for {len(raw_chunks)} document chunks...")
                    embeddings = get_embeddings_batch(raw_chunks)
                    
                    push_log("Saving raw text vectors to database...")
                    raw_chunks_data = []
                    for i, chunk_text in enumerate(raw_chunks):
                        chunk_record = {
                            "file_id": file_uuid,
                            "chunk_index": i,
                            "content": chunk_text,
                            "content_hash": hashlib.sha256(chunk_text.encode('utf-8')).hexdigest(),
                            "admin_id": admin_id,
                            "content_type": "text",
                            "relevance_category": "Document Condensation",
                            "embedding": embeddings[i]  
                        }
                        raw_chunks_data.append(chunk_record) # <--- ADD THIS LINE!
                    
                    if raw_chunks_data:
                        # Upload in safe batches and collect inserted IDs
                        batch_size = 100
                        inserted_chunk_ids = []
                        for i in range(0, len(raw_chunks_data), batch_size):
                            batch = raw_chunks_data[i:i+batch_size]
                            res = supabase.table("file_chunks").insert(batch).select("id").execute()
                            if res.data:
                                inserted_chunk_ids.extend([row["id"] for row in res.data])
                    try:
                        logger.info(f"Populating dedicated 'embeddings' table with {len(raw_chunks)} chunk vectors...")
                        embeddings_table_data = []
                        for i, chunk_text in enumerate(raw_chunks):
                            record = {
                                "admin_id": admin_id,
                                "vector": embeddings[i],
                                "embedding_model": "all-MiniLM-L6-v2",
                                "source_text": chunk_text,
                                "embedding_type": "standard"
                            }
                            # Link chunk_id if we have it
                            if i < len(inserted_chunk_ids):
                                record["chunk_id"] = inserted_chunk_ids[i]
                            embeddings_table_data.append(record)
                        
                        for i in range(0, len(embeddings_table_data), 100):
                            batch = embeddings_table_data[i:i+100]
                            supabase.table("embeddings").insert(batch).execute()
                    except Exception as e:
                        logger.error(f"Failed to populate dedicated embeddings table for chunks: {e}")
                    
                    # Update ingested_files with chunk count
                    try:
                        supabase.table("ingested_files").update({
                            "vector_chunk_count": len(raw_chunks_data)
                        }).eq("id", file_uuid).execute()
                    except Exception as e:
                        logger.error(f"Failed to update vector_chunk_count: {e}")
                        
                except Exception as e:
                    logger.error(f"Failed to insert raw chunks: {e}")

            card_record = {
                "file_id": file_uuid,
                "admin_id": admin_id,
                "card_json": knowledge_card,
                "card_size_bytes": metrics.condensed_size_bytes,
                "original_size_bytes": metrics.original_size_bytes,
                "original_chunk_count": metrics.original_chunk_count,
                "condensed_chunk_count": metrics.condensed_chunk_count,
                "processing_time_seconds": metrics.processing_time_seconds,
                "extraction_calls": metrics.extraction_calls,
                "reduction_calls": metrics.reduction_calls,
            }
            card_response = supabase.table("condensed_knowledge_cards").insert(card_record).execute()
            
            card_id = None
            if card_response.data:
                card_id = card_response.data[0].get("id") or card_response.data[0].get("card_id")

            if card_id and file_uuid:
                try:
                    chunks_res = supabase.table("file_chunks").select("id").eq("file_id", file_uuid).execute()
                    if chunks_res.data:
                        chunk_links = []
                        for chunk in chunks_res.data:
                            current_chunk_id = chunk.get("id")
                            if current_chunk_id:
                                chunk_links.append({
                                    "card_id": card_id,
                                    "chunk_id": current_chunk_id
                                })
                        
                        if chunk_links:
                            supabase.table("knowledge_card_chunks").insert(chunk_links).execute()
                            logger.info(f"🔗 Connective Tissue: Successfully linked {len(chunk_links)} raw chunks to Card {card_id}")
                except Exception as e:
                    logger.error(f"❌ Failed to populate knowledge_card_chunks: {e}")

            if embedding_anchors:
                try:
                    from embedder import get_embeddings_batch
                    push_log(f"Generating vector embeddings for {len(embedding_anchors)} asymmetric anchors...")
                    logger.info(f"Generating embeddings for {len(embedding_anchors)} asymmetric anchors...")
                    
                    anchor_texts = [anchor["embedding_text"] for anchor in embedding_anchors]
                    anchor_embeddings = get_embeddings_batch(anchor_texts)
                    
                    push_log("Populating asymmetric anchors into vector database...")
                    chunks_data = []
                    for i, anchor in enumerate(embedding_anchors):
                        chunk_record = {
                            "file_id": file_uuid,
                            "chunk_index": i + (len(raw_chunks) if raw_chunks else 0),
                            "content": anchor["embedding_text"],
                            "content_hash": hashlib.sha256(anchor["embedding_text"].encode('utf-8')).hexdigest(),
                            "admin_id": admin_id,
                            "content_type": anchor["content_type"],
                            "relevance_category": anchor["linked_field"],
                            "embedding": anchor_embeddings[i]  
                        }
                        chunks_data.append(chunk_record) # <--- ADD THIS LINE!
                    
                    if chunks_data:
                        anchor_chunks_res = supabase.table("file_chunks").insert(chunks_data).select("id").execute()
                        inserted_anchor_chunk_ids = [row["id"] for row in anchor_chunks_res.data] if anchor_chunks_res.data else []
                        logger.info("Successfully saved asymmetric anchors to file_chunks.")
                    else:
                        inserted_anchor_chunk_ids = []
                    # ---> NEW: POPULATE DEDICATED EMBEDDINGS TABLE FOR ANCHORS <---
                    try:
                        logger.info(f"Populating dedicated 'embeddings' table with {len(embedding_anchors)} anchor vectors...")
                        anchor_embeddings_table_data = []
                        for i, anchor in enumerate(embedding_anchors):
                            record = {
                                "admin_id": admin_id,
                                "vector": anchor_embeddings[i],
                                "embedding_model": "all-MiniLM-L6-v2",
                                "source_text": filename,
                                "anchor_text": anchor["embedding_text"],
                                "embedding_type": "asymmetric",
                                "is_primary": True
                            }
                            # Link chunk_id if we have it
                            if i < len(inserted_anchor_chunk_ids):
                                record["chunk_id"] = inserted_anchor_chunk_ids[i]
                            anchor_embeddings_table_data.append(record)
                            
                        for i in range(0, len(anchor_embeddings_table_data), 100):
                            batch = anchor_embeddings_table_data[i:i+100]
                            supabase.table("embeddings").insert(batch).execute()
                    except Exception as e:
                        logger.error(f"Failed to populate dedicated embeddings table for anchors: {e}")
                except Exception as e:
                    logger.error(f"Failed to save anchor chunks: {e}")
            
            # STEP 4: Save to asymmetric_anchors table so the Admin Dashboard can see them
            if embedding_anchors and card_id:
                try:
                    anchors_data = []
                    for anchor in embedding_anchors:
                        anchor_record = {
                            "card_id": card_id, 
                            "query_anchor": anchor["embedding_text"], 
                            "document_anchor": anchor.get("linked_field", "unknown"), 
                            "relevance_score": anchor.get("confidence", 0.9), 
                            "admin_id": admin_id, 
                            "created_at": datetime.now().isoformat()
                        }
                        anchors_data.append(anchor_record)
                    if anchors_data:
                        supabase.table("asymmetric_anchors").insert(anchors_data).execute()
                        logger.info("Successfully populated asymmetric_anchors table.")
                except Exception as e:
                    logger.error(f"Failed to save asymmetric anchors to logging table: {e}")

            try:
                metrics_records = [
                    {"admin_id": admin_id, "file_id": file_uuid, "metric_type": "compression_ratio", "metric_value": float(metrics.compression_ratio), "measured_at": datetime.now().isoformat()},
                    {"admin_id": admin_id, "file_id": file_uuid, "metric_type": "processing_time_seconds", "metric_value": float(metrics.processing_time_seconds), "measured_at": datetime.now().isoformat()}
                ]
                supabase.table("condensation_metrics").insert(metrics_records).execute()
            except Exception as e:
                logger.error(f"Failed to save condensation metrics: {e}")
            
            try:
                log_record = {
                    "file_id": file_uuid,
                    "admin_id": admin_id,
                    "stage": "VALIDATION",
                    "status": "completed",
                    "duration_seconds": metrics.processing_time_seconds,
                    "tokens_used": metrics.extraction_calls * 4000,  # estimate ~4000 tokens per extraction call
                    "error_message": "Success",
                    "started_at": datetime.now().isoformat(),
                    "completed_at": datetime.now().isoformat()
                }
                supabase.table("condensation_logs").insert(log_record).execute()
            except Exception as e:
                logger.error(f"Failed to save condensation log: {e}")
            
            # Update ingested_files with completion timestamp
            try:
                supabase.table("ingested_files").update({
                    "condensation_completed_at": datetime.now().isoformat()
                }).eq("id", file_uuid).execute()
            except Exception as e:
                logger.error(f"Failed to update condensation_completed_at: {e}")
            
            return True
            
        except Exception as e:
            logger.error(f"Database save failed: {e}")
            return False

# Sementic Clustering
class SemanticClusterEngine:
    @staticmethod
    def cluster_website_data(
        all_chunks: List[str], 
        all_embeddings: List[List[float]], 
        num_clusters: int = 8
    ) -> List[str]:
        logger.info(f"Starting Semantic Clustering on {len(all_chunks)} chunks...")
        
        X = np.array(all_embeddings)
        n_clusters = min(num_clusters, len(all_chunks))
        
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init='auto')
        kmeans.fit(X)
        
        condensed_cluster_texts = []
        
        for i in range(n_clusters):
            cluster_indices = np.where(kmeans.labels_ == i)[0]
            
            valid_indices = [idx for idx in cluster_indices if len(all_chunks[idx].strip()) > 100]
            if not valid_indices:
                continue
                
            valid_embeddings = X[valid_indices]
            distances = euclidean_distances(valid_embeddings, [kmeans.cluster_centers_[i]])
            
            closest_local_indices = np.argsort(distances[:, 0])
            
            top_chunks = []
            for local_idx in closest_local_indices[:4]:
                original_idx = valid_indices[local_idx]
                top_chunks.append(all_chunks[original_idx])
                
            condensed_cluster_texts.append("\n...\n".join(top_chunks))
            
        logger.info(f"Reduced {len(all_chunks)} noisy chunks down to {len(condensed_cluster_texts)} dense thematic blocks.")
        return condensed_cluster_texts

# PUBLIC API

async def ingest_file_condensed(
    filename: str,
    file_content: str,
    admin_id: str,
    uploaded_by_id: int,
    uploaded_by_username: str,
    progress_state: dict = None,
    category: str = "Product"
) -> Tuple[bool, Optional[CondensationMetrics]]:
    logger.info(f"Starting condensed ingestion for {filename}")
    
    knowledge_card, embedding_anchors, metrics, raw_chunks = DataCondensationEngine.process_file(
        filename,
        file_content,
        admin_id,
        uploaded_by_username, progress_state
    )
    
    if not knowledge_card:
        logger.error(f"Condensation failed for {filename}")
        return False, None
    
    success = CondensationDatabaseManager.save_condensed_file(
        filename=filename,
        knowledge_card=knowledge_card,
        embedding_anchors=embedding_anchors,
        metrics=metrics,
        admin_id=admin_id,
        uploaded_by_id=uploaded_by_id,
        uploaded_by_username=uploaded_by_username,
        category=category,
        raw_chunks=raw_chunks,
        progress_state=progress_state
    )
    
    return success, metrics