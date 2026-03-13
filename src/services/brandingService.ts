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

/**
 * UTILITY: Extract JSON from AI response text
 * Handles markdown blocks, preamble text and extra characters
 */
function extractJSON(rawText: string | null | undefined): string | null {
  if (!rawText) return null;

  try {
    // Aggressive extraction: search for the first '{' and last '}' in the entire text
    // This makes it immune to markdown markers or preamble text
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
      console.warn("extractJSON: could not locate JSON boundaries");
      console.log("RAW TEXT THAT FAILED:", rawText.substring(0, 500) + "...");
      return null;
    }

    const jsonCandidate = rawText.substring(firstBrace, lastBrace + 1);
    
    // Validate if it's at least looks like JSON
    if (jsonCandidate.length < 2) return null;
    
    return jsonCandidate;

  } catch (err) {
    console.error("extractJSON failure:", err);
    return null;
  }
}

/**
 * PRIMARY IMAGE PROVIDER
 */
async function generateImagePrimary(prompt: string): Promise<string> {
  console.log("Using primary image provider");
  const res = await callBackend({ type: "image", prompt });
  if (res && res.logo) return res.logo;
  throw new Error("Invalid response from primary provider");
}

/**
 * FALLBACK IMAGE PROVIDER
 */
async function generateImageFallback(prompt: string): Promise<string> {
  console.log("Fallback provider activated");
  const res = await callBackend({ type: "image-fallback", prompt });
  if (res && res.logo) return res.logo;
  throw new Error("Invalid response from fallback provider");
}

/**
 * UTILITY: Image Generation with Fallback
 */
async function generateImageWithFallback(prompt: string): Promise<string> {
  try {
    const url = await generateImagePrimary(prompt);
    if (!url) throw new Error("Primary provider returned empty");
    return url;
  } catch (err) {
    console.warn("Primary failed. Switching to fallback provider", err);
    return await generateImageFallback(prompt);
  }
}

/**
 * UTILITY: Sequential Image Generation Queue with Retry Logic
 */
async function generateImageQueue(
  prompts: string[], 
  onProgress?: (index: number, total: number) => void
): Promise<string[]> {
  const results: string[] = [];
  const total = prompts.length;

  console.log(`🚀 Starting image queue: ${total} tasks`);

  for (let i = 0; i < total; i++) {
    const prompt = prompts[i];
    let success = false;
    let attempts = 0;
    const maxAttempts = 2;

    while (!success && attempts < maxAttempts) {
      try {
        attempts++;
        if (onProgress) onProgress(i + 1, total);
        
        console.log(`📸 Generating image ${i + 1}/${total} (Attempt ${attempts}):`, prompt.substring(0, 50) + "...");
        
        // USO DEL SISTEMA DE FALLBACK
        const logoUrl = await generateImageWithFallback(prompt);
        
        if (logoUrl) {
          results.push(logoUrl);
          success = true;
          // Guard delay after success
          await new Promise(resolve => setTimeout(resolve, 2500));
        } else {
          throw new Error("Empty image URL returned");
        }
      } catch (error: any) {
        console.error(`❌ Image generation failed (${i + 1}/${total}):`, error);
        
        if (attempts < maxAttempts) {
          console.log("⏳ Rate limit or error hit. Waiting 10s before retry...");
          await new Promise(resolve => setTimeout(resolve, 10000));
        } else {
          console.warn("⚠️ Max attempts reached. Returning empty slot.");
          results.push(""); 
        }
      }
    }
  }

  console.log("🏁 Image queue completed");
  return results;
}

// ===== GENERATE BRANDING WITH MULTI-AGENT SYSTEM =====
export async function generateBranding(
  brandName: string,
  description: string,
  industry?: string,
  targetAudience?: string,
  chatContext?: string,
  onStep?: (step: string) => void,
  onProposalReady?: (proposal: any, index: number) => void
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

ESTRATEGIA DE MARCA (EL "BRAND DNA"):
Antes de las direcciones design, define la estrategia global que servirá como SOURCE OF TRUTH para todos los activos:
- brand_personality: Lista de 5 adjetivos que definen la esencia.
- brand_positioning: Una frase que define su lugar único en el mercado.
- brand_tone: Cómo habla la marca (ej: "Cercano pero experto").
- target_audience: Descripción concisa del cliente ideal.
- visual_style_guidelines: Reglas maestras de diseño que deben seguir todas las propuestas.
 
Tu tarea: Diseña 5 TERRITORIOS CREATIVOS RADICALMENTE DISTINTOS para esta marca.
IMPORTANTE: El DNA es la raíz común, pero cada territorio debe ser una interpretación visual opuesta o significativamente diferente de la otra. NUNCA generes propuestas similares.

REGLAS DE DIFERENCIACIÓN CRÍTICA:
1. **Diferenciación Cromática**: Cada propuesta DEBE tener una paleta de colores con una temperatura y contraste únicos. Si una es fría, otra debe ser cálida, otra monocromática, etc. Cero overlap visual.
2. **Diferenciación Tipográfica**: No repitas categorías de fuentes. Usa combinaciones únicas (Geo-Sans, Serif Humanista, Slab, Mono, etc.) para cada territorio.
3. **Diferenciación Conceptual**: Los conceptos de logo deben explorar caminos distintos (ej: Abstracto vs. Literal vs. Tipográfico vs. Heráldico).

DESIGN COHERENCE & COLOR PSYCHOLOGY RULES:
- Las paletas deben seguir la psicología del color vinculada al territorio:
  * Tech/Innovation: Cool blues, cyans, electric violets.
  * Premium/Luxury: Monocromáticos profundos, carbón, oro, tonos tierra refinados.
  * Friendly/Organic: Verdes claros, terracotas, amarillos cálidos, tonos pastel.
  * Bold/Startup: Colores vibrantes, alto contraste, neones acentuados.
- Cada paleta DEBE tener exactamente 6 colores con estos roles específicos:
  1. **Primary**: Identidad. 2. **Secondary**: Apoyo. 3. **Accent**: CTA. 4. **Neutral Light**: Superficies. 5. **Neutral Dark**: Texto. 6. **Background**: Fondo interfaz.

TYPOGRAPHY RULES:
- Parejas Headline + Body de Google Fonts. Prohibido usar "Inter" o "Open Sans" en todas las propuestas. Varía radicalmente.

TERRITORIOS OBLIGATORIOS (Diferenciación Extrema):
1. **Minimal Tech**: Funcionalidad, precisión, mucho aire, colores fríos, Sans-Serif Geométrica.
2. **Bold Startup**: Ruido visual positivo, colores vibrantes, tipografía pesada, concepto disruptivo.
3. **Premium Elegant**: Silencio visual, lujo, paleta sobria (negros, crema, oro), combinación Serif + Sans sofisticada.
4. **Friendly Modern**: Humano, cercano, formas orgánicas o redondeadas, colores cálidos y acogedores.
5. **Futuristic Digital**: Experimental, gradientes extremos (en descripción), tipografía digital, estética Cyber/Next-Gen.

REQUERIMIENTOS POR PROPUESTA:
1. **Name**: Título sugerente. 2. **Mood**: Nombre del territorio. 3. **Description**: Porqué encaja con el DNA. 4. **Colors**: 6 Hex con roles. 5. **Typography**: Pareja única (titulo/cuerpo). 6. **LogoDescription**: Concepto visual distinto. 7. **IconStyle**: Estilo único.
 
Responde ESTRICTAMENTE en este formato JSON:
{
  "brandStrategy": {
    "brand_personality": [], "brand_positioning": "", "brand_tone": "", "target_audience": "", "visual_style_guidelines": ""
  },
  "proposals": [
    {
      "name": "", "mood": "Minimal Tech", "description": "",
      "colors": [ {"name": "", "hex": "", "usage": ""} ],
      "typography": { "titulo": "Font Name", "cuerpo": "Font Name" },
      "logoDescription": "", "iconStyle": ""
    },
    ... (5 territorios)
  ]
}`;

    console.log('🎭 Agent 1: Director Creativo (Backend)...');
    const { result: rawCreativeResponse } = await callBackend({
      type: "text",
      prompt: directorPrompt
    });
    
    console.log("RAW AI RESPONSE (Agent 1):", rawCreativeResponse);

    const cleanedJSON = extractJSON(rawCreativeResponse);

    console.log("EXTRACTED JSON (Agent 1):", cleanedJSON);

    let creativeData = null;

    try {
      creativeData = cleanedJSON ? JSON.parse(cleanedJSON) : null;
    } catch (err) {
      console.error("JSON PARSE FAILED (Agent 1):", err);
    }

    if (!creativeData) {
      creativeData = {
        proposals: []
      };
    }

    console.log('PARSED JSON (Agent 1):', creativeData);

    // ===== VALIDACIÓN ESTRICTA DE PROPUESTAS =====
    // Fully populated fallbacks — each with unique colors + typography so the pipeline
    // always has rich data even when the AI response fails to parse.
    const DEFAULT_PROPOSALS = [
      {
        name: "Tech Minimal",
        mood: "Modern Digital",
        description: "Funcionalidad, precisión y elegancia digital.",
        logoDescription: "Geometría limpia, símbolo abstracto minimalista en azul eléctrico.",
        iconStyle: "Line icons, trazo fino y uniforme",
        colors: [
          { name: "Primary",       hex: "#0EA5E9", usage: "Identidad" },
          { name: "Secondary",     hex: "#38BDF8", usage: "Apoyo" },
          { name: "Accent",        hex: "#06B6D4", usage: "CTA" },
          { name: "Neutral Light", hex: "#F0F9FF", usage: "Superficies" },
          { name: "Neutral Dark",  hex: "#0C4A6E", usage: "Texto" },
          { name: "Background",    hex: "#FFFFFF", usage: "Fondo" }
        ],
        typography: { titulo: "Space Grotesk", cuerpo: "Inter" }
      },
      {
        name: "Bold Startup",
        mood: "Energetic Disruptive",
        description: "Energía, disrupción y presencia visual máxima.",
        logoDescription: "Símbolo dinámico con tensión visual, ángulos agresivos en naranja eléctrico.",
        iconStyle: "Filled icons, alto contraste",
        colors: [
          { name: "Primary",       hex: "#F97316", usage: "Identidad" },
          { name: "Secondary",     hex: "#FB923C", usage: "Apoyo" },
          { name: "Accent",        hex: "#FACC15", usage: "CTA" },
          { name: "Neutral Light", hex: "#FFF7ED", usage: "Superficies" },
          { name: "Neutral Dark",  hex: "#431407", usage: "Texto" },
          { name: "Background",    hex: "#0F0F0F", usage: "Fondo oscuro" }
        ],
        typography: { titulo: "Syne", cuerpo: "DM Sans" }
      },
      {
        name: "Premium Corporate",
        mood: "Elegant Trust",
        description: "Lujo silencioso, confianza y autoridad de mercado.",
        logoDescription: "Monograma serif en oro sobre fondo carbón profundo.",
        iconStyle: "Duotone icons, refinados",
        colors: [
          { name: "Primary",       hex: "#1C1917", usage: "Identidad" },
          { name: "Secondary",     hex: "#D4AF37", usage: "Apoyo" },
          { name: "Accent",        hex: "#A8956B", usage: "CTA" },
          { name: "Neutral Light", hex: "#FAF7F2", usage: "Superficies" },
          { name: "Neutral Dark",  hex: "#3D3530", usage: "Texto" },
          { name: "Background",    hex: "#F5F0EA", usage: "Fondo" }
        ],
        typography: { titulo: "Playfair Display", cuerpo: "Lora" }
      },
      {
        name: "Future AI",
        mood: "Experimental Innovation",
        description: "Vanguardia tecnológica, identidad del futuro.",
        logoDescription: "Forma generativa, gradiente futurista en violeta y cian.",
        iconStyle: "Gradient icons, estilo cyber",
        colors: [
          { name: "Primary",       hex: "#7C3AED", usage: "Identidad" },
          { name: "Secondary",     hex: "#06B6D4", usage: "Apoyo" },
          { name: "Accent",        hex: "#EC4899", usage: "CTA" },
          { name: "Neutral Light", hex: "#0F0F1A", usage: "Superficies oscuras" },
          { name: "Neutral Dark",  hex: "#E2DEFF", usage: "Texto claro" },
          { name: "Background",    hex: "#060612", usage: "Fondo" }
        ],
        typography: { titulo: "Orbitron", cuerpo: "Rajdhani" }
      },
      {
        name: "Human Friendly",
        mood: "Warm Accessible",
        description: "Calidez humana, accesibilidad y conexión real.",
        logoDescription: "Símbolo orgánico y redondeado, en verde terracota con formas fluidas.",
        iconStyle: "Rounded icons, trazo suave",
        colors: [
          { name: "Primary",       hex: "#16A34A", usage: "Identidad" },
          { name: "Secondary",     hex: "#D97706", usage: "Apoyo" },
          { name: "Accent",        hex: "#F59E0B", usage: "CTA" },
          { name: "Neutral Light", hex: "#F0FDF4", usage: "Superficies" },
          { name: "Neutral Dark",  hex: "#14532D", usage: "Texto" },
          { name: "Background",    hex: "#FFFBF5", usage: "Fondo cálido" }
        ],
        typography: { titulo: "Nunito", cuerpo: "Quicksand" }
      }
    ];

    // Extraer el array de propuestas desde la respuesta del Director
    let directions: any[] = [];
    if (creativeData.proposals && Array.isArray(creativeData.proposals)) {
      directions = creativeData.proposals;
    } else if (Array.isArray(creativeData)) {
      directions = creativeData;
    } else if (typeof creativeData === "object" && creativeData !== null) {
      const possibleArray = Object.values(creativeData).find(v => Array.isArray(v));
      if (possibleArray) directions = possibleArray as any[];
    }

    // Garantizar exactamente 5 propuestas
    if (!directions || directions.length !== 5) {
      console.warn(`Director Agent returned ${directions?.length ?? 0} proposals. Expected 5. Using defaults.`);
      directions = DEFAULT_PROPOSALS;
    }

    console.log("Total proposals:", directions.length);

    // ===== AGENTE 2:DISEÑADOR GRÁFICO (Generación de Activos) =====
    onStep?.('Diseñando propuestas de color y tipografía...');
    console.log('🎨 Agent 2: Asset Generation...');

    const proposals: any[] = [];

    // ===== UNIFIED BRAND DNA LAYER =====
    const strategy = creativeData.brandStrategy || {};
    const brandDNA = {
      personality: strategy.brand_personality || [],
      positioning: strategy.brand_positioning || "Elite brand positioning",
      audience: strategy.target_audience || "Targeted professional audience",
      visualGuidelines: strategy.visual_style_guidelines || "Modern and professional aesthetic"
    };

    // ===== OPTIONAL: SERVICE DISCOVERY (Icons) =====
    onStep?.('Identificando servicios clave del negocio...');
    let iconDefinitions: any[] = [];
    try {
      const serviceDiscoveryPrompt = `
        Identifica exactamente 6 servicios o categorías clave de este negocio: "${brandName}". 
        Descripción: "${description}". ${chatContext ? `Contexto extra: ${chatContext}` : ''}
        Responde ESTRICTAMENTE en JSON: {"services": [{"name": "Nombre", "description": "Concepto visual"}]}
      `;
      const discoveryRes = await callBackend({ type: "chat", prompt: serviceDiscoveryPrompt });
      const rawDiscovery = discoveryRes.result || discoveryRes;
      const cleanedDiscovery = extractJSON(typeof rawDiscovery === 'string' ? rawDiscovery : JSON.stringify(rawDiscovery));
      const discoveryData = cleanedDiscovery ? JSON.parse(cleanedDiscovery) : { services: [] };
      iconDefinitions = (discoveryData.services || []).slice(0, 6);
    } catch (e) {
      console.warn("⚠️ Error en descubrimiento de iconos, usando genéricos.");
      iconDefinitions = Array.from({ length: 6 }, (_, i) => ({ name: `Servicio ${i + 1}`, description: 'Icono profesional' }));
    }

    // ===== PHASE 1.5: SHARED ICON GENERATION =====
    // Generamos los iconos ANTES que las propuestas para que cada propuesta 
    // emitida tenga ya su iconografía completa.
    onStep?.('Generando set de íconos del negocio...');
    console.log('🎨 Generating shared icon set (6 calls)...');

    const sharedIconPrompts = iconDefinitions.map(def => `
      Minimalist flat vector icon for "${def.name}". Concept: ${def.description}. 
      Style: Clean line art, Lucide style, monochrome black on white background. No text.
    `);

    const sharedIconImages = await generateImageQueue(sharedIconPrompts, (current, total) => {
      onStep?.(`Generando ícono de negocio ${current}/${total}...`);
    });

    const sharedIcons: BrandIcon[] = sharedIconImages.map((img, idx) => {
      const def = iconDefinitions[idx];
      return img
        ? { name: def.name, svg: img, description: def.description || `Icono de ${def.name}` }
        : generateFallbackIcon(def?.name?.toLowerCase() || 'icon');
    });

    // ===== PHASE 2: PROPOSAL PROGRESSIVE GENERATION =====
    for (let i = 0; i < directions.length; i++) {
      const direction = directions[i];

      // Normalización de Colores
      const DEFAULT_PALETTE: BrandColor[] = [
        { name: "Primary", hex: "#2563EB", usage: "Color principal" },
        { name: "Secondary", hex: "#10B981", usage: "Apoyo" },
        { name: "Accent", hex: "#F59E0B", usage: "CTA" },
        { name: "Neutral Light", hex: "#F3F4F6", usage: "Fondos" },
        { name: "Neutral Dark", hex: "#374151", usage: "Texto" },
        { name: "Background", hex: "#FFFFFF", usage: "Fondo Base" }
      ];

      const rawColors = direction.colors || direction.paleta_colores || [];
      const normalizedColors: BrandColor[] = Array.isArray(rawColors) && rawColors.length >= 1
        ? rawColors.map((c: any) => ({
            name: c.name || c.nombre || "Color",
            hex: c.hex || c.hexadecimal || (typeof c === 'string' ? c : "#6366f1"),
            usage: c.usage || c.uso || "General"
          })).slice(0, 6)
        : DEFAULT_PALETTE;
      
      while (normalizedColors.length < 6) normalizedColors.push(DEFAULT_PALETTE[normalizedColors.length]);

      // Normalización de Tipografía
      const rawTypo = direction.typography || direction.tipografias || {};
      const titleFont = rawTypo.titulo || rawTypo.titulos || 'Inter';
      const bodyFont  = rawTypo.cuerpo  || rawTypo.cuerpos || 'DM Sans';
      const normalizedTypography = {
        heading: { name: titleFont, fontFamily: `${titleFont}, sans-serif`, usage: "Títulos", googleFont: titleFont.replace(/\s+/g, '+') },
        body: { name: bodyFont, fontFamily: `${bodyFont}, sans-serif`, usage: "Cuerpo", googleFont: bodyFont.replace(/\s+/g, '+') }
      };

      // Generación de Logotipo
      const logoPrompt = `Conceptual brand symbol for "${brandName}". Concept: ${direction.logoDescription || direction.mood}. Visual Personality: ${brandDNA.personality.join(', ')}. Minimal vector silhouette, high quality, white background. Palette: ${normalizedColors.map(c => c.hex).join(', ')}.`;
      
      onStep?.(`Generando logotipo para ${direction.name || `Propuesta ${i+1}`}...`);
      const logoResults = await generateImageQueue([logoPrompt]);
      const logoImageUrl = logoResults[0] || generatePlaceholderLogo(brandName, normalizedColors[0].hex);

      // Saneado de campos
      const safeStr = (v: any, f: string) => (typeof v === 'string' ? v : (v?.name || v?.text || f));

      const proposal = {
        id: i + 1,
        name: safeStr(direction.name, `Propuesta ${i + 1}`),
        description: safeStr(direction.description, "Diseño de identidad visual"),
        mood: safeStr(direction.mood, "moderno"),
        logo: logoImageUrl,
        colorScheme: normalizedColors.map(c => c.hex),
        colors: normalizedColors,
        typography: normalizedTypography,
        icons: sharedIcons,
        applications: ['Website', 'Redes sociales', 'Presentaciones', 'Firma Email']
      };

      proposals.push(proposal);

      if (onProposalReady) {
        onProposalReady(proposal, i);
      }
    }

    onStep?.('Integrando resultado final...');
    const mainProposal = proposals[0] || generateFallbackBranding(brandName, description).proposals[0];

    const brandingResult: BrandBranding = {
      brandName,
      tagline: generateTagline(brandName, description),
      logo: mainProposal.logo,
      colors: mainProposal.colors,
      typography: mainProposal.typography,
      icons: mainProposal.icons,
      strategy: creativeData.brandStrategy,
      proposals: proposals.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        colorScheme: p.colorScheme,
        typography: { titulo: p.typography.heading.name, cuerpo: p.typography.body.name },
        mood: p.mood,
        applications: p.applications,
        logo: p.logo,
        icons: p.icons
      })),
    };

    return brandingResult;

  } catch (error) {
    console.error('❌ Error in branding generation:', error);
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

FASE DE RESUMEN (ANTES DEL CIERRE):
Cuando decidas que tienes suficiente información, NO finalices inmediatamente. Primero, presenta un resumen estratégico breve del ADN de marca que has capturado.

Usa este formato:
"Esto es lo que entendí de tu marca:

• Industria: [Breve descripción]
• Público objetivo: [Quién es el cliente ideal]
• Personalidad: [3-5 adjetivos clave]
• Posicionamiento: [Diferenciador principal]
• Dirección visual: [Estética sugerida]"

MENSAJE DE CIERRE (MANDATORIO):
Inmediatamente después del resumen anterior, finaliza EXACTAMENTE con este texto:

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

export function testDirectorAgentParsing() {
  const simulatedResponse = `
\`\`\`json
{
  "brandStrategy": {
    "brand_personality": ["Innovadora","Eficiente","Profesional"]
  },
  "proposals": [
    { "name": "Tech Minimal", "mood": "Modern Digital" },
    { "name": "Bold Startup", "mood": "Energetic Disruptive" },
    { "name": "Premium Corporate", "mood": "Elegant Trust" },
    { "name": "Future AI", "mood": "Experimental Innovation" },
    { "name": "Human Friendly", "mood": "Warm Accessible" }
  ]
}
\`\`\`
  `;

  console.log("RAW AI RESPONSE (SIMULATED):\\n", simulatedResponse);

  const cleanedJSON = extractJSON(simulatedResponse);

  console.log("EXTRACTED JSON:\\n", cleanedJSON);

  let parsed = null;

  try {
    parsed = cleanedJSON ? JSON.parse(cleanedJSON) : null;
  } catch (err) {
    console.error("JSON PARSE FAILED:", err);
  }

  if (!parsed) {
    parsed = {
      proposals: []
    };
  }
  
  console.log("PARSED JSON:\\n", parsed);
}

