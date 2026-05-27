# ⚡ RojaDesk - Quick Reference Guide

## 🚀 Iniciar Proyecto

```bash
# Clonar / Ir al proyecto
cd c:\Users\csmar\Documents\RojaDesk

# Instalar dependencias
npm install

# Configurar env
cp .env.example .env.local

# Inicializar BD
npx prisma db push

# Ejecutar en desarrollo
npm run dev

# Abrir navegador
# http://localhost:3000
```

---

## 🗂️ Estructura Clave

```
src/
├── app/(auth)              → Login, Register (sin sidebar)
├── app/(dashboard)         → Dashboard y módulos (con sidebar)
│   ├── agencies/
│   ├── leads/
│   ├── teams/
│   ├── prospector/
│   ├── email/
│   ├── scraping/
│   └── tools/              → Address, MN Tax, Sales Tax
├── app/api/v1/             → API versionada (v1)
├── components/
│   ├── common/             → Sidebar, Theme, etc
│   └── forms/              → Formularios
├── lib/
│   ├── db/                 → Prisma
│   ├── services/           → Business logic
│   ├── constants/          → Constantes
│   ├── utils/              → Helpers
│   └── api-routes.ts       → URLs centralizadas
└── styles/                 → CSS global
```

---

## 📝 Agregar Nueva Feature

### 1. Crear página en dashboard
```bash
mkdir -p src/app/(dashboard)/my-feature
touch src/app/(dashboard)/my-feature/page.tsx
```

### 2. Crear API route (si la necesita)
```bash
mkdir -p src/app/api/v1/my-feature
touch src/app/api/v1/my-feature/route.ts
```

### 3. Crear componentes (opcional)
```bash
mkdir -p src/components/features/my-feature
touch src/components/features/my-feature/index.ts
```

### 4. Crear servicio (si tiene lógica)
```bash
touch src/lib/services/my-feature.service.ts
```

---

## 💻 Comandos Útiles

```bash
# Desarrollo
npm run dev                # Iniciar servidor

# Build
npm run build              # Build producción
npm start                  # Ejecutar producción
npm run type-check         # Validar tipos

# Base de datos
npx prisma db push         # Sincronizar schema
npx prisma migrate dev     # Crear migración
npx prisma studio         # UI de Prisma

# Linting
npm run lint               # Ejecutar linter
npm run format             # Formatear código

# Scraping
npm run scrape-findyello   # Script especial
```

---

## 🔗 Importes Correctos

### ✅ Hacer esto:
```ts
import { Sidebar } from "@/components/common"
import { prisma } from "@/lib/db"
import { APP_NAME } from "@/lib/constants"
```

### ❌ No hacer esto:
```ts
import { Sidebar } from "../../../components/common/sidebar"
import prisma from "../../../../src/lib/db"
```

---

## 📡 API Routes

### Rutas Centralizadas
```ts
import { API_ROUTES } from "@/lib/api-routes"

// Uso:
fetch(API_ROUTES.agencies)
fetch(API_ROUTES.leads)
fetch(API_ROUTES.teams)
```

### Estructura de APIs
```
/api/v1/
├── agencies/
│   ├── route.ts          → GET, POST
│   └── [id]/route.ts     → GET, PUT, DELETE
├── leads/
├── teams/
├── scraping/
└── tools/
```

---

## 🛡️ Variables de Entorno

### Local (.env.local)
```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-123
```

### Vercel (.env.production)
```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://tudominio.com
NEXTAUTH_SECRET=secreto-largo-aleatorio
```

Ver `.env.example` para todas las variables

---

## 🧪 Testing

```bash
# Validar tipos
npm run type-check

# Linting
npm run lint

# Build test
npm run build

# Dev test
npm run dev
```

---

## 📦 Componentes Comunes

### Importar
```ts
import { 
  Sidebar, 
  ThemeProvider, 
  ThemeToggle 
} from "@/components/common"
```

### Formularios
```ts
import { AddAgencyForm } from "@/components/forms"
```

---

## 🗄️ Database (Prisma)

### Actualizar schema
```bash
# Editar: prisma/schema.prisma
# Crear migración:
npx prisma migrate dev --name nombre_cambio

# Sincronizar sin migración:
npx prisma db push
```

### Abrir Prisma Studio
```bash
npx prisma studio
# http://localhost:5555
```

---

## 🚀 Deploy en Vercel

### 1. Conectar repo
```bash
vercel link
```

### 2. Configurar variables
```bash
vercel env add DATABASE_URL
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
```

### 3. Deploy
```bash
vercel deploy --prod
```

---

## 📚 Documentación Completa

- `README.md` - Overview del proyecto
- `STRUCTURE.md` - Estructura detallada
- `MIGRATION_CHECKLIST.md` - Tareas de migración
- `DEPLOY_SUMMARY.md` - Resumen de deploy

---

## 🐛 Troubleshooting

### Build falla
```bash
# Limpiar cache
rm -rf .next
npm run build
```

### Errores de imports
```bash
# Verificar paths en tsconfig.json
# Usar @/ en lugar de rutas relativas
```

### DB no sincroniza
```bash
# Sincronizar manual
npx prisma db push

# Ver migraciones
npx prisma migrate status
```

---

## ✨ Tips

- Usar `@/` para imports (path alias)
- Servicios en `lib/services/`
- Componentes reutilizables en `components/common/`
- APIs en `/api/v1/`
- Constantes en `lib/constants/`
- Componentes específicos al lado de la página

---

**Última actualización**: 2026-05-27  
**Versión**: 1.0  
**Proyecto**: RojaDesk CRM
