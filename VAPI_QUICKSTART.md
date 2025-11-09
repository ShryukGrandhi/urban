# 📞 VAPI Voice AI - Quick Start Guide

## ✅ Setup Complete!

Your VAPI integration is ready! Here's exactly how to make a real AI phone call:

## 🚀 How To Make A Call (3 Easy Steps)

### Step 1: Create a Media Calling Agent
1. Go to **http://localhost:3000/agents**
2. Click **"Create New Agent"** (glowing button, top right)
3. Select **"Media Calling"** from the dropdown
4. Fill in:
   - Name: `CNN Media Outreach`
   - Role: `Contact journalists about new traffic policy`
   - Description: (optional)
5. Click **"Create Agent"**

### Step 2: Execute The Agent
1. Find your new agent in the list
2. Click **"Execute Agent"** button
3. In the modal, add this Custom Input:
```json
{
  "target": "journalist@cnn.com",
  "urgency": "high",
  "tone": "professional",
  "key_message": "New urban development policy reduces traffic by 30% and improves air quality"
}
```
4. Click **"Execute Agent"**
5. You'll be redirected to the Streaming Console
6. **Watch the AI generate** call scripts, email templates, and media kits in real-time!

### Step 3: Make The REAL Call!
1. After the agent finishes streaming (20-30 seconds)
2. Look for the **glowing GREEN button** in the header: **"Make Real Call"**
3. Click it!
4. A modal appears with your phone number pre-filled: `+18582108648`
5. Click **"Make Call Now"**
6. **YOUR PHONE WILL RING!** 📞
7. Answer it and the AI will speak to you!

## 🎤 What The AI Will Say

The AI will:
- Introduce itself professionally
- Explain the policy update
- Deliver the key message about traffic reduction
- Offer to provide more details
- Answer any questions you ask
- End the call politely

Example conversation:
> **AI**: "Hello, this is calling from the policy office regarding Urban Development Initiative. Do you have a moment to discuss a newsworthy policy update?"
>
> **You**: "Yes, what's this about?"
>
> **AI**: "I'm calling to share information about our new urban development policy that reduces traffic by 30% and improves air quality. This is an important update that would be of interest to local news and your audience. Would you be interested in covering this story?"

## 🔧 Alternative: Direct API Call

You can also make calls directly via API:

### Using curl:
```bash
curl -X POST http://localhost:8000/api/calls/make \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+18582108648",
    "message": "New urban policy reduces traffic by 30%",
    "agent_name": "Policy Agent",
    "call_type": "media_outreach",
    "policy_name": "Urban Development Initiative"
  }'
```

### Using Python:
```python
import requests

response = requests.post(
    "http://localhost:8000/api/calls/make",
    json={
        "phone_number": "+18582108648",
        "message": "New urban policy reduces traffic by 30%",
        "agent_name": "Policy Agent",
        "call_type": "media_outreach",
        "policy_name": "Urban Development Initiative"
    }
)

result = response.json()
print(f"Call ID: {result['call_id']}")
print(f"Status: {result['status']}")
```

## 📊 Check Call Status

```bash
curl http://localhost:8000/api/calls/{call_id}/status
```

## 🎯 Your Configuration

- **VAPI Private Key**: ✅ Configured
- **VAPI Public Key**: ✅ Configured  
- **Target Phone**: +1 (858) 210-8648
- **Backend URL**: http://localhost:8000
- **Frontend URL**: http://localhost:3000

## 💡 Tips

1. **Make sure backend is running** - Check the PowerShell window titled "URBAN Backend - VAPI Voice AI"
2. **Green button only appears after agent finishes** - Wait for streaming to complete
3. **Phone format matters** - Use E.164 format: +1XXXXXXXXXX
4. **AI is interactive** - You can ask it questions and have a real conversation!
5. **Call logs** - VAPI dashboard shows all call details and recordings

## 🐛 Troubleshooting

**Button doesn't appear?**
- Make sure agent finished streaming (wait 30 seconds)
- Refresh the page and try again

**Call fails?**
- Verify phone number format: `+18582108648`
- Check backend logs for errors
- Ensure VAPI keys are valid

**Backend not running?**
- Look for PowerShell window "URBAN Backend - VAPI Voice AI"
- Or restart it: `cd backend && python main.py`

## 🎉 You're All Set!

Everything is configured and ready. Just:
1. Create agent → 2. Execute → 3. Click "Make Real Call" → 4. Answer your phone! 📞

---

**Questions?** Check the backend logs or try the direct API call to test!



