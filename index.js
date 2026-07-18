require('dotenv').config();

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
    activities: [
      {
        name: 'Creaty Bot',
        type: ActivityType.Playing
      }
    ]
  }
});

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'creatybot.json');

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(
        {
          counters: {
            devis: 0,
            commandes: 0,
            projets: 0,
            bugs: 0,
            tickets: 0
          },
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

    const channelName = normalize(channel.name);

    return keys.some(key =>
      channelName.includes(normalize(key))
    );
  });
}

function findRole(guild, keywords) {
  const keys = Array.isArray(keywords) ? keywords : [keywords];

  return guild.roles.cache.find(role => {
    const roleName = normalize(role.name);

    return keys.some(key =>
      roleName === normalize(key) ||
      roleName.includes(normalize(key))
    );
  });
}

function isStaff(member) {
  if (!member) return false;

  if (
    member.permissions.has(
      PermissionFlagsBits.Administrator
    )
  ) {
    return true;
  }

  const allowed = [
    'fondateur',
    'cofondateur',
    'directeurgeneral',
    'directeur',
    'administrateur',
    'moderateur',
    'assistantmoderateur',
    'responsablecommercial',
    'commercial',
    'leaddeveloppeur',
    'supportclient'
  ];

  return member.roles.cache.some(role =>
    allowed.some(name =>
      normalize(role.name).includes(name)
    )
  );
}

function isDirection(member) {
  if (!member) return false;

  if (
    member.permissions.has(
      PermissionFlagsBits.Administrator
    )
  ) {
    return true;
  }

  const allowed = [
    'fondateur',
    'cofondateur',
    'directeurgeneral',
    'directeur'
  ];

  return member.roles.cache.some(role =>
    allowed.some(name =>
      normalize(role.name).includes(name)
    )
  );
}

function makeEmbed(
  title,
  description,
  color = 0x5865F2
) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp()
    .setFooter({
      text: 'Creaty Bot • Panel'
    });
}

async function safeSend(channel, payload) {
  if (!channel || !channel.isTextBased()) {
    return null;
  }

  try {
    return await channel.send(payload);
  } catch (error) {
    console.error(
      `❌ Erreur envoi dans #${channel?.name}:`,
      error.message
    );
    return null;
  }
}

async function panelExists(channel, title) {
  try {
    const messages = await channel.messages.fetch({
      limit: 50
    });

    return messages.some(message =>
      message.author?.id === client.user.id &&
      message.embeds?.some(embed =>
        embed.title === title &&
        embed.footer?.text === 'Creaty Bot • Panel'
      )
    );
  } catch {
    return false;
  }
}

async function sendPanel(
  guild,
  keys,
  title,
  description,
  color = 0x5865F2,
  components = []
) {
  const channel = findChannel(guild, keys);

  if (!channel) {
    console.log(
      `⚠️ Salon introuvable pour : ${title}`
    );
    return false;
  }

  if (await panelExists(channel, title)) {
    console.log(
      `↪️ Panel déjà présent dans #${channel.name}`
    );
    return true;
  }

  await safeSend(channel, {
    embeds: [
      makeEmbed(
        title,
        description,
        color
      )
    ],
    components
  });

  return true;
}

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Teste Creaty Bot.'),

  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Installe tous les panneaux du serveur.'),

  new SlashCommandBuilder()
    .setName('annonce')
    .setDescription('Publie une annonce.')
    .addStringOption(option =>
      option
        .setName('titre')
        .setDescription('Titre')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('Message')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('sondage')
    .setDescription('Crée un sondage.')
    .addStringOption(option =>
      option
        .setName('question')
        .setDescription('Question')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('devis')
    .setDescription('Crée une demande de devis.')
    .addStringOption(option =>
      option
        .setName('service')
        .setDescription('Service demandé')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('Description')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('budget')
        .setDescription('Budget indicatif')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('fixer-prix')
    .setDescription('Fixe le prix d’un devis.')
    .addStringOption(option =>
      option
        .setName('devis')
        .setDescription('DEV-0001')
        .setRequired(true)
    )
    .addNumberOption(option =>
      option
        .setName('prix')
        .setDescription('Prix en euros')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('paiement')
    .setDescription('Déclare un paiement.')
    .addStringOption(option =>
      option
        .setName('commande')
        .setDescription('CMD-0001')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('preuve')
        .setDescription('Lien ou référence')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('suivi')
    .setDescription('Consulte un devis, une commande ou un projet.')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('DEV-0001, CMD-0001 ou PROJ-0001')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Ajoute un avertissement.')
    .addUserOption(option =>
      option
        .setName('membre')
        .setDescription('Membre')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('raison')
        .setDescription('Raison')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('bug')
    .setDescription('Signale un bug.')
    .addStringOption(option =>
      option
        .setName('titre')
        .setDescription('Titre')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('Description')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('dashboard')
    .setDescription('Affiche les statistiques principales.')
].map(command => command.toJSON());

async function installAllPanels(guild) {
  const rulesRow =
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('accept_rules')
        .setLabel('Accepter le règlement')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success)
    );

  const ticketMenu =
    new StringSelectMenuBuilder()
      .setCustomId('ticket_type')
      .setPlaceholder('Choisir un type de ticket')
      .addOptions(
        {
          label: 'Support',
          value: 'support',
          emoji: '❓'
        },
        {
          label: 'Commande',
          value: 'commande',
          emoji: '📝'
        },
        {
          label: 'Devis',
          value: 'devis',
          emoji: '💰'
        },
        {
          label: 'Paiement',
          value: 'paiement',
          emoji: '💳'
        },
        {
          label: 'Bug',
          value: 'bug',
          emoji: '🐞'
        },
        {
          label: 'Partenariat',
          value: 'partenariat',
          emoji: '🤝'
        },
        {
          label: 'SAV',
          value: 'sav',
          emoji: '🔧'
        },
        {
          label: 'Autre',
          value: 'autre',
          emoji: '📌'
        }
      );

  const ticketRow =
    new ActionRowBuilder().addComponents(
      ticketMenu
    );

  const suggestionRow =
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('new_suggestion')
        .setLabel('Proposer une suggestion')
        .setEmoji('💡')
        .setStyle(ButtonStyle.Primary)
    );

  const serviceRow =
    new ActionRowBuilder().addComponents(
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
    [['bienvenue'], '👋 Bienvenue', 'Bienvenue sur **Creaty Bot**.\n\nÀ chaque arrivée, le bot publiera ici un message avec la photo de profil du nouveau membre.', 0x57F287, []],
    [['abientot', 'a-bientot', 'bientot'], '👋 À bientôt', 'Lorsqu’un membre quitte le serveur, son message de départ sera publié ici avec sa photo de profil.', 0xED4245, []],

    [['reglement', 'règlement'], '📜 Règlement de Creaty Bot', 'Lis attentivement le règlement puis clique sur le bouton pour recevoir le rôle **Membre**.', 0x57F287, [rulesRow]],
    [['annonces'], '📢 Annonces officielles', 'Toutes les annonces importantes seront publiées ici par le staff.', 0x5865F2, []],
    [['info'], '📌 Informations', 'Informations principales concernant Creaty Bot, ses services et son fonctionnement.', 0x3498DB, []],
    [['roadmap'], '🗺️ Roadmap', 'Retrouve ici les fonctionnalités prévues, en cours et terminées.', 0x9B59B6, []],
    [['nosliens', 'nos-liens'], '🔗 Nos liens', 'Tous les liens officiels de Creaty Bot seront publiés ici.', 0x3498DB, []],
    [['faq'], '❓ FAQ', 'Questions fréquentes sur les commandes, devis, paiements, garanties et livraisons.', 0xF1C40F, []],
    [['sondages'], '📊 Sondages', 'Les sondages de la communauté seront publiés ici.', 0x9B59B6, []],

    [['ticket'], '🎫 Support Creaty Bot', 'Choisis le type de ticket à ouvrir dans le menu ci-dessous.', 0x3498DB, [ticketRow]],
    [['attmove', 'att-move'], '🎙️ Attente vocale', 'Espace lié à l’attente vocale pour le support.', 0x95A5A6, []],

    [['discussion'], '💬 Discussion', 'Salon principal de discussion de la communauté.', 0x5865F2, []],
    [['media'], '📷 Médias', 'Partage ici tes images, vidéos et créations.', 0x3498DB, []],
    [['suggestion'], '💡 Suggestions', 'Propose ici une idée pour améliorer Creaty Bot.', 0xF1C40F, [suggestionRow]],
    [['vosbots', 'vos-bots'], '🤖 Vos bots', 'Présente ici tes bots Discord.', 0x5865F2, []],
    [['presentation', 'présentation'], '👋 Présentations', 'Présente-toi à la communauté.', 0x57F287, []],
    [['evenements', 'événements'], '🎉 Événements', 'Les événements communautaires seront annoncés ici.', 0xE91E63, []],

    [['creationbot', 'créationbot'], '🤖 Création de bot Discord', 'Création de bots Discord personnalisés.', 0x5865F2, [serviceRow]],
    [['creationserveur', 'créationserveur'], '💬 Création de serveur Discord', 'Création et configuration complète de serveurs Discord.', 0x5865F2, [serviceRow]],
    [['hebergement', 'hébergement'], '🌐 Hébergement', 'Solutions d’hébergement pour maintenir vos projets en ligne.', 0x3498DB, [serviceRow]],
    [['tarifs'], '💰 Tarifs', 'Les tarifs officiels des services Creaty Bot seront affichés ici.', 0xF1C40F, []],
    [['garantie'], '📜 Garantie', 'Conditions de garantie, corrections, maintenance et SAV.', 0x95A5A6, []],

    [['commander'], '📝 Commander', 'Commence par demander un devis. Après acceptation, une commande CMD-XXXX sera créée.', 0x5865F2, [serviceRow]],
    [['demanderundevis', 'demander-un-devis'], '💰 Demander un devis', 'Utilise **/devis** pour créer une demande de devis.', 0xF1C40F, []],
    [['suivicommandes', 'suivi-commandes'], '📦 Suivi des commandes', 'Utilise **/suivi** pour consulter l’état de ton devis, commande ou projet.', 0x3498DB, []],
    [['paiements'], '💳 Paiements', 'Utilise **/paiement** pour déclarer un paiement lié à une commande.', 0x2ECC71, []],
    [['conditions'], '📜 Conditions', 'Les conditions officielles de commande et de vente seront publiées ici.', 0x95A5A6, []],
    [['questionscommandes', 'questions-commandes'], '❓ Questions commandes', 'Pour une question, ouvre un ticket Commande ou Devis.', 0xF1C40F, [ticketRow]],
    [['offresspeciales', 'offres-spéciales'], '🎯 Offres spéciales', 'Les promotions et offres temporaires seront publiées ici.', 0xE91E63, []],

    [['informationsclients', 'informations-clients'], '📢 Informations clients', 'Informations importantes réservées aux clients.', 0x5865F2, []],
    [['livraisons'], '📂 Livraisons', 'Les informations de livraison seront publiées ici.', 0x2ECC71, []],
    [['factures'], '📜 Factures', 'Les informations liées aux factures seront centralisées ici.', 0x95A5A6, []],
    [['laisserunavis', 'laisser-un-avis'], '⭐ Laisser un avis', 'Après une commande, partage ton expérience ici.', 0xF1C40F, []],

    [['supportprioritaire', 'support-prioritaire'], '👑 Support prioritaire', 'Support réservé aux clients Premium.', 0xF1C40F, [ticketRow]],
    [['commandesprioritaires', 'commandes-prioritaires'], '⚡ Commandes prioritaires', 'Les commandes Premium sont traitées en priorité.', 0xF1C40F, []],
    [['avantages'], '🎁 Avantages Premium', 'Retrouve ici tous les avantages Premium.', 0xF1C40F, []],
    [['annoncespremium', 'annonces-premium'], '📢 Annonces Premium', 'Annonces réservées aux clients Premium.', 0xF1C40F, []],
    [['premiumchat', 'premium-chat'], '💬 Premium Chat', 'Salon privé réservé aux clients Premium.', 0xF1C40F, []],

    [['annoncesdev', 'annonces-dev'], '📢 Annonces développement', 'Annonces internes de l’équipe développement.', 0x3498DB, []],
    [['discussiondev', 'discussion-dev'], '💬 Discussion développement', 'Salon interne des développeurs.', 0x3498DB, []],
    [['documentation'], '📚 Documentation', 'Documentation technique et procédures.', 0x3498DB, []],
    [['tests'], '🧪 Tests', 'Suivi des fonctionnalités en phase de test.', 0x9B59B6, []],
    [['bugs'], '🐞 Bugs', 'Les bugs enregistrés seront suivis ici.', 0xED4245, []],

    [['listedesprojets', 'liste-des-projets'], '📋 Liste des projets', 'Vue générale des projets clients.', 0x5865F2, []],
    [['enattente', 'en-attente'], '🟢 Projets en attente', 'Projets en attente de prise en charge.', 0x57F287, []],
    [['analyse'], '🟡 Projets en analyse', 'Projets actuellement en analyse.', 0xF1C40F, []],
    [['developpement', 'développement'], '🔵 Projets en développement', 'Projets actuellement en développement.', 0x3498DB, []],
    [['corrections'], '🟠 Projets en corrections', 'Projets actuellement en correction.', 0xE67E22, []],
    [['termines', 'terminés'], '✅ Projets terminés', 'Projets terminés avec succès.', 0x57F287, []],
    [['archives'], '📁 Archives', 'Anciens projets archivés.', 0x95A5A6, []],

    [['ventes'], '💰 Ventes', 'Historique et suivi des ventes.', 0xF1C40F, []],
    [['devis'], '📋 Devis', 'Suivi des demandes de devis DEV-XXXX.', 0xF1C40F, []],
    [['commandes'], '📦 Commandes', 'Suivi des commandes CMD-XXXX.', 0x3498DB, []],
    [['statistiques'], '📊 Statistiques commerciales', 'Statistiques liées à l’activité commerciale.', 0x9B59B6, []],
    [['objectifs'], '🎯 Objectifs', 'Objectifs commerciaux et de développement.', 0xE91E63, []],
    [['chiffreaffaires', 'chiffre-affaires'], '📈 Chiffre d’affaires', 'Suivi du chiffre d’affaires interne.', 0x2ECC71, []],
    [['discussioncommerciale', 'discussion-commerciale'], '💬 Discussion commerciale', 'Salon privé de l’équipe commerciale.', 0xF1C40F, []],

    [['creations', 'créations'], '🎨 Créations', 'Suivi des créations graphiques.', 0x9B59B6, []],
    [['logos'], '✨ Logos', 'Projets de logos.', 0x9B59B6, []],
    [['bannieres', 'bannières'], '🖼️ Bannières', 'Projets de bannières.', 0x9B59B6, []],
    [['miniatures'], '📺 Miniatures', 'Projets de miniatures.', 0x9B59B6, []],
    [['reseauxsociaux', 'réseaux-sociaux'], '📱 Réseaux sociaux', 'Créations destinées aux réseaux sociaux.', 0x9B59B6, []],
    [['discussiondesign', 'discussion-design'], '💬 Discussion design', 'Salon privé de l’équipe design.', 0x9B59B6, []],

    [['staffchat', 'staff-chat'], '💬 Staff Chat', 'Salon privé du staff.', 0xED4245, []],
    [['staffannonces', 'staff-annonces'], '📢 Annonces staff', 'Annonces importantes destinées au personnel.', 0xED4245, []],
    [['recrutements'], '📝 Recrutements', 'Gestion des candidatures et recrutements.', 0xED4245, []],
    [['sanctions'], '⚠️ Sanctions', 'Historique des sanctions et avertissements.', 0xE67E22, []],
    [['reunions', 'réunions'], '🤝 Réunions', 'Organisation des réunions du personnel.', 0xED4245, []],

    [['direction'], '💼 Direction', 'Salon privé réservé à la direction.', 0xE67E22, []],
    [['finance'], '📈 Finance', 'Suivi financier interne.', 0x2ECC71, []],
    [['statistiquesglobales', 'statistiques-globales'], '📊 Statistiques globales', 'Vue globale de l’activité.', 0x9B59B6, []],
    [['planning'], '📅 Planning', 'Organisation des tâches et du planning.', 0x3498DB, []],
    [['partenaires'], '🤝 Partenaires', 'Suivi des partenariats officiels.', 0x5865F2, []],
    [['contrats'], '📃 Contrats', 'Suivi interne des contrats.', 0x95A5A6, []],
    [['decisions', 'décisions'], '📝 Décisions', 'Journal des décisions importantes.', 0xE67E22, []],
    [['documents'], '📂 Documents', 'Documents internes de la direction.', 0x95A5A6, []],

    [['fondation'], '💬 Fondation', 'Salon privé réservé à la fondation.', 0xED4245, []],
    [['documentsconfidentiels', 'documents-confidentiels'], '📜 Documents confidentiels', 'Documents confidentiels de la fondation.', 0xED4245, []],
    [['projetssecrets', 'projets-secrets'], '📂 Projets secrets', 'Espace réservé aux projets confidentiels.', 0xED4245, []],
    [['gestionfinanciere', 'gestion-financière'], '💰 Gestion financière', 'Informations financières confidentielles.', 0xED4245, []],
    [['accestotal', 'accès-total'], '🔑 Accès total', 'Espace réservé aux informations les plus sensibles.', 0xED4245, []],
    [['journaldedirection', 'journal-de-direction'], '📝 Journal de direction', 'Historique des décisions majeures.', 0xED4245, []]
  ];

  let installed = 0;

  for (const [
    keys,
    title,
    description,
    color,
    components
  ] of panels) {
    const result =
      await sendPanel(
        guild,
        keys,
        title,
        description,
        color,
        components
      );

    if (result) installed++;
  }

  return installed;
}

client.once(
  Events.ClientReady,
  async readyClient => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ CREATY BOT CONNECTÉ');
    console.log(`🤖 Nom : ${readyClient.user.tag}`);
    console.log(`🆔 ID : ${readyClient.user.id}`);
    console.log(`🌐 Serveurs : ${readyClient.guilds.cache.size}`);
    console.log('🟢 Présence ONLINE envoyée');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    ensureDb();

    for (
      const guild of readyClient.guilds.cache.values()
    ) {
      try {
        await guild.commands.set(commands);

        console.log(
          `✅ Commandes slash installées sur ${guild.name}`
        );
      } catch (error) {
        console.error(
          '❌ Erreur commandes slash :',
          error.message
        );
      }
    }
  }
);

client.on(
  Events.GuildMemberAdd,
  async member => {
    const nouveau =
      findRole(
        member.guild,
        ['Nouveau']
      );

    if (nouveau) {
      await member.roles
        .add(nouveau)
        .catch(() => {});
    }

    const channel =
      findChannel(
        member.guild,
        ['bienvenue']
      );

    if (!channel) return;

    const welcome =
      new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle(
          `👋 Bienvenue ${member.user.username} !`
        )
        .setDescription(
          `Bienvenue ${member} sur **${member.guild.name}** !\n\n` +
          `Tu es notre **${member.guild.memberCount}e membre**.\n` +
          `Pense à lire le règlement pour accéder au serveur.`
        )
        .setThumbnail(
          member.user.displayAvatarURL({
            size: 256
          })
        )
        .setAuthor({
          name: member.user.tag,
          iconURL:
            member.user.displayAvatarURL({
              size: 128
            })
        })
        .setFooter({
          text: `ID : ${member.user.id}`
        })
        .setTimestamp();

    await safeSend(
      channel,
      {
        embeds: [welcome]
      }
    );
  }
);

client.on(
  Events.GuildMemberRemove,
  async member => {
    const channel =
      findChannel(
        member.guild,
        ['abientot', 'a-bientot', 'bientot']
      );

    if (!channel) return;

    const goodbye =
      new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle(
          `👋 À bientôt ${member.user.username}`
        )
        .setDescription(
          `**${member.user.tag}** a quitté **${member.guild.name}**.\n\n` +
          `Nous sommes maintenant **${member.guild.memberCount} membres**.`
        )
        .setThumbnail(
          member.user.displayAvatarURL({
            size: 256
          })
        )
        .setTimestamp();

    await safeSend(
      channel,
      {
        embeds: [goodbye]
      }
    );
  }
);

client.on(
  Events.InteractionCreate,
  async interaction => {
    try {
      if (
        interaction.isChatInputCommand()
      ) {
        if (
          interaction.commandName === 'ping'
        ) {
          return interaction.reply({
            content:
              `🏓 Pong ! ${client.ws.ping} ms`,
            flags:
              MessageFlags.Ephemeral
          });
        }

        if (
          interaction.commandName === 'setup'
        ) {
          if (
            !isDirection(
              interaction.member
            )
          ) {
            return interaction.reply({
              content:
                '❌ Réservé à la direction.',
              flags:
                MessageFlags.Ephemeral
            });
          }

          await interaction.deferReply({
            flags:
              MessageFlags.Ephemeral
          });

          const count =
            await installAllPanels(
              interaction.guild
            );

          return interaction.editReply(
            `✅ Installation terminée : **${count} panneaux** trouvés ou installés.`
          );
        }
      }

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId === 'ticket_type'
      ) {
        const type =
          interaction.values[0];

        const ticketId =
          nextId(
            'tickets',
            'TICKET'
          );

        const category =
          findChannel(
            interaction.guild,
            ['support'],
            ChannelType.GuildCategory
          );

        const staffRole =
          findRole(
            interaction.guild,
            [
              'Support Client',
              'Modérateur',
              'Administrateur'
            ]
          );

        const overwrites = [
          {
            id:
              interaction.guild.roles.everyone.id,
            deny: [
              PermissionFlagsBits.ViewChannel
            ]
          },
          {
            id:
              interaction.user.id,
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

        const channel =
          await interaction.guild.channels.create({
            name:
              `${type}-${interaction.user.username}`
                .toLowerCase()
                .replace(
                  /[^a-z0-9-]/g,
                  ''
                )
                .slice(
                  0,
                  90
                ),
            type:
              ChannelType.GuildText,
            parent:
              category?.id,
            permissionOverwrites:
              overwrites
          });

        const db =
          loadDb();

        db.tickets[ticketId] = {
          id:
            ticketId,
          channelId:
            channel.id,
          userId:
            interaction.user.id,
          type,
          status:
            'Ouvert'
        };

        saveDb(db);

        await safeSend(
          channel,
          {
            content:
              `${interaction.user}`,
            embeds: [
              makeEmbed(
                `🎫 ${ticketId} — ${type}`,
                `Bonjour ${interaction.user}, explique ta demande ici.`
              )
            ],
            components: [
              new ActionRowBuilder()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId(
                      `ticket_claim:${ticketId}`
                    )
                    .setLabel(
                      'Prendre en charge'
                    )
                    .setStyle(
                      ButtonStyle.Primary
                    ),
                  new ButtonBuilder()
                    .setCustomId(
                      `ticket_close:${ticketId}`
                    )
                    .setLabel(
                      'Fermer'
                    )
                    .setStyle(
                      ButtonStyle.Danger
                    )
                )
            ]
          }
        );

        return interaction.reply({
          content:
            `✅ Ticket créé : ${channel}`,
          flags:
            MessageFlags.Ephemeral
        });
      }

      if (
        interaction.isButton()
      ) {
        if (
          interaction.customId ===
          'accept_rules'
        ) {
          const memberRole =
            findRole(
              interaction.guild,
              ['Membre']
            );

          const newRole =
            findRole(
              interaction.guild,
              ['Nouveau']
            );

          if (
            memberRole
          ) {
            await interaction.member.roles
              .add(memberRole)
              .catch(() => {});
          }

          if (
            newRole
          ) {
            await interaction.member.roles
              .remove(newRole)
              .catch(() => {});
          }

          return interaction.reply({
            content:
              '✅ Règlement accepté.',
            flags:
              MessageFlags.Ephemeral
          });
        }

        if (
          interaction.customId ===
          'new_suggestion'
        ) {
          const modal =
            new ModalBuilder()
              .setCustomId(
                'suggestion_modal'
              )
              .setTitle(
                'Nouvelle suggestion'
              );

          const input =
            new TextInputBuilder()
              .setCustomId(
                'suggestion_text'
              )
              .setLabel(
                'Ta suggestion'
              )
              .setStyle(
                TextInputStyle.Paragraph
              )
              .setRequired(true)
              .setMaxLength(1000);

          modal.addComponents(
            new ActionRowBuilder()
              .addComponents(
                input
              )
          );

          return interaction.showModal(
            modal
          );
        }

        if (
          interaction.customId ===
          'service_devis'
        ) {
          return interaction.reply({
            content:
              'Utilise **/devis** pour demander un devis.',
            flags:
              MessageFlags.Ephemeral
          });
        }

        if (
          interaction.customId ===
          'service_commander'
        ) {
          return interaction.reply({
            content:
              'Commence par demander un devis avec **/devis**.',
            flags:
              MessageFlags.Ephemeral
          });
        }

        if (
          interaction.customId ===
          'service_question'
        ) {
          return interaction.reply({
            content:
              'Ouvre un ticket dans le salon Ticket.',
            flags:
              MessageFlags.Ephemeral
          });
        }

        if (
          interaction.customId.startsWith(
            'ticket_claim:'
          )
        ) {
          if (
            !isStaff(
              interaction.member
            )
          ) {
            return interaction.reply({
              content:
                '❌ Réservé au staff.',
              flags:
                MessageFlags.Ephemeral
            });
          }

          return interaction.reply({
            content:
              `👤 Ticket pris en charge par ${interaction.user}.`
          });
        }

        if (
          interaction.customId.startsWith(
            'ticket_close:'
          )
        ) {
          const ticketId =
            interaction.customId.split(
              ':'
            )[1];

          const db =
            loadDb();

          const ticket =
            db.tickets[ticketId];

          if (
            !ticket
          ) {
            return interaction.reply({
              content:
                '❌ Ticket introuvable.',
              flags:
                MessageFlags.Ephemeral
            });
          }

          ticket.status =
            'Fermé';

          saveDb(db);

          await interaction.channel.permissionOverwrites
            .edit(
              ticket.userId,
              {
                SendMessages:
                  false
              }
            )
            .catch(() => {});

          return interaction.update({
            embeds: [
              makeEmbed(
                `🔒 ${ticketId} fermé`,
                `Ticket fermé par ${interaction.user}.`,
                0x95A5A6
              )
            ],
            components: []
          });
        }
      }

      if (
        interaction.isModalSubmit() &&
        interaction.customId ===
        'suggestion_modal'
      ) {
        const text =
          interaction.fields.getTextInputValue(
            'suggestion_text'
          );

        const channel =
          findChannel(
            interaction.guild,
            ['suggestion']
          ) ||
          interaction.channel;

        await safeSend(
          channel,
          {
            embeds: [
              makeEmbed(
                `💡 Suggestion de ${interaction.user.username}`,
                text,
                0xF1C40F
              )
            ]
          }
        );

        return interaction.reply({
          content:
            '✅ Suggestion envoyée.',
          flags:
            MessageFlags.Ephemeral
        });
      }
    } catch (error) {
      console.error(
        '❌ Erreur interaction :',
        error
      );

      if (
        !interaction.replied &&
        !interaction.deferred
      ) {
        await interaction.reply({
          content:
            '❌ Une erreur est survenue.',
          flags:
            MessageFlags.Ephemeral
        }).catch(() => {});
      }
    }
  }
);

client.on(
  Events.Error,
  error => {
    console.error(
      '❌ Erreur Discord :',
      error
    );
  }
);

process.on(
  'unhandledRejection',
  error => {
    console.error(
      '❌ Promesse non gérée :',
      error
    );
  }
);

client.login(
  process.env.TOKEN
);
