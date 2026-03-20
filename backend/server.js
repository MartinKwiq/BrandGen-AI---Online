import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as storage from "./storageManager.js";
import crypto from "crypto";
import path from "path";
import fs from "fs-extra";
import PDFDocument from "pdfkit";
import archiver from "archiver";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Configuraciones de Imagen API (Primaria y Fallback)
const PRIMARY_IMAGE_API_KEY = process.env.IMAGE_API_PRIMARY_KEY || process.env.GOOGLE_IMAGEN_API_KEY || GEMINI_API_KEY;
const FALLBACK_IMAGE_API_KEY = process.env.IMAGE_API_FALLBACK_KEY || GEMINI_API_KEY;

const DEFAULT_SYSTEM_INSTRUCTION = "Eres un experto en branding y diseño. Responde de forma clara, profesional y concisa.";

if (!GEMINI_API_KEY) {
    console.error("❌ ERROR: GEMINI_API_KEY no encontrada en el entorno.");
    process.exit(1);
}

if (!process.env.IMAGE_API_PRIMARY_KEY) {
    console.warn("⚠️ WARNING: IMAGE_API_PRIMARY_KEY is missing. Using fallback chain.");
}

if (!process.env.IMAGE_API_FALLBACK_KEY) {
    console.warn("⚠️ WARNING: IMAGE_API_FALLBACK_KEY is missing. Using fallback chain.");
}

const app = express();
// En Render, el puerto viene de la variable de entorno PORT
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// En producción aceptamos cualquier origen (el frontend está en el mismo servidor)
// En desarrollo restringimos a localhost
const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (isProduction || !origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Inicialización de múltiples instancias de Gemini para redundancia
const aiInstances = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_SECONDARY,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4
].filter(key => key && key.startsWith('AIza') && !key.includes('TU_'))
    .map(key => new GoogleGenerativeAI(key));

/**
 * Helper to call Gemini with automatic multi-key fallback and model fallback
 */
async function safeGenerateContent(options) {
    const { contents, systemInstruction, generationConfig } = options;
    // Modelos confirmados disponibles para las llaves del proyecto.
    // Fuente: listado directo de la API v1beta con las llaves configuradas.
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash"];

    if (aiInstances.length === 0) {
        throw new Error("No hay llaves API de Gemini válidas configuradas. Verifica tu .env");
    }

    let lastError = null;

    // Intentar primero con el modelo superior en todas las llaves, luego con el de respaldo
    for (const modelName of modelsToTry) {
        console.log(`📡 Probando con modelo: ${modelName}`);

        for (let i = 0; i < aiInstances.length; i++) {
            console.log(`🤖 Intento con llave ${i + 1}/${aiInstances.length} para ${modelName}...`);

            try {
                const model = aiInstances[i].getGenerativeModel({
                    model: modelName,
                    systemInstruction: typeof systemInstruction === 'string' ? systemInstruction : undefined,
                    generationConfig: generationConfig || {
                        maxOutputTokens: 1000,
                        temperature: 0.7
                    }
                });

                const result = await model.generateContent({ contents });
                const response = await result.response;

                if (i > 0 || modelName !== modelsToTry[0]) {
                    const projectLabel = (i === 1) ? "PROYECTO SECUNDARIO" : "POOL REDUNDANTE";
                    console.log(`✅ ÉXITO usando llave #${i + 1} (${projectLabel}) y modelo ${modelName}`);
                }

                return { text: response.text() };
            } catch (error) {
                lastError = error;
                const errorMsg = error.message || "";

                // Detectar errores de cuota o límites
                const isQuotaError =
                    error.status === 429 ||
                    errorMsg.includes("429") ||
                    errorMsg.includes("RESOURCE_EXHAUSTED") ||
                    errorMsg.includes("quota") ||
                    errorMsg.includes("limit");

                console.warn(`❌ Fallo en llave #${i + 1}:`, errorMsg.substring(0, 150));

                if (isQuotaError && i < aiInstances.length - 1) {
                    console.warn(`⚠️ Cuota agotada en esta llave. Probando siguiente llave del pool...`);
                    continue; // Probar la siguiente llave con el MISMO modelo
                }

                // Si llegamos aquí y no es error de cuota (ej: 400 Bad Request), 
                // o es la última llave para este modelo, salimos del bucle interno para intentar el siguiente modelo
                break;
            }
        }
    }

    throw lastError;
}


// No separaremos aiImage para mantener simplicidad si usan la misma clave


// Helper para delays
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Semaphore simple para serializar llamadas a Replicate y evitar 429
let isProcessingImage = false;

app.post("/api/generate", async (req, res) => {
    try {
        const { type, prompt, history, systemInstruction } = req.body;

        if (!prompt && type !== "chat") {
            return res.status(400).json({ error: "Prompt requerido" });
        }

        // ===============================
        // TEXTO (Gemini)
        // ===============================
        if (type === "text") {
            const response = await safeGenerateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            });

            return res.json({ result: response.text });
        }


        // ===============================
        // IMAGEN (Google Imagen 4.0 Fast via REST API)
        // ===============================
        if (type === "image") {
            // Esperar si ya hay una imagen procesándose para serializar
            while (isProcessingImage) {
                await delay(500);
            }

            isProcessingImage = true;

            try {
                // Delay para no saturar la cuota
                await delay(1000);

                const model = "imagen-4.0-fast-generate-001";
                // Usar la llave primaria estandarizada
                const apiKey = PRIMARY_IMAGE_API_KEY;
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;

                console.log(`Generando imagen con ${model} (REST)...`);
                console.log("Prompt:", prompt);

                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        instances: [
                            { prompt: prompt }
                        ],
                        parameters: {
                            sampleCount: 1
                        }
                    })
                });

                const data = await response.json();

                if (data.error) {
                    console.error("Error de API Imagen:", data.error);
                    throw new Error(data.error.message || "Error desconocido en la API de Imagen");
                }

                // Extraer imagen base64 de la respuesta REST
                const imageBase64 = data.predictions?.[0]?.bytesBase64Encoded;

                if (!imageBase64) {
                    console.error("Respuesta de API sin predicciones:", JSON.stringify(data, null, 2));
                    throw new Error("No se recibió imagen base64 de Google Imagen");
                }

                const imageUrl = `data:image/png;base64,${imageBase64}`;

                console.log("✓ Imagen generada exitosamente (REST)");

                return res.json({
                    logo: imageUrl,
                });
            } catch (error) {
                console.error("=== ERROR EN GENERACIÓN DE IMAGEN (REST) ===");
                console.error(error.message);

                const status = error.message.includes("429") ? 429 : 500;

                res.status(status).json({
                    error: "Error procesando solicitud de IA (Imagen)",
                    message: error.message,
                    isRateLimit: status === 429
                });
                return;
            } finally {
                isProcessingImage = false;
            }
            return;
        }

        // ===============================
        // IMAGEN FALLBACK (Google Imagen 4.0 Fast via REST API)
        // ===============================
        if (type === "image-fallback" || req.path === "/api/generate-image-fallback") {
            // Esperar si ya hay una imagen procesándose para serializar
            while (isProcessingImage) {
                await delay(500);
            }

            isProcessingImage = true;

            try {
                // Delay preventivo
                await delay(2000);

                const model = "imagen-4.0-fast-generate-001";
                // En fallback, usamos la llave de respaldo dedicada
                const apiKey = FALLBACK_IMAGE_API_KEY;
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;

                console.log(`[FALLBACK] Generando imagen con ${model} (REST)...`);
                
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        instances: [{ prompt: prompt }],
                        parameters: { sampleCount: 1 }
                    })
                });

                const data = await response.json();

                if (data.error) {
                    console.error("[FALLBACK] Error de API Imagen:", data.error);
                    throw new Error(data.error.message || "Error en fallback");
                }

                const imageBase64 = data.predictions?.[0]?.bytesBase64Encoded;

                if (!imageBase64) {
                    throw new Error("No se recibió imagen en fallback");
                }

                const imageUrl = `data:image/png;base64,${imageBase64}`;

                console.log("✓ [FALLBACK] Imagen generada exitosamente");

                return res.json({
                    logo: imageUrl,
                });
            } catch (error) {
                console.error("=== ERROR EN FALLBACK DE IMAGEN ===");
                console.error(error.message);

                res.status(500).json({
                    error: "Error en proveedor de respaldo",
                    message: error.message
                });
                return;
            } finally {
                isProcessingImage = false;
            }
        }


        // ===============================
        // CHAT (Gemini)
        // ===============================
        if (type === "chat") {
            const { projectId } = req.body;
            let fullHistory = history && history.length > 0 ? [...history] : [];

            // Si hay un projectId, intentar recuperar el historial real de Supabase
            if (projectId && (!history || history.length === 0)) {
                console.log(`📜 Recuperando historial de Supabase para proyecto ${projectId}...`);
                const savedMessages = await storage.getChatMessages(projectId);
                if (savedMessages.length > 0) {
                    fullHistory = savedMessages;
                }
            }

            // Si no hay historial ni prompt inicial, usar un prompt por defecto
            let contents = fullHistory.length > 0 ? [...fullHistory] : [{ role: "user", parts: [{ text: prompt }] }];

            // REGLA CRÍTICA DE GEMINI: El historial debe empezar con un mensaje de 'user'.
            while (contents.length > 0 && (contents[0].role === "model" || contents[0].role === "assistant" || contents[0].role === "assistant")) {
                console.log("🧹 Limpiando mensaje inicial de asistente para cumplir con reglas de Gemini.");
                contents.shift();
            }

            if (contents.length === 0) {
                contents = [{ role: "user", parts: [{ text: prompt }] }];
            }

            // Optimización de tokens: Limitar historial a los últimos 6 mensajes
            // (3 intercambios usuario/modelo)
            const recentMessages = contents.slice(-6);
            
            console.log(`📊 Historial de chat optimizado: Enviando ${recentMessages.length} mensajes a Gemini.`);

            const chatResponse = await safeGenerateContent({
                systemInstruction: systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
                contents: recentMessages,
                generationConfig: {
                    maxOutputTokens: 600,
                    temperature: 0.7
                }
            });

            // Persistir mensaje del usuario y respuesta en Supabase si hay projectId
            if (projectId && prompt) {
                await storage.saveChatMessage(projectId, 'user', prompt);
                await storage.saveChatMessage(projectId, 'assistant', chatResponse.text);
            }

            return res.json({ result: chatResponse.text });
        }

        res.json({ result: "" });

    } catch (error) {
        console.error("ERROR EN BACKEND:", error.message);
        res.status(500).json({
            error: "Error procesando solicitud de IA",
            details: error.message,
        });
    }
});


// ===============================
// GESTIÓN DE PROYECTOS (ALMACENAMIENTO)
// ===============================

// Listar todos los proyectos
app.get("/api/projects", async (req, res) => {
    try {
        const projects = await storage.getProjects();
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: "Error al listar proyectos" });
    }
});

// Guardar/Actualizar un proyecto
app.post("/api/projects", async (req, res) => {
    try {
        const project = req.body;
        if (!project.id) project.id = uuidv4();
        
        console.log("Attempting to save project...", project.id);
        
        // Primero guardamos en disco (e imágenes)
        const savedProject = await storage.saveProject(project);
        
        // Luego intentamos guardar en Supabase si está disponible
        try {
            if (savedProject) {
                await storage.saveBrandingProject(savedProject);
            }
        } catch (error) {
            console.warn("⚠️ ADVERTENCIA: No se pudo sincronizar con Supabase, pero el proyecto se guardó localmente:", error.message);
            // No lanzamos el error para que el frontend pueda continuar con la copia local
        }
        
        res.json(savedProject);
    } catch (error) {
        console.error("❌ CRITICAL ERROR SAVING PROJECT:", error);
        res.status(500).json({ 
            error: "Error al guardar el proyecto", 
            details: error.message,
            code: error.code || 'UNKNOWN_ERROR'
        });
    }
});

// Obtener un proyecto específico
app.get("/api/projects/:id", async (req, res) => {
    try {
        const project = await storage.getProjectById(req.params.id);
        if (!project) return res.status(404).json({ error: "Proyecto no encontrado" });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener el proyecto" });
    }
});

// Eliminar un proyecto
app.delete("/api/projects/:id", async (req, res) => {
    try {
        const success = await storage.deleteProject(req.params.id);
        if (!success) return res.status(404).json({ error: "Proyecto no encontrado" });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar el proyecto" });
    }
});

// Servir imágenes guardadas
app.get("/api/projects/:id/images/:imageName", (req, res) => {
    const { id, imageName } = req.params;
    const physicalPath = storage.getImagePhysicalPath(id, imageName);
    if (fs.existsSync(physicalPath)) {
        res.sendFile(physicalPath);
    } else {
        res.status(404).json({ error: "Imagen no encontrada" });
    }
});

// ===============================
// EXPORTACIÓN
// ===============================

// Exportar Branding a PDF Profesional
app.get("/api/projects/:id/export/pdf", async (req, res) => {
    try {
        const project = await storage.getProjectById(req.params.id);
        if (!project || !project.branding) {
            return res.status(404).json({ error: "Branding no encontrado en el proyecto" });
        }

        const { branding } = project;

        // --- LÓGICA DE FUSIÓN (IGUAL QUE EL FRONTEND) ---
        let currentColors = branding.colors;
        let currentTypography = branding.typography;
        let currentLogo = branding.logo;

        if (branding.selectedComponents) {
            const { colorProposalId, typographyProposalId, logoProposalId } = branding.selectedComponents;

            if (colorProposalId) {
                const p = branding.proposals.find(prop => prop.id === colorProposalId);
                if (p) {
                    currentColors = p.colorScheme.map((hex, i) => ({
                        name: i === 0 ? "Primario" : i === 1 ? "Secundario" : i === 2 ? "Acento" : `Color ${i + 1}`,
                        hex,
                        usage: i === 0 ? "Color principal" : "Color de apoyo"
                    }));
                }
            }

            if (typographyProposalId) {
                const p = branding.proposals.find(prop => prop.id === typographyProposalId);
                if (p) {
                    currentTypography = {
                        heading: { name: p.typography.titulo, usage: "Títulos" },
                        body: { name: p.typography.cuerpo, usage: "Cuerpo" }
                    };
                }
            }

            if (logoProposalId) {
                const p = branding.proposals.find(prop => prop.id === logoProposalId);
                if (p && p.logo) currentLogo = p.logo;
            }
        }

        const doc = new PDFDocument({
            margin: 0,
            size: 'A4',
            info: { Title: `Brand Book - ${branding.brandName}`, Author: 'Kwiq Branding' }
        });

        const filename = `BrandBook_${branding.brandName.replace(/\s+/g, '_')}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

        doc.pipe(res);

        const primaryColor = currentColors[0]?.hex || "#00d1b2";
        const secondaryColor = currentColors[1]?.hex || "#e481a5";
        const width = doc.page.width;
        const height = doc.page.height;

        // Función Helper para imagen local
        const addImageLocal = (src, x, y, opts) => {
            if (!src) return false;
            try {
                if (src.startsWith("data:image")) {
                    doc.image(src, x, y, opts);
                    return true;
                } else if (!src.startsWith("<svg")) {
                    const fileName = src.split("/").pop();
                    const filePath = storage.getImagePhysicalPath(project.id, fileName);
                    if (fs.existsSync(filePath)) {
                        doc.image(filePath, x, y, opts);
                        return true;
                    }
                }
            } catch (e) {
                console.error("Error embed image PDF:", e);
            }
            return false;
        };

        // --- PÁGINA 1: PORTADA ---
        doc.rect(0, 0, width, height).fill(primaryColor);
        doc.fillColor("white").font("Helvetica-Bold").fontSize(50).text(branding.brandName.toUpperCase(), 50, height / 2 - 50, { align: 'center', width: width - 100 });
        doc.font("Helvetica").fontSize(20).text(branding.tagline || "Brand Guidelines", 50, height / 2 + 20, { align: 'center', width: width - 100 });
        doc.fontSize(12).text(`Creado por Kwiq Branding • ${new Date().toLocaleDateString()}`, 50, height - 80, { align: 'center', width: width - 100 });

        // --- PÁGINA 2: LOGOTIPO ---
        doc.addPage({ margin: 50 });
        doc.rect(0, 0, width, 120).fill("#1e293b"); // Header oscuro
        doc.fillColor("white").font("Helvetica-Bold").fontSize(28).text("01. Identidad Primaria", 50, 50);

        doc.fillColor("#333333").font("Helvetica-Bold").fontSize(18).text("Logotipo Principal", 50, 160);
        doc.font("Helvetica").fontSize(11).fillColor("#666666").text("El logotipo es el elemento visual principal de la marca. Debe respetarse su área de resguardo y proporciones.", 50, 185, { width: 400 });

        doc.rect(50, 230, width - 100, 300).fill("#f8fafc").stroke();
        const logoAdded = addImageLocal(currentLogo, 50, 230, { fit: [width - 100, 300], align: 'center', valign: 'center' });
        if (!logoAdded) doc.fillColor("#94a3b8").fontSize(14).text("[Logo no disponible]", 50, 370, { align: 'center', width: width - 100 });

        // --- PÁGINA 3: SISTEMA DE COLOR ---
        doc.addPage({ margin: 50 });
        doc.rect(0, 0, width, 120).fill("#1e293b");
        doc.fillColor("white").font("Helvetica-Bold").fontSize(28).text("02. Sistema de Color", 50, 50);

        doc.fillColor("#333333").font("Helvetica-Bold").fontSize(18).text("Paleta Corporativa", 50, 160);
        doc.font("Helvetica").fontSize(11).fillColor("#666666").text("Estos colores definen la identidad cromática de la marca y deben utilizarse de forma consistente.", 50, 185, { width: 400 });

        if (currentColors && Array.isArray(currentColors)) {
            const boxWidth = Math.min((width - 100 - (currentColors.length - 1) * 20) / currentColors.length, 120);
            currentColors.forEach((color, i) => {
                const xPos = 50 + i * (boxWidth + 20);
                doc.rect(xPos, 240, boxWidth, boxWidth).fill(color.hex);
                doc.fillColor("#333333").font("Helvetica-Bold").fontSize(14).text(color.name, xPos, 240 + boxWidth + 15);
                doc.font("Helvetica").fillColor("#666666").fontSize(10).text(`HEX: ${color.hex.toUpperCase()}`, xPos, 240 + boxWidth + 35);
                doc.fontSize(9).text(color.usage, xPos, 240 + boxWidth + 50);
            });
        }

        // --- PÁGINA 4: TIPOGRAFÍA ---
        doc.addPage({ margin: 50 });
        doc.rect(0, 0, width, 120).fill("#1e293b");
        doc.fillColor("white").font("Helvetica-Bold").fontSize(28).text("03. Sistema Tipográfico", 50, 50);

        if (currentTypography) {
            const hName = currentTypography.heading?.name || "Primaria";
            const bName = currentTypography.body?.name || "Secundaria";

            doc.fillColor("#333333").font("Helvetica-Bold").fontSize(24).text(hName, 50, 160);
            doc.font("Helvetica").fontSize(11).fillColor(primaryColor).text(`USO: ${currentTypography.heading?.usage || "Títulos"}`, 50, 190);
            doc.fillColor("#111111").font("Helvetica").fontSize(32).text("Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0123456789", 50, 215, { width: 450 });

            doc.moveTo(50, 320).lineTo(width - 50, 320).stroke("#e2e8f0");

            doc.fillColor("#333333").font("Helvetica-Bold").fontSize(24).text(bName, 50, 350);
            doc.font("Helvetica").fontSize(11).fillColor(secondaryColor).text(`USO: ${currentTypography.body?.usage || "Cuerpo de texto"}`, 50, 380);
            doc.fillColor("#475569").fontSize(14).text("La tipografía secundaria facilita la lectura en bloques de texto prolongados. El veloz murciélago hindú comía feliz cardillo y kiwi. La cigüeña tocaba el saxofón detrás del palenque de paja.", 50, 405, { width: 450, lineGap: 6 });
        }

        // --- PÁGINA 5: ICONOGRAFÍA ---
        doc.addPage({ margin: 50 });
        doc.rect(0, 0, width, 120).fill("#1e293b");
        doc.fillColor("white").font("Helvetica-Bold").fontSize(28).text("04. Iconografía", 50, 50);

        doc.fillColor("#333333").font("Helvetica-Bold").fontSize(18).text("Set de Iconos", 50, 160);

        if (branding.icons && Array.isArray(branding.icons)) {
            const iconSize = 90;
            const marginX = 40;
            const marginY = 60;
            const iconsPerRow = 3;
            const startX = (width - (iconsPerRow * iconSize + (iconsPerRow - 1) * marginX)) / 2;

            branding.icons.forEach((icon, i) => {
                const row = Math.floor(i / iconsPerRow);
                const col = i % iconsPerRow;
                const x = startX + col * (iconSize + marginX);
                const y = 220 + row * (iconSize + marginY);

                doc.rect(x - 10, y - 10, iconSize + 20, iconSize + 20).fill("#f8fafc").stroke();
                const iconAdded = addImageLocal(icon.svg, x, y, { fit: [iconSize, iconSize] });
                if (!iconAdded && icon.svg.startsWith("<svg")) doc.rect(x, y, iconSize, iconSize).stroke("#cbd5e1");

                doc.fillColor("#475569").font("Helvetica-Bold").fontSize(10).text(icon.name, x - 10, y + iconSize + 15, { width: iconSize + 20, align: 'center' });
            });
        }

        doc.end();

    } catch (error) {
        console.error("Error generating PDF:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "error al generar el PDF", detail: error.message });
        }
    }
});

// Exportar Contenidos (Logo + Iconos) a ZIP
app.get("/api/projects/:id/export/contents", async (req, res) => {
    try {
        const project = await storage.getProjectById(req.params.id);
        if (!project || !project.branding) {
            return res.status(404).json({ error: "Branding no encontrado" });
        }

        const { branding } = project;

        // --- LÓGICA DE FUSIÓN PARA EL LOGO ---
        let currentLogo = branding.logo;
        if (branding.selectedComponents?.logoProposalId) {
            const p = branding.proposals.find(prop => prop.id === branding.selectedComponents.logoProposalId);
            if (p && p.logo) currentLogo = p.logo;
        }

        const archive = archiver("zip", { zlib: { level: 9 } });
        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", `attachment; filename=Contenidos_Marca_${branding.brandName.replace(/\s+/g, '_')}.zip`);

        archive.pipe(res);

        const addToZip = (source, name) => {
            if (!source) return;
            if (source.startsWith("data:image")) {
                const buffer = Buffer.from(source.split(",")[1], "base64");
                archive.append(buffer, { name });
            } else if (!source.startsWith("<svg")) {
                const fileName = source.split("/").pop();
                const filePath = storage.getImagePhysicalPath(project.id, fileName);
                if (fs.existsSync(filePath)) {
                    archive.file(filePath, { name });
                }
            }
        };

        // Añadir Logotipo
        if (currentLogo) {
            addToZip(currentLogo, "Logotipo_Principal.png");
        }

        // Añadir Iconos
        if (branding.icons && Array.isArray(branding.icons)) {
            branding.icons.forEach((icon) => {
                addToZip(icon.svg, `Iconos/${icon.name.replace(/\s+/g, '_')}.png`);
            });
        }

        await archive.finalize();
    } catch (error) {
        console.error("Error generating ZIP:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Error al generar el ZIP", detail: error.message });
        }
    }
});

// En producción, el backend también sirve el frontend compilado (un solo servidor)
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (isProduction) {
    const distPath = path.join(__dirname, '..', 'dist');
    app.use(express.static(distPath));
    // Cualquier ruta que no sea /api/* devuelve el index.html del frontend
    app.use((req, res, next) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(distPath, 'index.html'));
        } else {
            // Si es una ruta /api/* que no existe, pasamos al siguiente manejador o devolvemos 404
            res.status(404).json({ error: 'Endpoint no encontrado' });
        }
    });
    console.log(`📁 Sirviendo frontend estático desde: ${distPath}`);
}

app.listen(PORT, () => {
    const url = isProduction ? `https://tu-app.onrender.com` : `http://localhost:${PORT}`;
    console.log(`🚀 Servidor corriendo en ${url} [${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'}]`);

    // Auto-limpieza de proyectos antiguos
    storage.cleanupOldProjects(10); // Ejecutar al inicio
    setInterval(() => storage.cleanupOldProjects(10), 12 * 60 * 60 * 1000); // 12 horas
});

