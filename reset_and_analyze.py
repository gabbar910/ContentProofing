import requests
import json

# Reset content status and re-analyze with new Python-based analyzer
base_url = "http://localhost:8000/api/v1"

try:
    # First, let's check the current content status
    content_response = requests.get(f"{base_url}/content/1")
    print(f"Current content status: {content_response.json()['status']}")
    
    # Reset the content status to 'pending' by updating it directly
    # We'll need to use the database directly or create an endpoint for this
    # For now, let's try to re-analyze even if it says "already analyzed"
    
    # Delete existing suggestions first (if any)
    suggestions_response = requests.get(f"{base_url}/suggestions/content/1")
    suggestions = suggestions_response.json()
    print(f"Current suggestions count: {len(suggestions)}")
    
    # Force re-analysis by calling analyze endpoint
    analyze_response = requests.post(f"{base_url}/content/analyze", json={"content_id": 1})
    print(f"Re-analysis response: {analyze_response.status_code} - {analyze_response.text}")
    
    # Check suggestions after analysis
    new_suggestions_response = requests.get(f"{base_url}/suggestions/content/1")
    new_suggestions = new_suggestions_response.json()
    print(f"New suggestions count: {len(new_suggestions)}")
    
    if len(new_suggestions) > 0:
        print("✅ Suggestions generated successfully!")
        for i, suggestion in enumerate(new_suggestions[:5]):  # Show first 5
            print(f"  {i+1}. {suggestion['error_type']}: '{suggestion['original_text']}' → '{suggestion['suggested_text']}'")
            print(f"     Explanation: {suggestion['explanation']}")
    else:
        print("❌ No suggestions generated")
        
except Exception as e:
    print(f"Error: {e}")
