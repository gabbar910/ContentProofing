import requests
import json

# Simple test for OpenAI-powered content analysis
base_url = "http://localhost:8000/api/v1"

try:
    print("🔄 Checking existing content...")
    
    # Check existing content
    content_response = requests.get(f"{base_url}/content/")
    contents = content_response.json()
    print(f"Found {len(contents)} existing content items")
    
    if contents:
        # Use existing content
        content_id = contents[0]["id"]
        print(f"✅ Using existing content ID: {content_id}")
        print(f"Content title: {contents[0]['title']}")
        print(f"Content text preview: {contents[0]['cleaned_text'][:100]}...")
    else:
        print("❌ No content found. Please create some content first.")
        exit(1)
    
    print("\n🤖 Starting OpenAI-powered analysis...")
    
    # Force analysis with OpenAI
    analyze_response = requests.post(f"{base_url}/content/analyze?force=true", json={"content_id": content_id})
    print(f"Analysis response: {analyze_response.status_code} - {analyze_response.text}")
    
    if analyze_response.status_code == 200:
        print("✅ Analysis completed successfully!")
        
        # Wait a moment for analysis to complete
        import time
        time.sleep(2)
        
        # Check suggestions after analysis
        suggestions_response = requests.get(f"{base_url}/suggestions/content/{content_id}")
        
        if suggestions_response.status_code == 200:
            suggestions = suggestions_response.json()
            print(f"Generated suggestions count: {len(suggestions)}")
            
            if len(suggestions) > 0:
                print("\n🤖 OpenAI-Generated suggestions:")
                for i, suggestion in enumerate(suggestions[:10]):  # Show first 10
                    print(f"  {i+1}. [{suggestion['error_type'].upper()}] '{suggestion['original_text']}' → '{suggestion['suggested_text']}'")
                    print(f"     💡 {suggestion['explanation']} (Confidence: {suggestion['confidence_score']:.1f})")
                    print()
            else:
                print("❌ No suggestions generated - checking logs...")
        else:
            print(f"❌ Failed to get suggestions: {suggestions_response.status_code} - {suggestions_response.text}")
            
        # Check content status
        content_response = requests.get(f"{base_url}/content/{content_id}")
        if content_response.status_code == 200:
            print(f"Content status after analysis: {content_response.json()['status']}")
        
    else:
        print("❌ Analysis failed")
        
except Exception as e:
    print(f"Error: {e}")
