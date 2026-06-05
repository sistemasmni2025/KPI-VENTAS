import os

output_path = r"C:\Users\SISTEMAS\Documents\Antigravity Projects\Ventas_Reporteo\python_test.txt"
try:
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("Python is running successfully!\n")
    print("Success writing file")
except Exception as e:
    print(f"Error: {e}")
