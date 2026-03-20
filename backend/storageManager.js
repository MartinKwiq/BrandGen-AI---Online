import fs from "fs-extra";
import path from "path";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const STORAGE_DIR = path.join(process.cwd(), "storage");
fs.ensureDirSync(STORAGE_DIR);

// Configuración de Supabase (Saneamiento)
const rawUrl = process.env.SUPABASE_URL || "";
const rawKey = process.env.SUPABASE_KEY || "";
const supabaseUrl = rawUrl.trim().replace(/['"]/g, '');
const supabaseKey = rawKey.trim().replace(/['"]/g, '');

// Inicializar cliente solo si las credenciales existen y parecen válidas
let supabase = null;
if (supabaseUrl && supabaseKey && supabaseUrl.startsWith("http")) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log(`📡 Cliente Supabase configurado para: ${supabaseUrl.substring(0, 25)}...`);
    } catch (e) {
        console.error("❌ Error inicializando cliente Supabase:", e.message);
    }
} else {
    console.warn("⚠️ ADVERTENCIA: Credenciales de Supabase ausentes o mal formateadas.");
    console.log(`DEBUG: URL_OK=${!!supabaseUrl}, KEY_OK=${!!supabaseKey}, PROTOCOL_OK=${supabaseUrl.startsWith("http")}`);
}

/**
 * Guarda un proyecto de branding. 
 * Usa Supabase para los metadatos y JSON, y disco local para archivos binarios.
 */
export async function saveProject(project) {
    // Generar UUID v4 si no tiene ID (para compatibilidad con Supabase)
    const projectId = project.id || uuidv4();
    project.id = projectId;

    const projectDir = path.join(STORAGE_DIR, projectId);
    await fs.ensureDir(projectDir);

    // 1. Guardar imágenes localmente y en Supabase (Storage)
    const saveImage = async (base64Data, prefix) => {
        if (!base64Data || !base64Data.startsWith("data:image")) return base64Data;
        try {
            const isSvg = base64Data.includes("image/svg+xml");
            const extension = isSvg ? "svg" : "png";
            const contentType = isSvg ? "image/svg+xml" : "image/png";
            const base64Content = base64Data.split(",")[1];
            const buffer = Buffer.from(base64Content, "base64");
            const fileName = `${prefix}_${Date.now()}.${extension}`;
            
            // Guardado Local (Temporal en Render, permanente si se corre local)
            const filePath = path.join(projectDir, fileName);
            await fs.writeFile(filePath, buffer);

            // Guardado en Supabase Storage (Permanente Online)
            if (supabase) {
                try {
                    const { data, error } = await supabase.storage
                        .from('brandgen-storage')
                        .upload(`${projectId}/${fileName}`, buffer, {
                            contentType: contentType,
                            upsert: true
                        });

                    if (error) {
                        console.error(`❌ Error subiendo a Supabase Storage (${fileName}):`, error.message);
                    } else {
                        const { data: publicUrlData } = supabase.storage
                            .from('brandgen-storage')
                            .getPublicUrl(`${projectId}/${fileName}`);
                        
                        console.log(`🚀 Imagen subida a Supabase Storage: ${fileName}`);
                        return publicUrlData.publicUrl;
                    }
                } catch (err) {
                    console.error(`❌ Fallo crítico en Supabase Storage (${fileName}):`, err.message);
                }
            }

            return `/api/projects/${projectId}/images/${fileName}`;
        } catch (e) {
            console.error(`❌ Error procesando imagen ${prefix}:`, e);
            return base64Data;
        }
    };

    if (project.branding) {
        if (project.branding.logo) project.branding.logo = await saveImage(project.branding.logo, "logo_main");
        if (project.branding.icons && Array.isArray(project.branding.icons)) {
            for (let i = 0; i < project.branding.icons.length; i++) {
                project.branding.icons[i].svg = await saveImage(project.branding.icons[i].svg, `icon_main_${i}`);
            }
        }
        // Procesar propuestas
        if (project.branding.proposals && Array.isArray(project.branding.proposals)) {
            for (let i = 0; i < project.branding.proposals.length; i++) {
                const prop = project.branding.proposals[i];
                if (prop.logo) prop.logo = await saveImage(prop.logo, `logo_prop_${i}`);
                if (prop.icons) {
                    for (let j = 0; j < prop.icons.length; j++) {
                        prop.icons[j].svg = await saveImage(prop.icons[j].svg, `icon_prop_${i}_${j}`);
                    }
                }
            }
        }
    }

    // 2. Persistir en Supabase (Prioridad) o Local
    if (supabase) {
        try {
            await saveBrandingProject(project);
            console.log(`✅ Proyecto ${projectId} persistido en Supabase.`);
            return project;
        } catch (error) {
            console.error("❌ Error persistiendo en Supabase, reintentando local...", error.message);
        }
    }

    // Fallback: Guardar localmente (como antes)
    const projectFilePath = path.join(projectDir, "project.json");
    await fs.writeJson(projectFilePath, {
        ...project,
        updated_at: new Date().toISOString()
    }, { spaces: 2 });

    return project;
}

/**
 * Guarda un proyecto específicamente en la tabla brandgen_projects de Supabase.
 * @param {Object} project El objeto completo del proyecto.
 */
export async function saveBrandingProject(project) {
    if (!supabase) {
        throw new Error("Supabase no está configurado.");
    }

    try {
        const timestamp = project.updated_at || project.updatedAt || new Date().toISOString();
        console.log(`💾 Persisting project ${project.id} to Supabase...`);
        
        // Saneado de datos: asegurar que branding sea un objeto JSON válido
        // Si viene como string (raro pero posible), parsear.
        let brandingData = project.branding || project;
        if (typeof brandingData === 'string') {
            try {
                brandingData = JSON.parse(brandingData);
            } catch (e) {
                console.warn("⚠️ brandingData era string pero no JSON válido, usando objeto original");
            }
        }

        const { data, error } = await supabase
            .from("brandgen_projects")
            .upsert([
                {
                    id: project.id,
                    name: project.name || brandingData.brandName || "Unnamed Project",
                    description: project.description || brandingData.tagline || "",
                    industry: project.industry || brandingData.industry || "",
                    target_audience: project.target_audience || brandingData.targetAudience || "",
                    status: project.status || "completed",
                    proposals: project.proposals || brandingData.proposals || [],
                    images: { 
                        logo: brandingData.logo || null, 
                        icons: brandingData.icons || [] 
                    },
                    colors: project.colors || brandingData.colors || [],
                    typography: project.typography || brandingData.typography || {},
                    updated_at: timestamp
                }
            ], { onConflict: 'id' });

        if (error) {
            console.error("❌ SUPABASE UPSERT ERROR DETAILS:", JSON.stringify(error, null, 2));
            console.error("Object attempted to save:", JSON.stringify({
                id: project.id,
                name: project.name || brandingData.brandName || "Unnamed Project",
                status: project.status || "completed"
            }, null, 2));
            throw error;
        }

        console.log(`✅ Project ${project.id} successfully saved to Supabase.`);
        return data;
    } catch (err) {
        console.error(`❌ SAVE BRANDING PROJECT FAILED for ${project.id}:`, err);
        throw err; // Re-lanzar para que el endpoint devuelva 500 con detalle
    }
}

/**
 * Obtiene todos los proyectos
 */
export async function getProjects() {
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('brandgen_projects')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("❌ Error listando desde Supabase:", error.message);
        }
    }

    // Fallback Local
    try {
        const items = await fs.readdir(STORAGE_DIR);
        const projects = [];
        for (const item of items) {
            const projectFile = path.join(STORAGE_DIR, item, "project.json");
            if (await fs.pathExists(projectFile)) {
                projects.push(await fs.readJson(projectFile));
            }
        }
        return projects.sort((a, b) => {
            const dateA = new Date(a.updated_at || a.updatedAt || 0);
            const dateB = new Date(b.updated_at || b.updatedAt || 0);
            return dateB - dateA;
        });
    } catch (e) {
        return [];
    }
}

/**
 * Obtiene un proyecto específico
 */
export async function getProjectById(id) {
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('brandgen_projects')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`❌ Error buscando en Supabase (${id}):`, error.message);
        }
    }

    const projectFile = path.join(STORAGE_DIR, id, "project.json");
    return (await fs.pathExists(projectFile)) ? await fs.readJson(projectFile) : null;
}

/**
 * Elimina un proyecto
 */
export async function deleteProject(id) {
    if (supabase) {
        try {
            const { error } = await supabase
                .from('brandgen_projects')
                .delete()
                .eq('id', id);
            if (error) throw error;
        } catch (error) {
            console.error(`❌ Error eliminando en Supabase (${id}):`, error.message);
        }
    }

    try {
        const projectDir = path.join(STORAGE_DIR, id);
        if (await fs.pathExists(projectDir)) {
            await fs.remove(projectDir);
            return true;
        }
    } catch (e) { }
    return false;
}

/**
 * Persistencia de Mensajes de Chat
 */
export async function saveChatMessage(projectId, role, content, metadata = {}) {
    if (supabase) {
        try {
            const { error } = await supabase
                .from('brandgen_messages')
                .insert([{
                    project_id: projectId,
                    role,
                    content,
                    metadata
                }]);
            if (error) throw error;
            return true;
        } catch (e) {
            console.error("❌ Error guardando mensaje en Supabase:", e.message);
        }
    }
    return false;
}

export async function getChatMessages(projectId) {
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('brandgen_messages')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data.map(m => ({
                role: m.role,
                parts: [{ text: m.content }]
            }));
        } catch (e) {
            console.error("❌ Error recuperando mensajes de Supabase:", e.message);
        }
    }
    return [];
}

export async function cleanupOldProjects(days = 30) {
    // En Supabase no borramos automáticamente a menos que se pida expresamente
    // pero podemos limpiar el disco local de Render
    try {
        const items = await fs.readdir(STORAGE_DIR);
        const threshold = Date.now() - (days * 24 * 60 * 60 * 1000);
        for (const item of items) {
            const stat = await fs.stat(path.join(STORAGE_DIR, item));
            if (stat.mtimeMs < threshold) {
                await fs.remove(path.join(STORAGE_DIR, item));
            }
        }
    } catch (e) { }
}

export function getImagePhysicalPath(projectId, imageName) {
    return path.join(STORAGE_DIR, projectId, imageName);
}


