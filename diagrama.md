### Definicion de las entidades (Tablas)

- **Centro_investigacion**:
    - `workspace_id` (PK)
    - `nombre`
    - `workspace_nombre`
    - `ambiente`

- **Centro_comparte_esquema**:
    - `workspace_id_origen` (PK, FK)
    - `workspace_id_destino` (PK, FK)
    - `tabla_referencia` (PK)
    - `capa` (PK)
    - `pct_campos_comunes`

- **Entorno_datos**:
    - `lakehouse_id` (PK)
    - `workspace_id` (FK)
    - `capa`
    - `tipo`
    - `ambiente`

- **Activo_fisico**:
    - `nombre_tabla` (PK)
    - `lakehouse_id` (PK, FK)
    - `total_registros`
    - `fecha_inicio`
    - `fecha_fin`
    - `col_temporal`

- **Variable**:
    - `id_variable` (PK - autoincremental)
    - `nombre_variable`
    - `unidad`
    - `sensor_origen`

- **Campo_estructural**:
    - `nombre_campo` (PK)
    - `nombre_tabla` (PK, FK)
    - `lakehouse_id` (PK, FK)
    - `tipo_dato`
    - `es_nullable`
    - `es_temporal`
    - `id_variable` (FK)

- **Metadata**:
    - `id_saviia` (PK)
    - `id_centro_estacion` (FK hacia `workspace_id`)
    - `id_tiporegistro`, `id_proceso`, `title`, `stationname`, `subtitle`, `depositor`, `dateofcollection`, `subject`, `keyword`, `author`, `authorname`, `dateofdeposit`, `language`, `kindofdata`, `dsdescription`, `dsdescriptionvalue`, `latitude`, `longitude`, `geographiccoverage`, `country`, `state`, `city`, `othergeographiccoverage`, `timeperiodcovered`, `timeperiodcoveredstart`, `timeperiodcoveredend`, `format`, `accesslevel`, `rights`, `license`, `alternativetitle`, `publication`, `notestext`.

- **Gobernanza_Torre_Control**:
    - `id_saviia` (PK)
    - `id_centro_estacion` (FK hacia `workspace_id`)
    - `id_tiporegistro`, `id_proceso`, `title`, `stationname`, `subject`, `keyword`, `author`, `latitude`, `longitude`, `geographiccoverage`, `country`, `timeperiodcoveredstart`, `timeperiodcoveredend`, `accesslevel`, `rights`, `license`, `origen_tabla`.

---

### Definicion de las relaciones

- **R1: Centro_investigacion -> Entorno_datos**
    - **Conecta**: Un Centro de Investigación (Estación) con sus Entornos de Datos (Lakehouse)
    - **Mediante**: `workspace_id`
    - **Cardinalidad**: 1 a Muchos (Un centro tiene muchos entornos; un entorno pertenece a un centro).

- **R2: Entorno_datos -> Activo_fisico**
    - **Conecta**: Un Entorno de Datos (Lakehouse) con sus Tablas/Activos.
    - **Mediante**: `lakehouse_id`
    - **Cardinalidad**: 1 a Muchos.

- **R3: Activo_fisico -> Campo_estructural**
    - **Conecta**: Una Tabla (Activo Físico) con sus respectivas Columnas (Campos).
    - **Mediante**: Clave compuesta `(nombre_tabla, lakehouse_id)`
    - **Cardinalidad**: 1 a Muchos.

- **R4: Activo_fisico -> Metadata / Gobernanza_torre_control**
    - **Conecta**: Una Tabla física con su Dataset lógico en el catálogo SAVIIA, que agrupa tablas por temática o sensor.
    - **Mediante**: Inferencia por nombre de tabla (nombre_tabla) o el uso de un campo especial como DatasetIdentifier conectando al id_saviia.
    - **Cardinalidad**: Muchos a 1.

- **R5: Metadata -> Gobernanza_Torre_Control**
    - **Conecta**: Un dataset local (ficha de Metadata) con su registro oficial en el catálogo centralizado de la Torre de Control.
    - **Mediante**: `id_saviia`
    - **Cardinalidad**: Muchos a 1.

- **R6: Centro_investigacion <-> Centro_comparte_esquema**
    - **Conecta**: Centros de investigación entre sí (Relación recursiva).
    - **Mediante**: `workspace_id_origen` y `workspace_id_destino` (ambos apuntan a `workspace_id`).
    - **Cardinalidad**: Muchos a Muchos (Un centro puede compartir con múltiples centros, y a la vez recibir de múltiples centros).

- **R7: Variable -> Campo_estructural**
    - **Conecta**: El catálogo semántico de magnitudes físicas (Variable) con la columna física exacta en la base de datos (Campo_estructural).
    - **Mediante**: La llave foránea `id_variable` inyectada en la tabla `Campo_estructural`.
    - **Cardinalidad**: 1 a Muchos.


```text
+------------------------------------------+
|         Gobernanza_Torre_Control         |
+------------------------------------------+
| PK: id_saviia                            |
| At: id_centro_estacion, title, author... |
+------------------------------------------+
                    ^
                    | (R5) REGISTRADO_EN
                    | 1 a Muchos (FK: id_saviia en origen)
                    |
+------------------------------------------+
|                Metadata                  |
+------------------------------------------+
| PK: id_saviia                            |
| FK: workspace_id (id_centro_estacion)    |
| At: title, kindofdata, subject, license  |
+------------------------------------------+
                    ^                                                      +------------------------------------------+
                    | (R4) PERTENECE_A_DATASET                             |                 Variable                 |
                    | Muchos a 1 (Sin FK explícita)                        +------------------------------------------+
                    |                                                      | PK: id_variable                          |
                    |                                                      | At: nombre_variable                      |
                    |                                                      | At: unidad, sensor_origen                |
                    |                                                      +------------------------------------------+
                    |                                                                           |
                    |                                                                           | (Puente Semántico)
                    |                                                                           | 1 a Muchos (FK en SQL)
                    |                                                                           v
+------------------------------------------+       (R3) TIENE_CAMPO        +------------------------------------------+
|              Activo_Fisico               | ----------------------------> |            Campo_estructural             |
+------------------------------------------+       1 a Muchos              +------------------------------------------+
| PK: nombre_tabla                         |       (FK explícita)          | PK: nombre_campo                         |
| PK/FK: lakehouse_id                      |                               | PK/FK: nombre_tabla                      |
| At: total_registros, fecha_inicio...     |                               | PK/FK: lakehouse_id                      |
+------------------------------------------+                               | FK: id_variable                          |
                    ^                                                      | At: tipo_dato, nullable, es_temporal     |
                    | (R2) CONTIENE                                        +------------------------------------------+
                    | 1 a Muchos (FK: lakehouse_id)
                    |
+------------------------------------------+
|              Entorno_datos               |
+------------------------------------------+
| PK: lakehouse_id                         |
| FK: workspace_id                         |
| At: capa (Bronze/Silver/Gold), ambiente  |
+------------------------------------------+
                    ^
                    | (R1) TIENE_CAPA
                    | 1 a Muchos (FK: workspace_id)
                    |
+------------------------------------------+
|           Centro_investigacion           | <-------------------------+
+------------------------------------------+                           |
| PK: workspace_id                         |                           |
| At: nombre, workspace_nombre, ambiente   |                           |
+------------------------------------------+                           |
                    ^                                                  |
                    |                                                  |
                    +------------------------------------------+       |
(R6)                |         Centro_comparte_esquema          |       |
COMPARTE_ESQUEMA    +------------------------------------------+       |
                    | PK/FK: workspace_id_origen               | ------+
                    | PK/FK: workspace_id_destino              | ------+ (Conecta a 2 Centros)
                    | PK: tabla_referencia                     |
                    | PK: capa                                 |
                    | At: pct_campos_comunes                   |
                    +------------------------------------------+
```