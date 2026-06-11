# Sistema de Gestión de Consorcio

Aplicación web minimalista para gestión de consorcios. Funciona 100% en el navegador (localStorage), sin servidor ni base de datos externa.

## Tecnologías
- React 19 + lucide-react
- localStorage (sin backend)
- Compatible con Netlify

## Cómo desplegar en Netlify

### Opción 1 — Desde el panel de Netlify (recomendado)
1. Subí el proyecto a GitHub (o arrastrá la carpeta `build/` al panel de Netlify)
2. En Netlify: "Add new site" → "Import from Git"
3. Build command: `npm run build`
4. Publish directory: `build`
5. Deploy ✓

### Opción 2 — Deploy manual
```bash
npm install
npm run build
# Subir la carpeta /build a Netlify Drop (drag & drop en app.netlify.com)
```

## Desarrollo local
```bash
npm install
npm start
# Abre http://localhost:3000
```

## Módulos incluidos
- **Dashboard**: Resumen general del consorcio
- **Unidades**: Alta, baja y modificación de unidades
- **Personas**: Propietarios e inquilinos con validación de DNI/Email
- **Gastos**: Gastos ordinarios y extraordinarios por período
- **Liquidación**: Distribución proporcional de gastos por unidad
- **Cobranzas**: Registro y seguimiento de pagos
- **Reportes**: Exportación CSV, resumen multi-período

## Notas
- Los datos se guardan en el localStorage del navegador
- Para un entorno multiusuario real, se requeriría backend (Supabase, Firebase, etc.)
- Los datos de demo se cargan automáticamente la primera vez
