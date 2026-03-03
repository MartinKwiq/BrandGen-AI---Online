import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const keys = [
    { name: "Principal (1)", key: process.env.GEMINI_API_KEY },
    { name: "Secundaria (2)", key: process.env.GEMINI_API_KEY_SECONDARY },
    { name: "Respaldo 3", key: process.env.GEMINI_API_KEY_3 },
    { name: "Respaldo 4", key: process.env.GEMINI_API_KEY_4 }
];

async function checkQuota() {
    console.log("\n===========================================");
    console.log("🛠️  DIAGNÓSTICO PROFUNDO DE LLAVES GEMINI");
    console.log("===========================================\n");

    for (const { name, key } of keys) {
        if (!key || key.includes("TU_") || key.length < 10) {
            console.log(`⚪ [${name}]: OMITIDA (No configurada o placeholder)`);
            continue;
        }

        console.log(`🔍 [${name}]: Probando (ID: ${key.substring(0, 8)}...)`);

        try {
            const genAI = new GoogleGenerativeAI(key);
            // Probamos con 1.5-flash que es el más común y estable en free tier
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const result = await model.generateContent("Hola");
            const response = await result.response;
            console.log(`✅ [${name}]: FUNCIONANDO OK! Resp: "${response.text().trim()}"`);
        } catch (error) {
            const status = error.status;
            const message = error.message || "";

            console.error(`❌ [${name}]: FALLÓ`);
            console.error(`   - Status: ${status || 'N/A'}`);

            if (status === 429 || message.includes("429") || message.includes("quota") || message.includes("RESOURCE_EXHAUSTED")) {
                console.error(`   - Razón: CUOTA AGOTADA (429)`);
                if (message.includes("limit '0'")) {
                    console.error(`   - Detalle: ¡Límite 0! Posible problema de activación del modelo en el proyecto.`);
                }
            } else if (status === 400) {
                console.error(`   - Razón: LLAVE INVÁLIDA O MAL CONFIGURADA (400)`);
            } else {
                console.error(`   - Detalle: ${message.substring(0, 200)}...`);
            }
        }
    }
    console.log("\n===========================================\n");
}

checkQuota();
