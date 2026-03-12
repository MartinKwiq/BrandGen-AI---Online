import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

async function testImageAPI() {
    const model = "imagen-4.0-fast-generate-001";
    const apiKey = process.env.GOOGLE_IMAGEN_API_KEY || process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;

    const prompt = "A minimal flat vector icon of a rocket, white background, modern startup style";

    console.log("--- IMAGE API DIAGNOSTIC ---");
    console.log("Model:", model);
    console.log("Endpoint (sanitized):", url.replace(apiKey, "REDACTED"));
    console.log("Prompt:", prompt);
    console.log("----------------------------");

    try {
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

        const status = response.status;
        const headers = Array.from(response.headers.entries());
        
        console.log("IMAGE API STATUS:", status);
        console.log("IMAGE API HEADERS:", JSON.stringify(headers, null, 2));

        const data = await response.json();

        if (status !== 200 || data.error) {
            console.error("IMAGE API ERROR:", JSON.stringify(data.error || data, null, 2));
            
            if (status === 429) {
                console.log("DIAGNOSTIC RESULT: B) API quota is exceeded.");
            } else if (status === 401 || status === 403) {
                console.log("DIAGNOSTIC RESULT: C) API key is invalid or revoked.");
            } else {
                console.log("DIAGNOSTIC RESULT: D) API endpoint is failing.");
            }
        } else if (data.predictions?.[0]?.bytesBase64Encoded) {
            console.log("IMAGE GENERATION SUCCESSFUL");
            console.log("DIAGNOSTIC RESULT: A) Image API is working correctly.");
            // No imprimimos el body completo si es exitoso para no saturar el log con base64
            console.log("IMAGE API BODY: (Base64 data received)");
        } else {
            console.log("IMAGE API BODY:", JSON.stringify(data, null, 2));
            console.log("DIAGNOSTIC RESULT: E) API returns malformed data.");
        }

    } catch (error) {
        console.error("FETCH ERROR:", error.message);
        console.log("DIAGNOSTIC RESULT: D) API endpoint is failing or unreachable.");
    }
}

testImageAPI();
