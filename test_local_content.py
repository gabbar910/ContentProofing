import requests
import json
import os

# Test OpenAI analyzer with local HTML content
base_url = "http://localhost:8000/api/v1"

# Get the full path to the test HTML file
current_dir = os.getcwd()
html_file_path = f"file:///{current_dir}/test-content.html".replace("\\", "/")

try:
    print("🔄 Starting crawl of local test content...")
    print(f"HTML file path: {html_file_path}")
    
    # Start crawl of the local HTML file
    crawl_data = {
        "url": html_file_path,
        "max_depth": 1,
        "max_pages": 1
    }
    
    crawl_response = requests.post(f"{base_url}/crawl/start", json=crawl_data)
    print(f"Crawl response: {crawl_response.status_code} - {crawl_response.text}")
    
    if crawl_response.status_code == 200:
        # Wait for crawl to complete
        import time
        time.sleep(3)
        
        # Check if content was created
        content_response = requests.get(f"{base_url}/content/")
        contents = content_response.json()
        
        if contents:
            content_id = contents[-1]["id"]  # Get the latest content
            print(f"✅ Content created with ID: {content_id}")
            print(f"Content title: {contents[-1]['title']}")
            print(f"Content preview: {contents[-1]['cleaned_text'][:150]}...")
            
            print("\n🤖 Starting OpenAI-powered analysis...")
            
            # Force analysis with OpenAI
            analyze_response = requests.post(f"{base_url}/content/analyze?force=true", json={"content_id": content_id})
            print(f"Analysis response: {analyze_response.status_code} - {analyze_response.text}")
            
            if analyze_response.status_code == 200:
                print("✅ Analysis started successfully!")
                
                # Wait for analysis to complete (OpenAI API calls take time)
                print("⏳ Waiting for OpenAI analysis to complete...")
                time.sleep(8)
                
                # Check suggestions after analysis
                suggestions_response = requests.get(f"{base_url}/suggestions/content/{content_id}")
                
                if suggestions_response.status_code == 200:
                    suggestions = suggestions_response.json()
                    print(f"Generated suggestions count: {len(suggestions)}")
                    
                    if len(suggestions) > 0:
                        print("\n🤖 OpenAI-Generated suggestions:")
                        for i, suggestion in enumerate(suggestions[:20]):  # Show first 20
                            print(f"  {i+1}. [{suggestion['error_type'].upper()}] '{suggestion['original_text']}' → '{suggestion['suggested_text']}'")
                            print(f"     💡 {suggestion['explanation']} (Confidence: {suggestion['confidence_score']:.1f})")
                            print()
                            
                        print(f"\n📊 Summary:")
                        error_types = {}
                        for suggestion in suggestions:
                            error_type = suggestion['error_type']
                            error_types[error_type] = error_types.get(error_type, 0) + 1
                        
                        for error_type, count in error_types.items():
                            print(f"  - {error_type.title()}: {count} suggestions")
                            
                    else:
                        print("❌ No suggestions generated")
                        print("Checking server logs for potential issues...")
                else:
                    print(f"❌ Failed to get suggestions: {suggestions_response.status_code} - {suggestions_response.text}")
                    
                # Check content status
                content_response = requests.get(f"{base_url}/content/{content_id}")
                if content_response.status_code == 200:
                    print(f"Content status after analysis: {content_response.json()['status']}")
                
            else:
                print(f"❌ Analysis failed: {analyze_response.text}")
        else:
            print("❌ No content was created from crawl")
            print("Checking crawl jobs...")
            jobs_response = requests.get(f"{base_url}/crawl/jobs")
            if jobs_response.status_code == 200:
                jobs = jobs_response.json()
                if jobs:
                    latest_job = jobs[-1]
                    print(f"Latest job status: {latest_job['status']}")
                    if latest_job.get('error_message'):
                        print(f"Error: {latest_job['error_message']}")
    else:
        print(f"❌ Failed to start crawl: {crawl_response.text}")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
