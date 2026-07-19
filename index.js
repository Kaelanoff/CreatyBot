require('dotenv').config();

const fs = require('fs');
const path = require('path');

const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActivityType
} = require('discord.js');

if (!process.env.TOKEN) {
  console.error('❌ TOKEN manquant.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ],
  partials: [
    Partials.Channel,
    Partials.GuildMember,
    Partials.User
  ],
  presence: {
    status: 'online',
    activities: [{ name: 'Creaty Bot', type: ActivityType.Playing }]
  }
});

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const DB_FILE = path.join(DATA_DIR, 'operations.json');

const PROJECT_STAGES = [
  { key: 'projets_attente', label: 'En attente', emoji: '🟢', progress: 10 },
  { key: 'analyse', label: 'Analyse', emoji: '🟡', progress: 20 },
  { key: 'developpement', label: 'Développement', emoji: '🔵', progress: 45 },
  { key: 'tests_projets', label: 'Tests', emoji: '🟣', progress: 65 },
  { key: 'corrections', label: 'Corrections', emoji: '🟠', progress: 80 },
  { key: 'termines', label: 'Terminé', emoji: '✅', progress: 90 },
  { key: 'livraisons_projets', label: 'Livraison', emoji: '📦', progress: 100 },
  { key: 'archives', label: 'Archivé', emoji: '📁', progress: 100 }
];

const CHANNEL_OPTIONS = [
  ['bienvenue', 'Bienvenue'],
  ['depart', 'Départ'],
  ['reglement', 'Règlement'],
  ['annonces', 'Annonces'],
  ['info', 'Informations'],
  ['roadmap', 'Roadmap'],
  ['liens', 'Nos liens'],
  ['faq', 'FAQ'],
  ['sondages', 'Sondages'],
  ['ticket', 'Ticket'],
  ['attente_vocale', 'Attente vocale'],
  ['discussion', 'Discussion'],
  ['media', 'Média'],
  ['suggestion', 'Suggestion'],
  ['vos_bots', 'Vos bots'],
  ['presentation', 'Présentation'],
  ['evenements', 'Événements'],
  ['creation_bot', 'Création bot'],
  ['creation_serveur', 'Création serveur'],
  ['hebergement', 'Hébergement'],
  ['tarifs', 'Tarifs'],
  ['garantie', 'Garantie'],
  ['commander', 'Commander'],
  ['demander_devis', 'Demander un devis'],
  ['suivi_commandes', 'Suivi commandes'],
  ['paiements', 'Paiements'],
  ['conditions', 'Conditions'],
  ['questions_commandes', 'Questions commandes'],
  ['offres_speciales', 'Offres spéciales'],
  ['infos_clients', 'Informations clients'],
  ['livraisons_clients', 'Livraisons clients'],
  ['factures', 'Factures'],
  ['avis', 'Avis'],
  ['support_premium', 'Support Premium'],
  ['commandes_premium', 'Commandes Premium'],
  ['avantages_premium', 'Avantages Premium'],
  ['annonces_premium', 'Annonces Premium'],
  ['premium_chat', 'Premium Chat'],
  ['annonces_dev', 'Annonces Dev'],
  ['discussion_dev', 'Discussion Dev'],
  ['documentation', 'Documentation'],
  ['tests_dev', 'Tests Dev'],
  ['bugs', 'Bugs'],
  ['liste_projets', 'Liste des projets'],
  ['projets_attente', 'Projets en attente'],
  ['analyse', 'Analyse'],
  ['developpement', 'Développement'],
  ['tests_projets', 'Tests projets'],
  ['corrections', 'Corrections'],
  ['termines', 'Terminés'],
  ['livraisons_projets', 'Livraisons projets'],
  ['archives', 'Archives'],
  ['ventes', 'Ventes'],
  ['devis_commerciaux', 'Devis commerciaux'],
  ['commandes_commerciales', 'Commandes commerciales'],
  ['statistiques_commerciales', 'Statistiques commerciales'],
  ['objectifs', 'Objectifs'],
  ['chiffre_affaires', 'Chiffre d’affaires'],
  ['discussion_commerciale', 'Discussion commerciale'],
  ['creations', 'Créations'],
  ['logos', 'Logos'],
  ['bannieres', 'Bannières'],
  ['miniatures', 'Miniatures'],
  ['reseaux_sociaux', 'Réseaux sociaux'],
  ['discussion_design', 'Discussion Design'],
  ['staff_chat', 'Staff Chat'],
  ['staff_annonces', 'Staff Annonces'],
  ['recrutements', 'Recrutements'],
  ['sanctions', 'Sanctions'],
  ['reunions', 'Réunions'],
  ['direction', 'Direction'],
  ['finance', 'Finance'],
  ['statistiques_globales', 'Statistiques globales'],
  ['planning', 'Planning'],
  ['partenaires', 'Partenaires'],
  ['contrats', 'Contrats'],
  ['decisions', 'Décisions'],
  ['documents', 'Documents'],
  ['fondation', 'Fondation'],
  ['documents_confidentiels', 'Documents confidentiels'],
  ['projets_secrets', 'Projets secrets'],
  ['gestion_financiere', 'Gestion financière'],
  ['acces_total', 'Accès total'],
  ['journal_direction', 'Journal de direction']
];

const CATEGORY_OPTIONS = [
  ['tickets', 'Catégorie Tickets'],
  ['tickets_premium', 'Catégorie Tickets Premium']
];

const ROLE_OPTIONS = [
  ['nouveau', 'Nouveau'],
  ['membre', 'Membre'],
  ['prospect', 'Prospect'],
  ['client', 'Client'],
  ['client_premium', 'Client Premium'],
  ['staff', 'Support / Staff'],
  ['commercial', 'Commercial'],
  ['developpeur', 'Développeur'],
  ['moderateur', 'Modérateur'],
  ['administrateur', 'Administrateur'],
  ['directeur', 'Directeur'],
  ['cofondateur', 'Co-Fondateur'],
  ['fondateur', 'Fondateur']
];

const RULES = [
  '**Bienvenue sur Creaty Bot.**',
  '',
  'En rejoignant le serveur, tu t’engages à respecter les règles suivantes :',
  '',
  '**1. Respect** — Les insultes, menaces, discriminations, harcèlement et comportements toxiques sont interdits.',
  '**2. Spam** — Le spam, flood et mentions abusives sont interdits.',
  '**3. Publicité** — Toute publicité non autorisée est interdite.',
  '**4. Contenu** — Les contenus illégaux, choquants, haineux ou dangereux sont interdits.',
  '**5. Sécurité** — Toute tentative d’arnaque, phishing ou vol d’informations entraîne une sanction.',
  '**6. Commandes et paiements** — Utilise uniquement les systèmes officiels de Creaty Bot.',
  '**7. Tickets** — Les tickets doivent être utilisés pour de vraies demandes.',
  '**8. Personnel** — Respecte les décisions du staff et utilise le support en cas de problème.',
  '**9. Créations** — La revente ou redistribution non autorisée d’une création est interdite.',
  '**10. Acceptation** — En cliquant sur le bouton ci-dessous, tu confirmes avoir lu et accepté ce règlement.',
  '',
  'Le règlement peut être modifié à tout moment.'
].join('\n');

const PANELS = {
  bienvenue: ['👋 Bienvenue', 'Chaque nouveau membre sera accueilli ici automatiquement avec sa photo de profil.', 0x57F287],
  depart: ['👋 À bientôt', 'Les départs des membres seront signalés automatiquement dans ce salon.', 0xED4245],
  reglement: ['📜 Règlement de Creaty Bot', RULES, 0x57F287, 'rules'],
  annonces: ['📢 Annonces officielles', 'Toutes les annonces importantes de Creaty Bot seront publiées ici.', 0x5865F2],
  info: ['📌 Informations', 'Informations essentielles concernant Creaty Bot et ses services.', 0x3498DB],
  roadmap: ['🗺️ Roadmap', 'Fonctionnalités prévues, développements en cours et nouveautés.', 0x9B59B6],
  liens: ['🔗 Nos liens', 'Tous les liens officiels de Creaty Bot seront regroupés ici.', 0x3498DB],
  faq: ['❓ FAQ', 'Questions fréquentes sur les devis, commandes, paiements, livraisons et support.', 0xF1C40F],
  sondages: ['📊 Sondages', 'Les sondages de la communauté seront publiés ici.', 0x9B59B6],
  ticket: ['🎫 Support Creaty Bot', 'Choisis le type de ticket correspondant à ta demande.', 0x3498DB, 'ticket'],
  discussion: ['💬 Discussion', 'Salon principal de discussion de la communauté.', 0x5865F2],
  media: ['📷 Médias', 'Partage ici tes images, vidéos et créations.', 0x3498DB],
  suggestion: ['💡 Suggestions', 'Clique sur le bouton ci-dessous pour proposer une idée.', 0xF1C40F, 'suggestion'],
  vos_bots: ['🤖 Vos bots', 'Présente ici tes bots Discord et projets.', 0x5865F2],
  presentation: ['👋 Présentations', 'Présente-toi à la communauté.', 0x57F287],
  evenements: ['🎉 Événements', 'Les événements et animations seront annoncés ici.', 0xE91E63],
  creation_bot: ['🤖 Création de bot Discord', 'Création de bots Discord personnalisés.', 0x5865F2, 'service'],
  creation_serveur: ['💬 Création de serveur Discord', 'Création et configuration complète de serveurs Discord.', 0x5865F2, 'service'],
  hebergement: ['🌐 Hébergement', 'Solutions d’hébergement pour vos projets.', 0x3498DB, 'service'],
  tarifs: ['💰 Tarifs', 'Pour un projet personnalisé, demande un devis.', 0xF1C40F, 'quote'],
  garantie: ['📃 Garantie', 'Conditions de garantie, corrections et service après-vente.', 0x95A5A6],
  commander: ['📝 Commander', 'Clique sur le bouton ci-dessous pour démarrer une commande.', 0x5865F2, 'order'],
  demander_devis: ['💰 Demander un devis', 'Clique sur le bouton ci-dessous pour demander un devis.', 0xF1C40F, 'quote'],
  suivi_commandes: ['📦 Suivi client', 'Consulte tes devis, commandes et projets. Les réponses sont privées.', 0x3498DB, 'tracking'],
  paiements: ['💳 Paiements', 'Les paiements déclarés apparaissent ici pour validation par le personnel.', 0x2ECC71, 'payment'],
  conditions: ['📜 Conditions', 'Conditions applicables aux devis, commandes, paiements et livraisons.', 0x95A5A6],
  questions_commandes: ['❓ Questions commandes', 'Ouvre un ticket pour toute question concernant une commande.', 0xF1C40F, 'ticket'],
  offres_speciales: ['🎯 Offres spéciales', 'Promotions et offres temporaires.', 0xE91E63],
  infos_clients: ['📢 Informations clients', 'Informations importantes destinées aux clients.', 0x5865F2],
  livraisons_clients: ['📂 Livraisons clients', 'Informations liées aux livraisons clients.', 0x2ECC71],
  factures: ['📜 Factures', 'Informations liées aux factures et justificatifs.', 0x95A5A6],
  avis: ['⭐ Laisser un avis', 'Partage ton expérience après une commande.', 0xF1C40F],
  support_premium: ['👑 Support prioritaire', 'Support réservé aux clients Premium.', 0xF1C40F, 'ticket'],
  commandes_premium: ['⚡ Commandes prioritaires', 'Suivi des commandes prioritaires Premium.', 0xF1C40F],
  avantages_premium: ['🎁 Avantages Premium', 'Avantages réservés aux clients Premium.', 0xF1C40F],
  annonces_premium: ['📢 Annonces Premium', 'Annonces réservées aux clients Premium.', 0xF1C40F],
  premium_chat: ['💬 Premium Chat', 'Salon privé réservé aux clients Premium.', 0xF1C40F],
  annonces_dev: ['📢 Annonces développement', 'Annonces internes de l’équipe développement.', 0x3498DB],
  discussion_dev: ['💬 Discussion développement', 'Échanges internes entre développeurs.', 0x3498DB],
  documentation: ['📚 Documentation', 'Documentation technique et procédures internes.', 0x3498DB],
  tests_dev: ['🧪 Tests développement', 'Suivi des fonctionnalités en phase de test.', 0x9B59B6],
  bugs: ['🐞 Bugs', 'Suivi des bugs détectés.', 0xED4245],
  liste_projets: ['📋 Liste des projets', 'Toutes les fiches projets sont suivies ici.', 0x5865F2],
  projets_attente: ['🟢 Projets en attente', 'Tous les projets actuellement en attente apparaissent ici.', 0x57F287],
  analyse: ['🟡 Projets en analyse', 'Tous les projets actuellement en analyse apparaissent ici.', 0xF1C40F],
  developpement: ['🔵 Projets en développement', 'Tous les projets actuellement en développement apparaissent ici.', 0x3498DB],
  tests_projets: ['🟣 Projets en tests', 'Tous les projets actuellement en tests apparaissent ici.', 0x9B59B6],
  corrections: ['🟠 Projets en corrections', 'Tous les projets actuellement en corrections apparaissent ici.', 0xE67E22],
  termines: ['✅ Projets terminés', 'Tous les projets terminés apparaissent ici.', 0x57F287],
  livraisons_projets: ['📦 Livraisons projets', 'Tous les projets en livraison apparaissent ici.', 0x2ECC71],
  archives: ['📁 Archives projets', 'Tous les projets archivés apparaissent ici.', 0x95A5A6],
  ventes: ['💰 Ventes', 'Chaque vente validée apparaîtra ici automatiquement.', 0xF1C40F],
  devis_commerciaux: ['📋 Devis', 'Tous les devis sont gérés ici sous forme de fiches.', 0xF1C40F],
  commandes_commerciales: ['📦 Commandes', 'Toutes les commandes sont gérées ici sous forme de fiches.', 0x3498DB],
  statistiques_commerciales: ['📊 Statistiques commerciales', 'Statistiques automatiques sur les devis, commandes et ventes.', 0x9B59B6],
  objectifs: ['🎯 Objectifs', 'Suivi de l’objectif mensuel de chiffre d’affaires.', 0xE91E63],
  chiffre_affaires: ['📈 Chiffre d’affaires', 'Suivi du chiffre d’affaires basé sur les paiements validés.', 0x2ECC71],
  discussion_commerciale: ['💬 Discussion commerciale', 'Salon privé de l’équipe commerciale.', 0xF1C40F],
  creations: ['🎨 Créations', 'Suivi général des créations graphiques.', 0x9B59B6],
  logos: ['✨ Logos', 'Projets de logos.', 0x9B59B6],
  bannieres: ['🖼️ Bannières', 'Projets de bannières.', 0x9B59B6],
  miniatures: ['📺 Miniatures', 'Projets de miniatures.', 0x9B59B6],
  reseaux_sociaux: ['📱 Réseaux sociaux', 'Créations destinées aux réseaux sociaux.', 0x9B59B6],
  discussion_design: ['💬 Discussion Design', 'Salon privé de l’équipe design.', 0x9B59B6],
  staff_chat: ['💬 Staff Chat', 'Salon privé du personnel.', 0xED4245],
  staff_annonces: ['📢 Annonces staff', 'Annonces importantes destinées au personnel.', 0xED4245],
  recrutements: ['📝 Recrutements', 'Gestion des candidatures et recrutements.', 0xED4245],
  sanctions: ['⚠️ Sanctions', 'Suivi interne des sanctions et avertissements.', 0xE67E22],
  reunions: ['🤝 Réunions', 'Organisation des réunions du personnel.', 0xED4245],
  direction: ['💼 Direction', 'Salon privé de la direction.', 0xE67E22],
  finance: ['📈 Finance', 'Suivi financier interne.', 0x2ECC71],
  statistiques_globales: ['📊 Statistiques globales', 'Vue globale automatique de l’activité.', 0x9B59B6],
  planning: ['📅 Planning', 'Organisation des tâches et échéances.', 0x3498DB],
  partenaires: ['🤝 Partenaires', 'Suivi des partenaires officiels.', 0x5865F2],
  contrats: ['📃 Contrats', 'Suivi interne des contrats.', 0x95A5A6],
  decisions: ['📝 Décisions', 'Journal des décisions importantes.', 0xE67E22],
  documents: ['📂 Documents', 'Documents internes de la direction.', 0x95A5A6],
  fondation: ['💬 Fondation', 'Salon privé réservé à la fondation.', 0xED4245],
  documents_confidentiels: ['📜 Documents confidentiels', 'Documents confidentiels de la fondation.', 0xED4245],
  projets_secrets: ['📂 Projets secrets', 'Projets confidentiels ou non annoncés.', 0xED4245],
  gestion_financiere: ['💰 Gestion financière', 'Informations financières confidentielles.', 0xED4245],
  acces_total: ['🔑 Accès total', 'Espace réservé aux informations les plus sensibles.', 0xED4245],
  journal_direction: ['📝 Journal de direction', 'Historique des décisions majeures.', 0xED4245]
};

function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ guilds: {} }, null, 2));
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      counters: { tickets: 0, quotes: 0, orders: 0, payments: 0, projects: 0, sales: 0 },
      tickets: {},
      quotes: {},
      orders: {},
      payments: {},
      projects: {},
      sales: {}
    }, null, 2));
  }
}

function readJson(file) {
  ensureData();
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  ensureData();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getConfig(guildId) {
  const data = readJson(CONFIG_FILE);

  if (!data.guilds[guildId]) data.guilds[guildId] = {};

  const cfg = data.guilds[guildId];

  if (!cfg.channels) cfg.channels = {};
  if (!cfg.categories) cfg.categories = {};
  if (!cfg.roles) cfg.roles = {};
  if (!cfg.panels) cfg.panels = {};
  if (!cfg.settings) cfg.settings = {};
  if (typeof cfg.settings.paypalUrl !== 'string') cfg.settings.paypalUrl = '';
  if (typeof cfg.settings.monthlyGoal !== 'number') cfg.settings.monthlyGoal = 0;

  writeJson(CONFIG_FILE, data);
  return cfg;
}

function setConfig(guildId, section, key, value) {
  const data = readJson(CONFIG_FILE);

  if (!data.guilds[guildId]) data.guilds[guildId] = {};
  const cfg = data.guilds[guildId];

  if (!cfg.channels) cfg.channels = {};
  if (!cfg.categories) cfg.categories = {};
  if (!cfg.roles) cfg.roles = {};
  if (!cfg.panels) cfg.panels = {};
  if (!cfg.settings) cfg.settings = {};
  if (!cfg[section]) cfg[section] = {};

  cfg[section][key] = value;
  writeJson(CONFIG_FILE, data);
}

function getDb() {
  const db = readJson(DB_FILE);

  if (!db.counters) db.counters = {};
  for (const key of ['tickets', 'quotes', 'orders', 'payments', 'projects', 'sales']) {
    if (typeof db.counters[key] !== 'number') db.counters[key] = 0;
    if (!db[key]) db[key] = {};
  }

  writeJson(DB_FILE, db);
  return db;
}

function nextId(type, prefix) {
  const db = getDb();
  db.counters[type] += 1;
  const id = `${prefix}-${String(db.counters[type]).padStart(4, '0')}`;
  writeJson(DB_FILE, db);
  return id;
}

function embed(title, description, color = 0x5865F2) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: 'Creaty Bot' });
}

function isAdmin(member) {
  return Boolean(member?.permissions?.has(PermissionFlagsBits.Administrator));
}

function isStaff(member, config) {
  if (!member) return false;
  if (isAdmin(member)) return true;

  const ids = [
    config.roles.staff,
    config.roles.commercial,
    config.roles.developpeur,
    config.roles.moderateur,
    config.roles.administrateur,
    config.roles.directeur,
    config.roles.cofondateur,
    config.roles.fondateur
  ].filter(Boolean);

  return member.roles.cache.some(role => ids.includes(role.id));
}

async function sendDm(userId, payload) {
  try {
    const user = await client.users.fetch(userId);
    await user.send(payload);
    return true;
  } catch {
    return false;
  }
}

function panelComponents(type) {
  if (type === 'rules') {
    return [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('accept_rules').setLabel('Accepter le règlement').setEmoji('✅').setStyle(ButtonStyle.Success)
    )];
  }

  if (type === 'ticket') {
    return [new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket_type')
        .setPlaceholder('Choisir un type de ticket')
        .addOptions(
          { label: 'Support', value: 'support', emoji: '❓' },
          { label: 'Commande', value: 'commande', emoji: '📝' },
          { label: 'Devis', value: 'devis', emoji: '💰' },
          { label: 'Paiement', value: 'paiement', emoji: '💳' },
          { label: 'Bug', value: 'bug', emoji: '🐞' },
          { label: 'Partenariat', value: 'partenariat', emoji: '🤝' },
          { label: 'SAV', value: 'sav', emoji: '🔧' },
          { label: 'Autre', value: 'autre', emoji: '📌' }
        )
    )];
  }

  if (type === 'suggestion') {
    return [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('new_suggestion').setLabel('Proposer une suggestion').setStyle(ButtonStyle.Primary)
    )];
  }

  if (type === 'service') {
    return [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('quote_request').setLabel('Demander un devis').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('order_request').setLabel('Commander').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('ticket_help').setLabel('Poser une question').setStyle(ButtonStyle.Secondary)
    )];
  }

  if (type === 'quote') {
    return [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('quote_request').setLabel('Demander un devis').setStyle(ButtonStyle.Primary)
    )];
  }

  if (type === 'order') {
    return [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('order_request').setLabel('Commander').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('quote_request').setLabel('Demander un devis').setStyle(ButtonStyle.Primary)
    )];
  }

  if (type === 'tracking') {
    return [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('my_quotes').setLabel('Mes devis').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('my_orders').setLabel('Mes commandes').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('my_projects').setLabel('Mes projets').setStyle(ButtonStyle.Success)
    )];
  }

  if (type === 'payment') {
    return [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('declare_payment_manual').setLabel('Déclarer un paiement').setStyle(ButtonStyle.Success)
    )];
  }

  return [];
}

async function upsertPanel(guild, key) {
  const config = getConfig(guild.id);
  const def = PANELS[key];
  const channel = guild.channels.cache.get(config.channels[key]);

  if (!def || !channel || !channel.isTextBased()) return false;

  const [title, description, color, type] = def;
  const payload = {
    embeds: [embed(title, description, color)],
    components: panelComponents(type)
  };

  const oldId = config.panels[key];

  if (oldId) {
    try {
      const msg = await channel.messages.fetch(oldId);
      await msg.edit(payload);
      return true;
    } catch {}
  }

  const msg = await channel.send(payload);
  setConfig(guild.id, 'panels', key, msg.id);
  return true;
}

function quoteEmbed(q) {
  return embed(
    `💰 ${q.id} — ${q.projectName}`,
    [
      `Client : <@${q.userId}>`,
      `Service : **${q.service}**`,
      `Prix : **${q.price == null ? 'À définir' : `${Number(q.price).toFixed(2)} €`}**`,
      `Statut : **${q.status}**`,
      `Responsable : ${q.claimedBy ? `<@${q.claimedBy}>` : 'Aucun'}`,
      '',
      q.description
    ].join('\n'),
    0xF1C40F
  );
}

function quoteComponents(q) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`q_claim:${q.id}`).setLabel('Prendre').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`q_price:${q.id}`).setLabel('Définir le prix').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`q_send:${q.id}`).setLabel('Envoyer au client').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`q_contact:${q.id}`).setLabel('Contacter').setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`q_order:${q.id}`).setLabel('Transformer en commande').setStyle(ButtonStyle.Success).setDisabled(q.status !== 'Accepté par le client'),
      new ButtonBuilder().setCustomId(`q_refuse:${q.id}`).setLabel('Refuser').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`q_archive:${q.id}`).setLabel('Archiver').setStyle(ButtonStyle.Secondary)
    )
  ];
}

function orderEmbed(o) {
  return embed(
    `📦 ${o.id} — ${o.projectName}`,
    [
      `Client : <@${o.userId}>`,
      `Service : **${o.service}**`,
      `Prix : **${o.price == null ? 'À définir' : `${Number(o.price).toFixed(2)} €`}**`,
      `Statut : **${o.status}**`,
      `Paiement : **${o.paymentStatus}**`,
      `Responsable : ${o.claimedBy ? `<@${o.claimedBy}>` : 'Aucun'}`,
      `Projet : **${o.projectId || 'Pas encore créé'}**`
    ].join('\n'),
    0x3498DB
  );
}

function orderComponents(o) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`o_claim:${o.id}`).setLabel('Prendre').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`o_accept:${o.id}`).setLabel('Accepter').setStyle(ButtonStyle.Success).setDisabled(o.status !== 'En attente'),
      new ButtonBuilder().setCustomId(`o_refuse:${o.id}`).setLabel('Refuser').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`o_contact:${o.id}`).setLabel('Contacter').setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`o_pay:${o.id}`).setLabel('Envoyer le paiement').setStyle(ButtonStyle.Success).setDisabled(o.status !== 'Acceptée'),
      new ButtonBuilder().setCustomId(`o_archive:${o.id}`).setLabel('Archiver').setStyle(ButtonStyle.Secondary)
    )
  ];
}

function projectEmbed(p) {
  const stage = PROJECT_STAGES[p.stageIndex];

  return embed(
    `${stage.emoji} ${p.id} — ${p.projectName}`,
    [
      `Client : <@${p.userId}>`,
      `Commande : **${p.orderId}**`,
      `Responsable : ${p.claimedBy ? `<@${p.claimedBy}>` : 'Aucun'}`,
      `Étape : **${stage.label}**`,
      `Progression : **${stage.progress}%**`
    ].join('\n'),
    0x5865F2
  );
}

function projectComponents(p) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`p_claim:${p.id}`).setLabel('Prendre').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`p_prev:${p.id}`).setLabel('Étape précédente').setStyle(ButtonStyle.Secondary).setDisabled(p.stageIndex <= 0),
      new ButtonBuilder().setCustomId(`p_next:${p.id}`).setLabel('Étape suivante').setStyle(ButtonStyle.Success).setDisabled(p.stageIndex >= PROJECT_STAGES.length - 1),
      new ButtonBuilder().setCustomId(`p_contact:${p.id}`).setLabel('Contacter le client').setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`p_stage:${p.id}`)
        .setPlaceholder('Choisir une étape')
        .addOptions(PROJECT_STAGES.map((s, i) => ({
          label: s.label,
          value: String(i),
          emoji: s.emoji,
          default: p.stageIndex === i
        })))
    )
  ];
}

async function saveQuoteCard(guild, quote) {
  const config = getConfig(guild.id);
  const channel = guild.channels.cache.get(config.channels.devis_commerciaux);
  if (!channel || !channel.isTextBased()) throw new Error('Salon Devis commerciaux non configuré.');

  if (quote.messageId) {
    try {
      const msg = await channel.messages.fetch(quote.messageId);
      await msg.edit({ embeds: [quoteEmbed(quote)], components: quoteComponents(quote) });
      return;
    } catch {}
  }

  const msg = await channel.send({ embeds: [quoteEmbed(quote)], components: quoteComponents(quote) });

  const db = getDb();
  db.quotes[quote.id].messageId = msg.id;
  writeJson(DB_FILE, db);
}

async function saveOrderCard(guild, order) {
  const config = getConfig(guild.id);
  const channel = guild.channels.cache.get(config.channels.commandes_commerciales);
  if (!channel || !channel.isTextBased()) throw new Error('Salon Commandes commerciales non configuré.');

  if (order.messageId) {
    try {
      const msg = await channel.messages.fetch(order.messageId);
      await msg.edit({ embeds: [orderEmbed(order)], components: orderComponents(order) });
      return;
    } catch {}
  }

  const msg = await channel.send({ embeds: [orderEmbed(order)], components: orderComponents(order) });

  const db = getDb();
  db.orders[order.id].messageId = msg.id;
  writeJson(DB_FILE, db);
}

async function saveProjectCards(guild, project) {
  const config = getConfig(guild.id);
  const stage = PROJECT_STAGES[project.stageIndex];

  const listChannel = guild.channels.cache.get(config.channels.liste_projets);
  if (!listChannel || !listChannel.isTextBased()) throw new Error('Salon Liste des projets non configuré.');

  if (project.listMessageId) {
    try {
      const msg = await listChannel.messages.fetch(project.listMessageId);
      await msg.edit({ embeds: [projectEmbed(project)], components: projectComponents(project) });
    } catch {
      project.listMessageId = null;
    }
  }

  if (!project.listMessageId) {
    const msg = await listChannel.send({ embeds: [projectEmbed(project)], components: projectComponents(project) });
    project.listMessageId = msg.id;
  }

  const targetChannel = guild.channels.cache.get(config.channels[stage.key]);
  if (!targetChannel || !targetChannel.isTextBased()) {
    throw new Error(`Salon d'étape ${stage.key} non configuré.`);
  }

  if (project.stageMessageId && project.stageChannelId && project.stageChannelId !== targetChannel.id) {
    try {
      const oldChannel = await guild.channels.fetch(project.stageChannelId);
      const oldMsg = await oldChannel.messages.fetch(project.stageMessageId);
      await oldMsg.delete();
    } catch {}
    project.stageMessageId = null;
    project.stageChannelId = null;
  }

  if (project.stageMessageId) {
    try {
      const msg = await targetChannel.messages.fetch(project.stageMessageId);
      await msg.edit({ embeds: [projectEmbed(project)], components: projectComponents(project) });
    } catch {
      project.stageMessageId = null;
    }
  }

  if (!project.stageMessageId) {
    const msg = await targetChannel.send({ embeds: [projectEmbed(project)], components: projectComponents(project) });
    project.stageMessageId = msg.id;
    project.stageChannelId = targetChannel.id;
  }

  const db = getDb();
  db.projects[project.id] = project;
  writeJson(DB_FILE, db);
}

async function refreshDashboards(guild) {
  const config = getConfig(guild.id);
  const db = getDb();

  const quotes = Object.values(db.quotes).filter(x => x.guildId === guild.id);
  const orders = Object.values(db.orders).filter(x => x.guildId === guild.id);
  const projects = Object.values(db.projects).filter(x => x.guildId === guild.id);
  const sales = Object.values(db.sales).filter(x => x.guildId === guild.id);

  const now = new Date();
  const monthlySales = sales.filter(s => {
    const d = new Date(s.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const monthlyRevenue = monthlySales.reduce((sum, x) => sum + Number(x.amount || 0), 0);
  const totalRevenue = sales.reduce((sum, x) => sum + Number(x.amount || 0), 0);
  const goal = Number(config.settings.monthlyGoal || 0);

  const dashboards = {
    statistiques_commerciales: [
      '📊 Statistiques commerciales',
      `Devis : **${quotes.length}**\nCommandes : **${orders.length}**\nVentes validées : **${sales.length}**\nProjets : **${projects.length}**`,
      0x9B59B6
    ],
    chiffre_affaires: [
      '📈 Chiffre d’affaires',
      `Ce mois : **${monthlyRevenue.toFixed(2)} €**\nTotal : **${totalRevenue.toFixed(2)} €**`,
      0x2ECC71
    ],
    objectifs: [
      '🎯 Objectif mensuel',
      goal > 0
        ? `Objectif : **${goal.toFixed(2)} €**\nRéalisé : **${monthlyRevenue.toFixed(2)} €**\nProgression : **${Math.min(100, Math.round((monthlyRevenue / goal) * 100))}%**`
        : 'Aucun objectif configuré.',
      0xE91E63
    ],
    statistiques_globales: [
      '📊 Statistiques globales',
      `Membres : **${guild.memberCount}**\nDevis : **${quotes.length}**\nCommandes : **${orders.length}**\nProjets : **${projects.length}**\nVentes : **${sales.length}**\nCA : **${totalRevenue.toFixed(2)} €**`,
      0x9B59B6
    ]
  };

  for (const [key, [title, description, color]] of Object.entries(dashboards)) {
    const channel = guild.channels.cache.get(config.channels[key]);
    if (!channel || !channel.isTextBased()) continue;

    const oldId = config.panels[key];

    if (oldId) {
      try {
        const msg = await channel.messages.fetch(oldId);
        await msg.edit({ embeds: [embed(title, description, color)], components: [] });
        continue;
      } catch {}
    }

    const msg = await channel.send({ embeds: [embed(title, description, color)] });
    setConfig(guild.id, 'panels', key, msg.id);
  }
}

async function createQuote(guild, userId, projectName, service, description) {
  const id = nextId('quotes', 'DEV');

  const quote = {
    id,
    guildId: guild.id,
    userId,
    projectName,
    service,
    description,
    price: null,
    status: 'En attente',
    claimedBy: null,
    orderId: null,
    messageId: null,
    createdAt: new Date().toISOString()
  };

  const db = getDb();
  db.quotes[id] = quote;
  writeJson(DB_FILE, db);

  await saveQuoteCard(guild, quote);
  await sendDm(userId, {
    embeds: [embed(`💰 Demande de devis reçue — ${id}`, `Ton devis pour **${projectName}** a bien été enregistré.`, 0xF1C40F)]
  });
  await refreshDashboards(guild);

  return quote;
}

async function createOrder(guild, userId, projectName, service, description, price = null, quoteId = null) {
  const id = nextId('orders', 'CMD');

  const order = {
    id,
    guildId: guild.id,
    userId,
    projectName,
    service,
    description,
    price,
    quoteId,
    status: 'En attente',
    paymentStatus: 'Non envoyé',
    claimedBy: null,
    projectId: null,
    messageId: null,
    createdAt: new Date().toISOString()
  };

  const db = getDb();
  db.orders[id] = order;

  if (quoteId && db.quotes[quoteId]) {
    db.quotes[quoteId].status = 'Transformé en commande';
    db.quotes[quoteId].orderId = id;
  }

  writeJson(DB_FILE, db);

  await saveOrderCard(guild, order);

  if (quoteId) {
    const latest = getDb();
    await saveQuoteCard(guild, latest.quotes[quoteId]);
  }

  await sendDm(userId, {
    embeds: [embed(`📦 Commande reçue — ${id}`, `Ta commande **${projectName}** a été envoyée à notre équipe pour validation.`, 0x3498DB)]
  });
  await refreshDashboards(guild);

  return order;
}

async function createProject(guild, order) {
  const id = nextId('projects', 'PROJ');

  const project = {
    id,
    guildId: guild.id,
    userId: order.userId,
    orderId: order.id,
    projectName: order.projectName,
    stageIndex: 0,
    claimedBy: null,
    listMessageId: null,
    stageMessageId: null,
    stageChannelId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const db = getDb();
  db.projects[id] = project;
  db.orders[order.id].projectId = id;
  writeJson(DB_FILE, db);

  await saveProjectCards(guild, project);
  await saveOrderCard(guild, getDb().orders[order.id]);

  await sendDm(project.userId, {
    embeds: [embed(`🚀 Projet créé — ${id}`, `Ton projet **${project.projectName}** est maintenant en **En attente**.`, 0x57F287)]
  });

  await refreshDashboards(guild);
  return project;
}

async function changeProjectStage(guild, project, newIndex) {
  const oldStage = PROJECT_STAGES[project.stageIndex];
  const newStage = PROJECT_STAGES[newIndex];

  project.stageIndex = newIndex;
  project.updatedAt = new Date().toISOString();

  const db = getDb();
  db.projects[project.id] = project;
  writeJson(DB_FILE, db);

  await saveProjectCards(guild, project);
  await refreshDashboards(guild);

  await sendDm(project.userId, {
    embeds: [embed(
      `🚀 Mise à jour du projet ${project.id}`,
      `Ton projet **${project.projectName}** passe de **${oldStage.label}** à **${newStage.label}**.\n\nProgression : **${newStage.progress}%**`,
      0x3498DB
    )]
  });
}

async function showTracking(interaction, type) {
  const db = getDb();
  const guildId = interaction.guild?.id;

  if (!guildId) {
    return interaction.reply({ content: '❌ Utilise cette fonction depuis le serveur.', flags: MessageFlags.Ephemeral });
  }

  let items;

  if (type === 'quotes') {
    items = Object.values(db.quotes).filter(x => x.guildId === guildId && x.userId === interaction.user.id);
  } else if (type === 'orders') {
    items = Object.values(db.orders).filter(x => x.guildId === guildId && x.userId === interaction.user.id);
  } else {
    items = Object.values(db.projects).filter(x => x.guildId === guildId && x.userId === interaction.user.id);
  }

  if (!items.length) {
    return interaction.reply({ content: 'Aucun élément enregistré pour toi.', flags: MessageFlags.Ephemeral });
  }

  let description;

  if (type === 'quotes') {
    description = items.map(x => `**${x.id} — ${x.projectName}**\nStatut : ${x.status}\nPrix : ${x.price == null ? 'À définir' : `${Number(x.price).toFixed(2)} €`}`).join('\n\n');
  } else if (type === 'orders') {
    description = items.map(x => `**${x.id} — ${x.projectName}**\nStatut : ${x.status}\nPaiement : ${x.paymentStatus}\nProjet : ${x.projectId || 'Non créé'}`).join('\n\n');
  } else {
    description = items.map(x => {
      const s = PROJECT_STAGES[x.stageIndex];
      return `**${x.id} — ${x.projectName}**\nÉtape : ${s.emoji} ${s.label}\nProgression : ${s.progress}%`;
    }).join('\n\n');
  }

  return interaction.reply({
    embeds: [embed(type === 'quotes' ? '💰 Mes devis' : type === 'orders' ? '📦 Mes commandes' : '🚀 Mes projets', description)],
    flags: MessageFlags.Ephemeral
  });
}

const commands = [
  new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure Creaty Bot.')
    .addSubcommand(sub =>
      sub
        .setName('salon')
        .setDescription('Configure un salon ou une catégorie.')
        .addStringOption(opt => opt.setName('type').setDescription('Élément').setRequired(true).setAutocomplete(true))
        .addChannelOption(opt => opt.setName('cible').setDescription('Salon ou catégorie').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('role')
        .setDescription('Configure un rôle.')
        .addStringOption(opt => opt.setName('type').setDescription('Rôle').setRequired(true).setAutocomplete(true))
        .addRoleOption(opt => opt.setName('role').setDescription('Rôle').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('paiement')
        .setDescription('Configure le lien PayPal.')
        .addStringOption(opt => opt.setName('paypal').setDescription('Lien PayPal').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('objectif')
        .setDescription('Configure l’objectif mensuel.')
        .addNumberOption(opt => opt.setName('montant').setDescription('Montant en euros').setMinValue(0).setRequired(true))
    )
    .addSubcommand(sub => sub.setName('voir').setDescription('Affiche la configuration.')),

  new SlashCommandBuilder().setName('setup').setDescription('Réinstalle les panneaux configurés.'),
  new SlashCommandBuilder().setName('suivi').setDescription('Affiche tes devis, commandes et projets.')
].map(x => x.toJSON());

client.once(Events.ClientReady, async ready => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ CREATY BOT CONNECTÉ');
  console.log(`🤖 Nom : ${ready.user.tag}`);
  console.log(`🆔 ID : ${ready.user.id}`);
  console.log(`🌐 Serveurs : ${ready.guilds.cache.size}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  ensureData();

  for (const guild of ready.guilds.cache.values()) {
    getConfig(guild.id);
    await guild.commands.set(commands);
    await refreshDashboards(guild).catch(() => {});
    console.log(`✅ Commandes slash installées sur ${guild.name}`);
  }
});

client.on(Events.GuildMemberAdd, async member => {
  const config = getConfig(member.guild.id);

  if (config.roles.nouveau) {
    await member.roles.add(config.roles.nouveau).catch(() => {});
  }

  const channel = member.guild.channels.cache.get(config.channels.bienvenue);
  if (!channel?.isTextBased()) return;

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle(`👋 Bienvenue ${member.user.username} !`)
        .setDescription(`Bienvenue ${member} sur **${member.guild.name}** !\nTu es notre **${member.guild.memberCount}e membre**.`)
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .setTimestamp()
    ]
  }).catch(() => {});
});

client.on(Events.GuildMemberRemove, async member => {
  const config = getConfig(member.guild.id);
  const channel = member.guild.channels.cache.get(config.channels.depart);
  if (!channel?.isTextBased()) return;

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle(`👋 À bientôt ${member.user.username}`)
        .setDescription(`**${member.user.tag}** a quitté le serveur.`)
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .setTimestamp()
    ]
  }).catch(() => {});
});

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isAutocomplete()) {
      if (interaction.commandName !== 'config') return;

      const sub = interaction.options.getSubcommand();
      const focused = interaction.options.getFocused().toLowerCase();

      if (sub === 'salon') {
        const options = [
          ...CATEGORY_OPTIONS.map(([key, name]) => ({ name: `Catégorie • ${name}`, value: `category:${key}` })),
          ...CHANNEL_OPTIONS.map(([key, name]) => ({ name: `Salon • ${name}`, value: `channel:${key}` }))
        ];

        return interaction.respond(
          options.filter(x => x.name.toLowerCase().includes(focused)).slice(0, 25)
        );
      }

      if (sub === 'role') {
        return interaction.respond(
          ROLE_OPTIONS
            .map(([key, name]) => ({ name, value: key }))
            .filter(x => x.name.toLowerCase().includes(focused))
            .slice(0, 25)
        );
      }
    }

    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'suivi') {
        return interaction.reply({
          content: 'Choisis ce que tu veux consulter :',
          components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('my_quotes').setLabel('Mes devis').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('my_orders').setLabel('Mes commandes').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('my_projects').setLabel('Mes projets').setStyle(ButtonStyle.Success)
          )],
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.commandName === 'config') {
        if (!isAdmin(interaction.member)) {
          return interaction.reply({ content: '❌ Réservé aux administrateurs.', flags: MessageFlags.Ephemeral });
        }

        const sub = interaction.options.getSubcommand();

        if (sub === 'salon') {
          const raw = interaction.options.getString('type');
          const target = interaction.options.getChannel('cible');
          const [kind, key] = raw.split(':');

          if (kind === 'category' && target.type !== ChannelType.GuildCategory) {
            return interaction.reply({ content: '❌ Sélectionne une catégorie.', flags: MessageFlags.Ephemeral });
          }

          if (kind === 'channel' && target.type === ChannelType.GuildCategory) {
            return interaction.reply({ content: '❌ Sélectionne un salon.', flags: MessageFlags.Ephemeral });
          }

          setConfig(interaction.guild.id, kind === 'category' ? 'categories' : 'channels', key, target.id);

          if (kind === 'channel' && PANELS[key]) {
            await upsertPanel(interaction.guild, key);
          }

          return interaction.reply({
            content: `✅ **${key}** configuré sur ${target}.`,
            flags: MessageFlags.Ephemeral
          });
        }

        if (sub === 'role') {
          const key = interaction.options.getString('type');
          const role = interaction.options.getRole('role');

          setConfig(interaction.guild.id, 'roles', key, role.id);

          return interaction.reply({
            content: `✅ Rôle **${key}** configuré sur ${role}.`,
            flags: MessageFlags.Ephemeral
          });
        }

        if (sub === 'paiement') {
          const url = interaction.options.getString('paypal').trim();

          if (!/^https?:\/\//i.test(url)) {
            return interaction.reply({ content: '❌ Le lien doit commencer par http:// ou https://', flags: MessageFlags.Ephemeral });
          }

          setConfig(interaction.guild.id, 'settings', 'paypalUrl', url);

          return interaction.reply({ content: '✅ Lien PayPal enregistré.', flags: MessageFlags.Ephemeral });
        }

        if (sub === 'objectif') {
          const amount = interaction.options.getNumber('montant');
          setConfig(interaction.guild.id, 'settings', 'monthlyGoal', amount);
          await refreshDashboards(interaction.guild);

          return interaction.reply({ content: `✅ Objectif fixé à **${amount.toFixed(2)} €**.`, flags: MessageFlags.Ephemeral });
        }

        if (sub === 'voir') {
          const config = getConfig(interaction.guild.id);

          return interaction.reply({
            embeds: [embed('⚙️ Configuration', `Salons : **${Object.keys(config.channels).length}/${CHANNEL_OPTIONS.length}**\nCatégories : **${Object.keys(config.categories).length}/${CATEGORY_OPTIONS.length}**\nRôles : **${Object.keys(config.roles).length}/${ROLE_OPTIONS.length}**\nPayPal : **${config.settings.paypalUrl ? 'Oui' : 'Non'}**`)],
            flags: MessageFlags.Ephemeral
          });
        }
      }

      if (interaction.commandName === 'setup') {
        if (!isAdmin(interaction.member)) {
          return interaction.reply({ content: '❌ Réservé aux administrateurs.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const config = getConfig(interaction.guild.id);
        let ok = 0;

        for (const key of Object.keys(config.channels)) {
          if (PANELS[key] && await upsertPanel(interaction.guild, key)) ok++;
        }

        await refreshDashboards(interaction.guild);

        return interaction.editReply(`✅ **${ok} panneaux** installés ou mis à jour.`);
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === 'accept_rules') {
        const config = getConfig(interaction.guild.id);

        if (!config.roles.membre) {
          return interaction.reply({ content: '❌ Le rôle Membre n’est pas configuré.', flags: MessageFlags.Ephemeral });
        }

        await interaction.member.roles.add(config.roles.membre).catch(() => {});
        if (config.roles.nouveau) await interaction.member.roles.remove(config.roles.nouveau).catch(() => {});

        return interaction.reply({ content: '✅ Règlement accepté.', flags: MessageFlags.Ephemeral });
      }

      if (interaction.customId === 'new_suggestion') {
        const modal = new ModalBuilder().setCustomId('suggestion_modal').setTitle('Nouvelle suggestion');
        modal.addComponents(new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('text').setLabel('Ta suggestion').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000)
        ));
        return interaction.showModal(modal);
      }

      if (interaction.customId === 'quote_request') {
        const modal = new ModalBuilder().setCustomId('quote_request_modal').setTitle('Demande de devis');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('project').setLabel('Nom du projet').setStyle(TextInputStyle.Short).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('service').setLabel('Service demandé').setStyle(TextInputStyle.Short).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1500)
          )
        );
        return interaction.showModal(modal);
      }

      if (interaction.customId === 'order_request') {
        const modal = new ModalBuilder().setCustomId('order_request_modal').setTitle('Nouvelle commande');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('project').setLabel('Nom du projet').setStyle(TextInputStyle.Short).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('service').setLabel('Service souhaité').setStyle(TextInputStyle.Short).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('description').setLabel('Que veux-tu commander ?').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1500)
          )
        );
        return interaction.showModal(modal);
      }

      if (interaction.customId === 'ticket_help') {
        return interaction.reply({ content: 'Utilise le panneau Ticket pour ouvrir un ticket.', flags: MessageFlags.Ephemeral });
      }

      if (interaction.customId === 'declare_payment_manual') {
        const modal = new ModalBuilder().setCustomId('payment_manual_modal').setTitle('Déclarer un paiement');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('order').setLabel('Numéro CMD-0001').setStyle(TextInputStyle.Short).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('proof').setLabel('Preuve / référence').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000)
          )
        );
        return interaction.showModal(modal);
      }

      if (interaction.customId === 'my_quotes') return showTracking(interaction, 'quotes');
      if (interaction.customId === 'my_orders') return showTracking(interaction, 'orders');
      if (interaction.customId === 'my_projects') return showTracking(interaction, 'projects');

      if (interaction.customId.startsWith('q_')) {
        const [action, id] = interaction.customId.split(':');
        const db = getDb();
        const q = db.quotes[id];

        if (!q) return interaction.reply({ content: '❌ Devis introuvable.', flags: MessageFlags.Ephemeral });

        const config = getConfig(q.guildId);
        if (!isStaff(interaction.member, config)) {
          return interaction.reply({ content: '❌ Réservé au personnel.', flags: MessageFlags.Ephemeral });
        }

        if (action === 'q_claim') {
          q.claimedBy = interaction.user.id;
          db.quotes[id] = q;
          writeJson(DB_FILE, db);
          await saveQuoteCard(interaction.guild, q);
          return interaction.reply({ content: `✅ Devis pris par ${interaction.user}.` });
        }

        if (action === 'q_price') {
          const modal = new ModalBuilder().setCustomId(`q_price_modal:${id}`).setTitle(`Prix ${id}`);
          modal.addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('price').setLabel('Prix en euros').setStyle(TextInputStyle.Short).setRequired(true)
          ));
          return interaction.showModal(modal);
        }

        if (action === 'q_send') {
          if (q.price == null) {
            return interaction.reply({ content: '❌ Définis d’abord le prix.', flags: MessageFlags.Ephemeral });
          }

          const sent = await sendDm(q.userId, {
            embeds: [embed(`💰 Devis ${id}`, `Projet : **${q.projectName}**\nPrix : **${Number(q.price).toFixed(2)} €**`, 0xF1C40F)],
            components: [new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId(`client_q_accept:${id}`).setLabel('Accepter').setStyle(ButtonStyle.Success),
              new ButtonBuilder().setCustomId(`client_q_refuse:${id}`).setLabel('Refuser').setStyle(ButtonStyle.Danger)
            )]
          });

          if (!sent) {
            return interaction.reply({ content: '❌ Impossible d’envoyer le MP.', flags: MessageFlags.Ephemeral });
          }

          q.status = 'Envoyé au client';
          db.quotes[id] = q;
          writeJson(DB_FILE, db);
          await saveQuoteCard(interaction.guild, q);

          return interaction.reply({ content: '✅ Devis envoyé au client.' });
        }

        if (action === 'q_order') {
          if (q.status !== 'Accepté par le client') {
            return interaction.reply({ content: '❌ Le client doit accepter le devis.', flags: MessageFlags.Ephemeral });
          }

          if (q.orderId) {
            return interaction.reply({ content: `❌ Déjà lié à ${q.orderId}.`, flags: MessageFlags.Ephemeral });
          }

          const order = await createOrder(interaction.guild, q.userId, q.projectName, q.service, q.description, q.price, q.id);
          return interaction.reply({ content: `✅ Commande **${order.id}** créée.` });
        }

        if (action === 'q_contact') {
          const modal = new ModalBuilder().setCustomId(`contact_q:${id}`).setTitle('Contacter le client');
          modal.addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('text').setLabel('Message').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1500)
          ));
          return interaction.showModal(modal);
        }

        if (action === 'q_refuse') {
          q.status = 'Refusé';
          db.quotes[id] = q;
          writeJson(DB_FILE, db);
          await saveQuoteCard(interaction.guild, q);
          await sendDm(q.userId, { embeds: [embed(`❌ Devis ${id} refusé`, 'Ta demande de devis a été refusée.', 0xED4245)] });
          return interaction.reply({ content: `❌ Devis ${id} refusé.` });
        }

        if (action === 'q_archive') {
          q.status = 'Archivé';
          db.quotes[id] = q;
          writeJson(DB_FILE, db);
          await saveQuoteCard(interaction.guild, q);
          return interaction.reply({ content: `📁 Devis ${id} archivé.` });
        }
      }

      if (interaction.customId.startsWith('client_q_')) {
        const [action, id] = interaction.customId.split(':');
        const db = getDb();
        const q = db.quotes[id];

        if (!q || q.userId !== interaction.user.id) {
          return interaction.reply({ content: '❌ Ce devis ne t’appartient pas.', flags: MessageFlags.Ephemeral });
        }

        const guild = await client.guilds.fetch(q.guildId);

        if (action === 'client_q_accept') {
          q.status = 'Accepté par le client';
          db.quotes[id] = q;
          writeJson(DB_FILE, db);
          await saveQuoteCard(guild, q);
          await refreshDashboards(guild);

          return interaction.update({
            embeds: [embed(`✅ Devis ${id} accepté`, `Tu as accepté le devis de **${Number(q.price).toFixed(2)} €**.`, 0x57F287)],
            components: []
          });
        }

        q.status = 'Refusé par le client';
        db.quotes[id] = q;
        writeJson(DB_FILE, db);
        await saveQuoteCard(guild, q);
        await refreshDashboards(guild);

        return interaction.update({
          embeds: [embed(`❌ Devis ${id} refusé`, 'Le devis a été refusé.', 0xED4245)],
          components: []
        });
      }

      if (interaction.customId.startsWith('o_')) {
        const [action, id] = interaction.customId.split(':');
        const db = getDb();
        const o = db.orders[id];

        if (!o) return interaction.reply({ content: '❌ Commande introuvable.', flags: MessageFlags.Ephemeral });

        const config = getConfig(o.guildId);
        if (!isStaff(interaction.member, config)) {
          return interaction.reply({ content: '❌ Réservé au personnel.', flags: MessageFlags.Ephemeral });
        }

        if (action === 'o_claim') {
          o.claimedBy = interaction.user.id;
          db.orders[id] = o;
          writeJson(DB_FILE, db);
          await saveOrderCard(interaction.guild, o);
          return interaction.reply({ content: `✅ Commande prise par ${interaction.user}.` });
        }

        if (action === 'o_accept') {
          o.status = 'Acceptée';
          db.orders[id] = o;
          writeJson(DB_FILE, db);
          await saveOrderCard(interaction.guild, o);
          await sendDm(o.userId, { embeds: [embed(`✅ Commande ${id} acceptée`, 'Ta commande a été acceptée. Le lien de paiement va pouvoir t’être envoyé.', 0x57F287)] });
          return interaction.reply({ content: `✅ Commande ${id} acceptée.` });
        }

        if (action === 'o_refuse') {
          o.status = 'Refusée';
          db.orders[id] = o;
          writeJson(DB_FILE, db);
          await saveOrderCard(interaction.guild, o);
          await sendDm(o.userId, { embeds: [embed(`❌ Commande ${id} refusée`, 'Ta commande a été refusée.', 0xED4245)] });
          return interaction.reply({ content: `❌ Commande ${id} refusée.` });
        }

        if (action === 'o_contact') {
          const modal = new ModalBuilder().setCustomId(`contact_o:${id}`).setTitle('Contacter le client');
          modal.addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('text').setLabel('Message').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1500)
          ));
          return interaction.showModal(modal);
        }

        if (action === 'o_pay') {
          if (!config.settings.paypalUrl) {
            return interaction.reply({ content: '❌ Configure PayPal avec /config paiement.', flags: MessageFlags.Ephemeral });
          }

          const sent = await sendDm(o.userId, {
            embeds: [embed(`💳 Paiement ${id}`, `Montant : **${o.price == null ? 'À confirmer' : `${Number(o.price).toFixed(2)} €`}**\n\nLien PayPal officiel :\n${config.settings.paypalUrl}`, 0x2ECC71)],
            components: [new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId(`pay_order:${id}`).setLabel('J’ai payé').setStyle(ButtonStyle.Success)
            )]
          });

          if (!sent) {
            return interaction.reply({ content: '❌ Impossible d’envoyer le MP.', flags: MessageFlags.Ephemeral });
          }

          o.paymentStatus = 'Lien envoyé';
          db.orders[id] = o;
          writeJson(DB_FILE, db);
          await saveOrderCard(interaction.guild, o);

          return interaction.reply({ content: '✅ Lien PayPal envoyé.' });
        }

        if (action === 'o_archive') {
          o.status = 'Archivée';
          db.orders[id] = o;
          writeJson(DB_FILE, db);
          await saveOrderCard(interaction.guild, o);
          return interaction.reply({ content: `📁 Commande ${id} archivée.` });
        }
      }

      if (interaction.customId.startsWith('pay_order:')) {
        const orderId = interaction.customId.split(':')[1];
        const modal = new ModalBuilder().setCustomId(`payment_order_modal:${orderId}`).setTitle('Déclarer le paiement');
        modal.addComponents(new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('proof').setLabel('Preuve / référence').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000)
        ));
        return interaction.showModal(modal);
      }

      if (interaction.customId.startsWith('pay_accept:') || interaction.customId.startsWith('pay_refuse:') || interaction.customId.startsWith('pay_more:')) {
        const [action, id] = interaction.customId.split(':');
        const db = getDb();
        const p = db.payments[id];

        if (!p) return interaction.reply({ content: '❌ Paiement introuvable.', flags: MessageFlags.Ephemeral });

        const config = getConfig(p.guildId);
        if (!isStaff(interaction.member, config)) {
          return interaction.reply({ content: '❌ Réservé au personnel.', flags: MessageFlags.Ephemeral });
        }

        const o = db.orders[p.orderId];

        if (action === 'pay_accept') {
          p.status = 'Validé';
          o.paymentStatus = 'Validé';

          const saleId = nextId('sales', 'VENTE');
          const fresh = getDb();

          fresh.payments[id] = p;
          fresh.orders[o.id] = o;
          fresh.sales[saleId] = {
            id: saleId,
            guildId: p.guildId,
            orderId: o.id,
            userId: o.userId,
            projectName: o.projectName,
            amount: Number(o.price || 0),
            createdAt: new Date().toISOString()
          };

          writeJson(DB_FILE, fresh);

          const member = await interaction.guild.members.fetch(o.userId).catch(() => null);
          if (member && config.roles.client) await member.roles.add(config.roles.client).catch(() => {});
          if (member && config.roles.prospect) await member.roles.remove(config.roles.prospect).catch(() => {});

          const salesChannel = interaction.guild.channels.cache.get(config.channels.ventes);
          if (salesChannel?.isTextBased()) {
            await salesChannel.send({
              embeds: [embed(`💰 ${saleId}`, `Commande : **${o.id}**\nClient : <@${o.userId}>\nProjet : **${o.projectName}**\nMontant : **${Number(o.price || 0).toFixed(2)} €**`, 0x2ECC71)]
            });
          }

          const project = await createProject(interaction.guild, o);
          await refreshDashboards(interaction.guild);

          return interaction.update({
            embeds: [embed(`✅ Paiement ${id} validé`, `Projet créé : **${project.id}**\nVente : **${saleId}**`, 0x57F287)],
            components: []
          });
        }

        if (action === 'pay_refuse') {
          p.status = 'Refusé';
          db.payments[id] = p;
          writeJson(DB_FILE, db);
          await sendDm(p.userId, { embeds: [embed(`❌ Paiement ${id} refusé`, 'La preuve de paiement n’a pas été validée.', 0xED4245)] });

          return interaction.update({
            embeds: [embed(`❌ Paiement ${id} refusé`, `Commande : **${p.orderId}**`, 0xED4245)],
            components: []
          });
        }

        await sendDm(p.userId, { embeds: [embed(`📎 Nouvelle preuve demandée`, `Merci d’envoyer une nouvelle preuve pour la commande **${p.orderId}**.`)] });
        return interaction.reply({ content: '✅ Demande envoyée au client.', flags: MessageFlags.Ephemeral });
      }

      if (interaction.customId.startsWith('p_')) {
        const [action, id] = interaction.customId.split(':');
        const db = getDb();
        const p = db.projects[id];

        if (!p) return interaction.reply({ content: '❌ Projet introuvable.', flags: MessageFlags.Ephemeral });

        const config = getConfig(p.guildId);
        if (!isStaff(interaction.member, config)) {
          return interaction.reply({ content: '❌ Réservé au personnel.', flags: MessageFlags.Ephemeral });
        }

        if (action === 'p_claim') {
          p.claimedBy = interaction.user.id;
          db.projects[id] = p;
          writeJson(DB_FILE, db);
          await saveProjectCards(interaction.guild, p);
          return interaction.reply({ content: `✅ Projet pris par ${interaction.user}.` });
        }

        if (action === 'p_prev') {
          await changeProjectStage(interaction.guild, p, Math.max(0, p.stageIndex - 1));
          return interaction.reply({ content: `✅ Projet déplacé vers **${PROJECT_STAGES[Math.max(0, p.stageIndex - 1)].label}**. Le client a reçu un MP.` });
        }

        if (action === 'p_next') {
          await changeProjectStage(interaction.guild, p, Math.min(PROJECT_STAGES.length - 1, p.stageIndex + 1));
          return interaction.reply({ content: `✅ Projet déplacé. Le client a reçu un MP.` });
        }

        if (action === 'p_contact') {
          const modal = new ModalBuilder().setCustomId(`contact_p:${id}`).setTitle('Contacter le client');
          modal.addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('text').setLabel('Message').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1500)
          ));
          return interaction.showModal(modal);
        }
      }

      if (interaction.customId.startsWith('t_')) {
        const [action, id] = interaction.customId.split(':');
        const db = getDb();
        const t = db.tickets[id];

        if (!t) return interaction.reply({ content: '❌ Ticket introuvable.', flags: MessageFlags.Ephemeral });

        const config = getConfig(t.guildId);
        if (!isStaff(interaction.member, config)) {
          return interaction.reply({ content: '❌ Réservé au personnel.', flags: MessageFlags.Ephemeral });
        }

        if (action === 't_claim') {
          t.claimedBy = interaction.user.id;
          db.tickets[id] = t;
          writeJson(DB_FILE, db);
          return interaction.reply({ content: `✅ Ticket pris par ${interaction.user}.` });
        }

        if (action === 't_quote') {
          const modal = new ModalBuilder().setCustomId(`ticket_quote_modal:${id}`).setTitle('Créer un devis');
          modal.addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('project').setLabel('Nom du projet').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('service').setLabel('Service').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(true)
            )
          );
          return interaction.showModal(modal);
        }

        if (action === 't_contact') {
          const modal = new ModalBuilder().setCustomId(`contact_t:${id}`).setTitle('Contacter le client');
          modal.addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('text').setLabel('Message').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1500)
          ));
          return interaction.showModal(modal);
        }

        if (action === 't_close') {
          t.status = 'Fermé';
          db.tickets[id] = t;
          writeJson(DB_FILE, db);

          await interaction.channel.permissionOverwrites.edit(t.userId, { SendMessages: false }).catch(() => {});

          return interaction.update({
            embeds: [embed(`🔒 ${id} fermé`, 'Le ticket est fermé. Les données sont conservées.', 0x95A5A6)],
            components: []
          });
        }
      }
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'ticket_type') {
        const config = getConfig(interaction.guild.id);
        const premium = interaction.channelId === config.channels.support_premium;

        const categoryId = premium && config.categories.tickets_premium
          ? config.categories.tickets_premium
          : config.categories.tickets;

        if (!categoryId) {
          return interaction.reply({ content: '❌ Configure la catégorie Tickets.', flags: MessageFlags.Ephemeral });
        }

        const id = nextId('tickets', 'TICKET');
        const type = interaction.values[0];

        const permissionOverwrites = [
          { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles
            ]
          }
        ];

        for (const roleId of [
          config.roles.staff,
          config.roles.moderateur,
          config.roles.administrateur,
          config.roles.directeur,
          config.roles.cofondateur,
          config.roles.fondateur
        ].filter(Boolean)) {
          permissionOverwrites.push({
            id: roleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          });
        }

        const channel = await interaction.guild.channels.create({
          name: `${type}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90),
          type: ChannelType.GuildText,
          parent: categoryId,
          permissionOverwrites
        });

        const db = getDb();
        db.tickets[id] = {
          id,
          guildId: interaction.guild.id,
          userId: interaction.user.id,
          type,
          status: 'Ouvert',
          claimedBy: null,
          channelId: channel.id,
          createdAt: new Date().toISOString()
        };
        writeJson(DB_FILE, db);

        await channel.send({
          content: `${interaction.user}`,
          embeds: [embed(`🎫 ${id} — ${type}`, `Explique ta demande le plus précisément possible.`)],
          components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`t_claim:${id}`).setLabel('Prendre le ticket').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`t_quote:${id}`).setLabel('Créer un devis').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`t_contact:${id}`).setLabel('Contacter en MP').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`t_close:${id}`).setLabel('Fermer').setStyle(ButtonStyle.Danger)
          )]
        });

        return interaction.reply({ content: `✅ Ticket créé : ${channel}`, flags: MessageFlags.Ephemeral });
      }

      if (interaction.customId.startsWith('p_stage:')) {
        const id = interaction.customId.split(':')[1];
        const db = getDb();
        const p = db.projects[id];

        if (!p) return interaction.reply({ content: '❌ Projet introuvable.', flags: MessageFlags.Ephemeral });

        const config = getConfig(p.guildId);
        if (!isStaff(interaction.member, config)) {
          return interaction.reply({ content: '❌ Réservé au personnel.', flags: MessageFlags.Ephemeral });
        }

        const index = Number(interaction.values[0]);
        await changeProjectStage(interaction.guild, p, index);

        return interaction.reply({ content: `✅ Projet déplacé vers **${PROJECT_STAGES[index].label}**. Le client a reçu un MP.` });
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'suggestion_modal') {
        const config = getConfig(interaction.guild.id);
        const channel = interaction.guild.channels.cache.get(config.channels.suggestion);
        const text = interaction.fields.getTextInputValue('text');

        if (channel?.isTextBased()) {
          await channel.send({ embeds: [embed(`💡 Suggestion de ${interaction.user.username}`, text, 0xF1C40F)] });
        }

        return interaction.reply({ content: '✅ Suggestion envoyée.', flags: MessageFlags.Ephemeral });
      }

      if (interaction.customId === 'quote_request_modal') {
        const config = getConfig(interaction.guild.id);

        if (!config.channels.devis_commerciaux) {
          return interaction.reply({ content: '❌ Le salon Devis commerciaux n’est pas configuré.', flags: MessageFlags.Ephemeral });
        }

        const q = await createQuote(
          interaction.guild,
          interaction.user.id,
          interaction.fields.getTextInputValue('project'),
          interaction.fields.getTextInputValue('service'),
          interaction.fields.getTextInputValue('description')
        );

        if (config.roles.prospect && interaction.member && !interaction.member.roles.cache.has(config.roles.client)) {
          await interaction.member.roles.add(config.roles.prospect).catch(() => {});
        }

        return interaction.reply({ content: `✅ Devis créé : **${q.id}**.`, flags: MessageFlags.Ephemeral });
      }

      if (interaction.customId === 'order_request_modal') {
        const config = getConfig(interaction.guild.id);

        if (!config.channels.commandes_commerciales) {
          return interaction.reply({ content: '❌ Le salon Commandes commerciales n’est pas configuré.', flags: MessageFlags.Ephemeral });
        }

        const o = await createOrder(
          interaction.guild,
          interaction.user.id,
          interaction.fields.getTextInputValue('project'),
          interaction.fields.getTextInputValue('service'),
          interaction.fields.getTextInputValue('description')
        );

        if (config.roles.prospect && interaction.member && !interaction.member.roles.cache.has(config.roles.client)) {
          await interaction.member.roles.add(config.roles.prospect).catch(() => {});
        }

        return interaction.reply({ content: `✅ Commande créée : **${o.id}**.`, flags: MessageFlags.Ephemeral });
      }

      if (interaction.customId.startsWith('ticket_quote_modal:')) {
        const ticketId = interaction.customId.split(':')[1];
        const db = getDb();
        const t = db.tickets[ticketId];

        if (!t) return interaction.reply({ content: '❌ Ticket introuvable.', flags: MessageFlags.Ephemeral });

        const q = await createQuote(
          interaction.guild,
          t.userId,
          interaction.fields.getTextInputValue('project'),
          interaction.fields.getTextInputValue('service'),
          interaction.fields.getTextInputValue('description')
        );

        return interaction.reply({ content: `✅ Devis **${q.id}** créé à partir du ticket.` });
      }

      if (interaction.customId.startsWith('q_price_modal:')) {
        const id = interaction.customId.split(':')[1];
        const db = getDb();
        const q = db.quotes[id];

        if (!q) return interaction.reply({ content: '❌ Devis introuvable.', flags: MessageFlags.Ephemeral });

        const price = Number(interaction.fields.getTextInputValue('price').replace(',', '.'));

        if (!Number.isFinite(price) || price < 0) {
          return interaction.reply({ content: '❌ Prix invalide.', flags: MessageFlags.Ephemeral });
        }

        q.price = price;
        q.status = 'Prix défini';
        db.quotes[id] = q;
        writeJson(DB_FILE, db);

        await saveQuoteCard(interaction.guild, q);

        return interaction.reply({ content: `✅ Prix défini à **${price.toFixed(2)} €**.` });
      }

      if (interaction.customId === 'payment_manual_modal' || interaction.customId.startsWith('payment_order_modal:')) {
        const orderId = interaction.customId === 'payment_manual_modal'
          ? interaction.fields.getTextInputValue('order').trim().toUpperCase()
          : interaction.customId.split(':')[1];

        const proof = interaction.fields.getTextInputValue('proof');
        const db = getDb();
        const o = db.orders[orderId];

        if (!o || o.userId !== interaction.user.id) {
          return interaction.reply({ content: '❌ Cette commande est introuvable ou ne t’appartient pas.', flags: MessageFlags.Ephemeral });
        }

        const paymentId = nextId('payments', 'PAY');
        const latest = getDb();

        latest.payments[paymentId] = {
          id: paymentId,
          guildId: o.guildId,
          orderId,
          userId: interaction.user.id,
          proof,
          status: 'En attente',
          createdAt: new Date().toISOString()
        };

        latest.orders[orderId].paymentStatus = 'À vérifier';
        writeJson(DB_FILE, latest);

        const config = getConfig(o.guildId);
        const channel = interaction.guild.channels.cache.get(config.channels.paiements);

        if (!channel?.isTextBased()) {
          return interaction.reply({ content: '❌ Le salon Paiements n’est pas configuré.', flags: MessageFlags.Ephemeral });
        }

        await channel.send({
          embeds: [embed(`💳 ${paymentId}`, `Commande : **${orderId}**\nClient : <@${interaction.user.id}>\nMontant attendu : **${o.price == null ? 'Non défini' : `${Number(o.price).toFixed(2)} €`}**\n\nPreuve :\n${proof}`, 0xF39C12)],
          components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`pay_accept:${paymentId}`).setLabel('Valider').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`pay_refuse:${paymentId}`).setLabel('Refuser').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`pay_more:${paymentId}`).setLabel('Nouvelle preuve').setStyle(ButtonStyle.Secondary)
          )]
        });

        await saveOrderCard(interaction.guild, latest.orders[orderId]);

        return interaction.reply({ content: `✅ Paiement déclaré : **${paymentId}**.`, flags: MessageFlags.Ephemeral });
      }

      if (interaction.customId.startsWith('contact_')) {
        const [kind, id] = interaction.customId.split(':');
        const db = getDb();

        const map = {
          contact_q: db.quotes,
          contact_o: db.orders,
          contact_p: db.projects,
          contact_t: db.tickets
        };

        const item = map[kind]?.[id];

        if (!item) return interaction.reply({ content: '❌ Élément introuvable.', flags: MessageFlags.Ephemeral });

        const ok = await sendDm(item.userId, {
          embeds: [embed(`💬 Message concernant ${id}`, interaction.fields.getTextInputValue('text'))]
        });

        return interaction.reply({ content: ok ? '✅ Message envoyé.' : '❌ Impossible d’envoyer le MP.', flags: MessageFlags.Ephemeral });
      }
    }
  } catch (error) {
    console.error('❌ Erreur interaction :', error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: `❌ Erreur : ${error.message || 'Une erreur est survenue.'}`,
        flags: MessageFlags.Ephemeral
      }).catch(() => {});
    }
  }
});

client.on(Events.Error, error => {
  console.error('❌ Erreur Discord :', error);
});

process.on('unhandledRejection', error => {
  console.error('❌ Promesse non gérée :', error);
});

client.login(process.env.TOKEN);
