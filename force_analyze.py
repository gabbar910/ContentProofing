import requests
import json

# Force re-analysis with new Python-based analyzer
base_url = "http://localhost:8000/api/v1"

try:
    print("🔄 Forcing re-analysis of content ID 1...")
    
    # Force re-analysis by calling analyze endpoint with force=true
    analyze_response = requests.post(f"{base_url}/content/analyze?force=true", json={"content_id": 1})
    print(f"Re-analysis response: {analyze_response.status_code} - {analyze_response.text}")
    
    if analyze_response.status_code == 200:
        print("✅ Analysis completed successfully!")
        
        # Check suggestions after analysis
        suggestions_response = requests.get(f"{base_url}/suggestions/content/1")
        suggestions = suggestions_response.json()
        print(f"Generated suggestions count: {len(suggestions)}")
        
        if len(suggestions) > 0:
            print("\n📝 Generated suggestions:")
            for i, suggestion in enumerate(suggestions[:10]):  # Show first 10
                print(f"  {i+1}. [{suggestion['error_type'].upper()}] '{suggestion['original_text']}' → '{suggestion['suggested_text']}'")
                print(f"     💡 {suggestion['explanation']} (Confidence: {suggestion['confidence_score']:.1f})")
                print()
        else:
            print("❌ No suggestions generated - this might indicate an issue with the analyzer")
            
        # Check content status
        content_response = requests.get(f"{base_url}/content/1")
        print(f"Content status after analysis: {content_response.json()['status']}")
        
    else:
        print("❌ Analysis failed")
        
except Exception as e:
    print(f"Error: {e}")
