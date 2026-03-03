import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicialización de Firebase Admin
let app;
if (!admin.apps.length) {
    try {
        let serviceAccount;
        const localKeyPath = path.join(__dirname, "firebase-key.json");

        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            console.log("✅ Usando FIREBASE_SERVICE_ACCOUNT desde variables de entorno.");
        } else if (fs.existsSync(localKeyPath)) {
            serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, "utf8"));
            console.log("✅ Usando firebase-key.json local.");
        }

        if (serviceAccount && serviceAccount.private_key) {
            // Limpieza extrema de la clave privada
            let privateKey = serviceAccount.private_key;

            // Si viene con escapado de JSON (\n literal), lo limpiamos
            privateKey = privateKey.replace(/\\n/g, '\n');

            // Si por alguna razón tiene comillas extra al inicio/fin
            privateKey = privateKey.replace(/^"|"$/g, '');

            // Aseguramos que los saltos de línea sean correctos (PEM format)
            if (!privateKey.includes('\n') && privateKey.includes(' ')) {
                // Si no tiene saltos de línea pero tiene espacios, 
                // podría ser una clave en una sola línea mal formateada
                privateKey = privateKey.replace(/ /g, '\n');
            }

            app = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: serviceAccount.project_id,
                    clientEmail: serviceAccount.client_email,
                    privateKey: privateKey
                })
            });
            console.log("✅ Firebase Admin inicializado con éxito (Firestore)");
        } else {
            throw new Error("Credenciales de Firebase incompletas.");
        }
    } catch (error) {
        console.error("❌ ERROR CRÍTICO FIREBASE ADMIN:", error.message);
        // NO dejar el proceso colgado o db null si es posible, aunque aquí db será null
    }
} else {
    app = admin.app();
}

// Exportar db solo si la app se inicializó
export const db = app ? admin.firestore(app) : null;
export default app;
