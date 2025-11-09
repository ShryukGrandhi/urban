"""
VAPI Voice AI Integration
Make real phone calls with AI agents
"""

import os
import requests
import logging
import json
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

VAPI_PRIVATE_KEY = os.getenv("VAPI_PRIVATE_KEY")
VAPI_PUBLIC_KEY = os.getenv("VAPI_PUBLIC_KEY")
VAPI_PHONE_NUMBER_ID = os.getenv("VAPI_PHONE_NUMBER_ID")
VAPI_API_URL = "https://api.vapi.ai"


class VAPIService:
    """Service for making AI-powered phone calls using VAPI"""
    
    def __init__(self):
        if not VAPI_PRIVATE_KEY:
            raise ValueError("VAPI_PRIVATE_KEY not found in environment variables")
        self.headers = {
            "Authorization": f"Bearer {VAPI_PRIVATE_KEY}",
            "Content-Type": "application/json"
        }
    
    def get_phone_numbers(self) -> Dict[str, Any]:
        """Get list of available VAPI phone numbers"""
        try:
            response = requests.get(
                f"{VAPI_API_URL}/phone-number",
                headers=self.headers,
                timeout=10
            )
            if response.status_code == 200:
                return {
                    "success": True,
                    "phone_numbers": response.json()
                }
            else:
                return {
                    "success": False,
                    "error": f"API returned status {response.status_code}",
                    "details": response.text
                }
        except Exception as e:
            logger.error(f"Error getting phone numbers: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def create_phone_call(
        self,
        phone_number: str,
        message: str,
        agent_name: str = "Policy Agent",
        first_message: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Initiate a phone call with AI agent
        
        Args:
            phone_number: Phone number to call (E.164 format, e.g., +18582108648)
            message: The message/script the agent should convey
            agent_name: Name of the AI agent
            first_message: Optional first message when call connects
            
        Returns:
            Dict with call details including call_id
        """
        try:
            # Ensure phone number is in E.164 format
            if not phone_number.startswith('+'):
                phone_number = f'+{phone_number}'
            
            # Create assistant configuration (without voice - VAPI will use default)
            assistant = {
                "firstMessage": first_message or f"Hello, this is {agent_name} calling.",
                "model": {
                    "provider": "openai",
                    "model": "gpt-4",
                    "messages": [
                        {
                            "role": "system",
                            "content": f"""You are {agent_name}, a professional AI assistant making an outbound call.

Your main message to convey:
{message}

Guidelines:
- Be professional and courteous
- Speak clearly and at a moderate pace
- If the person asks questions, answer them knowledgeably
- Keep the conversation focused on the main message
- End the call politely when the message has been delivered
- If it goes to voicemail, leave a brief professional message"""
                        }
                    ]
                }
            }
            
            # Create phone call using VAPI phone number
            payload = {
                "assistant": assistant,
                "phoneNumberId": VAPI_PHONE_NUMBER_ID,
                "customer": {
                    "number": phone_number
                }
            }
            
            logger.info(f"Creating VAPI call to {phone_number}")
            logger.info(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(
                f"{VAPI_API_URL}/call/phone",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 201:
                result = response.json()
                logger.info(f"Call created successfully: {result.get('id')}")
                return {
                    "success": True,
                    "call_id": result.get("id"),
                    "status": result.get("status"),
                    "phone_number": phone_number,
                    "message": "Call initiated successfully"
                }
            else:
                logger.error(f"VAPI API error: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "error": f"API returned status {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error creating VAPI call: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_call_status(self, call_id: str) -> Dict[str, Any]:
        """
        Get the status of a phone call
        
        Args:
            call_id: The ID of the call to check
            
        Returns:
            Dict with call status and details
        """
        try:
            response = requests.get(
                f"{VAPI_API_URL}/call/{call_id}",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {
                    "success": False,
                    "error": f"API returned status {response.status_code}"
                }
                
        except Exception as e:
            logger.error(f"Error getting call status: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def make_media_outreach_call(
        self,
        phone_number: str,
        policy_name: str,
        key_message: str,
        target_outlet: str = "media outlet"
    ) -> Dict[str, Any]:
        """
        Make a specialized media outreach call
        
        Args:
            phone_number: Phone number to call
            policy_name: Name of the policy
            key_message: Key message to convey
            target_outlet: Name of the media outlet
            
        Returns:
            Dict with call details
        """
        message = f"""
I'm calling to share information about {policy_name}.

Key Message:
{key_message}

This is an important policy update that would be of interest to {target_outlet} and your audience.

I'd be happy to:
- Provide additional details and data
- Arrange interviews with key officials
- Share our full press kit and materials

Would you be interested in covering this story?
"""
        
        first_message = f"Hello, this is calling from the policy office regarding {policy_name}. Do you have a moment to discuss a newsworthy policy update?"
        
        return self.create_phone_call(
            phone_number=phone_number,
            message=message,
            agent_name="Policy Communications Agent",
            first_message=first_message
        )


# Singleton instance
vapi_service = VAPIService() if VAPI_PRIVATE_KEY else None

