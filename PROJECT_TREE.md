# 🌳 RojaDesk - Estructura Visual Completa

## Árbol de Proyecto Completo

```
RojaDesk/
├── 📄 .env                           # Variables de entorno LOCAL (NO comitear)
├── 📄 .env.example                   # Template de variables (COMITEAR)
├── 📄 .gitignore                     # Archivos a ignorar
├── 📄 vercel.json                    # Config de Vercel
├── 📄 package.json                   # Dependencias y scripts
├── 📄 next.config.mjs                # Config de Next.js
├── 📄 tsconfig.json                  # Config de TypeScript
├── 📄 postcss.config.js              # Config de PostCSS/Tailwind
├── 📄 tailwind.config.ts             # Config de Tailwind CSS
│
├── 📋 README.md                      # Documentación principal
├── 📋 STRUCTURE.md                   # Guía de estructura
├── 📋 QUICK_REFERENCE.md             # Quick reference
├── 📋 MIGRATION_CHECKLIST.md         # Tareas pendientes
├── 📋 DEPLOY_SUMMARY.md              # Resumen de deploy
│
├── 📁 public/                        # Assets estáticos
│   └── *.png                         # Imágenes
│
├── 📁 prisma/                        # Base de datos
│   ├── schema.prisma                 # Schema de Prisma
│   └── dev.db                        # BD local (SQLite)
│
├── 📁 scripts/                       # Scripts de utilidad
│   ├── check_provo.js
│   ├── migrate_categories.js
│   └── ...
│
├── 📁 src/
│   ├── 📄 layout.tsx                 # Root layout
│   ├── 📄 page.tsx                   # Root page (login)
│   ├── 📄 globals.css                # Estilos globales
│   │
│   ├── 📂 app/
│   │   ├── 📂 (auth)/                # Grupo de rutas: Autenticación
│   │   │   ├── 📂 login/
│   │   │   │   └── page.tsx
│   │   │   └── 📂 register/
│   │   │       └── page.tsx
│   │   │
│   │   ├── 📂 (dashboard)/           # Grupo de rutas: Dashboard
│   │   │   ├── layout.tsx            # Layout compartido (con sidebar)
│   │   │   ├── page.tsx              # Dashboard home
│   │   │   │
│   │   │   ├── 📂 agencies/          # Módulo: Agencias
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── 📂 leads/             # Módulo: Leads
│   │   │   │   ├── page.tsx
│   │   │   │   └── 📂 [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── 📂 teams/             # Módulo: Teams
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── 📂 prospector/        # Módulo: Prospector
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── 📂 email/             # Módulo: Email
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── 📂 scraping/          # Módulo: Scraping
│   │   │   │   ├── page.tsx          # Index
│   │   │   │   ├── 📂 findyello/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── 📂 gmaps/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── 📂 alm/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   └── 📂 tools/             # Módulo: Herramientas
│   │   │       ├── page.tsx          # Index
│   │   │       ├── 📂 address-verification/
│   │   │       │   └── page.tsx
│   │   │       ├── 📂 minnesota-tax/
│   │   │       │   └── page.tsx
│   │   │       └── 📂 sales-tax/
│   │   │           └── page.tsx
│   │   │
│   │   └── 📂 api/
│   │       └── 📂 v1/                # API v1
│   │           ├── 📂 agencies/
│   │           │   ├── route.ts
│   │           │   ├── 📂 [id]/
│   │           │   │   └── route.ts
│   │           │   ├── 📂 stats/
│   │           │   │   └── route.ts
│   │           │   └── 📂 bulk/
│   │           │       └── route.ts
│   │           ├── 📂 leads/
│   │           ├── 📂 teams/
│   │           ├── 📂 scraping/
│   │           └── 📂 tools/
│   │
│   ├── 📂 components/
│   │   ├── 📄 index.ts                # Export principal
│   │   │
│   │   ├── 📂 common/                 # Componentes reutilizables
│   │   │   ├── 📄 index.ts
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   └── theme-toggle.tsx
│   │   │
│   │   ├── 📂 forms/                  # Componentes de formularios
│   │   │   ├── 📄 index.ts
│   │   │   ├── add-agency-form.tsx
│   │   │   ├── add-lead-form.tsx
│   │   │   └── add-team-form.tsx
│   │   │
│   │   └── 📂 ui/                     # Componentes UI (a crear)
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── card.tsx
│   │       └── modal.tsx
│   │
│   └── 📂 lib/
│       ├── 📄 api-routes.ts           # Rutas API centralizadas
│       │
│       ├── 📂 db/
│       │   └── 📄 index.ts            # Prisma singleton
│       │
│       ├── 📂 services/               # Business logic
│       │   ├── 📄 index.ts
│       │   ├── agency.service.ts
│       │   ├── lead.service.ts
│       │   ├── scraper.service.ts
│       │   └── email.service.ts
│       │
│       ├── 📂 constants/              # Constantes
│       │   ├── 📄 index.ts
│       │   ├── app.constants.ts
│       │   ├── dnb-constants.ts
│       │   ├── mn-tax-constants.ts
│       │   └── mn-city-county-map.ts
│       │
│       ├── 📂 utils/                  # Funciones utilitarias
│       │   ├── 📄 index.ts
│       │   ├── formatting.ts
│       │   ├── validation.ts
│       │   └── helpers.ts
│       │
│       └── 📂 types/                  # Tipos globales
│           └── index.ts
│
└── 📁 tmp/                            # Archivos temporales (gitignored)
    └── ...
```

---

## 🎯 Módulos por Nivel

### Nivel 1: Rutas Principales
```
app/
├── (auth)          → Sin sidebar
├── (dashboard)     → Con sidebar
└── api/v1/         → Endpoints
```

### Nivel 2: Features del Dashboard
```
(dashboard)/
├── agencies        → Gestión de agencias
├── leads           → Gestión de leads
├── teams           → Gestión de equipos
├── prospector      → Herramienta de prospectos
├── email           → Campañas de email
├── scraping        → Herramientas de scraping
└── tools           → Herramientas varias
```

### Nivel 3: Sub-módulos de Scraping
```
scraping/
├── findyello/      → Scraper de Findyello
├── gmaps/          → Scraper de Google Maps
└── alm/            → Alabama Municipalities
```

### Nivel 4: Sub-módulos de Tools
```
tools/
├── address-verification/
├── minnesota-tax/
└── sales-tax/
```

---

## 📊 Organización de Componentes

### common/
Componentes reutilizables en toda la app:
- Sidebar, Header, Navigation
- Tema (ThemeProvider, ThemeToggle)
- Layouts comunes

### forms/
Componentes de formularios por módulo:
- AddAgencyForm
- AddLeadForm
- AddTeamForm
- etc

### ui/ (A crear)
Componentes UI base:
- Button, Input, Card, Modal
- Tablas, Dropdowns, etc

### features/ (Opcional)
Componentes específicos por feature:
- Componentes complejos de cada módulo

---

## 🗄️ Organización de Servicios

### lib/services/
Lógica de negocio por módulo:

```
services/
├── agency.service.ts      # Operaciones con agencias
├── lead.service.ts        # Operaciones con leads
├── team.service.ts        # Operaciones con teams
├── scraper.service.ts     # Lógica de scraping
├── email.service.ts       # Lógica de email
└── index.ts              # Exports
```

---

## 📝 Archivos de Configuración

```
Raíz/
├── .env                   # Local (NO comitear)
├── .env.example           # Template (COMITEAR)
├── .gitignore            # Archivos ignorados
├── vercel.json           # Config Vercel
├── package.json          # Dependencias
├── next.config.mjs       # Config Next.js
├── tsconfig.json         # Config TypeScript
├── postcss.config.js     # Config PostCSS
└── tailwind.config.ts    # Config Tailwind
```

---

## 🚀 Flujo de Deployment

```
Local Development
    ↓
npm run build
    ↓
npm run lint
    ↓
npm run type-check
    ↓
Git push
    ↓
Vercel Auto-deploy
    ↓
Production
```

---

## 📈 Escalabilidad Futura

### Agregar Nuevo Módulo
```
1. Crear carpeta: src/app/(dashboard)/new-feature/
2. Crear página: new-feature/page.tsx
3. Crear API: src/app/api/v1/new-feature/route.ts
4. Crear servicio: src/lib/services/new-feature.service.ts
5. Crear componentes: src/components/features/new-feature/
```

### Agregar Nueva Versión de API
```
1. Crear carpeta: src/app/api/v2/
2. Copiar rutas de v1
3. Modificar según necesidad
4. Mantener v1 para backward compatibility
```

---

## 🔑 Path Aliases

```json
{
  "@/*": ["./src/*"],
  "@/components/*": ["./src/components/*"],
  "@/lib/*": ["./src/lib/*"],
  "@/app/*": ["./src/app/*"]
}
```

**Esto permite:**
```ts
// ✅ En lugar de:
import { Sidebar } from "../../../components/common/sidebar"

// ✅ Escribir:
import { Sidebar } from "@/components/common"
```

---

## 💾 Archivos Especiales

| Archivo | Propósito |
|---------|-----------|
| `.env.local` | Variables locales |
| `.env.example` | Template (comitear) |
| `vercel.json` | Config de Vercel |
| `STRUCTURE.md` | Documentación estructura |
| `QUICK_REFERENCE.md` | Guía rápida |
| `MIGRATION_CHECKLIST.md` | Tareas pendientes |

---

**Generado**: 2026-05-27  
**Versión**: 1.0  
**Proyecto**: RojaDesk CRM - Modular & Vercel-Ready 🚀
