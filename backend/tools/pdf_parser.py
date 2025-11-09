"""
PDF Document Parser
Extract text and data from policy documents
"""

import logging
from typing import Dict, Any
import PyPDF2
import io

logger = logging.getLogger(__name__)


def parse_pdf(file_bytes: bytes) -> Dict[str, Any]:
    """
    Parse PDF and extract all text and structured data
    
    Args:
        file_bytes: Raw bytes of the PDF file
        
    Returns:
        Dict with extracted text and metadata
    """
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        
        # Extract metadata
        metadata = pdf_reader.metadata or {}
        
        # Extract all text
        full_text = ""
        for page_num, page in enumerate(pdf_reader.pages):
            text = page.extract_text()
            full_text += f"\n\n--- Page {page_num + 1} ---\n\n{text}"
        
        # Extract key information (simple keyword-based)
        extracted_data = {
            "full_text": full_text.strip(),
            "page_count": len(pdf_reader.pages),
            "metadata": {
                "title": metadata.get("/Title", "Unknown"),
                "author": metadata.get("/Author", "Unknown"),
                "subject": metadata.get("/Subject", "Unknown"),
            }
        }
        
        # Try to extract key sections
        sections = extract_sections(full_text)
        if sections:
            extracted_data["sections"] = sections
        
        # Extract key metrics/numbers
        metrics = extract_metrics(full_text)
        if metrics:
            extracted_data["metrics"] = metrics
        
        logger.info(f"Successfully parsed PDF: {len(pdf_reader.pages)} pages, {len(full_text)} characters")
        
        return {
            "success": True,
            "data": extracted_data
        }
        
    except Exception as e:
        logger.error(f"Error parsing PDF: {e}")
        return {
            "success": False,
            "error": str(e)
        }


def extract_sections(text: str) -> Dict[str, str]:
    """Extract common policy document sections"""
    sections = {}
    
    # Common section headers
    headers = [
        "Executive Summary", "Summary", "Introduction", "Background",
        "Objectives", "Goals", "Implementation", "Timeline", "Budget",
        "Impact", "Benefits", "Challenges", "Recommendations", "Conclusion"
    ]
    
    for header in headers:
        # Simple section extraction
        if header in text:
            start = text.find(header)
            # Find next section or take 500 chars
            rest = text[start + len(header):]
            end = 500
            for other_header in headers:
                if other_header != header and other_header in rest:
                    pos = rest.find(other_header)
                    if pos < end:
                        end = pos
            
            sections[header.lower().replace(" ", "_")] = rest[:end].strip()
    
    return sections


def extract_metrics(text: str) -> Dict[str, Any]:
    """Extract numerical metrics and percentages"""
    import re
    
    metrics = {}
    
    # Find percentages
    percentages = re.findall(r'(\d+(?:\.\d+)?)\s*(?:%|percent)', text, re.IGNORECASE)
    if percentages:
        metrics["percentages"] = [float(p) for p in percentages[:10]]  # Limit to 10
    
    # Find dollar amounts
    dollars = re.findall(r'\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:million|billion|M|B)?', text, re.IGNORECASE)
    if dollars:
        metrics["dollar_amounts"] = dollars[:10]
    
    # Find years
    years = re.findall(r'\b(20\d{2})\b', text)
    if years:
        metrics["years"] = list(set(years))
    
    return metrics



