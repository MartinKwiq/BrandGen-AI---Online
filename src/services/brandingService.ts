import type { BrandProject, BrandBranding, BrandProposal, BrandColor, BrandIcon, Message } from '../types';

// API Configuration
// En desarrollo: usa localhost:5000; En producción (Render): misma URL del servidor (relativa)
const BASE_URL = import.meta.env.DEV
  ? 'http://localhost:5000/api'
  : '/api';
const BACKEND_URL = `${BASE_URL}/generate`;

// Helper to call backend API
async function callBackend(data: any): Promise<any> {
  const response = await fetch(BACKEND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.details || errorData.error || `HTTP error! status: ${response.status}`;
    console.error("DEBUG BACKEND ERROR:", errorData);
    throw new Error(errorMessage);
  }

  return response.json();
}

// Initialize Gemini (Kept for UI compatibility but logic removed)
export function initializeAI(_apiKey: string): void {
  console.log('✅ AI service ready (using backend)');
}

// Check if AI is initialized (Always true if we assume backend is there)
export function isAIInitialized(): boolean {
  return true;
}

// Helper function to add delay between API calls
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate a summary from chat messages
export function generateContextSummary(messages: { role: string; content: string }[]): string {
  const userMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join('\n');

  const assistantMessages = messages
    .filter(m => m.role === 'assistant')
    .map(m => m.content)
    .join('\n');

  return `
Conversación del usuario:
${userMessages}

Respuestas del asistente:
${assistantMessages}
  `.trim();
}

// ===== GENERATE BRANDING WITH MULTI-AGENT SYSTEM =====
export async function generateBranding(
  brandName: string,
  description: string,
  industry?: string,
  targetAudience?: string,
  chatContext?: string,
  onStep?: (step: string) => void
): Promise<BrandBranding> {

  try {
    onStep?.('Analizando tu marca y definiendo direcciones creativas...');
    console.log('🎨 Starting Backend Branding Generation...', { brandName, industry });

    // ===== AGENTE 1: DIRECTOR CREATIVO =====
    const directorPrompt = `Actúa como un Director Creativo Senior de una agencia de branding de clase mundial.
 
ANÁLISIS DE MARCA:
- Nombre: ${brandName}
- Industria: ${industry || 'General'}
- Descripción: ${description}
- Público objetivo: ${targetAudience || 'General'}
${chatContext ? `\nContexto detallado de la entrevista: ${chatContext}` : ''}

ESTRATEGIA DE MARCA:
Antes de las direcciones design, define la estrategia global:
- brand_personality: Lista de 5 adjetivos que definen la esencia.
- brand_positioning: Una frase que define su lugar único en el mercado.
- brand_tone: Cómo habla la marca (ej: "Cercano pero experto").
- target_audience: Descripción concisa del cliente ideal.
- visual_style_guidelines: Reglas maestras de diseño que deben seguir todas las propuestas.
 
Tu tarea: Diseña 5 TERRITORIOS CREATIVOS RADICALMENTE DISTINTOS para esta marca. Cada propuesta debe representar un universo visual único y una estrategia de diseño diferenciada.

TERRITORIOS OBLIGATORIOS (Uno por propuesta):
1. **Minimal Tech**: Estética limpia, mucho espacio en blanco, enfoque en la funcionalidad y precisión.
2. **Bold Startup**: Enérgico, uso de colores vibrantes, tipografías pesadas, actitud valiente y disruptiva.
3. **Premium Elegant**: Refinado, paletas sobrias o monocromáticas, tipografías serif clásicas, sensación de lujo y exclusividad.
4. **Friendly Modern**: Accesible, formas redondeadas, colores cálidos, tipografías amigables, enfoque en la comunidad y cercanía.
5. **Futuristic Digital**: Innovador, gradientes complejos, efectos visuales de profundidad, tipografías geométricas experimentales.

REQUERIMIENTOS POR PROPUESTA:
1. **Nombre Creativo**: Título sugerente que refleje el territorio (ej: "Pureza Digital" para Minimal Tech).
2. **Mood/Estilo**: Debe ser EXACTAMENTE el nombre del territorio asignado.
3. **Concepto**: Explicación de 2 oraciones del porqué de este estilo para el negocio.
4. **Paleta de Colores**: 6 colores HEX con nombres y usos. Las paletas deben ser TOTALMENTE DIFERENTES entre propuestas (ej: No uses azules en todas).
5. **Tipografías**: PAREJA ÚNICA de Google Fonts (título y cuerpo). Usa combinaciones contrastantes como [Inter + Montserrat], [Playfair Display + Source Sans 3], [Sora + Outfit], [Fraunces + Roboto]. No repitas fuentes entre propuestas.
6. **Descripción Visual del Logo**: Detalles específicos sobre formas, abstracción y composición que encajen con el territorio.
7. **Estilo de Iconografía**: Describe iconos que sigan la lógica del territorio (ej: "Líneas finas" para Minimal, "Sólidos y gruesos" para Bold).
 
Responde ESTRICTAMENTE en este formato JSON (sin markdown, sin texto extra):
{
  "brandStrategy": {
    "brand_personality": ["...", "..."],
    "brand_positioning": "...",
    "brand_tone": "...",
    "target_audience": "...",
    "visual_style_guidelines": "..."
  },
  "proposals": [
    {
      "name": "...",
      "mood": "Minimal Tech",
      "description": "...",
      "colors": [ {"name": "...", "hex": "#...", "usage": "..."} ],
      "typography": { "titulo": "Font Name", "cuerpo": "Font Name" },
      "logoDescription": "...",
      "iconStyle": "..."
    },
    ... (hasta completar los 5 territorios)
  ]
}`;

    console.log('🎭 Agent 1: Director Creativo (Backend)...');
    const { result: creativeDirections } = await callBackend({
      type: "text",
      prompt: directorPrompt
    });
    console.log("RAW CREATIVE RESPONSE:", creativeDirections);
    // Clean JSON
    let cleanedJson = creativeDirections.trim();

    // Eliminar bloques markdown si la IA los incluyó a pesar de la instrucción
    cleanedJson = cleanedJson.replace(/```json/g, '').replace(/```/g, '');

    const creativeData = JSON.parse(cleanedJson);
    console.log('✅ Creative data parsed with diversity');

    // ===== AGENTE 2: DISEÑADOR GRÁFICO (Genera Logos con Imagen 3 via Backend) =====
    onStep?.('Diseñando propuestas de color y tipografía...');
    console.log('🎨 Agent 2: Graphic Designer (Backend Imagen 3)...');

    const proposals = [];
    let directions: any[] = [];

    if (creativeData.proposals && Array.isArray(creativeData.proposals)) {
      directions = creativeData.proposals;
    } else if (Array.isArray(creativeData)) {
      directions = creativeData;
    } else if (typeof creativeData === "object" && creativeData !== null) {
      const possibleArray = Object.values(creativeData).find(v => Array.isArray(v));
      if (possibleArray) directions = possibleArray as any[];
    }

    if (!directions.length) {
      throw new Error("No se generaron propuestas desde el backend");
    }

    for (let i = 0; i < Math.min(5, directions.length); i++) {
      const direction = directions[i];

      const rawColors = direction.colors || direction.paleta_colores || null;
      let normalizedColors: BrandColor[] | undefined;

      if (Array.isArray(rawColors)) {
        normalizedColors = rawColors.map((c: any) => ({
          name: c.name || c.nombre || "Color",
          hex: c.hex || c.hexadecimal || (typeof c === 'string' ? c : "#6366f1"),
          usage: c.usage || c.uso || "Uso general"
        }));
      }

      const rawTypography = direction.typography || direction.tipografias || null;
      let normalizedTypography = rawTypography;

      if (rawTypography && typeof rawTypography === "object") {
        const titleFont = rawTypography.titulo || rawTypography.titulos || "Inter";
        const bodyFont = rawTypography.cuerpo || "DM Sans";
        normalizedTypography = {
          heading: {
            name: titleFont,
            fontFamily: `${titleFont}, sans-serif`,
            usage: "Títulos",
            googleFont: titleFont.replace(/\s+/g, '+')
          },
          body: {
            name: bodyFont,
            fontFamily: `${bodyFont}, sans-serif`,
            usage: "Cuerpo",
            googleFont: bodyFont.replace(/\s+/g, '+')
          }
        };
      }

      const normalizedDirection = {
        ...direction,
        colors: normalizedColors,
        typography: normalizedTypography,
        visualDescription: direction.logoDescription || direction.descripcion_logo || direction.logo || 'Modern and professional design',
        iconStyle: direction.iconStyle || direction.sistema_iconos || "Flat design"
      };

      let logoImageUrl = '';

      if (i === 0) {
        onStep?.('Generando logotipos principales...');
        const logoPrompt = `Professional logo design for "${brandName}". ${normalizedDirection.visualDescription}. 
Style: ${normalizedDirection.mood || 'modern'}. 
Colors: ${normalizedDirection.colors?.map((c: any) => c.hex).join(', ') || '#6366f1, #8b5cf6'}. 
Industry: ${industry || 'technology'}. No text, vector style, white background.`;

        try {
          const imageRes = await callBackend({ type: "image", prompt: logoPrompt });
          logoImageUrl = imageRes.logo;
        } catch (error) {
          logoImageUrl = generatePlaceholderLogo(brandName, normalizedDirection.colors?.[0]?.hex || '#6366f1');
        }
      } else {
        logoImageUrl = generatePlaceholderLogo(brandName, normalizedDirection.colors?.[0]?.hex || '#6366f1');
      }

      const icons: BrandIcon[] = [];

      if (i === 0) {
        onStep?.('Creando sistema de iconos personalizados...');
        let iconDefinitions = [];
        try {
          const serviceDiscoveryPrompt = `
            Actúa como un Especialista en UX/UI y Estrategia de Marca.
            Marca: "${brandName}". Descripción del Negocio: "${description}".
            Contexto de la Entrevista: "${chatContext || ''}".

            TAREA: Identifica exactamente 6 servicios, secciones o categorías clave de este negocio para crear un sistema de iconos coherente para su interface digital.
            
            REGLAS:
            1. Usa nombres de servicios reales y descriptivos (max 3 palabras).
            2. Proporciona una explicación visual breve de cómo representar cada uno (ej: "Un engranaje con una lupa" para Soporte Técnico).
            3. Asegúrate de que los 6 servicios cubran el espectro completo del negocio descubierto en la entrevista.

            RESPONDE ESTRICTAMENTE EN JSON:
            {"services": [{"name": "Nombre", "description": "Concepto visual"}]}
          `;
          const discoveryRes = await callBackend({ type: "chat", prompt: serviceDiscoveryPrompt });
          const discoveryJson = discoveryRes.result || discoveryRes;
          const discoveryData = typeof discoveryJson === 'string'
            ? JSON.parse(discoveryJson.replace(/```json/g, '').replace(/```/g, ''))
            : discoveryJson;
          iconDefinitions = (discoveryData.services || []).slice(0, 6);
        } catch (e) {
          iconDefinitions = [
            { name: 'Servicio 1', description: 'Descripción 1' },
            { name: 'Servicio 2', description: 'Descripción 2' },
            { name: 'Servicio 3', description: 'Descripción 3' },
            { name: 'Servicio 4', description: 'Descripción 4' },
            { name: 'Servicio 5', description: 'Descripción 5' },
            { name: 'Servicio 6', description: 'Descripción 6' }
          ];
        }

        for (let j = 0; j < iconDefinitions.length; j++) {
          const def = iconDefinitions[j];
          const primaryHex = normalizedDirection.colors?.[0]?.hex || '#6366f1';

          const iconPrompt = `
            Diseña un icono de interface de usuario (UI) para el servicio: "${def.name}".
            Concepto Visual: ${def.description || def.name}.
            Directrices Estratégicas: ${creativeData.brandStrategy?.visual_style_guidelines || 'Modern and professional'}.
            Estilo de Sistema: ${normalizedDirection.iconStyle}.
            
            REGLAS DE COHERENCIA (Familia de Iconos):
            1. **Uniformes**: Este icono DEBE pertenecer a una familia de 6 iconos. Usa el mismo grosor de línea (stroke), mismo lenguaje geométrico y mismo nivel de detalle que un set profesional de iconos (estilo Phosphor o Lucide).
            2. **Estética**: Estilo vector limpio, minimalista y escalable.
            3. **Color**: Usa gradientes suaves basados en ${primaryHex}.
            4. **Fondo**: Centrado en un lienzo blanco limpio o transparente. Sin bordes innecesarios.
            5. **Prohibido**: NO incluyas texto, letras, ni sombras fotorealistas. No uses fondos complejos.
            6. **Output**: Ilustración digital de alta calidad, estilo profesional para aplicaciones modernas.
          `;

          try {
            const iconRes = await callBackend({
              type: "image",
              prompt: iconPrompt
            });
            icons.push({
              name: def.name,
              svg: iconRes.logo,
              description: def.description || `Icono de ${def.name}`
            });
            console.log(`✅ Icon ${j + 1}/6 (${def.name}) generated`);
            await delay(400); // Guard delay
          } catch (error) {
            console.error(`❌ Error generating icon ${j}:`, error);
            icons.push(generateFallbackIcon(def.name.toLowerCase()));
          }
        }
      } else {
        // Fallback for secondary proposals icons
        const fallbackIconNames = ['home', 'search', 'user', 'settings', 'heart', 'star'];
        for (const iconName of fallbackIconNames) {
          icons.push(generateFallbackIcon(iconName));
        }
      }

      // HELPER: Saneado de strings para evitar que objetos de la IA crasheen React
      const safeStr = (val: any, fallback: string = ""): string => {
        if (!val) return fallback;
        if (typeof val === 'string') return val;
        // Si la IA devolvió un objeto con keys como {nombre, estilo} o {texto, valor}
        if (typeof val === 'object') {
          return val.nombre || val.texto || val.name || val.text || val.valor || val.value || JSON.stringify(val);
        }
        return String(val);
      };

      proposals.push({
        id: i + 1,
        name: safeStr(normalizedDirection.name, `Propuesta ${i + 1}`),
        description: safeStr(normalizedDirection.description, `Diseño para ${brandName}`),
        mood: safeStr(normalizedDirection.mood, 'moderno'),
        logo: logoImageUrl,
        colorScheme: normalizedDirection.colors?.map((c: any) => c.hex || c) || ['#6366f1', '#8b5cf6', '#ec4899', '#f9fafb', '#111827', '#ffffff'],
        colors: normalizedDirection.colors || generateFallbackColors(),
        typography: normalizedDirection.typography || {
          heading: { name: 'Inter', fontFamily: 'Inter, sans-serif', usage: 'Títulos', googleFont: 'Inter' },
          body: { name: 'DM Sans', fontFamily: 'DM Sans, sans-serif', usage: 'Cuerpo', googleFont: 'DM+Sans' }
        },
        icons: icons,
        applications: ['Website', 'Redes sociales', 'Tarjetas de presentación', 'Email firma', 'Empaque'],
      });
    }

    if (!proposals.length) {
      throw new Error("No se generaron propuestas desde el backend");
    }

    const mainProposal = proposals[0];

    onStep?.('Finalizando tu identidad visual...');
    const brandingResult = {
      brandName,
      tagline: generateTagline(brandName, description),
      logo: mainProposal.logo,
      colors: mainProposal.colors,
      typography: mainProposal.typography,
      icons: mainProposal.icons,
      strategy: creativeData.brandStrategy, // Include the new brand strategy
      proposals: proposals.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        colorScheme: p.colorScheme,
        typography: {
          titulo: p.typography?.heading?.name || 'Inter',
          cuerpo: p.typography?.body?.name || 'DM Sans'
        },
        mood: p.mood,
        applications: p.applications,
        logo: p.logo,
        icons: p.icons
      })),
    };

    return brandingResult;

  } catch (error) {
    console.error('❌ Error in backend branding generation:', error);
    return generateFallbackBranding(brandName, description);
  }
}

function generatePlaceholderLogo(_brandName: string, color: string): string {
  return `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <rect width="200" height="200" rx="60" fill="${color}"/>
    <path d="M70 60 L70 140 M130 60 L90 100 L130 140 M70 100 L110 100" stroke="white" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </svg>`)}`;
}

// Helper function to generate fallback colors
function generateFallbackColors(): BrandColor[] {
  return [
    { name: 'Primario', hex: '#00d1b2', usage: 'Color principal' },
    { name: 'Secundario', hex: '#00b89c', usage: 'Elementos de apoyo' },
    { name: 'Acento', hex: '#e481a5', usage: 'Llamada a la acción' },
    { name: 'Fondo Claro', hex: '#f9fafb', usage: 'Backgrounds' },
    { name: 'Fondo Oscuro', hex: '#111827', usage: 'Texto sobre oscuro' },
    { name: 'Soporte', hex: '#ffffff', usage: 'Tarjetas' },
  ];
}

// Helper function to generate fallback icon
function generateFallbackIcon(name: string): BrandIcon {
  const iconPaths: Record<string, string> = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  };

  return {
    name,
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${iconPaths[name] || iconPaths.star}</svg>`,
    description: `Icono de ${name}`,
  };
}

// ===== AI CHAT RESPONSES (Via Backend) =====
export async function getAIResponse(messages: { role: string; content: string }[]): Promise<string> {
  try {
    let history = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // REGLA CRÍTICA DE GEMINI: El historial debe empezar con un mensaje de 'user'.
    while (history.length > 0 && history[0].role === 'model') {
      history.shift();
    }

    const systemInstruction = `Eres "Kwiq Branding", un estratega de marca de élite con años de experiencia en marketing y diseño.
Guía al usuario en una conversación estratégica de descubrimiento para definir su identidad de marca.

PRINCIPIOS DE OPERACIÓN:
1. **UNA PREGUNTA A LA VEZ**: NUNCA realices más de una pregunta por mensaje.
2. **BREVEDAD E IMPACTO**: Máximo 25 palabras. Sé directo, profesional, empático y autoritario.
3. **SIN CUESTIONARIOS**: No uses listas, viñetas ni bloques de preguntas. La conversación debe ser natural y fluida.
4. **DESCUBRIMIENTO ESTRATÉGICO**: Indaga sobre:
   - Propósito y qué hace el negocio (Empieza por aquí).
   - Servicios o productos específicos (OBLIGATORIO para el diseño de iconos).
   - Público objetivo y diferenciación estratégica.
   - Personalidad, tono y dirección visual deseada.
5. **PRECISIÓN**: Si una respuesta es vaga, haz una pregunta de seguimiento para profundizar.

FLUJO:
- Comienza siempre descubriendo el nombre del negocio y sus servicios/productos principales.
- Continúa con empatía y curiosidad profesional hasta que tengas una visión completa del ADN de la marca.
- No te limites a un número fijo de preguntas; pregunta lo necesario para ser un consultor de clase mundial.

MENSAJE DE CIERRE (MANDATORIO):
Cuando tengas toda la información estratégica para diseñar la marca, finaliza EXACTAMENTE con este texto:

"Perfecto. Ahora tengo una comprensión clara de tu marca.

Haz clic en **'✨ Generar Branding'** para ver cinco propuestas estratégicas diseñadas especialmente para tu negocio."`;

    const { result } = await callBackend({
      type: "chat",
      history,
      systemInstruction
    });

    return result;

  } catch (error) {
    console.error('❌ Error in backend AI chat:', error);
    return getFallbackChatResponse(messages);
  }
}

// ===== FALLBACK FUNCTIONS (When AI not available) =====
function generateFallbackBranding(brandName: string, description: string): BrandBranding {
  const colors: BrandColor[] = [
    { name: 'Primario', hex: '#00d1b2', usage: 'Color principal de marca' },
    { name: 'Secundario', hex: '#00b89c', usage: 'Elementos de apoyo' },
    { name: 'Acento', hex: '#e481a5', usage: 'Llamada a la acción' },
    { name: 'Fondo Claro', hex: '#f9fafb', usage: 'Fondos y backgrounds' },
    { name: 'Fondo Oscuro', hex: '#111827', usage: 'Texto sobre fondos oscuros' },
    { name: 'Soporte', hex: '#ffffff', usage: 'Tarjetas y contenedores' },
  ];

  const typography = {
    heading: {
      name: 'Inter',
      fontFamily: 'Inter, sans-serif',
      usage: 'Títulos y encabezados',
      googleFont: 'Inter'
    },
    body: {
      name: 'DM Sans',
      fontFamily: 'DM Sans, sans-serif',
      usage: 'Texto de párrafos',
      googleFont: 'DM+Sans'
    },
  };

  const icons: BrandIcon[] = [
    { name: 'home', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>', description: 'Home' },
    { name: 'search', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>', description: 'Search' },
    { name: 'user', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', description: 'User' },
    { name: 'settings', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/></svg>', description: 'Settings' },
    { name: 'heart', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>', description: 'Favorite' },
    { name: 'star', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>', description: 'Star' },
  ];

  // Generate a simple logo based on brand name
  const initial = brandName.charAt(0).toUpperCase();
  const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#6366f1"/>
        <stop offset="100%" style="stop-color:#8b5cf6"/>
      </linearGradient>
    </defs>
    <rect width="200" height="200" rx="40" fill="url(#grad)"/>
    <text x="100" y="140" font-family="Arial, sans-serif" font-size="100" font-weight="bold" fill="white" text-anchor="middle">${initial}</text>
  </svg>`;

  const moods = ['modern', 'classic', 'minimalist', 'bold', 'elegant'];
  const proposalNames = ['Innovador', 'Tradicional', 'Puro', 'Audaz', 'Sofisticado'];

  const proposals: BrandProposal[] = moods.map((mood, i) => ({
    id: i + 1,
    name: `${proposalNames[i]} ${brandName}`,
    description: `Una propuesta ${mood} que captura la esencia de ${brandName}. ${description}`,
    colorScheme: colors.map(c => c.hex),
    typography: {
      titulo: 'Inter',
      cuerpo: 'DM Sans'
    },
    mood,
    applications: ['Website', 'Business cards', 'Social media', 'Email signature'],
  }));

  return {
    brandName,
    tagline: generateTagline(brandName, description),
    logo,
    colors,
    typography,
    icons,
    proposals,
  };
}

function getFallbackChatResponse(messages: { role: string; content: string }[]): string {
  const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || '';
  const userMessageCount = messages.filter(m => m.role === 'user').length;

  if (userMessageCount === 0) {
    return "¡Hola! Soy Kwiq Branding, tu asistente de branding. Cuéntame sobre tu empresa o marca. ¿Qué nombre tiene y a qué se dedica?";
  }

  if (lastMessage.includes('logo') || lastMessage.includes('diseño')) {
    return "¿Te gustaría un diseño moderno y minimalista, o prefieres algo más tradicional y elegante?";
  }

  if (lastMessage.includes('color')) {
    return "Perfecto con los colores. ¿Tienes alguna preferencia de tipografía? ¿Prefieres fuentes modernas o clásicas?";
  }

  if (userMessageCount < 3) {
    return "¿Hay algo más que deba saber sobre tu marca? Por ejemplo, ¿quién es tu público objetivo o qué valores quieres transmitir?";
  }

  const closingResponses = [
    "Tengo toda la información que necesito. ¿Listo para generar tu branding? Haz clic en '✨ Generar Branding'",
    "Perfecto, tu marca suena muy interesante. ¿Quieres que genere las propuestas de branding ahora?",
    "¡Excelente! Con toda esta información podré crear un branding perfecto para ti. ¿Generamos las propuestas?",
  ];

  return closingResponses[Math.floor(Math.random() * closingResponses.length)];
}

function generateTagline(brandName: string, _description: string): string {
  const taglines = [
    `Innovación que transforma`,
    `Tu socio de confianza`,
    `Excelencia en cada detalle`,
    `Creatividad sin límites`,
    `Diseñado para ti`,
    `Calidad garantizada`,
    `El futuro de tu marca`,
  ];

  const index = Math.abs(brandName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % taglines.length;
  return taglines[index];
}

// ===== PROJECT MANAGEMENT (Via Backend) =====
export async function sendMessage(content: string, contextId: string = "default"): Promise<Message> {
  console.log(`💬 Enviando mensaje al backend... (Contexto: ${contextId})`);

  try {
    const response = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: content, contextId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Assuming the backend returns a Message object
    const messageResponse = await response.json();
    console.log('✅ Message sent and response received:', messageResponse);
    return messageResponse; // Return the actual message response
  } catch (error) {
    console.error('❌ Error sending message to backend:', error);
    // Fallback or error handling for sendMessage
    throw error; // Re-throw to indicate failure
  }
}

export async function saveProject(project: BrandProject): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });

    if (!response.ok) throw new Error('Error saving project to backend');

    // Al guardar, el backend devuelve el proyecto con las URLs de las imágenes actualizadas
    const savedProject = await response.json();
    console.log('✅ Project saved to backend:', savedProject.id);
  } catch (error) {
    console.error('❌ Error saving project:', error);
    // Fallback social to localStorage if backend fails
    const projects = await getProjects();
    const existingIndex = projects.findIndex(p => p.id === project.id);
    if (existingIndex >= 0) projects[existingIndex] = project;
    else projects.push(project);
    localStorage.setItem('brandgen_projects', JSON.stringify(projects));
  }
}

export async function getProjects(): Promise<BrandProject[]> {
  try {
    const response = await fetch(`${BASE_URL}/projects`);
    if (!response.ok) throw new Error('Error fetching projects from backend');
    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
    const stored = localStorage.getItem('brandgen_projects');
    return stored ? JSON.parse(stored) : [];
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/projects/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error deleting project from backend');
    console.log('✅ Project deleted from backend:', id);
  } catch (error) {
    console.error('❌ Error deleting project:', error);
    const projects = (await getProjects()).filter(p => p.id !== id);
    localStorage.setItem('brandgen_projects', JSON.stringify(projects));
  }
}

export function generateId(): string {
  return crypto.randomUUID();
}

// ===== API KEY MANAGEMENT (UI Compatibility) =====
export function saveApiKey(apiKey: string): void {
  localStorage.setItem('brandgen_api_key', apiKey);
}

export function getApiKey(): string | null {
  return localStorage.getItem('brandgen_api_key');
}

export function deleteApiKey(): void {
  localStorage.removeItem('brandgen_api_key');
}
