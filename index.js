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
  console.error('❌ TOKEN manquant dans .env ou Railway Variables.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ],
  partials: [
    Partials.GuildMember,
    Partials.Channel,
    Partials.User
  ],
  presence: {
    status: 'online',
    activities: [
      {
        name: 'Creaty Bot',
        type: ActivityType.Playing
      }
    ]
  }
});

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const OPS_FILE = path.join(DATA_DIR, 'operations.json');

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

const RULES_TEXT = [
  '**Bienvenue sur Creaty Bot.**',
  '',
  'Afin de garantir une communauté agréable, professionnelle et sécurisée, chaque membre doit respecter les règles ci-dessous.',
  '',
  '**1. Respect et comportement**',
  'Le respect est obligatoire envers tous les membres. Les insultes, provocations, menaces, discriminations, harcèlement ou comportements toxiques ne sont pas autorisés.',
  '',
  '**2. Spam et flood**',
  'Le spam, le flood, les mentions abusives, l’envoi répété du même message et toute utilisation gênante des salons sont interdits.',
  '',
  '**3. Publicité**',
  'La publicité non autorisée pour un serveur, un bot, une entreprise, un réseau social ou un service externe est interdite. Les espaces prévus pour présenter vos créations restent soumis aux règles du serveur.',
  '',
  '**4. Contenus interdits**',
  'Les contenus illégaux, choquants, haineux, pornographiques, violents ou dangereux sont strictement interdits.',
  '',
  '**5. Arnaques et sécurité**',
  'Toute tentative d’arnaque, de phishing, de vol de compte, de récupération de token, de mot de passe ou d’informations privées entraîne une sanction immédiate.',
  '',
  '**6. Commandes et paiements**',
  'Les commandes, devis et paiements doivent passer par les systèmes officiels de Creaty Bot. Ne transmettez jamais d’informations sensibles dans un salon public.',
  '',
  '**7. Tickets et support**',
  'Les tickets doivent être utilisés uniquement pour une demande réelle. Les tickets inutiles, le spam du support ou les abus peuvent entraîner des sanctions.',
  '',
  '**8. Personnel et décisions**',
  'Merci de respecter les décisions du personnel. En cas de désaccord, utilisez calmement le support au lieu de créer un conflit dans les salons publics.',
  '',
  '**9. Utilisation des créations**',
  'Les créations livrées restent soumises aux conditions définies lors de la commande. Il est interdit de revendre, copier ou redistribuer un travail sans autorisation lorsque cela n’est pas prévu.',
  '',
  '**10. Acceptation du règlement**',
  'En cliquant sur le bouton ci-dessous, tu confirmes avoir lu et accepté ce règlement. Le rôle **Membre** pourra alors t’être attribué automatiquement.',
  '',
  'Le règlement peut évoluer. Les membres restent responsables du respect de sa version la plus récente.'
].join('\n');

const CHANNEL_KEYS = [
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

const CATEGORY_KEYS = [
  ['tickets', 'Catégorie Tickets'],
  ['devis_prives', 'Catégorie Devis privés'],
  ['commandes_privees', 'Catégorie Commandes privées'],
  ['projets_prives', 'Catégorie Projets privés'],
  ['archives_privees', 'Catégorie Archives privées'],
  ['tickets_premium', 'Catégorie Tickets Premium']
];

const ROLE_KEYS = [
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

const PANEL_DEFINITIONS = {
  bienvenue: ['👋 Bienvenue', 'Chaque nouveau membre sera accueilli ici automatiquement avec sa photo de profil et le nombre de membres.', 0x57F287],
  depart: ['👋 À bientôt', 'Les départs des membres seront signalés automatiquement dans ce salon.', 0xED4245],
  reglement: ['📜 Règlement de Creaty Bot', RULES_TEXT, 0x57F287, 'rules'],
  annonces: ['📢 Annonces officielles', 'Toutes les annonces importantes de Creaty Bot seront publiées ici.', 0x5865F2],
  info: ['📌 Informations', 'Informations essentielles concernant Creaty Bot, ses services et son fonctionnement.', 0x3498DB],
  roadmap: ['🗺️ Roadmap', 'Fonctionnalités prévues, développements en cours et nouveautés terminées.', 0x9B59B6],
  liens: ['🔗 Nos liens', 'Tous les liens officiels de Creaty Bot seront regroupés ici.', 0x3498DB],
  faq: ['❓ FAQ', 'Questions fréquentes sur les devis, commandes, paiements, livraisons, garanties et support.', 0xF1C40F],
  sondages: ['📊 Sondages', 'Les sondages de la communauté seront publiés ici.', 0x9B59B6],
  ticket: ['🎫 Support Creaty Bot', 'Choisis le type de ticket correspondant à ta demande. Un salon privé sera créé pour toi et le personnel.', 0x3498DB, 'ticket'],
  attente_vocale: ['🎙️ Attente vocale', 'Espace d’attente pour les demandes nécessitant une prise en charge vocale.', 0x95A5A6],
  discussion: ['💬 Discussion', 'Salon principal de discussion de la communauté.', 0x5865F2],
  media: ['📷 Médias', 'Partage ici tes images, vidéos et créations.', 0x3498DB],
  suggestion: ['💡 Suggestions', 'Clique sur le bouton pour proposer une idée à l’équipe.', 0xF1C40F, 'suggestion'],
  vos_bots: ['🤖 Vos bots', 'Présente ici les bots Discord et projets que tu as créés.', 0x5865F2],
  presentation: ['👋 Présentations', 'Présente-toi à la communauté.', 0x57F287],
  evenements: ['🎉 Événements', 'Les événements et animations seront annoncés ici.', 0xE91E63],
  creation_bot: ['🤖 Création de bot Discord', 'Création de bots Discord personnalisés : modération, tickets, économie, automatisation, commandes slash et plus.', 0x5865F2, 'service'],
  creation_serveur: ['💬 Création de serveur Discord', 'Création et configuration complète de serveurs Discord.', 0x5865F2, 'service'],
  hebergement: ['🌐 Hébergement', 'Solutions d’hébergement pour maintenir vos projets en ligne.', 0x3498DB, 'service'],
  tarifs: ['💰 Tarifs', 'Les tarifs officiels sont présentés ici. Pour un projet personnalisé, demande un devis.', 0xF1C40F, 'quote'],
  garantie: ['📃 Garantie', 'Conditions de garantie, corrections, maintenance et service après-vente.', 0x95A5A6],
  commander: ['📝 Commander', 'Clique sur le bouton pour démarrer une commande. Le bot t’enverra un message privé afin de recueillir les informations de ton projet.', 0x5865F2, 'order'],
  demander_devis: ['💰 Demander un devis', 'Clique sur le bouton pour envoyer une demande de devis détaillée.', 0xF1C40F, 'quote'],
  suivi_commandes: ['📦 Suivi client', 'Consulte tes devis, commandes et projets. Les réponses sont privées et visibles uniquement par toi.', 0x3498DB, 'tracking'],
  paiements: ['💳 Paiements', 'Après acceptation d’une commande, le lien de paiement officiel est envoyé en message privé. Tu peux ensuite déclarer ton paiement ici.', 0x2ECC71, 'payment'],
  conditions: ['📜 Conditions', 'Conditions applicables aux devis, commandes, paiements, délais, livraisons et garanties.', 0x95A5A6],
  questions_commandes: ['❓ Questions commandes', 'Ouvre un ticket pour toute question concernant un devis, une commande ou un paiement.', 0xF1C40F, 'ticket'],
  offres_speciales: ['🎯 Offres spéciales', 'Promotions et offres temporaires de Creaty Bot.', 0xE91E63],
  infos_clients: ['📢 Informations clients', 'Informations importantes destinées aux clients.', 0x5865F2],
  livraisons_clients: ['📂 Livraisons clients', 'Les informations de livraison destinées aux clients seront centralisées ici.', 0x2ECC71],
  factures: ['📜 Factures', 'Informations liées aux factures et justificatifs de commande.', 0x95A5A6],
  avis: ['⭐ Laisser un avis', 'Une fois ton projet terminé, partage ton expérience avec Creaty Bot.', 0xF1C40F],
  support_premium: ['👑 Support prioritaire', 'Support réservé aux clients Premium.', 0xF1C40F, 'ticket'],
  commandes_premium: ['⚡ Commandes prioritaires', 'Suivi des commandes prioritaires Premium.', 0xF1C40F],
  avantages_premium: ['🎁 Avantages Premium', 'Avantages réservés aux clients Premium.', 0xF1C40F],
  annonces_premium: ['📢 Annonces Premium', 'Annonces réservées aux clients Premium.', 0xF1C40F],
  premium_chat: ['💬 Premium Chat', 'Salon privé réservé aux clients Premium.', 0xF1C40F],
  annonces_dev: ['📢 Annonces développement', 'Annonces internes de l’équipe développement.', 0x3498DB],
  discussion_dev: ['💬 Discussion développement', 'Échanges internes entre développeurs.', 0x3498DB],
  documentation: ['📚 Documentation', 'Documentation technique et procédures internes.', 0x3498DB],
  tests_dev: ['🧪 Tests développement', 'Suivi des fonctionnalités en phase de test.', 0x9B59B6],
  bugs: ['🐞 Bugs', 'Suivi des bugs détectés sur les projets et outils internes.', 0xED4245],
  liste_projets: ['📋 Liste des projets', 'Tableau général des projets actifs. Il est mis à jour automatiquement par Creaty Bot.', 0x5865F2],
  projets_attente: ['🟢 Projets en attente', 'Projets payés et acceptés, en attente de prise en charge.', 0x57F287],
  analyse: ['🟡 Projets en analyse', 'Projets actuellement en phase d’analyse.', 0xF1C40F],
  developpement: ['🔵 Projets en développement', 'Projets actuellement en développement.', 0x3498DB],
  tests_projets: ['🟣 Projets en tests', 'Projets actuellement en phase de tests.', 0x9B59B6],
  corrections: ['🟠 Projets en corrections', 'Projets nécessitant des corrections ou ajustements.', 0xE67E22],
  termines: ['✅ Projets terminés', 'Projets dont la réalisation est terminée.', 0x57F287],
  livraisons_projets: ['📦 Livraisons projets', 'Projets prêts à être livrés ou en cours de livraison.', 0x2ECC71],
  archives: ['📁 Archives projets', 'Historique des projets archivés.', 0x95A5A6],
  ventes: ['💰 Ventes', 'Chaque vente validée apparaîtra ici automatiquement.', 0xF1C40F],
  devis_commerciaux: ['📋 Devis', 'Tous les devis demandés et leur statut sont suivis ici.', 0xF1C40F],
  commandes_commerciales: ['📦 Commandes', 'Toutes les commandes et leur statut sont suivis ici.', 0x3498DB],
  statistiques_commerciales: ['📊 Statistiques commerciales', 'Statistiques automatiques sur les devis, commandes et ventes.', 0x9B59B6],
  objectifs: ['🎯 Objectifs', 'Suivi automatique de l’objectif mensuel de chiffre d’affaires.', 0xE91E63],
  chiffre_affaires: ['📈 Chiffre d’affaires', 'Suivi automatique du chiffre d’affaires basé uniquement sur les paiements validés.', 0x2ECC71],
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
  statistiques_globales: ['📊 Statistiques globales', 'Vue globale automatique de l’activité de Creaty Bot.', 0x9B59B6],
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

function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ guilds: {} }, null, 2));
  }

  if (!fs.existsSync(OPS_FILE)) {
    fs.writeFileSync(
      OPS_FILE,
      JSON.stringify({
        counters: {
          tickets: 0,
          quotes: 0,
          orders: 0,
          payments: 0,
          projects: 0,
          sales: 0
        },
        tickets: {},
        quotes: {},
        orders: {},
        payments: {},
        projects: {},
        sales: {}
      }, null, 2)
    );
  }
}

function loadJson(file) {
  ensureFiles();
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveJson(file, data) {
  ensureFiles();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function migrateGuildConfig(guildId) {
  const data = loadJson(CONFIG_FILE);

  if (!data.guilds[guildId]) {
    data.guilds[guildId] = {};
  }

  const cfg = data.guilds[guildId];
  if (!cfg.channels) cfg.channels = {};
  if (!cfg.categories) cfg.categories = {};
  if (!cfg.roles) cfg.roles = {};
  if (!cfg.panels) cfg.panels = {};
  if (!cfg.settings) cfg.settings = {};
  if (typeof cfg.settings.paypalUrl !== 'string') cfg.settings.paypalUrl = '';
  if (typeof cfg.settings.monthlyGoal !== 'number') cfg.settings.monthlyGoal = 0;

  saveJson(CONFIG_FILE, data);
  return cfg;
}

function migrateOperations() {
  const data = loadJson(OPS_FILE);

  if (!data.counters) data.counters = {};
  for (const key of ['tickets', 'quotes', 'orders', 'payments', 'projects', 'sales']) {
    if (typeof data.counters[key] !== 'number') data.counters[key] = 0;
  }

  for (const key of ['tickets', 'quotes', 'orders', 'payments', 'projects', 'sales']) {
    if (!data[key]) data[key] = {};
  }

  saveJson(OPS_FILE, data);
  return data;
}

function getGuildConfig(guildId) {
  return migrateGuildConfig(guildId);
}

function updateGuildConfig(guildId, section, key, value) {
  const data = loadJson(CONFIG_FILE);
  if (!data.guilds[guildId]) data.guilds[guildId] = {};
  const cfg = data.guilds[guildId];

  if (!cfg.channels) cfg.channels = {};
  if (!cfg.categories) cfg.categories = {};
  if (!cfg.roles) cfg.roles = {};
  if (!cfg.panels) cfg.panels = {};
  if (!cfg.settings) cfg.settings = {};

  if (!cfg[section]) cfg[section] = {};
  cfg[section][key] = value;

  saveJson(CONFIG_FILE, data);
}

function nextId(counter, prefix) {
  const data = migrateOperations();
  data.counters[counter] += 1;
  const id = `${prefix}-${String(data.counters[counter]).padStart(4, '0')}`;
  saveJson(OPS_FILE, data);
  return id;
}

function makeEmbed(title, description, color = 0x5865F2) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: 'Creaty Bot' });
}

function isAdmin(member) {
  return Boolean(
    member &&
    member.permissions &&
    member.permissions.has(PermissionFlagsBits.Administrator)
  );
}

function hasStaffAccess(member, config) {
  if (!member) return false;
  if (isAdmin(member)) return true;

  const allowed = [
    config.roles.staff,
    config.roles.commercial,
    config.roles.developpeur,
    config.roles.moderateur,
    config.roles.administrateur,
    config.roles.directeur,
    config.roles.cofondateur,
    config.roles.fondateur
  ].filter(Boolean);

  return member.roles.cache.some(role => allowed.includes(role.id));
}

function getStaffOverwrites(guild, config) {
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    }
  ];

  const roleIds = [
    config.roles.staff,
    config.roles.commercial,
    config.roles.developpeur,
    config.roles.moderateur,
    config.roles.administrateur,
    config.roles.directeur,
    config.roles.cofondateur,
    config.roles.fondateur
  ].filter(Boolean);

  for (const roleId of [...new Set(roleIds)]) {
    overwrites.push({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ManageMessages
      ]
    });
  }

  return overwrites;
}

async function dmUser(userId, payload) {
  try {
    const user = await client.users.fetch(userId);
    await user.send(payload);
    return true;
  } catch {
    return false;
  }
}

function buildPanelComponents(type) {
  if (type === 'rules') {
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('accept_rules')
          .setLabel('Accepter le règlement')
          .setEmoji('✅')
          .setStyle(ButtonStyle.Success)
      )
    ];
  }

  if (type === 'ticket') {
    return [
      new ActionRowBuilder().addComponents(
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
      )
    ];
  }

  if (type === 'suggestion') {
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('new_suggestion')
          .setLabel('Proposer une suggestion')
          .setEmoji('💡')
          .setStyle(ButtonStyle.Primary)
      )
    ];
  }

  if (type === 'service') {
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('quote_request')
          .setLabel('Demander un devis')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('order_request')
          .setLabel('Commander')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('ticket_support')
          .setLabel('Poser une question')
          .setStyle(ButtonStyle.Secondary)
      )
    ];
  }

  if (type === 'quote') {
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('quote_request')
          .setLabel('Demander un devis')
          .setEmoji('💰')
          .setStyle(ButtonStyle.Primary)
      )
    ];
  }

  if (type === 'order') {
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('order_request')
          .setLabel('Commander')
          .setEmoji('📝')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('quote_request')
          .setLabel('Demander un devis')
          .setStyle(ButtonStyle.Primary)
      )
    ];
  }

  if (type === 'tracking') {
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('my_quotes')
          .setLabel('Voir mes devis')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('my_orders')
          .setLabel('Voir mes commandes')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('my_projects')
          .setLabel('Voir mes projets')
          .setStyle(ButtonStyle.Success)
      )
    ];
  }

  if (type === 'payment') {
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('declare_payment')
          .setLabel('Déclarer un paiement')
          .setEmoji('💳')
          .setStyle(ButtonStyle.Success)
      )
    ];
  }

  return [];
}

async function installOrUpdatePanel(guild, key) {
  const config = getGuildConfig(guild.id);
  const channelId = config.channels[key];
  const def = PANEL_DEFINITIONS[key];

  if (!channelId || !def) return { success: false };

  const channel = guild.channels.cache.get(channelId);
  if (!channel || !channel.isTextBased()) return { success: false };

  const [title, description, color, componentType] = def;
  const payload = {
    embeds: [makeEmbed(title, description, color)],
    components: buildPanelComponents(componentType)
  };

  const oldId = config.panels[key];

  if (oldId) {
    try {
      const oldMessage = await channel.messages.fetch(oldId);
      await oldMessage.edit(payload);
      return { success: true, action: 'updated' };
    } catch {}
  }

  const message = await channel.send(payload);
  updateGuildConfig(guild.id, 'panels', key, message.id);

  return { success: true, action: 'created' };
}

async function createPrivateStaffChannel(guild, categoryId, name, config) {
  return guild.channels.create({
    name: name.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90),
    type: ChannelType.GuildText,
    parent: categoryId || undefined,
    permissionOverwrites: getStaffOverwrites(guild, config)
  });
}

function ticketButtons(ticketId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ticket_claim:${ticketId}`).setLabel('Prendre le ticket').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`ticket_quote:${ticketId}`).setLabel('Créer un devis').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`ticket_contact:${ticketId}`).setLabel('Contacter en MP').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`ticket_close:${ticketId}`).setLabel('Fermer').setStyle(ButtonStyle.Danger)
    )
  ];
}

function quoteButtons(quoteId, status) {
  const disabled = status === 'Archivé' || status === 'Refusé';

  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`quote_claim:${quoteId}`).setLabel('Prendre le devis').setStyle(ButtonStyle.Primary).setDisabled(disabled),
      new ButtonBuilder().setCustomId(`quote_price:${quoteId}`).setLabel('Définir / modifier le prix').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
      new ButtonBuilder().setCustomId(`quote_send:${quoteId}`).setLabel('Envoyer au client').setStyle(ButtonStyle.Success).setDisabled(disabled),
      new ButtonBuilder().setCustomId(`quote_contact:${quoteId}`).setLabel('Contacter le client').setStyle(ButtonStyle.Secondary).setDisabled(disabled)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`quote_order:${quoteId}`).setLabel('Transformer en commande').setStyle(ButtonStyle.Success).setDisabled(status !== 'Accepté par le client'),
      new ButtonBuilder().setCustomId(`quote_refuse:${quoteId}`).setLabel('Refuser').setStyle(ButtonStyle.Danger).setDisabled(disabled),
      new ButtonBuilder().setCustomId(`quote_archive:${quoteId}`).setLabel('Archiver').setStyle(ButtonStyle.Secondary).setDisabled(status === 'Archivé')
    )
  ];
}

function orderButtons(orderId, status) {
  const closed = status === 'Refusée' || status === 'Archivée';

  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`order_claim:${orderId}`).setLabel('Prendre la commande').setStyle(ButtonStyle.Primary).setDisabled(closed),
      new ButtonBuilder().setCustomId(`order_accept:${orderId}`).setLabel('Accepter la commande').setStyle(ButtonStyle.Success).setDisabled(status !== 'En attente d’acceptation'),
      new ButtonBuilder().setCustomId(`order_refuse:${orderId}`).setLabel('Refuser').setStyle(ButtonStyle.Danger).setDisabled(closed),
      new ButtonBuilder().setCustomId(`order_contact:${orderId}`).setLabel('Contacter le client').setStyle(ButtonStyle.Secondary).setDisabled(closed)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`order_payment:${orderId}`).setLabel('Envoyer le paiement').setStyle(ButtonStyle.Success).setDisabled(status !== 'Acceptée'),
      new ButtonBuilder().setCustomId(`order_archive:${orderId}`).setLabel('Archiver').setStyle(ButtonStyle.Secondary).setDisabled(status === 'Archivée')
    )
  ];
}

function projectButtons(projectId, stageIndex) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`project_claim:${projectId}`).setLabel('Prendre le projet').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`project_prev:${projectId}`).setLabel('Étape précédente').setStyle(ButtonStyle.Secondary).setDisabled(stageIndex <= 0),
      new ButtonBuilder().setCustomId(`project_next:${projectId}`).setLabel('Étape suivante').setStyle(ButtonStyle.Success).setDisabled(stageIndex >= PROJECT_STAGES.length - 1),
      new ButtonBuilder().setCustomId(`project_contact:${projectId}`).setLabel('Contacter le client').setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`project_stage:${projectId}`)
        .setPlaceholder('Choisir directement une étape')
        .addOptions(
          PROJECT_STAGES.map((stage, index) => ({
            label: stage.label,
            description: `${stage.progress}%`,
            value: String(index),
            emoji: stage.emoji,
            default: index === stageIndex
          }))
        )
    )
  ];
}

function quoteEmbed(quote) {
  return makeEmbed(
    `💰 ${quote.id} — ${quote.projectName}`,
    [
      `**Client :** <@${quote.userId}>`,
      `**Service :** ${quote.service}`,
      `**Prix :** ${quote.price !== null ? `${quote.price} €` : 'À définir'}`,
      `**Statut :** ${quote.status}`,
      `**Responsable :** ${quote.claimedBy ? `<@${quote.claimedBy}>` : 'Aucun'}`,
      '',
      '**Description :**',
      quote.description
    ].join('\n'),
    0xF1C40F
  );
}

function orderEmbed(order) {
  return makeEmbed(
    `📦 ${order.id} — ${order.projectName}`,
    [
      `**Client :** <@${order.userId}>`,
      `**Service :** ${order.service}`,
      `**Devis lié :** ${order.quoteId || 'Aucun'}`,
      `**Prix :** ${order.price !== null ? `${order.price} €` : 'À définir'}`,
      `**Statut :** ${order.status}`,
      `**Paiement :** ${order.paymentStatus}`,
      `**Responsable :** ${order.claimedBy ? `<@${order.claimedBy}>` : 'Aucun'}`,
      `**Projet créé :** ${order.projectId || 'Non'}`
    ].join('\n'),
    0x3498DB
  );
}

function projectEmbed(project) {
  const stage = PROJECT_STAGES[project.stageIndex] || PROJECT_STAGES[0];

  return makeEmbed(
    `${stage.emoji} ${project.id} — ${project.projectName}`,
    [
      `**Client :** <@${project.userId}>`,
      `**Commande :** ${project.orderId}`,
      `**Développeur / responsable :** ${project.claimedBy ? `<@${project.claimedBy}>` : 'Aucun'}`,
      `**Étape :** ${stage.label}`,
      `**Progression :** ${stage.progress}%`,
      `**Dernière mise à jour :** <t:${Math.floor(new Date(project.updatedAt).getTime() / 1000)}:R>`
    ].join('\n'),
    0x5865F2
  );
}

async function refreshQuoteMessage(guild, quote) {
  if (!quote.channelId || !quote.messageId) return;
  try {
    const channel = await guild.channels.fetch(quote.channelId);
    const message = await channel.messages.fetch(quote.messageId);
    await message.edit({
      embeds: [quoteEmbed(quote)],
      components: quoteButtons(quote.id, quote.status)
    });
  } catch {}
}

async function refreshOrderMessage(guild, order) {
  if (!order.channelId || !order.messageId) return;
  try {
    const channel = await guild.channels.fetch(order.channelId);
    const message = await channel.messages.fetch(order.messageId);
    await message.edit({
      embeds: [orderEmbed(order)],
      components: orderButtons(order.id, order.status)
    });
  } catch {}
}

async function refreshProjectMessage(guild, project) {
  if (!project.channelId || !project.messageId) return;
  try {
    const channel = await guild.channels.fetch(project.channelId);
    const message = await channel.messages.fetch(project.messageId);
    await message.edit({
      embeds: [projectEmbed(project)],
      components: projectButtons(project.id, project.stageIndex)
    });
  } catch {}
}

async function createQuote(guild, userId, projectName, service, description, price = null, sourceTicketId = null) {
  const config = getGuildConfig(guild.id);
  const id = nextId('quotes', 'DEV');

  const quote = {
    id,
    guildId: guild.id,
    userId,
    projectName,
    service,
    description,
    price,
    status: 'En attente',
    claimedBy: null,
    sourceTicketId,
    orderId: null,
    channelId: null,
    messageId: null,
    createdAt: new Date().toISOString()
  };

  const channel = await createPrivateStaffChannel(
    guild,
    config.categories.devis_prives,
    `devis-${id}`,
    config
  );

  const message = await channel.send({
    embeds: [quoteEmbed(quote)],
    components: quoteButtons(id, quote.status)
  });

  quote.channelId = channel.id;
  quote.messageId = message.id;

  const ops = migrateOperations();
  ops.quotes[id] = quote;
  saveJson(OPS_FILE, ops);

  await dmUser(userId, {
    embeds: [
      makeEmbed(
        `💰 Demande de devis reçue — ${id}`,
        `Nous avons bien reçu ta demande pour **${projectName}**.\n\nL’équipe va étudier ton projet et pourra ensuite t’envoyer une proposition.`,
        0xF1C40F
      )
    ]
  });

  await refreshBusinessDashboards(guild);
  return quote;
}

async function createOrder(guild, userId, projectName, service, description, price = null, quoteId = null) {
  const config = getGuildConfig(guild.id);
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
    status: 'En attente d’acceptation',
    paymentStatus: 'Non envoyé',
    claimedBy: null,
    projectId: null,
    channelId: null,
    messageId: null,
    createdAt: new Date().toISOString()
  };

  const channel = await createPrivateStaffChannel(
    guild,
    config.categories.commandes_privees,
    `commande-${id}`,
    config
  );

  const message = await channel.send({
    embeds: [orderEmbed(order)],
    components: orderButtons(id, order.status)
  });

  order.channelId = channel.id;
  order.messageId = message.id;

  const ops = migrateOperations();
  ops.orders[id] = order;

  if (quoteId && ops.quotes[quoteId]) {
    ops.quotes[quoteId].orderId = id;
    ops.quotes[quoteId].status = 'Transformé en commande';
  }

  saveJson(OPS_FILE, ops);

  const listChannel = guild.channels.cache.get(config.channels.liste_projets);
  if (listChannel && listChannel.isTextBased()) {
    await listChannel.send({
      embeds: [
        makeEmbed(
          `📝 Nouvelle commande à étudier — ${id}`,
          `Client : <@${userId}>\nProjet : **${projectName}**\nService : **${service}**\nStatut : **En attente d’acceptation**`
        )
      ]
    }).catch(() => {});
  }

  await dmUser(userId, {
    embeds: [
      makeEmbed(
        `📝 Commande reçue — ${id}`,
        `Ta demande pour **${projectName}** a bien été reçue.\n\nL’équipe va l’étudier. Si elle est acceptée, le lien de paiement officiel te sera envoyé en message privé.`,
        0x3498DB
      )
    ]
  });

  await refreshBusinessDashboards(guild);
  return order;
}

async function createProjectFromOrder(guild, order) {
  const config = getGuildConfig(guild.id);
  const id = nextId('projects', 'PROJ');

  const project = {
    id,
    guildId: guild.id,
    userId: order.userId,
    orderId: order.id,
    projectName: order.projectName,
    service: order.service,
    stageIndex: 0,
    claimedBy: null,
    channelId: null,
    messageId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const channel = await createPrivateStaffChannel(
    guild,
    config.categories.projets_prives,
    `projet-${id}`,
    config
  );

  const message = await channel.send({
    embeds: [projectEmbed(project)],
    components: projectButtons(id, project.stageIndex)
  });

  project.channelId = channel.id;
  project.messageId = message.id;

  const ops = migrateOperations();
  ops.projects[id] = project;

  if (ops.orders[order.id]) {
    ops.orders[order.id].projectId = id;
  }

  saveJson(OPS_FILE, ops);

  await postProjectStageCard(guild, project, true);
  await refreshBusinessDashboards(guild);

  await dmUser(order.userId, {
    embeds: [
      makeEmbed(
        `🚀 Projet créé — ${id}`,
        `Ton paiement a été validé et ton projet **${project.projectName}** est maintenant enregistré.\n\nStatut actuel : **${PROJECT_STAGES[0].label}**.\nTu peux suivre son avancement depuis le salon de suivi des commandes.`,
        0x57F287
      )
    ]
  });

  return project;
}

async function postProjectStageCard(guild, project, first = false) {
  const config = getGuildConfig(guild.id);
  const stage = PROJECT_STAGES[project.stageIndex];
  const channel = guild.channels.cache.get(config.channels[stage.key]);

  if (!channel || !channel.isTextBased()) return;

  await channel.send({
    embeds: [
      makeEmbed(
        `${stage.emoji} ${project.id} — ${project.projectName}`,
        [
          `Client : <@${project.userId}>`,
          `Commande : **${project.orderId}**`,
          `Étape : **${stage.label}**`,
          `Progression : **${stage.progress}%**`,
          `Responsable : ${project.claimedBy ? `<@${project.claimedBy}>` : 'Aucun'}`,
          first ? '\nLe projet vient d’entrer dans cette étape.' : '\nLe projet vient de changer d’étape.'
        ].join('\n'),
        0x5865F2
      )
    ]
  }).catch(() => {});
}

async function refreshBusinessDashboards(guild) {
  const config = getGuildConfig(guild.id);
  const ops = migrateOperations();

  const quotes = Object.values(ops.quotes).filter(x => x.guildId === guild.id);
  const orders = Object.values(ops.orders).filter(x => x.guildId === guild.id);
  const projects = Object.values(ops.projects).filter(x => x.guildId === guild.id);
  const sales = Object.values(ops.sales).filter(x => x.guildId === guild.id);

  const now = new Date();
  const sameMonth = iso => {
    const d = new Date(iso);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  const monthlySales = sales.filter(s => sameMonth(s.createdAt));
  const monthlyRevenue = monthlySales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const acceptedQuotes = quotes.filter(q => q.status === 'Accepté par le client' || q.status === 'Transformé en commande').length;
  const goal = Number(config.settings.monthlyGoal || 0);
  const goalPct = goal > 0 ? Math.min(100, Math.round((monthlyRevenue / goal) * 100)) : 0;

  const dynamic = {
    statistiques_commerciales: [
      '📊 Statistiques commerciales',
      [
        `Devis demandés : **${quotes.length}**`,
        `Devis acceptés : **${acceptedQuotes}**`,
        `Commandes : **${orders.length}**`,
        `Ventes validées : **${sales.length}**`,
        `Projets actifs : **${projects.filter(p => p.stageIndex < PROJECT_STAGES.length - 1).length}**`,
        `Taux d’acceptation des devis : **${quotes.length ? Math.round((acceptedQuotes / quotes.length) * 100) : 0}%**`
      ].join('\n'),
      0x9B59B6
    ],
    chiffre_affaires: [
      '📈 Chiffre d’affaires',
      [
        `Ce mois : **${monthlyRevenue.toFixed(2)} €**`,
        `Total enregistré : **${totalRevenue.toFixed(2)} €**`,
        '',
        'Seuls les paiements validés par le personnel sont comptabilisés.'
      ].join('\n'),
      0x2ECC71
    ],
    objectifs: [
      '🎯 Objectif mensuel',
      goal > 0
        ? `Objectif : **${goal.toFixed(2)} €**\nRéalisé : **${monthlyRevenue.toFixed(2)} €**\nProgression : **${goalPct}%**`
        : 'Aucun objectif mensuel configuré. Utilise `/config objectif`.',
      0xE91E63
    ],
    statistiques_globales: [
      '📊 Statistiques globales',
      [
        `Membres : **${guild.memberCount}**`,
        `Devis : **${quotes.length}**`,
        `Commandes : **${orders.length}**`,
        `Projets : **${projects.length}**`,
        `Ventes : **${sales.length}**`,
        `CA total : **${totalRevenue.toFixed(2)} €**`
      ].join('\n'),
      0x9B59B6
    ],
    liste_projets: [
      '📋 Liste des projets',
      projects.length
        ? projects
            .slice(-20)
            .reverse()
            .map(p => {
              const stage = PROJECT_STAGES[p.stageIndex] || PROJECT_STAGES[0];
              return `**${p.id}** — ${p.projectName} — ${stage.emoji} ${stage.label} (${stage.progress}%)`;
            })
            .join('\n')
        : 'Aucun projet enregistré pour le moment.',
      0x5865F2
    ]
  };

  for (const [key, [title, description, color]] of Object.entries(dynamic)) {
    const channelId = config.channels[key];
    if (!channelId) continue;

    const channel = guild.channels.cache.get(channelId);
    if (!channel || !channel.isTextBased()) continue;

    const payload = {
      embeds: [makeEmbed(title, description, color)],
      components: []
    };

    const panelId = config.panels[key];

    if (panelId) {
      try {
        const msg = await channel.messages.fetch(panelId);
        await msg.edit(payload);
        continue;
      } catch {}
    }

    const msg = await channel.send(payload);
    updateGuildConfig(guild.id, 'panels', key, msg.id);
  }
}

async function sendClientTracking(interaction, kind) {
  const guildId = interaction.guild?.id;
  if (!guildId) {
    return interaction.reply({
      content: '❌ Cette fonction doit être utilisée depuis le serveur.',
      flags: MessageFlags.Ephemeral
    });
  }

  const ops = migrateOperations();
  let items = [];

  if (kind === 'quotes') {
    items = Object.values(ops.quotes).filter(x => x.guildId === guildId && x.userId === interaction.user.id);
  } else if (kind === 'orders') {
    items = Object.values(ops.orders).filter(x => x.guildId === guildId && x.userId === interaction.user.id);
  } else {
    items = Object.values(ops.projects).filter(x => x.guildId === guildId && x.userId === interaction.user.id);
  }

  if (!items.length) {
    return interaction.reply({
      content: `Aucun ${kind === 'quotes' ? 'devis' : kind === 'orders' ? 'commande' : 'projet'} enregistré pour toi.`,
      flags: MessageFlags.Ephemeral
    });
  }

  let description = '';

  if (kind === 'quotes') {
    description = items.slice(-10).reverse().map(q =>
      `**${q.id} — ${q.projectName}**\nStatut : ${q.status}\nPrix : ${q.price !== null ? `${q.price} €` : 'À définir'}`
    ).join('\n\n');
  } else if (kind === 'orders') {
    description = items.slice(-10).reverse().map(o =>
      `**${o.id} — ${o.projectName}**\nStatut : ${o.status}\nPaiement : ${o.paymentStatus}\nProjet : ${o.projectId || 'Pas encore créé'}`
    ).join('\n\n');
  } else {
    description = items.slice(-10).reverse().map(p => {
      const stage = PROJECT_STAGES[p.stageIndex] || PROJECT_STAGES[0];
      return `**${p.id} — ${p.projectName}**\nÉtape : ${stage.emoji} ${stage.label}\nProgression : ${stage.progress}%`;
    }).join('\n\n');
  }

  return interaction.reply({
    embeds: [
      makeEmbed(
        kind === 'quotes' ? '💰 Mes devis' : kind === 'orders' ? '📦 Mes commandes' : '🚀 Mes projets',
        description,
        0x3498DB
      )
    ],
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
        .setDescription('Configure un salon ou une catégorie utilisée par le bot.')
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('Élément à configurer')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addChannelOption(option =>
          option
            .setName('cible')
            .setDescription('Salon ou catégorie à utiliser')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('role')
        .setDescription('Configure un rôle important.')
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('Rôle à configurer')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('Rôle à utiliser')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('paiement')
        .setDescription('Configure le lien PayPal officiel.')
        .addStringOption(option =>
          option
            .setName('paypal')
            .setDescription('Lien PayPal officiel')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('objectif')
        .setDescription('Configure l’objectif mensuel de chiffre d’affaires.')
        .addNumberOption(option =>
          option
            .setName('montant')
            .setDescription('Objectif en euros')
            .setMinValue(0)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('voir')
        .setDescription('Affiche un résumé de la configuration actuelle.')
    ),

  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Vérifie et réinstalle les panneaux déjà configurés.'),

  new SlashCommandBuilder()
    .setName('suivi')
    .setDescription('Affiche tes devis, commandes et projets.')
].map(command => command.toJSON());

client.once(Events.ClientReady, async readyClient => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ CREATY BOT CONNECTÉ');
  console.log(`🤖 Nom : ${readyClient.user.tag}`);
  console.log(`🆔 ID : ${readyClient.user.id}`);
  console.log(`🌐 Serveurs : ${readyClient.guilds.cache.size}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  ensureFiles();
  migrateOperations();

  for (const guild of readyClient.guilds.cache.values()) {
    try {
      migrateGuildConfig(guild.id);
      await guild.commands.set(commands);
      await refreshBusinessDashboards(guild).catch(() => {});
      console.log(`✅ Commandes slash installées sur ${guild.name}`);
    } catch (error) {
      console.error('❌ Erreur démarrage serveur :', error);
    }
  }
});

client.on(Events.GuildMemberAdd, async member => {
  const config = getGuildConfig(member.guild.id);

  if (config.roles.nouveau) {
    await member.roles.add(config.roles.nouveau).catch(() => {});
  }

  const channel = member.guild.channels.cache.get(config.channels.bienvenue);
  if (!channel || !channel.isTextBased()) return;

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle(`👋 Bienvenue ${member.user.username} !`)
        .setDescription(
          `Bienvenue ${member} sur **${member.guild.name}** !\n\n` +
          `Tu es notre **${member.guild.memberCount}e membre**.\n` +
          `Pense à lire le règlement afin de profiter pleinement du serveur.`
        )
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .setAuthor({
          name: member.user.tag,
          iconURL: member.user.displayAvatarURL({ size: 128 })
        })
        .setTimestamp()
    ]
  }).catch(() => {});
});

client.on(Events.GuildMemberRemove, async member => {
  const config = getGuildConfig(member.guild.id);
  const channel = member.guild.channels.cache.get(config.channels.depart);

  if (!channel || !channel.isTextBased()) return;

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle(`👋 À bientôt ${member.user.username}`)
        .setDescription(
          `**${member.user.tag}** a quitté **${member.guild.name}**.\n\n` +
          `Nous sommes maintenant **${member.guild.memberCount} membres**.`
        )
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
        const source = [
          ...CATEGORY_KEYS.map(([key, name]) => ({
            name: `Catégorie • ${name}`,
            value: `category:${key}`
          })),
          ...CHANNEL_KEYS.map(([key, name]) => ({
            name: `Salon • ${name}`,
            value: `channel:${key}`
          }))
        ];

        return interaction.respond(
          source
            .filter(item => item.name.toLowerCase().includes(focused))
            .slice(0, 25)
        );
      }

      if (sub === 'role') {
        return interaction.respond(
          ROLE_KEYS
            .map(([key, name]) => ({ name, value: key }))
            .filter(item => item.name.toLowerCase().includes(focused))
            .slice(0, 25)
        );
      }
    }

    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'suivi') {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('my_quotes').setLabel('Mes devis').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('my_orders').setLabel('Mes commandes').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('my_projects').setLabel('Mes projets').setStyle(ButtonStyle.Success)
        );

        return interaction.reply({
          content: 'Choisis ce que tu veux consulter :',
          components: [row],
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.commandName === 'config') {
        if (!isAdmin(interaction.member)) {
          return interaction.reply({
            content: '❌ Cette commande est réservée aux administrateurs.',
            flags: MessageFlags.Ephemeral
          });
        }

        const sub = interaction.options.getSubcommand();

        if (sub === 'salon') {
          const rawType = interaction.options.getString('type');
          const target = interaction.options.getChannel('cible');
          const [sectionType, key] = rawType.split(':');

          if (!['channel', 'category'].includes(sectionType)) {
            return interaction.reply({
              content: '❌ Type invalide.',
              flags: MessageFlags.Ephemeral
            });
          }

          if (sectionType === 'category' && target.type !== ChannelType.GuildCategory) {
            return interaction.reply({
              content: '❌ Tu dois sélectionner une catégorie Discord.',
              flags: MessageFlags.Ephemeral
            });
          }

          if (sectionType === 'channel' && target.type === ChannelType.GuildCategory) {
            return interaction.reply({
              content: '❌ Tu dois sélectionner un salon, pas une catégorie.',
              flags: MessageFlags.Ephemeral
            });
          }

          updateGuildConfig(
            interaction.guild.id,
            sectionType === 'channel' ? 'channels' : 'categories',
            key,
            target.id
          );

          if (sectionType === 'channel' && PANEL_DEFINITIONS[key]) {
            const result = await installOrUpdatePanel(interaction.guild, key);

            return interaction.reply({
              content:
                `✅ **${key}** configuré sur ${target}.\n` +
                (result.success
                  ? `Le panneau a été ${result.action === 'created' ? 'installé' : 'mis à jour'} immédiatement.`
                  : 'La configuration a été enregistrée.'),
              flags: MessageFlags.Ephemeral
            });
          }

          return interaction.reply({
            content: `✅ Configuration enregistrée : **${key}** → ${target}`,
            flags: MessageFlags.Ephemeral
          });
        }

        if (sub === 'role') {
          const key = interaction.options.getString('type');
          const role = interaction.options.getRole('role');

          updateGuildConfig(interaction.guild.id, 'roles', key, role.id);

          return interaction.reply({
            content: `✅ Rôle configuré : **${key}** → ${role}`,
            flags: MessageFlags.Ephemeral
          });
        }

        if (sub === 'paiement') {
          const paypal = interaction.options.getString('paypal').trim();

          if (!/^https?:\/\//i.test(paypal)) {
            return interaction.reply({
              content: '❌ Le lien PayPal doit commencer par http:// ou https://',
              flags: MessageFlags.Ephemeral
            });
          }

          updateGuildConfig(interaction.guild.id, 'settings', 'paypalUrl', paypal);

          return interaction.reply({
            content: '✅ Lien PayPal officiel enregistré. Les anciennes configurations sont conservées.',
            flags: MessageFlags.Ephemeral
          });
        }

        if (sub === 'objectif') {
          const amount = interaction.options.getNumber('montant');
          updateGuildConfig(interaction.guild.id, 'settings', 'monthlyGoal', amount);

          await refreshBusinessDashboards(interaction.guild);

          return interaction.reply({
            content: `✅ Objectif mensuel fixé à **${amount.toFixed(2)} €**.`,
            flags: MessageFlags.Ephemeral
          });
        }

        if (sub === 'voir') {
          const config = getGuildConfig(interaction.guild.id);

          return interaction.reply({
            embeds: [
              makeEmbed(
                '⚙️ Configuration Creaty Bot',
                [
                  `Salons configurés : **${Object.keys(config.channels).length} / ${CHANNEL_KEYS.length}**`,
                  `Catégories configurées : **${Object.keys(config.categories).length} / ${CATEGORY_KEYS.length}**`,
                  `Rôles configurés : **${Object.keys(config.roles).length} / ${ROLE_KEYS.length}**`,
                  `PayPal : **${config.settings.paypalUrl ? 'Configuré' : 'Non configuré'}**`,
                  `Objectif mensuel : **${Number(config.settings.monthlyGoal || 0).toFixed(2)} €**`,
                  '',
                  'Aucune configuration existante n’est supprimée automatiquement.'
                ].join('\n')
              )
            ],
            flags: MessageFlags.Ephemeral
          });
        }
      }

      if (interaction.commandName === 'setup') {
        if (!isAdmin(interaction.member)) {
          return interaction.reply({
            content: '❌ Cette commande est réservée aux administrateurs.',
            flags: MessageFlags.Ephemeral
          });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const config = getGuildConfig(interaction.guild.id);
        let success = 0;
        let failed = 0;

        for (const key of Object.keys(config.channels)) {
          if (!PANEL_DEFINITIONS[key]) continue;
          const result = await installOrUpdatePanel(interaction.guild, key);
          if (result.success) success++;
          else failed++;
        }

        await refreshBusinessDashboards(interaction.guild).catch(() => {});

        return interaction.editReply(
          `✅ Vérification terminée.\n` +
          `Panneaux installés ou mis à jour : **${success}**\n` +
          `Échecs : **${failed}**\n\n` +
          `Toutes les configurations existantes ont été conservées.`
        );
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === 'accept_rules') {
        const config = getGuildConfig(interaction.guild.id);

        if (!config.roles.membre) {
          return interaction.reply({
            content: '❌ Le rôle Membre n’est pas configuré.',
            flags: MessageFlags.Ephemeral
          });
        }

        await interaction.member.roles.add(config.roles.membre).catch(() => {});

        if (config.roles.nouveau) {
          await interaction.member.roles.remove(config.roles.nouveau).catch(() => {});
        }

        return interaction.reply({
          content: '✅ Règlement accepté. Bienvenue sur Creaty Bot !',
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId === 'new_suggestion') {
        const modal = new ModalBuilder()
          .setCustomId('suggestion_modal')
          .setTitle('Nouvelle suggestion');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('suggestion_text')
              .setLabel('Ta suggestion')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
              .setMaxLength(1000)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId === 'quote_request') {
        const modal = new ModalBuilder()
          .setCustomId('quote_request_modal')
          .setTitle('Demande de devis');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('project_name').setLabel('Nom du bot / projet').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('service').setLabel('Service demandé').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('description').setLabel('Décris précisément ton projet').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1500)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId === 'order_request') {
        const guildId = interaction.guild.id;
        const sent = await dmUser(interaction.user.id, {
          embeds: [
            makeEmbed(
              '📝 Nouvelle commande Creaty Bot',
              'Clique sur le bouton ci-dessous pour nous expliquer exactement ce que tu souhaites commander.'
            )
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`order_request_dm:${guildId}`)
                .setLabel('Décrire ma commande')
                .setStyle(ButtonStyle.Success)
            )
          ]
        });

        if (sent) {
          return interaction.reply({
            content: '✅ Je viens de t’envoyer un message privé pour démarrer ta commande.',
            flags: MessageFlags.Ephemeral
          });
        }

        const modal = new ModalBuilder()
          .setCustomId(`order_request_modal:${guildId}`)
          .setTitle('Nouvelle commande');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('project_name').setLabel('Nom du bot / projet').setStyle(TextInputStyle.Short).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('service').setLabel('Service souhaité').setStyle(TextInputStyle.Short).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('description').setLabel('Que veux-tu exactement ?').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1500)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId.startsWith('order_request_dm:')) {
        const guildId = interaction.customId.split(':')[1];

        const modal = new ModalBuilder()
          .setCustomId(`order_request_modal:${guildId}`)
          .setTitle('Nouvelle commande');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('project_name').setLabel('Nom du bot / projet').setStyle(TextInputStyle.Short).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('service').setLabel('Service souhaité').setStyle(TextInputStyle.Short).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('description').setLabel('Que veux-tu exactement ?').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1500)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId === 'my_quotes') return sendClientTracking(interaction, 'quotes');
      if (interaction.customId === 'my_orders') return sendClientTracking(interaction, 'orders');
      if (interaction.customId === 'my_projects') return sendClientTracking(interaction, 'projects');

      if (interaction.customId === 'declare_payment') {
        const modal = new ModalBuilder()
          .setCustomId('declare_payment_modal')
          .setTitle('Déclarer un paiement');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('order_id').setLabel('Numéro de commande (CMD-0001)').setStyle(TextInputStyle.Short).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('proof').setLabel('Référence ou preuve du paiement').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId === 'ticket_support') {
        return interaction.reply({
          content: '❓ Utilise le panneau Tickets pour ouvrir une demande de support.',
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId.startsWith('ticket_claim:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const ticket = ops.tickets[id];

        if (!ticket) return interaction.reply({ content: '❌ Ticket introuvable.', flags: MessageFlags.Ephemeral });

        const config = getGuildConfig(ticket.guildId);
        if (!hasStaffAccess(interaction.member, config)) {
          return interaction.reply({ content: '❌ Réservé au personnel.', flags: MessageFlags.Ephemeral });
        }

        ticket.claimedBy = interaction.user.id;
        ops.tickets[id] = ticket;
        saveJson(OPS_FILE, ops);

        return interaction.reply({ content: `👤 Ticket pris en charge par ${interaction.user}.` });
      }

      if (interaction.customId.startsWith('ticket_quote:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const ticket = ops.tickets[id];

        if (!ticket) return interaction.reply({ content: '❌ Ticket introuvable.', flags: MessageFlags.Ephemeral });

        const config = getGuildConfig(ticket.guildId);
        if (!hasStaffAccess(interaction.member, config)) {
          return interaction.reply({ content: '❌ Réservé au personnel.', flags: MessageFlags.Ephemeral });
        }

        const modal = new ModalBuilder()
          .setCustomId(`ticket_quote_modal:${id}`)
          .setTitle('Créer un devis');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('project_name').setLabel('Nom du bot / projet').setStyle(TextInputStyle.Short).setRequired(true)
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

      if (interaction.customId.startsWith('ticket_contact:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const ticket = ops.tickets[id];
        if (!ticket) return interaction.reply({ content: '❌ Ticket introuvable.', flags: MessageFlags.Ephemeral });

        const config = getGuildConfig(ticket.guildId);
        if (!hasStaffAccess(interaction.member, config)) {
          return interaction.reply({ content: '❌ Réservé au personnel.', flags: MessageFlags.Ephemeral });
        }

        const modal = new ModalBuilder()
          .setCustomId(`contact_ticket_modal:${id}`)
          .setTitle('Contacter le client');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('message').setLabel('Message à envoyer en MP').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1500)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId.startsWith('ticket_close:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const ticket = ops.tickets[id];
        if (!ticket) return interaction.reply({ content: '❌ Ticket introuvable.', flags: MessageFlags.Ephemeral });

        ticket.status = 'Fermé';
        ops.tickets[id] = ticket;
        saveJson(OPS_FILE, ops);

        await interaction.channel.permissionOverwrites.edit(ticket.userId, { SendMessages: false }).catch(() => {});

        return interaction.update({
          embeds: [
            makeEmbed(
              `🔒 ${id} fermé`,
              `Le ticket a été fermé par ${interaction.user}.\nLes données restent enregistrées.`,
              0x95A5A6
            )
          ],
          components: []
        });
      }

      if (interaction.customId.startsWith('quote_claim:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const quote = ops.quotes[id];
        if (!quote) return interaction.reply({ content: '❌ Devis introuvable.', flags: MessageFlags.Ephemeral });

        const config = getGuildConfig(quote.guildId);
        if (!hasStaffAccess(interaction.member, config)) {
          return interaction.reply({ content: '❌ Réservé au personnel.', flags: MessageFlags.Ephemeral });
        }

        quote.claimedBy = interaction.user.id;
        ops.quotes[id] = quote;
        saveJson(OPS_FILE, ops);
        await refreshQuoteMessage(interaction.guild, quote);

        return interaction.reply({ content: `👤 Devis **${id}** pris en charge par ${interaction.user}.` });
      }

      if (interaction.customId.startsWith('quote_price:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const quote = ops.quotes[id];
        if (!quote) return interaction.reply({ content: '❌ Devis introuvable.', flags: MessageFlags.Ephemeral });

        const config = getGuildConfig(quote.guildId);
        if (!hasStaffAccess(interaction.member, config)) {
          return interaction.reply({ content: '❌ Réservé au personnel.', flags: MessageFlags.Ephemeral });
        }

        const modal = new ModalBuilder()
          .setCustomId(`quote_price_modal:${id}`)
          .setTitle(`Prix ${id}`);

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('price').setLabel('Prix en euros').setStyle(TextInputStyle.Short).setRequired(true)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId.startsWith('quote_send:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const quote = ops.quotes[id];
        if (!quote) return interaction.reply({ content: '❌ Devis introuvable.', flags: MessageFlags.Ephemeral });

        const config = getGuildConfig(quote.guildId);
        if (!hasStaffAccess(interaction.member, config)) {
          return interaction.reply({ content: '❌ Réservé au personnel.', flags: MessageFlags.Ephemeral });
        }

        if (quote.price === null) {
          return interaction.reply({ content: '❌ Définis d’abord le prix du devis.', flags: MessageFlags.Ephemeral });
        }

        const sent = await dmUser(quote.userId, {
          embeds: [
            makeEmbed(
              `💰 Proposition de devis — ${id}`,
              `Projet : **${quote.projectName}**\nService : **${quote.service}**\nPrix : **${quote.price} €**\n\nChoisis une réponse ci-dessous.`,
              0xF1C40F
            )
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId(`client_quote_accept:${id}`).setLabel('Accepter le devis').setStyle(ButtonStyle.Success),
              new ButtonBuilder().setCustomId(`client_quote_refuse:${id}`).setLabel('Refuser le devis').setStyle(ButtonStyle.Danger)
            )
          ]
        });

        if (sent) {
          quote.status = 'Envoyé au client';
          ops.quotes[id] = quote;
          saveJson(OPS_FILE, ops);
          await refreshQuoteMessage(interaction.guild, quote);
          await refreshBusinessDashboards(interaction.guild);

          return interaction.reply({ content: '✅ Devis envoyé au client en message privé.' });
        }

        return interaction.reply({ content: '❌ Impossible d’envoyer un MP au client.', flags: MessageFlags.Ephemeral });
      }

      if (interaction.customId.startsWith('client_quote_accept:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const quote = ops.quotes[id];

        if (!quote || quote.userId !== interaction.user.id) {
          return interaction.reply({ content: '❌ Ce devis ne t’appartient pas.', flags: MessageFlags.Ephemeral });
        }

        quote.status = 'Accepté par le client';
        ops.quotes[id] = quote;
        saveJson(OPS_FILE, ops);

        const guild = await client.guilds.fetch(quote.guildId);
        await refreshQuoteMessage(guild, quote).catch(() => {});
        await refreshBusinessDashboards(guild).catch(() => {});

        return interaction.update({
          embeds: [
            makeEmbed(
              `✅ Devis ${id} accepté`,
              `Tu as accepté le devis pour **${quote.projectName}** au prix de **${quote.price} €**.\nL’équipe peut maintenant transformer ce devis en commande.`,
              0x57F287
            )
          ],
          components: []
        });
      }

      if (interaction.customId.startsWith('client_quote_refuse:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const quote = ops.quotes[id];

        if (!quote || quote.userId !== interaction.user.id) {
          return interaction.reply({ content: '❌ Ce devis ne t’appartient pas.', flags: MessageFlags.Ephemeral });
        }

        quote.status = 'Refusé';
        ops.quotes[id] = quote;
        saveJson(OPS_FILE, ops);

        const guild = await client.guilds.fetch(quote.guildId);
        await refreshQuoteMessage(guild, quote).catch(() => {});
        await refreshBusinessDashboards(guild).catch(() => {});

        return interaction.update({
          embeds: [
            makeEmbed(
              `❌ Devis ${id} refusé`,
              'Le devis a été refusé. Tu peux contacter le support pour en discuter.',
              0xED4245
            )
          ],
          components: []
        });
      }

      if (interaction.customId.startsWith('quote_order:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const quote = ops.quotes[id];
        if (!quote) return interaction.reply({ content: '❌ Devis introuvable.', flags: MessageFlags.Ephemeral });

        const config = getGuildConfig(quote.guildId);
        if (!hasStaffAccess(interaction.member, config)) {
          return interaction.reply({ content: '❌ Réservé au personnel.', flags: MessageFlags.Ephemeral });
        }

        if (quote.status !== 'Accepté par le client') {
          return interaction.reply({ content: '❌ Le client doit d’abord accepter le devis.', flags: MessageFlags.Ephemeral });
        }

        if (quote.orderId) {
          return interaction.reply({ content: `❌ Ce devis est déjà lié à **${quote.orderId}**.`, flags: MessageFlags.Ephemeral });
        }

        const order = await createOrder(
          interaction.guild,
          quote.userId,
          quote.projectName,
          quote.service,
          quote.description,
          quote.price,
          quote.id
        );

        const latest = migrateOperations();
        if (latest.quotes[id]) {
          await refreshQuoteMessage(interaction.guild, latest.quotes[id]);
        }

        return interaction.reply({ content: `✅ Commande **${order.id}** créée à partir du devis **${id}**.` });
      }

      if (interaction.customId.startsWith('quote_contact:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const quote = ops.quotes[id];
        if (!quote) return interaction.reply({ content: '❌ Devis introuvable.', flags: MessageFlags.Ephemeral });

        const modal = new ModalBuilder()
          .setCustomId(`contact_quote_modal:${id}`)
          .setTitle('Contacter le client');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('message').setLabel('Message à envoyer').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1500)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId.startsWith('quote_refuse:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const quote = ops.quotes[id];
        if (!quote) return interaction.reply({ content: '❌ Devis introuvable.', flags: MessageFlags.Ephemeral });

        quote.status = 'Refusé';
        ops.quotes[id] = quote;
        saveJson(OPS_FILE, ops);
        await refreshQuoteMessage(interaction.guild, quote);
        await refreshBusinessDashboards(interaction.guild);
        await dmUser(quote.userId, { embeds: [makeEmbed(`❌ Devis ${id} refusé`, 'L’équipe n’a pas retenu cette demande de devis.', 0xED4245)] });

        return interaction.reply({ content: `❌ Devis **${id}** refusé.` });
      }

      if (interaction.customId.startsWith('quote_archive:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const quote = ops.quotes[id];
        if (!quote) return interaction.reply({ content: '❌ Devis introuvable.', flags: MessageFlags.Ephemeral });

        quote.status = 'Archivé';
        ops.quotes[id] = quote;
        saveJson(OPS_FILE, ops);
        await refreshQuoteMessage(interaction.guild, quote);
        await refreshBusinessDashboards(interaction.guild);

        return interaction.reply({ content: `📁 Devis **${id}** archivé. Aucune donnée supprimée.` });
      }

      if (interaction.customId.startsWith('order_claim:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const order = ops.orders[id];
        if (!order) return interaction.reply({ content: '❌ Commande introuvable.', flags: MessageFlags.Ephemeral });

        order.claimedBy = interaction.user.id;
        ops.orders[id] = order;
        saveJson(OPS_FILE, ops);
        await refreshOrderMessage(interaction.guild, order);

        return interaction.reply({ content: `👤 Commande **${id}** prise en charge par ${interaction.user}.` });
      }

      if (interaction.customId.startsWith('order_accept:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const order = ops.orders[id];
        if (!order) return interaction.reply({ content: '❌ Commande introuvable.', flags: MessageFlags.Ephemeral });

        order.status = 'Acceptée';
        ops.orders[id] = order;
        saveJson(OPS_FILE, ops);
        await refreshOrderMessage(interaction.guild, order);
        await refreshBusinessDashboards(interaction.guild);

        return interaction.reply({ content: `✅ Commande **${id}** acceptée. Tu peux maintenant envoyer le paiement au client.` });
      }

      if (interaction.customId.startsWith('order_refuse:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const order = ops.orders[id];
        if (!order) return interaction.reply({ content: '❌ Commande introuvable.', flags: MessageFlags.Ephemeral });

        order.status = 'Refusée';
        ops.orders[id] = order;
        saveJson(OPS_FILE, ops);
        await refreshOrderMessage(interaction.guild, order);
        await refreshBusinessDashboards(interaction.guild);
        await dmUser(order.userId, { embeds: [makeEmbed(`❌ Commande ${id} refusée`, 'L’équipe n’a pas accepté cette demande de commande.', 0xED4245)] });

        return interaction.reply({ content: `❌ Commande **${id}** refusée.` });
      }

      if (interaction.customId.startsWith('order_payment:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const order = ops.orders[id];
        if (!order) return interaction.reply({ content: '❌ Commande introuvable.', flags: MessageFlags.Ephemeral });

        const config = getGuildConfig(order.guildId);
        if (!config.settings.paypalUrl) {
          return interaction.reply({
            content: '❌ Aucun lien PayPal n’est configuré. Utilise `/config paiement`.',
            flags: MessageFlags.Ephemeral
          });
        }

        const sent = await dmUser(order.userId, {
          embeds: [
            makeEmbed(
              `💳 Paiement de la commande ${id}`,
              [
                `Projet : **${order.projectName}**`,
                `Montant : **${order.price !== null ? `${order.price} €` : 'À confirmer'}**`,
                '',
                'Utilise le lien officiel ci-dessous pour effectuer le paiement :',
                config.settings.paypalUrl,
                '',
                'Après paiement, clique sur le bouton ci-dessous pour déclarer le paiement.'
              ].join('\n'),
              0x2ECC71
            )
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`declare_payment_order:${id}`)
                .setLabel('J’ai payé')
                .setStyle(ButtonStyle.Success)
            )
          ]
        });

        if (!sent) {
          return interaction.reply({ content: '❌ Impossible d’envoyer un MP au client.', flags: MessageFlags.Ephemeral });
        }

        order.paymentStatus = 'Lien envoyé';
        ops.orders[id] = order;
        saveJson(OPS_FILE, ops);
        await refreshOrderMessage(interaction.guild, order);

        return interaction.reply({ content: '✅ Lien PayPal envoyé au client en message privé.' });
      }

      if (interaction.customId.startsWith('declare_payment_order:')) {
        const orderId = interaction.customId.split(':')[1];

        const modal = new ModalBuilder()
          .setCustomId(`declare_payment_modal:${orderId}`)
          .setTitle('Déclarer le paiement');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('proof').setLabel('Référence ou preuve du paiement').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId.startsWith('order_contact:')) {
        const id = interaction.customId.split(':')[1];

        const modal = new ModalBuilder()
          .setCustomId(`contact_order_modal:${id}`)
          .setTitle('Contacter le client');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('message').setLabel('Message à envoyer').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1500)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId.startsWith('order_archive:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const order = ops.orders[id];
        if (!order) return interaction.reply({ content: '❌ Commande introuvable.', flags: MessageFlags.Ephemeral });

        order.status = 'Archivée';
        ops.orders[id] = order;
        saveJson(OPS_FILE, ops);
        await refreshOrderMessage(interaction.guild, order);
        await refreshBusinessDashboards(interaction.guild);

        return interaction.reply({ content: `📁 Commande **${id}** archivée. Aucune donnée supprimée.` });
      }

      if (interaction.customId.startsWith('payment_accept:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const payment = ops.payments[id];
        if (!payment) return interaction.reply({ content: '❌ Paiement introuvable.', flags: MessageFlags.Ephemeral });

        const config = getGuildConfig(payment.guildId);
        if (!hasStaffAccess(interaction.member, config)) {
          return interaction.reply({ content: '❌ Réservé au personnel.', flags: MessageFlags.Ephemeral });
        }

        payment.status = 'Validé';

        const order = ops.orders[payment.orderId];
        if (!order) return interaction.reply({ content: '❌ Commande liée introuvable.', flags: MessageFlags.Ephemeral });

        order.paymentStatus = 'Validé';
        ops.orders[order.id] = order;
        ops.payments[id] = payment;

        const saleId = nextId('sales', 'VENTE');
        const latest = migrateOperations();
        latest.sales[saleId] = {
          id: saleId,
          guildId: interaction.guild.id,
          orderId: order.id,
          userId: order.userId,
          projectName: order.projectName,
          amount: Number(order.price || 0),
          createdAt: new Date().toISOString()
        };
        latest.orders[order.id] = order;
        latest.payments[id] = payment;
        saveJson(OPS_FILE, latest);

        const member = await interaction.guild.members.fetch(order.userId).catch(() => null);
        if (member && config.roles.client) await member.roles.add(config.roles.client).catch(() => {});
        if (member && config.roles.prospect) await member.roles.remove(config.roles.prospect).catch(() => {});

        const salesChannel = interaction.guild.channels.cache.get(config.channels.ventes);
        if (salesChannel && salesChannel.isTextBased()) {
          await salesChannel.send({
            embeds: [
              makeEmbed(
                `💰 ${saleId}`,
                `Commande : **${order.id}**\nClient : <@${order.userId}>\nProjet : **${order.projectName}**\nMontant : **${Number(order.price || 0).toFixed(2)} €**`,
                0x2ECC71
              )
            ]
          }).catch(() => {});
        }

        const project = await createProjectFromOrder(interaction.guild, order);

        const refreshed = migrateOperations();
        if (refreshed.orders[order.id]) {
          refreshed.orders[order.id].projectId = project.id;
          saveJson(OPS_FILE, refreshed);
          await refreshOrderMessage(interaction.guild, refreshed.orders[order.id]);
        }

        await refreshBusinessDashboards(interaction.guild);

        return interaction.update({
          embeds: [
            makeEmbed(
              `✅ Paiement ${id} validé`,
              `Commande : **${order.id}**\nProjet créé : **${project.id}**\nVente enregistrée : **${saleId}**`,
              0x57F287
            )
          ],
          components: []
        });
      }

      if (interaction.customId.startsWith('payment_refuse:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const payment = ops.payments[id];
        if (!payment) return interaction.reply({ content: '❌ Paiement introuvable.', flags: MessageFlags.Ephemeral });

        payment.status = 'Refusé';
        ops.payments[id] = payment;
        saveJson(OPS_FILE, ops);

        await dmUser(payment.userId, {
          embeds: [makeEmbed(`❌ Paiement ${id} refusé`, 'La déclaration de paiement n’a pas été validée. Contacte le support si nécessaire.', 0xED4245)]
        });

        return interaction.update({
          embeds: [makeEmbed(`❌ Paiement ${id} refusé`, `Commande : **${payment.orderId}**`, 0xED4245)],
          components: []
        });
      }

      if (interaction.customId.startsWith('payment_moreproof:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const payment = ops.payments[id];
        if (!payment) return interaction.reply({ content: '❌ Paiement introuvable.', flags: MessageFlags.Ephemeral });

        await dmUser(payment.userId, {
          embeds: [
            makeEmbed(
              `📎 Nouvelle preuve demandée — ${payment.orderId}`,
              'Le personnel a besoin d’une preuve ou référence supplémentaire. Merci de refaire une déclaration de paiement depuis le serveur.'
            )
          ]
        });

        return interaction.reply({ content: '✅ Demande envoyée au client en MP.' });
      }

      if (interaction.customId.startsWith('project_claim:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const project = ops.projects[id];
        if (!project) return interaction.reply({ content: '❌ Projet introuvable.', flags: MessageFlags.Ephemeral });

        project.claimedBy = interaction.user.id;
        project.updatedAt = new Date().toISOString();
        ops.projects[id] = project;
        saveJson(OPS_FILE, ops);

        await refreshProjectMessage(interaction.guild, project);
        await refreshBusinessDashboards(interaction.guild);

        return interaction.reply({ content: `👤 Projet **${id}** pris en charge par ${interaction.user}.` });
      }

      if (
        interaction.customId.startsWith('project_next:') ||
        interaction.customId.startsWith('project_prev:')
      ) {
        const [action, id] = interaction.customId.split(':');
        const ops = migrateOperations();
        const project = ops.projects[id];
        if (!project) return interaction.reply({ content: '❌ Projet introuvable.', flags: MessageFlags.Ephemeral });

        if (action === 'project_next') {
          project.stageIndex = Math.min(PROJECT_STAGES.length - 1, project.stageIndex + 1);
        } else {
          project.stageIndex = Math.max(0, project.stageIndex - 1);
        }

        project.updatedAt = new Date().toISOString();
        ops.projects[id] = project;
        saveJson(OPS_FILE, ops);

        await refreshProjectMessage(interaction.guild, project);
        await postProjectStageCard(interaction.guild, project);
        await refreshBusinessDashboards(interaction.guild);

        const stage = PROJECT_STAGES[project.stageIndex];

        await dmUser(project.userId, {
          embeds: [
            makeEmbed(
              `🚀 Mise à jour du projet ${id}`,
              `Projet : **${project.projectName}**\nNouvelle étape : **${stage.label}**\nProgression : **${stage.progress}%**`,
              0x3498DB
            )
          ]
        });

        return interaction.reply({ content: `✅ Projet déplacé vers **${stage.label}**.` });
      }

      if (interaction.customId.startsWith('project_contact:')) {
        const id = interaction.customId.split(':')[1];

        const modal = new ModalBuilder()
          .setCustomId(`contact_project_modal:${id}`)
          .setTitle('Contacter le client');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('message').setLabel('Message à envoyer').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1500)
          )
        );

        return interaction.showModal(modal);
      }
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'ticket_type') {
        const config = getGuildConfig(interaction.guild.id);
        const isPremium = interaction.channelId === config.channels.support_premium;
        const categoryId = isPremium && config.categories.tickets_premium
          ? config.categories.tickets_premium
          : config.categories.tickets;

        if (!categoryId) {
          return interaction.reply({
            content: '❌ La catégorie Tickets n’est pas configurée.',
            flags: MessageFlags.Ephemeral
          });
        }

        const type = interaction.values[0];
        const id = nextId('tickets', 'TICKET');

        const permissions = [
          {
            id: interaction.guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles
            ]
          },
          ...getStaffOverwrites(interaction.guild, config).slice(1)
        ];

        const channel = await interaction.guild.channels.create({
          name: `${type}-${interaction.user.username}`
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '')
            .slice(0, 90),
          type: ChannelType.GuildText,
          parent: categoryId,
          permissionOverwrites: permissions
        });

        const ticket = {
          id,
          guildId: interaction.guild.id,
          userId: interaction.user.id,
          type,
          status: 'Ouvert',
          claimedBy: null,
          channelId: channel.id,
          createdAt: new Date().toISOString()
        };

        const ops = migrateOperations();
        ops.tickets[id] = ticket;
        saveJson(OPS_FILE, ops);

        await channel.send({
          content: `${interaction.user}`,
          embeds: [
            makeEmbed(
              `🎫 ${id} — ${type}`,
              `Client : ${interaction.user}\nType : **${type}**\nStatut : **Ouvert**\n\nExplique ta demande le plus précisément possible.\n\nLes boutons ci-dessous sont réservés au personnel.`
            )
          ],
          components: ticketButtons(id)
        });

        return interaction.reply({
          content: `✅ Ton ticket a été créé : ${channel}`,
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId.startsWith('project_stage:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const project = ops.projects[id];
        if (!project) return interaction.reply({ content: '❌ Projet introuvable.', flags: MessageFlags.Ephemeral });

        project.stageIndex = Number(interaction.values[0]);
        project.updatedAt = new Date().toISOString();
        ops.projects[id] = project;
        saveJson(OPS_FILE, ops);

        await refreshProjectMessage(interaction.guild, project);
        await postProjectStageCard(interaction.guild, project);
        await refreshBusinessDashboards(interaction.guild);

        const stage = PROJECT_STAGES[project.stageIndex];

        await dmUser(project.userId, {
          embeds: [
            makeEmbed(
              `🚀 Mise à jour du projet ${id}`,
              `Projet : **${project.projectName}**\nNouvelle étape : **${stage.label}**\nProgression : **${stage.progress}%**`,
              0x3498DB
            )
          ]
        });

        return interaction.reply({ content: `✅ Étape définie sur **${stage.label}**.` });
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'suggestion_modal') {
        const config = getGuildConfig(interaction.guild.id);
        const channel = interaction.guild.channels.cache.get(config.channels.suggestion);
        const text = interaction.fields.getTextInputValue('suggestion_text');

        if (channel && channel.isTextBased()) {
          await channel.send({
            embeds: [makeEmbed(`💡 Suggestion de ${interaction.user.username}`, text, 0xF1C40F)]
          });
        }

        return interaction.reply({
          content: '✅ Suggestion envoyée.',
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId === 'quote_request_modal') {
        const quote = await createQuote(
          interaction.guild,
          interaction.user.id,
          interaction.fields.getTextInputValue('project_name'),
          interaction.fields.getTextInputValue('service'),
          interaction.fields.getTextInputValue('description')
        );

        const config = getGuildConfig(interaction.guild.id);
        if (
          interaction.member &&
          config.roles.prospect &&
          !interaction.member.roles.cache.has(config.roles.client)
        ) {
          await interaction.member.roles.add(config.roles.prospect).catch(() => {});
        }

        return interaction.reply({
          content: `✅ Demande de devis créée : **${quote.id}**.`,
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId.startsWith('order_request_modal:')) {
        const guildId = interaction.customId.split(':')[1];
        const guild = await client.guilds.fetch(guildId);

        const order = await createOrder(
          guild,
          interaction.user.id,
          interaction.fields.getTextInputValue('project_name'),
          interaction.fields.getTextInputValue('service'),
          interaction.fields.getTextInputValue('description')
        );

        const config = getGuildConfig(guild.id);
        const member = await guild.members.fetch(interaction.user.id).catch(() => null);
        if (member && config.roles.prospect && !member.roles.cache.has(config.roles.client)) {
          await member.roles.add(config.roles.prospect).catch(() => {});
        }

        return interaction.reply({
          content: `✅ Ta commande **${order.id}** a été transmise à l’équipe pour étude.`,
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId.startsWith('ticket_quote_modal:')) {
        const ticketId = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const ticket = ops.tickets[ticketId];

        if (!ticket) return interaction.reply({ content: '❌ Ticket introuvable.', flags: MessageFlags.Ephemeral });

        const quote = await createQuote(
          interaction.guild,
          ticket.userId,
          interaction.fields.getTextInputValue('project_name'),
          interaction.fields.getTextInputValue('service'),
          interaction.fields.getTextInputValue('description'),
          null,
          ticketId
        );

        return interaction.reply({ content: `✅ Devis **${quote.id}** créé à partir du ticket **${ticketId}**.` });
      }

      if (interaction.customId.startsWith('quote_price_modal:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const quote = ops.quotes[id];
        if (!quote) return interaction.reply({ content: '❌ Devis introuvable.', flags: MessageFlags.Ephemeral });

        const price = Number(interaction.fields.getTextInputValue('price').replace(',', '.'));
        if (!Number.isFinite(price) || price < 0) {
          return interaction.reply({ content: '❌ Prix invalide.', flags: MessageFlags.Ephemeral });
        }

        quote.price = price;
        quote.status = 'Prix défini';
        ops.quotes[id] = quote;
        saveJson(OPS_FILE, ops);

        await refreshQuoteMessage(interaction.guild, quote);
        await refreshBusinessDashboards(interaction.guild);

        return interaction.reply({ content: `✅ Prix du devis **${id}** fixé à **${price.toFixed(2)} €**.` });
      }

      if (interaction.customId.startsWith('declare_payment_modal:')) {
        const orderId = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const order = ops.orders[orderId];

        if (!order || order.userId !== interaction.user.id) {
          return interaction.reply({ content: '❌ Cette commande ne t’appartient pas.', flags: MessageFlags.Ephemeral });
        }

        const paymentId = nextId('payments', 'PAY');
        const proof = interaction.fields.getTextInputValue('proof');

        const latest = migrateOperations();
        latest.payments[paymentId] = {
          id: paymentId,
          guildId: order.guildId,
          orderId,
          userId: interaction.user.id,
          proof,
          status: 'En attente',
          createdAt: new Date().toISOString()
        };

        if (latest.orders[orderId]) {
          latest.orders[orderId].paymentStatus = 'À vérifier';
        }

        saveJson(OPS_FILE, latest);

        const guild = await client.guilds.fetch(order.guildId);
        const orderChannel = await guild.channels.fetch(order.channelId).catch(() => null);

        if (orderChannel && orderChannel.isTextBased()) {
          await orderChannel.send({
            embeds: [
              makeEmbed(
                `💳 Paiement déclaré — ${paymentId}`,
                `Commande : **${orderId}**\nClient : <@${interaction.user.id}>\n\n**Preuve / référence :**\n${proof}`,
                0xF39C12
              )
            ],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`payment_accept:${paymentId}`).setLabel('Valider').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`payment_refuse:${paymentId}`).setLabel('Refuser').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId(`payment_moreproof:${paymentId}`).setLabel('Demander une nouvelle preuve').setStyle(ButtonStyle.Secondary)
              )
            ]
          });
        }

        await refreshOrderMessage(guild, latest.orders[orderId]);

        return interaction.reply({
          content: `✅ Paiement déclaré sous le numéro **${paymentId}**. L’équipe va le vérifier.`,
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId.startsWith('contact_ticket_modal:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const item = ops.tickets[id];
        if (!item) return interaction.reply({ content: '❌ Ticket introuvable.', flags: MessageFlags.Ephemeral });

        const ok = await dmUser(item.userId, {
          embeds: [makeEmbed(`💬 Message concernant ton ticket ${id}`, interaction.fields.getTextInputValue('message'))]
        });

        return interaction.reply({ content: ok ? '✅ Message envoyé.' : '❌ Impossible d’envoyer le MP.', flags: MessageFlags.Ephemeral });
      }

      if (interaction.customId.startsWith('contact_quote_modal:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const item = ops.quotes[id];
        if (!item) return interaction.reply({ content: '❌ Devis introuvable.', flags: MessageFlags.Ephemeral });

        const ok = await dmUser(item.userId, {
          embeds: [makeEmbed(`💬 Message concernant ton devis ${id}`, interaction.fields.getTextInputValue('message'))]
        });

        return interaction.reply({ content: ok ? '✅ Message envoyé.' : '❌ Impossible d’envoyer le MP.', flags: MessageFlags.Ephemeral });
      }

      if (interaction.customId.startsWith('contact_order_modal:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const item = ops.orders[id];
        if (!item) return interaction.reply({ content: '❌ Commande introuvable.', flags: MessageFlags.Ephemeral });

        const ok = await dmUser(item.userId, {
          embeds: [makeEmbed(`💬 Message concernant ta commande ${id}`, interaction.fields.getTextInputValue('message'))]
        });

        return interaction.reply({ content: ok ? '✅ Message envoyé.' : '❌ Impossible d’envoyer le MP.', flags: MessageFlags.Ephemeral });
      }

      if (interaction.customId.startsWith('contact_project_modal:')) {
        const id = interaction.customId.split(':')[1];
        const ops = migrateOperations();
        const item = ops.projects[id];
        if (!item) return interaction.reply({ content: '❌ Projet introuvable.', flags: MessageFlags.Ephemeral });

        const ok = await dmUser(item.userId, {
          embeds: [makeEmbed(`💬 Message concernant ton projet ${id}`, interaction.fields.getTextInputValue('message'))]
        });

        return interaction.reply({ content: ok ? '✅ Message envoyé.' : '❌ Impossible d’envoyer le MP.', flags: MessageFlags.Ephemeral });
      }
    }
  } catch (error) {
    console.error('❌ Erreur interaction :', error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ Une erreur est survenue.',
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
