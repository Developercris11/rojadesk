# 📐 Guía de Estructura Modular - RojaDesk

## 🎯 Principios

1. **Modularidad**: Cada feature es independiente
2. **Escalabilidad**: Fácil agregar nuevos módulos
3. **Mantenibilidad**: Código organizado y predecible
4. **Vercel-Ready**: Optimizado para deployment

---

## 📁 Estructura de Directorios

### `src/app/`

#### `(auth)/`
Rutas de autenticación sin sidebar
```
(auth)/
├── login/
│   └── page.tsx
└── register/
    └── page.tsx
```

#### `(dashboard)/`
Rutas con sidebar - grupo de layout
```
(dashboard)/
├── layout.tsx           # Layout compartido con sidebar
├── page.tsx             # Dashboard home
├── agencies/            # Gestión de agencias
│   └── page.tsx
├── leads/               # Gestión de leads
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
├── teams/               # Gestión de equipos
│   └── page.tsx
├── prospector/          # Herramienta de prospectos
│   └── page.tsx
├── email/               # Campañas de email
│   └── page.tsx
├── scraping/            # Herramientas de scraping
│   ├── page.tsx         # Index
│   ├── findyello/
│   │   └── page.tsx
│   ├── gmaps/
│   │   └── page.tsx
│   └── alm/
│       └── page.tsx
└── tools/               # Herramientas varias
    ├── address-verification/
    │   └── page.tsx
    ├── minnesota-tax/
    │   └── page.tsx
    └── sales-tax/
        └── page.tsx
```

#### `api/v1/`
API routes versionadas
```
api/
├── v1/
│   ├── agencies/
│   │   ├── route.ts         # GET, POST
│   │   ├── [id]/
│   │   │   └── route.ts     # GET, PUT, DELETE
│   │   ├── stats/
│   │   │   └── route.ts
│   │   └── bulk/
│   │       └── route.ts
│   ├── leads/
│   ├── teams/
│   ├── scraping/
│   └── tools/
└── _old/                    # Deprecated routes
```

### `src/components/`

```
components/
├── common/                  # Componentes reutilizables
│   ├── index.ts
│   ├── sidebar.tsx
│   ├── header.tsx
│   ├── navigation.tsx
│   └── footer.tsx
├── forms/                   # Componentes de formularios
│   ├── index.ts
│   ├── add-agency-form.tsx
│   ├── add-lead-form.tsx
│   └── add-team-form.tsx
├── ui/                      # Componentes UI (buttons, inputs, etc)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── modal.tsx
└── features/                # Componentes por feature (opcional)
    ├── agencies/
    ├── leads/
    └── teams/
```

### `src/lib/`

```
lib/
├── db/
│   └── index.ts            # Prisma singleton
├── services/                # Business logic
│   ├── index.ts
│   ├── agency.service.ts
│   ├── lead.service.ts
│   ├── scraper.service.ts
│   └── email.service.ts
├── constants/               # Constantes de la app
│   ├── index.ts
│   ├── app.constants.ts
│   ├── ui.constants.ts
│   ├── dnb-constants.ts
│   └── mn-tax-constants.ts
├── utils/
│   ├── index.ts
│   ├── formatting.ts
│   ├── validation.ts
│   └── helpers.ts
├── api-routes.ts           # Rutas API centralizadas
└── types/                   # Tipos globales
    └── index.ts
```

---

## 🔄 Flujo de Importes

### ❌ Evitar:
```ts
import { someFunction } from "../../../lib/utils/formatting"
import { Sidebar } from "../../../../components/common/sidebar"
```

### ✅ Preferir:
```ts
// Usar path aliases en tsconfig.json
import { someFunction } from "@/lib/utils"
import { Sidebar } from "@/components/common"
```

### `tsconfig.json` path aliases:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/app/*": ["./src/app/*"]
    }
  }
}
```

---

## 📝 Agregar Nuevo Módulo

### 1. Crear carpeta en dashboard
```bash
mkdir -p src/app/(dashboard)/my-feature
touch src/app/(dashboard)/my-feature/page.tsx
```

### 2. Crear API routes
```bash
mkdir -p src/app/api/v1/my-feature
touch src/app/api/v1/my-feature/route.ts
```

### 3. Crear componentes específicos (opcional)
```bash
mkdir -p src/components/features/my-feature
touch src/components/features/my-feature/index.ts
```

### 4. Crear servicio (si tiene lógica compleja)
```bash
touch src/lib/services/my-feature.service.ts
```

---

## 🚀 Deployment en Vercel

### Pre-requisitos:
- `.env.local` con variables de entorno
- `vercel.json` configurado
- `prisma/schema.prisma` actualizado

### Deploy:
```bash
# Linking local repo to Vercel project
vercel link

# Deploy to production
vercel deploy --prod

# Deploy preview
vercel deploy
```

### Env Variables en Vercel:
1. Ir a Project Settings → Environment Variables
2. Agregar:
   - `DATABASE_URL`: Tu URL de base de datos (PlanetScale, Neon, etc)
   - `NEXTAUTH_URL`: Tu dominio productivo
   - `NEXTAUTH_SECRET`: Secret seguro
   - Otros: API keys, tokens, etc

---

## 📦 Archivos Raíz Importantes

```
.gitignore              # Archivos a ignorar en git
.env.example            # Template de env variables
.env.local              # Variables locales (NO comitear)
vercel.json             # Configuración de Vercel
next.config.mjs         # Config de Next.js
tsconfig.json           # Config de TypeScript
package.json            # Dependencies y scripts
prisma/
└── schema.prisma       # Schema de base de datos
```

---

## 💡 Best Practices

### Naming
- Carpetas: `lowercase-with-hyphens`
- Componentes: `PascalCase`
- Funciones: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`

### File Organization
- Una componente por archivo (máximo)
- Interfaces/types cerca de donde se usan
- Servicios centralizados en `lib/services`

### Import Order
1. React/Next imports
2. Third-party libraries
3. Local imports (@/...)
4. Relative imports (../...)

---

## ✅ Checklist antes de Deploy

- [ ] `.env.local` con todas las variables
- [ ] Base de datos migrada (`prisma migrate deploy`)
- [ ] `npm run build` sin errores
- [ ] `npm run lint` sin warnings críticos
- [ ] `.gitignore` actualizado
- [ ] Secrets configurados en Vercel
- [ ] README.md documentado
