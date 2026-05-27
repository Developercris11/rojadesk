# 📋 Inventario de Archivos - Limpieza de Raíz

## Estado: Archivos Organizados ✅

Este documento lista todos los archivos que estaban en la raíz del proyecto y cómo se han organizado.

---

## 📊 Resumen por Categoría

| Categoría | Cantidad | Ubicación | Acción |
|-----------|----------|-----------|--------|
| Scripts Archive | 14 | `scripts/archive/` | Mantener (referencia) |
| Test Scripts | 7 | `scripts/tests/` | Mantener/Modernizar |
| Debug Scripts | 4 | `scripts/debug/` | Limpiar después de usar |
| Data (JSON) | 9 | `data/sources/` | Mantener (importación inicial) |
| Data (CSV) | 4 | `data/sources/` | Mantener (importación inicial) |
| HTML Exports | 4 | `data/exports/` | Limpiar |
| Documentation | 2 | `docs/guides/` | Mantener |
| Logs | 8 | `logs/` | Limpiar |
| **TOTAL** | **52** | ✅ Organizados | - |

---

## 🗂️ Organización Realizada

### ✅ scripts/archive/
Archivos antiguos descontinuados para referencia:
```
analyze_abbeville_page.js
analyze_alabama_page.js
analyze_alm_directory.js
analyze_alm_structure.js
scrape_alabama_cities.js
scrape_alabama_detailed.js
scrape_alm_all_pages.js
scrape_alm_all_rows.js
scrape_alm_complete.js
scrape_alm_directory.js
scrape_alm_final.js
scrape_alm_full.js
scrape_alm_paginated.js
scrape_alm_production.js
scrape_alm_with_details.js
import_alabama_direct.js
import_alabama_municipalities.js
extract_cities.js
check_db.js
manual_migrate_leads.js
```

### ✅ scripts/tests/
Scripts de testing:
```
test_abbeville.js
test_addr.js
test_bbb.js
test_body.js
test_bulk_delete.js
test_multiple_cities.js
test_scrape.js
```

### ✅ scripts/debug/
Scripts de debugging y desarrollo:
```
debug-extractor.js
gmaps_test.js
tmp_inspect_findyello.js
tmp_inspect_findyello_profile.js
tmp_bbb_debug.html
```

### ✅ data/sources/
Datos en JSON y CSV:
```
JSON:
- alabama_cities_list.json
- alabama_cities_officials_sample.json
- alm_alabama_municipalities.json
- alm_all_municipalities.json
- alm_all_cities_complete.json
- alm_municipalities_with_contacts.json
- alm_complete_directory.json
- alm_complete.json
- alm_data_analysis.json

CSV:
- alm_alabama_municipalities.csv
- alm_all_cities_complete.csv
- alm_complete.csv
- alm_municipalities_final.csv

XLSX:
- findyello_aruba_wwwfindyellocom_aruba_restaurants_sort_alpha.xlsx
```

### ✅ data/exports/
HTML exportados:
```
abbeville_page.html
alabama_page.html
alm_directory.html
```

### ✅ docs/guides/
Documentación específica:
```
AGENCY_INFORMATION_TOOL_GUIDE.md
ALABAMA_SCRAPER_FINDINGS.md
```

### ✅ logs/
Archivos de log:
```
build_error_new.txt
debug_v1_activity.txt
dev_log.txt
dump.txt
prisma_err.log
prisma_out.txt
server_debug.log
```

---

## 🎯 Recomendaciones

### Para GitHub (COMITEAR)
- ✅ `scripts/` - Scripts activos
- ✅ `scripts/archive/` - Archivos antiguos (referencia)
- ✅ `scripts/tests/` - Tests del proyecto
- ✅ `scripts/debug/` - Debug scripts
- ✅ `data/sources/` - Datos iniciales
- ✅ `docs/guides/` - Documentación

### NO Comitear (en .gitignore)
- ❌ `data/exports/` - HTML exportados (temporales)
- ❌ `logs/` - Archivos de log
- ❌ Archivos .bak (backups)
- ❌ next-env.d.ts (generado)
- ❌ prisma.config.ts.bak (backup)

---

## 📝 Acción en .gitignore

```gitignore
# Logs
logs/
*.log

# HTML Exports
data/exports/

# Archivos temporales
*.bak
next-env.d.ts
prisma.config.ts.bak
```

---

## 🚀 Proximos Pasos

### 1. Revisar archivos
- [ ] Revisar `scripts/archive/` - ¿Son necesarios?
- [ ] Revisar `data/sources/` - ¿Datos actuales?
- [ ] Revisar `docs/guides/` - ¿Documentación vigente?

### 2. Limpiar
- [ ] Eliminar `data/exports/` (HTML temporales)
- [ ] Eliminar `logs/` (archivos de log antiguos)
- [ ] Eliminar `.bak` files

### 3. Modernizar
- [ ] Migrar `scripts/tests/` a Jest/Vitest
- [ ] Integrar tests en `src/__tests__/`

### 4. Commit
```bash
git add scripts/ data/ docs/ logs/
git commit -m "chore: organize scripts, tests, and data files"
git push
```

---

## 📊 Resultado Final

La raíz del proyecto ahora está limpia y organizada:
- ✅ Scripts separados por tipo
- ✅ Datos organizados por propósito
- ✅ Documentación centralizada
- ✅ Logs en carpeta específica
- ✅ Listo para GitHub

---

**Generado**: 2026-05-27  
**Versión**: 1.0  
**Proyecto**: RojaDesk - Limpieza de Archivos
