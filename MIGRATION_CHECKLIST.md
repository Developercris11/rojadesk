# ✅ Checklist de Migración - RojaDesk

## 📋 Tareas Completadas

- [x] Crear estructura de carpetas modular
- [x] Organizar componentes por tipos
- [x] Crear archivos de índice (index.ts)
- [x] Configurar rutas de API v1
- [x] Crear archivos de configuración (vercel.json, .env.example)
- [x] Crear documentación (STRUCTURE.md, README.md)
- [x] Crear páginas base para todos los módulos

## 📝 Tareas Pendientes

### 1. Migrar Componentes
- [ ] Mover `sidebar.tsx` a `components/common/`
- [ ] Mover `theme-provider.tsx` a `components/common/`
- [ ] Mover `theme-toggle.tsx` a `components/common/`
- [ ] Mover `add-agency-form.tsx` a `components/forms/`
- [ ] Actualizar imports en los componentes

### 2. Migrar Servicios y Utilidades
- [ ] Copiar `prisma.ts` a `lib/db/`
- [ ] Copiar `utils.ts` a `lib/utils/formatting.ts`
- [ ] Copiar `constants.ts` a `lib/constants/app.constants.ts`
- [ ] Copiar constantes específicas:
  - [ ] `dnb-constants.ts` → `lib/constants/`
  - [ ] `mn-tax-constants.ts` → `lib/constants/`
  - [ ] `mn-city-county-map.ts` → `lib/constants/`
  - [ ] `mn-tax-calculator.ts` → `lib/services/`

### 3. Migrar Páginas Existentes
- [ ] Migrar `/dashboard/agencies` a `/(dashboard)/agencies`
- [ ] Migrar `/dashboard/leads` a `/(dashboard)/leads`
- [ ] Migrar `/dashboard/teams` a `/(dashboard)/teams`
- [ ] Migrar `/dashboard/prospector` a `/(dashboard)/prospector`
- [ ] Migrar `/dashboard/email` o `send-email` a `/(dashboard)/email`
- [ ] Migrar `/dashboard/minnesota-tax` a `/(dashboard)/tools/minnesota-tax`
- [ ] Migrar `/dashboard/address-verification` a `/(dashboard)/tools/address-verification`
- [ ] Migrar `/dashboard/findyello` a `/(dashboard)/scraping/findyello`
- [ ] Migrar `/dashboard/gmaps` a `/(dashboard)/scraping/gmaps`
- [ ] Migrar `/dashboard/alabama-municipalities` a `/(dashboard)/scraping/alm`
- [ ] Migrar `/dashboard/business-directory` a `/(dashboard)/scraping`

### 4. Actualizar API Routes
- [ ] Mover `/api/agencies` → `/api/v1/agencies`
- [ ] Mover `/api/leads` → `/api/v1/leads`
- [ ] Mover `/api/teams` → `/api/v1/teams`
- [ ] Mover `/api/scrape` → `/api/v1/scraping/scrape`
- [ ] Mover `/api/findyello-download` → `/api/v1/scraping/findyello-download`
- [ ] Mover `/api/gmaps-scrape` → `/api/v1/scraping/gmaps`
- [ ] Mover `/api/address-verification` → `/api/v1/tools/address-verification`
- [ ] Mover `/api/minnesota-tax` → `/api/v1/tools/minnesota-tax`
- [ ] Mover `/api/export` → `/api/v1/export`
- [ ] Mover `/api/migrate` → `/api/v1/migrate`

### 5. Actualizar Imports Globales
- [ ] Actualizar imports en `layout.tsx` (root)
- [ ] Actualizar imports en `(dashboard)/layout.tsx`
- [ ] Actualizar imports en todas las páginas
- [ ] Revisar y actualizar imports en API routes

### 6. Testing y Validación
- [ ] Ejecutar `npm run build` sin errores
- [ ] Ejecutar `npm run lint` sin warnings críticos
- [ ] Verificar que todas las rutas funcionen
- [ ] Probar login y dashboard
- [ ] Probar navegación entre módulos

### 7. Cleanup
- [ ] Eliminar carpeta `src/app/dashboard` (antigua)
- [ ] Eliminar archivos API antiguos
- [ ] Limpiar carpeta raíz (archivos de scraping temporales)
- [ ] Actualizar `.gitignore` si es necesario
- [ ] Crear `.env.local` desde `.env.example`

### 8. Deployment en Vercel
- [ ] Conectar repositorio a Vercel
- [ ] Configurar environment variables
- [ ] Configurar database (PlanetScale, Neon, etc)
- [ ] Deploy inicial
- [ ] Verificar que todo funcione en producción

## 🎯 Orden Recomendado

1. **Fase 1: Preparación**
   - Copiar archivos de componentes, lib y servicios
   - Actualizar imports

2. **Fase 2: Migración de Rutas**
   - Migrar páginas dashboard
   - Migrar API routes

3. **Fase 3: Testing**
   - Build y lint
   - Testing manual
   - Verificar imports

4. **Fase 4: Cleanup**
   - Eliminar archivos antiguos
   - Limpiar carpetas temporales
   - Actualizar documentación

5. **Fase 5: Deploy**
   - Conectar a Vercel
   - Configurar variables
   - Deploy a producción

---

## 💡 Notas Importantes

- **No eliminar archivos**: Mantener los archivos antiguos hasta completar la migración
- **Testing incremental**: Después de migrar cada componente, probar
- **Imports**: Usar path aliases (`@/...`) en todos los imports
- **Git**: Hacer commits después de cada fase
- **Comunicar**: Avisar al equipo sobre cambios en rutas y estructura

---

## 📞 Ayuda y Referencias

- STRUCTURE.md: Documentación completa de la estructura
- README.md: Guía de uso del proyecto
- API_ROUTES.ts: Rutas centralizadas de API

---

**Status**: 📍 En Progreso - Estructura base creada, pendiente migración de archivos
