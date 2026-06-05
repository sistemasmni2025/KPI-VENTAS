import os
import xml.etree.ElementTree as ET

def scan_workbench_connections():
    appdata = os.environ.get("APPDATA")
    if not appdata:
        print("No se encontró la variable APPDATA.")
        return
        
    xml_path = os.path.join(appdata, "MySQL", "Workbench", "connections.xml")
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "workbench_connections.txt")
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(f"Buscando archivo de conexiones en: {xml_path}\n")
        
        if not os.path.exists(xml_path):
            f.write("El archivo connections.xml no existe en la ruta especificada.\n")
            return
            
        try:
            tree = ET.parse(xml_path)
            root = tree.getroot()
            
            f.write("\n=== CONEXIONES ENCONTRADAS EN MYSQL WORKBENCH ===\n")
            
            # Buscar elementos de conexión
            connections = root.findall(".//value[@type='object'][@class='db.mgmt.Connection']")
            for conn in connections:
                name = ""
                host = ""
                port = ""
                user = ""
                schema = ""
                
                # Extraer nombre
                name_elem = conn.find("./value[@name='name']")
                if name_elem is not None:
                    name = name_elem.text
                    
                # Extraer parámetros
                params = conn.find(".//value[@name='parameterValues']")
                if params is not None:
                    for val in params.findall("./value"):
                        key = val.get("key")
                        if key == "hostName":
                            host = val.text
                        elif key == "port":
                            port = val.text
                        elif key == "userName":
                            user = val.text
                        elif key == "schema":
                            schema = val.text
                            
                f.write(f"Nombre Conexión: {name}\n")
                f.write(f"  Host: {host}\n")
                f.write(f"  Port: {port}\n")
                f.write(f"  User: {user}\n")
                f.write(f"  Schema/BD: {schema}\n")
                f.write("-" * 40 + "\n")
                
            f.write("\nEscaneo finalizado.\n")
            print("Escaneo finalizado con éxito. Se guardó en workbench_connections.txt")
            
        except Exception as e:
            f.write(f"Error al analizar el XML: {str(e)}\n")
            print(f"Error al analizar: {e}")

if __name__ == "__main__":
    scan_workbench_connections()
