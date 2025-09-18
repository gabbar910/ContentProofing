import requests
import json

# Create test content and test OpenAI-powered analysis
base_url = "http://localhost:8000/api/v1"

# Test content with intentional errors for OpenAI to detect
test_text = """Welcome to our compnay website! We are a profesional web developement team with over 10 years of experiance in the industry. Our team is dedicted to providing the best customer service and we use the latest technolgies to build modern websites.

All our projects are completd on time and within budget. We beleive in quality and excelence in everything we do. Our servises include web design, web developement, e-commerce solutions, and digital marketing.

If your intrested in learning more about our servises, please dont hesitate to contact us. We would be happy to discus your project requirements and provide you with a free quote."""

try:
    print("🔄 Creating test content with intentional errors...")
    
    # Create content by starting a crawl (which will create content)
    crawl_data = {
        "url": "https://example.com/test-content",
        "max_depth": 1,
        "max_pages": 1
    }
    
    crawl_response = requests.post(f"{base_url}/crawl/start", json=crawl_data)
    print(f"Crawl response: {crawl_response.status_code}")
    
    if crawl_response.status_code == 200:
        # Wait a moment for crawl to complete
        import time
        time.sleep(1)
        
        # Check if content was created
        content_response = requests.get(f"{base_url}/content/")
        contents = content_response.json()
        
        if contents:
            content_id = contents[-1]["id"]  # Get the latest content
            print(f"✅ Content created with ID: {content_id}")
            
            # Now let's manually update the content text for testing
            # Since there's no direct update endpoint, we'll work with what we have
            print(f"Content title: {contents[-1]['title']}")
            print(f"Content preview: {contents[-1]['cleaned_text'][:100]}...")
            
            print("\n🤖 Starting OpenAI-powered analysis...")
            
            # Force analysis with OpenAI
            analyze_response = requests.post(f"{base_url}/content/analyze?force=true", json={"content_id": content_id})
            print(f"Analysis response: {analyze_response.status_code} - {analyze_response.text}")
            
            if analyze_response.status_code == 200:
                print("✅ Analysis started successfully!")
                
                # Wait for analysis to complete
                time.sleep(3)
                
                # Check suggestions after analysis
                suggestions_response = requests.get(f"{base_url}/suggestions/content/{content_id}")
                
                if suggestions_response.status_code == 200:
                    suggestions = suggestions_response.json()
                    print(f"Generated suggestions count: {len(suggestions)}")
                    
                    if len(suggestions) > 0:
                        print("\n🤖 OpenAI-Generated suggestions:")
                        for i, suggestion in enumerate(suggestions[:15]):  # Show first 15
                            print(f"  {i+1}. [{suggestion['error_type'].upper()}] '{suggestion['original_text']}' → '{suggestion['suggested_text']}'")
                            print(f"     💡 {suggestion['explanation']} (Confidence: {suggestion['confidence_score']:.1f})")
                            print()
                    else:
                        print("❌ No suggestions generated")
                        print("This might indicate:")
                        print("- OpenAI API key issues")
                        print("- Content analysis failed")
                        print("- No errors found in the content")
                else:
                    print(f"❌ Failed to get suggestions: {suggestions_response.status_code} - {suggestions_response.text}")
                    
                # Check content status
                content_response = requests.get(f"{base_url}/content/{content_id}")
                if content_response.status_code == 200:
                    print(f"Content status after analysis: {content_response.json()['status']}")
                
            else:
                print(f"❌ Analysis failed: {analyze_response.text}")
        else:
            print("❌ No content was created")
    else:
        print(f"❌ Failed to start crawl: {crawl_response.text}")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
