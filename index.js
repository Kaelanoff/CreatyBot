require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  ActivityType
} = require("discord.js");

if (!process.env.TOKEN) {
  console.error("❌ ERREUR : Le TOKEN est absent du fichier .env");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

client.once("clientReady", () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ CREATY BOT CONNECTÉ");
  console.log(`🤖 Nom : ${client.user.tag}`);
  console.log(`🆔 ID : ${client.user.id}`);
  console.log(`🌐 Serveurs : ${client.guilds.cache.size}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  client.user.setPresence({
    activities: [
      {
        name: "Creaty Bot",
        type: ActivityType.Watching
      }
    ],
    status: "online"
  });

  console.log("🟢 Présence ONLINE envoyée");
});

client.on("error", (error) => {
  console.error("❌ Erreur Discord :", error);
});

client.login(process.env.TOKEN).catch((error) => {
  console.error("❌ Impossible de connecter Creaty Bot.");
  console.error(error);
  process.exit(1);
});