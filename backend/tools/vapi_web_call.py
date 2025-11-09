"""
VAPI Web Call Integration
Create web-based voice calls that don't require phone numbers
"""

import os
import logging
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

VAPI_PUBLIC_KEY = os.getenv("VAPI_PUBLIC_KEY")


def generate_web_call_config(
    message: str,
    agent_name: str = "Policy Agent"
) -> Dict[str, Any]:
    """
    Generate configuration for a VAPI web call
    This can be used in the browser without requiring a phone number
    
    Args:
        message: The message the agent should convey
        agent_name: Name of the AI agent
        
    Returns:
        Dict with web call configuration for frontend
    """
    return {
        "publicKey": VAPI_PUBLIC_KEY,
        "assistant": {
            "firstMessage": f"Hello! This is {agent_name}. {message}",
            "model": {
                "provider": "openai",
                "model": "gpt-4",
                "messages": [
                    {
                        "role": "system",
                        "content": f"""You are {agent_name}, a professional AI assistant.

Your main message to convey:
{message}

Guidelines:
- Be professional and courteous
- Speak clearly and naturally
- Answer questions knowledgeably
- Keep the conversation focused
- End politely when appropriate"""
                    }
                ]
            }
        }
    }



