import os
import io
import re
import tempfile
import asyncio
import requests
import hashlib
import xml.etree.ElementTree as ET
from markitdown import MarkItDown
from firecrawl import Firecrawl
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
from config import FIRECRAWL_API_KEY
from datetime import datetime
import logging

# Updated Phase 2 Imports
from database import supabase
from embedder import get_embedding, get_embeddings_batch

logger = logging.getLogger(__name__)

md_converter = MarkItDown()
MAX_WORDS = 3000000


def clean_garbage_text(raw_html_or_text: str) -> str:
    """Aggressively strips navigation menus, footers, and code from raw scrapes."""
    soup = BeautifulSoup(raw_html_or_text, 'html.parser')

    # 1. NUKE ALL BOILERPLATE TAGS
    tags_to_destroy = [
        "script", "style", "nav", "footer", "header", 
        "aside", "noscript", "meta", "svg", "path", "button"
    ]
    for element in soup(tags_to_destroy):
        element.decompose()

    # 2. Extract remaining text
    text = soup.get_text(separator='\n')

    # 3. Clean up massive blank spaces and stray URLs
    cleaned_lines = []
    for line in text.splitlines():
        line = line.strip()
        # Skip empty lines, pure numbers (like timestamps), and raw image URLs
        if not line:
            continue
        if line.isdigit() and len(line) > 5: # Catches things like "1755772871382"
            continue
        if "http" in line and (".jpg" in line or ".png" in line or "webp" in line):
            continue
            
        cleaned_lines.append(line)

    return '\n'.join(cleaned_lines)

def create_content_hash(text: str) -> str:
    """Create SHA256 hash of content for deduplication"""
    return hashlib.sha256(text.encode()).hexdigest()

def detect_content_type(text: str) -> str:
    """Detect content type based on content characteristics"""
    if any(x in text.lower() for x in ['price', 'cost', 'rupees', 'rs', '₹', 'discount']):
        return 'pricing'
    elif any(x in text.lower() for x in ['feature', 'specification', 'spec', 'tech', 'technical']):
        return 'specification'
    elif any(x in text.lower() for x in ['review', 'rating', 'testimonial', 'feedback']):
        return 'review'
    elif any(x in text.lower() for x in ['offer', 'deal', 'promo', 'limited']):
        return 'promotion'
    else:
        return 'general'

def detect_relevance_category(filename: str, text: str) -> str:
    """Detect relevance category for content"""
    text_lower = text.lower()
    filename_lower = filename.lower()
    
    if any(x in filename_lower for x in ['price', 'cost', 'pricing']):
        return 'pricing'
    elif any(x in filename_lower for x in ['product', 'model', 'car', 'bmw', 'audi']):
        return 'products'
    elif any(x in filename_lower for x in ['feature', 'spec']):
        return 'features'
    elif any(x in text_lower for x in ['price', 'cost', 'rupees', '₹']):
        return 'pricing'
    elif any(x in text_lower for x in ['model', 'variant', 'option', 'configuration']):
        return 'products'
    else:
        return 'general'

def save_to_vector_db_complete(
    filename: str, 
    text: str, 
    admin_id: str = None,
    file_id: str = None,
    category: str = "Web Content"
) -> tuple:
    """
    Returns: (success: bool, deduped_chunks: list, deduped_vectors: list)
    """
    try:
        raw_chunks = text.split("\n\n")
        chunks = [chunk.strip() for chunk in raw_chunks if len(chunk.strip()) > 10]
        
        if not chunks:
            return False, [], []
        
        vectors = get_embeddings_batch(chunks)
        
        data_to_insert = []
        seen_hashes = set()
        valid_chunk_count = 0
        
        deduped_chunks = []
        deduped_vectors = []
        
        for chunk_idx, (chunk, vector) in enumerate(zip(chunks, vectors)):
            content_hash = create_content_hash(chunk)
            if content_hash in seen_hashes:
                continue
            
            seen_hashes.add(content_hash)
            deduped_chunks.append(chunk)
            deduped_vectors.append(vector)
            
            record = {
                "file_name": filename,
                "content": chunk,
                "embedding": vector,
                "chunk_index": valid_chunk_count,
                "content_hash": content_hash,
                "admin_id": admin_id or "unknown",
                "content_type": detect_content_type(chunk),
                "relevance_category": detect_relevance_category(filename, chunk),
                "chunk_size_bytes": len(chunk.encode('utf-8')),
                "file_id": file_id,
            }
            data_to_insert.append(record)
            valid_chunk_count += 1
        
        if not data_to_insert:
            return False, [], []
        
        supabase.table("file_chunks").insert(data_to_insert).execute()
        return True, deduped_chunks, deduped_vectors
        
    except Exception as e:
        logger.error(f"❌ Error saving to vector DB: {e}")
        return False, [], []

def save_to_vector_db(filename: str, text: str) -> bool:
    """Backward compatible wrapper"""
    success, _, _ = save_to_vector_db_complete(filename, text)
    return success

def init_firecrawl():
    """Initialize Firecrawl client"""
    if not FIRECRAWL_API_KEY:
        raise ValueError("FIRECRAWL_API_KEY is missing.")
    return Firecrawl(api_key=FIRECRAWL_API_KEY)

def clean_and_truncate(text):
    """Clean and truncate text to MAX_WORDS"""
    words = text.split()
    total_chars = len(text)
    if len(words) > MAX_WORDS:
        truncated_text = " ".join(words[:MAX_WORDS])
        processed_chars = len(truncated_text)
        unprocessed_chars = total_chars - processed_chars
        return truncated_text, True, processed_chars, unprocessed_chars
    return text, False, total_chars, 0

async def extract_content(file_bytes, filename):
    """Extract content from uploaded file"""
    fd, tmp_path = tempfile.mkstemp(suffix=f"_{filename}")
    try:
        with os.fdopen(fd, 'wb') as tmp:
            tmp.write(file_bytes)
        result = await asyncio.to_thread(md_converter.convert, tmp_path)
        content, is_truncated, processed, unprocessed = clean_and_truncate(result.text_content)
        return content, is_truncated, processed, unprocessed
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def create_downloadable_buffer(content, filename):
    """Create downloadable buffer from content"""
    buffer = io.BytesIO(content.encode('utf-8'))
    buffer.name = filename
    return buffer

def scrape_single_url(url: str, admin_id: str = None) -> dict:
    """Scrape single URL and save to database safely handling all Firecrawl versions."""
    try:
        app = init_firecrawl()
        
        try:
            # Modern Firecrawl SDK syntax (using a params dictionary)
            result = app.scrape(
                url, 
                params={
                    'formats': ['markdown'],
                    'onlyMainContent': True,
                    'waitFor': 3000 
                }
            )
        except TypeError:
            # YOUR Firecrawl SDK syntax (using snake_case direct arguments)
            result = app.scrape(
                url, 
                formats=['markdown'],
                only_main_content=True
            )
        
        # Safely extract data whether Firecrawl returned a Dictionary or an Object
        if isinstance(result, dict):
            markdown_content = result.get('markdown')
            title = result.get('metadata', {}).get('title', 'Scraped Page')
        else:
            markdown_content = getattr(result, 'markdown', None)
            metadata = getattr(result, 'metadata', None)
            title = getattr(metadata, 'title', 'Scraped Page') if metadata else 'Scraped Page'
        
        if markdown_content:
            content, truncated, processed, unprocessed = clean_and_truncate(markdown_content)
            filename = f"{title.replace(' ', '_')}_{hashlib.md5(url.encode()).hexdigest()[:6]}.md"
            
            success, _, _ = save_to_vector_db_complete(
                filename=filename,
                text=content,
                admin_id=admin_id,
                category="Web Scrape"
            )
            
            return {
                "success": success,
                "title": title,
                "url": url,
                "content": content,
                "truncated": truncated,
                "processed_chars": processed,
                "unprocessed_chars": unprocessed,
                "chunks_saved": len([c for c in content.split("\n\n") if len(c.strip()) > 10]) if success else 0
            }
        else:
            return {"success": False, "url": url, "error": "No markdown content found"}
    
    except Exception as e:
        logger.error(f"Scrape error for {url}: {e}")
        return {"success": False, "url": url, "error": str(e)}

def crawl_website_links(start_url, max_pages=20, admin_id: str = None, telegram_id: int = 0, username: str = "unknown") -> dict:
    visited = set()
    queue = [start_url]
    found_urls = []
    domain = urlparse(start_url).netloc
    results = []
    total_chunks = 0
    
    all_scraped_chunks = []
    all_scraped_embeddings = []
    
    logger.info(f"Starting website crawl from {start_url} (max {max_pages} pages)...")
    app = init_firecrawl()
    
    while queue and len(found_urls) < max_pages:
        current_url = queue.pop(0)
        if current_url in visited:
            continue
        visited.add(current_url)
        
        try:
            logger.info(f"Crawling (with JS rendering) {current_url}...")
            
            try:
                # Modern Firecrawl SDK syntax
                scrape_result = app.scrape(
                    current_url, 
                    params={
                        'formats': ['markdown', 'links'],
                        'onlyMainContent': True,
                        'waitFor': 3000
                    }
                )
            except TypeError:
                # YOUR Firecrawl SDK syntax (using snake_case direct arguments)
                scrape_result = app.scrape(
                    current_url, 
                    formats=['markdown', 'links'],
                    only_main_content=True
                )
            
            # Safely extract data whether Firecrawl returned a Dictionary or an Object
            if isinstance(scrape_result, dict):
                markdown_content = scrape_result.get('markdown')
                title = scrape_result.get('metadata', {}).get('title', f"Page_{len(found_urls)}")
                links = scrape_result.get('links', [])
            else:
                markdown_content = getattr(scrape_result, 'markdown', None)
                metadata = getattr(scrape_result, 'metadata', None)
                title = getattr(metadata, 'title', f"Page_{len(found_urls)}") if metadata else f"Page_{len(found_urls)}"
                links = getattr(scrape_result, 'links', [])
                
            if not markdown_content or len(markdown_content) < 50:
                logger.warning(f"Page {current_url} returned almost no text, skipping.")
                continue
                
            found_urls.append(current_url)
            
            filename = f"{title.replace(' ', '_')[:50]}_{hashlib.md5(current_url.encode()).hexdigest()[:6]}.md"
            
            success, page_chunks, page_vectors = save_to_vector_db_complete(
                filename=filename,
                text=markdown_content,
                admin_id=admin_id,
                category="Web Crawl"
            )
            
            if success:
                chunk_count = len(page_chunks)
                total_chunks += chunk_count
                all_scraped_chunks.extend(page_chunks)
                all_scraped_embeddings.extend(page_vectors)
                results.append({"url": current_url, "title": title, "success": True, "chunks": chunk_count})
            
            # Safely handle extracting links for the next queue
            for link in links:
                link_url = link.get('href') if isinstance(link, dict) else link
                if not isinstance(link_url, str):
                    continue
                    
                full_url = urljoin(current_url, link_url).split('?')[0]
                if (urlparse(full_url).netloc == domain and 
                    full_url not in visited and 
                    full_url not in queue and
                    not full_url.lower().endswith(('.pdf', '.jpg', '.png', '.xml', '.zip', '.css', '.js'))):
                    queue.append(full_url)
        
        except Exception as e:
            logger.error(f"Error crawling {current_url}: {e}")
            continue
            
    if all_scraped_chunks:
        try:
            from data_condensation import DataCondensationEngine, CondensationDatabaseManager
            logger.info("Executing Semantic Clustering Condensation on all crawled pages...")
            
            knowledge_card, anchors, metrics = DataCondensationEngine.process_website_clusters(
                website_name=f"Website_Crawl_{domain}",
                all_chunks=all_scraped_chunks,
                all_embeddings=all_scraped_embeddings,
                admin_id=admin_id,
                uploaded_by_username=username
            )
            
            if knowledge_card:
                CondensationDatabaseManager.save_condensed_file(
                    filename=f"Website_Crawl_{domain}.md",
                    knowledge_card=knowledge_card,
                    embedding_anchors=anchors,
                    metrics=metrics,
                    admin_id=admin_id,
                    uploaded_by_id=telegram_id,
                    uploaded_by_username=username,
                    category="Website"
                )
        except Exception as e:
            logger.error(f"Failed to condense website clusters: {e}")
            
    logger.info(f"Crawl complete: {len(found_urls)} pages, {total_chunks} chunks saved")
    return {"success": True, "urls_crawled": len(found_urls), "urls": found_urls, "chunks_saved": total_chunks, "results": results}

def extract_sitemap_urls(sitemap_url, max_urls=10) -> dict:
    """Extract URLs from XML sitemap"""
    BAD_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.mp4', '.zip')
    
    def _fetch_urls(url, visited, current_list):
        if url in visited or len(current_list) >= max_urls:
            return
        visited.add(url)
        try:
            headers = {'User-Agent': 'Mozilla/5.0'}
            resp = requests.get(url, headers=headers, timeout=10)
            if resp.status_code != 200:
                return
            root = ET.fromstring(resp.content)
            for elem in root.iter():
                if len(current_list) >= max_urls:
                    break
                if 'loc' in elem.tag and elem.text:
                    loc = elem.text.strip()
                    clean_loc = loc.split('?')[0].lower()
                    if clean_loc.endswith('.xml'):
                        _fetch_urls(loc, visited, current_list)
                    elif not clean_loc.endswith(BAD_EXTENSIONS) and loc not in current_list:
                        current_list.append(loc)
        except Exception as e:
            logger.debug(f"Sitemap fetch error: {e}")
    
    try:
        final_urls = []
        _fetch_urls(sitemap_url, set(), final_urls)
        return {"success": True, "urls": final_urls}
    except Exception as e:
        logger.error(f"Sitemap extraction error: {e}")
        return {"success": False, "error": str(e)}


    visited = set()
    queue = [start_url]
    found_urls = []
    domain = urlparse(start_url).netloc
    results = []
    total_chunks = 0
    
    all_scraped_chunks = []
    all_scraped_embeddings = []
    
    logger.info(f"Starting website crawl from {start_url} (max {max_pages} pages)...")
    
    # Initialize Firecrawl ONCE for the whole spider process
    app = init_firecrawl()
    
    while queue and len(found_urls) < max_pages:
        current_url = queue.pop(0)
        if current_url in visited:
            continue
        visited.add(current_url)
        
        try:
            logger.info(f"Crawling (with JS rendering) {current_url}...")
            
            # THE FIX: Use Firecrawl instead of requests.get()
            scrape_result = app.scrape_url(
                current_url, 
                params={
                    'formats': ['markdown', 'links'],
                    'only_main_content': True,
                    'waitFor': 3000
                }
            )
            
            if not scrape_result or not scrape_result.get('markdown'):
                logger.warning(f"Failed to extract text from {current_url}")
                continue
                
            found_urls.append(current_url)
            
            title = scrape_result.get('metadata', {}).get('title', f"Page_{len(found_urls)}")
            markdown_content = scrape_result.get('markdown')
            
            filename = f"{title.replace(' ', '_')[:50]}_{hashlib.md5(current_url.encode()).hexdigest()[:6]}.md"
            
            success, page_chunks, page_vectors = save_to_vector_db_complete(
                filename=filename,
                text=markdown_content,
                admin_id=admin_id,
                category="Web Crawl"
            )
            
            if success:
                chunk_count = len(page_chunks)
                total_chunks += chunk_count
                all_scraped_chunks.extend(page_chunks)
                all_scraped_embeddings.extend(page_vectors)
                
                results.append({"url": current_url, "title": title, "success": True, "chunks": chunk_count})
            
            # Extract links for next queue
            links = scrape_result.get('links', [])
            for link in links:
                full_url = urljoin(current_url, link).split('?')[0]
                if (urlparse(full_url).netloc == domain and 
                    full_url not in visited and 
                    full_url not in queue and
                    not full_url.lower().endswith(('.pdf', '.jpg', '.png', '.xml', '.zip', '.css', '.js'))):
                    queue.append(full_url)
        
        except Exception as e:
            logger.error(f"Error crawling {current_url}: {e}")
            continue
            
    if all_scraped_chunks:
        try:
            from data_condensation import DataCondensationEngine, CondensationDatabaseManager
            logger.info("Executing Semantic Clustering Condensation on all crawled pages...")
            
            knowledge_card, anchors, metrics = DataCondensationEngine.process_website_clusters(
                website_name=f"Website_Crawl_{domain}",
                all_chunks=all_scraped_chunks,
                all_embeddings=all_scraped_embeddings,
                admin_id=admin_id,
                uploaded_by_username=username
            )
            
            if knowledge_card:
                CondensationDatabaseManager.save_condensed_file(
                    filename=f"Website_Crawl_{domain}.md",
                    knowledge_card=knowledge_card,
                    embedding_anchors=anchors,
                    metrics=metrics,
                    admin_id=admin_id,
                    uploaded_by_id=telegram_id,
                    uploaded_by_username=username,
                    category="Website"
                )
        except Exception as e:
            logger.error(f"Failed to condense website clusters: {e}")
            
    logger.info(f"Crawl complete: {len(found_urls)} pages, {total_chunks} chunks saved")
    return {"success": True, "urls_crawled": len(found_urls), "urls": found_urls, "chunks_saved": total_chunks, "results": results}
