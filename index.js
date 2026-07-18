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
  ButtonStyle
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
    Partials.GuildMember
  ]
});

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

function ensureData() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(
      CONFIG_FILE,
      JSON.stringify(
        {
          guilds: {}
        },
        null,
        2
      )
    );
  }
}

function loadConfig() {
  ensureData();
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

function saveConfig(data) {
  ensureData();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
}

function getGuildConfig(guildId) {
  const data = loadConfig();

  if (!data.guilds[guildId]) {
    data.guilds[guildId] = {
      channels: {},
      categories: {},
      roles: {}
    };
    saveConfig(data);
  }

  return data.guilds[guildId];
}

function updateGuildConfig(guildId, section, key, value) {
  const data = loadConfig();

  if (!data.guilds[guildId]) {
    data.guilds[guildId] = {
      channels: {},
      categories: {},
      roles: {}
    };
  }

  data.guilds[guildId][section][key] = value;
  saveConfig(data);
}

function isDirection(member) {
  if (!member) return false;
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

function makeEmbed(title, description, color = 0x5865F2) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: 'Creaty Bot' });
}

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
  ['support', 'Catégorie Support'],
  ['tickets', 'Catégorie Tickets'],
  ['projets_clients', 'Catégorie Projets clients'],
  ['clients', 'Catégorie Clients'],
  ['premium', 'Catégorie Premium'],
  ['developpement', 'Catégorie Développement'],
  ['commercial', 'Catégorie Commercial'],
  ['design', 'Catégorie Design'],
  ['staff', 'Catégorie Staff'],
  ['direction', 'Catégorie Direction'],
  ['fondation', 'Catégorie Fondation'],
  ['archives', 'Catégorie Archives']
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

const commands = [
  new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure Creaty Bot.')
    .addSubcommand(sub =>
      sub
        .setName('salon')
        .setDescription('Configure un salon ou une catégorie.')
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
        .setName('voir')
        .setDescription('Affiche la configuration actuelle.')
    ),

  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Installe tous les panneaux dans les salons configurés.')
].map(command => command.toJSON());

client.once(Events.ClientReady, async readyClient => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ CREATY BOT CONNECTÉ');
  console.log(`🤖 Nom : ${readyClient.user.tag}`);
  console.log(`🆔 ID : ${readyClient.user.id}`);
  console.log(`🌐 Serveurs : ${readyClient.guilds.cache.size}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  ensureData();

  for (const guild of readyClient.guilds.cache.values()) {
    await guild.commands.set(commands);
    console.log(`✅ Commandes slash installées sur ${guild.name}`);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isAutocomplete()) {
      if (interaction.commandName !== 'config') return;

      const sub = interaction.options.getSubcommand();
      const focused = interaction.options.getFocused().toLowerCase();

      const source = sub === 'salon'
        ? [
            ...CHANNEL_KEYS.map(([key, name]) => ({
              name: `Salon • ${name}`,
              value: `channel:${key}`
            })),
            ...CATEGORY_KEYS.map(([key, name]) => ({
              name: `Catégorie • ${name}`,
              value: `category:${key}`
            }))
          ]
        : ROLE_KEYS.map(([key, name]) => ({
            name,
            value: key
          }));

      const results = source
        .filter(item => item.name.toLowerCase().includes(focused))
        .slice(0, 25);

      return interaction.respond(results);
    }

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'config') {
      if (!isDirection(interaction.member)) {
        return interaction.reply({
          content: '❌ Cette commande est réservée à la direction.',
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
            content: '❌ Type de configuration invalide.',
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

        return interaction.reply({
          content: `✅ Configuration enregistrée : **${key}** → ${target}`,
          flags: MessageFlags.Ephemeral
        });
      }

      if (sub === 'role') {
        const key = interaction.options.getString('type');
        const role = interaction.options.getRole('role');

        updateGuildConfig(
          interaction.guild.id,
          'roles',
          key,
          role.id
        );

        return interaction.reply({
          content: `✅ Rôle configuré : **${key}** → ${role}`,
          flags: MessageFlags.Ephemeral
        });
      }

      if (sub === 'voir') {
        const config = getGuildConfig(interaction.guild.id);

        const channelLines = Object.entries(config.channels)
          .map(([key, id]) => `• ${key} → <#${id}>`);

        const categoryLines = Object.entries(config.categories)
          .map(([key, id]) => `• ${key} → <#${id}>`);

        const roleLines = Object.entries(config.roles)
          .map(([key, id]) => `• ${key} → <@&${id}>`);

        const description = [
          '**Salons**',
          channelLines.length ? channelLines.join('\n') : 'Aucun salon configuré.',
          '',
          '**Catégories**',
          categoryLines.length ? categoryLines.join('\n') : 'Aucune catégorie configurée.',
          '',
          '**Rôles**',
          roleLines.length ? roleLines.join('\n') : 'Aucun rôle configuré.'
        ].join('\n');

        return interaction.reply({
          embeds: [
            makeEmbed(
              '⚙️ Configuration Creaty Bot',
              description
            )
          ],
          flags: MessageFlags.Ephemeral
        });
      }
    }

    if (interaction.commandName === 'setup') {
      if (!isDirection(interaction.member)) {
        return interaction.reply({
          content: '❌ Cette commande est réservée à la direction.',
          flags: MessageFlags.Ephemeral
        });
      }

      const config = getGuildConfig(interaction.guild.id);

      const requiredChannels = [
        'bienvenue',
        'depart',
        'reglement',
        'annonces',
        'info',
        'roadmap',
        'liens',
        'faq',
        'sondages',
        'ticket',
        'suggestion',
        'creation_bot',
        'creation_serveur',
        'hebergement',
        'tarifs',
        'garantie',
        'commander',
        'demander_devis',
        'suivi_commandes',
        'paiements',
        'conditions',
        'questions_commandes',
        'offres_speciales',
        'infos_clients',
        'livraisons_clients',
        'factures',
        'avis',
        'support_premium',
        'commandes_premium',
        'avantages_premium',
        'annonces_premium',
        'premium_chat',
        'annonces_dev',
        'discussion_dev',
        'documentation',
        'tests_dev',
        'bugs',
        'liste_projets',
        'projets_attente',
        'analyse',
        'developpement',
        'tests_projets',
        'corrections',
        'termines',
        'livraisons_projets',
        'archives',
        'ventes',
        'devis_commerciaux',
        'commandes_commerciales',
        'statistiques_commerciales',
        'objectifs',
        'chiffre_affaires',
        'discussion_commerciale',
        'creations',
        'logos',
        'bannieres',
        'miniatures',
        'reseaux_sociaux',
        'discussion_design',
        'staff_chat',
        'staff_annonces',
        'recrutements',
        'sanctions',
        'reunions',
        'direction',
        'finance',
        'statistiques_globales',
        'planning',
        'partenaires',
        'contrats',
        'decisions',
        'documents',
        'fondation',
        'documents_confidentiels',
        'projets_secrets',
        'gestion_financiere',
        'acces_total',
        'journal_direction'
      ];

      const missing = requiredChannels.filter(key => !config.channels[key]);

      if (missing.length) {
        return interaction.reply({
          content:
            `❌ Il manque encore **${missing.length} salons** à configurer.\n\n` +
            missing.slice(0, 20).map(key => `• ${key}`).join('\n') +
            (missing.length > 20 ? '\n• ...' : ''),
          flags: MessageFlags.Ephemeral
        });
      }

      const panelData = {
        bienvenue: ['👋 Bienvenue', 'Les nouveaux membres seront accueillis ici avec leur photo de profil.'],
        depart: ['👋 À bientôt', 'Les départs des membres seront signalés ici.'],
        reglement: ['📜 Règlement', 'Lis le règlement puis accepte-le pour accéder au serveur.'],
        annonces: ['📢 Annonces', 'Les annonces officielles de Creaty Bot seront publiées ici.'],
        info: ['📌 Informations', 'Toutes les informations principales de Creaty Bot.'],
        roadmap: ['🗺️ Roadmap', 'Les fonctionnalités prévues, en cours et terminées.'],
        liens: ['🔗 Nos liens', 'Tous les liens officiels de Creaty Bot.'],
        faq: ['❓ FAQ', 'Les réponses aux questions fréquentes.'],
        sondages: ['📊 Sondages', 'Les sondages de la communauté seront publiés ici.'],
        ticket: ['🎫 Tickets', 'Ouvre un ticket pour contacter l’équipe Creaty Bot.'],
        suggestion: ['💡 Suggestions', 'Propose ici tes idées pour améliorer Creaty Bot.'],
        creation_bot: ['🤖 Création de bot', 'Service de création de bots Discord personnalisés.'],
        creation_serveur: ['💬 Création de serveur', 'Service de création et configuration de serveurs Discord.'],
        hebergement: ['🌐 Hébergement', 'Solutions d’hébergement pour les projets.'],
        tarifs: ['💰 Tarifs', 'Les tarifs officiels seront publiés ici.'],
        garantie: ['📜 Garantie', 'Conditions de garantie et de SAV.'],
        commander: ['📝 Commander', 'Commence ici ton parcours de commande.'],
        demander_devis: ['💰 Demander un devis', 'Demande ici une estimation pour ton projet.'],
        suivi_commandes: ['📦 Suivi des commandes', 'Suis ici l’avancement de tes commandes.'],
        paiements: ['💳 Paiements', 'Informations et validation des paiements.'],
        conditions: ['📜 Conditions', 'Conditions applicables aux commandes.'],
        questions_commandes: ['❓ Questions commandes', 'Pose tes questions liées aux commandes.'],
        offres_speciales: ['🎯 Offres spéciales', 'Promotions et offres temporaires.'],
        infos_clients: ['📢 Informations clients', 'Informations réservées aux clients.'],
        livraisons_clients: ['📂 Livraisons', 'Livraisons destinées aux clients.'],
        factures: ['📜 Factures', 'Informations liées aux factures.'],
        avis: ['⭐ Avis', 'Laisse ici ton avis après une commande.'],
        support_premium: ['👑 Support prioritaire', 'Support réservé aux clients Premium.'],
        commandes_premium: ['⚡ Commandes prioritaires', 'Commandes Premium prioritaires.'],
        avantages_premium: ['🎁 Avantages Premium', 'Avantages réservés aux clients Premium.'],
        annonces_premium: ['📢 Annonces Premium', 'Annonces réservées aux clients Premium.'],
        premium_chat: ['💬 Premium Chat', 'Salon privé pour les clients Premium.'],
        annonces_dev: ['📢 Annonces Dev', 'Annonces internes de l’équipe développement.'],
        discussion_dev: ['💬 Discussion Dev', 'Discussion interne des développeurs.'],
        documentation: ['📚 Documentation', 'Documentation technique et procédures.'],
        tests_dev: ['🧪 Tests Dev', 'Tests des fonctionnalités.'],
        bugs: ['🐞 Bugs', 'Suivi des bugs.'],
        liste_projets: ['📋 Liste des projets', 'Vue générale des projets clients.'],
        projets_attente: ['🟢 En attente', 'Projets en attente.'],
        analyse: ['🟡 Analyse', 'Projets en analyse.'],
        developpement: ['🔵 Développement', 'Projets en développement.'],
        tests_projets: ['🟣 Tests projets', 'Projets en phase de test.'],
        corrections: ['🟠 Corrections', 'Projets en correction.'],
        termines: ['✅ Terminés', 'Projets terminés.'],
        livraisons_projets: ['📦 Livraisons projets', 'Projets prêts à être livrés.'],
        archives: ['📁 Archives', 'Anciens projets archivés.'],
        ventes: ['💰 Ventes', 'Suivi des ventes.'],
        devis_commerciaux: ['📋 Devis commerciaux', 'Suivi des devis.'],
        commandes_commerciales: ['📦 Commandes commerciales', 'Suivi des commandes.'],
        statistiques_commerciales: ['📊 Statistiques commerciales', 'Statistiques commerciales.'],
        objectifs: ['🎯 Objectifs', 'Objectifs de l’équipe commerciale.'],
        chiffre_affaires: ['📈 Chiffre d’affaires', 'Suivi du chiffre d’affaires.'],
        discussion_commerciale: ['💬 Discussion commerciale', 'Discussion privée de l’équipe commerciale.'],
        creations: ['🎨 Créations', 'Suivi des créations.'],
        logos: ['✨ Logos', 'Projets de logos.'],
        bannieres: ['🖼️ Bannières', 'Projets de bannières.'],
        miniatures: ['📺 Miniatures', 'Projets de miniatures.'],
        reseaux_sociaux: ['📱 Réseaux sociaux', 'Créations pour les réseaux sociaux.'],
        discussion_design: ['💬 Discussion Design', 'Discussion privée de l’équipe design.'],
        staff_chat: ['💬 Staff Chat', 'Discussion privée du staff.'],
        staff_annonces: ['📢 Staff Annonces', 'Annonces importantes du staff.'],
        recrutements: ['📝 Recrutements', 'Gestion des recrutements.'],
        sanctions: ['⚠️ Sanctions', 'Suivi des sanctions.'],
        reunions: ['🤝 Réunions', 'Organisation des réunions.'],
        direction: ['💼 Direction', 'Salon privé de la direction.'],
        finance: ['📈 Finance', 'Suivi financier interne.'],
        statistiques_globales: ['📊 Statistiques globales', 'Vue globale de l’activité.'],
        planning: ['📅 Planning', 'Organisation du planning.'],
        partenaires: ['🤝 Partenaires', 'Suivi des partenaires.'],
        contrats: ['📃 Contrats', 'Suivi des contrats.'],
        decisions: ['📝 Décisions', 'Journal des décisions importantes.'],
        documents: ['📂 Documents', 'Documents internes.'],
        fondation: ['💬 Fondation', 'Salon privé de la fondation.'],
        documents_confidentiels: ['📜 Documents confidentiels', 'Documents confidentiels.'],
        projets_secrets: ['📂 Projets secrets', 'Projets confidentiels.'],
        gestion_financiere: ['💰 Gestion financière', 'Informations financières confidentielles.'],
        acces_total: ['🔑 Accès total', 'Informations sensibles réservées à la fondation.'],
        journal_direction: ['📝 Journal de direction', 'Historique des décisions majeures.']
      };

      let installed = 0;

      for (const [key, [title, description]] of Object.entries(panelData)) {
        const channelId = config.channels[key];
        const channel = interaction.guild.channels.cache.get(channelId);

        if (!channel || !channel.isTextBased()) {
          continue;
        }

        await channel.send({
          embeds: [
            makeEmbed(title, description)
          ]
        });

        installed++;
      }

      return interaction.reply({
        content: `✅ Setup terminé. **${installed} panneaux** ont été installés dans les salons que tu as configurés.`,
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

client.login(process.env.TOKEN);
