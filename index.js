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

function ensureGuildConfig(guildId) {
  const data = loadConfig();

  if (!data.guilds[guildId]) {
    data.guilds[guildId] = {
      channels: {},
      categories: {},
      roles: {},
      panels: {}
    };
    saveConfig(data);
  }

  if (!data.guilds[guildId].panels) {
    data.guilds[guildId].panels = {};
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
      roles: {},
      panels: {}
    };
  }

  if (!data.guilds[guildId][section]) {
    data.guilds[guildId][section] = {};
  }

  data.guilds[guildId][section][key] = value;
  saveConfig(data);
}

function getGuildConfig(guildId) {
  return ensureGuildConfig(guildId);
}

function isAdmin(member) {
  return Boolean(
    member &&
    member.permissions &&
    member.permissions.has(PermissionFlagsBits.Administrator)
  );
}

function makeEmbed(title, description, color = 0x5865F2) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp()
    .setFooter({
      text: 'Creaty Bot'
    });
}

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

const PANEL_DEFINITIONS = {
  bienvenue: {
    title: '👋 Bienvenue',
    description:
      'Bienvenue sur **Creaty Bot**.\n\nChaque nouveau membre sera accueilli ici avec sa photo de profil, sa mention et le nombre total de membres du serveur.',
    color: 0x57F287
  },
  depart: {
    title: '👋 À bientôt',
    description:
      'Lorsqu’un membre quitte le serveur, Creaty Bot publiera automatiquement ici un message de départ avec sa photo de profil.',
    color: 0xED4245
  },
  reglement: {
    title: '📜 Règlement de Creaty Bot',
    description: RULES_TEXT,
    color: 0x57F287,
    component: 'rules'
  },
  annonces: {
    title: '📢 Annonces officielles',
    description:
      'Toutes les annonces importantes et informations officielles de Creaty Bot seront publiées dans ce salon par l’équipe.',
    color: 0x5865F2
  },
  info: {
    title: '📌 Informations',
    description:
      'Retrouve ici les informations essentielles concernant **Creaty Bot**, son fonctionnement, ses services, son organisation et les moyens de contacter l’équipe.',
    color: 0x3498DB
  },
  roadmap: {
    title: '🗺️ Roadmap',
    description:
      'Ce salon présente l’évolution de Creaty Bot : fonctionnalités prévues, développements en cours et nouveautés terminées.',
    color: 0x9B59B6
  },
  liens: {
    title: '🔗 Nos liens',
    description:
      'Tous les liens officiels de Creaty Bot seront regroupés ici. Utilise uniquement les liens publiés dans ce salon pour éviter les faux sites ou arnaques.',
    color: 0x3498DB
  },
  faq: {
    title: '❓ FAQ',
    description:
      'Retrouve ici les réponses aux questions fréquentes concernant les devis, commandes, paiements, délais, livraisons, garanties et support.',
    color: 0xF1C40F
  },
  sondages: {
    title: '📊 Sondages',
    description:
      'Les sondages concernant la communauté et l’évolution de Creaty Bot seront publiés ici.',
    color: 0x9B59B6
  },
  ticket: {
    title: '🎫 Support Creaty Bot',
    description:
      'Besoin d’aide ? Sélectionne le type de ticket correspondant à ta demande. Un salon privé sera créé pour toi et l’équipe.',
    color: 0x3498DB,
    component: 'ticket'
  },
  attente_vocale: {
    title: '🎙️ Attente vocale',
    description:
      'Cet espace est utilisé pour les demandes nécessitant une prise en charge vocale par un membre de l’équipe.',
    color: 0x95A5A6
  },
  discussion: {
    title: '💬 Discussion',
    description:
      'Salon principal de discussion de la communauté. Respecte le règlement et les autres membres.',
    color: 0x5865F2
  },
  media: {
    title: '📷 Médias',
    description:
      'Partage ici tes images, vidéos, captures d’écran et autres créations visuelles.',
    color: 0x3498DB
  },
  suggestion: {
    title: '💡 Suggestions',
    description:
      'Tu as une idée pour améliorer Creaty Bot ou le serveur ? Clique sur le bouton ci-dessous pour envoyer ta suggestion.',
    color: 0xF1C40F,
    component: 'suggestion'
  },
  vos_bots: {
    title: '🤖 Vos bots',
    description:
      'Présente ici les bots Discord que tu as créés ou les projets sur lesquels tu travailles.',
    color: 0x5865F2
  },
  presentation: {
    title: '👋 Présentations',
    description:
      'Présente-toi à la communauté : pseudo, centres d’intérêt, projets et ce que tu recherches sur Creaty Bot.',
    color: 0x57F287
  },
  evenements: {
    title: '🎉 Événements',
    description:
      'Les événements, animations et activités spéciales de la communauté seront annoncés ici.',
    color: 0xE91E63
  },
  creation_bot: {
    title: '🤖 Création de bot Discord',
    description:
      'Nous pouvons créer un bot Discord personnalisé selon ton projet : modération, tickets, économie, automatisation, commandes slash et bien plus.',
    color: 0x5865F2,
    component: 'service'
  },
  creation_serveur: {
    title: '💬 Création de serveur Discord',
    description:
      'Nous pouvons créer et organiser ton serveur Discord : catégories, salons, rôles, permissions, automatisations et structure complète.',
    color: 0x5865F2,
    component: 'service'
  },
  hebergement: {
    title: '🌐 Hébergement',
    description:
      'Découvre les solutions proposées pour maintenir ton bot ou ton projet en ligne de manière stable.',
    color: 0x3498DB,
    component: 'service'
  },
  tarifs: {
    title: '💰 Tarifs',
    description:
      'Les tarifs officiels des services Creaty Bot sont publiés ici. Pour un projet personnalisé, demande un devis.',
    color: 0xF1C40F,
    component: 'service'
  },
  garantie: {
    title: '📃 Garantie',
    description:
      'Retrouve ici les règles concernant les corrections de bugs, la maintenance, les modifications et le service après-vente.',
    color: 0x95A5A6
  },
  commander: {
    title: '📝 Commander',
    description:
      'Pour commander un service, commence par demander un devis. Une fois le devis accepté, ta commande sera enregistrée et suivie par l’équipe.',
    color: 0x5865F2,
    component: 'service'
  },
  demander_devis: {
    title: '💰 Demander un devis',
    description:
      'Présente ton projet à l’équipe pour recevoir une estimation personnalisée. Un membre du pôle commercial pourra ensuite étudier ta demande.',
    color: 0xF1C40F,
    component: 'service'
  },
  suivi_commandes: {
    title: '📦 Suivi des commandes',
    description:
      'Ce salon est dédié au suivi des commandes et à l’avancement des projets clients.',
    color: 0x3498DB
  },
  paiements: {
    title: '💳 Paiements',
    description:
      'Les paiements sont traités uniquement via les moyens officiels communiqués par l’équipe. Ne publie jamais d’informations bancaires sensibles dans un salon public.',
    color: 0x2ECC71
  },
  conditions: {
    title: '📜 Conditions de commande',
    description:
      'Les conditions applicables aux devis, commandes, paiements, délais, modifications, livraisons et garanties sont regroupées ici.',
    color: 0x95A5A6
  },
  questions_commandes: {
    title: '❓ Questions commandes',
    description:
      'Pour une question concernant un devis, une commande ou un paiement, ouvre un ticket afin d’obtenir une réponse privée de l’équipe.',
    color: 0xF1C40F,
    component: 'ticket'
  },
  offres_speciales: {
    title: '🎯 Offres spéciales',
    description:
      'Les promotions, offres temporaires et avantages spéciaux de Creaty Bot seront publiés ici.',
    color: 0xE91E63
  },
  infos_clients: {
    title: '📢 Informations clients',
    description:
      'Informations importantes destinées aux clients de Creaty Bot : maintenance, évolutions, délais et communications générales.',
    color: 0x5865F2
  },
  livraisons_clients: {
    title: '📂 Livraisons',
    description:
      'Les informations liées à la remise des projets terminés aux clients seront centralisées ici.',
    color: 0x2ECC71
  },
  factures: {
    title: '📜 Factures',
    description:
      'Espace consacré aux informations de facturation et aux justificatifs associés aux commandes.',
    color: 0x95A5A6
  },
  avis: {
    title: '⭐ Laisser un avis',
    description:
      'Une fois ton projet terminé, partage ton expérience avec Creaty Bot. Ton avis pourra être mis en avant après validation.',
    color: 0xF1C40F
  },
  support_premium: {
    title: '👑 Support prioritaire',
    description:
      'Espace de support réservé aux clients Premium. Les demandes déposées ici sont traitées en priorité.',
    color: 0xF1C40F,
    component: 'ticket'
  },
  commandes_premium: {
    title: '⚡ Commandes prioritaires',
    description:
      'Les clients Premium peuvent suivre ici les informations liées à leurs commandes prioritaires.',
    color: 0xF1C40F
  },
  avantages_premium: {
    title: '🎁 Avantages Premium',
    description:
      'Tous les avantages et bénéfices réservés aux clients Premium sont présentés ici.',
    color: 0xF1C40F
  },
  annonces_premium: {
    title: '📢 Annonces Premium',
    description:
      'Annonces et informations exclusivement destinées aux clients Premium.',
    color: 0xF1C40F
  },
  premium_chat: {
    title: '💬 Premium Chat',
    description:
      'Salon privé de discussion réservé aux clients Premium.',
    color: 0xF1C40F
  },
  annonces_dev: {
    title: '📢 Annonces développement',
    description:
      'Annonces internes destinées à l’équipe de développement.',
    color: 0x3498DB
  },
  discussion_dev: {
    title: '💬 Discussion développement',
    description:
      'Salon interne pour les échanges entre développeurs concernant les projets.',
    color: 0x3498DB
  },
  documentation: {
    title: '📚 Documentation',
    description:
      'Documentation technique, procédures internes et informations utiles au développement.',
    color: 0x3498DB
  },
  tests_dev: {
    title: '🧪 Tests développement',
    description:
      'Suivi des fonctionnalités en phase de test avant leur validation.',
    color: 0x9B59B6
  },
  bugs: {
    title: '🐞 Bugs',
    description:
      'Les bugs détectés sur les projets ou systèmes internes sont suivis dans ce salon.',
    color: 0xED4245
  },
  liste_projets: {
    title: '📋 Liste des projets',
    description:
      'Vue générale des projets clients actuellement suivis par l’équipe.',
    color: 0x5865F2
  },
  projets_attente: {
    title: '🟢 Projets en attente',
    description:
      'Projets enregistrés mais pas encore pris en charge.',
    color: 0x57F287
  },
  analyse: {
    title: '🟡 Projets en analyse',
    description:
      'Projets actuellement étudiés avant le début du développement.',
    color: 0xF1C40F
  },
  developpement: {
    title: '🔵 Projets en développement',
    description:
      'Projets actuellement en cours de création ou de développement.',
    color: 0x3498DB
  },
  tests_projets: {
    title: '🟣 Projets en tests',
    description:
      'Projets actuellement en phase de test et de validation.',
    color: 0x9B59B6
  },
  corrections: {
    title: '🟠 Projets en corrections',
    description:
      'Projets nécessitant des corrections ou ajustements avant la livraison.',
    color: 0xE67E22
  },
  termines: {
    title: '✅ Projets terminés',
    description:
      'Projets dont le développement est terminé.',
    color: 0x57F287
  },
  livraisons_projets: {
    title: '📦 Livraisons projets',
    description:
      'Projets prêts à être remis à leurs clients.',
    color: 0x2ECC71
  },
  archives: {
    title: '📁 Archives projets',
    description:
      'Anciens projets terminés et archivés.',
    color: 0x95A5A6
  },
  ventes: {
    title: '💰 Ventes',
    description:
      'Suivi interne des ventes réalisées par l’équipe commerciale.',
    color: 0xF1C40F
  },
  devis_commerciaux: {
    title: '📋 Devis commerciaux',
    description:
      'Suivi interne des demandes de devis.',
    color: 0xF1C40F
  },
  commandes_commerciales: {
    title: '📦 Commandes commerciales',
    description:
      'Suivi interne des commandes clients.',
    color: 0x3498DB
  },
  statistiques_commerciales: {
    title: '📊 Statistiques commerciales',
    description:
      'Statistiques internes concernant les devis, ventes et commandes.',
    color: 0x9B59B6
  },
  objectifs: {
    title: '🎯 Objectifs commerciaux',
    description:
      'Objectifs et priorités de l’équipe commerciale.',
    color: 0xE91E63
  },
  chiffre_affaires: {
    title: '📈 Chiffre d’affaires',
    description:
      'Suivi interne du chiffre d’affaires enregistré par Creaty Bot.',
    color: 0x2ECC71
  },
  discussion_commerciale: {
    title: '💬 Discussion commerciale',
    description:
      'Salon privé réservé aux échanges de l’équipe commerciale.',
    color: 0xF1C40F
  },
  creations: {
    title: '🎨 Créations',
    description:
      'Suivi général des travaux et créations graphiques.',
    color: 0x9B59B6
  },
  logos: {
    title: '✨ Logos',
    description:
      'Espace consacré aux projets et créations de logos.',
    color: 0x9B59B6
  },
  bannieres: {
    title: '🖼️ Bannières',
    description:
      'Espace consacré aux projets et créations de bannières.',
    color: 0x9B59B6
  },
  miniatures: {
    title: '📺 Miniatures',
    description:
      'Espace consacré aux projets de miniatures et visuels.',
    color: 0x9B59B6
  },
  reseaux_sociaux: {
    title: '📱 Réseaux sociaux',
    description:
      'Créations destinées aux réseaux sociaux et contenus numériques.',
    color: 0x9B59B6
  },
  discussion_design: {
    title: '💬 Discussion Design',
    description:
      'Salon privé de discussion de l’équipe design.',
    color: 0x9B59B6
  },
  staff_chat: {
    title: '💬 Staff Chat',
    description:
      'Salon privé de discussion du personnel Creaty Bot.',
    color: 0xED4245
  },
  staff_annonces: {
    title: '📢 Annonces staff',
    description:
      'Annonces et informations importantes destinées au personnel.',
    color: 0xED4245
  },
  recrutements: {
    title: '📝 Recrutements',
    description:
      'Gestion des candidatures et recrutements de nouveaux membres du personnel.',
    color: 0xED4245
  },
  sanctions: {
    title: '⚠️ Sanctions',
    description:
      'Suivi interne des avertissements et sanctions.',
    color: 0xE67E22
  },
  reunions: {
    title: '🤝 Réunions',
    description:
      'Organisation des réunions et informations destinées aux participants.',
    color: 0xED4245
  },
  direction: {
    title: '💼 Direction',
    description:
      'Salon privé réservé aux membres de la direction.',
    color: 0xE67E22
  },
  finance: {
    title: '📈 Finance',
    description:
      'Suivi financier interne de Creaty Bot.',
    color: 0x2ECC71
  },
  statistiques_globales: {
    title: '📊 Statistiques globales',
    description:
      'Vue globale de l’activité de Creaty Bot.',
    color: 0x9B59B6
  },
  planning: {
    title: '📅 Planning',
    description:
      'Organisation des tâches, échéances et priorités de la direction.',
    color: 0x3498DB
  },
  partenaires: {
    title: '🤝 Partenaires',
    description:
      'Suivi des partenaires et collaborations officielles de Creaty Bot.',
    color: 0x5865F2
  },
  contrats: {
    title: '📃 Contrats',
    description:
      'Suivi interne des contrats, accords et documents associés.',
    color: 0x95A5A6
  },
  decisions: {
    title: '📝 Décisions',
    description:
      'Journal des décisions importantes prises par la direction.',
    color: 0xE67E22
  },
  documents: {
    title: '📂 Documents',
    description:
      'Documents et informations internes réservés à la direction.',
    color: 0x95A5A6
  },
  fondation: {
    title: '💬 Fondation',
    description:
      'Salon privé réservé à la fondation de Creaty Bot.',
    color: 0xED4245
  },
  documents_confidentiels: {
    title: '📜 Documents confidentiels',
    description:
      'Documents confidentiels accessibles uniquement aux personnes autorisées.',
    color: 0xED4245
  },
  projets_secrets: {
    title: '📂 Projets secrets',
    description:
      'Espace réservé aux projets confidentiels ou non annoncés.',
    color: 0xED4245
  },
  gestion_financiere: {
    title: '💰 Gestion financière',
    description:
      'Informations financières confidentielles réservées à la fondation.',
    color: 0xED4245
  },
  acces_total: {
    title: '🔑 Accès total',
    description:
      'Espace réservé aux informations les plus sensibles de Creaty Bot.',
    color: 0xED4245
  },
  journal_direction: {
    title: '📝 Journal de direction',
    description:
      'Historique des décisions majeures et informations importantes de la direction.',
    color: 0xED4245
  }
};

function buildComponents(type) {
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

    return [
      new ActionRowBuilder().addComponents(menu)
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
    ];
  }

  return [];
}

async function installOrUpdatePanel(guild, key) {
  const config = getGuildConfig(guild.id);
  const channelId = config.channels[key];
  const definition = PANEL_DEFINITIONS[key];

  if (!channelId || !definition) {
    return {
      success: false,
      reason: 'Aucun panneau prévu ou salon non configuré.'
    };
  }

  const channel = guild.channels.cache.get(channelId);

  if (!channel || !channel.isTextBased()) {
    return {
      success: false,
      reason: 'Le salon configuré est introuvable ou incompatible.'
    };
  }

  const payload = {
    embeds: [
      makeEmbed(
        definition.title,
        definition.description,
        definition.color
      )
    ],
    components: buildComponents(definition.component)
  };

  const existingMessageId = config.panels?.[key];

  if (existingMessageId) {
    try {
      const oldMessage = await channel.messages.fetch(existingMessageId);
      await oldMessage.edit(payload);

      return {
        success: true,
        action: 'updated',
        channel
      };
    } catch {
      // Le message n'existe plus : on en recrée un.
    }
  }

  const message = await channel.send(payload);

  updateGuildConfig(
    guild.id,
    'panels',
    key,
    message.id
  );

  return {
    success: true,
    action: 'created',
    channel
  };
}

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
    .setDescription('Vérifie et réinstalle tous les panneaux configurés.')
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
    try {
      await guild.commands.set(commands);
      console.log(`✅ Commandes slash installées sur ${guild.name}`);
    } catch (error) {
      console.error('❌ Erreur commandes slash :', error);
    }
  }
});

client.on(Events.GuildMemberAdd, async member => {
  const config = getGuildConfig(member.guild.id);

  const newRoleId = config.roles.nouveau;

  if (newRoleId) {
    await member.roles.add(newRoleId).catch(() => {});
  }

  const welcomeChannelId = config.channels.bienvenue;

  if (!welcomeChannelId) return;

  const channel = member.guild.channels.cache.get(welcomeChannelId);

  if (!channel || !channel.isTextBased()) return;

  const welcome = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle(`👋 Bienvenue ${member.user.username} !`)
    .setDescription(
      `Bienvenue ${member} sur **${member.guild.name}** !\n\n` +
      `Tu es notre **${member.guild.memberCount}e membre**.\n` +
      `Nous sommes heureux de t’accueillir parmi nous.\n\n` +
      `Pense à lire le règlement afin de profiter pleinement du serveur.`
    )
    .setThumbnail(
      member.user.displayAvatarURL({
        size: 256
      })
    )
    .setAuthor({
      name: member.user.tag,
      iconURL: member.user.displayAvatarURL({
        size: 128
      })
    })
    .setTimestamp();

  await channel.send({
    embeds: [welcome]
  }).catch(() => {});
});

client.on(Events.GuildMemberRemove, async member => {
  const config = getGuildConfig(member.guild.id);
  const channelId = config.channels.depart;

  if (!channelId) return;

  const channel = member.guild.channels.cache.get(channelId);

  if (!channel || !channel.isTextBased()) return;

  const goodbye = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle(`👋 À bientôt ${member.user.username}`)
    .setDescription(
      `**${member.user.tag}** vient de quitter **${member.guild.name}**.\n\n` +
      `Nous sommes maintenant **${member.guild.memberCount} membres**.`
    )
    .setThumbnail(
      member.user.displayAvatarURL({
        size: 256
      })
    )
    .setTimestamp();

  await channel.send({
    embeds: [goodbye]
  }).catch(() => {});
});

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isAutocomplete()) {
      if (interaction.commandName !== 'config') return;

      const sub = interaction.options.getSubcommand();
      const focused = interaction.options.getFocused().toLowerCase();

      const source =
        sub === 'salon'
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
        .filter(item =>
          item.name.toLowerCase().includes(focused)
        )
        .slice(0, 25);

      return interaction.respond(results);
    }

    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'config') {
        if (!isAdmin(interaction.member)) {
          return interaction.reply({
            content:
              '❌ Cette commande est réservée aux administrateurs.',
            flags:
              MessageFlags.Ephemeral
          });
        }

        const sub =
          interaction.options.getSubcommand();

        if (sub === 'salon') {
          const rawType =
            interaction.options.getString('type');

          const target =
            interaction.options.getChannel('cible');

          const [sectionType, key] =
            rawType.split(':');

          if (
            !['channel', 'category'].includes(sectionType)
          ) {
            return interaction.reply({
              content:
                '❌ Type de configuration invalide.',
              flags:
                MessageFlags.Ephemeral
            });
          }

          if (
            sectionType === 'category' &&
            target.type !== ChannelType.GuildCategory
          ) {
            return interaction.reply({
              content:
                '❌ Tu dois sélectionner une catégorie Discord.',
              flags:
                MessageFlags.Ephemeral
            });
          }

          if (
            sectionType === 'channel' &&
            target.type === ChannelType.GuildCategory
          ) {
            return interaction.reply({
              content:
                '❌ Tu dois sélectionner un salon, pas une catégorie.',
              flags:
                MessageFlags.Ephemeral
            });
          }

          updateGuildConfig(
            interaction.guild.id,
            sectionType === 'channel'
              ? 'channels'
              : 'categories',
            key,
            target.id
          );

          if (sectionType === 'channel') {
            const result =
              await installOrUpdatePanel(
                interaction.guild,
                key
              );

            if (result.success) {
              return interaction.reply({
                content:
                  `✅ **${key}** a été configuré sur ${target}.\n` +
                  `Le panneau a été ${result.action === 'created' ? 'installé immédiatement' : 'mis à jour immédiatement'}.`,
                flags:
                  MessageFlags.Ephemeral
              });
            }
          }

          return interaction.reply({
            content:
              `✅ Configuration enregistrée : **${key}** → ${target}`,
            flags:
              MessageFlags.Ephemeral
          });
        }

        if (sub === 'role') {
          const key =
            interaction.options.getString('type');

          const role =
            interaction.options.getRole('role');

          updateGuildConfig(
            interaction.guild.id,
            'roles',
            key,
            role.id
          );

          return interaction.reply({
            content:
              `✅ Rôle configuré : **${key}** → ${role}`,
            flags:
              MessageFlags.Ephemeral
          });
        }

        if (sub === 'voir') {
          const config =
            getGuildConfig(
              interaction.guild.id
            );

          const channelLines =
            Object.entries(config.channels)
              .map(
                ([key, id]) =>
                  `• ${key} → <#${id}>`
              );

          const categoryLines =
            Object.entries(config.categories)
              .map(
                ([key, id]) =>
                  `• ${key} → <#${id}>`
              );

          const roleLines =
            Object.entries(config.roles)
              .map(
                ([key, id]) =>
                  `• ${key} → <@&${id}>`
              );

          return interaction.reply({
            embeds: [
              makeEmbed(
                '⚙️ Configuration Creaty Bot',
                [
                  '**Salons**',
                  channelLines.length
                    ? channelLines.join('\n')
                    : 'Aucun salon configuré.',
                  '',
                  '**Catégories**',
                  categoryLines.length
                    ? categoryLines.join('\n')
                    : 'Aucune catégorie configurée.',
                  '',
                  '**Rôles**',
                  roleLines.length
                    ? roleLines.join('\n')
                    : 'Aucun rôle configuré.'
                ].join('\n')
              )
            ],
            flags:
              MessageFlags.Ephemeral
          });
        }
      }

      if (interaction.commandName === 'setup') {
        if (!isAdmin(interaction.member)) {
          return interaction.reply({
            content:
              '❌ Cette commande est réservée aux administrateurs.',
            flags:
              MessageFlags.Ephemeral
          });
        }

        await interaction.deferReply({
          flags:
            MessageFlags.Ephemeral
        });

        const config =
          getGuildConfig(
            interaction.guild.id
          );

        const configuredKeys =
          Object.keys(config.channels);

        let success = 0;
        let failed = 0;

        for (
          const key of configuredKeys
        ) {
          if (!PANEL_DEFINITIONS[key]) {
            continue;
          }

          const result =
            await installOrUpdatePanel(
              interaction.guild,
              key
            );

          if (result.success) {
            success++;
          } else {
            failed++;
          }
        }

        return interaction.editReply(
          `✅ Vérification terminée.\n` +
          `• Panneaux installés ou mis à jour : **${success}**\n` +
          `• Échecs : **${failed}**`
        );
      }
    }

    if (
      interaction.isButton() &&
      interaction.customId === 'accept_rules'
    ) {
      const config =
        getGuildConfig(
          interaction.guild.id
        );

      const memberRoleId =
        config.roles.membre;

      const newRoleId =
        config.roles.nouveau;

      if (!memberRoleId) {
        return interaction.reply({
          content:
            '❌ Le rôle Membre n’a pas encore été configuré.',
          flags:
            MessageFlags.Ephemeral
        });
      }

      await interaction.member.roles
        .add(memberRoleId)
        .catch(() => {});

      if (newRoleId) {
        await interaction.member.roles
          .remove(newRoleId)
          .catch(() => {});
      }

      return interaction.reply({
        content:
          '✅ Tu as accepté le règlement. Bienvenue sur Creaty Bot !',
        flags:
          MessageFlags.Ephemeral
      });
    }

    if (
      interaction.isButton() &&
      interaction.customId === 'new_suggestion'
    ) {
      const modal =
        new ModalBuilder()
          .setCustomId('suggestion_modal')
          .setTitle('Nouvelle suggestion');

      const input =
        new TextInputBuilder()
          .setCustomId('suggestion_text')
          .setLabel('Ta suggestion')
          .setStyle(
            TextInputStyle.Paragraph
          )
          .setRequired(true)
          .setMaxLength(1000);

      modal.addComponents(
        new ActionRowBuilder()
          .addComponents(input)
      );

      return interaction.showModal(modal);
    }

    if (
      interaction.isModalSubmit() &&
      interaction.customId === 'suggestion_modal'
    ) {
      const config =
        getGuildConfig(
          interaction.guild.id
        );

      const channelId =
        config.channels.suggestion;

      const channel =
        interaction.guild.channels.cache.get(
          channelId
        );

      const text =
        interaction.fields
          .getTextInputValue(
            'suggestion_text'
          );

      if (
        channel &&
        channel.isTextBased()
      ) {
        await channel.send({
          embeds: [
            makeEmbed(
              `💡 Suggestion de ${interaction.user.username}`,
              text,
              0xF1C40F
            )
          ]
        });
      }

      return interaction.reply({
        content:
          '✅ Ta suggestion a été envoyée.',
        flags:
          MessageFlags.Ephemeral
      });
    }

    if (
      interaction.isButton() &&
      interaction.customId === 'service_devis'
    ) {
      return interaction.reply({
        content:
          '💰 Pour demander un devis, ouvre un ticket de type **Devis**.',
        flags:
          MessageFlags.Ephemeral
      });
    }

    if (
      interaction.isButton() &&
      interaction.customId === 'service_commander'
    ) {
      return interaction.reply({
        content:
          '📝 Pour commander, commence par ouvrir un ticket de type **Commande** ou **Devis**.',
        flags:
          MessageFlags.Ephemeral
      });
    }

    if (
      interaction.isButton() &&
      interaction.customId === 'service_question'
    ) {
      return interaction.reply({
        content:
          '❓ Pour poser une question, ouvre un ticket de type **Support**.',
        flags:
          MessageFlags.Ephemeral
      });
    }

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === 'ticket_type'
    ) {
      const config =
        getGuildConfig(
          interaction.guild.id
        );

      const categoryId =
        config.categories.tickets ||
        config.categories.support;

      if (!categoryId) {
        return interaction.reply({
          content:
            '❌ Aucune catégorie Tickets ou Support n’a encore été configurée.',
          flags:
            MessageFlags.Ephemeral
        });
      }

      const type =
        interaction.values[0];

      const staffRoleId =
        config.roles.staff;

      const permissions = [
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

      if (staffRoleId) {
        permissions.push({
          id:
            staffRoleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ]
        });
      }

      const ticketChannel =
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
            categoryId,
          permissionOverwrites:
            permissions
        });

      await ticketChannel.send({
        content:
          `${interaction.user}`,
        embeds: [
          makeEmbed(
            `🎫 Ticket ${type}`,
            `Bonjour ${interaction.user}.\n\nExplique ta demande le plus précisément possible. Un membre de l’équipe te répondra dès que possible.`
          )
        ]
      });

      return interaction.reply({
        content:
          `✅ Ton ticket a été créé : ${ticketChannel}`,
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
});

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
