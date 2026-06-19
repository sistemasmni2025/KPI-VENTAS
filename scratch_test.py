import urllib.request
import urllib.error

with open('c:\\Users\\SISTEMAS\\Documents\\Antigravity Projects\\Ventas_Reporteo\\http_debug.txt', 'w', encoding='utf-8') as f:
    f.write("=== HTTP DEBUG ===\n")
    for url in ["http://localhost:5175/", "http://127.0.0.1:5175/", "http://localhost:5173/"]:
        f.write(f"\nTesting: {url}\n")
        try:
            req = urllib.request.urlopen(url, timeout=2.0)
            f.write(f"Status: {req.status}\n")
            f.write(f"Headers:\n{req.headers}\n")
            f.write(f"Body:\n{req.read().decode('utf-8')[:500]}\n")
        except Exception as e:
            f.write(f"Error: {type(e).__name__} - {e}\n")
