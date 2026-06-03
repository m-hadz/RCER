import random
from faker import Faker

fake = Faker()

# Configuración de cantidad de registros a generar por tabla
NUM_CENTROS = 50
NUM_ENTORNOS_POR_CENTRO = 3
NUM_TABLAS_POR_ENTORNO = 5
NUM_VARIABLES = 100
NUM_CAMPOS_POR_TABLA = 10
NUM_METADATA = 100

def escape_sql(text):
    """Escapa comillas simples para SQL."""
    if text is None:
        return 'NULL'
    return f"'{str(text).replace('\'', '\'\'')}'"

def generate_mock_sql():
    with open('mock_data_inserts.sql', 'w', encoding='utf-8') as f:
        f.write("-- ==========================================\n")
        f.write("-- SCRIPT GENERADO DE DATOS MOCK\n")
        f.write("-- ==========================================\n\n")

        # 1. Centro_investigacion
        f.write("-- Tabla: Centro_investigacion\n")
        centros_ids = []
        for _ in range(NUM_CENTROS):
            ws_id = f"ws_{fake.unique.word()}_{random.randint(100,999)}"
            centros_ids.append(ws_id)
            nombre = fake.company()
            ws_nombre = f"Workspace {fake.word().capitalize()} - {nombre}"
            ambiente = random.choice(['DEV', 'PROD', 'DEV/PROD', 'QA'])
            
            f.write(f"INSERT INTO Centro_investigacion (workspace_id, nombre, workspace_nombre, ambiente) "
                    f"VALUES ({escape_sql(ws_id)}, {escape_sql(nombre)}, {escape_sql(ws_nombre)}, {escape_sql(ambiente)});\n")
        
        # 2. Entorno_datos
        f.write("\n-- Tabla: Entorno_datos\n")
        entornos_data = [] # (lakehouse_id, workspace_id)
        for ws_id in centros_ids:
            for _ in range(random.randint(1, NUM_ENTORNOS_POR_CENTRO)):
                lh_id = f"lh_{fake.unique.word()}_{random.randint(100,999)}"
                capa = random.choice(['Bronze', 'Silver', 'Gold'])
                tipo = random.choice(['Lakehouse', 'Warehouse SQL', 'Object Storage'])
                ambiente = random.choice(['DEV', 'PROD', 'QA'])
                
                entornos_data.append((lh_id, ws_id))
                f.write(f"INSERT INTO Entorno_datos (lakehouse_id, workspace_id, capa, tipo, ambiente) "
                        f"VALUES ({escape_sql(lh_id)}, {escape_sql(ws_id)}, {escape_sql(capa)}, {escape_sql(tipo)}, {escape_sql(ambiente)});\n")

        # 3. Activo_fisico
        f.write("\n-- Tabla: Activo_fisico\n")
        activos_data = [] # (nombre_tabla, lakehouse_id)
        for lh_id, _ in entornos_data:
            for _ in range(random.randint(1, NUM_TABLAS_POR_ENTORNO)):
                nombre_tabla = f"{fake.word()}_{fake.word()}_{random.randint(1,99)}"
                total_reg = random.randint(100, 100000000)
                fecha_inicio = fake.date_between(start_date='-5y', end_date='-1y')
                fecha_fin = fake.date_between(start_date=fecha_inicio, end_date='today')
                col_temp = random.choice(['Date', 'TIMESTAMP', 'Fecha', 'Time', 'created_at'])
                
                activos_data.append((nombre_tabla, lh_id))
                f.write(f"INSERT INTO Activo_fisico (nombre_tabla, lakehouse_id, total_registros, fecha_inicio, fecha_fin, col_temporal) "
                        f"VALUES ({escape_sql(nombre_tabla)}, {escape_sql(lh_id)}, {total_reg}, {escape_sql(fecha_inicio)}, {escape_sql(fecha_fin)}, {escape_sql(col_temp)});\n")

        # 4. Variable (El id_variable es autoincremental en DuckDB/Postgres, insertamos solo datos)
        f.write("\n-- Tabla: Variable\n")
        for _ in range(NUM_VARIABLES):
            nombre_var = fake.word().capitalize()
            unidad = random.choice(['Celsius', 'm/s', 'mm', 'hPa', '%', 'W/m2', 'mg/L'])
            sensor = fake.company() + " Sensor"
            f.write(f"INSERT INTO Variable (nombre_variable, unidad, sensor_origen) "
                    f"VALUES ({escape_sql(nombre_var)}, {escape_sql(unidad)}, {escape_sql(sensor)});\n")

        # 5. Campo_estructural
        f.write("\n-- Tabla: Campo_estructural\n")
        # Asumiendo que los id_variable generados van del 4 al 103 (por los 3 iniciales ya insertados)
        ids_variables_disponibles = list(range(1, NUM_VARIABLES + 4)) 
        
        for nombre_tabla, lh_id in activos_data:
            for _ in range(random.randint(2, NUM_CAMPOS_POR_TABLA)):
                nombre_campo = fake.word() + "_" + random.choice(['val', 'avg', 'max', 'min'])
                tipo_dato = random.choice(['double', 'string', 'float', 'timestamp', 'int', 'boolean'])
                es_nullable = random.choice(['Sí', 'No'])
                es_temporal = random.choice(['Sí', 'No'])
                
                # Asignar un id_variable al azar o dejarlo NULL
                id_var = random.choice(ids_variables_disponibles) if random.random() > 0.3 else 'NULL'
                
                f.write(f"INSERT INTO Campo_estructural (nombre_campo, nombre_tabla, lakehouse_id, tipo_dato, es_nullable, es_temporal, id_variable) "
                        f"VALUES ({escape_sql(nombre_campo)}, {escape_sql(nombre_tabla)}, {escape_sql(lh_id)}, {escape_sql(tipo_dato)}, {escape_sql(es_nullable)}, {escape_sql(es_temporal)}, {id_var});\n")

        # 6. Metadata
        f.write("\n-- Tabla: Metadata\n")
        metadata_ids = []
        for _ in range(NUM_METADATA):
            id_saviia = f"ds_{fake.unique.word()}_{random.randint(1000,9999)}"
            metadata_ids.append(id_saviia)
            ws_id = random.choice(centros_ids)
            title = fake.catch_phrase()
            subject = random.choice(['Climatología', 'Meteorología', 'Hidrología', 'Oceanografía'])
            lat = str(fake.latitude())
            lon = str(fake.longitude())
            
            f.write(f"INSERT INTO Metadata (id_saviia, id_centro_estacion, title, kindofdata, subject, latitude, longitude) "
                    f"VALUES ({escape_sql(id_saviia)}, {escape_sql(ws_id)}, {escape_sql(title)}, 'Sensor Data', {escape_sql(subject)}, {escape_sql(lat)}, {escape_sql(lon)});\n")

        # 7. Gobernanza_Torre_Control
        f.write("\n-- Tabla: Gobernanza_Torre_Control\n")
        # Seleccionamos un subconjunto de Metadata para enviar a Torre de Control
        for id_saviia in random.sample(metadata_ids, int(NUM_METADATA * 0.4)):
            ws_id = random.choice(centros_ids)
            title = fake.catch_phrase()
            subject = random.choice(['Climatología', 'Meteorología', 'Hidrología'])
            lat = str(fake.latitude())
            lon = str(fake.longitude())
            access = random.choice(['Público', 'Restringido', 'Privado'])
            
            f.write(f"INSERT INTO Gobernanza_Torre_Control (id_saviia, id_centro_estacion, title, subject, latitude, longitude, accesslevel) "
                    f"VALUES ({escape_sql(id_saviia)}, {escape_sql(ws_id)}, {escape_sql(title)}, {escape_sql(subject)}, {escape_sql(lat)}, {escape_sql(lon)}, {escape_sql(access)});\n")

    print("✅ Script generado exitosamente: 'mock_data_inserts.sql'")

if __name__ == "__main__":
    generate_mock_sql()
