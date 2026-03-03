# 🎨 BrandGen AI

**Generador de Branding Profesional con Inteligencia Artificial**

Crea identidades de marca completas en minutos usando **Google Gemini AI**. Logos, paletas de colores, tipografías e iconos coherentes y profesionales, todo generado automáticamente.

---

## ✨ Características

- 🤖 **IA Conversacional**: Chatea para definir tu marca
- 🎨 **5 Propuestas Únicas**: Estilos variados para cada proyecto
- 🎯 **Logos SVG Profesionales**: Escalables y de alta calidad
- 🌈 **Paletas de 6 Colores**: Con códigos hex y usos específicos
- ✏️ **2 Tipografías Google Fonts**: Títulos + cuerpo de texto
- 🔷 **6 Iconos Coherentes**: Diseño concordante con el logo
- 📥 **Exportación Múltiple**: PDF, Figma, CSS
- 🔗 **Webhooks**: Integración con GoHighLevel
- 💾 **Almacenamiento Local**: Sin necesidad de backend (por ahora)

---

## 🚀 Inicio Rápido

### 1. Clonar el Repositorio
```bash
git clone <URL_DEL_REPO>
cd brandgen-ai
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Obtener API Key de Google AI Studio
1. Ve a https://aistudio.google.com/app/apikey
2. Inicia sesión con Google
3. Crea una API Key
4. Cópiala

### 4. Ejecutar en Localhost
```bash
npm run dev
```

Abre: **http://localhost:5173/**

### 5. Configurar API en la App
1. Haz clic en **Ajustes** ⚙️
2. Ve a **API**
3. Pega tu API Key de Google AI Studio
4. Haz clic en **Guardar**

---

## 📖 Uso

### Crear un Proyecto
1. Click en **"+ Nuevo Proyecto"**
2. Completa: Nombre, Industria, Descripción, Público objetivo
3. Click en **"Crear Proyecto"**

### Generar Branding
1. Click en **"✨ Generar Branding"**
2. Espera 10-30 segundos (la IA está trabajando)
3. Explora las **5 propuestas** generadas

### Exportar Guía de Marca
1. Selecciona tu propuesta favorita
2. Click en **"Ver Guía Completa"**
3. Descarga en PDF, Figma o CSS

---

## 🛠️ Tecnologías

| Tecnología | Uso |
|-----------|-----|
| **React 19** | Framework UI |
| **TypeScript** | Type safety |
| **Vite** | Build tool ultrarrápido |
| **Tailwind CSS 4** | Styling |
| **Google Gemini AI** | Generación de logos e iconos |
| **LocalStorage** | Persistencia de datos |

---

## 📂 Estructura del Proyecto

```
src/
├── components/        # Componentes React
│   ├── Dashboard.tsx
│   ├── ChatWidget.tsx
│   ├── ProposalCard.tsx
│   ├── BrandGuide.tsx
│   └── ...
├── services/         # Lógica de negocio
│   └── brandingService.ts  # Integración con Gemini AI
├── context/          # Estado global
│   └── BrandContext.tsx
├── types/            # TypeScript types
│   └── index.ts
└── App.tsx           # Entry point
```

---

## 🔑 Variables de Entorno (Opcional)

Para producción, crea un archivo `.env`:

```env
VITE_GOOGLE_AI_KEY=tu_api_key_aqui
```

Y usa en el código:
```typescript
const apiKey = import.meta.env.VITE_GOOGLE_AI_KEY;
```

---

## 🌐 Deploy

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel
```

### Netlify
1. Conecta tu repo a Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`

### GitHub Pages
```bash
npm run build
# Sube la carpeta dist/ a gh-pages branch
```

---

## 🔗 Integración con GoHighLevel

### Configurar Webhooks
1. En la app, ve a **Ajustes → Webhooks**
2. Agrega la URL de tu endpoint de GoHighLevel
3. Selecciona eventos: `project.created`, `branding.generated`, etc.

### Eventos Disponibles
- `project.created`
- `project.completed`
- `branding.generated`
- `export.completed`

---

## 🗺️ Roadmap

- [ ] Backend con Node.js + Express
- [ ] Base de datos (MongoDB/PostgreSQL)
- [ ] Autenticación de usuarios
- [ ] Editor de logos en vivo
- [ ] Exportar logos a PNG/JPG
- [ ] Integración completa GoHighLevel
- [ ] Pasarela de pago (Stripe)
- [ ] Multi-idioma

---

## 📄 Licencia

Proyecto privado - Todos los derechos reservados

---

## 👨‍💻 Desarrollado con ❤️

BrandGen AI - Branding inteligente para emprendedores modernos

**¿Preguntas?** Abre un issue en este repositorio
