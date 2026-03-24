import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

const url = (process.env.SUPABASE_URL || "").trim().replace(/['"]/g, '').replace(/;$/, '');
const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY || "").trim().replace(/['"]/g, '').replace(/;$/, '');

if (!url || !key) {
  console.error("Faltan credenciales de Supabase en .env.");
  process.exit(1);
}

const supabase = createClient(url, key);

async function checkDatabase() {
  console.log("=========================================");
  console.log("🔍 DIAGNÓSTICO DE BASE DE DATOS Y STORAGE");
  console.log("=========================================\n");

  console.log("1. Buscando proyectos guardados en la tabla 'brandgen_projects'...");
  const { data: projects, error: dbError } = await supabase
    .from('brandgen_projects')
    .select('id, name, updated_at')
    .order('updated_at', { ascending: false })
    .limit(5);

  if (dbError) {
    console.error("❌ Error al consultar la tabla 'brandgen_projects':", dbError.message);
  } else if (!projects || projects.length === 0) {
    console.log("⚠️ No se encontraron proyectos en la base de datos.");
  } else {
    console.log(`✅ ¡Se encontraron ${projects.length} proyectos recientes!`);
    projects.forEach((p, i) => console.log(`   ${i + 1}. Nombre: "${p.name}" | ID: ${p.id} | Actualizado: ${p.updated_at}`));
  }

  console.log("\n2. Revisando archivos en el bucket 'brandgen-storage'...");
  const { data: storageFiles, error: storageError } = await supabase.storage
    .from('brandgen-storage')
    .list();

  if (storageError) {
    console.error("❌ Error al acceder al bucket 'brandgen-storage':", storageError.message);
  } else if (!storageFiles || storageFiles.length === 0) {
    console.log("⚠️ El bucket existe pero parece estar vacío (no hay archivos).");
  } else {
    // Si hay folders (ids de proyecto), listar el contenido del más reciente
    const firstFolder = storageFiles[0].name;
    console.log(`✅ El bucket contiene ${storageFiles.length} elementos en la raíz (ej. carpeta de proyecto: ${firstFolder}).`);
    
    // Opcional: ver dentro de una carpeta si es un directorio
    const { data: insideFolder } = await supabase.storage.from('brandgen-storage').list(firstFolder);
    if (insideFolder && insideFolder.length > 0) {
       console.log(`   └─ Dentro de ${firstFolder}/ hay ${insideFolder.length} archivos subidos con éxito!`);
    } else {
       console.log(`   └─ El folder ${firstFolder} está vacío o es un archivo directo.`);
    }
  }
  
  console.log("\n=========================================");
  console.log("Diagnóstico finalizado.");
}

checkDatabase();
