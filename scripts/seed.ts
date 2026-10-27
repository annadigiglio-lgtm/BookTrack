

// Crea (o ricrea) un utente di prova con i suoi scaffali predefiniti.
//     npm run seed
//
// Credenziali:  prova@test.it  /  password123
//
//  Cancella SOLO l'utente di prova e i suoi dati, non tutto il database.


import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.config";
import { LISTE_PREDEFINITE } from "../config/project.config";
import User from "../models/User";
import Lista from "../models/Shelf";
import Contenuto from "../models/Content";
import Commento from "../models/Comment";
import Valutazione from "../models/Rating";

const EMAIL = "prova@test.it";
const PASSWORD = "password123";

await connectDB();

// Pulizia dell'eventuale utente di prova precedente (e dei suoi dati)
const vecchio = await User.findOne({ email: EMAIL });
if (vecchio) {
    await Promise.all([
        Contenuto.deleteMany({ user: vecchio._id }),
        Lista.deleteMany({ user: vecchio._id }),
        Commento.deleteMany({ user: vecchio._id }),
        Valutazione.deleteMany({ user: vecchio._id }),
        User.deleteOne({ _id: vecchio._id }),
    ]);
}

const utente = await User.create({
    nome: "Utente di prova",
    email: EMAIL,
    password: await bcrypt.hash(PASSWORD, 10),
});
if (LISTE_PREDEFINITE.length > 0) {
    await Lista.insertMany(LISTE_PREDEFINITE.map((nome) => ({ user: utente._id, nome })));
}

console.log("✅ Utente di prova creato");
console.log(`   email:    ${EMAIL}`);
console.log(`   password: ${PASSWORD}`);
console.log(`   _id:      ${utente._id}`);

await mongoose.disconnect();
