import requests
import json

# Test the content analysis endpoint
url = "http://localhost:8000/api/v1/content/analyze"
data = {"content_id": 1}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("✅ Content analysis API is working!")
    else:
        print("❌ Content analysis API failed")
        
except Exception as e:
    print(f"Error: {e}")
