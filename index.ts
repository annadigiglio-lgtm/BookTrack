import app from "./app";
import { connectDB } from "./config/db.config";
import { env } from "./config/env.config";

try {
    await connectDB();
    app.listen(env.port, () => {
        console.log(`🚀 Server in ascolto su http://localhost:${env.port}/api`);
        console.log(`   Prova: http://localhost:${env.port}/api/health`);
    });
} catch (error: any) {
    if (error?.name === "MongooseServerSelectionError" || error?.message?.includes("ECONNREFUSED")) {
        console.error("❌ Impossibile connettersi a MongoDB.");
        console.error(`👉 MongoDB è acceso? MONGO_URI nel .env è giusto? (${env.mongoUri})`);
    } else {
        console.error(`❌ Errore all'avvio: ${error?.message}`);
    }
    process.exit(1);
}
