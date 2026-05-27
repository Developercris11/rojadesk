# 🧹 Guía de Limpieza - RojaDesk

## ✅ Lo Que Se Ha Hecho

1. **Organización de Archivos Completada**
   - Scripts antiguos → `scripts/archive/`
   - Scripts de test → `scripts/tests/`
   - Scripts de debug → `scripts/debug/`
   - Datos JSON/CSV → `data/sources/`
   - HTML exportados → `data/exports/`
   - Documentación → `docs/guides/`
   - Logs → `logs/`

2. **Documentación Creada**
   - README.md en cada carpeta
   - FILES_INVENTORY.md (inventario completo)
   - .gitignore actualizado

---

## 🗑️ Qué Puedes Eliminar de la Raíz (Ya Están Organizados)

### Scripts Antiguos (→ scripts/archive/)
```bash
rm analyze_abbeville_page.js
rm analyze_alabama_page.js
rm analyze_alm_directory.js
rm analyze_alm_structure.js
rm scrape_alabama_cities.js
rm scrape_alabama_detailed.js
rm scrape_alm_all_pages.js
rm scrape_alm_all_rows.js
rm scrape_alm_complete.js
rm scrape_alm_directory.js
rm scrape_alm_final.js
rm scrape_alm_full.js
rm scrape_alm_paginated.js
rm scrape_alm_production.js
rm scrape_alm_with_details.js
rm import_alabama_direct.js
rm import_alabama_municipalities.js
rm extract_cities.js
rm check_db.js
rm manual_migrate_leads.js
```

### Test Scripts (→ scripts/tests/)
```bash
rm test_abbeville.js
rm test_addr.js
rm test_bbb.js
rm test_body.js
rm test_bulk_delete.js
rm test_multiple_cities.js
rm test_scrape.js
```

### Debug Scripts (→ scripts/debug/)
```bash
rm debug-extractor.js
rm gmaps_test.js
rm tmp_inspect_findyello.js
rm tmp_inspect_findyello_profile.js
```

### Datos (→ data/sources/)
```bash
# OPCIONAL - mantener si se usan en importaciones

# JSON
rm alabama_cities_list.json
rm alabama_cities_officials_sample.json
rm alm_alabama_municipalities.json
rm alm_all_municipalities.json
rm alm_all_cities_complete.json
rm alm_municipalities_with_contacts.json
rm alm_complete_directory.json
rm alm_complete.json
rm alm_data_analysis.json

# CSV
rm alm_alabama_municipalities.csv
rm alm_all_cities_complete.csv
rm alm_complete.csv
rm alm_municipalities_final.csv
```

### HTML Exports (→ data/exports/)
```bash
rm abbeville_page.html
rm alabama_page.html
rm alm_directory.html
rm tmp_bbb_debug.html
```

### Documentación (→ docs/guides/)
```bash
rm AGENCY_INFORMATION_TOOL_GUIDE.md
rm ALABAMA_SCRAPER_FINDINGS.md
```

### Logs (→ logs/)
```bash
rm build_error_new.txt
rm debug_v1_activity.txt
rm dev_log.txt
rm dump.txt
rm prisma_err.log
rm prisma_out.txt
rm server_debug.log
```

### Backup/Otros
```bash
rm *.bak
rm next-env.d.ts
rm prisma.config.ts.bak
```

---

## ✅ Qué MANTENER en Raíz

**Archivos de Configuración:**
```
✅ .env (local)
✅ .env.example
✅ .gitignore
✅ vercel.json
✅ package.json
✅ package-lock.json
✅ next.config.mjs
✅ tsconfig.json
✅ postcss.config.js
✅ tailwind.config.ts
```

**Documentación Principal:**
```
✅ README.md
✅ STRUCTURE.md
✅ QUICK_REFERENCE.md
✅ PROJECT_TREE.md
✅ DEPLOYMENT.md
✅ MIGRATION_CHECKLIST.md
✅ DOCUMENTATION_INDEX.md
✅ FILES_INVENTORY.md (NUEVO)
✅ CLEANUP.md (ESTE ARCHIVO)
```

**Carpetas:**
```
✅ public/          - Assets estáticos
✅ src/             - Código fuente
✅ prisma/          - BD
✅ scripts/         - Scripts activos + archive/tests/debug/
✅ data/            - Datos + sources/exports/
✅ docs/            - Documentación + guides/
✅ logs/            - Logs
✅ tmp/             - Temporales (en .gitignore)
✅ .next/           - Build (en .gitignore)
✅ node_modules/    - Dependencias (en .gitignore)
```

---

## 📋 Opción 1: Limpiar Manualmente

Si prefieres controlar qué hacer, ejecuta estos comandos uno por uno:

```bash
# ARCHIVOS SEGUROS DE ELIMINAR (son temporales)
rm data/exports/*.html
rm logs/*.log logs/*.txt
rm bbb_test.png bbb_mobile_test.png
rm *.bak
rm next-env.d.ts
rm prisma.config.ts.bak
```

```bash
# SCRIPTS/DATOS - OPCIONAL (mantener si pueden ser útiles)
# Decidir si mantener o no:
rm scripts/archive/*
rm scripts/tests/*
rm scripts/debug/*
rm data/sources/*
```

---

## 📋 Opción 2: Script de Limpieza (PowerShell)

```powershell
# LIMPIAR TODO (CUIDADO - IRREVERSIBLE)

# HTML exports
Remove-Item -Path "data/exports/*.html" -Force

# Logs
Remove-Item -Path "logs/*.log" -Force
Remove-Item -Path "logs/*.txt" -Force

# Archivos temporales
Remove-Item -Path "*.bak" -Force
Remove-Item -Path "next-env.d.ts" -Force
Remove-Item -Path "prisma.config.ts.bak" -Force

# Imágenes de test
Remove-Item -Path "bbb_test.png" -Force
Remove-Item -Path "bbb_mobile_test.png" -Force

# Scripts antiguos (OPCIONAL)
Remove-Item -Path "scripts/archive/*" -Force
Remove-Item -Path "scripts/tests/*" -Force  
Remove-Item -Path "scripts/debug/*" -Force

# Datos antiguos (OPCIONAL)
Remove-Item -Path "data/sources/*" -Force
```

---

## 🔄 Flujo Recomendado

### 1. Primero - Limpiar Temporales (SEGURO)
```bash
# Eliminar estos archivos sin riesgo
rm data/exports/*.html
rm logs/*.log
rm logs/*.txt
rm bbb_*.png
rm *.bak
rm next-env.d.ts
rm prisma.config.ts.bak
```

### 2. Segundo - Revisar Carpetas Organizadas (OPCIONAL)
```bash
# Ver qué hay antes de eliminar
ls scripts/archive/
ls scripts/tests/
ls scripts/debug/
ls data/sources/
```

### 3. Tercero - Decidir Qué Mantener
- Scripts: ¿son necesarios para referencia?
- Datos: ¿se usan en importación?
- Documentación: ¿vigente?

### 4. Cuarto - Commit a Git
```bash
git add .
git commit -m "chore: organize and clean root directory for GitHub"
git push
```

---

## 📊 Resultado Después de Limpiar

### Antes
```
RojaDesk/
├── 50+ archivos sueltos en raíz
├── Desorganizado
└── Difícil de navegar
```

### Después
```
RojaDesk/
├── ✅ Raíz limpia (solo config + docs)
├── ✅ Scripts organizados
├── ✅ Datos organizados
├── ✅ Documentación clara
└── ✅ Listo para GitHub
```

---

## ⚠️ Advertencias

### ANTES DE ELIMINAR
1. **Backup**: Hacer backup local si es importante
2. **Revisar**: Verificar que los archivos están en las carpetas nuevas
3. **Git**: Los cambios se pueden revertir con Git si algo sale mal

### NO ELIMINAR
- ❌ `src/` - Código fuente
- ❌ `prisma/` - Base de datos
- ❌ `public/` - Assets
- ❌ Archivos de config (package.json, tsconfig.json, etc)
- ❌ `.git/` - Historial de Git

---

## ✅ Checklist Final

- [ ] Revisar FILES_INVENTORY.md
- [ ] Decidir qué limpiar
- [ ] Ejecutar limpieza
- [ ] Verificar estructura
- [ ] Git commit
- [ ] Git push

---

## 🎯 Resultado Final

Cuando termines:
- ✅ Raíz del proyecto limpia
- ✅ Archivos organizados
- ✅ Estructura clara
- ✅ Listo para GitHub
- ✅ Fácil de navegar y mantener

---

**Generado**: 2026-05-27  
**Versión**: 1.0  
**Proyecto**: RojaDesk - Limpieza de Archivos
