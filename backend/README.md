# 🚀 BrandGen AI - Backend Server

Este es el servidor encargado de la orquestación de IA y la generación de imágenes profesionales usando **Google Imagen 4.0 Fast (Preview)**.

## 🛠️ Requisitos
- Node.js (v18 o superior)
- Una API Key de Google AI Studio configurada en un archivo `.env`

## 📦 Instalación
1. Entra a esta carpeta:
   ```bash
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```

## 🚀 Ejecución
Inicia el servidor con:
```bash
node server.js
```

El servidor escuchará en: `http://localhost:5000`

## 📁 Estructura
- `server.js`: El servidor Express principal con la lógica de Imagen 4.0 via REST.
- `probe.js`: Utilidad para auditar modelos disponibles.
- `check-models-api.js`: Diagnóstico de API directa.
- `verify-backend.js`: Script de prueba de extremo a extremo para el backend.

## 🔑 Configuración
Crea un archivo `.env` en esta carpeta. **Importante**: El archivo `.env` NO está en el repositorio por seguridad (para proteger tus llaves). 

### Cómo crearlo en Codespaces (Sin usar caracteres especiales):
Si no puedes usar el símbolo `>` en tu teclado, sigue estos pasos:
1. En el panel izquierdo de Codespaces, haz clic derecho sobre la carpeta `backend`.
2. Selecciona **"New File"**.
3. Ponle de nombre exactamente: `.env`
4. Pega este contenido dentro del archivo:
   ```env
   GEMINI_API_KEY=tu_clave_aqui
   ```
5. Guarda el archivo (**Ctrl+S**).

## 📁 Estructura
