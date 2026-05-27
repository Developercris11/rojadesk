# Data Sources

Datos en formato JSON y CSV utilizados en el proyecto.

## JSON Files

### Alabama Data
- `alabama_cities_list.json` - Lista de ciudades de Alabama
- `alabama_cities_officials_sample.json` - Muestra de funcionarios de ciudades

### ALM (Alabama Municipalities) Data
- `alm_alabama_municipalities.json` - Municipios de Alabama
- `alm_all_municipalities.json` - Todos los municipios
- `alm_all_cities_complete.json` - Ciudades completas
- `alm_municipalities_with_contacts.json` - Municipios con contactos
- `alm_complete_directory.json` - Directorio completo
- `alm_complete.json` - Datos completos consolidados
- `alm_data_analysis.json` - Análisis de datos

## CSV Files

- `alm_alabama_municipalities.csv` - Municipios (CSV)
- `alm_all_cities_complete.csv` - Ciudades completas (CSV)
- `alm_complete.csv` - Datos completos (CSV)
- `alm_municipalities_final.csv` - Municipios finales (CSV)

## Excel Files

- `findyello_aruba_wwwfindyellocom_aruba_restaurants_sort_alpha.xlsx` - Restaurantes de Aruba

## Uso

```javascript
import data from '@/data/sources/alm_municipalities_final.json'
```

## Gestión

Para datos activos usar base de datos (Prisma).
Estos archivos son para referencia e importación inicial.
