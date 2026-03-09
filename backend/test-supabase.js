import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERROR: Faltan SUPABASE_URL o SUPABASE_KEY en el .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log("📡 Probando conexión con Supabase...");

    // 1. Probar inserción
    const { data: project, error: pError } = await supabase
        .from('brandgen_projects')
        .insert([{ name: 'Test Project', description: 'Prueba de persistencia' }])
        .select()
        .single();

    if (pError) {
        console.error("❌ Error al insertar proyecto:", pError.message);
        return;
    }
    console.log("✅ Proyecto insertado con ID:", project.id);

    // 2. Probar inserción de mensaje
    const { error: mError } = await supabase
        .from('brandgen_messages')
        .insert([{ project_id: project.id, role: 'user', content: 'Hola, esto es una prueba.' }]);

    if (mError) {
        console.error("❌ Error al insertar mensaje:", mError.message);
    } else {
        console.log("✅ Mensaje insertado correctamente.");
    }

    // 3. Limpieza (Opcional, eliminar el proyecto de prueba)
    const { error: dError } = await supabase
        .from('brandgen_projects')
        .delete()
        .eq('id', project.id);

    if (dError) {
        console.error("❌ Error al limpiar proyecto de prueba:", dError.message);
    } else {
        console.log("✅ Limpieza completada exitosamente.");
    }

    console.log("🚀 ¡PRUEBA DE SUPABASE COMPLETADA CON ÉXITO!");
}

testConnection();
