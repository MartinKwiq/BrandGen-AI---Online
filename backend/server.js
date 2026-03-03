import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as storage from "./storageManager.js";
import path from "path";
import fs from "fs-extra";
import PDFDocument from "pdfkit";
import archiver from "archiver";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("❌ ERROR: GEMINI_API_KEY no encontrada en el entorno.");
    process.exit(1);
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
    const { contents, systemInstruction } = options;
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
                    systemInstruction: typeof systemInstruction === 'string' ? systemInstruction : undefined
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
                // Prioridad absoluta a la llave de imagen, si no existe usar la primaria de texto
                const apiKey = process.env.GOOGLE_IMAGEN_API_KEY || GEMINI_API_KEY;
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

                res.status(500).json({
                    error: "Error procesando solicitud de IA (Imagen)",
                    details: error.message
                });
                return;
            } finally {
                isProcessingImage = false;
            }
            return;
        }


        // ===============================
        // CHAT (Gemini)
        // ===============================
        if (type === "chat") {
            let contents = history && history.length > 0 ? [...history] : [{ role: "user", parts: [{ text: prompt }] }];

            // REGLA CRÍTICA DE GEMINI: El historial debe empezar con un mensaje de 'user'.
            while (contents.length > 0 && (contents[0].role === "model" || contents[0].role === "assistant")) {
                console.log("🧹 Limpiando mensaje inicial de asistente para cumplir con reglas de Gemini.");
                contents.shift();
            }

            // Si después de limpiar quedó vacío, usamos el prompt actual como único mensaje
            if (contents.length === 0) {
                contents = [{ role: "user", parts: [{ text: prompt }] }];
            }

            const chatResponse = await safeGenerateContent({
                systemInstruction:
                    systemInstruction ||
                    "Eres un asistente experto en branding. Responde claro y directo.",
                contents: contents,
            });

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
        if (!project.id) project.id = Date.now().toString(36);
        const savedProject = await storage.saveProject(project);
        res.json(savedProject);
    } catch (error) {
        console.error("Error al guardar proyecto:", error);
        res.status(500).json({ error: "Error al guardar el proyecto" });
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
            margin: 50,
            size: 'A4',
            info: { Title: `Brand Guide - ${branding.brandName}`, Author: 'BrandGen AI' }
        });

        const filename = `Branding_${branding.brandName.replace(/\s+/g, '_')}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

        doc.pipe(res);

        // --- PORTADA ---
        const primaryColor = currentColors[0]?.hex || "#6366f1";
        doc.rect(0, 0, doc.page.width, 300).fill(primaryColor);
        doc.fillColor("white").fontSize(40).text(branding.brandName, 50, 120);
        doc.fontSize(18).text(branding.tagline || "", 50, 175);
        doc.fontSize(10).text(`Guía de Identidad Visual • ${new Date().toLocaleDateString()}`, 50, 260);

        // --- SECCIÓN 1: LOGOTIPO ---
        doc.fillColor("black").fontSize(20).text("1. Logotipo Principal", 50, 340);
        doc.moveTo(50, 365).lineTo(550, 365).stroke("#eeeeee");

        if (currentLogo) {
            try {
                if (currentLogo.startsWith("data:image")) {
                    doc.image(currentLogo, 50, 390, { fit: [200, 200] });
                } else {
                    const logoFileName = currentLogo.split("/").pop();
                    const logoPath = storage.getImagePhysicalPath(project.id, logoFileName);
                    if (fs.existsSync(logoPath)) {
                        doc.image(logoPath, 50, 390, { fit: [200, 200] });
                    }
                }
            } catch (e) {
                console.error("Error embedding logo in PDF:", e);
                doc.fontSize(10).fillColor("#999999").text("[Imagen del logotipo no disponible]", 50, 390);
            }
        }

        // --- SECCIÓN 2: PALETA DE COLORES ---
        doc.addPage();
        doc.fillColor("black").fontSize(20).text("2. Paleta de Colores", 50, 50);
        doc.moveTo(50, 75).lineTo(550, 75).stroke("#eeeeee");

        if (currentColors && Array.isArray(currentColors)) {
            currentColors.forEach((color, i) => {
                const yPos = 100 + (i * 70);
                doc.rect(50, yPos, 50, 50).fill(color.hex);
                doc.fillColor("black").fontSize(12).text(color.name, 115, yPos + 10);
                doc.fillColor("#666666").fontSize(10).text(`HEX: ${color.hex.toUpperCase()}`, 115, yPos + 25);
                doc.fontSize(9).text(color.usage, 115, yPos + 38);
            });
        }

        // --- SECCIÓN 3: TIPOGRAFÍA ---
        doc.moveDown(4);
        const typoY = doc.y + 20;
        doc.fillColor("black").fontSize(20).text("3. Tipografía", 50, typoY);
        doc.moveTo(50, typoY + 25).lineTo(550, typoY + 25).stroke("#eeeeee");

        if (currentTypography) {
            const hName = currentTypography.heading?.name || "Inter";
            const bName = currentTypography.body?.name || "DM Sans";

            doc.fillColor("black").fontSize(14).text(`Títulos: ${hName}`, 50, typoY + 50);
            doc.fillColor("#666666").fontSize(10).text(`Uso: ${currentTypography.heading?.usage || "Titulares"}`, 50, typoY + 70);
            doc.fontSize(22).fillColor("black").text("ABCDEFGHIJKLMNÑOPQRSTUVWXYZ", 50, typoY + 90);

            doc.fontSize(14).text(`Cuerpo: ${bName}`, 50, typoY + 140);
            doc.fillColor("#666666").fontSize(10).text(`Uso: ${currentTypography.body?.usage || "Párrafos"}`, 50, typoY + 160);
            doc.fontSize(12).fillColor("#333333").text("El veloz murciélago hindú comía feliz cardillo y kiwi. La cigüeña tocaba el saxofón detrás del palenque de paja.", 50, typoY + 180, { width: 500 });
        }

        // --- SECCIÓN 4: ICONOGRAFÍA ---
        doc.addPage();
        doc.fillColor("black").fontSize(20).text("4. Iconografía y Elementos", 50, 50);
        doc.moveTo(50, 75).lineTo(550, 75).stroke("#eeeeee");

        if (branding.icons && Array.isArray(branding.icons)) {
            const iconSize = 80;
            const margin = 20;
            const iconsPerRow = 4;

            branding.icons.forEach((icon, i) => {
                const row = Math.floor(i / iconsPerRow);
                const col = i % iconsPerRow;
                const x = 50 + col * (iconSize + margin);
                const y = 100 + row * (iconSize + 40);

                try {
                    if (icon.svg.startsWith("data:image")) {
                        doc.image(icon.svg, x, y, { fit: [iconSize, iconSize] });
                    } else if (icon.svg.startsWith("<svg")) {
                        doc.rect(x, y, iconSize, iconSize).stroke("#cccccc");
                    } else {
                        const iconFileName = icon.svg.split("/").pop();
                        const iconPath = storage.getImagePhysicalPath(project.id, iconFileName);
                        if (fs.existsSync(iconPath)) {
                            doc.image(iconPath, x, y, { fit: [iconSize, iconSize] });
                        }
                    }
                    doc.fillColor("#666666").fontSize(8).text(icon.name, x, y + iconSize + 5, { width: iconSize, align: 'center' });
                } catch (e) {
                    console.error("Error embedding icon in PDF:", e);
                }
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
    app.get('/*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(distPath, 'index.html'));
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    });
    console.log(`📁 Sirviendo frontend estático desde: ${distPath}`);
}

app.listen(PORT, () => {
    const url = isProduction ? `https://tu-app.onrender.com` : `http://localhost:${PORT}`;
    console.log(`🚀 Servidor corriendo en ${url} [${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'}]`);
});

