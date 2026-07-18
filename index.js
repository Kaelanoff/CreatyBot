0r0equire('dotenv').config();

const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
  ChannelType,
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActivityType,
  MessageFlags
} = require('discord.js');

if (!process.env.TOKEN) {
  console.error('❌ TOKEN manquant dans .env ou Railway Variables.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember
  ],
  presence: {
    status: 'online',
    activities: [{ name: 'Creaty Bot', type: ActivityType.Playing }]
  }
});

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'creatybot.json');

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(
        {
          counters: { devis: 0, commandes: 0, projets: 0, bugs: 0, tickets: 0 },
          devis: {},
          commandes: {},
          projets: {},
          bugs: {},
          tickets: {},
          warns: {},
          roadmap: {},
          suggestions: {}
        },
        null,
        2
      )
    );
  }
}

function loadDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDb(db) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function nextId(counterName, prefix) {
  const db = loadDb();
  db.counters[counterName] = (db.counters[counterName] || 0) + 1;
  const id = `${prefix}-${String(db.counters[counterName]).padStart(4, '0')}`;
  saveDb(db);
  return id;
}

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function findChannel(guild, keywords, type = null) {
  const keys = Array.isArray(keywords) ? keywords : [keywords];
  return guild.channels.cache.find(channel => {
    if (type !== null && channel.type !== type) return false;
    const n = normalize(channel.name);
    return keys.some(key => n.includes(normalize(key)));
  });
}

function findRole(guild, keywords) {
  const keys = Array.isArray(keywords) ? keywords : [keywords];
  return guild.roles.cache.find(role => {
    const n = normalize(role.name);
    return keys.some(key => n === normalize(key) || n.includes(normalize(key)));
  });
}

function isStaff(member) {
  if (!member) return false;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;

  const names = [
    'fondateur', 'cofondateur', 'directeurgeneral', 'directeur',
    'administrateur', 'moderateur', 'assistantmoderateur',
    'responsablecommercial', 'commercial', 'leaddeveloppeur', 'supportclient'
  ];

  return member.roles.cache.some(role =>
    names.some(name => normalize(role.name).includes(name))
  );
}

function isDirection(member) {
  if (!member) return false;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;

  const names = ['fondateur', 'cofondateur', 'directeurgeneral', 'directeur'];
  return member.roles.cache.some(role =>
    names.some(name => normalize(role.name).includes(name))
  );
}

function makeEmbed(title, description, color = 0x5865F2) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: 'Creaty Bot • Panel' });
}

async function safeSend(channel, payload) {
  if (!channel || !channel.isTextBased()) return null;
  try {
    return await channel.send(payload);
  } catch (error) {
    console.error(`❌ Erreur envoi dans #${channel?.name}:`, error.message);
    return null;
  }
}

async function panelExists(channel, title) {
  try {
    const messages = await channel.messages.fetch({ limit: 50 });
    return messages.some(msg =>
      msg.author?.id === client.user.id &&
      msg.embeds?.some(e =>
        e.title === title &&
        e.footer?.text === 'Creaty Bot • Panel'
      )
    );
  } catch {
    return false;
  }
}

async function sendPanel(guild, keys, title, description, color = 0x5865F2, components = []) {
  const channel = findChannel(guild, keys);
  if (!channel) {
    console.log(`⚠️ Salon introuvable pour le panel : ${title}`);
    return false;
  }

  if (await panelExists(channel, title)) {
    console.log(`↪️ Panel déjà présent dans #${channel.name} : ${title}`);
    return true;
  }

  await safeSend(channel, {
    embeds: [makeEmbed(title, description, color)],
    components
  });

  return true;
}

async function logAction(guild, title, description, color = 0x5865F2) {
  const channel = findChannel(guild, ['logs', 'journal']);
  if (!channel) return;
  await safeSend(channel, { embeds: [makeEmbed(title, description, color)] });
}

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Teste Creaty Bot.'),

  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Installe tous les panneaux dans les salons existants.'),

  new SlashCommandBuilder()
    .setName('annonce')
    .setDescription('Publie une annonce.')
    .addStringOption(o => o.setName('titre').setDescription('Titre').setRequired(true))
    .addStringOption(o => o.setName('message').setDescription('Message').setRequired(true)),

  new SlashCommandBuilder()
    .setName('sondage')
    .setDescription('Crée un sondage Oui / Non.')
    .addStringOption(o => o.setName('question').setDescription('Question').setRequired(true)),

  new SlashCommandBuilder()
    .setName('devis')
    .setDescription('Crée une demande de devis.')
    .addStringOption(o => o.setName('service').setDescription('Service demandé').setRequired(true))
    .addStringOption(o => o.setName('description').setDescription('Description').setRequired(true))
    .addStringOption(o => o.setName('budget').setDescription('Budget indicatif').setRequired(false)),

  new SlashCommandBuilder()
    .setName('fixer-prix')
    .setDescription('Fixe le prix d’un devis.')
    .addStringOption(o => o.setName('devis').setDescription('DEV-0001').setRequired(true))
    .addNumberOption(o => o.setName('prix').setDescription('Prix en euros').setRequired(true)),

  new SlashCommandBuilder()
    .setName('paiement')
    .setDescription('Déclare un paiement.')
    .addStringOption(o => o.setName('commande').setDescription('CMD-0001').setRequired(true))
    .addStringOption(o => o.setName('preuve').setDescription('Lien ou référence').setRequired(false)),

  new SlashCommandBuilder()
    .setName('suivi')
    .setDescription('Consulte un devis, une commande ou un projet.')
    .addStringOption(o => o.setName('id').setDescription('DEV-0001, CMD-0001 ou PROJ-0001').setRequired(true)),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Ajoute un avertissement.')
    .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(true)),

  new SlashCommandBuilder()
    .setName('bug')
    .setDescription('Signale un bug.')
    .addStringOption(o => o.setName('titre').setDescription('Titre').setRequired(true))
    .addStringOption(o => o.setName('description').setDescription('Description').setRequired(true)),

  new SlashCommandBuilder()
    .setName('dashboard')
    .setDescription('Affiche les statistiques principales.'),

  new SlashCommandBuilder()
    .setName('roadmap')
    .setDescription('Gère la roadmap.')
    .addSubcommand(s =>
      s.setName('ajouter')
        .setDescription('Ajoute un élément.')
        .addStringOption(o => o.setName('titre').setDescription('Titre').setRequired(true))
        .addStringOption(o =>
          o.setName('statut')
            .setDescription('Statut')
            .setRequired(true)
            .addChoices(
              { name: 'Prévu', value: 'Prévu' },
              { name: 'En cours', value: 'En cours' },
              { name: 'Terminé', value: 'Terminé' }
            )
        )
    )
    .addSubcommand(s => s.setName('liste').setDescription('Affiche la roadmap.')),

  new SlashCommandBuilder()
    .setName('projet')
    .setDescription('Gère les projets.')
    .addSubcommand(s =>
      s.setName('statut')
        .setDescription('Change le statut.')
        .addStringOption(o => o.setName('projet').setDescription('PROJ-0001').setRequired(true))
        .addStringOption(o =>
          o.setName('statut')
            .setDescription('Nouveau statut')
            .setRequired(true)
            .addChoices(
              { name: 'En attente', value: 'En attente' },
              { name: 'Analyse', value: 'Analyse' },
              { name: 'Développement', value: 'Développement' },
              { name: 'Tests', value: 'Tests' },
              { name: 'Corrections', value: 'Corrections' },
              { name: 'Livraison', value: 'Livraison' },
              { name: 'Terminé', value: 'Terminé' },
              { name: 'Archivé', value: 'Archivé' }
            )
        )
    )
    .addSubcommand(s =>
      s.setName('progression')
        .setDescription('Change la progression.')
        .addStringOption(o => o.setName('projet').setDescription('PROJ-0001').setRequired(true))
        .addIntegerOption(o =>
          o.setName('pourcentage')
            .setDescription('0 à 100')
            .setMinValue(0)
            .setMaxValue(100)
            .setRequired(true)
        )
    )
    .addSubcommand(s =>
      s.setName('assigner')
        .setDescription('Assigne un membre.')
        .addStringOption(o => o.setName('projet').setDescription('PROJ-0001').setRequired(true))
        .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
    )
].map(c => c.toJSON());

async function installAllPanels(guild) {
  const rulesRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('accept_rules')
      .setLabel('Accepter le règlement')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success)
  );

  const ticketMenu = new StringSelectMenuBuilder()
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
    );

  const ticketRow = new ActionRowBuilder().addComponents(ticketMenu);

  const suggestionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('new_suggestion')
      .setLabel('Proposer une suggestion')
      .setEmoji('💡')
      .setStyle(ButtonStyle.Primary)
  );

  const serviceRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('service_devis')
      .setLabel('Demander un devis')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('service_commander')
      .setLabel('Commander')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('service_question')
      .setLabel('Poser une question')
      .setStyle(ButtonStyle.Secondary)
  );

  const panels = [
    // AÉROPORT
    [['bienvenue'], '👋 Bienvenue', 'Bienvenue sur **Creaty Bot** !\n\nLorsqu’un nouveau membre rejoint le serveur, Creaty Bot publie ici un message avec sa photo de profil et le nombre de membres.', 0x57F287, []],
    [['abientot', 'a-bientot', 'bientot'], '👋 À bientôt', 'Lorsqu’un membre quitte le serveur, Creaty Bot publie ici un message de départ avec sa photo de profil.', 0xED4245, []],

    // HUB
    [['reglement', 'règlement'], '📜 Règlement de Creaty Bot', 'Lis attentivement le règlement du serveur puis clique sur le bouton ci-dessous pour confirmer ton acceptation et recevoir le rôle **Membre**.', 0x57F287, [rulesRow]],
    [['annonces'], '📢 Annonces officielles', 'Toutes les annonces importantes de Creaty Bot seront publiées ici par le staff avec la commande **/annonce**.', 0x5865F2, []],
    [['info'], '📌 Informations', 'Retrouve ici les informations essentielles concernant **Creaty Bot**, son fonctionnement, ses services et son organisation.', 0x3498DB, []],
    [['roadmap'], '🗺️ Roadmap', 'La roadmap présente les fonctionnalités **prévues**, **en cours** et **terminées**.\n\nDirection : **/roadmap ajouter**\nConsulter : **/roadmap liste**', 0x9B59B6, []],
    [['nosliens', 'nos-liens'], '🔗 Nos liens', 'Retrouve ici tous les liens officiels de Creaty Bot. Seuls les liens publiés dans ce salon doivent être considérés comme officiels.', 0x3498DB, []],
    [['faq'], '❓ FAQ', 'Questions fréquentes concernant les commandes, devis, paiements, délais, livraisons, garanties et support.', 0xF1C40F, []],
    [['sondages'], '📊 Sondages', 'Les sondages de la communauté sont publiés ici.\n\nUtilise **/sondage** pour créer un sondage.', 0x9B59B6, []],

    // SUPPORT
    [['ticket'], '🎫 Support Creaty Bot', 'Sélectionne ci-dessous le type de ticket à ouvrir. Un salon privé sera créé automatiquement.', 0x3498DB, [ticketRow]],
    [['attmove', 'att-move'], '🎙️ Attente vocale', 'Ce salon accompagne le système d’attente vocale. Un membre du staff pourra prendre en charge les personnes qui attendent une assistance.', 0x95A5A6, []],

    // COMMUNAUTÉ
    [['discussion'], '💬 Discussion', 'Salon principal de discussion de la communauté. Respecte le règlement et les autres membres.', 0x5865F2, []],
    [['media'], '📷 Médias', 'Partage ici tes images, vidéos, captures et autres médias liés à tes créations.', 0x3498DB, []],
    [['suggestion'], '💡 Suggestions', 'Propose une idée pour améliorer Creaty Bot ou le serveur.', 0xF1C40F, [suggestionRow]],
    [['vosbots', 'vos-bots'], '🤖 Vos bots', 'Présente ici les bots Discord que tu as créés ou que tu souhaites faire découvrir à la communauté.', 0x5865F2, []],
    [['presentation', 'présentation'], '👋 Présentations', 'Présente-toi à la communauté : pseudo, centres d’intérêt et projets.', 0x57F287, []],
    [['evenements', 'événements'], '🎉 Événements', 'Les événements communautaires et activités spéciales seront annoncés ici.', 0xE91E63, []],

    // NOS SERVICES
    [['creationbot', 'créationbot'], '🤖 Création de bot Discord', 'Création de bots Discord personnalisés selon ton projet et tes besoins.', 0x5865F2, [serviceRow]],
    [['creationserveur', 'créationserveur'], '💬 Création de serveur Discord', 'Création, organisation et configuration complète de serveurs Discord.', 0x5865F2, [serviceRow]],
    [['hebergement', 'hébergement'], '🌐 Hébergement', 'Solutions d’hébergement pour maintenir les bots et projets en ligne.', 0x3498DB, [serviceRow]],
    [['tarifs'], '💰 Tarifs', 'Les tarifs officiels des services Creaty Bot sont affichés ici par la direction. Un devis personnalisé peut être demandé avec **/devis**.', 0xF1C40F, []],
    [['garantie'], '📜 Garantie', 'Retrouve ici les conditions de garantie, corrections de bugs, maintenance et service après-vente.', 0x95A5A6, []],

    // COMMANDES
    [['commander'], '📝 Commander', 'Pour commander un service, commence par demander un devis. Après acceptation du prix, une commande **CMD-XXXX** sera créée.', 0x5865F2, [serviceRow]],
    [['demanderundevis', 'demander-un-devis'], '💰 Demander un devis', 'Utilise **/devis** pour créer une demande. Tu recevras un numéro comme **DEV-0001**.', 0xF1C40F, []],
    [['suivicommandes', 'suivi-commandes'], '📦 Suivi des commandes', 'Utilise **/suivi** avec ton numéro **DEV-XXXX**, **CMD-XXXX** ou **PROJ-XXXX** pour consulter son état.', 0x3498DB, []],
    [['paiements'], '💳 Paiements', 'Une fois ta commande créée, utilise **/paiement** pour déclarer ton paiement. Le staff devra ensuite le valider.', 0x2ECC71, []],
    [['conditions'], '📜 Conditions de commande', 'Les conditions officielles applicables aux devis, commandes, paiements, livraisons et garanties sont publiées ici.', 0x95A5A6, []],
    [['questionscommandes', 'questions-commandes'], '❓ Questions sur les commandes', 'Pour une question concernant une commande ou un devis, ouvre un ticket **Commande** ou **Devis**.', 0xF1C40F, [ticketRow]],
    [['offresspeciales', 'offres-spéciales'], '🎯 Offres spéciales', 'Les promotions, réductions et offres temporaires de Creaty Bot sont publiées ici.', 0xE91E63, []],

    // ESPACE CLIENT
    [['informationsclients', 'informations-clients'], '📢 Informations clients', 'Informations importantes réservées aux clients de Creaty Bot.', 0x5865F2, []],
    [['livraisons'], '📂 Livraisons', 'Les informations de livraison des projets terminés sont publiées ici. Vérifie toujours le numéro de ton projet.', 0x2ECC71, []],
    [['factures'], '📜 Factures', 'Les informations liées aux factures et paiements validés sont centralisées ici.', 0x95A5A6, []],
    [['laisserunavis', 'laisser-un-avis'], '⭐ Laisser un avis', 'Après une commande terminée, partage ton expérience avec Creaty Bot. Les avis pourront être publiés après validation.', 0xF1C40F, []],

    // PREMIUM
    [['supportprioritaire', 'support-prioritaire'], '👑 Support prioritaire', 'Espace de support réservé aux clients Premium. Les demandes sont traitées en priorité.', 0xF1C40F, [ticketRow]],
    [['commandesprioritaires', 'commandes-prioritaires'], '⚡ Commandes prioritaires', 'Les commandes des clients Premium bénéficient d’un traitement prioritaire.', 0xF1C40F, []],
    [['avantages'], '🎁 Avantages Premium', 'Retrouve ici tous les avantages accordés aux clients Premium.', 0xF1C40F, []],
    [['annoncespremium', 'annonces-premium'], '📢 Annonces Premium', 'Annonces et nouveautés réservées aux clients Premium.', 0xF1C40F, []],
    [['premiumchat', 'premium-chat'], '💬 Premium Chat', 'Salon privé de discussion réservé aux clients Premium.', 0xF1C40F, []],

    // DÉVELOPPEMENT
    [['annoncesdev', 'annonces-dev'], '📢 Annonces développement', 'Annonces internes destinées à l’équipe de développement.', 0x3498DB, []],
    [['discussiondev', 'discussion-dev'], '💬 Discussion développement', 'Salon interne pour les échanges entre développeurs.', 0x3498DB, []],
    [['documentation'], '📚 Documentation', 'Documentation technique, procédures et ressources de développement.', 0x3498DB, []],
    [['tests'], '🧪 Tests', 'Suivi des fonctionnalités en phase de test avant validation.', 0x9B59B6, []],
    [['bugs'], '🐞 Bugs', 'Les bugs peuvent être enregistrés avec **/bug** et suivis ici.', 0xED4245, []],

    // PROJETS CLIENTS
    [['listedesprojets', 'liste-des-projets'], '📋 Liste des projets', 'Vue générale des projets clients enregistrés dans Creaty Bot.', 0x5865F2, []],
    [['enattente', 'en-attente'], '🟢 Projets en attente', 'Projets créés et en attente de prise en charge.', 0x57F287, []],
    [['analyse'], '🟡 Projets en analyse', 'Projets actuellement étudiés avant le développement.', 0xF1C40F, []],
    [['developpement', 'développement'], '🔵 Projets en développement', 'Projets actuellement en cours de développement.', 0x3498DB, []],
    [['tests'], '🟣 Projets en tests', 'Projets en phase de test et de validation.', 0x9B59B6, []],
    [['corrections'], '🟠 Projets en corrections', 'Projets nécessitant des corrections avant livraison.', 0xE67E22, []],
    [['termines', 'terminés'], '✅ Projets terminés', 'Projets terminés avec succès.', 0x57F287, []],
    [['livraisons'], '📦 Livraisons projets', 'Projets prêts à être remis à leurs clients.', 0x2ECC71, []],
    [['archives'], '📁 Archives projets', 'Anciens projets archivés.', 0x95A5A6, []],

    // COMMERCIAL
    [['ventes'], '💰 Ventes', 'Historique et suivi interne des ventes validées.', 0xF1C40F, []],
    [['devis'], '📋 Devis', 'Suivi des demandes **DEV-XXXX**. Le staff peut fixer un prix avec **/fixer-prix**.', 0xF1C40F, []],
    [['commandes'], '📦 Commandes', 'Suivi interne des commandes **CMD-XXXX**.', 0x3498DB, []],
    [['statistiques'], '📊 Statistiques commerciales', 'Statistiques sur les devis, commandes et activité commerciale.', 0x9B59B6, []],
    [['objectifs'], '🎯 Objectifs commerciaux', 'Objectifs de vente et de développement commercial.', 0xE91E63, []],
    [['chiffreaffaires', 'chiffre-affaires'], '📈 Chiffre d’affaires', 'Suivi interne des revenus liés aux paiements validés.', 0x2ECC71, []],
    [['discussioncommerciale', 'discussion-commerciale'], '💬 Discussion commerciale', 'Salon privé de l’équipe commerciale.', 0xF1C40F, []],

    // DESIGN
    [['creations', 'créations'], '🎨 Créations', 'Suivi général des créations graphiques.', 0x9B59B6, []],
    [['logos'], '✨ Logos', 'Projets et créations de logos.', 0x9B59B6, []],
    [['bannieres', 'bannières'], '🖼️ Bannières', 'Projets et créations de bannières.', 0x9B59B6, []],
    [['miniatures'], '📺 Miniatures', 'Projets de miniatures et visuels.', 0x9B59B6, []],
    [['reseauxsociaux', 'réseaux-sociaux'], '📱 Réseaux sociaux', 'Créations destinées aux réseaux sociaux.', 0x9B59B6, []],
    [['discussiondesign', 'discussion-design'], '💬 Discussion design', 'Salon privé de l’équipe design.', 0x9B59B6, []],

    // STAFF
    [['staffchat', 'staff-chat'], '💬 Staff Chat', 'Salon privé de discussion du personnel.', 0xED4245, []],
    [['staffannonces', 'staff-annonces'], '📢 Annonces staff', 'Annonces importantes destinées au personnel.', 0xED4245, []],
    [['recrutements'], '📝 Recrutements', 'Gestion des candidatures et recrutements du personnel.', 0xED4245, []],
    [['sanctions'], '⚠️ Sanctions', 'Historique des sanctions et avertissements. Utilise **/warn** pour ajouter un avertissement.', 0xE67E22, []],
    [['reunions', 'réunions'], '🤝 Réunions', 'Organisation et informations concernant les réunions du personnel.', 0xED4245, []],

    // DIRECTION
    [['direction'], '💼 Direction', 'Salon privé réservé à la direction de Creaty Bot.', 0xE67E22, []],
    [['finance'], '📈 Finance', 'Suivi financier interne de Creaty Bot.', 0x2ECC71, []],
    [['statistiquesglobales', 'statistiques-globales'], '📊 Statistiques globales', 'Vue globale de l’activité de Creaty Bot. Utilise **/dashboard** pour consulter les données principales.', 0x9B59B6, []],
    [['planning'], '📅 Planning', 'Organisation du planning et des tâches importantes.', 0x3498DB, []],
    [['partenaires'], '🤝 Partenaires', 'Suivi des partenariats officiels de Creaty Bot.', 0x5865F2, []],
    [['contrats'], '📃 Contrats', 'Suivi interne des contrats et accords.', 0x95A5A6, []],
    [['decisions', 'décisions'], '📝 Décisions', 'Journal des décisions importantes prises par la direction.', 0xE67E22, []],
    [['documents'], '📂 Documents direction', 'Documents internes réservés à la direction.', 0x95A5A6, []],

    // FONDATION
    [['fondation'], '💬 Fondation', 'Salon privé réservé à la fondation.', 0xED4245, []],
    [['documentsconfidentiels', 'documents-confidentiels'], '📜 Documents confidentiels', 'Documents confidentiels accessibles uniquement aux personnes autorisées.', 0xED4245, []],
    [['projetssecrets', 'projets-secrets'], '📂 Projets secrets', 'Espace réservé aux projets confidentiels.', 0xED4245, []],
    [['gestionfinanciere', 'gestion-financière'], '💰 Gestion financière', 'Informations financières confidentielles de la fondation.', 0xED4245, []],
    [['accestotal', 'accès-total'], '🔑 Accès total', 'Espace réservé aux informations de gestion les plus sensibles.', 0xED4245, []],
    [['journaldedirection', 'journal-de-direction'], '📝 Journal de direction', 'Historique des décisions majeures et informations importantes.', 0xED4245, []]
  ];

  let installed = 0;
  for (const [keys, title, description, color, components] of panels) {
    const ok = await sendPanel(guild, keys, title, description, color, components);
    if (ok) installed++;
  }

  return installed;
}

client.once(Events.ClientReady, async readyClient => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ CREATY BOT CONNECTÉ');
  console.log(`🤖 Nom : ${readyClient.user.tag}`);
  console.log(`🆔 ID : ${readyClient.user.id}`);
  console.log(`🌐 Serveurs : ${readyClient.guilds.cache.size}`);
  console.log('🟢 Présence ONLINE envoyée');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  ensureDb();

  for (const guild of readyClient.guilds.cache.values()) {
    try {
      await guild.commands.set(commands);
      console.log(`✅ Commandes slash installées sur ${guild.name}`);
    } catch (error) {
      console.error('❌ Erreur commandes slash :', error.message);
    }
  }
});

client.on(Events.GuildMemberAdd, async member => {
  const nouveau = findRole(member.guild, ['Nouveau']);
  if (nouveau) await member.roles.add(nouveau).catch(() => {});

  const channel = findChannel(member.guild, ['bienvenue']);
  if (!channel) return;

  const welcome = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle(`👋 Bienvenue ${member.user.username} !`)
    .setDescription(
      `Bienvenue ${member} sur **${member.guild.name}** !\n\n` +
      `Tu es notre **${member.guild.memberCount}e membre**.\n` +
      `Pense à lire le règlement pour accéder au serveur.`
    )
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setAuthor({
      name: member.user.tag,
      iconURL: member.user.displayAvatarURL({ size: 128 })
    })
    .setFooter({ text: `ID : ${member.user.id}` })
    .setTimestamp();

  await safeSend(channel, { embeds: [welcome] });
});

client.on(Events.GuildMemberRemove, async member => {
  const channel = findChannel(member.guild, ['abientot', 'a-bientot', 'bientot']);
  if (!channel) return;

  const goodbye = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle(`👋 À bientôt ${member.user.username}`)
    .setDescription(
      `**${member.user.tag}** a quitté **${member.guild.name}**.\n\n` +
      `Nous sommes maintenant **${member.guild.memberCount} membres**.`
    )
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setTimestamp();

  await safeSend(channel, { embeds: [goodbye] });
});

async function publishProjectUpdate(guild, project) {
  const statusChannels = {
    'En attente': ['enattente'],
    'Analyse': ['analyse'],
    'Développement': ['developpement'],
    'Tests': ['tests'],
    'Corrections': ['corrections'],
    'Livraison': ['livraisons'],
    'Terminé': ['termines'],
    'Archivé': ['archives']
  };

  const channel =
    findChannel(guild, statusChannels[project.status] || ['listedesprojets']) ||
    findChannel(guild, ['listedesprojets']);

  if (!channel) return;

  await safeSend(channel, {
    embeds: [
      makeEmbed(
        `🚀 ${project.id}`,
        `Client : <@${project.userId}>\n` +
        `Commande : **${project.orderId}**\n` +
        `Service : **${project.service}**\n` +
        `Statut : **${project.status}**\n` +
        `Progression : **${project.progress}%**\n` +
        `Responsable : ${project.assignedTo ? `<@${project.assignedTo}>` : 'Non assigné'}`
      )
    ]
  });
}

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const name = interaction.commandName;

      if (name === 'ping') {
        return interaction.reply({
          content: `🏓 Pong ! ${client.ws.ping} ms`,
          flags: MessageFlags.Ephemeral
        });
      }

      if (name === 'setup') {
        if (!isDirection(interaction.member)) {
          return interaction.reply({
            content: '❌ Réservé à la direction.',
            flags: MessageFlags.Ephemeral
          });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const count = await installAllPanels(interaction.guild);
        return interaction.editReply(`✅ Installation terminée. **${count} panneaux** trouvés/installés dans les salons existants.`);
      }

      if (name === 'annonce') {
        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: '❌ Réservé au staff.',
            flags: MessageFlags.Ephemeral
          });
        }

        const channel = findChannel(interaction.guild, ['annonces']);
        if (!channel) {
          return interaction.reply({
            content: '❌ Salon Annonces introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        const title = interaction.options.getString('titre');
        const message = interaction.options.getString('message');

        await safeSend(channel, {
          embeds: [makeEmbed(`📢 ${title}`, message)]
        });

        return interaction.reply({
          content: '✅ Annonce publiée.',
          flags: MessageFlags.Ephemeral
        });
      }

      if (name === 'sondage') {
        const question = interaction.options.getString('question');
        const channel = findChannel(interaction.guild, ['sondages']) || interaction.channel;

        await safeSend(channel, {
          embeds: [makeEmbed('📊 Sondage', question, 0x9B59B6)],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('poll_yes')
                .setLabel('Oui')
                .setEmoji('👍')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId('poll_no')
                .setLabel('Non')
                .setEmoji('👎')
                .setStyle(ButtonStyle.Danger)
            )
          ]
        });

        return interaction.reply({
          content: '✅ Sondage créé.',
          flags: MessageFlags.Ephemeral
        });
      }

      if (name === 'devis') {
        const id = nextId('devis', 'DEV');
        const service = interaction.options.getString('service');
        const description = interaction.options.getString('description');
        const budget = interaction.options.getString('budget') || 'Non précisé';

        const db = loadDb();
        db.devis[id] = {
          id,
          userId: interaction.user.id,
          service,
          description,
          budget,
          price: null,
          status: 'En attente',
          createdAt: new Date().toISOString()
        };
        saveDb(db);

        const channel = findChannel(interaction.guild, ['devis']) || interaction.channel;

        await safeSend(channel, {
          embeds: [
            makeEmbed(
              `📋 Devis ${id}`,
              `Client : ${interaction.user}\n` +
              `Service : **${service}**\n` +
              `Budget : **${budget}**\n` +
              `Statut : **En attente**\n\n` +
              description,
              0xF1C40F
            )
          ]
        });

        return interaction.reply({
          content: `✅ Devis créé : **${id}**`,
          flags: MessageFlags.Ephemeral
        });
      }

      if (name === 'fixer-prix') {
        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: '❌ Réservé au staff.',
            flags: MessageFlags.Ephemeral
          });
        }

        const id = interaction.options.getString('devis').toUpperCase();
        const price = interaction.options.getNumber('prix');
        const db = loadDb();

        if (!db.devis[id]) {
          return interaction.reply({
            content: '❌ Devis introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        db.devis[id].price = price;
        db.devis[id].status = 'Prix proposé';
        saveDb(db);

        const user = await client.users.fetch(db.devis[id].userId).catch(() => null);
        const channel = findChannel(interaction.guild, ['devis']) || interaction.channel;

        await safeSend(channel, {
          content: user ? `${user}` : undefined,
          embeds: [
            makeEmbed(`💰 Prix proposé — ${id}`, `Prix : **${price.toFixed(2)} €**`)
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`quote_accept:${id}`)
                .setLabel('Accepter')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`quote_refuse:${id}`)
                .setLabel('Refuser')
                .setStyle(ButtonStyle.Danger)
            )
          ]
        });

        return interaction.reply({
          content: '✅ Prix envoyé au client.',
          flags: MessageFlags.Ephemeral
        });
      }

      if (name === 'paiement') {
        const orderId = interaction.options.getString('commande').toUpperCase();
        const proof = interaction.options.getString('preuve') || 'Aucune référence';
        const db = loadDb();

        if (!db.commandes[orderId]) {
          return interaction.reply({
            content: '❌ Commande introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        const channel = findChannel(interaction.guild, ['paiements']) || interaction.channel;

        await safeSend(channel, {
          embeds: [
            makeEmbed(
              `💳 Paiement déclaré — ${orderId}`,
              `Client : ${interaction.user}\nPreuve : ${proof}`,
              0xF39C12
            )
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`payment_accept:${orderId}`)
                .setLabel('Valider')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`payment_refuse:${orderId}`)
                .setLabel('Refuser')
                .setStyle(ButtonStyle.Danger)
            )
          ]
        });

        return interaction.reply({
          content: '✅ Paiement déclaré.',
          flags: MessageFlags.Ephemeral
        });
      }

      if (name === 'suivi') {
        const id = interaction.options.getString('id').toUpperCase();
        const db = loadDb();

        if (db.devis[id]) {
          const item = db.devis[id];
          return interaction.reply({
            embeds: [
              makeEmbed(
                `📋 ${id}`,
                `Service : **${item.service}**\n` +
                `Prix : **${item.price !== null ? `${item.price} €` : 'Non fixé'}**\n` +
                `Statut : **${item.status}**`
              )
            ],
            flags: MessageFlags.Ephemeral
          });
        }

        if (db.commandes[id]) {
          const item = db.commandes[id];
          return interaction.reply({
            embeds: [
              makeEmbed(
                `📦 ${id}`,
                `Prix : **${item.price} €**\n` +
                `Statut : **${item.status}**\n` +
                `Devis : **${item.quoteId}**`
              )
            ],
            flags: MessageFlags.Ephemeral
          });
        }

        if (db.projets[id]) {
          const item = db.projets[id];
          return interaction.reply({
            embeds: [
              makeEmbed(
                `🚀 ${id}`,
                `Statut : **${item.status}**\n` +
                `Progression : **${item.progress}%**\n` +
                `Commande : **${item.orderId}**`
              )
            ],
            flags: MessageFlags.Ephemeral
          });
        }

        return interaction.reply({
          content: '❌ ID introuvable.',
          flags: MessageFlags.Ephemeral
        });
      }

      if (name === 'warn') {
        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: '❌ Réservé au staff.',
            flags: MessageFlags.Ephemeral
          });
        }

        const user = interaction.options.getUser('membre');
        const reason = interaction.options.getString('raison');
        const db = loadDb();

        if (!db.warns[user.id]) db.warns[user.id] = [];

        db.warns[user.id].push({
          reason,
          moderatorId: interaction.user.id,
          date: new Date().toISOString()
        });

        saveDb(db);

        const channel = findChannel(interaction.guild, ['sanctions']);
        await safeSend(channel, {
          embeds: [
            makeEmbed(
              '⚠️ Nouvelle sanction',
              `Membre : ${user}\n` +
              `Modérateur : ${interaction.user}\n` +
              `Raison : **${reason}**\n` +
              `Total de warns : **${db.warns[user.id].length}**`,
              0xE67E22
            )
          ]
        });

        return interaction.reply({
          content: `✅ Warn ajouté à ${user.tag}.`,
          flags: MessageFlags.Ephemeral
        });
      }

      if (name === 'bug') {
        const id = nextId('bugs', 'BUG');
        const title = interaction.options.getString('titre');
        const description = interaction.options.getString('description');

        const db = loadDb();
        db.bugs[id] = {
          id,
          title,
          description,
          userId: interaction.user.id,
          status: 'Ouvert',
          createdAt: new Date().toISOString()
        };
        saveDb(db);

        const channel = findChannel(interaction.guild, ['bugs']) || interaction.channel;

        await safeSend(channel, {
          embeds: [
            makeEmbed(
              `🐞 ${id} — ${title}`,
              `Signalé par : ${interaction.user}\n` +
              `Statut : **Ouvert**\n\n` +
              description,
              0xE67E22
            )
          ]
        });

        return interaction.reply({
          content: `✅ Bug enregistré : **${id}**`,
          flags: MessageFlags.Ephemeral
        });
      }

      if (name === 'dashboard') {
        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: '❌ Réservé au staff.',
            flags: MessageFlags.Ephemeral
          });
        }

        const db = loadDb();

        return interaction.reply({
          embeds: [
            makeEmbed(
              '📊 Dashboard Creaty Bot',
              `👥 Membres : **${interaction.guild.memberCount}**\n` +
              `📋 Devis : **${Object.keys(db.devis).length}**\n` +
              `📦 Commandes : **${Object.keys(db.commandes).length}**\n` +
              `🚀 Projets : **${Object.keys(db.projets).length}**\n` +
              `🐞 Bugs : **${Object.keys(db.bugs).length}**\n` +
              `🎫 Tickets : **${Object.keys(db.tickets).length}**`
            )
          ],
          flags: MessageFlags.Ephemeral
        });
      }

      if (name === 'roadmap') {
        const sub = interaction.options.getSubcommand();
        const db = loadDb();

        if (sub === 'ajouter') {
          if (!isDirection(interaction.member)) {
            return interaction.reply({
              content: '❌ Réservé à la direction.',
              flags: MessageFlags.Ephemeral
            });
          }

          const key = `ROAD-${Date.now()}`;
          db.roadmap[key] = {
            title: interaction.options.getString('titre'),
            status: interaction.options.getString('statut')
          };
          saveDb(db);

          return interaction.reply({
            content: '✅ Élément ajouté à la roadmap.',
            flags: MessageFlags.Ephemeral
          });
        }

        const values = Object.values(db.roadmap);
        const text = values.length
          ? values.map(item => `• **${item.title}** — ${item.status}`).join('\n')
          : 'Roadmap vide.';

        return interaction.reply({
          embeds: [makeEmbed('🗺️ Roadmap', text)],
          flags: MessageFlags.Ephemeral
        });
      }

      if (name === 'projet') {
        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: '❌ Réservé au staff.',
            flags: MessageFlags.Ephemeral
          });
        }

        const sub = interaction.options.getSubcommand();
        const id = interaction.options.getString('projet').toUpperCase();
        const db = loadDb();

        if (!db.projets[id]) {
          return interaction.reply({
            content: '❌ Projet introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        if (sub === 'statut') {
          db.projets[id].status = interaction.options.getString('statut');
        }

        if (sub === 'progression') {
          db.projets[id].progress = interaction.options.getInteger('pourcentage');
        }

        if (sub === 'assigner') {
          db.projets[id].assignedTo = interaction.options.getUser('membre').id;
        }

        saveDb(db);
        await publishProjectUpdate(interaction.guild, db.projets[id]);

        return interaction.reply({
          content: `✅ ${id} mis à jour.`,
          flags: MessageFlags.Ephemeral
        });
      }
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_type') {
      const type = interaction.values[0];
      const ticketId = nextId('tickets', 'TICKET');

      const category = findChannel(
        interaction.guild,
        ['support'],
        ChannelType.GuildCategory
      );

      const staffRole = findRole(
        interaction.guild,
        ['Support Client', 'Modérateur', 'Administrateur']
      );

      const overwrites = [
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
        }
      ];

      if (staffRole) {
        overwrites.push({
          id: staffRole.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages
          ]
        });
      }

      const channel = await interaction.guild.channels.create({
        name: `${type}-${interaction.user.username}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '')
          .slice(0, 90),
        type: ChannelType.GuildText,
        parent: category?.id,
        permissionOverwrites: overwrites
      });

      const db = loadDb();
      db.tickets[ticketId] = {
        id: ticketId,
        channelId: channel.id,
        userId: interaction.user.id,
        type,
        status: 'Ouvert'
      };
      saveDb(db);

      await safeSend(channel, {
        content: `${interaction.user}`,
        embeds: [
          makeEmbed(
            `🎫 ${ticketId} — ${type}`,
            `Bonjour ${interaction.user}, explique ta demande ici.`
          )
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`ticket_claim:${ticketId}`)
              .setLabel('Prendre en charge')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`ticket_close:${ticketId}`)
              .setLabel('Fermer')
              .setStyle(ButtonStyle.Danger)
          )
        ]
      });

      return interaction.reply({
        content: `✅ Ticket créé : ${channel}`,
        flags: MessageFlags.Ephemeral
      });
    }

    if (interaction.isButton()) {
      if (interaction.customId === 'accept_rules') {
        const memberRole = findRole(interaction.guild, ['Membre']);
        const newRole = findRole(interaction.guild, ['Nouveau']);

        if (memberRole) await interaction.member.roles.add(memberRole).catch(() => {});
        if (newRole) await interaction.member.roles.remove(newRole).catch(() => {});

        await logAction(
          interaction.guild,
          'Règlement accepté',
          `${interaction.user.tag} a accepté le règlement.`,
          0x57F287
        );

        return interaction.reply({
          content: '✅ Règlement accepté.',
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId === 'new_suggestion') {
        const modal = new ModalBuilder()
          .setCustomId('suggestion_modal')
          .setTitle('Nouvelle suggestion');

        const input = new TextInputBuilder()
          .setCustomId('suggestion_text')
          .setLabel('Ta suggestion')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1000);

        modal.addComponents(
          new ActionRowBuilder().addComponents(input)
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId === 'service_devis') {
        return interaction.reply({
          content: 'Utilise **/devis** pour demander un devis.',
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId === 'service_commander') {
        return interaction.reply({
          content: 'Commence par demander un devis avec **/devis**.',
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId === 'service_question') {
        return interaction.reply({
          content: 'Ouvre un ticket dans le salon Ticket.',
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId.startsWith('quote_accept:')) {
        const quoteId = interaction.customId.split(':')[1];
        const db = loadDb();
        const quote = db.devis[quoteId];

        if (!quote) {
          return interaction.reply({
            content: '❌ Devis introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        if (quote.userId !== interaction.user.id) {
          return interaction.reply({
            content: '❌ Seul le client concerné peut accepter ce devis.',
            flags: MessageFlags.Ephemeral
          });
        }

        const orderId = nextId('commandes', 'CMD');
        const db2 = loadDb();

        db2.devis[quoteId].status = 'Accepté';
        db2.commandes[orderId] = {
          id: orderId,
          quoteId,
          userId: quote.userId,
          service: quote.service,
          price: quote.price,
          status: 'Paiement en attente'
        };
        saveDb(db2);

        const channel = findChannel(interaction.guild, ['commandes']);
        await safeSend(channel, {
          embeds: [
            makeEmbed(
              `📦 Commande ${orderId}`,
              `Client : ${interaction.user}\n` +
              `Devis : **${quoteId}**\n` +
              `Service : **${quote.service}**\n` +
              `Prix : **${quote.price} €**\n` +
              `Statut : **Paiement en attente**`
            )
          ]
        });

        return interaction.update({
          embeds: [
            makeEmbed(
              `✅ Devis accepté — ${quoteId}`,
              `Commande créée : **${orderId}**`,
              0x57F287
            )
          ],
          components: []
        });
      }

      if (interaction.customId.startsWith('quote_refuse:')) {
        const quoteId = interaction.customId.split(':')[1];
        const db = loadDb();

        if (!db.devis[quoteId]) {
          return interaction.reply({
            content: '❌ Devis introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        if (db.devis[quoteId].userId !== interaction.user.id) {
          return interaction.reply({
            content: '❌ Seul le client concerné peut refuser ce devis.',
            flags: MessageFlags.Ephemeral
          });
        }

        db.devis[quoteId].status = 'Refusé';
        saveDb(db);

        return interaction.update({
          embeds: [
            makeEmbed(
              `❌ Devis refusé — ${quoteId}`,
              'Le devis a été refusé.',
              0xED4245
            )
          ],
          components: []
        });
      }

      if (interaction.customId.startsWith('payment_accept:')) {
        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: '❌ Réservé au staff.',
            flags: MessageFlags.Ephemeral
          });
        }

        const orderId = interaction.customId.split(':')[1];
        const db = loadDb();
        const order = db.commandes[orderId];

        if (!order) {
          return interaction.reply({
            content: '❌ Commande introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        const projectId = nextId('projets', 'PROJ');
        const db2 = loadDb();

        db2.commandes[orderId].status = 'Payé';
        db2.projets[projectId] = {
          id: projectId,
          orderId,
          userId: order.userId,
          service: order.service,
          price: order.price,
          status: 'En attente',
          progress: 0,
          assignedTo: null
        };
        saveDb(db2);

        const member = await interaction.guild.members.fetch(order.userId).catch(() => null);
        const clientRole = findRole(interaction.guild, ['Client']);
        const prospectRole = findRole(interaction.guild, ['Prospect']);

        if (member && clientRole) await member.roles.add(clientRole).catch(() => {});
        if (member && prospectRole) await member.roles.remove(prospectRole).catch(() => {});

        await publishProjectUpdate(interaction.guild, db2.projets[projectId]);

        return interaction.update({
          embeds: [
            makeEmbed(
              `✅ Paiement validé — ${orderId}`,
              `Projet créé : **${projectId}**`,
              0x57F287
            )
          ],
          components: []
        });
      }

      if (interaction.customId.startsWith('payment_refuse:')) {
        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: '❌ Réservé au staff.',
            flags: MessageFlags.Ephemeral
          });
        }

        const orderId = interaction.customId.split(':')[1];
        const db = loadDb();

        if (db.commandes[orderId]) {
          db.commandes[orderId].status = 'Paiement refusé';
        }

        saveDb(db);

        return interaction.update({
          embeds: [
            makeEmbed(
              `❌ Paiement refusé — ${orderId}`,
              'Le paiement a été refusé.',
              0xED4245
            )
          ],
          components: []
        });
      }

      if (interaction.customId.startsWith('ticket_claim:')) {
        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: '❌ Réservé au staff.',
            flags: MessageFlags.Ephemeral
          });
        }

        return interaction.reply({
          content: `👤 Ticket pris en charge par ${interaction.user}.`
        });
      }

      if (interaction.customId.startsWith('ticket_close:')) {
        const ticketId = interaction.customId.split(':')[1];
        const db = loadDb();
        const ticket = db.tickets[ticketId];

        if (!ticket) {
          return interaction.reply({
            content: '❌ Ticket introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        if (
          ticket.userId !== interaction.user.id &&
          !isStaff(interaction.member)
        ) {
          return interaction.reply({
            content: '❌ Tu ne peux pas fermer ce ticket.',
            flags: MessageFlags.Ephemeral
          });
        }

        ticket.status = 'Fermé';
        saveDb(db);

        await interaction.channel.permissionOverwrites
          .edit(ticket.userId, { SendMessages: false })
          .catch(() => {});

        return interaction.update({
          embeds: [
            makeEmbed(
              `🔒 ${ticketId} fermé`,
              `Ticket fermé par ${interaction.user}.`,
              0x95A5A6
            )
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`ticket_reopen:${ticketId}`)
                .setLabel('Rouvrir')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`ticket_delete:${ticketId}`)
                .setLabel('Supprimer')
                .setStyle(ButtonStyle.Danger)
            )
          ]
        });
      }

      if (interaction.customId.startsWith('ticket_reopen:')) {
        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: '❌ Réservé au staff.',
            flags: MessageFlags.Ephemeral
          });
        }

        const ticketId = interaction.customId.split(':')[1];
        const db = loadDb();
        const ticket = db.tickets[ticketId];

        if (!ticket) {
          return interaction.reply({
            content: '❌ Ticket introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        ticket.status = 'Ouvert';
        saveDb(db);

        await interaction.channel.permissionOverwrites
          .edit(ticket.userId, { SendMessages: true })
          .catch(() => {});

        return interaction.reply({
          content: `🔓 Ticket rouvert par ${interaction.user}.`
        });
      }

      if (interaction.customId.startsWith('ticket_delete:')) {
        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: '❌ Réservé au staff.',
            flags: MessageFlags.Ephemeral
          });
        }

        await interaction.reply({
          content: '🗑️ Suppression du ticket dans 5 secondes...'
        });

        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
        }, 5000);

        return;
      }

      if (
        interaction.customId === 'poll_yes' ||
        interaction.customId === 'poll_no'
      ) {
        return interaction.reply({
          content:
            interaction.customId === 'poll_yes'
              ? '👍 Vote enregistré : Oui'
              : '👎 Vote enregistré : Non',
          flags: MessageFlags.Ephemeral
        });
      }
    }

    if (
      interaction.isModalSubmit() &&
      interaction.customId === 'suggestion_modal'
    ) {
      const text = interaction.fields.getTextInputValue('suggestion_text');
      const id = `SUG-${Date.now()}`;
      const db = loadDb();

      db.suggestions[id] = {
        id,
        userId: interaction.user.id,
        text,
        status: 'En attente'
      };
      saveDb(db);

      const channel =
        findChannel(interaction.guild, ['suggestion']) ||
        interaction.channel;

      await safeSend(channel, {
        embeds: [
          makeEmbed(
            `💡 Suggestion de ${interaction.user.username}`,
            text,
            0xF1C40F
          )
        ]
      });

      return interaction.reply({
        content: '✅ Suggestion envoyée.',
        flags: MessageFlags.Ephemeral
      });
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
