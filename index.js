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
  ActivityType
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

// ==============================
// DONNÉES LOCALES
// ==============================

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

// ==============================
// OUTILS
// ==============================

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
    const name = normalize(channel.name);
    return keys.some(key => name.includes(normalize(key)));
  });
}

function findRole(guild, keywords) {
  const keys = Array.isArray(keywords) ? keywords : [keywords];

  return guild.roles.cache.find(role => {
    const name = normalize(role.name);
    return keys.some(key => name === normalize(key) || name.includes(normalize(key)));
  });
}

function isStaff(member) {
  if (!member) return false;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;

  const names = [
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
    .setFooter({ text: 'Creaty Bot' });
}

async function safeSend(channel, payload) {
  if (!channel || !channel.isTextBased()) return null;

  try {
    return await channel.send(payload);
  } catch (error) {
    console.error(`❌ Erreur envoi dans ${channel?.name}:`, error.message);
    return null;
  }
}

async function logAction(guild, title, description, color = 0x5865F2) {
  const channel = findChannel(guild, ['logs', 'journal']);
  if (!channel) return;
  await safeSend(channel, {
    embeds: [makeEmbed(title, description, color)]
  });
}

// ==============================
// COMMANDES SLASH
// ==============================

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Teste Creaty Bot.'),

  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Installe les panels principaux dans les salons existants.'),

  new SlashCommandBuilder()
    .setName('annonce')
    .setDescription('Publie une annonce.')
    .addStringOption(option =>
      option.setName('titre').setDescription('Titre').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('message').setDescription('Message').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('sondage')
    .setDescription('Crée un sondage Oui / Non.')
    .addStringOption(option =>
      option.setName('question').setDescription('Question').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('devis')
    .setDescription('Crée une demande de devis.')
    .addStringOption(option =>
      option.setName('service').setDescription('Service demandé').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('description').setDescription('Description').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('budget').setDescription('Budget indicatif').setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('fixer-prix')
    .setDescription('Fixe le prix d’un devis.')
    .addStringOption(option =>
      option.setName('devis').setDescription('Exemple : DEV-0001').setRequired(true)
    )
    .addNumberOption(option =>
      option.setName('prix').setDescription('Prix en euros').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('paiement')
    .setDescription('Déclare un paiement.')
    .addStringOption(option =>
      option.setName('commande').setDescription('Exemple : CMD-0001').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('preuve').setDescription('Lien ou référence').setRequired(false)
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
      option.setName('membre').setDescription('Membre').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('raison').setDescription('Raison').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('bug')
    .setDescription('Signale un bug.')
    .addStringOption(option =>
      option.setName('titre').setDescription('Titre').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('description').setDescription('Description').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('dashboard')
    .setDescription('Affiche les statistiques principales.'),

  new SlashCommandBuilder()
    .setName('roadmap')
    .setDescription('Gère la roadmap.')
    .addSubcommand(sub =>
      sub
        .setName('ajouter')
        .setDescription('Ajoute un élément.')
        .addStringOption(option =>
          option.setName('titre').setDescription('Titre').setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('statut')
            .setDescription('Statut')
            .setRequired(true)
            .addChoices(
              { name: 'Prévu', value: 'Prévu' },
              { name: 'En cours', value: 'En cours' },
              { name: 'Terminé', value: 'Terminé' }
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('liste').setDescription('Affiche la roadmap.')
    ),

  new SlashCommandBuilder()
    .setName('projet')
    .setDescription('Gère les projets.')
    .addSubcommand(sub =>
      sub
        .setName('statut')
        .setDescription('Change le statut.')
        .addStringOption(option =>
          option.setName('projet').setDescription('PROJ-0001').setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('statut')
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
    .addSubcommand(sub =>
      sub
        .setName('progression')
        .setDescription('Change la progression.')
        .addStringOption(option =>
          option.setName('projet').setDescription('PROJ-0001').setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('pourcentage')
            .setDescription('0 à 100')
            .setMinValue(0)
            .setMaxValue(100)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('assigner')
        .setDescription('Assigne un membre.')
        .addStringOption(option =>
          option.setName('projet').setDescription('PROJ-0001').setRequired(true)
        )
        .addUserOption(option =>
          option.setName('membre').setDescription('Membre').setRequired(true)
        )
    )
].map(command => command.toJSON());

// ==============================
// INSTALLATION DES PANELS
// ==============================

async function installPanels(guild) {
  const reglement = findChannel(guild, ['reglement', 'règlement']);
  const ticket = findChannel(guild, ['ticket']);
  const suggestion = findChannel(guild, ['suggestion']);

  if (reglement) {
    await safeSend(reglement, {
      embeds: [
        makeEmbed(
          '📜 Règlement de Creaty Bot',
          'Lis le règlement puis clique sur **Accepter le règlement** pour recevoir le rôle Membre.',
          0x57F287
        )
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('accept_rules')
            .setLabel('Accepter le règlement')
            .setEmoji('✅')
            .setStyle(ButtonStyle.Success)
        )
      ]
    });
  }

  if (ticket) {
    const menu = new StringSelectMenuBuilder()
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

    await safeSend(ticket, {
      embeds: [
        makeEmbed(
          '🎫 Support Creaty Bot',
          'Choisis le type de ticket que tu souhaites ouvrir.'
        )
      ],
      components: [
        new ActionRowBuilder().addComponents(menu)
      ]
    });
  }

  if (suggestion) {
    await safeSend(suggestion, {
      embeds: [
        makeEmbed(
          '💡 Suggestions',
          'Clique sur le bouton pour proposer une suggestion.',
          0xF1C40F
        )
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('new_suggestion')
            .setLabel('Proposer une suggestion')
            .setStyle(ButtonStyle.Primary)
        )
      ]
    });
  }

  const services = [
    [
      findChannel(guild, ['creationbot', 'créationbot']),
      '🤖 Création de bot',
      'Création de bots Discord personnalisés.'
    ],
    [
      findChannel(guild, ['creationserveur', 'créationserveur']),
      '💬 Création de serveur',
      'Création et configuration complète de serveurs Discord.'
    ],
    [
      findChannel(guild, ['hebergement', 'hébergement']),
      '🌐 Hébergement',
      'Solutions d’hébergement pour vos projets.'
    ]
  ];

  for (const [channel, title, description] of services) {
    if (!channel) continue;

    await safeSend(channel, {
      embeds: [makeEmbed(title, description)],
      components: [
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
        )
      ]
    });
  }
}

// ==============================
// DÉMARRAGE
// ==============================

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

// ==============================
// BIENVENUE / DÉPART
// ==============================

client.on(Events.GuildMemberAdd, async member => {
  const nouveau = findRole(member.guild, ['Nouveau']);
  if (nouveau) {
    await member.roles.add(nouveau).catch(() => {});
  }

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

// ==============================
// PROJETS
// ==============================

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

// ==============================
// INTERACTIONS
// ==============================

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const name = interaction.commandName;

      if (name === 'ping') {
        return interaction.reply({
          content: `🏓 Pong ! ${client.ws.ping} ms`,
          ephemeral: true
        });
      }

      if (name === 'setup') {
        if (!isDirection(interaction.member)) {
          return interaction.reply({
            content: '❌ Réservé à la direction.',
            ephemeral: true
          });
        }

        await interaction.deferReply({ ephemeral: true });
        await installPanels(interaction.guild);

        return interaction.editReply(
          '✅ Les panels principaux ont été installés dans les salons existants.'
        );
      }

      if (name === 'annonce') {
        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: '❌ Réservé au staff.',
            ephemeral: true
          });
        }

        const channel = findChannel(interaction.guild, ['annonces']);
        if (!channel) {
          return interaction.reply({
            content: '❌ Salon Annonces introuvable.',
            ephemeral: true
          });
        }

        const title = interaction.options.getString('titre');
        const message = interaction.options.getString('message');

        await safeSend(channel, {
          embeds: [
            makeEmbed(`📢 ${title}`, message)
          ]
        });

        return interaction.reply({
          content: '✅ Annonce publiée.',
          ephemeral: true
        });
      }

      if (name === 'sondage') {
        const question = interaction.options.getString('question');
        const channel =
          findChannel(interaction.guild, ['sondages']) || interaction.channel;

        await safeSend(channel, {
          embeds: [
            makeEmbed('📊 Sondage', question, 0x9B59B6)
          ],
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
          ephemeral: true
        });
      }

      if (name === 'devis') {
        const id = nextId('devis', 'DEV');
        const service = interaction.options.getString('service');
        const description = interaction.options.getString('description');
        const budget =
          interaction.options.getString('budget') || 'Non précisé';

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

        const channel =
          findChannel(interaction.guild, ['devis']) || interaction.channel;

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
          ephemeral: true
        });
      }

      if (name === 'fixer-prix') {
        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: '❌ Réservé au staff.',
            ephemeral: true
          });
        }

        const id = interaction.options.getString('devis').toUpperCase();
        const price = interaction.options.getNumber('prix');
        const db = loadDb();

        if (!db.devis[id]) {
          return interaction.reply({
            content: '❌ Devis introuvable.',
            ephemeral: true
          });
        }

        db.devis[id].price = price;
        db.devis[id].status = 'Prix proposé';
        saveDb(db);

        const user = await client.users
          .fetch(db.devis[id].userId)
          .catch(() => null);

        const channel =
          findChannel(interaction.guild, ['devis']) || interaction.channel;

        await safeSend(channel, {
          content: user ? `${user}` : undefined,
          embeds: [
            makeEmbed(
              `💰 Prix proposé — ${id}`,
              `Prix : **${price.toFixed(2)} €**`
            )
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
          ephemeral: true
        });
      }

      if (name === 'paiement') {
        const orderId =
          interaction.options.getString('commande').toUpperCase();

        const proof =
          interaction.options.getString('preuve') || 'Aucune référence';

        const db = loadDb();

        if (!db.commandes[orderId]) {
          return interaction.reply({
            content: '❌ Commande introuvable.',
            ephemeral: true
          });
        }

        const channel =
          findChannel(interaction.guild, ['paiements']) || interaction.channel;

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
          ephemeral: true
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
            ephemeral: true
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
            ephemeral: true
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
            ephemeral: true
          });
        }

        return interaction.reply({
          content: '❌ ID introuvable.',
          ephemeral: true
        });
      }

      if (name === 'warn') {
        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: '❌ Réservé au staff.',
            ephemeral: true
          });
        }

        const user = interaction.options.getUser('membre');
        const reason = interaction.options.getString('raison');
        const db = loadDb();

        if (!db.warns[user.id]) {
          db.warns[user.id] = [];
        }

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
          ephemeral: true
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

        const channel =
          findChannel(interaction.guild, ['bugs']) || interaction.channel;

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
          ephemeral: true
        });
      }

      if (name === 'dashboard') {
        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: '❌ Réservé au staff.',
            ephemeral: true
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
          ephemeral: true
        });
      }

      if (name === 'roadmap') {
        const sub = interaction.options.getSubcommand();
        const db = loadDb();

        if (sub === 'ajouter') {
          if (!isDirection(interaction.member)) {
            return interaction.reply({
              content: '❌ Réservé à la direction.',
              ephemeral: true
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
            ephemeral: true
          });
        }

        const values = Object.values(db.roadmap);
        const text = values.length
          ? values
              .map(item => `• **${item.title}** — ${item.status}`)
              .join('\n')
          : 'Roadmap vide.';

        return interaction.reply({
          embeds: [makeEmbed('🗺️ Roadmap', text)],
          ephemeral: true
        });
      }

      if (name === 'projet') {
        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: '❌ Réservé au staff.',
            ephemeral: true
          });
        }

        const sub = interaction.options.getSubcommand();
        const id =
          interaction.options.getString('projet').toUpperCase();

        const db = loadDb();

        if (!db.projets[id]) {
          return interaction.reply({
            content: '❌ Projet introuvable.',
            ephemeral: true
          });
        }

        if (sub === 'statut') {
          db.projets[id].status =
            interaction.options.getString('statut');
        }

        if (sub === 'progression') {
          db.projets[id].progress =
            interaction.options.getInteger('pourcentage');
        }

        if (sub === 'assigner') {
          db.projets[id].assignedTo =
            interaction.options.getUser('membre').id;
        }

        saveDb(db);

        await publishProjectUpdate(
          interaction.guild,
          db.projets[id]
        );

        return interaction.reply({
          content: `✅ ${id} mis à jour.`,
          ephemeral: true
        });
      }
    }

    // ==============================
    // MENU TICKETS
    // ==============================

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === 'ticket_type'
    ) {
      const type = interaction.values[0];
      const ticketId = nextId('tickets', 'TICKET');

      const category =
        findChannel(
          interaction.guild,
          ['support'],
          ChannelType.GuildCategory
        );

      const staffRole =
        findRole(
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

      const channel =
        await interaction.guild.channels.create({
          name:
            `${type}-${interaction.user.username}`
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
        ephemeral: true
      });
    }

    // ==============================
    // BOUTONS
    // ==============================

    if (interaction.isButton()) {
      if (interaction.customId === 'accept_rules') {
        const memberRole =
          findRole(interaction.guild, ['Membre']);

        const newRole =
          findRole(interaction.guild, ['Nouveau']);

        if (memberRole) {
          await interaction.member.roles
            .add(memberRole)
            .catch(() => {});
        }

        if (newRole) {
          await interaction.member.roles
            .remove(newRole)
            .catch(() => {});
        }

        await logAction(
          interaction.guild,
          'Règlement accepté',
          `${interaction.user.tag} a accepté le règlement.`,
          0x57F287
        );

        return interaction.reply({
          content: '✅ Règlement accepté.',
          ephemeral: true
        });
      }

      if (interaction.customId === 'new_suggestion') {
        const modal =
          new ModalBuilder()
            .setCustomId('suggestion_modal')
            .setTitle('Nouvelle suggestion');

        const input =
          new TextInputBuilder()
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
          ephemeral: true
        });
      }

      if (interaction.customId === 'service_commander') {
        return interaction.reply({
          content: 'Commence par demander un devis avec **/devis**.',
          ephemeral: true
        });
      }

      if (interaction.customId === 'service_question') {
        return interaction.reply({
          content: 'Ouvre un ticket dans le salon Ticket.',
          ephemeral: true
        });
      }

      if (interaction.customId.startsWith('quote_accept:')) {
        const quoteId =
          interaction.customId.split(':')[1];

        const db = loadDb();
        const quote = db.devis[quoteId];

        if (!quote) {
          return interaction.reply({
            content: '❌ Devis introuvable.',
            ephemeral: true
          });
        }

        if (quote.userId !== interaction.user.id) {
          return interaction.reply({
            content:
              '❌ Seul le client concerné peut accepter ce devis.',
            ephemeral: true
          });
        }

        const orderId =
          nextId('commandes', 'CMD');

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

        const channel =
          findChannel(interaction.guild, ['commandes']);

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
        const quoteId =
          interaction.customId.split(':')[1];

        const db = loadDb();

        if (!db.devis[quoteId]) {
          return interaction.reply({
            content: '❌ Devis introuvable.',
            ephemeral: true
          });
        }

        if (db.devis[quoteId].userId !== interaction.user.id) {
          return interaction.reply({
            content:
              '❌ Seul le client concerné peut refuser ce devis.',
            ephemeral: true
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
            ephemeral: true
          });
        }

        const orderId =
          interaction.customId.split(':')[1];

        const db = loadDb();
        const order = db.commandes[orderId];

        if (!order) {
          return interaction.reply({
            content: '❌ Commande introuvable.',
            ephemeral: true
          });
        }

        const projectId =
          nextId('projets', 'PROJ');

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

        const member =
          await interaction.guild.members
            .fetch(order.userId)
            .catch(() => null);

        const clientRole =
          findRole(interaction.guild, ['Client']);

        const prospectRole =
          findRole(interaction.guild, ['Prospect']);

        if (member && clientRole) {
          await member.roles.add(clientRole).catch(() => {});
        }

        if (member && prospectRole) {
          await member.roles.remove(prospectRole).catch(() => {});
        }

        await publishProjectUpdate(
          interaction.guild,
          db2.projets[projectId]
        );

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
            ephemeral: true
          });
        }

        const orderId =
          interaction.customId.split(':')[1];

        const db = loadDb();

        if (db.commandes[orderId]) {
          db.commandes[orderId].status =
            'Paiement refusé';
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
            ephemeral: true
          });
        }

        return interaction.reply({
          content:
            `👤 Ticket pris en charge par ${interaction.user}.`
        });
      }

      if (interaction.customId.startsWith('ticket_close:')) {
        const ticketId =
          interaction.customId.split(':')[1];

        const db = loadDb();
        const ticket = db.tickets[ticketId];

        if (!ticket) {
          return interaction.reply({
            content: '❌ Ticket introuvable.',
            ephemeral: true
          });
        }

        if (
          ticket.userId !== interaction.user.id &&
          !isStaff(interaction.member)
        ) {
          return interaction.reply({
            content:
              '❌ Tu ne peux pas fermer ce ticket.',
            ephemeral: true
          });
        }

        ticket.status = 'Fermé';
        saveDb(db);

        await interaction.channel.permissionOverwrites
          .edit(ticket.userId, {
            SendMessages: false
          })
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
            ephemeral: true
          });
        }

        const ticketId =
          interaction.customId.split(':')[1];

        const db = loadDb();
        const ticket = db.tickets[ticketId];

        if (!ticket) {
          return interaction.reply({
            content: '❌ Ticket introuvable.',
            ephemeral: true
          });
        }

        ticket.status = 'Ouvert';
        saveDb(db);

        await interaction.channel.permissionOverwrites
          .edit(ticket.userId, {
            SendMessages: true
          })
          .catch(() => {});

        return interaction.reply({
          content:
            `🔓 Ticket rouvert par ${interaction.user}.`
        });
      }

      if (interaction.customId.startsWith('ticket_delete:')) {
        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: '❌ Réservé au staff.',
            ephemeral: true
          });
        }

        await interaction.reply({
          content:
            '🗑️ Suppression du ticket dans 5 secondes...'
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
          ephemeral: true
        });
      }
    }

    // ==============================
    // MODAL SUGGESTION
    // ==============================

    if (
      interaction.isModalSubmit() &&
      interaction.customId === 'suggestion_modal'
    ) {
      const text =
        interaction.fields.getTextInputValue(
          'suggestion_text'
        );

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
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('❌ Erreur interaction :', error);

    if (
      !interaction.replied &&
      !interaction.deferred
    ) {
      await interaction.reply({
        content: '❌ Une erreur est survenue.',
        ephemeral: true
      }).catch(() => {});
    }
  }
});

// ==============================
// ERREURS
// ==============================

client.on(Events.Error, error => {
  console.error('❌ Erreur Discord :', error);
});

process.on('unhandledRejection', error => {
  console.error('❌ Promesse non gérée :', error);
});

client.login(process.env.TOKEN);
