"""
CONSTRAINT EXTRACTOR - Production Grade

Identifies and isolates critical, non-negotiable user constraints.
These are NEVER compressed, NEVER summarized, ALWAYS injected into LLM context.

Key insight: Some information is TOO IMPORTANT to lose to compression.
This module identifies, protects, and validates it.

Author: Architecture Team
Date: 2025
"""

import json
import logging
import re
from typing import Dict, List, Tuple, Optional
from groq import Groq

logger = logging.getLogger(__name__)
groq_client = Groq()


class ConstraintExtractor:
    """
    Extracts and maintains immutable constraints from conversations.
    
    Uses a two-stage process:
    1. Fast regex-based pattern matching (for exact numbers, explicit statements)
    2. LLM-assisted extraction (for ambiguous or semantic constraints)
    
    Confidence levels:
    - "high": Pattern-based extraction (regex matched, very reliable)
    - "medium": LLM-assisted extraction (semantic, but needs review)
    """
    
    # Define constraint categories and their regex patterns
    CONSTRAINT_PATTERNS = {
        "budget": [
            r"budget[:\s]+\$?[\d,]+(?:k|K)?",
            r"budget is\s+\$?[\d,]+",
            r"price limit[:\s]+\$?[\d,]+",
            r"can spend[:\s]+\$?[\d,]+",
            r"maximum[:\s]+\$?[\d,]+",
            r"won't spend more than\s+\$?[\d,]+",
            r"strict budget of\s+\$?[\d,]+",
        ],
        "timeline": [
            r"(deadline|due|by|before)[:\s]+(?:the\s+)?(?:end\s+)?(?:of\s+)?(\w+\s+\d+|\d{1,2}/\d{1,2}/\d{4}|next\s+\w+|this\s+\w+)",
            r"(timeline|timeframe|duration)[:\s]+(\d+\s+(?:days?|weeks?|months?|quarters?))",
            r"(Q[1-4]\s+\d{4}|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}",
            r"need[s]? (?:it|this)\s+(?:by|before|within)\s+(\w+\s+\d+)",
        ],
        "must_have": [
            r"must\s+(?:have|include|support|integrate)[:\s]+([^\.;,]+)",
            r"require[ds]?[:\s]+([^\.;,]+)",
            r"(?:need|need to|should have)\s+(?:have|include|support)[:\s]+([^\.;,]+)",
            r"critical[:\s]+([^\.;,]+)",
            r"essential feature[:\s]+([^\.;,]+)",
        ],
        "deal_breaker": [
            r"cannot[:\s]+([^\.;,]+)",
            r"won't[:\s]+([^\.;,]+)",
            r"no[:\s]+([^\.;,]+)",
            r"never[:\s]+([^\.;,]+)",
            r"exclude[:\s]+([^\.;,]+)",
            r"not compatible with[:\s]+([^\.;,]+)",
            r"not available (?:on|in)[:\s]+([^\.;,]+)",
        ],
        "user_role": [
            r"(?:i'm|i am|i'm a|im)\s+([\w\s]+)\s+(?:at|in|for)",
            r"(?:title|position|role)[:\s]+([^\.;,]+)",
            r"\b(VP|CEO|CFO|CTO|Manager|Director|Sales\s+(?:Rep|Executive|Manager)|Account\s+Executive|Sales\s+Leader|Team\s+Lead)\b",
        ]
    }
    
    @staticmethod
    def extract_constraints_from_text(
        text: str,
        telegram_id: int,
        use_llm_fallback: bool = True
    ) -> Dict[str, List[Dict]]:
        """
        Extracts structured constraints from raw user text.
        
        Two-stage extraction:
        Stage 1: Fast pattern-based extraction (regex)
        Stage 2: LLM-assisted for ambiguous/semantic constraints (if enabled)
        
        Args:
            text: Raw user message
            telegram_id: User's Telegram ID (for logging)
            use_llm_fallback: Whether to use LLM for uncertain categories
            
        Returns:
            Dictionary of extracted constraints
            {
                "budget": [{"value": "$30,000", "confidence": "high", "extraction_method": "regex"}],
                ...
            }
        """
        
        constraints = {}
        
        try:
            logger.debug(f"[{telegram_id}] Starting constraint extraction from {len(text)} char text")
            
            # ===== STAGE 1: Pattern-based extraction (FAST) =====
            for category, patterns in ConstraintExtractor.CONSTRAINT_PATTERNS.items():
                for pattern in patterns:
                    try:
                        matches = re.finditer(pattern, text, re.IGNORECASE)
                        
                        for match in matches:
                            # Extract the captured group (usually group 1) or the full match
                            if match.lastindex and match.lastindex >= 1:
                                extracted = match.group(match.lastindex)
                            else:
                                extracted = match.group(0)
                            
                            extracted = extracted.strip()
                            
                            if not extracted or len(extracted) < 2:
                                continue
                            
                            if category not in constraints:
                                constraints[category] = []
                            
                            # Check for duplicates
                            existing_values = [c.get("value", "") for c in constraints[category]]
                            if extracted not in existing_values:
                                constraints[category].append({
                                    "value": extracted,
                                    "confidence": "high",
                                    "extraction_method": "regex",
                                    "pattern_matched": pattern[:50]  # For debugging
                                })
                    
                    except Exception as e:
                        logger.debug(f"[{telegram_id}] Pattern {pattern[:40]} failed: {e}")
                        continue
            
            logger.info(f"[{telegram_id}] Stage 1 (regex) found: {list(constraints.keys())}")
            
            # ===== STAGE 2: LLM-assisted extraction (for unmatched categories) =====
            if use_llm_fallback and len(text.split()) > 20:
                missing_categories = [cat for cat in self.CONSTRAINT_PATTERNS.keys() if cat not in constraints]
                
                if missing_categories:
                    logger.debug(f"[{telegram_id}] Running LLM extraction for: {missing_categories}")
                    
                    llm_constraints = ConstraintExtractor._llm_constraint_extraction(
                        text,
                        telegram_id,
                        categories=missing_categories
                    )
                    
                    # Merge LLM results
                    for category, values in llm_constraints.items():
                        if category not in constraints:
                            constraints[category] = []
                        constraints[category].extend(values)
            
            logger.info(
                f"[{telegram_id}] Constraint extraction complete. "
                f"Categories: {list(constraints.keys())}, "
                f"Total constraints: {sum(len(v) for v in constraints.values())}"
            )
            
            return constraints
        
        except Exception as e:
            logger.error(f"[{telegram_id}] Constraint extraction failed: {e}")
            return {}
    
    @staticmethod
    def _llm_constraint_extraction(
        text: str,
        telegram_id: int,
        categories: Optional[List[str]] = None
    ) -> Dict[str, List[Dict]]:
        """
        Uses Groq for semantic constraint extraction when patterns don't match.
        Called only when pattern-based extraction finds nothing.
        
        IMPORTANT: This is OPTIONAL and used only as a fallback.
        Do not rely on LLM for critical constraints.
        
        Args:
            text: Raw user text
            telegram_id: For logging
            categories: Which categories to extract (if None, extracts all)
        
        Returns:
            Dictionary of constraints from LLM
        """
        
        if not categories:
            categories = list(ConstraintExtractor.CONSTRAINT_PATTERNS.keys())
        
        try:
            categories_str = ", ".join(categories)
            
            prompt = f"""Extract constraints from this conversation.
Only extract if explicitly mentioned. Do NOT invent constraints.
Return ONLY valid JSON (no markdown, no code blocks, no preamble).

CATEGORIES TO EXTRACT (only if mentioned):
{categories_str}

TEXT:
{text[:2000]}

JSON FORMAT (only include keys with values):
{{
  "budget": ["$30,000"],
  "timeline": ["Q2 2025"],
  "must_have": ["Salesforce integration"],
  "deal_breaker": ["No cloud solutions"],
  "user_role": ["VP Sales"]
}}
"""
            
            response = groq_client.chat.completions.create(
                model="mixtral-8x7b-32768",
                messages=[
                    {
                        "role": "system",
                        "content": "Extract constraints. Output ONLY valid JSON. No markdown, no code blocks."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=200,
                temperature=0.1  # Very low for factual extraction
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            if result_text.startswith("```"):
                result_text = result_text.split("```")[1]
                if result_text.startswith("json"):
                    result_text = result_text[4:]
            
            # Parse JSON
            parsed = json.loads(result_text)
            
            # Convert to standard format
            converted = {}
            for category, values in parsed.items():
                if category in categories and values:
                    if not isinstance(values, list):
                        values = [values]
                    
                    converted[category] = [
                        {
                            "value": str(v).strip(),
                            "confidence": "medium",
                            "extraction_method": "llm"
                        }
                        for v in values if v and str(v).strip()
                    ]
            
            logger.info(f"[{telegram_id}] LLM extraction found: {list(converted.keys())}")
            return converted
        
        except json.JSONDecodeError as e:
            logger.warning(f"[{telegram_id}] LLM returned invalid JSON: {e}")
            return {}
        except Exception as e:
            logger.error(f"[{telegram_id}] LLM constraint extraction failed: {e}")
            return {}
    
    @staticmethod
    def merge_constraints(
        existing: Dict[str, List[Dict]],
        new: Dict[str, List[Dict]]
    ) -> Dict[str, List[Dict]]:
        """
        Intelligently merges new constraints with existing ones.
        
        Rules:
        1. Exact matches = skip (already have it)
        2. New category = add
        3. Same category, new value = add if NOT duplicate
        4. Contradictions = log warning
        
        Args:
            existing: Current constraints dict
            new: New constraints to merge
        
        Returns:
            Merged constraints
        """
        
        merged = {}
        
        # Copy existing
        for category, entries in existing.items():
            merged[category] = [e.copy() for e in entries]
        
        # Merge new
        for category, new_entries in new.items():
            if category not in merged:
                merged[category] = new_entries
            else:
                # Category exists - check for duplicates
                existing_values = {e.get("value", "").lower() for e in merged[category]}
                
                for entry in new_entries:
                    new_value = entry.get("value", "").lower()
                    
                    # Check for contradictions (e.g., "no cloud" vs "must be cloud")
                    if category == "deal_breaker" or category == "must_have":
                        is_contradiction = any(
                            (category == "deal_breaker" and "must" in e.get("value", "").lower()) or
                            (category == "must_have" and "cannot" in e.get("value", "").lower())
                            for e in merged[category]
                        )
                        
                        if is_contradiction:
                            logger.warning(f"Potential contradiction in {category}: {entry.get('value')}")
                    
                    # Add if not duplicate
                    if new_value not in existing_values:
                        merged[category].append(entry)
                        existing_values.add(new_value)
        
        return merged
    
    @staticmethod
    def format_for_llm_context(constraints: Dict[str, List[Dict]]) -> str:
        """
        Formats constraints as a prompt block that ALWAYS gets injected first.
        This goes at the VERY TOP of your LLM context to prevent forgetting.
        
        Returns:
            Formatted string ready for prepending to LLM prompt
        """
        
        if not constraints:
            return ""
        
        lines = [
            "╔══════════════════════════════════════════════════════════════╗",
            "║         IMMUTABLE USER CONSTRAINTS (NEVER IGNORE THIS)       ║",
            "╚══════════════════════════════════════════════════════════════╝",
            ""
        ]
        
        constraint_count = 0
        
        for category, entries in constraints.items():
            if not entries:
                continue
            
            category_display = category.upper().replace("_", " ")
            lines.append(f"▸ {category_display}:")
            
            for entry in entries:
                value = entry.get("value", "").strip()
                confidence = entry.get("confidence", "")
                
                if value:
                    confidence_marker = "✓" if confidence == "high" else "?"
                    lines.append(f"    {confidence_marker} {value}")
                    constraint_count += 1
            
            lines.append("")
        
        lines.append("═" * 65)
        lines.append(f"Total constraints enforced: {constraint_count}")
        lines.append("═" * 65)
        lines.append("")
        
        return "\n".join(lines)
    
    @staticmethod
    def get_constraint_summary(constraints: Dict[str, List[Dict]]) -> str:
        """
        Returns a one-line summary of key constraints.
        Useful for logging and monitoring.
        
        Returns:
            String like "Budget: $30K | Timeline: Q2 2025 | Must have: Salesforce"
        """
        
        parts = []
        
        if constraints.get("budget"):
            budget = constraints["budget"][0].get("value", "")
            parts.append(f"Budget: {budget}")
        
        if constraints.get("timeline"):
            timeline = constraints["timeline"][0].get("value", "")
            parts.append(f"Timeline: {timeline}")
        
        must_haves = constraints.get("must_have", [])
        if must_haves:
            parts.append(f"Must have: {len(must_haves)} items")
        
        deal_breakers = constraints.get("deal_breaker", [])
        if deal_breakers:
            parts.append(f"Deal-breakers: {len(deal_breakers)} items")
        
        return " | ".join(parts) if parts else "No constraints extracted"


class ConstraintValidator:
    """
    Ensures LLM responses respect extracted constraints.
    Runs post-LLM-generation as a safety check.
    
    WARNING: This is a DETECTOR, not a blocker.
    We log violations but don't block responses (fail-open design).
    """
    
    @staticmethod
    def validate_response(
        response: str,
        constraints: Dict[str, List[Dict]],
        telegram_id: int
    ) -> Tuple[bool, List[str]]:
        """
        Checks if LLM response violates any constraints.
        
        Checks performed:
        1. Budget violations (response suggests >105% of budget)
        2. Deal-breaker mentions (response mentions something that's off-limits)
        3. Missing must-haves (response doesn't address required features)
        
        Args:
            response: LLM-generated response
            constraints: User's constraints dict
            telegram_id: For logging
        
        Returns:
            (is_valid: bool, violations: List[str])
            - is_valid=True means no violations found
            - violations is list of human-readable violation descriptions
        """
        
        violations = []
        
        try:
            # ===== CHECK 1: Budget Violations =====
            if constraints.get("budget"):
                budget_entry = constraints["budget"][0]
                budget_text = budget_entry.get("value", "")
                
                # Extract number from budget string
                budget_match = re.search(r'\$?([\d,\.]+)', budget_text)
                if budget_match:
                    try:
                        budget_limit = float(budget_match.group(1).replace(",", ""))
                        
                        # Find all prices mentioned in response
                        price_pattern = r'\$?([\d,\.]+)(?:\s*(?:k|K|thousand|million|yearly|annual|per month|per year))?'
                        price_matches = re.finditer(price_pattern, response)
                        
                        for price_match in price_matches:
                            try:
                                price_str = price_match.group(1).replace(",", "")
                                price = float(price_str)
                                
                                # Check if price exceeds budget by more than 5%
                                if price > budget_limit * 1.05:
                                    violations.append(
                                        f"Price ${price:,.0f} exceeds user budget of ${budget_limit:,.0f}"
                                    )
                                    break  # Only report first violation
                            except:
                                pass
                    except:
                        pass
            
            # ===== CHECK 2: Deal-breaker Violations =====
            if constraints.get("deal_breaker"):
                response_lower = response.lower()
                
                for breaker_entry in constraints["deal_breaker"]:
                    breaker_text = breaker_entry.get("value", "").lower()
                    
                    # Simple keyword matching
                    # Extract key terms from breaker_text
                    key_terms = [term.strip() for term in breaker_text.split() if len(term) > 3]
                    
                    for term in key_terms[:3]:  # Check first 3 terms
                        if term in response_lower:
                            violations.append(
                                f"Response mentions deal-breaker: '{breaker_text}'"
                            )
                            break
            
            # ===== CHECK 3: Missing Must-haves =====
            if constraints.get("must_have") and len(response) > 100:
                response_lower = response.lower()
                
                for must_entry in constraints["must_have"]:
                    must_text = must_entry.get("value", "").lower()
                    
                    # Check if must-have is mentioned
                    key_terms = [term.strip() for term in must_text.split() if len(term) > 3]
                    
                    # For now, just warn if first term is missing (not a hard violation)
                    if key_terms and key_terms[0] not in response_lower:
                        logger.debug(
                            f"[{telegram_id}] Response may not address: '{must_text}'"
                        )
            
            if violations:
                logger.warning(f"[{telegram_id}] Constraint violations found: {violations}")
                return False, violations
            
            return True, []
        
        except Exception as e:
            logger.error(f"[{telegram_id}] Constraint validation failed: {e}")
            return True, []  # Fail open - don't block on validation errors


# ============================================================================
# USAGE EXAMPLES
# ============================================================================

"""
# In handlers.py, inside handle_message():

from constraint_extractor import ConstraintExtractor, ConstraintValidator

# Step 1: Extract constraints from user text
new_constraints = ConstraintExtractor.extract_constraints_from_text(user_text, telegram_id)

# Step 2: Merge with existing constraints
existing_constraints = state.get(TblUserStates.EXTRACTED_CONSTRAINTS, {}) if state else {}
merged_constraints = ConstraintExtractor.merge_constraints(existing_constraints, new_constraints)

# Step 3: Inject into LLM context at TOP
constraint_block = ConstraintExtractor.format_for_llm_context(merged_constraints)
full_context = constraint_block + "\\n\\n" + ai_rules + "\\n\\n" + file_context + "\\n\\n" + vector_context

# Step 4: Call LLM (with constraints at top)
response = await get_groq_response(user_text, full_context, temperature=0.3)

# Step 5: Validate response
is_valid, violations = ConstraintValidator.validate_response(response, merged_constraints, telegram_id)

if not is_valid:
    logger.warning(f"Constraint violations: {violations}")
    response += f"\\n\\n⚠️ [System Note: {violations[0]}]"

# Step 6: Save constraints
update_user_state(telegram_id, mode=mode, metadata=metadata, constraints=merged_constraints)
"""