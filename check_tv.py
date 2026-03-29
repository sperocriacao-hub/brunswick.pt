import urllib.request
import json

URL = "https://efenntgldjizgyyttiiw.supabase.co/rest/v1/vw_tvs_configuradas?id=eq.33eb0e4d-9562-4b53-9bf1-b29f07eb62cf"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZW5udGdsZGppemd5eXR0aWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzI5ODIsImV4cCI6MjA4NzI0ODk4Mn0.1KPq3FBSo5Nn3qNQoHMEMvPBKBa1SYeI72QaUZMXSMc"

req = urllib.request.Request(URL)
req.add_header('apikey', KEY)
req.add_header('Authorization', f'Bearer {KEY}')

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(json.dumps(data, indent=2))
except Exception as e:
    print("Error:", e)
