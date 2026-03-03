import fs from "fs-extra";
import path from "path";

const STORAGE_DIR = path.join(process.cwd(), "storage");

// Asegurar que el directorio de almacenamiento exista
fs.ensureDirSync(STORAGE_DIR);

/**
 * Guarda un proyecto de branding completo utilizando el sistema de archivos local.
 * @param {Object} project El proyecto a guardar.
 */
export async function saveProject(project) {
    const projectId = project.id;
    const projectDir = path.join(STORAGE_DIR, projectId);
    await fs.ensureDir(projectDir);

    // Helper para guardar una imagen base64 localmente y devolver su ruta relativa/URL
    const saveImage = async (base64Data, prefix) => {
        if (!base64Data || !base64Data.startsWith("data:image")) return base64Data;

        try {
            const extension = base64Data.includes("image/svg+xml") ? "svg" : "png";
            const base64Content = base64Data.split(",")[1];
            const buffer = Buffer.from(base64Content, "base64");
            const fileName = `${prefix}_${Date.now()}.${extension}`;
            const filePath = path.join(projectDir, fileName);

            await fs.writeFile(filePath, buffer);

            // Devolver la URL relativa que el servidor puede servir
            return `/api/projects/${projectId}/images/${fileName}`;
        } catch (e) {
            console.error(`❌ Error guardando imagen ${prefix} localmente:`, e);
            return base64Data;
        }
    };

    // Procesar branding y subcomponentes para guardar imágenes localmente
    if (project.branding) {
        if (project.branding.logo) {
            project.branding.logo = await saveImage(project.branding.logo, "logo_main");
        }

        if (project.branding.icons && Array.isArray(project.branding.icons)) {
            for (let i = 0; i < project.branding.icons.length; i++) {
                project.branding.icons[i].svg = await saveImage(project.branding.icons[i].svg, `icon_main_${i}`);
            }
        }

        if (project.branding.proposals && Array.isArray(project.branding.proposals)) {
            for (let i = 0; i < project.branding.proposals.length; i++) {
                const proposal = project.branding.proposals[i];
                if (proposal.logo) {
                    proposal.logo = await saveImage(proposal.logo, `logo_prop_${i}`);
                }
                if (proposal.icons && Array.isArray(proposal.icons)) {
                    for (let j = 0; j < proposal.icons.length; j++) {
                        proposal.icons[j].svg = await saveImage(proposal.icons[j].svg, `icon_prop_${i}_${j}`);
                    }
                }
            }
        }
    }

    // Guardar el JSON del proyecto
    const projectFilePath = path.join(projectDir, "project.json");
    await fs.writeJson(projectFilePath, {
        ...project,
        updatedAt: new Date().toISOString()
    }, { spaces: 2 });

    console.log(`✅ Proyecto ${projectId} guardado localmente en ${projectDir}`);
    return project;
}

/**
 * Obtiene todos los proyectos desde el sistema de archivos local.
 */
export async function getProjects() {
    try {
        const items = await fs.readdir(STORAGE_DIR);
        const projects = [];

        for (const item of items) {
            const projectDir = path.join(STORAGE_DIR, item);
            const projectFile = path.join(projectDir, "project.json");

            if (await fs.pathExists(projectFile)) {
                const projectData = await fs.readJson(projectFile);
                projects.push(projectData);
            }
        }

        return projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } catch (error) {
        console.error("❌ Error obteniendo proyectos locales:", error);
        return [];
    }
}

/**
 * Obtiene un proyecto específico por ID desde el sistema de archivos local.
 */
export async function getProjectById(id) {
    try {
        const projectFile = path.join(STORAGE_DIR, id, "project.json");
        if (!(await fs.pathExists(projectFile))) return null;
        return await fs.readJson(projectFile);
    } catch (error) {
        console.error(`❌ Error obteniendo proyecto local ${id}:`, error);
        return null;
    }
}

/**
 * Elimina un proyecto del sistema de archivos local.
 */
export async function deleteProject(id) {
    try {
        const projectDir = path.join(STORAGE_DIR, id);
        if (await fs.pathExists(projectDir)) {
            await fs.remove(projectDir);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`❌ Error eliminando proyecto local ${id}:`, error);
        return false;
    }
}

/**
 * Devuelve la ruta física de una imagen para servirla vía Express.
 */
export function getImagePhysicalPath(projectId, imageName) {
    return path.join(STORAGE_DIR, projectId, imageName);
}

