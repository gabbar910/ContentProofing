import requests
import json

# Test OpenAI-powered content analysis
base_url = "http://localhost:8000/api/v1"

# First, let's create some test content with intentional errors
test_content = {
    "url": "https://example.com/test-openai",
    "title": "Test Content for OpenAI Analysis",
    "original_text": "This is a test content with several erors. We have mispelled words, grammer mistakes, and puncuation issues. The sentance structure could be improoved. There are also some very long sentences that go on and on without proper breaks which makes them difficult to read and understand for the average reader who might be trying to comprehend the content quickly.",
    "cleaned_text": "This is a test content with several erors. We have mispelled words, grammer mistakes, and puncuation issues. The sentance structure could be improoved. There are also some very long sentences that go on and on without proper breaks which makes them difficult to read and understand for the average reader who might be trying to comprehend the content quickly.",
    "language": "en"
}

try:
    print("🔄 Creating test content...")
    
    # Create content via crawl endpoint (simulating crawled content)
    crawl_response = requests.post(f"{base_url}/crawl/start", json={
        "url": test_content["url"],
        "max_depth": 1,
        "max_pages": 1
    })
    
    if crawl_response.status_code != 200:
        print(f"❌ Failed to start crawl: {crawl_response.text}")
        exit(1)
    
    # Get the created content
    content_response = requests.get(f"{base_url}/content/")
    contents = content_response.json()
    
    if not contents:
        print("❌ No content found")
        exit(1)
    
    # Use the latest content
    content_id = contents[-1]["id"]
    print(f"✅ Using content ID: {content_id}")
    
    # Update the content with our test text
    # Since there's no direct update endpoint, we'll work with existing content
    
    print("🤖 Starting OpenAI-powered analysis...")
    
    # Force analysis with OpenAI
    analyze_response = requests.post(f"{base_url}/content/analyze?force=true", json={"content_id": content_id})
    print(f"Analysis response: {analyze_response.status_code} - {analyze_response.text}")
    
    if analyze_response.status_code == 200:
        print("✅ Analysis completed successfully!")
        
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
                print("❌ No suggestions generated")
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
