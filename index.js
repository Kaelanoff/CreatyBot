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

const ORDER_STAGES = [
  'Commande reçue',
  'Initialisation',
  'Analyse du projet',
  'Préparation',
  'Création',
  'Développement',
  'Configuration',
  'Tests internes',
  'Période de test',
  'Corrections',
  'Finalisation',
  'Prêt à livrer',
  'Livré',
  'Terminé'
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
  ['journal_direction', 'Journal de direction'],
  ['logs', 'Logs internes']
];

const CATEGORY_KEYS = [
  ['support', 'Catégorie Support'],
  ['tickets', 'Catégorie Tickets'],
  ['devis_prives', 'Catégorie Devis privés'],
  ['commandes_privees', 'Catégorie Commandes privées'],
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
      'Bienvenue sur **Creaty Bot**.\n\nChaque nouveau membre sera accueilli ici automatiquement avec sa photo de profil, sa mention et le nombre total de membres du serveur.',
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
      'Retrouve ici les informations essentielles concernant **Creaty Bot**, son fonctionnement, ses services et son organisation.',
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
      'Tous les liens officiels de Creaty Bot seront regroupés ici. Utilise uniquement les liens publiés dans ce salon.',
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
    component: 'quote_request'
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
      'Pour commander un service, commence par demander un devis. Une fois le devis accepté, une commande privée sera créée pour l’équipe et tu pourras suivre son avancement ici.',
    color: 0x5865F2,
    component: 'quote_request'
  },
  demander_devis: {
    title: '💰 Demander un devis',
    description:
      'Présente ton projet à l’équipe pour recevoir une estimation personnalisée. Clique sur le bouton ci-dessous pour envoyer ta demande.',
    color: 0xF1C40F,
    component: 'quote_request'
  },
  suivi_commandes: {
    title: '📦 Suivi de commande',
    description:
      'Clique sur **Voir mes commandes** pour consulter uniquement tes propres commandes. La réponse sera privée et visible uniquement par toi.',
    color: 0x3498DB,
    component: 'tracking'
  },
  paiements: {
    title: '💳 Paiements',
    description:
      'Une fois ta commande créée, clique sur **Déclarer un paiement**. Le personnel vérifiera ensuite la déclaration avant de lancer le projet.',
    color: 0x2ECC71,
    component: 'payment'
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
      'Les nouveaux devis créés apparaîtront ici avec leur numéro. Chaque devis possède également un espace privé réservé au personnel.',
    color: 0xF1C40F
  },
  commandes_commerciales: {
    title: '📦 Commandes commerciales',
    description:
      'Les commandes créées à partir des devis acceptés seront suivies ici. Les détails internes restent réservés au personnel.',
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

function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(
      CONFIG_FILE,
      JSON.stringify({ guilds: {} }, null, 2)
    );
  }

  if (!fs.existsSync(OPS_FILE)) {
    fs.writeFileSync(
      OPS_FILE,
      JSON.stringify(
        {
          counters: {
            tickets: 0,
            quotes: 0,
            orders: 0,
            payments: 0
          },
          tickets: {},
          quotes: {},
          orders: {},
          payments: {}
        },
        null,
        2
      )
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

function getGuildConfig(guildId) {
  const data = loadJson(CONFIG_FILE);

  if (!data.guilds[guildId]) {
    data.guilds[guildId] = {
      channels: {},
      categories: {},
      roles: {},
      panels: {}
    };
    saveJson(CONFIG_FILE, data);
  }

  const cfg = data.guilds[guildId];
  if (!cfg.channels) cfg.channels = {};
  if (!cfg.categories) cfg.categories = {};
  if (!cfg.roles) cfg.roles = {};
  if (!cfg.panels) cfg.panels = {};

  saveJson(CONFIG_FILE, data);
  return cfg;
}

function updateGuildConfig(guildId, section, key, value) {
  const data = loadJson(CONFIG_FILE);

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
  saveJson(CONFIG_FILE, data);
}

function nextId(type, prefix) {
  const data = loadJson(OPS_FILE);
  data.counters[type] = (data.counters[type] || 0) + 1;
  const id = `${prefix}-${String(data.counters[type]).padStart(4, '0')}`;
  saveJson(OPS_FILE, data);
  return id;
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

  const staffRoleIds = [
    config.roles.staff,
    config.roles.commercial,
    config.roles.developpeur,
    config.roles.moderateur,
    config.roles.administrateur,
    config.roles.directeur,
    config.roles.cofondateur,
    config.roles.fondateur
  ].filter(Boolean);

  return member.roles.cache.some(role => staffRoleIds.includes(role.id));
}

function makeEmbed(title, description, color = 0x5865F2) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: 'Creaty Bot' });
}

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
          .setCustomId('quote_request')
          .setLabel('Demander un devis')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('ticket_order')
          .setLabel('Commander')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('ticket_support')
          .setLabel('Poser une question')
          .setStyle(ButtonStyle.Secondary)
      )
    ];
  }

  if (type === 'quote_request') {
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

  if (type === 'tracking') {
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('my_orders')
          .setLabel('Voir mes commandes')
          .setEmoji('📦')
          .setStyle(ButtonStyle.Primary)
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
  const definition = PANEL_DEFINITIONS[key];

  if (!channelId || !definition) {
    return { success: false };
  }

  const channel = guild.channels.cache.get(channelId);

  if (!channel || !channel.isTextBased()) {
    return { success: false };
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

  const existingMessageId = config.panels[key];

  if (existingMessageId) {
    try {
      const oldMessage = await channel.messages.fetch(existingMessageId);
      await oldMessage.edit(payload);
      return { success: true, action: 'updated' };
    } catch {}
  }

  const message = await channel.send(payload);
  updateGuildConfig(guild.id, 'panels', key, message.id);

  return { success: true, action: 'created' };
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

async function createStaffPrivateChannel(guild, config, categoryKey, name) {
  const categoryId =
    config.categories[categoryKey] ||
    config.categories.staff ||
    config.categories.projets_clients;

  return guild.channels.create({
    name: name.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90),
    type: ChannelType.GuildText,
    parent: categoryId || undefined,
    permissionOverwrites: getStaffOverwrites(guild, config)
  });
}

function ticketStaffRows(ticketId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_claim:${ticketId}`)
        .setLabel('Prendre le ticket')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`ticket_quote:${ticketId}`)
        .setLabel('Créer un devis')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`ticket_close:${ticketId}`)
        .setLabel('Fermer le ticket')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

function quoteStaffRows(quoteId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quote_claim:${quoteId}`)
        .setLabel('Prendre ce devis')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`quote_price:${quoteId}`)
        .setLabel('Modifier le prix')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`quote_to_order:${quoteId}`)
        .setLabel('Transformer en commande')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`quote_contact:${quoteId}`)
        .setLabel('Contacter le client')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`quote_close:${quoteId}`)
        .setLabel('Fermer le devis')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

function orderStaffRows(orderId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`order_claim:${orderId}`)
        .setLabel('Prendre la commande')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`order_prev:${orderId}`)
        .setLabel('Étape précédente')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`order_next:${orderId}`)
        .setLabel('Étape suivante')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`order_contact:${orderId}`)
        .setLabel('Contacter le client')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`order_close:${orderId}`)
        .setLabel('Clôturer')
        .setStyle(ButtonStyle.Danger)
    ),
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`order_stage:${orderId}`)
        .setPlaceholder('Choisir directement une étape')
        .addOptions(
          ORDER_STAGES.map((stage, index) => ({
            label: stage,
            value: String(index)
          }))
        )
    )
  ];
}

function orderProgress(stageIndex) {
  const total = ORDER_STAGES.length;
  const pct = Math.round(((stageIndex + 1) / total) * 100);
  const blocks = 10;
  const filled = Math.round((pct / 100) * blocks);
  return `${'█'.repeat(filled)}${'░'.repeat(blocks - filled)} ${pct}%`;
}

function quoteEmbed(quote) {
  return makeEmbed(
    `💰 ${quote.id} — ${quote.projectName}`,
    [
      `**Client :** <@${quote.userId}>`,
      `**Type :** ${quote.service}`,
      `**Prix :** ${quote.price !== null ? `${quote.price} €` : 'À définir'}`,
      `**Statut :** ${quote.status}`,
      `**Responsable :** ${quote.claimedBy ? `<@${quote.claimedBy}>` : 'Non pris'}`,
      '',
      '**Description :**',
      quote.description
    ].join('\n'),
    0xF1C40F
  );
}

function orderEmbed(order) {
  const stage = ORDER_STAGES[order.stageIndex] || ORDER_STAGES[0];

  return makeEmbed(
    `📦 ${order.id} — ${order.projectName}`,
    [
      `**Client :** <@${order.userId}>`,
      `**Service :** ${order.service}`,
      `**Devis lié :** ${order.quoteId || 'Aucun'}`,
      `**Prix :** ${order.price !== null ? `${order.price} €` : 'Non défini'}`,
      `**Paiement :** ${order.paymentStatus}`,
      `**Étape :** ${stage}`,
      `**Progression :** ${orderProgress(order.stageIndex)}`,
      `**Responsable :** ${order.claimedBy ? `<@${order.claimedBy}>` : 'Non pris'}`,
      `**Statut interne :** ${order.status}`
    ].join('\n'),
    0x3498DB
  );
}

async function refreshQuoteMessage(guild, quote) {
  if (!quote.channelId || !quote.messageId) return;

  try {
    const channel = await guild.channels.fetch(quote.channelId);
    const message = await channel.messages.fetch(quote.messageId);
    await message.edit({
      embeds: [quoteEmbed(quote)],
      components: quote.status === 'Fermé' ? [] : quoteStaffRows(quote.id)
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
      components: order.status === 'Clôturée' ? [] : orderStaffRows(order.id)
    });
  } catch {}
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

async function createQuote(guild, userId, projectName, service, description, price = null, sourceTicketId = null) {
  const config = getGuildConfig(guild.id);
  const ops = loadJson(OPS_FILE);
  const quoteId = nextId('quotes', 'DEV');

  const quote = {
    id: quoteId,
    guildId: guild.id,
    userId,
    projectName,
    service,
    description,
    price,
    status: 'En attente',
    claimedBy: null,
    sourceTicketId,
    channelId: null,
    messageId: null,
    orderId: null,
    createdAt: new Date().toISOString()
  };

  const channel = await createStaffPrivateChannel(
    guild,
    config,
    'devis_prives',
    `devis-${quoteId.toLowerCase()}`
  );

  const message = await channel.send({
    embeds: [quoteEmbed(quote)],
    components: quoteStaffRows(quoteId)
  });

  quote.channelId = channel.id;
  quote.messageId = message.id;

  const latest = loadJson(OPS_FILE);
  latest.quotes[quoteId] = quote;
  saveJson(OPS_FILE, latest);

  const summaryChannelId = config.channels.devis_commerciaux;
  const summaryChannel = guild.channels.cache.get(summaryChannelId);

  if (summaryChannel && summaryChannel.isTextBased()) {
    await summaryChannel.send({
      embeds: [
        makeEmbed(
          `📋 Nouveau devis ${quoteId}`,
          `Client : <@${userId}>\nProjet : **${projectName}**\nService : **${service}**\nStatut : **En attente**`
        )
      ]
    }).catch(() => {});
  }

  await dmUser(userId, {
    embeds: [
      makeEmbed(
        `💰 Demande de devis reçue — ${quoteId}`,
        `Nous avons bien reçu ta demande pour **${projectName}**.\n\nL’équipe va étudier ton projet. Tu recevras une mise à jour lorsque le prix sera défini.`,
        0xF1C40F
      )
    ]
  });

  return quote;
}

async function createOrderFromQuote(guild, quote) {
  const config = getGuildConfig(guild.id);
  const orderId = nextId('orders', 'CMD');

  const order = {
    id: orderId,
    guildId: guild.id,
    userId: quote.userId,
    quoteId: quote.id,
    projectName: quote.projectName,
    service: quote.service,
    description: quote.description,
    price: quote.price,
    paymentStatus: 'En attente',
    stageIndex: 0,
    claimedBy: null,
    status: 'Active',
    channelId: null,
    messageId: null,
    createdAt: new Date().toISOString()
  };

  const channel = await createStaffPrivateChannel(
    guild,
    config,
    'commandes_privees',
    `commande-${orderId.toLowerCase()}`
  );

  const message = await channel.send({
    embeds: [orderEmbed(order)],
    components: orderStaffRows(orderId)
  });

  order.channelId = channel.id;
  order.messageId = message.id;

  const ops = loadJson(OPS_FILE);
  ops.orders[orderId] = order;

  if (ops.quotes[quote.id]) {
    ops.quotes[quote.id].status = 'Transformé en commande';
    ops.quotes[quote.id].orderId = orderId;
  }

  saveJson(OPS_FILE, ops);

  const summaryChannelId = config.channels.commandes_commerciales;
  const summaryChannel = guild.channels.cache.get(summaryChannelId);

  if (summaryChannel && summaryChannel.isTextBased()) {
    await summaryChannel.send({
      embeds: [
        makeEmbed(
          `📦 Nouvelle commande ${orderId}`,
          `Client : <@${order.userId}>\nProjet : **${order.projectName}**\nDevis : **${order.quoteId}**\nÉtape : **${ORDER_STAGES[0]}**`
        )
      ]
    }).catch(() => {});
  }

  await dmUser(order.userId, {
    embeds: [
      makeEmbed(
        `📦 Commande créée — ${orderId}`,
        `Ta commande pour **${order.projectName}** a été créée.\n\nTu peux suivre son avancement depuis le salon de suivi des commandes avec le bouton **Voir mes commandes**.`,
        0x3498DB
      )
    ]
  });

  return order;
}

async function sendMyOrders(interaction) {
  const ops = loadJson(OPS_FILE);

  const orders = Object.values(ops.orders)
    .filter(order =>
      order.guildId === interaction.guild.id &&
      order.userId === interaction.user.id
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!orders.length) {
    return interaction.reply({
      content: '📦 Tu n’as actuellement aucune commande enregistrée.',
      flags: MessageFlags.Ephemeral
    });
  }

  const description = orders
    .slice(0, 10)
    .map(order => {
      const stage = ORDER_STAGES[order.stageIndex] || ORDER_STAGES[0];
      return [
        `**${order.id} — ${order.projectName}**`,
        `Étape : ${stage}`,
        `Progression : ${orderProgress(order.stageIndex)}`,
        `Paiement : ${order.paymentStatus}`,
        `Statut : ${order.status}`
      ].join('\n');
    })
    .join('\n\n');

  return interaction.reply({
    embeds: [
      makeEmbed(
        '📦 Mes commandes',
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
    .setDescription('Vérifie et réinstalle tous les panneaux configurés.'),

  new SlashCommandBuilder()
    .setName('suivi')
    .setDescription('Affiche tes commandes privées.')
].map(command => command.toJSON());

client.once(Events.ClientReady, async readyClient => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ CREATY BOT CONNECTÉ');
  console.log(`🤖 Nom : ${readyClient.user.tag}`);
  console.log(`🆔 ID : ${readyClient.user.id}`);
  console.log(`🌐 Serveurs : ${readyClient.guilds.cache.size}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  ensureFiles();

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

  if (config.roles.nouveau) {
    await member.roles.add(config.roles.nouveau).catch(() => {});
  }

  const channel = member.guild.channels.cache.get(config.channels.bienvenue);
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
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setAuthor({
      name: member.user.tag,
      iconURL: member.user.displayAvatarURL({ size: 128 })
    })
    .setTimestamp();

  await channel.send({ embeds: [welcome] }).catch(() => {});
});

client.on(Events.GuildMemberRemove, async member => {
  const config = getGuildConfig(member.guild.id);
  const channel = member.guild.channels.cache.get(config.channels.depart);

  if (!channel || !channel.isTextBased()) return;

  const goodbye = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle(`👋 À bientôt ${member.user.username}`)
    .setDescription(
      `**${member.user.tag}** vient de quitter **${member.guild.name}**.\n\n` +
      `Nous sommes maintenant **${member.guild.memberCount} membres**.`
    )
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setTimestamp();

  await channel.send({ embeds: [goodbye] }).catch(() => {});
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

      return interaction.respond(
        source
          .filter(item => item.name.toLowerCase().includes(focused))
          .slice(0, 25)
      );
    }

    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'suivi') {
        return sendMyOrders(interaction);
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
              content: '❌ Type de configuration invalide.',
              flags: MessageFlags.Ephemeral
            });
          }

          if (
            sectionType === 'category' &&
            target.type !== ChannelType.GuildCategory
          ) {
            return interaction.reply({
              content: '❌ Tu dois sélectionner une catégorie Discord.',
              flags: MessageFlags.Ephemeral
            });
          }

          if (
            sectionType === 'channel' &&
            target.type === ChannelType.GuildCategory
          ) {
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
                  ? `Le panneau a été ${result.action === 'created' ? 'installé immédiatement' : 'mis à jour immédiatement'}.`
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
          ].join('\n').slice(0, 3900);

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
        if (!isAdmin(interaction.member)) {
          return interaction.reply({
            content: '❌ Cette commande est réservée aux administrateurs.',
            flags: MessageFlags.Ephemeral
          });
        }

        await interaction.deferReply({
          flags: MessageFlags.Ephemeral
        });

        const config = getGuildConfig(interaction.guild.id);
        let success = 0;
        let failed = 0;

        for (const key of Object.keys(config.channels)) {
          if (!PANEL_DEFINITIONS[key]) continue;

          const result = await installOrUpdatePanel(interaction.guild, key);

          if (result.success) success++;
          else failed++;
        }

        return interaction.editReply(
          `✅ Vérification terminée.\n` +
          `• Panneaux installés ou mis à jour : **${success}**\n` +
          `• Échecs : **${failed}**\n\n` +
          `Les configurations existantes ont été conservées.`
        );
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === 'accept_rules') {
        const config = getGuildConfig(interaction.guild.id);

        if (!config.roles.membre) {
          return interaction.reply({
            content: '❌ Le rôle Membre n’a pas encore été configuré.',
            flags: MessageFlags.Ephemeral
          });
        }

        await interaction.member.roles.add(config.roles.membre).catch(() => {});

        if (config.roles.nouveau) {
          await interaction.member.roles.remove(config.roles.nouveau).catch(() => {});
        }

        return interaction.reply({
          content: '✅ Tu as accepté le règlement. Bienvenue sur Creaty Bot !',
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
            new TextInputBuilder()
              .setCustomId('project_name')
              .setLabel('Nom du bot / projet')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setMaxLength(100)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('service')
              .setLabel('Service demandé')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setMaxLength(100)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('description')
              .setLabel('Décris précisément ton projet')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
              .setMaxLength(1500)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId === 'my_orders') {
        return sendMyOrders(interaction);
      }

      if (interaction.customId === 'declare_payment') {
        const modal = new ModalBuilder()
          .setCustomId('declare_payment_modal')
          .setTitle('Déclarer un paiement');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('order_id')
              .setLabel('Numéro de commande (CMD-0001)')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('proof')
              .setLabel('Référence ou preuve du paiement')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
              .setMaxLength(1000)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId === 'ticket_order') {
        return interaction.reply({
          content: '📝 Pour commander, commence par demander un devis. Clique sur **Demander un devis**.',
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId === 'ticket_support') {
        return interaction.reply({
          content: '❓ Utilise le panneau Tickets pour ouvrir un ticket de type Support.',
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId.startsWith('ticket_claim:')) {
        const ticketId = interaction.customId.split(':')[1];
        const ops = loadJson(OPS_FILE);
        const ticket = ops.tickets[ticketId];

        if (!ticket) {
          return interaction.reply({
            content: '❌ Ticket introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        const config = getGuildConfig(ticket.guildId);

        if (!hasStaffAccess(interaction.member, config)) {
          return interaction.reply({
            content: '❌ Réservé au personnel.',
            flags: MessageFlags.Ephemeral
          });
        }

        ticket.claimedBy = interaction.user.id;
        ops.tickets[ticketId] = ticket;
        saveJson(OPS_FILE, ops);

        return interaction.reply({
          content: `👤 Ticket pris en charge par ${interaction.user}.`
        });
      }

      if (interaction.customId.startsWith('ticket_quote:')) {
        const ticketId = interaction.customId.split(':')[1];
        const ops = loadJson(OPS_FILE);
        const ticket = ops.tickets[ticketId];

        if (!ticket) {
          return interaction.reply({
            content: '❌ Ticket introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        const config = getGuildConfig(ticket.guildId);

        if (!hasStaffAccess(interaction.member, config)) {
          return interaction.reply({
            content: '❌ Réservé au personnel.',
            flags: MessageFlags.Ephemeral
          });
        }

        const modal = new ModalBuilder()
          .setCustomId(`ticket_quote_modal:${ticketId}`)
          .setTitle('Créer un devis');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('project_name')
              .setLabel('Nom du bot / projet')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('service')
              .setLabel('Service')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('description')
              .setLabel('Description')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('price')
              .setLabel('Prix en euros')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId.startsWith('ticket_close:')) {
        const ticketId = interaction.customId.split(':')[1];
        const ops = loadJson(OPS_FILE);
        const ticket = ops.tickets[ticketId];

        if (!ticket) {
          return interaction.reply({
            content: '❌ Ticket introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        if (
          interaction.user.id !== ticket.userId &&
          !hasStaffAccess(interaction.member, getGuildConfig(ticket.guildId))
        ) {
          return interaction.reply({
            content: '❌ Tu ne peux pas fermer ce ticket.',
            flags: MessageFlags.Ephemeral
          });
        }

        ticket.status = 'Fermé';
        ops.tickets[ticketId] = ticket;
        saveJson(OPS_FILE, ops);

        await interaction.channel.permissionOverwrites
          .edit(ticket.userId, { SendMessages: false })
          .catch(() => {});

        return interaction.update({
          embeds: [
            makeEmbed(
              `🔒 ${ticketId} fermé`,
              `Le ticket a été fermé par ${interaction.user}.\n\nAucune donnée n’a été supprimée.`,
              0x95A5A6
            )
          ],
          components: []
        });
      }

      if (interaction.customId.startsWith('quote_claim:')) {
        const quoteId = interaction.customId.split(':')[1];
        const ops = loadJson(OPS_FILE);
        const quote = ops.quotes[quoteId];

        if (!quote) {
          return interaction.reply({
            content: '❌ Devis introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        const config = getGuildConfig(quote.guildId);

        if (!hasStaffAccess(interaction.member, config)) {
          return interaction.reply({
            content: '❌ Réservé au personnel.',
            flags: MessageFlags.Ephemeral
          });
        }

        quote.claimedBy = interaction.user.id;
        ops.quotes[quoteId] = quote;
        saveJson(OPS_FILE, ops);

        await refreshQuoteMessage(interaction.guild, quote);

        return interaction.reply({
          content: `👤 ${interaction.user} prend maintenant en charge le devis **${quoteId}**.`
        });
      }

      if (interaction.customId.startsWith('quote_price:')) {
        const quoteId = interaction.customId.split(':')[1];
        const ops = loadJson(OPS_FILE);
        const quote = ops.quotes[quoteId];

        if (!quote) {
          return interaction.reply({
            content: '❌ Devis introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        if (!hasStaffAccess(interaction.member, getGuildConfig(quote.guildId))) {
          return interaction.reply({
            content: '❌ Réservé au personnel.',
            flags: MessageFlags.Ephemeral
          });
        }

        const modal = new ModalBuilder()
          .setCustomId(`quote_price_modal:${quoteId}`)
          .setTitle(`Prix ${quoteId}`);

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('price')
              .setLabel('Nouveau prix en euros')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId.startsWith('quote_to_order:')) {
        const quoteId = interaction.customId.split(':')[1];
        const ops = loadJson(OPS_FILE);
        const quote = ops.quotes[quoteId];

        if (!quote) {
          return interaction.reply({
            content: '❌ Devis introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        if (!hasStaffAccess(interaction.member, getGuildConfig(quote.guildId))) {
          return interaction.reply({
            content: '❌ Réservé au personnel.',
            flags: MessageFlags.Ephemeral
          });
        }

        if (quote.orderId) {
          return interaction.reply({
            content: `❌ Ce devis est déjà lié à la commande **${quote.orderId}**.`,
            flags: MessageFlags.Ephemeral
          });
        }

        const order = await createOrderFromQuote(interaction.guild, quote);

        const latest = loadJson(OPS_FILE);
        if (latest.quotes[quoteId]) {
          await refreshQuoteMessage(interaction.guild, latest.quotes[quoteId]);
        }

        return interaction.reply({
          content: `✅ Le devis **${quoteId}** a été transformé en commande **${order.id}**.`
        });
      }

      if (interaction.customId.startsWith('quote_contact:')) {
        const quoteId = interaction.customId.split(':')[1];
        const ops = loadJson(OPS_FILE);
        const quote = ops.quotes[quoteId];

        if (!quote) {
          return interaction.reply({
            content: '❌ Devis introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        if (!hasStaffAccess(interaction.member, getGuildConfig(quote.guildId))) {
          return interaction.reply({
            content: '❌ Réservé au personnel.',
            flags: MessageFlags.Ephemeral
          });
        }

        const modal = new ModalBuilder()
          .setCustomId(`contact_quote_modal:${quoteId}`)
          .setTitle('Contacter le client');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('message')
              .setLabel('Message à envoyer en MP')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
              .setMaxLength(1500)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId.startsWith('quote_close:')) {
        const quoteId = interaction.customId.split(':')[1];
        const ops = loadJson(OPS_FILE);
        const quote = ops.quotes[quoteId];

        if (!quote) {
          return interaction.reply({
            content: '❌ Devis introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        if (!hasStaffAccess(interaction.member, getGuildConfig(quote.guildId))) {
          return interaction.reply({
            content: '❌ Réservé au personnel.',
            flags: MessageFlags.Ephemeral
          });
        }

        quote.status = 'Fermé';
        ops.quotes[quoteId] = quote;
        saveJson(OPS_FILE, ops);

        await refreshQuoteMessage(interaction.guild, quote);

        return interaction.reply({
          content: `🔒 Le devis **${quoteId}** est fermé. Aucune donnée n’a été supprimée.`
        });
      }

      if (interaction.customId.startsWith('order_claim:')) {
        const orderId = interaction.customId.split(':')[1];
        const ops = loadJson(OPS_FILE);
        const order = ops.orders[orderId];

        if (!order) {
          return interaction.reply({
            content: '❌ Commande introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        if (!hasStaffAccess(interaction.member, getGuildConfig(order.guildId))) {
          return interaction.reply({
            content: '❌ Réservé au personnel.',
            flags: MessageFlags.Ephemeral
          });
        }

        order.claimedBy = interaction.user.id;
        ops.orders[orderId] = order;
        saveJson(OPS_FILE, ops);

        await refreshOrderMessage(interaction.guild, order);

        return interaction.reply({
          content: `👤 ${interaction.user} prend maintenant en charge la commande **${orderId}**.`
        });
      }

      if (
        interaction.customId.startsWith('order_next:') ||
        interaction.customId.startsWith('order_prev:')
      ) {
        const [action, orderId] = interaction.customId.split(':');
        const ops = loadJson(OPS_FILE);
        const order = ops.orders[orderId];

        if (!order) {
          return interaction.reply({
            content: '❌ Commande introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        if (!hasStaffAccess(interaction.member, getGuildConfig(order.guildId))) {
          return interaction.reply({
            content: '❌ Réservé au personnel.',
            flags: MessageFlags.Ephemeral
          });
        }

        if (action === 'order_next') {
          order.stageIndex = Math.min(
            ORDER_STAGES.length - 1,
            order.stageIndex + 1
          );
        } else {
          order.stageIndex = Math.max(0, order.stageIndex - 1);
        }

        ops.orders[orderId] = order;
        saveJson(OPS_FILE, ops);

        await refreshOrderMessage(interaction.guild, order);

        await dmUser(order.userId, {
          embeds: [
            makeEmbed(
              `📦 Mise à jour de ta commande ${orderId}`,
              `Projet : **${order.projectName}**\nNouvelle étape : **${ORDER_STAGES[order.stageIndex]}**\nProgression : ${orderProgress(order.stageIndex)}`,
              0x3498DB
            )
          ]
        });

        return interaction.reply({
          content: `✅ Étape mise à jour : **${ORDER_STAGES[order.stageIndex]}**.`
        });
      }

      if (interaction.customId.startsWith('order_contact:')) {
        const orderId = interaction.customId.split(':')[1];
        const ops = loadJson(OPS_FILE);
        const order = ops.orders[orderId];

        if (!order) {
          return interaction.reply({
            content: '❌ Commande introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        if (!hasStaffAccess(interaction.member, getGuildConfig(order.guildId))) {
          return interaction.reply({
            content: '❌ Réservé au personnel.',
            flags: MessageFlags.Ephemeral
          });
        }

        const modal = new ModalBuilder()
          .setCustomId(`contact_order_modal:${orderId}`)
          .setTitle('Contacter le client');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('message')
              .setLabel('Message à envoyer en MP')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
              .setMaxLength(1500)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId.startsWith('order_close:')) {
        const orderId = interaction.customId.split(':')[1];
        const ops = loadJson(OPS_FILE);
        const order = ops.orders[orderId];

        if (!order) {
          return interaction.reply({
            content: '❌ Commande introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        if (!hasStaffAccess(interaction.member, getGuildConfig(order.guildId))) {
          return interaction.reply({
            content: '❌ Réservé au personnel.',
            flags: MessageFlags.Ephemeral
          });
        }

        order.status = 'Clôturée';
        ops.orders[orderId] = order;
        saveJson(OPS_FILE, ops);

        await refreshOrderMessage(interaction.guild, order);

        return interaction.reply({
          content: `🔒 Commande **${orderId}** clôturée. Aucune donnée n’a été supprimée.`
        });
      }

      if (interaction.customId.startsWith('payment_accept:')) {
        const paymentId = interaction.customId.split(':')[1];
        const ops = loadJson(OPS_FILE);
        const payment = ops.payments[paymentId];

        if (!payment) {
          return interaction.reply({
            content: '❌ Paiement introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        if (!hasStaffAccess(interaction.member, getGuildConfig(payment.guildId))) {
          return interaction.reply({
            content: '❌ Réservé au personnel.',
            flags: MessageFlags.Ephemeral
          });
        }

        payment.status = 'Validé';

        if (ops.orders[payment.orderId]) {
          ops.orders[payment.orderId].paymentStatus = 'Payé';
        }

        saveJson(OPS_FILE, ops);

        const order = ops.orders[payment.orderId];

        if (order) {
          const guild = interaction.guild;
          const config = getGuildConfig(guild.id);
          const member = await guild.members.fetch(order.userId).catch(() => null);

          if (member && config.roles.client) {
            await member.roles.add(config.roles.client).catch(() => {});
          }

          if (member && config.roles.prospect) {
            await member.roles.remove(config.roles.prospect).catch(() => {});
          }

          await refreshOrderMessage(guild, order);

          await dmUser(order.userId, {
            embeds: [
              makeEmbed(
                `✅ Paiement validé — ${payment.orderId}`,
                `Ton paiement a été validé. La commande **${payment.orderId}** peut maintenant avancer.`,
                0x57F287
              )
            ]
          });
        }

        return interaction.update({
          embeds: [
            makeEmbed(
              `✅ Paiement ${paymentId} validé`,
              `Commande : **${payment.orderId}**\nClient : <@${payment.userId}>`,
              0x57F287
            )
          ],
          components: []
        });
      }

      if (interaction.customId.startsWith('payment_refuse:')) {
        const paymentId = interaction.customId.split(':')[1];
        const ops = loadJson(OPS_FILE);
        const payment = ops.payments[paymentId];

        if (!payment) {
          return interaction.reply({
            content: '❌ Paiement introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        if (!hasStaffAccess(interaction.member, getGuildConfig(payment.guildId))) {
          return interaction.reply({
            content: '❌ Réservé au personnel.',
            flags: MessageFlags.Ephemeral
          });
        }

        payment.status = 'Refusé';
        saveJson(OPS_FILE, ops);

        await dmUser(payment.userId, {
          embeds: [
            makeEmbed(
              `❌ Paiement refusé — ${payment.orderId}`,
              'La déclaration de paiement n’a pas été validée. Contacte le support si nécessaire.',
              0xED4245
            )
          ]
        });

        return interaction.update({
          embeds: [
            makeEmbed(
              `❌ Paiement ${paymentId} refusé`,
              `Commande : **${payment.orderId}**`,
              0xED4245
            )
          ],
          components: []
        });
      }
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'ticket_type') {
        const config = getGuildConfig(interaction.guild.id);
        const categoryId =
          config.categories.tickets ||
          config.categories.support;

        if (!categoryId) {
          return interaction.reply({
            content:
              '❌ Aucune catégorie Tickets ou Support n’a encore été configurée.',
            flags: MessageFlags.Ephemeral
          });
        }

        const type = interaction.values[0];
        const ticketId = nextId('tickets', 'TICKET');

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
          }
        ];

        const staffRoleIds = [
          config.roles.staff,
          config.roles.moderateur,
          config.roles.administrateur,
          config.roles.directeur,
          config.roles.cofondateur,
          config.roles.fondateur
        ].filter(Boolean);

        for (const roleId of [...new Set(staffRoleIds)]) {
          permissions.push({
            id: roleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles
            ]
          });
        }

        const ticketChannel = await interaction.guild.channels.create({
          name: `${type}-${interaction.user.username}`
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '')
            .slice(0, 90),
          type: ChannelType.GuildText,
          parent: categoryId,
          permissionOverwrites: permissions
        });

        const ticket = {
          id: ticketId,
          guildId: interaction.guild.id,
          userId: interaction.user.id,
          type,
          status: 'Ouvert',
          claimedBy: null,
          channelId: ticketChannel.id,
          createdAt: new Date().toISOString()
        };

        const ops = loadJson(OPS_FILE);
        ops.tickets[ticketId] = ticket;
        saveJson(OPS_FILE, ops);

        await ticketChannel.send({
          content: `${interaction.user}`,
          embeds: [
            makeEmbed(
              `🎫 ${ticketId} — ${type}`,
              [
                `**Client :** ${interaction.user}`,
                `**Type :** ${type}`,
                `**Statut :** Ouvert`,
                '',
                'Explique ta demande le plus précisément possible.',
                '',
                '**Panneau personnel**',
                'Les boutons ci-dessous sont réservés au personnel pour prendre en charge et gérer le ticket.'
              ].join('\n')
            )
          ],
          components: ticketStaffRows(ticketId)
        });

        return interaction.reply({
          content: `✅ Ton ticket a été créé : ${ticketChannel}`,
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId.startsWith('order_stage:')) {
        const orderId = interaction.customId.split(':')[1];
        const ops = loadJson(OPS_FILE);
        const order = ops.orders[orderId];

        if (!order) {
          return interaction.reply({
            content: '❌ Commande introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        if (!hasStaffAccess(interaction.member, getGuildConfig(order.guildId))) {
          return interaction.reply({
            content: '❌ Réservé au personnel.',
            flags: MessageFlags.Ephemeral
          });
        }

        order.stageIndex = Number(interaction.values[0]);
        ops.orders[orderId] = order;
        saveJson(OPS_FILE, ops);

        await refreshOrderMessage(interaction.guild, order);

        await dmUser(order.userId, {
          embeds: [
            makeEmbed(
              `📦 Mise à jour de ta commande ${orderId}`,
              `Projet : **${order.projectName}**\nNouvelle étape : **${ORDER_STAGES[order.stageIndex]}**\nProgression : ${orderProgress(order.stageIndex)}`,
              0x3498DB
            )
          ]
        });

        return interaction.reply({
          content: `✅ Étape définie sur **${ORDER_STAGES[order.stageIndex]}**.`
        });
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'suggestion_modal') {
        const config = getGuildConfig(interaction.guild.id);
        const channel = interaction.guild.channels.cache.get(
          config.channels.suggestion
        );

        const text = interaction.fields.getTextInputValue('suggestion_text');

        if (channel && channel.isTextBased()) {
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
          content: '✅ Ta suggestion a été envoyée.',
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId === 'quote_request_modal') {
        const projectName = interaction.fields.getTextInputValue('project_name');
        const service = interaction.fields.getTextInputValue('service');
        const description = interaction.fields.getTextInputValue('description');

        const quote = await createQuote(
          interaction.guild,
          interaction.user.id,
          projectName,
          service,
          description
        );

        const config = getGuildConfig(interaction.guild.id);
        const member = interaction.member;

        if (
          member &&
          config.roles.prospect &&
          !member.roles.cache.has(config.roles.prospect) &&
          !member.roles.cache.has(config.roles.client)
        ) {
          await member.roles.add(config.roles.prospect).catch(() => {});
        }

        return interaction.reply({
          content: `✅ Ta demande de devis a été créée : **${quote.id}**. L’équipe va l’étudier.`,
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId.startsWith('ticket_quote_modal:')) {
        const ticketId = interaction.customId.split(':')[1];
        const ops = loadJson(OPS_FILE);
        const ticket = ops.tickets[ticketId];

        if (!ticket) {
          return interaction.reply({
            content: '❌ Ticket introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        const priceRaw = interaction.fields.getTextInputValue('price').replace(',', '.');
        const price = Number(priceRaw);

        if (!Number.isFinite(price) || price < 0) {
          return interaction.reply({
            content: '❌ Prix invalide.',
            flags: MessageFlags.Ephemeral
          });
        }

        const quote = await createQuote(
          interaction.guild,
          ticket.userId,
          interaction.fields.getTextInputValue('project_name'),
          interaction.fields.getTextInputValue('service'),
          interaction.fields.getTextInputValue('description'),
          price,
          ticketId
        );

        await dmUser(ticket.userId, {
          embeds: [
            makeEmbed(
              `💰 Proposition de devis — ${quote.id}`,
              `Projet : **${quote.projectName}**\nPrix proposé : **${quote.price} €**\n\nLe personnel peut maintenant transformer ce devis en commande lorsque tout est validé.`,
              0xF1C40F
            )
          ]
        });

        return interaction.reply({
          content: `✅ Devis **${quote.id}** créé à partir du ticket **${ticketId}**.`
        });
      }

      if (interaction.customId.startsWith('quote_price_modal:')) {
        const quoteId = interaction.customId.split(':')[1];
        const ops = loadJson(OPS_FILE);
        const quote = ops.quotes[quoteId];

        if (!quote) {
          return interaction.reply({
            content: '❌ Devis introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        const price = Number(
          interaction.fields.getTextInputValue('price').replace(',', '.')
        );

        if (!Number.isFinite(price) || price < 0) {
          return interaction.reply({
            content: '❌ Prix invalide.',
            flags: MessageFlags.Ephemeral
          });
        }

        quote.price = price;
        quote.status = 'Prix défini';
        ops.quotes[quoteId] = quote;
        saveJson(OPS_FILE, ops);

        await refreshQuoteMessage(interaction.guild, quote);

        await dmUser(quote.userId, {
          embeds: [
            makeEmbed(
              `💰 Mise à jour du devis ${quoteId}`,
              `Le prix proposé pour **${quote.projectName}** est maintenant de **${price} €**.`,
              0xF1C40F
            )
          ]
        });

        return interaction.reply({
          content: `✅ Prix du devis **${quoteId}** mis à jour à **${price} €**.`
        });
      }

      if (interaction.customId.startsWith('contact_quote_modal:')) {
        const quoteId = interaction.customId.split(':')[1];
        const ops = loadJson(OPS_FILE);
        const quote = ops.quotes[quoteId];

        if (!quote) {
          return interaction.reply({
            content: '❌ Devis introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        const text = interaction.fields.getTextInputValue('message');

        const ok = await dmUser(quote.userId, {
          embeds: [
            makeEmbed(
              `💬 Message concernant ton devis ${quoteId}`,
              text,
              0x5865F2
            )
          ]
        });

        return interaction.reply({
          content: ok ? '✅ Message envoyé au client en MP.' : '❌ Impossible d’envoyer un MP au client.',
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId.startsWith('contact_order_modal:')) {
        const orderId = interaction.customId.split(':')[1];
        const ops = loadJson(OPS_FILE);
        const order = ops.orders[orderId];

        if (!order) {
          return interaction.reply({
            content: '❌ Commande introuvable.',
            flags: MessageFlags.Ephemeral
          });
        }

        const text = interaction.fields.getTextInputValue('message');

        const ok = await dmUser(order.userId, {
          embeds: [
            makeEmbed(
              `💬 Message concernant ta commande ${orderId}`,
              text,
              0x5865F2
            )
          ]
        });

        return interaction.reply({
          content: ok ? '✅ Message envoyé au client en MP.' : '❌ Impossible d’envoyer un MP au client.',
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId === 'declare_payment_modal') {
        const orderId = interaction.fields
          .getTextInputValue('order_id')
          .trim()
          .toUpperCase();

        const proof = interaction.fields.getTextInputValue('proof');
        const ops = loadJson(OPS_FILE);
        const order = ops.orders[orderId];

        if (
          !order ||
          order.guildId !== interaction.guild.id ||
          order.userId !== interaction.user.id
        ) {
          return interaction.reply({
            content: '❌ Cette commande est introuvable ou ne t’appartient pas.',
            flags: MessageFlags.Ephemeral
          });
        }

        const paymentId = nextId('payments', 'PAY');
        const payment = {
          id: paymentId,
          guildId: interaction.guild.id,
          orderId,
          userId: interaction.user.id,
          proof,
          status: 'En attente',
          createdAt: new Date().toISOString()
        };

        const latest = loadJson(OPS_FILE);
        latest.payments[paymentId] = payment;
        saveJson(OPS_FILE, latest);

        const config = getGuildConfig(interaction.guild.id);
        const orderChannel = interaction.guild.channels.cache.get(order.channelId);

        const targetChannel =
          orderChannel ||
          interaction.guild.channels.cache.get(config.channels.paiements);

        if (targetChannel && targetChannel.isTextBased()) {
          await targetChannel.send({
            embeds: [
              makeEmbed(
                `💳 Paiement déclaré — ${paymentId}`,
                `Commande : **${orderId}**\nClient : ${interaction.user}\n\n**Preuve / référence :**\n${proof}`,
                0xF39C12
              )
            ],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId(`payment_accept:${paymentId}`)
                  .setLabel('Valider le paiement')
                  .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                  .setCustomId(`payment_refuse:${paymentId}`)
                  .setLabel('Refuser le paiement')
                  .setStyle(ButtonStyle.Danger)
              )
            ]
          });
        }

        return interaction.reply({
          content: `✅ Paiement déclaré sous le numéro **${paymentId}**. Le personnel va le vérifier.`,
          flags: MessageFlags.Ephemeral
        });
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
