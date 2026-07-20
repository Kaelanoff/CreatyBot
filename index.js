require('dotenv').config();

const fs = require('fs');
const path = require('path');
const {
  Client, GatewayIntentBits, Partials, Events, SlashCommandBuilder, ChannelType,
  PermissionFlagsBits, MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder,
  ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
  ActivityType, UserSelectMenuBuilder
} = require('discord.js');

if (!process.env.TOKEN) {
  console.error('TOKEN manquant');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel, Partials.GuildMember, Partials.User],
  presence: { status: 'online', activities: [{ name: 'Creaty Bot', type: ActivityType.Playing }] }
});

const DATA_DIR = process.env.DATA_DIR ||
  ((process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID)
    ? '/data'
    : path.join(__dirname, 'data'));
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

const DESIGN_STAGES = ['À faire', 'En création', 'En validation', 'Corrections', 'Terminé'];

const CHANNELS = [
  ['bienvenue','Bienvenue'],['depart','À bientôt'],
  ['reglement','Règlement'],['annonces','Annonces'],['info','Informations'],['roadmap','Roadmap'],['liens','Nos liens'],['faq','FAQ'],['sondages','Sondages'],
  ['ticket','Ticket'],['attente_vocale','Attente vocale'],['support_premium','Support prioritaire'],
  ['discussion','Discussion'],['media','Média'],['suggestion','Suggestions'],['vos_bots','Vos bots'],['presentation','Présentation'],['evenements','Événements'],
  ['creation_bot','Création bot'],['creation_serveur','Création serveur'],['hebergement','Hébergement'],['tarifs','Tarifs'],['garantie','Garantie'],
  ['commander','Commander'],['demander_devis','Demander un devis'],['suivi_commandes','Suivi commandes'],['paiements','Paiements'],['conditions','Conditions'],['questions_commandes','Questions commandes'],['offres_speciales','Offres spéciales'],
  ['infos_clients','Informations clients'],['livraisons_clients','Livraisons clients'],['factures','Factures'],['avis','Avis clients'],
  ['commandes_premium','Commandes prioritaires'],['avantages_premium','Avantages Premium'],['annonces_premium','Annonces Premium'],['premium_chat','Premium Chat'],
  ['annonces_dev','Annonces Dev'],['discussion_dev','Discussion Dev'],['documentation','Documentation'],['tests_dev','Tests développement'],['bugs','Bugs'],
  ['liste_projets','Liste des projets'],['projets_attente','Projets en attente'],['analyse','Analyse'],['developpement','Développement'],['tests_projets','Tests projets'],['corrections','Corrections'],['termines','Terminés'],['livraisons_projets','Livraisons projets'],['archives','Archives projets'],
  ['ventes','Ventes'],['devis_commerciaux','Devis commerciaux'],['commandes_commerciales','Commandes commerciales'],['archives_devis','Archives devis'],['archives_commandes','Archives commandes'],['statistiques_commerciales','Statistiques commerciales'],['objectifs','Objectifs'],['chiffre_affaires','Chiffre d’affaires'],['discussion_commerciale','Discussion commerciale'],
  ['creations','Créations'],['logos','Logos'],['bannieres','Bannières'],['miniatures','Miniatures'],['reseaux_sociaux','Réseaux sociaux'],['discussion_design','Discussion Design'],
  ['staff_chat','Staff Chat'],['staff_annonces','Staff Annonces'],['recrutements','Recrutements'],['sanctions','Sanctions'],['reunions','Réunions'],
  ['direction','Direction'],['finance','Finance'],['statistiques_globales','Statistiques globales'],['planning','Planning'],['partenaires','Partenaires'],['contrats','Contrats'],['decisions','Décisions'],['documents','Documents Direction'],
  ['fondation','Fondation'],['documents_confidentiels','Documents confidentiels'],['projets_secrets','Projets secrets'],['gestion_financiere','Gestion financière'],['acces_total','Accès total'],['journal_direction','Journal de direction'],
  ['liste_clients','Liste des clients'],['nouveaux_clients','Nouveaux clients'],['clients_premium','Clients Premium'],
  ['logs_bot','Logs Bot'],['logs_erreurs','Logs erreurs'],['logs_roles','Logs rôles']
];

const CATEGORIES = [
  ['cat_aeroport','Catégorie Aéroport'],
  ['cat_hub','Catégorie Hub'],
  ['cat_support','Catégorie Support'],
  ['cat_communaute','Catégorie Communauté'],
  ['cat_services','Catégorie Services'],
  ['cat_commandes','Catégorie Commandes'],
  ['cat_espace_clients','Catégorie Espace clients'],
  ['cat_premium','Catégorie Premium'],
  ['cat_developpement','Catégorie Développement'],
  ['cat_projets','Catégorie Projets'],
  ['cat_commercial','Catégorie Commercial'],
  ['cat_design','Catégorie Design'],
  ['cat_staff','Catégorie Staff'],
  ['cat_direction','Catégorie Direction'],
  ['cat_fondation','Catégorie Fondation'],
  ['cat_gestion_clients','Catégorie Gestion clients'],
  ['cat_logs','Catégorie Logs'],
  ['tickets','Catégorie Tickets privés'],
  ['tickets_premium','Catégorie Tickets Premium privés'],
  ['devis','Catégorie Devis privés']
];

const SALON_CONFIG_GROUPS = {
  aeroport: ['cat_aeroport','bienvenue','depart'],
  hub: ['cat_hub','reglement','annonces','info','roadmap','liens','faq','sondages'],
  support: ['cat_support','ticket','attente_vocale','support_premium','tickets','tickets_premium'],
  communaute: ['cat_communaute','discussion','media','suggestion','vos_bots','presentation','evenements'],
  services: ['cat_services','creation_bot','creation_serveur','hebergement','tarifs','garantie'],
  commandes: ['cat_commandes','commander','demander_devis','suivi_commandes','paiements','conditions','questions_commandes','offres_speciales','devis'],
  espace_clients: ['cat_espace_clients','infos_clients','livraisons_clients','factures','avis'],
  premium: ['cat_premium','commandes_premium','avantages_premium','annonces_premium','premium_chat'],
  developpement: ['cat_developpement','annonces_dev','discussion_dev','documentation','tests_dev','bugs'],
  projets: ['cat_projets','liste_projets','projets_attente','analyse','developpement','tests_projets','corrections','termines','livraisons_projets','archives'],
  commercial: ['cat_commercial','ventes','devis_commerciaux','commandes_commerciales','archives_devis','archives_commandes','statistiques_commerciales','objectifs','chiffre_affaires','discussion_commerciale'],
  design: ['cat_design','creations','logos','bannieres','miniatures','reseaux_sociaux','discussion_design'],
  staff: ['cat_staff','staff_chat','staff_annonces','recrutements','sanctions','reunions'],
  direction: ['cat_direction','direction','finance','statistiques_globales','planning','partenaires','contrats','decisions','documents'],
  fondation: ['cat_fondation','fondation','documents_confidentiels','projets_secrets','gestion_financiere','acces_total','journal_direction'],
  gestion_clients: ['cat_gestion_clients','liste_clients','nouveaux_clients','clients_premium'],
  logs: ['cat_logs','logs_bot','logs_erreurs','logs_roles']
};

const ROLES = [
  ['pole_fondation','Pôle Fondation'],['fondateur','Fondateur'],['cofondateur','Co-Fondateur'],
  ['pole_direction','Pôle Direction'],['directeur_general','Directeur Général'],['directeur','Directeur'],
  ['pole_developpement','Pôle Développement'],['lead_developpeur','Lead Développeur'],['developpeur_bot','Développeur Bot'],['developpeur_serveur','Développeur Serveur Discord'],['developpeur_backend','Développeur Backend'],['developpeur_frontend','Développeur Frontend'],['testeur','Testeur'],['developpeur_junior','Développeur Junior'],
  ['pole_commercial','Pôle Commercial'],['responsable_commercial','Responsable Commercial'],['commercial','Commercial'],['support_client','Support Client'],['responsable_paiement','Responsable Paiement'],
  ['pole_design','Pôle Design'],['lead_designer','Lead Designer'],['graphiste','Graphiste'],['uiux_designer','UI/UX Designer'],['monteur','Monteur'],
  ['pole_moderation','Pôle Modération'],['administrateur','Administrateur'],['moderateur','Modérateur'],['assistant_moderateur','Assistant Modérateur'],
  ['pole_clientele','Pôle Clientèle'],['client_premium','Client Premium'],['client','Client'],['prospect','Prospect'],['partenaire','Partenaire'],
  ['membre','Membre'],['nouveau','Nouveau'],
  ['bot','Bot'],['notifications','Notifications']
];

const ROLE_CONFIG_GROUPS = {
  fondation: ['pole_fondation','fondateur','cofondateur'],
  direction: ['pole_direction','directeur_general','directeur'],
  developpement: ['pole_developpement','lead_developpeur','developpeur_bot','developpeur_serveur','developpeur_backend','developpeur_frontend','testeur','developpeur_junior'],
  commercial: ['pole_commercial','responsable_commercial','commercial','support_client','responsable_paiement'],
  design: ['pole_design','lead_designer','graphiste','uiux_designer','monteur'],
  moderation: ['pole_moderation','administrateur','moderateur','assistant_moderateur'],
  clientele: ['pole_clientele','client_premium','client','prospect','partenaire'],
  communaute: ['membre','nouveau'],
  systeme: ['bot','notifications']
};

const PERMISSION_GROUPS = {
  foundation: [
    'pole_fondation','fondateur','cofondateur'
  ],
  direction: [
    'pole_direction','directeur_general','directeur'
  ],
  development: [
    'pole_developpement','lead_developpeur','developpeur_bot',
    'developpeur_serveur','developpeur_backend','developpeur_frontend',
    'testeur','developpeur_junior'
  ],
  commercial: [
    'pole_commercial','responsable_commercial','commercial',
    'support_client','responsable_paiement'
  ],
  design: [
    'pole_design','lead_designer','graphiste','uiux_designer','monteur'
  ],
  moderation: [
    'pole_moderation','administrateur','moderateur','assistant_moderateur'
  ],
  clientele: [
    'pole_clientele','client_premium','client','prospect','partenaire'
  ],
  community: [
    'membre','nouveau'
  ]
};

const GRADE_TO_POLE = {
  fondateur:'pole_fondation', cofondateur:'pole_fondation',
  directeur_general:'pole_direction', directeur:'pole_direction',
  lead_developpeur:'pole_developpement', developpeur_bot:'pole_developpement', developpeur_serveur:'pole_developpement', developpeur_backend:'pole_developpement', developpeur_frontend:'pole_developpement', testeur:'pole_developpement', developpeur_junior:'pole_developpement',
  responsable_commercial:'pole_commercial', commercial:'pole_commercial', support_client:'pole_commercial', responsable_paiement:'pole_commercial',
  lead_designer:'pole_design', graphiste:'pole_design', uiux_designer:'pole_design', monteur:'pole_design',
  administrateur:'pole_moderation', moderateur:'pole_moderation', assistant_moderateur:'pole_moderation',
  client_premium:'pole_clientele', client:'pole_clientele', prospect:'pole_clientele', partenaire:'pole_clientele'
};

const PRICES = {
  mini: { label: 'Bot Mini', price: 15, description: 'Petit bot personnalisé, jusqu’à environ 10 fonctionnalités prévues au cahier des charges.' },
  essentiel: { label: 'Bot Essentiel', price: 35, description: 'Bot personnalisé standard, jusqu’à environ 25 fonctionnalités.' },
  avance: { label: 'Bot Avancé', price: 40, description: 'Bot plus complet, jusqu’à environ 50 fonctionnalités.' },
  premium: { label: 'Bot Premium', price: 60, description: 'Projet complet : bot, configuration et création/refonte du serveur Discord. 1 mois d’hébergement offert.' },
  hosting: { label: 'Hébergement', price: 5, description: 'Hébergement du bot : 5 €/mois.' },
  custom: { label: 'Projet sur mesure', price: null, description: 'Tarif défini après étude du besoin.' }
};

const RULES_TEXT = [
  '**1. Respect**\nTout membre doit rester respectueux. Insultes, harcèlement, discrimination, menaces et provocations sont interdits.',
  '**2. Spam et flood**\nLe spam, flood, répétitions abusives et mentions inutiles sont interdits.',
  '**3. Publicité**\nToute publicité est interdite sans autorisation préalable de l’équipe.',
  '**4. Présentation des bots**\nLe salon Vos bots autorise uniquement le nom, la photo, la description et les fonctionnalités. Les liens y sont interdits.',
  '**5. Sécurité**\nNe partagez jamais token, mot de passe, clé API ou accès privé dans un salon public.',
  '**6. Confidentialité**\nLes informations privées d’un client ou d’un projet ne doivent pas être publiées.',
  '**7. Tickets**\nLes tickets sont réservés au support, bug, SAV/garantie, partenariat ou autre besoin adapté. Tout abus est interdit.',
  '**8. Devis**\nLes devis sont créés via le système dédié et discutés dans un salon privé.',
  '**9. Commandes**\nUne commande est traitée après acceptation et, lorsque requis, paiement validé.',
  '**10. Paiements**\nLes paiements doivent passer par le moyen officiel communiqué par Creaty Bot.',
  '**11. Preuves de paiement**\nUne référence ou preuve peut être demandée pour valider un paiement.',
  '**12. Tarifs**\nLes tarifs affichés sont ceux en vigueur au moment de la commande, sauf devis spécifique.',
  '**13. Modifications de commandes**\nLes changements demandés après validation peuvent entraîner un nouveau devis.',
  '**14. Délais**\nLes délais sont estimatifs et peuvent varier selon la complexité ou les retours client.',
  '**15. Garantie**\nUne garantie technique de 14 jours est incluse après livraison.',
  '**16. SAV**\nLe SAV couvre les problèmes techniques liés à la livraison initiale pendant la période de garantie.',
  '**17. Exclusions de garantie**\nLes modifications externes, services tiers ou changements faits par le client peuvent être exclus.',
  '**18. Hébergement**\nL’hébergement coûte 5 €/mois. Le Bot Premium inclut le premier mois.',
  '**19. Propriété et utilisation**\nLes droits d’utilisation sont précisés selon le projet et les éléments livrés.',
  '**20. Avis**\nSeuls les clients ayant réellement terminé au moins une commande peuvent publier un avis vérifié.',
  '**21. Personnel**\nLes décisions du personnel doivent être respectées. Les abus peuvent être signalés à la Direction.',
  '**22. Abus des systèmes**\nL’utilisation abusive des boutons, tickets, formulaires ou commandes est interdite.',
  '**23. Sanctions**\nLe non-respect du règlement peut entraîner avertissement, restriction ou exclusion.',
  '**24. Modification du règlement**\nLe règlement peut évoluer. Les changements importants peuvent être annoncés.',
  '**25. Acceptation finale**\nCliquer sur Accepter le règlement signifie que vous acceptez l’ensemble de ces règles.'
].join('\n\n');

const DEFAULT_DB = () => ({
  counters: { tickets:0, quotes:0, orders:0, payments:0, sales:0, clients:0, invoices:0, projects:0, deliveries:0, tests:0, bugs:0, reviews:0, designs:0, tasks:0, partners:0, contracts:0, decisions:0, offers:0 },
  tickets:{}, quotes:{}, orders:{}, payments:{}, sales:{}, clients:{}, invoices:{}, projects:{}, deliveries:{}, tests:{}, bugs:{}, reviews:{}, designs:{}, tasks:{}, partners:{}, contracts:{}, decisions:{}, offers:{}, polls:{}
});

function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CONFIG_FILE)) fs.writeFileSync(CONFIG_FILE, JSON.stringify({ guilds: {} }, null, 2));
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB(), null, 2));
}

function readJson(file) {
  ensureFiles();
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { throw new Error(`JSON invalide dans ${path.basename(file)} : ${e.message}`); }
}
function writeJson(file, data) {
  ensureFiles();
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

function migrateConfig(data) {
  if (!data.guilds) data.guilds = {};
  for (const c of Object.values(data.guilds)) {
    c.channels ||= {}; c.categories ||= {}; c.roles ||= {}; c.panels ||= {}; c.settings ||= {}; c.permissions ||= {};

    // Migration de secours : si une ancienne version a sauvegardé une clé de salon
    // ou catégorie directement dans la config du serveur, on la remet au bon endroit.
    for(const [key] of CHANNELS){
      if(!c.channels[key] && typeof c[key]==='string') c.channels[key]=c[key];
    }
    for(const [key] of CATEGORIES){
      if(!c.categories[key] && typeof c[key]==='string') c.categories[key]=c[key];
    }
    if (typeof c.settings.paypalUrl !== 'string') c.settings.paypalUrl = '';
    if (typeof c.settings.paymentMessage !== 'string') c.settings.paymentMessage = '';
    if (typeof c.settings.monthlyGoal !== 'number') c.settings.monthlyGoal = 0;
    if (typeof c.settings.linksText !== 'string') c.settings.linksText = '';
    if (typeof c.settings.monthlyRevenueResetAt !== 'string') c.settings.monthlyRevenueResetAt = '';
  }
  return data;
}

function getConfig(guildId) {
  const data = migrateConfig(readJson(CONFIG_FILE));
  if (!data.guilds[guildId]) data.guilds[guildId] = { channels:{}, categories:{}, roles:{}, panels:{}, settings:{paypalUrl:'',paymentMessage:'',monthlyGoal:0,linksText:''}, permissions:{} };
  writeJson(CONFIG_FILE, data);
  return data.guilds[guildId];
}

function setConfig(guildId, section, key, value) {
  const data = migrateConfig(readJson(CONFIG_FILE));
  if (!data.guilds[guildId]) data.guilds[guildId] = { channels:{}, categories:{}, roles:{}, panels:{}, settings:{}, permissions:{} };
  data.guilds[guildId][section] ||= {};
  data.guilds[guildId][section][key] = value;
  writeJson(CONFIG_FILE, data);
}

function getDb() {
  const db = readJson(DB_FILE);
  const def = DEFAULT_DB();
  db.counters ||= {};
  for (const [k,v] of Object.entries(def.counters)) if (typeof db.counters[k] !== 'number') db.counters[k] = v;
  for (const k of Object.keys(def).filter(k=>k!=='counters')) db[k] ||= {};
  writeJson(DB_FILE, db);
  return db;
}

function nextId(type, prefix) {
  const db = getDb();
  db.counters[type] = (db.counters[type] || 0) + 1;
  const id = `${prefix}-${String(db.counters[type]).padStart(4,'0')}`;
  writeJson(DB_FILE, db);
  return id;
}

function isUsableTextChannel(channel){
  return Boolean(
    channel &&
    typeof channel.isTextBased === 'function' &&
    channel.isTextBased() &&
    typeof channel.send === 'function'
  );
}

function embed(title, description, color = 0x5865F2) {
  return new EmbedBuilder().setTitle(title).setDescription(description || '—').setColor(color).setTimestamp().setFooter({ text: 'Creaty Bot' });
}

async function safeLog(guildId, channelKey, payload) {
  try {
    const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId);
    const c = getConfig(guildId);
    const ch = c.channels[channelKey] ? await guild.channels.fetch(c.channels[channelKey]).catch(()=>null) : null;
    if (ch && typeof ch.isTextBased==='function' && ch.isTextBased() && typeof ch.send==='function') await ch.send(payload);
  } catch (e) { console.error(`Log ${channelKey} impossible:`, e); }
}

async function logError(guildId, error, context='') {
  console.error(context, error);
  if (guildId) await safeLog(guildId, 'logs_erreurs', { embeds:[embed('❌ Erreur technique', `Contexte : ${context || 'Non précisé'}\n\n\`\`\`${String(error?.stack || error).slice(0,3500)}\`\`\``, 0xED4245)] });
}

function isAdmin(member) { return Boolean(member?.permissions?.has(PermissionFlagsBits.Administrator)); }
function configuredRoleIds(c, keys) { return keys.map(k=>c.roles[k]).filter(Boolean); }
function isStaff(member, c) {
  if (!member) return false;
  if (isAdmin(member)) return true;
  const ids = configuredRoleIds(c, ['pole_fondation','fondateur','cofondateur','pole_direction','directeur_general','directeur','pole_commercial','responsable_commercial','commercial','support_client','responsable_paiement','pole_moderation','administrateur','moderateur','assistant_moderateur','pole_developpement','lead_developpeur']);
  return member.roles.cache.some(r=>ids.includes(r.id));
}
function hasFeature(member, c, key) {
  if (!member) return false;
  if (isAdmin(member)) return true;
  const roleId = c.permissions[key];
  if (roleId && member.roles.cache.has(roleId)) return true;
  return configuredRoleIds(c,['fondateur','cofondateur']).some(id=>member.roles.cache.has(id));
}

async function getGuild(guildId) { return client.guilds.cache.get(guildId) || client.guilds.fetch(guildId); }
async function getMember(guild, userId) { return guild.members.cache.get(userId) || guild.members.fetch(userId).catch(()=>null); }

async function sendDm(userId, payload) {
  try { const u = await client.users.fetch(userId); await u.send(payload); return true; }
  catch { return false; }
}

async function ensureBotPermissions(guild, perms, context) {
  const me = guild.members.me || await guild.members.fetchMe();
  const missing = perms.filter(p=>!me.permissions.has(p));
  if (missing.length) throw new Error(`${context} impossible : permissions manquantes (${missing.join(', ')}).`);
}

async function applyRole(member, roleId, action='add', guildId=null, label='rôle') {
  if (!roleId) throw new Error(`${label} non configuré.`);
  const role = member.guild.roles.cache.get(roleId);
  if (!role) throw new Error(`${label} configuré introuvable.`);
  const me = member.guild.members.me || await member.guild.members.fetchMe();
  if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) throw new Error('Permission Gérer les rôles manquante.');
  if (role.position >= me.roles.highest.position) throw new Error(`Le rôle ${role.name} est au-dessus ou au même niveau que le rôle du bot. Déplace le rôle Creaty Bot au-dessus de ce rôle dans Paramètres du serveur → Rôles.`);
  if (action === 'add') await member.roles.add(role);
  else await member.roles.remove(role);
  const ok = action === 'add' ? member.roles.cache.has(role.id) : !member.roles.cache.has(role.id);
  if (!ok) throw new Error(`Discord n’a pas confirmé ${action === 'add' ? 'l’ajout' : 'le retrait'} du rôle ${role.name}.`);
  if (guildId) await safeLog(guildId, 'logs_roles', { content:`✅ ${action === 'add' ? 'Rôle attribué' : 'Rôle retiré'} : <@&${role.id}> ${action === 'add' ? 'à' : 'de'} <@${member.id}>` });
  return role;
}

async function assignGrade(member, gradeKey, c) {
  const gradeRoleId = c.roles[gradeKey];
  if (!gradeRoleId) throw new Error('Grade non configuré.');
  const poleKey = GRADE_TO_POLE[gradeKey];
  if (poleKey) await applyRole(member, c.roles[poleKey], 'add', member.guild.id, 'Rôle de pôle');
  await applyRole(member, gradeRoleId, 'add', member.guild.id, 'Grade');
}

async function removeGrade(member, gradeKey, c) {
  await applyRole(member, c.roles[gradeKey], 'remove', member.guild.id, 'Grade');
  const poleKey = GRADE_TO_POLE[gradeKey];
  if (!poleKey || !c.roles[poleKey]) return;
  const otherGrades = Object.entries(GRADE_TO_POLE).filter(([k,p])=>p===poleKey && k!==gradeKey).map(([k])=>c.roles[k]).filter(Boolean);
  if (!otherGrades.some(id=>member.roles.cache.has(id))) await applyRole(member, c.roles[poleKey], 'remove', member.guild.id, 'Rôle de pôle');
}

function tariffsEmbed() {
  return embed('💰 Tarifs Creaty Bot', [
    `**Bot Mini — 15 €**\n${PRICES.mini.description}`,
    `**Bot Essentiel — 35 €**\n${PRICES.essentiel.description}`,
    `**Bot Avancé — 40 €**\n${PRICES.avance.description}`,
    `**Bot Premium — 60 €**\n${PRICES.premium.description}`,
    `**Hébergement — 5 €/mois**\n${PRICES.hosting.description}`,
    '**Important :** « fonctionnalités illimitées » pour Premium signifie uniquement les fonctionnalités prévues dans le cahier des charges validé au départ. Les ajouts ultérieurs peuvent nécessiter un nouveau devis.'
  ].join('\n\n'), 0xF1C40F);
}

function faqOptions() {
  const labels = [
    'Comment commander ?','Quelle offre choisir ?','Différence Mini / Essentiel / Avancé / Premium ?','Comment demander un devis ?','Comment payer ?','Comment suivre une commande ?','Comment suivre un projet ?','Combien de temps prend un projet ?','Comment fonctionne l’hébergement ?','Après le mois offert Premium ?','Comment fonctionne la garantie ?','Mon bot a un bug, que faire ?','Puis-je modifier ma commande ?','Puis-je ajouter des fonctionnalités ?','Puis-je annuler ?','Comment recevoir ma livraison ?','Comment laisser un avis ?','Je n’ai pas reçu de MP.','Problème non résolu'
  ];
  return labels.map((label,i)=>({label,value:`q${i+1}`}));
}

function faqAnswer(value) {
  const a = {
    q1:'Utilise le panneau Commander, choisis une offre et complète le formulaire.',
    q2:'Mini convient aux petits besoins, Essentiel aux bots standards, Avancé aux projets plus complets, Premium aux projets complets avec serveur/configuration et 1 mois d’hébergement offert.',
    q3:'Mini ≈ 10 fonctionnalités, Essentiel ≈ 25, Avancé ≈ 50, Premium couvre le cahier des charges validé sans limite fixe annoncée.',
    q4:'Utilise Demander un devis. Un DEV-XXXX est créé avec un salon privé.',
    q5:'Le staff t’envoie le lien PayPal officiel. Clique ensuite sur J’ai payé et fournis ta référence/preuve.',
    q6:'Utilise Suivi commandes puis Mes commandes.',
    q7:'Utilise Suivi commandes puis Mes projets.',
    q8:'Le délai dépend du cahier des charges, de la complexité et des retours.',
    q9:'L’hébergement est proposé à 5 €/mois.',
    q10:'Après le mois offert Premium, l’hébergement passe à 5 €/mois.',
    q11:'La garantie technique dure 14 jours après livraison.',
    q12:'Utilise le panneau Garantie ou ouvre un ticket Bug/SAV.',
    q13:'Oui, mais une modification après validation peut nécessiter un nouveau devis.',
    q14:'Oui, mais les ajouts non prévus peuvent nécessiter un nouveau devis.',
    q15:'Une annulation dépend de l’état de la commande et du travail déjà effectué. Contacte le staff.',
    q16:'Les livraisons sont suivies dans Livraisons clients et en MP. Aucun secret ne sera publié en salon partagé.',
    q17:'Tu dois avoir au moins un projet réellement terminé puis utiliser le panneau Avis.',
    q18:'Vérifie que tes MP Discord sont ouverts puis contacte le support si nécessaire.',
    q19:'Ouvre un ticket Support.'
  };
  return a[value] || 'Réponse indisponible.';
}

function panelDefinition(key, c) {
  const defs = {
    reglement:['📜 Règlement officiel',RULES_TEXT,0x57F287],
    info:['📌 Informations','Bienvenue chez Creaty Bot. Utilise les panneaux dédiés pour devis, commandes, paiements, suivi et support.',0x3498DB],
    liens:['🔗 Nos liens',c?.settings?.linksText || 'Les liens officiels seront affichés ici dès leur configuration.',0x3498DB],
    faq:['❓ FAQ','Choisis une question dans le menu ci-dessous.',0xF1C40F],
    ticket:['🎫 Support','Tickets réservés à : Support, Bug, SAV / Garantie, Partenariat et Autre.',0x3498DB],
    suggestion:['💡 Suggestions','Propose une amélioration à l’équipe.',0xF1C40F],
    vos_bots:['🤖 Vos bots','Présente ton bot sans lien externe.',0x5865F2],
    creation_bot:['🤖 Création de bot','Découvre nos offres puis commande ou demande un devis.',0x5865F2],
    creation_serveur:['💬 Création de serveur Discord','Création ou refonte complète de serveurs Discord.',0x5865F2],
    hebergement:['🌐 Hébergement','Hébergement disponible à **5 €/mois**. Le Bot Premium inclut le premier mois.',0x3498DB],
    garantie:['📃 Garantie','Garantie technique de **14 jours après livraison**.',0x95A5A6],
    commander:['📝 Commander','Choisis ton offre puis remplis le formulaire.',0x5865F2],
    demander_devis:['💰 Demander un devis','Demande un devis personnalisé. Un salon privé de discussion sera créé si la catégorie est configurée.',0xF1C40F],
    suivi_commandes:['📦 Suivi','Consulte tes devis, commandes et projets.',0x3498DB],
    paiements:['💳 Paiements','Déclare un paiement effectué pour une commande.',0x2ECC71],
    conditions:['📜 Conditions','Une commande commence après validation et paiement. Les ajouts après validation peuvent nécessiter un nouveau devis. Garantie technique : 14 jours après livraison.',0x95A5A6],
    questions_commandes:['❓ Questions commandes','Choisis le type de problème.',0xF1C40F],
    avis:['⭐ Avis clients','Seuls les clients avec au moins un projet terminé peuvent publier un avis.',0xF1C40F],
    tests_dev:['🧪 Tests développement','Commence un test lié à un vrai numéro de projet ou consulte tes propres tests.',0x9B59B6],
    bugs:['🐞 Bugs','Déclare et suis les bugs liés aux projets.',0xED4245],
    statistiques_commerciales:['📊 Statistiques commerciales',statsText(),0x3498DB],
    objectifs:['🎯 Objectif mensuel',goalText(c),0xF1C40F],
    chiffre_affaires:['💶 Chiffre d’affaires',revenueText(),0x57F287],
    direction:['📊 Dashboard Direction',directionText(),0x5865F2],
    finance:['💶 Finance',financeText(),0x57F287],
    statistiques_globales:['🌐 Statistiques globales',globalStatsText(),0x3498DB],
    gestion_financiere:['🏦 Gestion financière',financeText(),0x57F287]
  };
  return defs[key] || null;
}

function panelComponents(key) {
  if (key==='reglement') return [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('rules_accept').setLabel('Accepter le règlement').setStyle(ButtonStyle.Success))];
  if (key==='ticket' || key==='support_premium') return [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(key==='support_premium'?'ticket_select_premium':'ticket_select').setPlaceholder('Choisir un type de ticket').addOptions(
    {label:'Support',value:'support'},{label:'Bug',value:'bug'},{label:'SAV / Garantie',value:'sav'},{label:'Partenariat',value:'partenariat'},{label:'Autre',value:'autre'}
  ))];
  if (['creation_bot','creation_serveur','hebergement'].includes(key)) return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('go_order').setLabel('Commander').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('go_quote').setLabel('Demander un devis').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('go_support').setLabel('Poser une question').setStyle(ButtonStyle.Secondary)
  )];
  if (key==='tarifs') return [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('go_order').setLabel('Commander').setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId('go_quote').setLabel('Demander un devis').setStyle(ButtonStyle.Primary))];
  if (key==='garantie') return [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('sav_open').setLabel('Ouvrir un SAV').setStyle(ButtonStyle.Primary))];
  if (key==='commander') return [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('order_offer_select').setPlaceholder('Choisir une offre').addOptions(
    {label:'Bot Mini — 15 €',value:'mini'},{label:'Bot Essentiel — 35 €',value:'essentiel'},{label:'Bot Avancé — 40 €',value:'avance'},{label:'Bot Premium — 60 €',value:'premium'},{label:'Hébergement — 5 €/mois',value:'hosting'},{label:'Projet sur mesure',value:'custom'}
  ))];
  if (key==='demander_devis') return [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('go_quote').setLabel('Demander un devis').setStyle(ButtonStyle.Primary))];
  if (key==='suivi_commandes') return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('track_quotes').setLabel('Mes devis').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('track_orders').setLabel('Mes commandes').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('track_projects').setLabel('Mes projets').setStyle(ButtonStyle.Success)
  )];
  if (key==='paiements') return [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('payment_declare').setLabel('J’ai payé').setStyle(ButtonStyle.Success))];
  if (key==='questions_commandes') return [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('order_question_select').setPlaceholder('Choisir une question').addOptions(
    {label:'Je ne comprends pas ma commande',value:'comprendre'},{label:'Où en est ma commande ?',value:'suivi'},{label:'Problème de paiement',value:'paiement'},{label:'Modifier ma commande',value:'modifier'},{label:'Annuler ma demande',value:'annuler'},{label:'Question sur mon devis',value:'devis'},{label:'Autre',value:'autre'}
  ))];
  if (key==='avis') return [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('review_open').setLabel('Laisser un avis').setStyle(ButtonStyle.Success))];
  if (key==='vos_bots') return [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('bot_showcase_open').setLabel('Présenter mon bot').setStyle(ButtonStyle.Primary))];
  if (key==='tests_dev') return [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('test_open').setLabel('Commencer un test').setStyle(ButtonStyle.Primary),new ButtonBuilder().setCustomId('test_mine').setLabel('Mes tests').setStyle(ButtonStyle.Secondary))];
  if (key==='bugs') return [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('bug_open').setLabel('Déclarer un bug').setStyle(ButtonStyle.Danger),new ButtonBuilder().setCustomId('bug_mine').setLabel('Mes bugs').setStyle(ButtonStyle.Secondary))];
  if (key==='faq') return [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('faq_select').setPlaceholder('Choisir une question').addOptions(faqOptions()))];
  return [];
}

async function upsertPanel(guild, key) {
  const c = getConfig(guild.id);
  const channelId = c.channels[key];
  if (!channelId) return false;
  const channel = await guild.channels.fetch(channelId).catch(()=>null);
  if (!channel?.isTextBased()) return false;
  let payload;
  if (key==='tarifs') payload = { embeds:[tariffsEmbed()], components:panelComponents(key) };
  else {
    const d = panelDefinition(key,c);
    if (!d) return false;
    payload = { embeds:[embed(d[0],d[1],d[2])], components:panelComponents(key) };
  }
  const oldId = c.panels[key];
  if (oldId) {
    try { const m=await channel.messages.fetch(oldId); await m.edit(payload); return true; }
    catch {}
  }
  const m = await channel.send(payload);
  setConfig(guild.id,'panels',key,m.id);
  return true;
}

const PANEL_KEYS = ['reglement','info','liens','faq','ticket','vos_bots','creation_bot','creation_serveur','hebergement','tarifs','garantie','commander','demander_devis','suivi_commandes','paiements','conditions','questions_commandes','avis','tests_dev','bugs','statistiques_commerciales','objectifs','chiffre_affaires','direction','finance','statistiques_globales','gestion_financiere'];

async function repairPanels(guild, updateExisting=false) {
  const c=getConfig(guild.id); let created=0, updated=0, skipped=0;
  for (const key of PANEL_KEYS) {
    if (!c.channels[key]) { skipped++; continue; }
    const had = Boolean(c.panels[key]);
    if (had && !updateExisting) {
      const ch=await guild.channels.fetch(c.channels[key]).catch(()=>null);
      if (ch?.isTextBased()) {
        try { await ch.messages.fetch(c.panels[key]); skipped++; continue; } catch {}
      }
    }
    const ok=await upsertPanel(guild,key).catch(async e=>{await logError(guild.id,e,`Panneau ${key}`);return false;});
    if (ok) had ? updated++ : created++;
  }
  return {created,updated,skipped};
}

async function createPrivateChannel(guild, categoryId, userId, name, c) {
  await ensureBotPermissions(guild,[PermissionFlagsBits.ManageChannels],'Création du salon privé');
  const overwrites=[
    {id:guild.roles.everyone.id,deny:[PermissionFlagsBits.ViewChannel]},
    {id:userId,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles]}
  ];
  const staffKeys=['pole_fondation','fondateur','cofondateur','pole_direction','directeur_general','directeur','pole_commercial','responsable_commercial','commercial','support_client','responsable_paiement','pole_moderation','administrateur','moderateur'];
  for(const roleId of configuredRoleIds(c,staffKeys)) overwrites.push({id:roleId,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles]});
  return guild.channels.create({name:name.toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,90),type:ChannelType.GuildText,parent:categoryId||undefined,permissionOverwrites:overwrites});
}

function quoteEmbed(q){return embed(`💰 ${q.id} — ${q.projectName}`,[`Client : <@${q.userId}>`,`Service : **${q.service}**`,`Prix : **${q.price==null?'À définir':`${Number(q.price).toFixed(2)} €`}**`,`Statut : **${q.status}**`,`Responsable : ${q.claimedBy?`<@${q.claimedBy}>`:'Aucun'}`,`Salon privé : ${q.privateChannelId?`<#${q.privateChannelId}>`:'Non créé'}`,'',q.description].join('\n'),0xF1C40F)}
function quoteControls(q){
  if(q.status==='Archivé')return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`quote_restore:${q.id}`).setLabel('Reprendre le devis').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`quote_delete:${q.id}`).setLabel('Supprimer définitivement').setStyle(ButtonStyle.Danger)
  )];
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`quote_claim:${q.id}`).setLabel('Prendre').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`quote_price:${q.id}`).setLabel(q.price==null?'Définir le prix':'Modifier le prix').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`quote_send:${q.id}`).setLabel('Envoyer au client').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`quote_contact:${q.id}`).setLabel('Contacter').setStyle(ButtonStyle.Secondary)
  ),new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`quote_order:${q.id}`).setLabel('Transformer en commande').setStyle(ButtonStyle.Success).setDisabled(q.status!=='Accepté par le client'),
    new ButtonBuilder().setCustomId(`quote_refuse:${q.id}`).setLabel('Refuser').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`quote_archive:${q.id}`).setLabel('Archiver').setStyle(ButtonStyle.Secondary)
  )];
}


async function recoverOrderFromInteractionMessage(interaction,expectedId){
  try{
    const msg=interaction.message;
    const rawEmbed=msg?.embeds?.[0];
    if(!rawEmbed)return null;

    const title=rawEmbed.title||'';
    const description=rawEmbed.description||'';

    const titleMatch=title.match(/(CMD-\d+)\s*[—-]\s*(.+)$/i);
    const id=(titleMatch?.[1]||expectedId||'').toUpperCase();
    if(!id||id!==String(expectedId||id).toUpperCase())return null;

    const projectName=(titleMatch?.[2]||'Projet récupéré').trim();

    const userId=description.match(/Client\s*:\s*<@!?(\d+)>/i)?.[1]||null;
    if(!userId)return null;

    const offerLabel=description.match(/Offre\s*:\s*\*\*(.+?)\*\*/i)?.[1]
      ||description.match(/Offre\s*:\s*(.+)/i)?.[1]?.trim()
      ||'Projet sur mesure';

    const priceText=description.match(/Prix\s*:\s*\*\*?([0-9]+(?:[.,][0-9]+)?)\s*€/i)?.[1]
      ||description.match(/Prix\s*:\s*([0-9]+(?:[.,][0-9]+)?)\s*€/i)?.[1]
      ||null;

    const status=description.match(/Statut\s*:\s*\*\*(.+?)\*\*/i)?.[1]
      ||description.match(/Statut\s*:\s*(.+)/i)?.[1]?.trim()
      ||'En attente';

    const paymentStatus=description.match(/Paiement\s*:\s*\*\*(.+?)\*\*/i)?.[1]
      ||description.match(/Paiement\s*:\s*(.+)/i)?.[1]?.trim()
      ||'Non envoyé';

    const responsible=description.match(/Responsable\s*:\s*<@!?(\d+)>/i)?.[1]||null;
    const projectId=description.match(/Projet\s*:\s*\*\*(PROJ-\d+)\*\*/i)?.[1]
      ||description.match(/Projet\s*:\s*(PROJ-\d+)/i)?.[1]
      ||null;

    const recovered={
      id,
      guildId:interaction.guildId,
      userId,
      offerKey:'custom',
      offerLabel,
      projectName,
      service:offerLabel,
      description:'Commande récupérée automatiquement depuis sa fiche Discord.',
      price:priceText?Number(priceText.replace(',','.')):null,
      quoteId:null,
      status,
      paymentStatus,
      claimedBy:responsible,
      projectId,
      messageId:msg.id,
      recoveredFromDiscord:true,
      recoveredAt:new Date().toISOString(),
      createdAt:msg.createdAt?.toISOString?.()||new Date().toISOString()
    };

    const db=getDb();
    db.orders[id]=recovered;

    // Recaler le compteur pour éviter de recréer plus tard CMD-0005.
    const n=Number(id.split('-')[1]);
    if(Number.isFinite(n)){
      db.counters.orders=Math.max(db.counters.orders||0,n);
    }

    writeJson(DB_FILE,db);
    await journal(interaction.guildId,`${id} récupérée automatiquement depuis une ancienne fiche Discord.`);
    return recovered;
  }catch(error){
    await logError(interaction.guildId,error,`Récupération automatique commande ${expectedId}`);
    return null;
  }
}

function orderEmbed(o){return embed(`📦 ${o.id} — ${o.projectName}`,[`Client : <@${o.userId}>`,`Offre : **${o.offerLabel||o.service}**`,`Prix : **${o.price==null?'À définir':`${Number(o.price).toFixed(2)} €`}**`,`Statut : **${o.status}**`,`Paiement : **${o.paymentStatus}**`,`Responsable : ${o.claimedBy?`<@${o.claimedBy}>`:'Aucun'}`,`Projet : **${o.projectId||'Non créé'}**`].join('\n'),0x3498DB)}
function orderControls(o){
  if(o.status==='Archivée')return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`order_restore:${o.id}`).setLabel('Reprendre la commande').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`order_delete:${o.id}`).setLabel('Supprimer définitivement').setStyle(ButtonStyle.Danger)
  )];
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`order_claim:${o.id}`).setLabel('Prendre').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`order_accept:${o.id}`).setLabel('Accepter').setStyle(ButtonStyle.Success).setDisabled(!['En attente','Prise en charge'].includes(o.status)),
    new ButtonBuilder().setCustomId(`order_refuse:${o.id}`).setLabel('Refuser').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`order_contact:${o.id}`).setLabel('Contacter').setStyle(ButtonStyle.Secondary)
  ),new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`order_pay:${o.id}`).setLabel('Envoyer paiement').setStyle(ButtonStyle.Success).setDisabled(o.status!=='Acceptée'),
    new ButtonBuilder().setCustomId(`order_archive:${o.id}`).setLabel('Archiver').setStyle(ButtonStyle.Secondary)
  )];
}

function isDeliveryStageIndex(index){
  return PROJECT_STAGES[index]?.key==='livraisons_projets';
}

function buildDeliveryModal(projectId){
  const modal=new ModalBuilder()
    .setCustomId(`project_delivery_modal:${projectId}`)
    .setTitle('Livrer le projet');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('delivery_link')
        .setLabel('Lien de livraison')
        .setPlaceholder('https://...')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('delivery_message')
        .setLabel('Petit message pour le client')
        .setPlaceholder('Merci pour votre confiance !')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
    )
  );

  return modal;
}

function projectEmbed(p){const s=PROJECT_STAGES[p.stageIndex];return embed(`${s.emoji} ${p.id} — ${p.projectName}`,[`Client : <@${p.userId}>`,`Commande : **${p.orderId}**`,`Offre : **${p.offerLabel||'—'}**`,`Responsable : ${p.claimedBy?`<@${p.claimedBy}>`:'Aucun'}`,`Étape : **${s.label}**`,`Progression : **${s.progress}%**`,p.deliveryLink?`Lien de livraison : ${p.deliveryLink}`:null].filter(Boolean).join('\n'))}
function projectControls(p){return [new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`project_claim:${p.id}`).setLabel('Prendre le projet').setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId(`project_prev:${p.id}`).setLabel('Étape précédente').setStyle(ButtonStyle.Secondary).setDisabled(p.stageIndex<=0),
  new ButtonBuilder().setCustomId(`project_next:${p.id}`).setLabel('Étape suivante').setStyle(ButtonStyle.Success).setDisabled(p.stageIndex>=PROJECT_STAGES.length-1),
  new ButtonBuilder().setCustomId(`project_contact:${p.id}`).setLabel('Contacter le client').setStyle(ButtonStyle.Secondary)
),new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`project_stage:${p.id}`).setPlaceholder('Choisir une étape').addOptions(PROJECT_STAGES.map((s,i)=>({label:s.label,value:String(i),emoji:s.emoji,default:p.stageIndex===i}))))]}

function testEmbed(t){return embed(`🧪 ${t.id} — ${t.projectId}`,`Testeur : <@${t.userId}>\nProjet : **${t.projectId}**\nVersion : **${t.version}**\nStatut : **${t.status}**\n\n**Objectif :** ${t.objective}\n\n**Méthode :** ${t.method}\n\n**Résultat :** ${t.result||'—'}\n\n**Conclusion :** ${t.conclusion||'—'}`,0x9B59B6)}
function testControls(t){return [new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`test_status:${t.id}:En cours`).setLabel('En cours').setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId(`test_status:${t.id}:Réussi`).setLabel('Réussi').setStyle(ButtonStyle.Success),
  new ButtonBuilder().setCustomId(`test_status:${t.id}:Échec`).setLabel('Échec').setStyle(ButtonStyle.Danger),
  new ButtonBuilder().setCustomId(`test_status:${t.id}:À retester`).setLabel('À retester').setStyle(ButtonStyle.Secondary)
)]}

function bugEmbed(b){return embed(`🐞 ${b.id} — ${b.projectId}`,`Auteur : <@${b.userId}>\nProjet : **${b.projectId}**\nGravité : **${b.severity}**\nResponsable : ${b.claimedBy?`<@${b.claimedBy}>`:'Aucun'}\nStatut : **${b.status}**\n\n**Description :** ${b.description}\n\n**Reproduction :** ${b.steps}`,0xED4245)}
function bugControls(b){return [new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`bug_status:${b.id}:Confirmé`).setLabel('Confirmé').setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId(`bug_status:${b.id}:En correction`).setLabel('En correction').setStyle(ButtonStyle.Secondary),
  new ButtonBuilder().setCustomId(`bug_status:${b.id}:À tester`).setLabel('À tester').setStyle(ButtonStyle.Secondary),
  new ButtonBuilder().setCustomId(`bug_status:${b.id}:Corrigé`).setLabel('Corrigé').setStyle(ButtonStyle.Success),
  new ButtonBuilder().setCustomId(`bug_status:${b.id}:Fermé`).setLabel('Fermé').setStyle(ButtonStyle.Danger)
)]}

function designEmbed(d){return embed(`🎨 ${d.id} — ${d.title}`,`Type : **${d.type}**\nClient : ${d.userId?`<@${d.userId}>`:'Interne'}\nResponsable : ${d.claimedBy?`<@${d.claimedBy}>`:'Aucun'}\nStatut : **${d.status}**\n\n${d.description||''}`,0xE91E63)}
function designControls(d){return [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`design_stage:${d.id}`).setPlaceholder('Changer le statut').addOptions(DESIGN_STAGES.map(s=>({label:s,value:s,default:d.status===s}))))]}

async function saveCard(guild, channelKey, item, renderEmbed, renderControls, messageField='messageId') {
  const c=getConfig(guild.id); const ch=await guild.channels.fetch(c.channels[channelKey]).catch(()=>null);
  if(!ch || typeof ch.isTextBased!=='function' || !ch.isTextBased()) throw new Error(`Salon ${channelKey} non configuré.`);
  if(item[messageField]) { try { const m=await ch.messages.fetch(item[messageField]); await m.edit({embeds:[renderEmbed(item)],components:renderControls(item)}); return m; } catch{} }
  const m=await ch.send({embeds:[renderEmbed(item)],components:renderControls(item)}); item[messageField]=m.id; return m;
}

async function saveQuoteCard(guild,q){await saveCard(guild,'devis_commerciaux',q,quoteEmbed,quoteControls);const db=getDb();db.quotes[q.id]=q;writeJson(DB_FILE,db)}
async function saveOrderCard(guild,o){await saveCard(guild,'commandes_commerciales',o,orderEmbed,orderControls);const db=getDb();db.orders[o.id]=o;writeJson(DB_FILE,db)}

async function notifyQuoteClient(q,title,description){
  return sendDm(q.userId,{embeds:[embed(title,description,0xF1C40F)]});
}
async function notifyOrderClient(o,title,description){
  return sendDm(o.userId,{embeds:[embed(title,description,0x3498DB)]});
}

async function moveCardToArchive(guild,item,type){
  const c=getConfig(guild.id);
  const isQuote=type==='quote';
  const sourceKey=isQuote?'devis_commerciaux':'commandes_commerciales';
  const archiveKey=isQuote?'archives_devis':'archives_commandes';
  const archiveChannel=await guild.channels.fetch(c.channels[archiveKey]).catch(()=>null);
  if(!archiveChannel || typeof archiveChannel.isTextBased!=='function' || !archiveChannel.isTextBased())throw new Error(`Salon ${archiveKey} non configuré.`);

  const sourceChannel=await guild.channels.fetch(c.channels[sourceKey]).catch(()=>null);
  if(sourceChannel?.isTextBased()&&item.messageId){
    try{
      const old=await sourceChannel.messages.fetch(item.messageId);
      await old.delete();
    }catch{}
  }

  item.previousStatus=item.previousStatus||item.status;
  item.archivedAt=new Date().toISOString();
  item.messageId=null;

  const payload={embeds:[isQuote?quoteEmbed(item):orderEmbed(item)],components:isQuote?quoteControls(item):orderControls(item)};
  const archivedMessage=await archiveChannel.send(payload);
  item.archiveMessageId=archivedMessage.id;
  item.archiveChannelId=archiveChannel.id;
}

async function restoreArchivedCard(guild,item,type){
  const c=getConfig(guild.id);
  const isQuote=type==='quote';
  const archiveKey=isQuote?'archives_devis':'archives_commandes';
  const sourceKey=isQuote?'devis_commerciaux':'commandes_commerciales';

  const archiveChannel=await guild.channels.fetch(item.archiveChannelId||c.channels[archiveKey]).catch(()=>null);
  if(archiveChannel?.isTextBased()&&item.archiveMessageId){
    try{
      const old=await archiveChannel.messages.fetch(item.archiveMessageId);
      await old.delete();
    }catch{}
  }

  item.status=item.previousStatus||(isQuote?'Nouveau':'En attente');
  item.previousStatus=null;
  item.archivedAt=null;
  item.archiveMessageId=null;
  item.archiveChannelId=null;
  item.messageId=null;

  await saveCard(guild,sourceKey,item,isQuote?quoteEmbed:orderEmbed,isQuote?quoteControls:orderControls);
}

function archiveDeleteAllowed(item){
  if(!item.archivedAt)return false;
  const age=Date.now()-new Date(item.archivedAt).getTime();
  return age>=14*24*60*60*1000;
}

async function deleteArchivedCard(guild,item,type){
  const c=getConfig(guild.id);
  const isQuote=type==='quote';
  const archiveKey=isQuote?'archives_devis':'archives_commandes';
  const archiveChannel=await guild.channels.fetch(item.archiveChannelId||c.channels[archiveKey]).catch(()=>null);
  if(archiveChannel?.isTextBased()&&item.archiveMessageId){
    try{
      const old=await archiveChannel.messages.fetch(item.archiveMessageId);
      await old.delete();
    }catch{}
  }
}


async function saveProjectCards(guild,p){
  const c=getConfig(guild.id), s=PROJECT_STAGES[p.stageIndex];
  const list=await guild.channels.fetch(c.channels.liste_projets).catch(()=>null); if(!list || typeof list.isTextBased!=='function' || !list.isTextBased()) throw new Error('Salon Liste des projets non configuré.');
  if(p.listMessageId){try{const m=await list.messages.fetch(p.listMessageId);await m.edit({embeds:[projectEmbed(p)],components:projectControls(p)});}catch{p.listMessageId=null}}
  if(!p.listMessageId){const m=await list.send({embeds:[projectEmbed(p)],components:projectControls(p)});p.listMessageId=m.id}
  const stageCh=await guild.channels.fetch(c.channels[s.key]).catch(()=>null); if(!stageCh || typeof stageCh.isTextBased!=='function' || !stageCh.isTextBased()) throw new Error(`Salon ${s.label} non configuré.`);
  if(p.stageMessageId&&p.stageChannelId&&p.stageChannelId!==stageCh.id){try{const old=await guild.channels.fetch(p.stageChannelId);const m=await old.messages.fetch(p.stageMessageId);await m.delete()}catch{}p.stageMessageId=null;p.stageChannelId=null}
  if(p.stageMessageId){try{const m=await stageCh.messages.fetch(p.stageMessageId);await m.edit({embeds:[projectEmbed(p)],components:projectControls(p)});}catch{p.stageMessageId=null}}
  if(!p.stageMessageId){const m=await stageCh.send({embeds:[projectEmbed(p)],components:projectControls(p)});p.stageMessageId=m.id;p.stageChannelId=stageCh.id}
  const db=getDb();db.projects[p.id]=p;writeJson(DB_FILE,db);
}


async function syncProjectCardsSafe(guild,p,context='Synchronisation projet'){
  try{
    await saveProjectCards(guild,p);
    return true;
  }catch(error){
    await logError(guild.id,error,`${context} ${p.id}`).catch(()=>{});
    return false;
  }
}

async function createDeliveryIfNeeded(guild,p){
  if(PROJECT_STAGES[p.stageIndex].key!=='livraisons_projets') return null;
  const db=getDb(); const existing=Object.values(db.deliveries).find(x=>x.projectId===p.id); if(existing) return existing;
  const id=nextId('deliveries','LIV'); const d={id,guildId:guild.id,userId:p.userId,projectId:p.id,orderId:p.orderId,status:'À livrer',createdAt:new Date().toISOString()};
  const latest=getDb();latest.deliveries[id]=d;writeJson(DB_FILE,latest);
  const c=getConfig(guild.id);const ch=await guild.channels.fetch(c.channels.livraisons_clients).catch(()=>null);if(ch && typeof ch.isTextBased==='function' && ch.isTextBased())await ch.send({embeds:[embed(`📦 ${id}`,`Client : <@${p.userId}>\nProjet : **${p.id}**\nCommande : **${p.orderId}**\nStatut : **À livrer**\n\nLes informations sensibles doivent être transmises en privé.`)]});
  await journal(guild.id,`${id} créée`);return d;
}

async function changeProjectStage(guild,p,newIndex){
  if(!Number.isInteger(newIndex)||newIndex<0||newIndex>=PROJECT_STAGES.length)throw new Error('Étape de projet invalide.');
  if(newIndex===p.stageIndex)return false;

  const old=PROJECT_STAGES[p.stageIndex];
  const now=PROJECT_STAGES[newIndex];

  p.stageIndex=newIndex;
  p.updatedAt=new Date().toISOString();

  const db=getDb();
  db.projects[p.id]=p;

  // Synchroniser aussi le statut de la commande liée.
  const order=db.orders[p.orderId];
  if(order){
    const orderStatusByStage={
      projets_attente:'Projet créé',
      analyse:'En analyse',
      developpement:'En développement',
      tests_projets:'En tests',
      corrections:'En corrections',
      termines:'Terminée',
      livraisons_projets:'En livraison',
      archives:'Archivée'
    };
    order.status=orderStatusByStage[now.key]||order.status;
    db.orders[order.id]=order;
  }
  writeJson(DB_FILE,db);

  // Déplace réellement la fiche : suppression dans l'ancien salon d'étape,
  // mise à jour de la fiche principale et création dans le nouveau salon.
  await syncProjectCardsSafe(guild,p,'Changement étape projet');

  if(order){
    try{await saveOrderCard(guild,getDb().orders[order.id])}
    catch(error){await logError(guild.id,error,`Mise à jour commande liée ${order.id}`).catch(()=>{})}
  }

  await createDeliveryIfNeeded(guild,p).catch(error=>logError(guild.id,error,`Création livraison ${p.id}`));

  let clientMsg=
    `Votre projet **${p.id} — ${p.projectName}** vient d'être mis à jour.\n\n`+
    `Ancienne étape : **${old.label}**\n`+
    `Nouvelle étape : **${now.label}**\n`+
    `Progression : **${now.progress}%**`;

  if(now.key==='analyse')clientMsg+='\n\nNotre équipe analyse maintenant votre demande et prépare le développement.';
  if(now.key==='developpement')clientMsg+='\n\nLe développement de votre projet a commencé.';
  if(now.key==='tests_projets')clientMsg+='\n\nVotre projet est maintenant en phase de tests.';
  if(now.key==='corrections')clientMsg+='\n\nNotre équipe applique actuellement les corrections nécessaires.';
  if(now.key==='termines')clientMsg+='\n\n✅ Votre projet est terminé. Il se prépare maintenant pour la livraison.';
  if(now.key==='livraisons_projets'&&!p.deliveryLink)clientMsg+='\n\n📦 Votre commande est maintenant en cours de livraison.';
  if(now.key==='archives')clientMsg+='\n\n📁 Votre projet a été archivé. Son historique reste enregistré.';

  await sendDm(p.userId,{embeds:[embed(`🚀 Mise à jour ${p.id}`,clientMsg,0x3498DB)]});
  await journal(guild.id,`${p.id} passé de ${old.label} à ${now.label}`);
  return true;
}

async function grantProspect(guild,userId){const c=getConfig(guild.id);const m=await getMember(guild,userId);if(!m)return;for(const key of ['pole_clientele','prospect'])if(c.roles[key]&&!m.roles.cache.has(c.roles[key]))await applyRole(m,c.roles[key],'add',guild.id,key).catch(e=>logError(guild.id,e,'Attribution Prospect'));}
async function grantClient(guild,userId,premium=false){const c=getConfig(guild.id);const m=await getMember(guild,userId);if(!m)return;if(c.roles.prospect&&m.roles.cache.has(c.roles.prospect))await applyRole(m,c.roles.prospect,'remove',guild.id,'Prospect').catch(()=>{});for(const key of ['pole_clientele','client'])if(c.roles[key]&&!m.roles.cache.has(c.roles[key]))await applyRole(m,c.roles[key],'add',guild.id,key);if(premium&&c.roles.client_premium&&!m.roles.cache.has(c.roles.client_premium))await applyRole(m,c.roles.client_premium,'add',guild.id,'Client Premium');}

async function createQuote(guild,userId,projectName,service,description){
  await grantProspect(guild,userId);const c=getConfig(guild.id);const id=nextId('quotes','DEV');let privateCh=null;if(c.categories.devis)privateCh=await createPrivateChannel(guild,c.categories.devis,userId,`devis-${id.toLowerCase()}`,c);
  const q={id,guildId:guild.id,userId,projectName,service,description,price:null,status:'Nouveau',claimedBy:null,orderId:null,messageId:null,privateChannelId:privateCh?.id||null,createdAt:new Date().toISOString()};
  const db=getDb();db.quotes[id]=q;writeJson(DB_FILE,db);await saveQuoteCard(guild,q);if(privateCh)await privateCh.send({content:`<@${userId}>`,embeds:[embed(`💰 Discussion privée — ${id}`,`Ce salon est lié au devis **${id}**.`)]});await sendDm(userId,{embeds:[embed(`💰 Devis ${id} créé`,`Ta demande pour **${projectName}** a été reçue.${privateCh?`\nSalon privé : <#${privateCh.id}>`:''}`,0xF1C40F)]});await journal(guild.id,`${id} créé`);return q;
}

async function createOrder(guild,userId,offerKey,projectName,service,description,price=null,quoteId=null){
  await grantProspect(guild,userId);const id=nextId('orders','CMD');const offer=PRICES[offerKey];const o={id,guildId:guild.id,userId,offerKey,offerLabel:offer?.label||service,projectName,service,description,price:price??offer?.price??null,quoteId,status:'En attente',paymentStatus:'Non envoyé',claimedBy:null,projectId:null,messageId:null,createdAt:new Date().toISOString()};
  const db=getDb();db.orders[id]=o;if(quoteId&&db.quotes[quoteId]){db.quotes[quoteId].status='Transformé en commande';db.quotes[quoteId].orderId=id}writeJson(DB_FILE,db);await saveOrderCard(guild,o);if(quoteId)await saveQuoteCard(guild,getDb().quotes[quoteId]);await sendDm(userId,{embeds:[embed(`📦 Commande ${id} reçue`,quoteId?`Merci pour votre confiance. Votre devis **${quoteId}** a été transformé en commande **${id}**.\n\nProjet : **${projectName}**\nStatut : **En attente**`:`Ta commande **${o.offerLabel}** pour **${projectName}** a été envoyée à notre équipe.\nStatut : **En attente**`)]});await journal(guild.id,`${id} créée`);return o;
}

async function createProject(guild,o){
  const db=getDb();

  // Idempotence : retrouver un projet déjà lié à la commande, même si order.projectId
  // n'a pas été sauvegardé correctement lors d'une ancienne tentative.
  let existing=null;
  if(o.projectId&&db.projects[o.projectId])existing=db.projects[o.projectId];
  if(!existing)existing=Object.values(db.projects).find(p=>p.guildId===guild.id&&p.orderId===o.id)||null;

  if(existing){
    if(db.orders[o.id]&&db.orders[o.id].projectId!==existing.id){
      db.orders[o.id].projectId=existing.id;
      db.orders[o.id].status='Projet créé';
      writeJson(DB_FILE,db);
    }
    await syncProjectCardsSafe(guild,existing,'Réparation fiches projet');
    return existing;
  }

  const id=nextId('projects','PROJ');
  const p={
    id,
    guildId:guild.id,
    userId:o.userId,
    orderId:o.id,
    offerLabel:o.offerLabel,
    projectName:o.projectName,
    stageIndex:0,
    claimedBy:null,
    listMessageId:null,
    stageMessageId:null,
    stageChannelId:null,
    createdAt:new Date().toISOString(),
    updatedAt:new Date().toISOString()
  };

  const latest=getDb();
  latest.projects[id]=p;
  if(latest.orders[o.id]){
    latest.orders[o.id].projectId=id;
    latest.orders[o.id].status='Projet créé';
  }
  writeJson(DB_FILE,latest);

  // Les données du projet existent même si un salon n'est pas encore configuré.
  await syncProjectCardsSafe(guild,p,'Création fiches projet');

  const orderNow=getDb().orders[o.id];
  if(orderNow){
    try{await saveOrderCard(guild,orderNow)}catch(error){await logError(guild.id,error,`Mise à jour commande ${o.id} après création projet`).catch(()=>{})}
  }

  await sendDm(p.userId,{embeds:[embed(
    `🚀 Projet ${id} créé`,
    `Merci pour votre confiance.\n\nVotre paiement a été validé et votre commande **${o.id}** est devenue le projet **${id}**.\nÉtape actuelle : **En attente**.\n\nVous serez informé en MP à chaque changement d'étape.`
  )]});

  await journal(guild.id,`${id} créé depuis ${o.id}`);
  return p;
}

async function upsertClient(guild,o,amount,premium){
  const db=getDb();let cl=Object.values(db.clients).find(x=>x.guildId===guild.id&&x.userId===o.userId);let isNew=false;
  if(!cl){const id=nextId('clients','CLIENT');cl={id,guildId:guild.id,userId:o.userId,status:'Client',premium:Boolean(premium),firstOrderId:o.id,orderCount:0,totalSpent:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),messageId:null};isNew=true;}
  cl.orderCount=(cl.orderCount||0)+1;cl.totalSpent=(cl.totalSpent||0)+Number(amount||0);cl.premium=Boolean(cl.premium||premium);cl.updatedAt=new Date().toISOString();
  const latest=getDb();latest.clients[cl.id]=cl;writeJson(DB_FILE,latest);const c=getConfig(guild.id);const ch=await guild.channels.fetch(c.channels.liste_clients).catch(()=>null);if(ch && typeof ch.isTextBased==='function' && ch.isTextBased()){const e=embed(`👤 ${cl.id}`,`Utilisateur : <@${cl.userId}>\nStatut : **Client**\nPremium : **${cl.premium?'Oui':'Non'}**\nPremière commande : **${cl.firstOrderId}**\nNombre de commandes : **${cl.orderCount}**\nTotal dépensé : **${cl.totalSpent.toFixed(2)} €**`);if(cl.messageId){try{const m=await ch.messages.fetch(cl.messageId);await m.edit({embeds:[e]})}catch{cl.messageId=null}}if(!cl.messageId){const m=await ch.send({embeds:[e]});cl.messageId=m.id;const db2=getDb();db2.clients[cl.id]=cl;writeJson(DB_FILE,db2)}}
  if(isNew){const n=await guild.channels.fetch(c.channels.nouveaux_clients).catch(()=>null);if(n?.isTextBased())await n.send({embeds:[embed(`🆕 ${cl.id}`,`Nouveau client : <@${cl.userId}>`)]});await journal(guild.id,`${cl.id} créé`)}
  if(cl.premium){const pch=await guild.channels.fetch(c.channels.clients_premium).catch(()=>null);if(pch?.isTextBased()&&!cl.premiumAnnounced){await pch.send({embeds:[embed(`⭐ Client Premium`, `<@${cl.userId}> est maintenant Client Premium.`)]});cl.premiumAnnounced=true;const db3=getDb();db3.clients[cl.id]=cl;writeJson(DB_FILE,db3)}}
  return cl;
}

async function createSale(guild,o,amount){
  const db=getDb();const existing=Object.values(db.sales).find(x=>x.orderId===o.id);if(existing)return existing;
  const id=nextId('sales','VENTE');const s={id,guildId:guild.id,userId:o.userId,orderId:o.id,projectId:o.projectId||null,offer:o.offerLabel,amount:Number(amount||0),responsibleId:o.claimedBy||null,createdAt:new Date().toISOString()};const latest=getDb();latest.sales[id]=s;writeJson(DB_FILE,latest);const c=getConfig(guild.id);const ch=await guild.channels.fetch(c.channels.ventes).catch(()=>null);if(ch && typeof ch.isTextBased==='function' && ch.isTextBased())await ch.send({embeds:[embed(`💶 ${id}`,`Client : <@${s.userId}>\nCommande : **${s.orderId}**\nProjet : **${s.projectId||'À créer'}**\nOffre : **${s.offer}**\nMontant : **${s.amount.toFixed(2)} €**\nResponsable : ${s.responsibleId?`<@${s.responsibleId}>`:'Aucun'}`,0x57F287)]});await journal(guild.id,`${id} créée`);return s;
}

async function createInvoice(guild,o,amount){
  const db=getDb();const existing=Object.values(db.invoices).find(x=>x.orderId===o.id);if(existing)return existing;
  const id=nextId('invoices','FACT');const f={id,guildId:guild.id,userId:o.userId,orderId:o.id,amount:Number(amount||0),status:'Payé',createdAt:new Date().toISOString()};const latest=getDb();latest.invoices[id]=f;writeJson(DB_FILE,latest);const c=getConfig(guild.id);const ch=await guild.channels.fetch(c.channels.factures).catch(()=>null);if(ch && typeof ch.isTextBased==='function' && ch.isTextBased())await ch.send({embeds:[embed(`🧾 ${id}`,`Client : <@${f.userId}>\nCommande : **${f.orderId}**\nMontant : **${f.amount.toFixed(2)} €**\nStatut : **Payé**`,0x3498DB)]});await journal(guild.id,`${id} créée`);return f;
}



function buildPaymentReviewPayload(payment,order){
  return {
    embeds:[embed(
      `💳 ${payment.id}`,
      `Commande : **${payment.orderId}**\n`+
      `Client : <@${payment.userId}>\n`+
      `Montant attendu : **${order?.price==null?'Non défini':`${Number(order.price).toFixed(2)} €`}**\n`+
      `Statut : **${payment.status}**\n\n`+
      `Preuve / référence :\n${payment.proof||'Aucune preuve fournie'}`,
      0xF39C12
    )],
    components:[new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`payment_accept:${payment.id}`).setLabel('Valider').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`payment_refuse:${payment.id}`).setLabel('Refuser').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`payment_newproof:${payment.id}`).setLabel('Nouvelle preuve').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`payment_contact:${payment.id}`).setLabel('Contacter').setStyle(ButtonStyle.Secondary)
    )]
  };
}

async function notifyFoundationPaymentDM(guild,payment,paymentPayload){
  const c=getConfig(guild.id);
  const foundationRoleIds=[c.roles.pole_fondation,c.roles.fondateur,c.roles.cofondateur].filter(Boolean);
  if(!foundationRoleIds.length)return {sent:0,failed:0};

  await guild.members.fetch().catch(()=>{});
  const members=[...guild.members.cache.values()].filter(member=>
    !member.user.bot &&
    foundationRoleIds.some(roleId=>member.roles.cache.has(roleId))
  );

  let sent=0,failed=0;
  for(const member of members){
    try{
      await member.send({
        content:`💳 **Nouveau paiement à confirmer — ${payment.id}**`,
        embeds:paymentPayload.embeds,
        components:paymentPayload.components
      });
      sent++;
    }catch{
      failed++;
    }
  }
  return {sent,failed};
}

async function validatePayment(guild,paymentId,staffId){
  let db=getDb();
  const pay=db.payments[paymentId];
  if(!pay)throw new Error('Paiement introuvable.');

  const o=db.orders[pay.orderId];
  if(!o)throw new Error('Commande liée introuvable.');

  // Si tout le parcours a déjà été exécuté, ne créer aucun doublon.
  if(pay.status==='Validé'&&pay.processed){
    const existingProject=o.projectId?db.projects[o.projectId]:Object.values(db.projects).find(p=>p.orderId===o.id);
    return {already:true,pay,project:existingProject||null,order:o};
  }

  // Marquer le paiement comme validé, mais processed reste false jusqu'à la fin.
  pay.status='Validé';
  pay.validatedBy=staffId;
  pay.validatedAt=pay.validatedAt||new Date().toISOString();
  pay.processed=false;
  o.status='Payée';
  o.paymentStatus='Validé';
  db.payments[paymentId]=pay;
  db.orders[o.id]=o;
  writeJson(DB_FILE,db);

  // Une erreur de hiérarchie Discord sur les rôles ne doit jamais empêcher
  // la création du projet après paiement.
  try{
    await grantClient(guild,o.userId,o.offerKey==='premium');
  }catch(error){
    await logError(guild.id,error,`Attribution rôles client après ${paymentId}`).catch(()=>{});
  }

  const clientRec=await upsertClient(guild,o,o.price||0,o.offerKey==='premium');

  // Création/récupération idempotente du projet.
  const project=await createProject(guild,getDb().orders[o.id]);

  // Création idempotente vente + facture.
  const latestAfterProject=getDb();
  const orderNow=latestAfterProject.orders[o.id];
  await createSale(guild,{...orderNow,projectId:project.id},orderNow.price||0);
  await createInvoice(guild,orderNow,orderNow.price||0);

  // Finaliser seulement lorsque le parcours essentiel est terminé.
  db=getDb();
  if(db.payments[paymentId]){
    db.payments[paymentId].processed=true;
    db.payments[paymentId].projectId=project.id;
  }
  if(db.orders[o.id]){
    db.orders[o.id].projectId=project.id;
    db.orders[o.id].status='Projet créé';
  }
  writeJson(DB_FILE,db);

  try{await saveOrderCard(guild,getDb().orders[o.id])}
  catch(error){await logError(guild.id,error,`Actualisation commande ${o.id}`).catch(()=>{})}

  await refreshBusinessPanels(guild).catch(error=>logError(guild.id,error,'Actualisation statistiques après paiement'));

  await sendDm(o.userId,{embeds:[embed(
    `✅ Paiement ${paymentId} validé`,
    `Votre paiement a été confirmé par la Fondation.\n\n`+
    `Commande : **${o.id}**\n`+
    `Statut : **Payée**\n`+
    `Projet créé : **${project.id}**\n`+
    `Étape actuelle : **En attente**\n\n`+
    `Merci pour votre confiance. Vous recevrez désormais un MP à chaque avancée de votre projet.`,
    0x57F287
  )]});

  await journal(guild.id,`${paymentId} validé → ${o.id} → ${project.id}`);
  return {already:false,pay:getDb().payments[paymentId],project,order:getDb().orders[o.id],clientRec};
}

async function createTicket(guild,userId,type,premium=false,linkedOrderId=null){
  const c=getConfig(guild.id);const cat=premium&&c.categories.tickets_premium?c.categories.tickets_premium:c.categories.tickets;if(!cat)throw new Error('Catégorie Tickets non configurée.');
  const id=nextId('tickets','TICKET');const ch=await createPrivateChannel(guild,cat,userId,`${type}-${id.toLowerCase()}`,c);const t={id,guildId:guild.id,userId,type,premium,linkedOrderId,status:'Ouvert',claimedBy:null,channelId:ch.id,memberIds:[],createdAt:new Date().toISOString()};const db=getDb();db.tickets[id]=t;writeJson(DB_FILE,db);
  await ch.send({content:`<@${userId}>`,embeds:[embed(`🎫 ${id} — ${type}`,`${linkedOrderId?`Commande liée : **${linkedOrderId}**\n`:''}Explique ta demande.`)],components:[new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ticket_claim:${id}`).setLabel('Prendre').setStyle(ButtonStyle.Primary),new ButtonBuilder().setCustomId(`ticket_contact:${id}`).setLabel('Contacter').setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId(`ticket_member_add:${id}`).setLabel('Ajouter membre').setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId(`ticket_member_remove:${id}`).setLabel('Retirer membre').setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId(`ticket_rename:${id}`).setLabel('Renommer').setStyle(ButtonStyle.Secondary)
  ),new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`ticket_close:${id}`).setLabel('Fermer').setStyle(ButtonStyle.Danger),new ButtonBuilder().setCustomId(`ticket_reopen:${id}`).setLabel('Rouvrir').setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId(`ticket_archive:${id}`).setLabel('Archiver').setStyle(ButtonStyle.Secondary))]});return ch;
}

function salesForGuild(guildId){return Object.values(getDb().sales).filter(x=>x.guildId===guildId)}
function inRange(date,start){return new Date(date)>=start}
function revenueNumbers(guildId){
  const sales=salesForGuild(guildId),now=new Date();
  const day=new Date(now);day.setHours(0,0,0,0);
  const week=new Date(now);week.setDate(now.getDate()-6);week.setHours(0,0,0,0);
  const monthStart=new Date(now.getFullYear(),now.getMonth(),1);

  const c=getConfig(guildId);
  const resetAtRaw=c.settings?.monthlyRevenueResetAt||'';
  const resetAt=resetAtRaw?new Date(resetAtRaw):null;

  // Le reset ne supprime aucune vente.
  // Il change uniquement le point de départ du compteur "Ce mois".
  const monthlyStart=
    resetAt && !Number.isNaN(resetAt.getTime()) && resetAt>monthStart
      ? resetAt
      : monthStart;

  const sum=a=>a.reduce((n,x)=>n+Number(x.amount||0),0);

  return{
    day:sum(sales.filter(x=>inRange(x.createdAt,day))),
    week:sum(sales.filter(x=>inRange(x.createdAt,week))),
    month:sum(sales.filter(x=>inRange(x.createdAt,monthlyStart))),
    total:sum(sales)
  };
}
function revenueText(guildId){if(!guildId)return 'Aucune donnée.';const r=revenueNumbers(guildId);return `Aujourd’hui : **${r.day.toFixed(2)} €**\nCette semaine : **${r.week.toFixed(2)} €**\nCe mois : **${r.month.toFixed(2)} €**\nTotal : **${r.total.toFixed(2)} €**`}
function statsText(guildId){if(!guildId)return 'Les statistiques apparaîtront après initialisation.';const db=getDb();const vals=k=>Object.values(db[k]).filter(x=>x.guildId===guildId);const quotes=vals('quotes'),orders=vals('orders'),payments=vals('payments'),sales=vals('sales'),projects=vals('projects'),clients=vals('clients');const accepted=quotes.filter(x=>['Accepté par le client','Transformé en commande'].includes(x.status)).length;const r=revenueNumbers(guildId);const avg=sales.length?r.total/sales.length:0;return `Devis : **${quotes.length}**\nDevis acceptés : **${accepted}**\nTaux de conversion : **${quotes.length?((accepted/quotes.length)*100).toFixed(1):'0'}%**\nCommandes : **${orders.length}**\nCommandes payées : **${orders.filter(x=>['Payée','Projet créé','Terminée'].includes(x.status)).length}**\nPaiements : **${payments.length}**\nVentes : **${sales.length}**\nCA jour : **${r.day.toFixed(2)} €**\nCA semaine : **${r.week.toFixed(2)} €**\nCA mois : **${r.month.toFixed(2)} €**\nPanier moyen : **${avg.toFixed(2)} €**\nProjets actifs : **${projects.filter(x=>x.stageIndex<PROJECT_STAGES.length-1).length}**\nClients : **${clients.length}**\nClients Premium : **${clients.filter(x=>x.premium).length}**`}
function goalText(c,guildId){if(!c||!guildId)return 'Objectif non disponible.';const goal=Number(c.settings.monthlyGoal||0),done=revenueNumbers(guildId).month,left=Math.max(0,goal-done),pct=goal>0?Math.min(100,(done/goal)*100):0;return `Objectif mensuel : **${goal.toFixed(2)} €**\nMontant réalisé : **${done.toFixed(2)} €**\nMontant restant : **${left.toFixed(2)} €**\nProgression : **${pct.toFixed(1)}%**`}
function directionText(guildId){if(!guildId)return 'Dashboard en attente.';const db=getDb();const f=k=>Object.values(db[k]).filter(x=>x.guildId===guildId);const r=revenueNumbers(guildId),c=getConfig(guildId);return `Commandes en attente : **${f('orders').filter(x=>x.status==='En attente').length}**\nPaiements à vérifier : **${f('payments').filter(x=>x.status==='En attente').length}**\nProjets actifs : **${f('projects').filter(x=>x.stageIndex<7).length}**\nBugs critiques : **${f('bugs').filter(x=>String(x.severity).toLowerCase().includes('crit')).length}**\nVentes du mois : **${f('sales').filter(x=>inRange(x.createdAt,new Date(new Date().getFullYear(),new Date().getMonth(),1))).length}**\nObjectif mensuel : **${Number(c.settings.monthlyGoal||0).toFixed(2)} €**\nCA du mois : **${r.month.toFixed(2)} €**`}
function financeText(guildId){if(!guildId)return 'Finance en attente.';const db=getDb(),sales=Object.values(db.sales).filter(x=>x.guildId===guildId),clients=Object.values(db.clients).filter(x=>x.guildId===guildId),r=revenueNumbers(guildId);return `CA total : **${r.total.toFixed(2)} €**\nVentes : **${sales.length}**\nPanier moyen : **${sales.length?(r.total/sales.length).toFixed(2):'0.00'} €**\nClients : **${clients.length}**\nPremium : **${clients.filter(x=>x.premium).length}**\nHébergements actifs : **${Object.values(db.orders).filter(x=>x.guildId===guildId&&x.offerKey==='hosting'&&['Payée','Projet créé','Terminée'].includes(x.status)).length}**`}
function globalStatsText(guildId){if(!guildId)return 'Statistiques en attente.';const db=getDb(),c=getConfig(guildId),g=client.guilds.cache.get(guildId);const countRole=k=>c.roles[k]&&g?g.members.cache.filter(m=>m.roles.cache.has(c.roles[k])).size:0;const f=k=>Object.values(db[k]).filter(x=>x.guildId===guildId).length;return `Membres : **${countRole('membre')}**\nProspects : **${countRole('prospect')}**\nClients : **${countRole('client')}**\nClients Premium : **${countRole('client_premium')}**\nDevis : **${f('quotes')}**\nCommandes : **${f('orders')}**\nPaiements : **${f('payments')}**\nVentes : **${f('sales')}**\nCA : **${revenueNumbers(guildId).total.toFixed(2)} €**\nProjets : **${f('projects')}**\nTickets : **${f('tickets')}**\nTests : **${f('tests')}**\nBugs : **${f('bugs')}**`}

async function refreshBusinessPanels(guild){
  for(const key of ['statistiques_commerciales','objectifs','chiffre_affaires','direction','finance','statistiques_globales','gestion_financiere']){
    const c=getConfig(guild.id);
    if(!c.channels[key])continue;

    const def=
      key==='statistiques_commerciales'?['📊 Statistiques commerciales',statsText(guild.id),0x3498DB]:
      key==='objectifs'?['🎯 Objectif mensuel',goalText(c,guild.id),0xF1C40F]:
      key==='chiffre_affaires'?['💶 Chiffre d’affaires',revenueText(guild.id),0x57F287]:
      key==='direction'?['📊 Dashboard Direction',directionText(guild.id),0x5865F2]:
      key==='finance'?['💶 Finance',financeText(guild.id),0x57F287]:
      key==='statistiques_globales'?['🌐 Statistiques globales',globalStatsText(guild.id),0x3498DB]:
      ['🏦 Gestion financière',financeText(guild.id),0x57F287];

    const ch=await guild.channels.fetch(c.channels[key]).catch(()=>null);
    if(!isUsableTextChannel(ch))continue;

    let m=null;

    // Si un ancien ID de panneau pointe vers un message supprimé,
    // on l'oublie automatiquement et on recrée proprement le panneau.
    if(c.panels[key]){
      m=await ch.messages.fetch(c.panels[key]).catch(()=>null);

      if(!m){
        const cfg=getConfig(guild.id);
        if(cfg.panels?.[key]){
          const data=migrateConfig(readJson(CONFIG_FILE));
          if(data.guilds?.[guild.id]?.panels)delete data.guilds[guild.id].panels[key];
          writeJson(CONFIG_FILE,data);
        }
      }
    }

    if(m){
      try{
        await m.edit({embeds:[embed(def[0],def[1],def[2])]});
      }catch(error){
        // Unknown Message = panneau supprimé entre le fetch et l'edit.
        if(error?.code===10008){
          const data=migrateConfig(readJson(CONFIG_FILE));
          if(data.guilds?.[guild.id]?.panels)delete data.guilds[guild.id].panels[key];
          writeJson(CONFIG_FILE,data);

          const recreated=await ch.send({embeds:[embed(def[0],def[1],def[2])]});
          setConfig(guild.id,'panels',key,recreated.id);
        }else{
          await logError(guild.id,error,`Actualisation panneau ${key}`);
        }
      }
    }else{
      try{
        const created=await ch.send({embeds:[embed(def[0],def[1],def[2])]});
        setConfig(guild.id,'panels',key,created.id);
      }catch(error){
        await logError(guild.id,error,`Création panneau ${key}`);
      }
    }
  }
}

async function journal(guildId,text){await safeLog(guildId,'journal_direction',{content:`• ${new Date().toLocaleString('fr-FR')} — ${text}`});await safeLog(guildId,'logs_bot',{content:`• ${text}`});}

function configReport(guildId){const c=getConfig(guildId);const line=(arr,obj)=>arr.map(([k,l])=>`${obj[k]?'✅':'❌'} ${l}`).join('\n');return [`**Salons**\n${line(CHANNELS,c.channels)}`,`**Catégories**\n${line(CATEGORIES,c.categories)}`,`**Rôles**\n${line(ROLES,c.roles)}`,`**Paiement**\n${c.settings.paypalUrl?'✅':'❌'} Lien PayPal\n${c.settings.paymentMessage?'✅':'❌'} Message de paiement`,`**Autorisations**\n${['liens','annonces','tarifs','offres','sondages','roadmap'].map(k=>`${c.permissions[k]?'✅':'❌'} ${k}`).join('\n')}`].join('\n\n');}

async function showTracking(interaction,type){
  const db=getDb(),gid=interaction.guildId||interaction.guild?.id;
  let items=[];
  if(type==='quotes')items=Object.values(db.quotes).filter(x=>x.guildId===gid&&x.userId===interaction.user.id);
  if(type==='orders')items=Object.values(db.orders).filter(x=>x.guildId===gid&&x.userId===interaction.user.id);
  if(type==='projects')items=Object.values(db.projects).filter(x=>x.guildId===gid&&x.userId===interaction.user.id);
  if(!items.length)return safeInteractionReply(interaction,{content:'Aucun élément enregistré pour toi.',flags:MessageFlags.Ephemeral});

  let desc='';
  if(type==='quotes')desc=items.map(x=>`**${x.id} — ${x.projectName}**\nStatut : **${x.status}**\n${x.price==null?'Prix à définir':`Prix : **${x.price} €**`}`).join('\n\n');
  if(type==='orders')desc=items.map(x=>{
    let extra='';
    if(x.projectId){
      const p=db.projects[x.projectId];
      if(p){
        const s=PROJECT_STAGES[p.stageIndex];
        extra=`\nProjet : **${p.id}** — ${s.label} (${s.progress}%)`;
        if(s.key==='termines')extra+=`\nVotre commande est terminée et passe en préparation de livraison.`;
        if(s.key==='livraisons_projets')extra+=`\nVotre commande est en cours de livraison.`;
      }
    }
    return `**${x.id} — ${x.projectName}**\nStatut : **${x.status}**\nPaiement : **${x.paymentStatus}**${extra}`;
  }).join('\n\n');
  if(type==='projects')desc=items.map(x=>{const s=PROJECT_STAGES[x.stageIndex];return `**${x.id} — ${x.projectName}**\n${s.emoji} ${s.label} • ${s.progress}%`}).join('\n\n');

  const title=type==='quotes'?'💰 Mes devis':type==='orders'?'📦 Mes commandes':'🚀 Mes projets';
  const ok=await sendDm(interaction.user.id,{embeds:[embed(title,desc.slice(0,3900))]});
  return safeInteractionReply(interaction,{content:ok?'✅ Je viens de vous envoyer le suivi complet en MP.':'❌ Impossible de vous envoyer un MP. Vérifiez vos paramètres de confidentialité.',flags:MessageFlags.Ephemeral});
};

function uniqueKeys(values){ return [...new Set(values.filter(Boolean))]; }
function staffPermissionRoleKeys(){
  return uniqueKeys([
    ...PERMISSION_GROUPS.foundation,
    ...PERMISSION_GROUPS.direction,
    ...PERMISSION_GROUPS.development,
    ...PERMISSION_GROUPS.commercial,
    ...PERMISSION_GROUPS.design,
    ...PERMISSION_GROUPS.moderation
  ]);
}
function memberPermissionRoleKeys(){
  return uniqueKeys([...PERMISSION_GROUPS.community, ...PERMISSION_GROUPS.clientele, ...staffPermissionRoleKeys()]);
}

function channelPermissionProfile(key){
  const staff=staffPermissionRoleKeys();
  const management=uniqueKeys([...PERMISSION_GROUPS.direction,...PERMISSION_GROUPS.foundation]);
  const devManagement=uniqueKeys([...PERMISSION_GROUPS.development,...management]);
  const commercialManagement=uniqueKeys([...PERMISSION_GROUPS.commercial,...management]);
  const designManagement=uniqueKeys([...PERMISSION_GROUPS.design,...management]);
  const clientStaff=uniqueKeys([...PERMISSION_GROUPS.clientele,...staff]);
  const publicStaffWriters=uniqueKeys([...PERMISSION_GROUPS.moderation,...PERMISSION_GROUPS.direction,...PERMISSION_GROUPS.foundation]);

  // PUBLIC / INFORMATIONS : tout le monde peut lire, seuls les rôles responsables peuvent écrire.
  if(['bienvenue','depart','reglement','annonces','info','roadmap','liens','faq'].includes(key))
    return {public:true,mode:'readonly',roles:staff,writers:publicStaffWriters};

  // PANNEAUX PUBLICS : tout le monde voit et interagit, seuls les responsables écrivent.
  if(['sondages','ticket'].includes(key))
    return {public:true,mode:'interactive',roles:staff,writers:publicStaffWriters};

  // COMMUNAUTÉ : les membres et équipes internes peuvent réellement discuter.
  if(['discussion','media','suggestion','vos_bots','presentation','evenements'].includes(key))
    return {public:false,mode:'chat',roles:memberPermissionRoleKeys()};

  // VOCAL D'ATTENTE : membres + équipes internes.
  if(key==='attente_vocale')
    return {public:false,mode:'voice',roles:memberPermissionRoleKeys()};

  // SERVICES / INFORMATIONS COMMERCIALES : membres en lecture, staff autorisé à publier.
  if(['creation_bot','creation_serveur','hebergement','tarifs','garantie','conditions','offres_speciales'].includes(key))
    return {public:false,mode:'readonly',roles:memberPermissionRoleKeys(),writers:uniqueKeys([...PERMISSION_GROUPS.commercial,...management])};

  // PANNEAUX CLIENTS : membres voient et utilisent les boutons/menus, équipe commerciale + direction écrit.
  if(['commander','demander_devis','suivi_commandes','paiements'].includes(key))
    return {public:false,mode:'interactive',roles:memberPermissionRoleKeys(),writers:uniqueKeys([...PERMISSION_GROUPS.commercial,...management])};

  // QUESTIONS COMMANDES : les membres peuvent parler directement.
  if(key==='questions_commandes')
    return {public:false,mode:'chat',roles:memberPermissionRoleKeys()};

  // ESPACE CLIENT : clients concernés lisent, personnel concerné peut publier.
  if(['infos_clients','livraisons_clients','factures'].includes(key))
    return {public:false,mode:'readonly',roles:clientStaff,writers:uniqueKeys([...PERMISSION_GROUPS.commercial,...management])};
  if(key==='avis')
    return {public:false,mode:'interactive',roles:clientStaff,writers:uniqueKeys([...PERMISSION_GROUPS.commercial,...management])};

  // PREMIUM : panneau = interaction seulement pour client, chat = parole autorisée.
  if(key==='premium_chat'||key==='support_premium')
    return {public:false,mode:'chat',roles:uniqueKeys(['client_premium','pole_clientele',...staff])};
  if(key==='commandes_premium')
    return {public:false,mode:'interactive',roles:uniqueKeys(['client_premium','pole_clientele',...staff]),writers:uniqueKeys([...PERMISSION_GROUPS.commercial,...management])};
  if(['avantages_premium','annonces_premium'].includes(key))
    return {public:false,mode:'readonly',roles:uniqueKeys(['client_premium','pole_clientele',...staff]),writers:uniqueKeys([...PERMISSION_GROUPS.commercial,...management])};

  // DÉVELOPPEMENT : annonces/docs en lecture pour l'équipe, responsables peuvent publier ; espaces de travail en chat.
  if(['annonces_dev','documentation'].includes(key))
    return {public:false,mode:'readonly',roles:devManagement,writers:devManagement};
  if(['discussion_dev','tests_dev','bugs'].includes(key))
    return {public:false,mode:'chat',roles:devManagement};

  // PROJETS CLIENTS : ce sont des salons de travail, les pôles concernés peuvent parler et envoyer des fichiers.
  if(['liste_projets','projets_attente','analyse','developpement','tests_projets','corrections','termines','livraisons_projets','archives'].includes(key))
    return {public:false,mode:'chat',roles:uniqueKeys([...PERMISSION_GROUPS.development,...PERMISSION_GROUPS.commercial,...PERMISSION_GROUPS.design,...management])};

  // COMMERCIAL : stats/CA/objectifs = lecture avec responsables qui publient ; autres = travail en chat.
  if(['statistiques_commerciales','objectifs','chiffre_affaires'].includes(key))
    return {public:false,mode:'readonly',roles:commercialManagement,writers:commercialManagement};
  if(['ventes','devis_commerciaux','commandes_commerciales','archives_devis','archives_commandes','discussion_commerciale'].includes(key))
    return {public:false,mode:'chat',roles:commercialManagement};

  // DESIGN : salons de travail, envoi d'images/fichiers/liens autorisé.
  if(['creations','logos','bannieres','miniatures','reseaux_sociaux','discussion_design'].includes(key))
    return {public:false,mode:'chat',roles:designManagement};

  // STAFF : annonces = lecture pour staff, direction/fondation publie ; autres = discussion.
  if(key==='staff_annonces')
    return {public:false,mode:'readonly',roles:staff,writers:management};
  if(['staff_chat','recrutements','sanctions','reunions'].includes(key))
    return {public:false,mode:'chat',roles:staff};

  // DIRECTION : salons de travail internes.
  if(['direction','finance','statistiques_globales','planning','partenaires','contrats','decisions','documents'].includes(key))
    return {public:false,mode:'chat',roles:management};

  // FONDATION : uniquement fondation, parole/fichiers autorisés.
  if(['fondation','documents_confidentiels','projets_secrets','gestion_financiere','acces_total','journal_direction'].includes(key))
    return {public:false,mode:'chat',roles:PERMISSION_GROUPS.foundation};

  // GESTION CLIENTS : équipe commerciale + direction/fondation travaillent dedans.
  if(['liste_clients','nouveaux_clients','clients_premium'].includes(key))
    return {public:false,mode:'chat',roles:commercialManagement};

  // LOGS : lecture seule, direction/fondation peut intervenir si nécessaire.
  if(['logs_bot','logs_erreurs','logs_roles'].includes(key))
    return {public:false,mode:'readonly',roles:devManagement,writers:management};

  return {public:false,mode:'chat',roles:staff};
}
function categoryPermissionProfile(key){
  const staff=staffPermissionRoleKeys();
  const management=uniqueKeys([...PERMISSION_GROUPS.direction,...PERMISSION_GROUPS.foundation]);
  const devManagement=uniqueKeys([...PERMISSION_GROUPS.development,...management]);
  const commercialManagement=uniqueKeys([...PERMISSION_GROUPS.commercial,...management]);
  const designManagement=uniqueKeys([...PERMISSION_GROUPS.design,...management]);

  if(['cat_aeroport','cat_hub'].includes(key))
    return {public:true,mode:'readonly',roles:staff,writers:management};

  if(key==='cat_support')
    return {public:true,mode:'interactive',roles:staff,writers:staff};

  if(key==='cat_communaute')
    return {public:false,mode:'chat',roles:memberPermissionRoleKeys()};

  if(['cat_services','cat_commandes'].includes(key))
    return {public:false,mode:'readonly',roles:memberPermissionRoleKeys(),writers:commercialManagement};

  if(key==='cat_espace_clients')
    return {public:false,mode:'readonly',roles:uniqueKeys([...PERMISSION_GROUPS.clientele,...staff]),writers:commercialManagement};

  if(key==='cat_premium')
    return {public:false,mode:'readonly',roles:uniqueKeys(['client_premium','pole_clientele',...staff]),writers:commercialManagement};

  if(key==='cat_developpement')
    return {public:false,mode:'chat',roles:devManagement};

  if(key==='cat_projets')
    return {public:false,mode:'chat',roles:uniqueKeys([...PERMISSION_GROUPS.development,...PERMISSION_GROUPS.commercial,...PERMISSION_GROUPS.design,...management])};

  if(key==='cat_commercial')
    return {public:false,mode:'chat',roles:commercialManagement};

  if(key==='cat_design')
    return {public:false,mode:'chat',roles:designManagement};

  if(key==='cat_staff')
    return {public:false,mode:'chat',roles:staff};

  if(key==='cat_direction')
    return {public:false,mode:'chat',roles:management};

  if(key==='cat_fondation')
    return {public:false,mode:'chat',roles:PERMISSION_GROUPS.foundation};

  if(key==='cat_gestion_clients')
    return {public:false,mode:'chat',roles:commercialManagement};

  if(key==='cat_logs')
    return {public:false,mode:'readonly',roles:devManagement,writers:management};

  if(key==='devis')
    return {public:false,mode:'chat',roles:uniqueKeys([...PERMISSION_GROUPS.commercial,...PERMISSION_GROUPS.direction,...PERMISSION_GROUPS.foundation])};

  if(key==='tickets_premium')
    return {public:false,mode:'chat',roles:uniqueKeys([...PERMISSION_GROUPS.commercial,...PERMISSION_GROUPS.moderation,...PERMISSION_GROUPS.direction,...PERMISSION_GROUPS.foundation])};

  if(key==='tickets')
    return {public:false,mode:'chat',roles:staff};

  return {public:false,mode:'chat',roles:staff};
}

async function applyAllConfiguredPermissions(guild,c=null){
  // Toujours relire la configuration persistée au moment de l'application.
  // Cela évite d'utiliser un ancien objet c gardé en mémoire.
  c=getConfig(guild.id);
  const me=guild.members.me||await guild.members.fetchMe();
  if(!me.permissions.has(PermissionFlagsBits.ManageChannels))
    throw new Error('Le bot ne possède pas la permission Gérer les salons.');

  const configuredRoleMap=new Map(
    ROLES.map(([key])=>[key,c.roles[key]]).filter(([,id])=>Boolean(id))
  );
  const managedRoleIds=new Set([...configuredRoleMap.values()]);
  const configuredChannelIds=CHANNELS.filter(([key])=>Boolean(c.channels?.[key]));
  const configuredCategoryIds=CATEGORIES.filter(([key])=>Boolean(c.categories?.[key]));
  const result={
    channels:0,
    categories:0,
    skipped:0,
    errors:[],
    configuredChannels:configuredChannelIds.length,
    configuredCategories:configuredCategoryIds.length
  };

  const readPerms=[
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.ReadMessageHistory
  ];

  const interactivePerms=[
    ...readPerms,
    PermissionFlagsBits.AddReactions,
    PermissionFlagsBits.UseExternalEmojis,
    PermissionFlagsBits.UseApplicationCommands
  ];

  const chatPerms=[
    ...interactivePerms,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.AttachFiles,
    PermissionFlagsBits.EmbedLinks,
    PermissionFlagsBits.CreatePublicThreads,
    PermissionFlagsBits.CreatePrivateThreads,
    PermissionFlagsBits.SendMessagesInThreads
  ];

  const voicePerms=[
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.Connect,
    PermissionFlagsBits.Speak,
    PermissionFlagsBits.Stream,
    PermissionFlagsBits.UseVAD
  ];

  const writeBits=[
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.AttachFiles,
    PermissionFlagsBits.EmbedLinks,
    PermissionFlagsBits.CreatePublicThreads,
    PermissionFlagsBits.CreatePrivateThreads,
    PermissionFlagsBits.SendMessagesInThreads
  ];

  /*
   * IMPORTANT :
   * On conserve uniquement les overwrites qui ne concernent pas les rôles
   * configurés par Creaty Bot (ex: permissions manuelles d'un membre précis,
   * d'un bot externe ou d'un rôle non géré).
   *
   * Tous les rôles Creaty Bot qui ne donnent PAS accès au salon restent NEUTRES.
   * On ne leur met surtout plus "Refuser Voir le salon".
   *
   * Exemple : un utilisateur possède Membre + Client.
   * - salon membre : Membre = autorisé, Client = neutre
   * - salon client : Client = autorisé, Membre = neutre
   *
   * Ainsi, un deuxième rôle ne bloque jamais l'accès donné par un premier rôle.
   */
  function preservedOverwrites(target){
    return target.permissionOverwrites.cache
      .filter(o=>o.id!==guild.roles.everyone.id&&!managedRoleIds.has(o.id))
      .map(o=>({
        id:o.id,
        type:o.type,
        allow:o.allow.bitfield,
        deny:o.deny.bitfield
      }));
  }

  function allowedPermsForMode(mode){
    if(mode==='chat') return chatPerms;
    if(mode==='voice') return voicePerms;
    if(mode==='interactive') return interactivePerms;
    return readPerms;
  }

  function overwritesFor(target,profile){
    const rows=[];
    const mode=profile.mode||'readonly';
    const roleKeys=uniqueKeys(profile.roles||[]);
    const writerKeys=uniqueKeys(profile.writers||[]);

    const allowedRoleIds=new Set(
      roleKeys.map(k=>configuredRoleMap.get(k)).filter(Boolean)
    );
    const writerRoleIds=new Set(
      writerKeys.map(k=>configuredRoleMap.get(k)).filter(Boolean)
    );

    /*
     * PUBLIC :
     * @everyone donne l'accès.
     * Aucun autre rôle n'est refusé.
     * Les autres rôles restent donc en NEUTRE.
     */
    if(profile.public){
      if(mode==='chat'){
        rows.push({
          id:guild.roles.everyone.id,
          allow:chatPerms,
          deny:[]
        });
      }else if(mode==='voice'){
        rows.push({
          id:guild.roles.everyone.id,
          allow:voicePerms,
          deny:[]
        });
      }else{
        // Lecture / panneau public : tout le monde voit mais ne parle pas.
        rows.push({
          id:guild.roles.everyone.id,
          allow:allowedPermsForMode(mode),
          deny:writeBits
        });
      }
    }else{
      /*
       * PRIVÉ :
       * Seul @everyone reçoit un refus de visibilité.
       * Les rôles autorisés reçoivent ensuite explicitement l'accès.
       * Tous les autres rôles configurés restent NEUTRES.
       */
      const everyoneDeny=[PermissionFlagsBits.ViewChannel];

      // Pour un salon privé lecture seule / panneau, on bloque aussi l'écriture
      // au niveau @everyone. Les rôles écrivains la récupèrent explicitement.
      if(mode==='readonly'||mode==='interactive')
        everyoneDeny.push(...writeBits);

      rows.push({
        id:guild.roles.everyone.id,
        allow:[],
        deny:everyoneDeny
      });
    }

    /*
     * On ajoute UNIQUEMENT les rôles qui donnent réellement un accès.
     * Aucun overwrite n'est créé pour les rôles non concernés => NEUTRE.
     */
    for(const roleId of allowedRoleIds){
      const canWrite=
        mode==='chat'||
        mode==='voice'||
        writerRoleIds.has(roleId);

      let allow;
      if(mode==='voice') allow=voicePerms;
      else if(canWrite) allow=chatPerms;
      else if(mode==='interactive') allow=interactivePerms;
      else allow=readPerms;

      rows.push({
        id:roleId,
        allow,
        deny:[]
      });
    }

    /*
     * Un rôle "writer" peut ne pas être présent dans profile.roles.
     * On lui donne quand même l'accès complet nécessaire.
     */
    for(const roleId of writerRoleIds){
      if(allowedRoleIds.has(roleId)) continue;
      rows.push({
        id:roleId,
        allow:mode==='voice'?voicePerms:chatPerms,
        deny:[]
      });
    }

    return [...rows,...preservedOverwrites(target)];
  }

  /*
   * On applique d'abord les catégories configurées.
   * Les rôles non concernés restent neutres.
   */
  for(const [key,label] of CATEGORIES){
    const categoryId=c.categories[key];
    if(!categoryId){result.skipped++;continue;}

    const category=await guild.channels.fetch(categoryId).catch(()=>null);
    if(!category||category.type!==ChannelType.GuildCategory){
      result.skipped++;
      continue;
    }

    try{
      const profile=categoryPermissionProfile(key);

      await category.permissionOverwrites.set(
        overwritesFor(category,profile),
        `Creaty Bot /salon perm — ${label}`
      );
      result.categories++;
    }catch(error){
      result.errors.push(`${label}: ${error.message}`);
    }
  }

  /*
   * Puis chaque salon configuré reçoit sa logique propre.
   * Exemple :
   * - Règlement / Bienvenue : @everyone autorisé, autres rôles neutres.
   * - Fondation : @everyone refusé, Fondation autorisée, autres rôles neutres.
   * - Client : @everyone refusé, Client autorisé, Membre neutre.
   */
  for(const [key,label] of CHANNELS){
    const channelId=c.channels[key];
    if(!channelId){result.skipped++;continue;}

    const channel=await guild.channels.fetch(channelId).catch(()=>null);
    if(!channel){result.skipped++;continue;}

    try{
      let profile=channelPermissionProfile(key);

      if(
        channel.type===ChannelType.GuildVoice||
        channel.type===ChannelType.GuildStageVoice
      ){
        profile={...profile,mode:'voice'};
      }

      await channel.permissionOverwrites.set(
        overwritesFor(channel,profile),
        `Creaty Bot /salon perm — ${label}`
      );
      result.channels++;
    }catch(error){
      result.errors.push(`${label}: ${error.message}`);
    }
  }

  return result;
}
const commands=[
  new SlashCommandBuilder().setName('config').setDescription('Configuration complète.')
    .addSubcommand(s=>s.setName('salon').setDescription('Configurer tous les salons et catégories.')
      .addStringOption(o=>o.setName('groupe').setDescription('Espace à configurer').setRequired(true).addChoices(
        {name:'Aéroport',value:'aeroport'},
        {name:'Hub / Informations',value:'hub'},
        {name:'Support',value:'support'},
        {name:'Communauté',value:'communaute'},
        {name:'Services',value:'services'},
        {name:'Commandes',value:'commandes'},
        {name:'Espace clients',value:'espace_clients'},
        {name:'Premium',value:'premium'},
        {name:'Développement',value:'developpement'},
        {name:'Projets',value:'projets'},
        {name:'Commercial',value:'commercial'},
        {name:'Design',value:'design'},
        {name:'Staff',value:'staff'},
        {name:'Direction',value:'direction'},
        {name:'Fondation',value:'fondation'},
        {name:'Gestion clients',value:'gestion_clients'},
        {name:'Logs',value:'logs'}
      ))
      .addStringOption(o=>o.setName('type').setDescription('Salon ou catégorie').setRequired(true).setAutocomplete(true))
      .addChannelOption(o=>o.setName('cible').setDescription('Salon ou catégorie Discord').setRequired(true)))
    .addSubcommand(s=>s.setName('role').setDescription('Configurer un rôle.')
      .addStringOption(o=>o.setName('groupe').setDescription('Groupe de rôles').setRequired(true).addChoices(
        {name:'Fondation',value:'fondation'},
        {name:'Direction',value:'direction'},
        {name:'Développement',value:'developpement'},
        {name:'Commercial',value:'commercial'},
        {name:'Design',value:'design'},
        {name:'Modération',value:'moderation'},
        {name:'Clientèle',value:'clientele'},
        {name:'Communauté',value:'communaute'},
        {name:'Système',value:'systeme'}
      ))
      .addStringOption(o=>o.setName('type').setDescription('Rôle à configurer').setRequired(true).setAutocomplete(true))
      .addRoleOption(o=>o.setName('role').setDescription('Rôle Discord').setRequired(true)))
    .addSubcommand(s=>s.setName('paiement').setDescription('Configurer PayPal.').addStringOption(o=>o.setName('lien').setDescription('Lien PayPal').setRequired(true)).addStringOption(o=>o.setName('message').setDescription('Message de paiement').setRequired(false)))
    .addSubcommand(s=>s.setName('objectif').setDescription('Objectif mensuel.').addNumberOption(o=>o.setName('montant').setDescription('Montant').setMinValue(0).setRequired(true)))
    .addSubcommand(s=>s.setName('autorisation').setDescription('Rôle autorisé pour une fonction.').addStringOption(o=>o.setName('fonction').setDescription('Fonction').setRequired(true).addChoices({name:'Liens',value:'liens'},{name:'Annonces',value:'annonces'},{name:'Tarifs',value:'tarifs'},{name:'Offres',value:'offres'},{name:'Sondages',value:'sondages'},{name:'Roadmap',value:'roadmap'})).addRoleOption(o=>o.setName('role').setDescription('Rôle').setRequired(true)))
    .addSubcommand(s=>s.setName('voir').setDescription('Voir la configuration détaillée.')),
  new SlashCommandBuilder().setName('salon').setDescription('Gestion globale des permissions des salons.').addSubcommand(s=>s.setName('perm').setDescription('Appliquer automatiquement les permissions à tous les salons et catégories configurés.')),
  new SlashCommandBuilder().setName('panneaux').setDescription('Gestion des panneaux.').addSubcommand(s=>s.setName('reparer').setDescription('Recréer seulement les panneaux manquants.')).addSubcommand(s=>s.setName('mettre-a-jour').setDescription('Mettre à jour les panneaux existants sans doublons.')),
  new SlashCommandBuilder().setName('version').setDescription('Initialiser une nouvelle version.').addSubcommand(s=>s.setName('initialiser').setDescription('Migrer la configuration et installer les nouveaux panneaux sans reset.')),
  new SlashCommandBuilder().setName('tarif').setDescription('Publier les tarifs.'),
  new SlashCommandBuilder().setName('liens').setDescription('Mettre à jour les liens officiels.').addStringOption(o=>o.setName('contenu').setDescription('Texte des liens').setRequired(true)),
  new SlashCommandBuilder().setName('role').setDescription('Gérer les grades internes.').addSubcommand(s=>s.setName('attribuer').setDescription('Attribuer un grade et son pôle.').addUserOption(o=>o.setName('utilisateur').setDescription('Utilisateur').setRequired(true)).addStringOption(o=>o.setName('grade').setDescription('Grade').setRequired(true).setAutocomplete(true))).addSubcommand(s=>s.setName('retirer').setDescription('Retirer un grade et éventuellement son pôle.').addUserOption(o=>o.setName('utilisateur').setDescription('Utilisateur').setRequired(true)).addStringOption(o=>o.setName('grade').setDescription('Grade').setRequired(true).setAutocomplete(true))),
  new SlashCommandBuilder().setName('projet').setDescription('Gestion manuelle d’un projet.').addSubcommand(s=>s.setName('avancer').setDescription('Avancer un projet.').addStringOption(o=>o.setName('id').setDescription('PROJ-0001').setRequired(true))).addSubcommand(s=>s.setName('reculer').setDescription('Reculer un projet.').addStringOption(o=>o.setName('id').setDescription('PROJ-0001').setRequired(true))).addSubcommand(s=>s.setName('etape').setDescription('Définir une étape.').addStringOption(o=>o.setName('id').setDescription('PROJ-0001').setRequired(true)).addStringOption(o=>o.setName('etape').setDescription('Étape').setRequired(true).addChoices(...PROJECT_STAGES.map((s,i)=>({name:s.label,value:String(i)}))))),
  new SlashCommandBuilder().setName('suivi').setDescription('Voir tes devis, commandes et projets.'),
  new SlashCommandBuilder().setName('projet-reparer').setDescription('Créer ou réparer le projet lié à une commande payée.')
    .addStringOption(o=>o.setName('commande').setDescription('Exemple : CMD-0001').setRequired(true)),

  new SlashCommandBuilder().setName('reset').setDescription('Réinitialisation limitée.')
    .addSubcommand(s=>s.setName('tout-gagne').setDescription('Remet uniquement le montant gagné ce mois à 0 €.')),
  new SlashCommandBuilder().setName('paiement').setDescription('Gestion de secours des paiements.')
    .addSubcommand(s=>s.setName('en-attente').setDescription('Voir les paiements en attente de validation.'))
    .addSubcommand(s=>s.setName('relancer').setDescription('Renvoyer un paiement à vérifier à la Fondation.')
      .addStringOption(o=>o.setName('id').setDescription('Exemple : PAY-0001').setRequired(true))),

  new SlashCommandBuilder().setName('sondage').setDescription('Créer un sondage.').addStringOption(o=>o.setName('question').setDescription('Question').setRequired(true)).addStringOption(o=>o.setName('reponses').setDescription('Réponses séparées par |').setRequired(true)).addStringOption(o=>o.setName('type').setDescription('Type').setRequired(true).addChoices({name:'Choix unique',value:'unique'},{name:'Choix multiple',value:'multiple'})).addIntegerOption(o=>o.setName('duree').setDescription('Durée en minutes').setMinValue(1).setRequired(false)),
  new SlashCommandBuilder().setName('offre').setDescription('Publier une offre spéciale.').addStringOption(o=>o.setName('titre').setDescription('Titre').setRequired(true)).addStringOption(o=>o.setName('description').setDescription('Description').setRequired(true)).addStringOption(o=>o.setName('offre').setDescription('Offre').setRequired(true)).addNumberOption(o=>o.setName('prix_initial').setDescription('Prix initial').setRequired(true)).addNumberOption(o=>o.setName('prix_promo').setDescription('Prix promotionnel').setRequired(true)).addStringOption(o=>o.setName('fin').setDescription('Date de fin').setRequired(false)).addIntegerOption(o=>o.setName('quantite').setDescription('Quantité').setMinValue(1).setRequired(false)),
  new SlashCommandBuilder().setName('design').setDescription('Créer un projet design.').addStringOption(o=>o.setName('type').setDescription('Type').setRequired(true).addChoices({name:'Logo',value:'logos'},{name:'Bannière',value:'bannieres'},{name:'Miniature',value:'miniatures'},{name:'Réseaux sociaux',value:'reseaux_sociaux'})).addStringOption(o=>o.setName('titre').setDescription('Titre').setRequired(true)).addStringOption(o=>o.setName('description').setDescription('Description').setRequired(true)).addUserOption(o=>o.setName('client').setDescription('Client').setRequired(false)),
  new SlashCommandBuilder().setName('tache').setDescription('Créer une tâche interne.').addStringOption(o=>o.setName('titre').setDescription('Titre').setRequired(true)).addUserOption(o=>o.setName('responsable').setDescription('Responsable').setRequired(true)).addStringOption(o=>o.setName('priorite').setDescription('Priorité').setRequired(true).addChoices({name:'Basse',value:'Basse'},{name:'Normale',value:'Normale'},{name:'Haute',value:'Haute'},{name:'Urgente',value:'Urgente'})).addStringOption(o=>o.setName('echeance').setDescription('Échéance').setRequired(true)),
  new SlashCommandBuilder().setName('partenaire').setDescription('Créer une fiche partenaire.').addStringOption(o=>o.setName('nom').setDescription('Nom').setRequired(true)).addStringOption(o=>o.setName('details').setDescription('Détails').setRequired(true)),
  new SlashCommandBuilder().setName('contrat').setDescription('Créer une fiche contrat.').addStringOption(o=>o.setName('titre').setDescription('Titre').setRequired(true)).addStringOption(o=>o.setName('details').setDescription('Détails').setRequired(true)),
  new SlashCommandBuilder().setName('decision').setDescription('Créer une décision de direction.').addStringOption(o=>o.setName('titre').setDescription('Titre').setRequired(true)).addStringOption(o=>o.setName('details').setDescription('Détails').setRequired(true))
];


let shuttingDown=false;

async function gracefulShutdown(signal){
  if(shuttingDown)return;
  shuttingDown=true;

  console.log(`🛑 Signal ${signal} reçu — arrêt propre de Creaty Bot...`);

  try{
    client.destroy();
  }catch(error){
    console.error('Erreur pendant la fermeture Discord :',error);
  }

  // On quitte volontairement avec le code 0 :
  // Railway peut envoyer SIGTERM lors d'un redéploiement ou remplacement de conteneur.
  setTimeout(()=>{
    console.log('✅ Creaty Bot arrêté proprement.');
    process.exit(0);
  },250);
}

process.on('SIGTERM',()=>gracefulShutdown('SIGTERM'));
process.on('SIGINT',()=>gracefulShutdown('SIGINT'));

client.once(Events.ClientReady, async()=>{
  console.log(`📁 DATA_DIR : ${DATA_DIR}`);
  console.log(`📄 CONFIG_FILE : ${CONFIG_FILE}`);
  console.log(`📄 DB_FILE : ${DB_FILE}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');console.log('✅ CREATY BOT CONNECTÉ');console.log(`🤖 Nom : ${client.user.tag}`);console.log(`🆔 ID : ${client.user.id}`);console.log(`🌐 Serveurs : ${client.guilds.cache.size}`);console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  ensureFiles();getDb();
  const cfg=migrateConfig(readJson(CONFIG_FILE));writeJson(CONFIG_FILE,cfg);
  for(const guild of client.guilds.cache.values()){
    try{await guild.commands.set(commands.map(c=>c.toJSON()));console.log(`✅ Commandes installées sur ${guild.name}`);}catch(e){await logError(guild.id,e,`Installation des commandes sur ${guild.name}`)}
  }
});

client.on(Events.GuildMemberAdd,async member=>{
  const guild=member.guild;
  const c=getConfig(guild.id);

  console.log(`👋 Arrivée détectée : ${member.user.tag} (${member.id}) sur ${guild.name}`);

  // 1) Attribution du rôle Nouveau si configuré.
  if(c.roles.nouveau){
    try{
      await applyRole(member,c.roles.nouveau,'add',guild.id,'Nouveau');
    }catch(error){
      await logError(guild.id,error,`Attribution du rôle Nouveau à ${member.user.tag}`);
    }
  }else{
    console.warn(`⚠️ Rôle Nouveau non configuré sur ${guild.name}`);
  }

  // 2) Message de bienvenue indépendant du rôle Nouveau.
  // Avant, le "return" lorsque le rôle Nouveau n'était pas configuré empêchait
  // totalement l'envoi du message de bienvenue.
  if(c.channels.bienvenue){
    try{
      const ch=await guild.channels.fetch(c.channels.bienvenue).catch(()=>null);
      if(ch && typeof ch.isTextBased==='function' && ch.isTextBased() && typeof ch.send==='function'){
        await ch.send({
          content:`<@${member.id}>`,
          embeds:[embed(
            '👋 Bienvenue !',
            `Bienvenue <@${member.id}> sur **${guild.name}** !\n\n`+
            `Nous sommes heureux de t'accueillir parmi nous.\n`+
            `Commence par consulter le règlement et profite du serveur !`,
            0x57F287
          )],
          allowedMentions:{users:[member.id]}
        });
      }else{
        throw new Error('Le salon Bienvenue configuré est introuvable ou non textuel.');
      }
    }catch(error){
      await logError(guild.id,error,`Message de bienvenue pour ${member.user.tag}`);
    }
  }else{
    console.warn(`⚠️ Salon Bienvenue non configuré sur ${guild.name}`);
  }

  await safeLog(guild.id,'logs_bot',{
    content:`👋 Arrivée : **${member.user.tag}** (<@${member.id}>)`
  });
});

client.on(Events.GuildMemberRemove,async member=>{
  const guild=member.guild;
  const c=getConfig(guild.id);

  console.log(`👋 Départ détecté : ${member.user.tag} (${member.id}) de ${guild.name}`);

  if(c.channels.depart){
    try{
      const ch=await guild.channels.fetch(c.channels.depart).catch(()=>null);
      if(ch && typeof ch.isTextBased==='function' && ch.isTextBased() && typeof ch.send==='function'){
        await ch.send({
          embeds:[embed(
            '👋 À bientôt',
            `**${member.user.tag}** a quitté **${guild.name}**.\nNous lui souhaitons une bonne continuation.`,
            0xED4245
          )]
        });
      }else{
        throw new Error('Le salon À bientôt configuré est introuvable ou non textuel.');
      }
    }catch(error){
      await logError(guild.id,error,`Message de départ pour ${member.user.tag}`);
    }
  }else{
    console.warn(`⚠️ Salon À bientôt non configuré sur ${guild.name}`);
  }

  await safeLog(guild.id,'logs_bot',{
    content:`👋 Départ : **${member.user.tag}** (${member.id})`
  });
});


async function safeInteractionReply(interaction, payload) {
  try {
    if (interaction.deferred || interaction.replied) {
      return await interaction.editReply(payload);
    }
    return await interaction.reply(payload);
  } catch (error) {
    if (error?.code === 10062) {
      console.error('Interaction expirée avant réponse :', interaction.customId || interaction.commandName || 'inconnue');
      return null;
    }
    throw error;
  }
}


function buttonMustAnswerDirectly(customId) {
  const directIds = new Set([
    'go_quote',
    'payment_declare',
    'review_open',
    'bot_showcase_open',
    'test_open',
    'bug_open',
    'sav_open'
  ]);

  if (directIds.has(customId)) return true;
  if (customId.startsWith('payment_from_order:')) return true;
  if (customId.startsWith('project_next:')) return true;

  const [action] = customId.split(':');
  if ([
    'quote_price',
    'quote_contact',
    'order_contact',
    'payment_contact',
    'project_contact',
    'ticket_contact',
    'ticket_rename'
  ].includes(action)) return true;

  // Ces boutons modifient directement le message avec interaction.update().
  if (customId.startsWith('test_status:')) return true;
  if (customId.startsWith('bug_status:')) return true;

  return false;
}

client.on(Events.InteractionCreate,async interaction=>{
  try{
    if(interaction.isAutocomplete()){
      const focused=interaction.options.getFocused(true);let choices=[];
      if(interaction.commandName==='config'&&focused.name==='type'){
        const sub=interaction.options.getSubcommand();
        if(sub==='salon'){
          const group=interaction.options.getString('groupe');
          const allowedKeys=SALON_CONFIG_GROUPS[group]||[...CHANNELS,...CATEGORIES].map(([k])=>k);
          choices=[...CATEGORIES,...CHANNELS].filter(([k])=>allowedKeys.includes(k));
        }else if(sub==='role'){
          const group=interaction.options.getString('groupe');
          const allowedKeys=ROLE_CONFIG_GROUPS[group]||ROLES.map(([k])=>k);
          choices=ROLES.filter(([k])=>allowedKeys.includes(k));
        }else{
          choices=[];
        }
      } else if(interaction.commandName==='role'&&focused.name==='grade') choices=ROLES.filter(([k])=>GRADE_TO_POLE[k]);
      return interaction.respond(choices.filter(([,l])=>l.toLowerCase().includes(String(focused.value).toLowerCase())).slice(0,25).map(([value,name])=>({name,value})));
    }

    if(interaction.isChatInputCommand()){
      if(!interaction.deferred&&!interaction.replied) await interaction.deferReply({flags:MessageFlags.Ephemeral});
      const guild=interaction.guild;if(!guild)return safeInteractionReply(interaction,{content:'Commande disponible uniquement sur un serveur.',flags:MessageFlags.Ephemeral});const c=getConfig(guild.id);
      if(interaction.commandName==='config'){
        if(!isAdmin(interaction.member)&&!configuredRoleIds(c,['fondateur','cofondateur']).some(id=>interaction.member.roles.cache.has(id)))return safeInteractionReply(interaction,{content:'❌ Réservé à l’administration/fondation.',flags:MessageFlags.Ephemeral});
        const sub=interaction.options.getSubcommand();
        if(sub==='salon'){const type=interaction.options.getString('type'),target=interaction.options.getChannel('cible');const catEntry=CATEGORIES.find(([k])=>k===type),channelEntry=CHANNELS.find(([k])=>k===type);const isCat=Boolean(catEntry);const label=(catEntry||channelEntry)?.[1]||type;if(isCat&&target.type!==ChannelType.GuildCategory)return safeInteractionReply(interaction,{content:`❌ **${label}** doit être configuré avec une vraie catégorie Discord.`,flags:MessageFlags.Ephemeral});if(!isCat&&target.type===ChannelType.GuildCategory)return safeInteractionReply(interaction,{content:`❌ **${label}** doit être configuré avec un salon, pas une catégorie.`,flags:MessageFlags.Ephemeral});setConfig(guild.id,isCat?'categories':'channels',type,target.id);const verifyConfig=getConfig(guild.id);const savedId=isCat?verifyConfig.categories?.[type]:verifyConfig.channels?.[type];if(savedId!==target.id)return safeInteractionReply(interaction,{content:`❌ Erreur de sauvegarde : **${label}** n'a pas été enregistré correctement.`,flags:MessageFlags.Ephemeral});await journal(guild.id,`Configuration ${label} (${type}) → ${target.id}`);return safeInteractionReply(interaction,{content:`✅ **${label}** configuré sur ${target}.\n💾 Configuration enregistrée et vérifiée.`,flags:MessageFlags.Ephemeral})}
        if(sub==='role'){const type=interaction.options.getString('type'),role=interaction.options.getRole('role');const roleLabel=ROLES.find(([k])=>k===type)?.[1]||type;setConfig(guild.id,'roles',type,role.id);await journal(guild.id,`Configuration rôle ${roleLabel} (${type}) → ${role.id}`);if(['fondateur','cofondateur','directeur','directeur_general'].includes(type))await safeLog(guild.id,'acces_total',{content:`⚠️ Configuration sensible : rôle **${roleLabel}** modifié par <@${interaction.user.id}>.`});return safeInteractionReply(interaction,{content:`✅ **${roleLabel}** configuré sur ${role}.`,flags:MessageFlags.Ephemeral})}
        if(sub==='paiement'){setConfig(guild.id,'settings','paypalUrl',interaction.options.getString('lien'));setConfig(guild.id,'settings','paymentMessage',interaction.options.getString('message')||'Utilise le lien PayPal officiel ci-dessous.');await safeLog(guild.id,'acces_total',{content:`⚠️ Lien PayPal modifié par <@${interaction.user.id}>.`});return safeInteractionReply(interaction,{content:'✅ Paiement PayPal configuré.',flags:MessageFlags.Ephemeral})}
        if(sub==='objectif'){setConfig(guild.id,'settings','monthlyGoal',interaction.options.getNumber('montant'));await refreshBusinessPanels(guild);return safeInteractionReply(interaction,{content:'✅ Objectif mensuel mis à jour.',flags:MessageFlags.Ephemeral})}
        if(sub==='autorisation'){const fn=interaction.options.getString('fonction'),role=interaction.options.getRole('role');setConfig(guild.id,'permissions',fn,role.id);await safeLog(guild.id,'acces_total',{content:`⚠️ Autorisation **${fn}** modifiée par <@${interaction.user.id}>.`});return safeInteractionReply(interaction,{content:`✅ ${fn} autorisé pour ${role}.`,flags:MessageFlags.Ephemeral})}
        if(sub==='voir')return safeInteractionReply(interaction,{embeds:[embed('⚙️ Configuration détaillée',configReport(guild.id).slice(0,3900))],flags:MessageFlags.Ephemeral});
      }
      if(interaction.commandName==='salon'){
        if(!isAdmin(interaction.member)&&!configuredRoleIds(c,['fondateur','cofondateur']).some(id=>interaction.member.roles.cache.has(id)))return safeInteractionReply(interaction,{content:'❌ Réservé à l’administration/fondation.',flags:MessageFlags.Ephemeral});
        if(interaction.options.getSubcommand()==='perm'){
          const liveConfig=getConfig(guild.id);
          const result=await applyAllConfiguredPermissions(guild,liveConfig);
          await journal(guild.id,`Permissions globales appliquées par <@${interaction.user.id}> : ${result.channels} salons, ${result.categories} catégories.`);
          const errors=result.errors.length?`\n\n⚠️ **Erreurs (${result.errors.length}) :**\n${result.errors.slice(0,10).map(x=>`• ${x}`).join('\n')}`:'';
          return interaction.editReply({content:`✅ Permissions appliquées.\n\n**Configuration détectée :**\n• Salons enregistrés : **${result.configuredChannels}**\n• Catégories enregistrées : **${result.configuredCategories}**\n\n**Permissions réellement appliquées :**\n• Salons : **${result.channels}**\n• Catégories : **${result.categories}**\n• Éléments manquants/introuvables : **${result.skipped}**${errors}`.slice(0,1900)});
        }
      }

      if(interaction.commandName==='reset'){
        if(!isAdmin(interaction.member)&&!configuredRoleIds(c,['fondateur','cofondateur']).some(id=>interaction.member.roles.cache.has(id)))
          return safeInteractionReply(interaction,{
            content:'❌ Réservé à l’administration / Fondation.',
            flags:MessageFlags.Ephemeral
          });

        const sub=interaction.options.getSubcommand();

        if(sub==='tout-gagne'){
          // On ne supprime NI ventes, NI commandes, NI paiements, NI factures.
          // On mémorise simplement maintenant comme nouveau départ du compteur mensuel.
          setConfig(guild.id,'settings','monthlyRevenueResetAt',new Date().toISOString());

          await refreshBusinessPanels(guild);

          await journal(
            guild.id,
            `Compteur du montant gagné ce mois remis à 0 € par <@${interaction.user.id}>. Aucune donnée commerciale supprimée.`
          );

          return safeInteractionReply(interaction,{
            content:
              '✅ **Montant gagné ce mois remis à 0,00 €**.\n\n'+
              'Aucune commande, vente, facture, paiement, client ou historique n’a été supprimé.\n'+
              'Les panneaux financiers ont été actualisés automatiquement.',
            flags:MessageFlags.Ephemeral
          });
        }
      }

      if(interaction.commandName==='paiement'){
        const guild=interaction.guild;
        const c=getConfig(guild.id);
        const foundationIds=[c.roles.pole_fondation,c.roles.fondateur,c.roles.cofondateur].filter(Boolean);
        const authorized=isAdmin(interaction.member)||foundationIds.some(id=>interaction.member.roles.cache.has(id));
        if(!authorized)return safeInteractionReply(interaction,{content:'❌ Réservé à la Fondation / administration.',flags:MessageFlags.Ephemeral});

        const sub=interaction.options.getSubcommand();
        const db=getDb();

        if(sub==='en-attente'){
          const pending=Object.values(db.payments).filter(p=>p.guildId===guild.id&&p.status==='En attente');
          if(!pending.length)return safeInteractionReply(interaction,{content:'✅ Aucun paiement en attente.',flags:MessageFlags.Ephemeral});
          const content=pending.slice(0,20).map(p=>{
            const o=db.orders[p.orderId];
            return `**${p.id}** — **${p.orderId}** — <@${p.userId}> — ${o?.price==null?'Montant non défini':`${Number(o.price).toFixed(2)} €`}`;
          }).join('\n');
          return safeInteractionReply(interaction,{embeds:[embed('💳 Paiements en attente',content,0xF39C12)],flags:MessageFlags.Ephemeral});
        }

        if(sub==='relancer'){
          const id=interaction.options.getString('id').trim().toUpperCase();
          const payment=db.payments[id];
          if(!payment||payment.guildId!==guild.id)return safeInteractionReply(interaction,{content:`❌ Paiement **${id}** introuvable.`,flags:MessageFlags.Ephemeral});
          if(payment.status!=='En attente')return safeInteractionReply(interaction,{content:`ℹ️ ${id} est déjà **${payment.status}**.`,flags:MessageFlags.Ephemeral});

          const order=db.orders[payment.orderId];
          const payload=buildPaymentReviewPayload(payment,order);
          const dmResult=await notifyFoundationPaymentDM(guild,payment,payload);

          let channelSent=false;
          const channelId=c.channels.fondation||c.channels.acces_total||c.channels.paiements;
          const ch=channelId?await guild.channels.fetch(channelId).catch(()=>null):null;
          if(ch && typeof ch.isTextBased==='function' && ch.isTextBased()){
            const mention=foundationIds.map(r=>`<@&${r}>`).join(' ');
            await ch.send({
              content:`${mention}${mention?'\n':''}🔁 **Relance paiement à vérifier — ${id}**`,
              embeds:payload.embeds,
              components:payload.components,
              allowedMentions:{roles:foundationIds}
            }).catch(()=>null);
            channelSent=true;
          }

          return safeInteractionReply(interaction,{
            content:`✅ Relance **${id}** effectuée.\n📩 MP Fondation envoyés : **${dmResult.sent}**\n❌ MP impossibles : **${dmResult.failed}**\n📢 Copie dans salon : **${channelSent?'Oui':'Non'}**`,
            flags:MessageFlags.Ephemeral
          });
        }
      }

      if(interaction.commandName==='panneaux'){if(!isStaff(interaction.member,c))return safeInteractionReply(interaction,{content:'❌ Réservé au personnel.',flags:MessageFlags.Ephemeral});const sub=interaction.options.getSubcommand();const r=await repairPanels(guild,sub==='mettre-a-jour');return safeInteractionReply(interaction,{content:`✅ Panneaux : ${r.created} créés, ${r.updated} mis à jour, ${r.skipped} ignorés.`,flags:MessageFlags.Ephemeral})}
      if(interaction.commandName==='version'){if(!isAdmin(interaction.member)&&!configuredRoleIds(c,['fondateur','cofondateur']).some(id=>interaction.member.roles.cache.has(id)))return safeInteractionReply(interaction,{content:'❌ Réservé à la Fondation.',flags:MessageFlags.Ephemeral});migrateConfig(readJson(CONFIG_FILE));getDb();const r=await repairPanels(guild,false);return safeInteractionReply(interaction,{content:`✅ Migration terminée sans suppression. ${r.created} nouveaux panneaux installés, ${r.skipped} conservés.`,flags:MessageFlags.Ephemeral})}
      if(interaction.commandName==='tarif'){if(!hasFeature(interaction.member,c,'tarifs'))return safeInteractionReply(interaction,{content:'❌ Non autorisé.',flags:MessageFlags.Ephemeral});const ch=await guild.channels.fetch(c.channels.tarifs).catch(()=>null);if(!ch || typeof ch.isTextBased!=='function' || !ch.isTextBased())return safeInteractionReply(interaction,{content:'❌ Salon Tarifs non configuré.',flags:MessageFlags.Ephemeral});await upsertPanel(guild,'tarifs');return safeInteractionReply(interaction,{content:'✅ Tarifs publiés/mis à jour.',flags:MessageFlags.Ephemeral})}
      if(interaction.commandName==='liens'){if(!hasFeature(interaction.member,c,'liens'))return safeInteractionReply(interaction,{content:'❌ Non autorisé.',flags:MessageFlags.Ephemeral});setConfig(guild.id,'settings','linksText',interaction.options.getString('contenu'));await upsertPanel(guild,'liens');return safeInteractionReply(interaction,{content:'✅ Panneau Nos liens mis à jour sans doublon.',flags:MessageFlags.Ephemeral})}
      if(interaction.commandName==='role'){if(!isAdmin(interaction.member)&&!configuredRoleIds(c,['fondateur','cofondateur','directeur_general','directeur']).some(id=>interaction.member.roles.cache.has(id)))return safeInteractionReply(interaction,{content:'❌ Non autorisé.',flags:MessageFlags.Ephemeral});const user=interaction.options.getUser('utilisateur'),grade=interaction.options.getString('grade'),member=await getMember(guild,user.id);if(!member)return safeInteractionReply(interaction,{content:'❌ Utilisateur introuvable.',flags:MessageFlags.Ephemeral});if(interaction.options.getSubcommand()==='attribuer')await assignGrade(member,grade,c);else await removeGrade(member,grade,c);return safeInteractionReply(interaction,{content:'✅ Modification de rôle confirmée par Discord.',flags:MessageFlags.Ephemeral})}
      if(interaction.commandName==='projet'){if(!isStaff(interaction.member,c))return safeInteractionReply(interaction,{content:'❌ Réservé au personnel.',flags:MessageFlags.Ephemeral});const id=interaction.options.getString('id').toUpperCase(),db=getDb(),p=db.projects[id];if(!p)return safeInteractionReply(interaction,{content:'❌ Projet introuvable.',flags:MessageFlags.Ephemeral});const sub=interaction.options.getSubcommand();let idx=p.stageIndex;if(sub==='avancer')idx=Math.min(PROJECT_STAGES.length-1,idx+1);if(sub==='reculer')idx=Math.max(0,idx-1);if(sub==='etape')idx=Number(interaction.options.getString('etape'));const changed=await changeProjectStage(guild,p,idx);const updated=getDb().projects[id];const stage=PROJECT_STAGES[updated.stageIndex];return safeInteractionReply(interaction,{content:changed?`✅ **${id}** déplacé vers **${stage.label}** (${stage.progress}%). Le client a été informé en MP.`:'ℹ️ Le projet est déjà à cette étape.',flags:MessageFlags.Ephemeral})}
      if(interaction.commandName==='suivi'){return showTracking(interaction,'projects')}
      if(interaction.commandName==='projet-reparer'){
        if(!isStaff(interaction.member,c))return safeInteractionReply(interaction,{content:'❌ Réservé au personnel.',flags:MessageFlags.Ephemeral});
        const orderId=interaction.options.getString('commande').trim().toUpperCase();
        const db=getDb(),order=db.orders[orderId];
        if(!order)return safeInteractionReply(interaction,{content:`❌ Commande **${orderId}** introuvable.`,flags:MessageFlags.Ephemeral});
        if(!['Payée','Projet créé','En analyse','En développement','En tests','En corrections','Terminée','En livraison','Archivée'].includes(order.status)&&order.paymentStatus!=='Validé')
          return safeInteractionReply(interaction,{content:`❌ La commande **${orderId}** n'a pas de paiement validé.`,flags:MessageFlags.Ephemeral});
        const project=await createProject(guild,order);
        return safeInteractionReply(interaction,{content:`✅ Projet lié/réparé : **${project.id}** pour **${orderId}**.`,flags:MessageFlags.Ephemeral});
      }
      if(interaction.commandName==='sondage'){if(!hasFeature(interaction.member,c,'sondages'))return safeInteractionReply(interaction,{content:'❌ Non autorisé.',flags:MessageFlags.Ephemeral});const ch=await guild.channels.fetch(c.channels.sondages).catch(()=>null);if(!ch || typeof ch.isTextBased!=='function' || !ch.isTextBased())return safeInteractionReply(interaction,{content:'❌ Salon Sondages non configuré.',flags:MessageFlags.Ephemeral});const q=interaction.options.getString('question'),answers=interaction.options.getString('reponses').split('|').map(x=>x.trim()).filter(Boolean).slice(0,10),type=interaction.options.getString('type'),duration=interaction.options.getInteger('duree');if(answers.length<2)return safeInteractionReply(interaction,{content:'❌ Il faut au moins 2 réponses séparées par |.',flags:MessageFlags.Ephemeral});const pollId=`poll-${Date.now()}`;const menu=new StringSelectMenuBuilder().setCustomId(`poll_vote:${pollId}:${type}`).setPlaceholder(type==='multiple'?'Choisis une ou plusieurs réponses':'Choisis une réponse').setMinValues(1).setMaxValues(type==='multiple'?answers.length:1).addOptions(answers.map((a,i)=>({label:a.slice(0,100),value:String(i)})));const m=await ch.send({embeds:[embed('📊 Sondage',`**${q}**\n${duration?`Durée : ${duration} min`:''}`)],components:[new ActionRowBuilder().addComponents(menu)]});const db=getDb();db.polls[pollId]={id:pollId,guildId:guild.id,messageId:m.id,channelId:ch.id,question:q,answers,votes:{},endsAt:duration?Date.now()+duration*60000:null};writeJson(DB_FILE,db);return safeInteractionReply(interaction,{content:'✅ Sondage publié.',flags:MessageFlags.Ephemeral})}
      if(interaction.commandName==='offre'){if(!hasFeature(interaction.member,c,'offres'))return safeInteractionReply(interaction,{content:'❌ Non autorisé.',flags:MessageFlags.Ephemeral});const ch=await guild.channels.fetch(c.channels.offres_speciales).catch(()=>null);if(!ch || typeof ch.isTextBased!=='function' || !ch.isTextBased())return safeInteractionReply(interaction,{content:'❌ Salon Offres spéciales non configuré.',flags:MessageFlags.Ephemeral});const id=nextId('offers','OFFRE'),o={id,guildId:guild.id,title:interaction.options.getString('titre'),description:interaction.options.getString('description'),offer:interaction.options.getString('offre'),initial:interaction.options.getNumber('prix_initial'),promo:interaction.options.getNumber('prix_promo'),end:interaction.options.getString('fin'),quantity:interaction.options.getInteger('quantite'),createdAt:new Date().toISOString()};const db=getDb();db.offers[id]=o;writeJson(DB_FILE,db);await ch.send({embeds:[embed(`🔥 ${o.title}`,`${o.description}\n\nOffre : **${o.offer}**\nPrix initial : ~~${o.initial.toFixed(2)} €~~\nPrix promo : **${o.promo.toFixed(2)} €**${o.end?`\nFin : **${o.end}**`:''}${o.quantity?`\nQuantité : **${o.quantity}**`:''}`,0xED4245)]});return safeInteractionReply(interaction,{content:`✅ Offre ${id} publiée.`,flags:MessageFlags.Ephemeral})}
      if(interaction.commandName==='design'){if(!isStaff(interaction.member,c))return safeInteractionReply(interaction,{content:'❌ Réservé au personnel.',flags:MessageFlags.Ephemeral});const id=nextId('designs','DESIGN'),d={id,guildId:guild.id,type:interaction.options.getString('type'),title:interaction.options.getString('titre'),description:interaction.options.getString('description'),userId:interaction.options.getUser('client')?.id||null,claimedBy:interaction.user.id,status:'À faire',createdAt:new Date().toISOString()};const db=getDb();db.designs[id]=d;writeJson(DB_FILE,db);for(const key of ['creations',d.type]){const ch=await guild.channels.fetch(c.channels[key]).catch(()=>null);if(ch && typeof ch.isTextBased==='function' && ch.isTextBased())await ch.send({embeds:[designEmbed(d)],components:designControls(d)})}return safeInteractionReply(interaction,{content:`✅ Projet design ${id} créé.`,flags:MessageFlags.Ephemeral})}
      if(['tache','partenaire','contrat','decision'].includes(interaction.commandName)){if(!isStaff(interaction.member,c))return safeInteractionReply(interaction,{content:'❌ Réservé au personnel.',flags:MessageFlags.Ephemeral});const map={tache:['tasks','TACHE','planning'],partenaire:['partners','PART','partenaires'],contrat:['contracts','CONTRAT','contrats'],decision:['decisions','DEC','decisions']};const [collection,prefix,channelKey]=map[interaction.commandName],id=nextId(collection,prefix);let item={id,guildId:guild.id,createdBy:interaction.user.id,createdAt:new Date().toISOString()};if(interaction.commandName==='tache')item={...item,title:interaction.options.getString('titre'),responsibleId:interaction.options.getUser('responsable').id,priority:interaction.options.getString('priorite'),deadline:interaction.options.getString('echeance'),status:'À faire'};else if(interaction.commandName==='partenaire')item={...item,name:interaction.options.getString('nom'),details:interaction.options.getString('details')};else item={...item,title:interaction.options.getString('titre'),details:interaction.options.getString('details')};const db=getDb();db[collection][id]=item;writeJson(DB_FILE,db);const ch=await guild.channels.fetch(c.channels[channelKey]).catch(()=>null);if(ch && typeof ch.isTextBased==='function' && ch.isTextBased())await ch.send({embeds:[embed(id,interaction.commandName==='tache'?`Titre : **${item.title}**\nResponsable : <@${item.responsibleId}>\nPriorité : **${item.priority}**\nÉchéance : **${item.deadline}**\nStatut : **${item.status}**`:interaction.commandName==='partenaire'?`Nom : **${item.name}**\n${item.details}`:`Titre : **${item.title}**\n${item.details}`)]});return safeInteractionReply(interaction,{content:`✅ ${id} créé.`,flags:MessageFlags.Ephemeral})}
    }

    if(interaction.isStringSelectMenu()){
      if(interaction.customId==='order_offer_select'){const offerKey=interaction.values[0];const modal=new ModalBuilder().setCustomId(`order_modal:${offerKey}`).setTitle('Nouvelle commande');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('project').setLabel('Nom du projet').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('service').setLabel('Service demandé').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('deadline').setLabel('Délai souhaité').setStyle(TextInputStyle.Short).setRequired(false)));return interaction.showModal(modal)}
      if(interaction.customId==='ticket_select'||interaction.customId==='ticket_select_premium'){const ch=await createTicket(interaction.guild,interaction.user.id,interaction.values[0],interaction.customId.endsWith('premium'));return safeInteractionReply(interaction,{content:`✅ Ticket créé : ${ch}.`,flags:MessageFlags.Ephemeral})}
      if(interaction.customId==='faq_select'){const val=interaction.values[0];const components=val==='q19'?[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('go_support').setLabel('Ouvrir un ticket').setStyle(ButtonStyle.Primary))]:[];return safeInteractionReply(interaction,{embeds:[embed('❓ FAQ',faqAnswer(val))],components,flags:MessageFlags.Ephemeral})}
      if(interaction.customId==='order_question_select'){const ch=await createTicket(interaction.guild,interaction.user.id,`commande-${interaction.values[0]}`);return safeInteractionReply(interaction,{content:`✅ Ticket créé : ${ch}.`,flags:MessageFlags.Ephemeral})}
      if(interaction.customId.startsWith('project_stage:')){
        const id=interaction.customId.split(':')[1],db=getDb(),p=db.projects[id],c=getConfig(p?.guildId);
        if(!p)return safeInteractionReply(interaction,{content:'❌ Projet introuvable.',flags:MessageFlags.Ephemeral});
        if(!isStaff(interaction.member,c))return safeInteractionReply(interaction,{content:'❌ Réservé au personnel.',flags:MessageFlags.Ephemeral});

        const targetIndex=Number(interaction.values[0]);
        if(isDeliveryStageIndex(targetIndex)){
          return interaction.showModal(buildDeliveryModal(p.id));
        }

        const changed=await changeProjectStage(interaction.guild,p,targetIndex);
        return safeInteractionReply(interaction,{
          content:changed
            ?`✅ Projet déplacé vers **${PROJECT_STAGES[targetIndex].label}**. Le client a été informé en MP.`
            :'ℹ️ Étape inchangée.',
          flags:MessageFlags.Ephemeral
        });
      }
      if(interaction.customId.startsWith('design_stage:')){const id=interaction.customId.split(':')[1],db=getDb(),d=db.designs[id];if(!d)return safeInteractionReply(interaction,{content:'❌ Projet design introuvable.',flags:MessageFlags.Ephemeral});d.status=interaction.values[0];db.designs[id]=d;writeJson(DB_FILE,db);return interaction.update({embeds:[designEmbed(d)],components:designControls(d)})}
      if(interaction.customId.startsWith('poll_vote:')){const[,id]=interaction.customId.split(':');const db=getDb(),p=db.polls[id];if(!p)return safeInteractionReply(interaction,{content:'❌ Sondage introuvable.',flags:MessageFlags.Ephemeral});if(p.endsAt&&Date.now()>p.endsAt)return safeInteractionReply(interaction,{content:'❌ Ce sondage est terminé.',flags:MessageFlags.Ephemeral});p.votes[interaction.user.id]=interaction.values;db.polls[id]=p;writeJson(DB_FILE,db);return safeInteractionReply(interaction,{content:'✅ Vote enregistré.',flags:MessageFlags.Ephemeral})}
    }

    if(interaction.isButton()){
      if(!buttonMustAnswerDirectly(interaction.customId) && !interaction.deferred && !interaction.replied){
        await interaction.deferReply({flags:MessageFlags.Ephemeral});
      }
      if(interaction.customId==='rules_accept'){if(!interaction.deferred&&!interaction.replied)await interaction.deferReply({flags:MessageFlags.Ephemeral});const guild=interaction.guild,c=getConfig(guild.id),member=interaction.member;try{if(c.roles.nouveau&&member.roles.cache.has(c.roles.nouveau))await applyRole(member,c.roles.nouveau,'remove',guild.id,'Nouveau');await applyRole(member,c.roles.membre,'add',guild.id,'Membre');return safeInteractionReply(interaction,{content:`✅ Règlement accepté.\nLe rôle <@&${c.roles.membre}> vous a été attribué.`,flags:MessageFlags.Ephemeral})}catch(e){await logError(guild.id,e,'Acceptation règlement');return safeInteractionReply(interaction,{content:`❌ Impossible de finaliser l’acceptation : ${e.message}`,flags:MessageFlags.Ephemeral})}}
      if(interaction.customId==='go_quote'){const modal=new ModalBuilder().setCustomId('quote_modal').setTitle('Demande de devis');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('project').setLabel('Nom du projet').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('service').setLabel('Service').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Description détaillée').setStyle(TextInputStyle.Paragraph).setRequired(true)));return interaction.showModal(modal)}
      if(interaction.customId==='go_order')return safeInteractionReply(interaction,{content:'Utilise le panneau **Commander** pour choisir ton offre.',flags:MessageFlags.Ephemeral});
      if(interaction.customId==='go_support'){const ch=await createTicket(interaction.guild,interaction.user.id,'support');return safeInteractionReply(interaction,{content:`✅ Ticket créé : ${ch}.`,flags:MessageFlags.Ephemeral})}
      if(interaction.customId==='track_quotes')return showTracking(interaction,'quotes');if(interaction.customId==='track_orders')return showTracking(interaction,'orders');if(interaction.customId==='track_projects')return showTracking(interaction,'projects');
      if(interaction.customId==='payment_declare'){const modal=new ModalBuilder().setCustomId('payment_modal').setTitle('Déclarer un paiement');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('order').setLabel('Numéro de commande (CMD-0001)').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('proof').setLabel('Référence / preuve éventuelle').setStyle(TextInputStyle.Paragraph).setRequired(true)));return interaction.showModal(modal)}
      if(interaction.customId==='review_open'){const db=getDb(),gid=interaction.guild.id;const ok=Object.values(db.projects).some(p=>p.guildId===gid&&p.userId===interaction.user.id&&PROJECT_STAGES[p.stageIndex]?.key==='archives');if(!ok)return safeInteractionReply(interaction,{content:'❌ Vous devez avoir terminé au moins une commande pour laisser un avis.',flags:MessageFlags.Ephemeral});const modal=new ModalBuilder().setCustomId('review_modal').setTitle('Laisser un avis');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Titre').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('rating').setLabel('Note sur 5').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('message').setLabel('Message').setStyle(TextInputStyle.Paragraph).setRequired(true)));return interaction.showModal(modal)}
      if(interaction.customId==='bot_showcase_open'){const modal=new ModalBuilder().setCustomId('bot_showcase_modal').setTitle('Présenter mon bot');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('name').setLabel('Nom').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('photo').setLabel('URL de la photo').setStyle(TextInputStyle.Short).setRequired(false)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('features').setLabel('Fonctionnalités').setStyle(TextInputStyle.Paragraph).setRequired(true)));return interaction.showModal(modal)}
      if(interaction.customId==='test_open'){const modal=new ModalBuilder().setCustomId('test_modal').setTitle('Commencer un test');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('project').setLabel('Projet (PROJ-0001)').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('version').setLabel('Version').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('objective').setLabel('Objectif').setStyle(TextInputStyle.Paragraph).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('method').setLabel('Méthode').setStyle(TextInputStyle.Paragraph).setRequired(true)));return interaction.showModal(modal)}
      if(interaction.customId==='test_mine'){const arr=Object.values(getDb().tests).filter(x=>x.guildId===interaction.guild.id&&x.userId===interaction.user.id);return safeInteractionReply(interaction,{embeds:[embed('🧪 Mes tests',arr.length?arr.map(x=>`**${x.id}** — ${x.projectId} — ${x.status}`).join('\n'):'Aucun test.')],flags:MessageFlags.Ephemeral})}
      if(interaction.customId==='bug_open'){const modal=new ModalBuilder().setCustomId('bug_modal').setTitle('Déclarer un bug');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('project').setLabel('Projet (PROJ-0001)').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('severity').setLabel('Gravité').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('steps').setLabel('Comment reproduire').setStyle(TextInputStyle.Paragraph).setRequired(true)));return interaction.showModal(modal)}
      if(interaction.customId==='bug_mine'){const arr=Object.values(getDb().bugs).filter(x=>x.guildId===interaction.guild.id&&x.userId===interaction.user.id);return safeInteractionReply(interaction,{embeds:[embed('🐞 Mes bugs',arr.length?arr.map(x=>`**${x.id}** — ${x.projectId} — ${x.status}`).join('\n'):'Aucun bug.')],flags:MessageFlags.Ephemeral})}
      if(interaction.customId==='sav_open'){const modal=new ModalBuilder().setCustomId('sav_modal').setTitle('Ouvrir un SAV');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reference').setLabel('Projet ou commande').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Problème rencontré').setStyle(TextInputStyle.Paragraph).setRequired(true)));return interaction.showModal(modal)}
      if(interaction.customId.startsWith('quote_')){
        const[action,id]=interaction.customId.split(':'),db=getDb(),q=db.quotes[id];
        if(!q)return safeInteractionReply(interaction,{content:'❌ Devis introuvable.',flags:MessageFlags.Ephemeral});
        const guild=await getGuild(q.guildId),c=getConfig(q.guildId),member=await getMember(guild,interaction.user.id);

        if(action==='quote_client_accept'||action==='quote_client_refuse'){
          if(interaction.user.id!==q.userId)return safeInteractionReply(interaction,{content:'❌ Ce devis ne vous appartient pas.',flags:MessageFlags.Ephemeral});
          q.status=action==='quote_client_accept'?'Accepté par le client':'Refusé';
          db.quotes[id]=q;writeJson(DB_FILE,db);await saveQuoteCard(guild,q);
          await notifyQuoteClient(q,`Mise à jour du devis ${q.id}`,action==='quote_client_accept'?`Merci pour votre confiance. Vous avez accepté le devis **${q.id}**. Notre équipe peut maintenant le transformer en commande.`:`Vous avez refusé le devis **${q.id}**. Votre demande reste enregistrée.`);
          return safeInteractionReply(interaction,{content:`✅ Devis ${q.status.toLowerCase()}.`,flags:MessageFlags.Ephemeral});
        }

        if(!isStaff(member,c))return safeInteractionReply(interaction,{content:'❌ Réservé au personnel.',flags:MessageFlags.Ephemeral});

        if(action==='quote_claim'){
          q.claimedBy=interaction.user.id;q.status='Pris en charge';
          db.quotes[id]=q;writeJson(DB_FILE,db);await saveQuoteCard(guild,q);
          await notifyQuoteClient(q,`Votre devis ${q.id} est pris en charge`,`Bonne nouvelle, votre devis **${q.id}** est maintenant pris en charge par notre équipe.`);
          return safeInteractionReply(interaction,{content:'✅ Devis pris en charge.',flags:MessageFlags.Ephemeral});
        }

        if(action==='quote_price'){
          const modal=new ModalBuilder().setCustomId(`quote_price_modal:${id}`).setTitle('Définir le prix');
          modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('price').setLabel('Prix en €').setStyle(TextInputStyle.Short).setRequired(true)));
          return interaction.showModal(modal);
        }

        if(action==='quote_send'){
          if(q.price==null)return safeInteractionReply(interaction,{content:'❌ Définissez d’abord le prix.',flags:MessageFlags.Ephemeral});
          const ok=await sendDm(q.userId,{embeds:[quoteEmbed(q)],components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`quote_client_accept:${id}`).setLabel('Accepter').setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId(`quote_client_refuse:${id}`).setLabel('Refuser').setStyle(ButtonStyle.Danger))]});
          if(!ok)return safeInteractionReply(interaction,{content:'❌ MP impossible.',flags:MessageFlags.Ephemeral});
          q.status='Envoyé au client';db.quotes[id]=q;writeJson(DB_FILE,db);await saveQuoteCard(guild,q);
          return safeInteractionReply(interaction,{content:'✅ Devis envoyé au client.',flags:MessageFlags.Ephemeral});
        }

        if(action==='quote_contact'){
          const modal=new ModalBuilder().setCustomId(`contact_modal:quotes:${id}`).setTitle('Contacter le client');
          modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('text').setLabel('Message').setStyle(TextInputStyle.Paragraph).setRequired(true)));
          return interaction.showModal(modal);
        }

        if(action==='quote_order'){
          if(q.status!=='Accepté par le client')return safeInteractionReply(interaction,{content:'❌ Le client doit accepter le devis.',flags:MessageFlags.Ephemeral});
          const o=await createOrder(guild,q.userId,'custom',q.projectName,q.service,q.description,q.price,q.id);
          q.status='Transformé en commande';q.orderId=o.id;
          db.quotes[id]=q;writeJson(DB_FILE,db);await saveQuoteCard(guild,q);
          await notifyQuoteClient(q,`Merci pour votre confiance`,`Votre devis **${q.id}** a été transformé en commande **${o.id}**. Vous pouvez maintenant suivre votre commande.`);
          return safeInteractionReply(interaction,{content:`✅ Devis transformé en commande **${o.id}**.`,flags:MessageFlags.Ephemeral});
        }

        if(action==='quote_refuse'){
          q.status='Refusé';db.quotes[id]=q;writeJson(DB_FILE,db);await saveQuoteCard(guild,q);
          await notifyQuoteClient(q,`Devis ${q.id} refusé`,`Votre devis **${q.id}** a été refusé par notre équipe. Vous pouvez nous contacter pour plus d’informations.`);
          return safeInteractionReply(interaction,{content:'✅ Devis refusé.',flags:MessageFlags.Ephemeral});
        }

        if(action==='quote_archive'){
          if(!c.channels.archives_devis)return safeInteractionReply(interaction,{content:'❌ Configurez d’abord le salon Archives devis avec /config salon.',flags:MessageFlags.Ephemeral});
          q.previousStatus=q.status;q.status='Archivé';
          await moveCardToArchive(guild,q,'quote');
          db.quotes[id]=q;writeJson(DB_FILE,db);
          await notifyQuoteClient(q,`Devis ${q.id} archivé`,`Votre devis **${q.id}** a été archivé. Il reste conservé pendant au moins 14 jours.`);
          return safeInteractionReply(interaction,{content:'✅ Devis déplacé dans les archives.',flags:MessageFlags.Ephemeral});
        }

        if(action==='quote_restore'){
          await restoreArchivedCard(guild,q,'quote');
          db.quotes[id]=q;writeJson(DB_FILE,db);
          await notifyQuoteClient(q,`Devis ${q.id} réactivé`,`Votre devis **${q.id}** a été retiré des archives et réactivé.`);
          return safeInteractionReply(interaction,{content:'✅ Devis repris et replacé dans le salon des devis.',flags:MessageFlags.Ephemeral});
        }

        if(action==='quote_delete'){
          if(!archiveDeleteAllowed(q)){
            const remaining=Math.ceil((14*24*60*60*1000-(Date.now()-new Date(q.archivedAt).getTime()))/(24*60*60*1000));
            return safeInteractionReply(interaction,{content:`❌ Suppression définitive impossible avant la fin du délai de 14 jours. Il reste environ **${remaining} jour(s)**.`,flags:MessageFlags.Ephemeral});
          }
          await deleteArchivedCard(guild,q,'quote');
          delete db.quotes[id];writeJson(DB_FILE,db);
          return safeInteractionReply(interaction,{content:'✅ Devis supprimé définitivement après le délai de conservation.',flags:MessageFlags.Ephemeral});
        }
      }
      if(interaction.customId.startsWith('order_')){
        const[action,id]=interaction.customId.split(':');
        let db=getDb();
        let o=db.orders[id];

        // Si la fiche existe encore sur Discord mais que operations.json a été réinitialisé,
        // on reconstruit automatiquement la commande depuis l'embed au premier clic.
        if(!o){
          o=await recoverOrderFromInteractionMessage(interaction,id);
          db=getDb();
        }

        if(!o)return safeInteractionReply(interaction,{
          content:'❌ Commande introuvable dans les données et récupération automatique impossible.',
          flags:MessageFlags.Ephemeral
        });
        const guild=await getGuild(o.guildId),c=getConfig(o.guildId),member=await getMember(guild,interaction.user.id);
        if(!isStaff(member,c))return safeInteractionReply(interaction,{content:'❌ Réservé au personnel.',flags:MessageFlags.Ephemeral});

        if(action==='order_claim'){
          o.claimedBy=interaction.user.id;o.status='Prise en charge';
          db.orders[id]=o;writeJson(DB_FILE,db);await saveOrderCard(guild,o);
          await notifyOrderClient(o,`Commande ${o.id} prise en charge`,`Votre commande **${o.id}** est maintenant prise en charge par notre équipe.`);
          return safeInteractionReply(interaction,{content:'✅ Commande prise en charge.',flags:MessageFlags.Ephemeral});
        }

        if(action==='order_accept'){
          o.status='Acceptée';db.orders[id]=o;writeJson(DB_FILE,db);await saveOrderCard(guild,o);
          await notifyOrderClient(o,`Commande ${o.id} acceptée`,`Bonne nouvelle, votre commande **${o.id}** a été acceptée. Vous recevrez prochainement les instructions de paiement.`);
          return safeInteractionReply(interaction,{content:'✅ Commande acceptée.',flags:MessageFlags.Ephemeral});
        }

        if(action==='order_refuse'){
          o.status='Refusée';db.orders[id]=o;writeJson(DB_FILE,db);await saveOrderCard(guild,o);
          await notifyOrderClient(o,`Commande ${o.id} refusée`,`Votre commande **${o.id}** a été refusée. Vous pouvez contacter notre équipe pour plus d’informations.`);
          return safeInteractionReply(interaction,{content:'✅ Commande refusée.',flags:MessageFlags.Ephemeral});
        }

        if(action==='order_contact'){
          const modal=new ModalBuilder().setCustomId(`contact_modal:orders:${id}`).setTitle('Contacter le client');
          modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('text').setLabel('Message').setStyle(TextInputStyle.Paragraph).setRequired(true)));
          return interaction.showModal(modal);
        }

        if(action==='order_pay'){
          if(!c.settings.paypalUrl)return safeInteractionReply(interaction,{content:'❌ PayPal non configuré.',flags:MessageFlags.Ephemeral});
          const ok=await sendDm(o.userId,{embeds:[embed(`💳 Paiement — ${o.id}`,`${c.settings.paymentMessage||''}\n\nMontant : **${o.price==null?'À définir':`${Number(o.price).toFixed(2)} €`}**\nLien officiel : ${c.settings.paypalUrl}`)],components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`payment_from_order:${o.id}`).setLabel('J’ai payé').setStyle(ButtonStyle.Success))]});
          if(!ok)return safeInteractionReply(interaction,{content:'❌ Impossible d’envoyer le MP.',flags:MessageFlags.Ephemeral});
          o.status='Paiement envoyé';o.paymentStatus='Envoyé';
          db.orders[id]=o;writeJson(DB_FILE,db);await saveOrderCard(guild,o);
          return safeInteractionReply(interaction,{content:'✅ Lien de paiement envoyé au client.',flags:MessageFlags.Ephemeral});
        }

        if(action==='order_archive'){
          if(!c.channels.archives_commandes)return safeInteractionReply(interaction,{content:'❌ Configurez d’abord le salon Archives commandes avec /config salon.',flags:MessageFlags.Ephemeral});
          o.previousStatus=o.status;o.status='Archivée';
          await moveCardToArchive(guild,o,'order');
          db.orders[id]=o;writeJson(DB_FILE,db);
          await notifyOrderClient(o,`Commande ${o.id} archivée`,`Votre commande **${o.id}** a été archivée. Elle reste conservée pendant au moins 14 jours.`);
          return safeInteractionReply(interaction,{content:'✅ Commande déplacée dans les archives.',flags:MessageFlags.Ephemeral});
        }

        if(action==='order_restore'){
          await restoreArchivedCard(guild,o,'order');
          db.orders[id]=o;writeJson(DB_FILE,db);
          await notifyOrderClient(o,`Commande ${o.id} réactivée`,`Votre commande **${o.id}** a été retirée des archives et réactivée.`);
          return safeInteractionReply(interaction,{content:'✅ Commande reprise et replacée dans le salon Commandes.',flags:MessageFlags.Ephemeral});
        }

        if(action==='order_delete'){
          if(!archiveDeleteAllowed(o)){
            const remaining=Math.ceil((14*24*60*60*1000-(Date.now()-new Date(o.archivedAt).getTime()))/(24*60*60*1000));
            return safeInteractionReply(interaction,{content:`❌ Suppression définitive impossible avant la fin du délai de 14 jours. Il reste environ **${remaining} jour(s)**.`,flags:MessageFlags.Ephemeral});
          }
          await deleteArchivedCard(guild,o,'order');
          delete db.orders[id];writeJson(DB_FILE,db);
          return safeInteractionReply(interaction,{content:'✅ Commande supprimée définitivement après le délai de conservation.',flags:MessageFlags.Ephemeral});
        }
      }
      if(interaction.customId.startsWith('payment_from_order:')){const orderId=interaction.customId.split(':')[1];const modal=new ModalBuilder().setCustomId(`payment_order_modal:${orderId}`).setTitle('J’ai payé');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('proof').setLabel('Référence / preuve').setStyle(TextInputStyle.Paragraph).setRequired(true)));return interaction.showModal(modal)}
      if(interaction.customId.startsWith('payment_')){const[action,id]=interaction.customId.split(':'),db=getDb(),p=db.payments[id];if(!p)return safeInteractionReply(interaction,{content:'❌ Paiement introuvable.',flags:MessageFlags.Ephemeral});const guild=await getGuild(p.guildId),c=getConfig(p.guildId),member=await getMember(guild,interaction.user.id);if(!isStaff(member,c))return safeInteractionReply(interaction,{content:'❌ Réservé au personnel.',flags:MessageFlags.Ephemeral});if(action==='payment_accept'){const r=await validatePayment(guild,id,interaction.user.id);const latest=getDb(),validatedPayment=latest.payments[id],validatedOrder=validatedPayment?latest.orders[validatedPayment.orderId]:null,project=validatedOrder?.projectId?latest.projects[validatedOrder.projectId]:null;if(!r.already&&validatedOrder){await notifyOrderClient(validatedOrder,`✅ Paiement validé — ${id}`,`Votre paiement **${id}** a été confirmé.\n\nCommande : **${validatedOrder.id}**\nStatut : **Payée**\nProjet créé : **${project?.id||validatedOrder.projectId||'En cours de création'}**\n\nMerci pour votre confiance. Votre projet entre maintenant dans notre processus de réalisation.`);}return safeInteractionReply(interaction,{content:r.already?'ℹ️ Paiement déjà validé, aucun doublon créé.':`✅ Paiement validé.\n📦 Commande : **${validatedOrder?.id||'—'}** → **Payée**\n🚀 Projet : **${project?.id||validatedOrder?.projectId||'Créé'}**\n🧾 Vente, facture, fiche client et statistiques mises à jour.`,flags:MessageFlags.Ephemeral})}if(action==='payment_refuse'){p.status='Refusé';db.payments[id]=p;writeJson(DB_FILE,db);await sendDm(p.userId,{content:`❌ Paiement ${id} refusé.`});return safeInteractionReply(interaction,{content:'✅ Paiement refusé.',flags:MessageFlags.Ephemeral})}if(action==='payment_newproof'){await sendDm(p.userId,{content:`⚠️ Une nouvelle preuve est demandée pour ${id}.`});return safeInteractionReply(interaction,{content:'✅ Demande envoyée.',flags:MessageFlags.Ephemeral})}if(action==='payment_contact'){const modal=new ModalBuilder().setCustomId(`contact_modal:payments:${id}`).setTitle('Contacter le client');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('text').setLabel('Message').setStyle(TextInputStyle.Paragraph).setRequired(true)));return interaction.showModal(modal)}}
      if(interaction.customId.startsWith('project_')){const[action,id]=interaction.customId.split(':'),db=getDb(),p=db.projects[id];if(!p)return safeInteractionReply(interaction,{content:'❌ Projet introuvable.',flags:MessageFlags.Ephemeral});const guild=await getGuild(p.guildId),c=getConfig(p.guildId),member=await getMember(guild,interaction.user.id);if(!isStaff(member,c))return safeInteractionReply(interaction,{content:'❌ Réservé au personnel.',flags:MessageFlags.Ephemeral});if(action==='project_claim'){p.claimedBy=interaction.user.id;p.updatedAt=new Date().toISOString();db.projects[id]=p;writeJson(DB_FILE,db);await syncProjectCardsSafe(guild,p,'Prise en charge projet');await sendDm(p.userId,{embeds:[embed(`🚀 Projet ${p.id} pris en charge`,`Bonne nouvelle, votre projet **${p.id}** est maintenant pris en charge par notre équipe.\nÉtape actuelle : **${PROJECT_STAGES[p.stageIndex].label}**.`)]});return safeInteractionReply(interaction,{content:'✅ Projet pris en charge et client informé.',flags:MessageFlags.Ephemeral})}if(action==='project_prev'||action==='project_next'){
          const idx=action==='project_prev'?Math.max(0,p.stageIndex-1):Math.min(PROJECT_STAGES.length-1,p.stageIndex+1);

          if(action==='project_next'&&isDeliveryStageIndex(idx)){
            return interaction.showModal(buildDeliveryModal(p.id));
          }

          const changed=await changeProjectStage(guild,p,idx);
          return safeInteractionReply(interaction,{
            content:changed
              ?`✅ Projet déplacé vers **${PROJECT_STAGES[idx].label}**. Le client a été informé en MP.`
              :'ℹ️ Étape inchangée.',
            flags:MessageFlags.Ephemeral
          });
        }if(action==='project_contact'){const modal=new ModalBuilder().setCustomId(`contact_modal:projects:${id}`).setTitle('Contacter le client');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('text').setLabel('Message').setStyle(TextInputStyle.Paragraph).setRequired(true)));return interaction.showModal(modal)}}
      if(interaction.customId.startsWith('test_status:')){const parts=interaction.customId.split(':'),id=parts[1],status=parts.slice(2).join(':'),db=getDb(),t=db.tests[id];if(!t)return safeInteractionReply(interaction,{content:'❌ Test introuvable.',flags:MessageFlags.Ephemeral});const guild=await getGuild(t.guildId),c=getConfig(t.guildId),member=await getMember(guild,interaction.user.id);if(interaction.user.id!==t.userId&&!isStaff(member,c))return safeInteractionReply(interaction,{content:'❌ Tu ne peux modifier que tes tests.',flags:MessageFlags.Ephemeral});t.status=status;db.tests[id]=t;writeJson(DB_FILE,db);await interaction.update({embeds:[testEmbed(t)],components:testControls(t)});await sendDm(t.userId,{embeds:[embed(`🧪 Mise à jour ${id}`,`Statut : **${status}**`)]});return}
      if(interaction.customId.startsWith('bug_status:')){const parts=interaction.customId.split(':'),id=parts[1],status=parts.slice(2).join(':'),db=getDb(),b=db.bugs[id];if(!b)return safeInteractionReply(interaction,{content:'❌ Bug introuvable.',flags:MessageFlags.Ephemeral});const guild=await getGuild(b.guildId),c=getConfig(b.guildId),member=await getMember(guild,interaction.user.id);if(interaction.user.id!==b.userId&&!isStaff(member,c))return safeInteractionReply(interaction,{content:'❌ Tu ne peux modifier que tes bugs.',flags:MessageFlags.Ephemeral});b.status=status;db.bugs[id]=b;writeJson(DB_FILE,db);await interaction.update({embeds:[bugEmbed(b)],components:bugControls(b)});await sendDm(b.userId,{embeds:[embed(`🐞 Mise à jour ${id}`,`Statut : **${status}**`)]});return}
      if(interaction.customId.startsWith('ticket_')){const[action,id]=interaction.customId.split(':'),db=getDb(),t=db.tickets[id];if(!t)return safeInteractionReply(interaction,{content:'❌ Ticket introuvable.',flags:MessageFlags.Ephemeral});const guild=await getGuild(t.guildId),c=getConfig(t.guildId),member=await getMember(guild,interaction.user.id);if(!isStaff(member,c))return safeInteractionReply(interaction,{content:'❌ Réservé au personnel.',flags:MessageFlags.Ephemeral});const ch=await guild.channels.fetch(t.channelId).catch(()=>null);if(action==='ticket_claim'){t.claimedBy=interaction.user.id;db.tickets[id]=t;writeJson(DB_FILE,db);return safeInteractionReply(interaction,{content:`✅ Ticket pris par ${interaction.user}.`})}if(action==='ticket_contact'){const modal=new ModalBuilder().setCustomId(`contact_modal:tickets:${id}`).setTitle('Contacter le client');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('text').setLabel('Message').setStyle(TextInputStyle.Paragraph).setRequired(true)));return interaction.showModal(modal)}if(action==='ticket_member_add'||action==='ticket_member_remove'){return safeInteractionReply(interaction,{content:'Choisis un utilisateur :',components:[new ActionRowBuilder().addComponents(new UserSelectMenuBuilder().setCustomId(`${action}_select:${id}`).setPlaceholder('Sélectionner un utilisateur').setMinValues(1).setMaxValues(1))],flags:MessageFlags.Ephemeral})}if(action==='ticket_rename'){const modal=new ModalBuilder().setCustomId(`ticket_rename_modal:${id}`).setTitle('Renommer le ticket');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('name').setLabel('Nouveau nom').setStyle(TextInputStyle.Short).setRequired(true)));return interaction.showModal(modal)}if(action==='ticket_close'){t.status='Fermé';db.tickets[id]=t;writeJson(DB_FILE,db);if(ch)await ch.permissionOverwrites.edit(t.userId,{SendMessages:false});return safeInteractionReply(interaction,{content:'🔒 Ticket fermé.'})}if(action==='ticket_reopen'){t.status='Ouvert';db.tickets[id]=t;writeJson(DB_FILE,db);if(ch)await ch.permissionOverwrites.edit(t.userId,{SendMessages:true});return safeInteractionReply(interaction,{content:'🔓 Ticket rouvert.'})}if(action==='ticket_archive'){t.status='Archivé';db.tickets[id]=t;writeJson(DB_FILE,db);if(ch)await ch.setName(`archive-${ch.name}`.slice(0,100));return safeInteractionReply(interaction,{content:'📁 Ticket archivé.'})}}
    }

    if(interaction.isUserSelectMenu()){
      const[action,id]=interaction.customId.split(':'),db=getDb(),t=db.tickets[id];if(!t)return safeInteractionReply(interaction,{content:'❌ Ticket introuvable.',flags:MessageFlags.Ephemeral});const guild=await getGuild(t.guildId),c=getConfig(t.guildId),member=await getMember(guild,interaction.user.id);if(!isStaff(member,c))return safeInteractionReply(interaction,{content:'❌ Réservé au personnel.',flags:MessageFlags.Ephemeral});const targetId=interaction.values[0],ch=await guild.channels.fetch(t.channelId).catch(()=>null);if(!ch)return safeInteractionReply(interaction,{content:'❌ Salon ticket introuvable.',flags:MessageFlags.Ephemeral});if(action==='ticket_member_add_select'){await ch.permissionOverwrites.edit(targetId,{ViewChannel:true,SendMessages:true,ReadMessageHistory:true});if(!t.memberIds.includes(targetId))t.memberIds.push(targetId)}else{await ch.permissionOverwrites.delete(targetId).catch(()=>{});t.memberIds=t.memberIds.filter(x=>x!==targetId)}db.tickets[id]=t;writeJson(DB_FILE,db);return interaction.update({content:'✅ Permissions du ticket mises à jour.',components:[]})
    }

    if(interaction.isModalSubmit()){
      if(!interaction.deferred&&!interaction.replied) await interaction.deferReply({flags:MessageFlags.Ephemeral});
      const gid=interaction.guildId || null;
      if(interaction.customId.startsWith('project_delivery_modal:')){
        const projectId=interaction.customId.split(':')[1];
        const db=getDb();
        const p=db.projects[projectId];

        if(!p)return safeInteractionReply(interaction,{
          content:'❌ Projet introuvable.',
          flags:MessageFlags.Ephemeral
        });

        const guild=await getGuild(p.guildId);
        const c=getConfig(p.guildId);
        const member=await getMember(guild,interaction.user.id);

        if(!isStaff(member,c))return safeInteractionReply(interaction,{
          content:'❌ Réservé au personnel.',
          flags:MessageFlags.Ephemeral
        });

        const link=interaction.fields.getTextInputValue('delivery_link').trim();
        const customMessage=interaction.fields.getTextInputValue('delivery_message').trim();

        if(!/^https?:\/\//i.test(link)){
          return safeInteractionReply(interaction,{
            content:'❌ Le lien doit commencer par **http://** ou **https://**.',
            flags:MessageFlags.Ephemeral
          });
        }

        const deliveryIndex=PROJECT_STAGES.findIndex(s=>s.key==='livraisons_projets');
        if(deliveryIndex<0)throw new Error('Étape Livraison introuvable.');

        // Enregistrer le lien sur le projet avant le changement d'étape.
        p.deliveryLink=link;
        p.deliveryMessage=customMessage||null;
        p.deliveredBy=interaction.user.id;
        p.deliveredAt=new Date().toISOString();

        db.projects[p.id]=p;
        writeJson(DB_FILE,db);

        await changeProjectStage(guild,p,deliveryIndex);

        // Mettre à jour / créer la fiche de livraison avec le lien.
        const latest=getDb();
        let delivery=Object.values(latest.deliveries).find(x=>x.projectId===p.id);

        if(delivery){
          delivery.status='Livré';
          delivery.link=link;
          delivery.deliveredBy=interaction.user.id;
          delivery.deliveredAt=new Date().toISOString();
          latest.deliveries[delivery.id]=delivery;
          writeJson(DB_FILE,latest);
        }

        const thanks=customMessage||
          `Merci beaucoup pour votre confiance et pour votre commande chez Creaty. `+
          `Nous espérons que votre projet vous plaira !`;

        const dmOk=await sendDm(p.userId,{
          embeds:[embed(
            `📦 Livraison de votre projet ${p.id}`,
            `${thanks}\n\n`+
            `Votre projet **${p.projectName}** est maintenant prêt.\n`+
            `Commande : **${p.orderId}**\n\n`+
            `🔗 **Lien de livraison :**\n${link}\n\n`+
            `Merci encore pour votre confiance. N'hésitez pas à nous contacter si vous avez besoin d'aide.`,
            0x57F287
          )]
        });

        await journal(
          guild.id,
          `${p.id} livré par <@${interaction.user.id}> — lien envoyé au client : ${dmOk?'oui':'non'}`
        );

        return safeInteractionReply(interaction,{
          content:dmOk
            ?`✅ **${p.id}** est passé en **Livraison** et le lien a été envoyé en MP au client.`
            :`⚠️ **${p.id}** est passé en **Livraison**, mais le MP n'a pas pu être envoyé au client. Le lien reste enregistré.`,
          flags:MessageFlags.Ephemeral
        });
      }

      if(interaction.customId==='quote_modal'){const q=await createQuote(interaction.guild,interaction.user.id,interaction.fields.getTextInputValue('project'),interaction.fields.getTextInputValue('service'),interaction.fields.getTextInputValue('description'));return safeInteractionReply(interaction,{content:`✅ Devis créé : **${q.id}**.`,flags:MessageFlags.Ephemeral})}
      if(interaction.customId.startsWith('order_modal:')){const offerKey=interaction.customId.split(':')[1],o=await createOrder(interaction.guild,interaction.user.id,offerKey,interaction.fields.getTextInputValue('project'),interaction.fields.getTextInputValue('service'),`${interaction.fields.getTextInputValue('description')}\nDélai souhaité : ${interaction.fields.getTextInputValue('deadline')||'Non précisé'}`);return safeInteractionReply(interaction,{content:`✅ Commande créée : **${o.id}**.`,flags:MessageFlags.Ephemeral})}
      if(interaction.customId.startsWith('quote_price_modal:')){const id=interaction.customId.split(':')[1],db=getDb(),q=db.quotes[id];if(!q)return safeInteractionReply(interaction,{content:'❌ Devis introuvable.',flags:MessageFlags.Ephemeral});const price=Number(interaction.fields.getTextInputValue('price').replace(',','.'));if(!Number.isFinite(price)||price<0)return safeInteractionReply(interaction,{content:'❌ Prix invalide.',flags:MessageFlags.Ephemeral});q.price=price;q.status='Prix défini';db.quotes[id]=q;writeJson(DB_FILE,db);const guild=await getGuild(q.guildId);await saveQuoteCard(guild,q);await notifyQuoteClient(q,`Prix défini pour ${q.id}`,`Le prix de votre devis **${q.id}** a été défini à **${price.toFixed(2)} €**.`);return safeInteractionReply(interaction,{content:`✅ Prix : **${price.toFixed(2)} €**.`,flags:MessageFlags.Ephemeral})}
      if(interaction.customId==='payment_modal'||interaction.customId.startsWith('payment_order_modal:')){const orderId=interaction.customId==='payment_modal'?interaction.fields.getTextInputValue('order').trim().toUpperCase():interaction.customId.split(':')[1],proof=interaction.fields.getTextInputValue('proof'),db=getDb(),o=db.orders[orderId];if(!o||o.userId!==interaction.user.id)return safeInteractionReply(interaction,{content:'❌ Commande introuvable ou non autorisée.',flags:MessageFlags.Ephemeral});const existing=Object.values(db.payments).find(x=>x.orderId===orderId&&x.status==='En attente');if(existing)return safeInteractionReply(interaction,{content:`ℹ️ Un paiement est déjà en attente : **${existing.id}**.`,flags:MessageFlags.Ephemeral});const paymentId=nextId('payments','PAY'),latest=getDb();latest.payments[paymentId]={id:paymentId,guildId:o.guildId,orderId,userId:interaction.user.id,proof,status:'En attente',processed:false,createdAt:new Date().toISOString()};latest.orders[orderId].paymentStatus='À vérifier';latest.orders[orderId].status='Paiement à vérifier';writeJson(DB_FILE,latest);const guild=await getGuild(o.guildId),c=getConfig(o.guildId),ch=await guild.channels.fetch(c.channels.paiements).catch(()=>null);if(!isUsableTextChannel(ch))return safeInteractionReply(interaction,{content:'❌ Salon Paiements non configuré ou invalide.',flags:MessageFlags.Ephemeral});const paymentPayload={embeds:[embed(`💳 ${paymentId}`,`Commande : **${orderId}**\nClient : <@${interaction.user.id}>\nMontant attendu : **${o.price==null?'Non défini':`${Number(o.price).toFixed(2)} €`}**\n\nPreuve / référence :\n${proof}`,0xF39C12)],components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`payment_accept:${paymentId}`).setLabel('Valider').setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId(`payment_refuse:${paymentId}`).setLabel('Refuser').setStyle(ButtonStyle.Danger),new ButtonBuilder().setCustomId(`payment_newproof:${paymentId}`).setLabel('Nouvelle preuve').setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId(`payment_contact:${paymentId}`).setLabel('Contacter').setStyle(ButtonStyle.Secondary))]};await ch.send(paymentPayload);const foundationChannelId=c.channels.fondation||c.channels.acces_total;const foundationCh=foundationChannelId?await guild.channels.fetch(foundationChannelId).catch(()=>null):null;if(isUsableTextChannel(foundationCh)&&foundationCh.id!==ch.id){const foundationRoleIds=[c.roles.pole_fondation,c.roles.fondateur,c.roles.cofondateur].filter(Boolean);const mention=foundationRoleIds.map(id=>`<@&${id}>`).join(' ');await foundationCh.send({content:`${mention}${mention?'\n':''}💳 **Nouveau paiement à vérifier** — ${paymentId}`,embeds:paymentPayload.embeds,components:paymentPayload.components,allowedMentions:{roles:foundationRoleIds}}).catch(async e=>{await logError(guild.id,e,`Notification Fondation paiement ${paymentId}`)});}const foundationDmResult=await notifyFoundationPaymentDM(guild,latest.payments[paymentId],paymentPayload);await saveOrderCard(guild,latest.orders[orderId]);await notifyOrderClient(latest.orders[orderId],`Paiement ${paymentId} reçu`,`Nous avons bien reçu votre déclaration de paiement pour la commande **${orderId}**. Votre preuve est maintenant en cours de vérification par la Fondation.`);return safeInteractionReply(interaction,{content:`✅ Paiement déclaré : **${paymentId}**.\n📩 Fondation prévenue en MP : **${foundationDmResult.sent}** membre(s).${foundationDmResult.failed?`\n⚠️ ${foundationDmResult.failed} MP impossible(s).`:''}`,flags:MessageFlags.Ephemeral})}
      if(interaction.customId==='review_modal'){const title=interaction.fields.getTextInputValue('title'),rating=Math.max(1,Math.min(5,parseInt(interaction.fields.getTextInputValue('rating'),10)||5)),message=interaction.fields.getTextInputValue('message'),id=nextId('reviews','AVIS'),db=getDb();db.reviews[id]={id,guildId:interaction.guild.id,userId:interaction.user.id,title,rating,message,createdAt:new Date().toISOString()};writeJson(DB_FILE,db);const c=getConfig(interaction.guild.id),ch=await interaction.guild.channels.fetch(c.channels.avis).catch(()=>null);if(ch && typeof ch.isTextBased==='function' && ch.isTextBased())await ch.send({embeds:[embed(`⭐ ${title}`,`${message}\n\nAuteur : ${interaction.user}\nNote : **${rating}/5**\nCommande vérifiée`,0xF1C40F)]});return safeInteractionReply(interaction,{content:'✅ Avis publié.',flags:MessageFlags.Ephemeral})}
      if(interaction.customId==='bot_showcase_modal'){const name=interaction.fields.getTextInputValue('name'),photo=interaction.fields.getTextInputValue('photo'),description=interaction.fields.getTextInputValue('description'),features=interaction.fields.getTextInputValue('features');if(/https?:\/\//i.test(description)||/https?:\/\//i.test(features))return safeInteractionReply(interaction,{content:'❌ Les liens sont interdits dans Vos bots.',flags:MessageFlags.Ephemeral});const e=embed(`🤖 ${name}`,`${description}\n\n**Fonctionnalités :**\n${features}\n\nPrésenté par ${interaction.user}`);if(photo&&/^https?:\/\//i.test(photo))e.setThumbnail(photo);return safeInteractionReply(interaction,{content:'✅ Présentation enregistrée.',flags:MessageFlags.Ephemeral}).then(async()=>{const c=getConfig(interaction.guild.id),ch=await interaction.guild.channels.fetch(c.channels.vos_bots).catch(()=>null);if(ch && typeof ch.isTextBased==='function' && ch.isTextBased())await ch.send({embeds:[e]})})}
      if(interaction.customId==='test_modal'){const projectId=interaction.fields.getTextInputValue('project').trim().toUpperCase(),db=getDb();if(!db.projects[projectId])return safeInteractionReply(interaction,{content:'❌ Projet introuvable.',flags:MessageFlags.Ephemeral});const id=nextId('tests','TEST'),t={id,guildId:interaction.guild.id,userId:interaction.user.id,projectId,version:interaction.fields.getTextInputValue('version'),objective:interaction.fields.getTextInputValue('objective'),method:interaction.fields.getTextInputValue('method'),result:'',conclusion:'',status:'À tester',createdAt:new Date().toISOString()};const latest=getDb();latest.tests[id]=t;writeJson(DB_FILE,latest);const c=getConfig(interaction.guild.id),ch=await interaction.guild.channels.fetch(c.channels.tests_dev).catch(()=>null);if(!ch || typeof ch.isTextBased!=='function' || !ch.isTextBased())return safeInteractionReply(interaction,{content:'❌ Salon Tests non configuré.',flags:MessageFlags.Ephemeral});await ch.send({embeds:[testEmbed(t)],components:testControls(t)});await sendDm(t.userId,{embeds:[embed(`🧪 Test ${id} commencé`,`Projet : **${projectId}**\nStatut : **À tester**`)]});return safeInteractionReply(interaction,{content:`✅ Test créé : **${id}**.`,flags:MessageFlags.Ephemeral})}
      if(interaction.customId==='bug_modal'){const projectId=interaction.fields.getTextInputValue('project').trim().toUpperCase(),db=getDb();if(!db.projects[projectId])return safeInteractionReply(interaction,{content:'❌ Projet introuvable.',flags:MessageFlags.Ephemeral});const id=nextId('bugs','BUG'),b={id,guildId:interaction.guild.id,userId:interaction.user.id,projectId,severity:interaction.fields.getTextInputValue('severity'),description:interaction.fields.getTextInputValue('description'),steps:interaction.fields.getTextInputValue('steps'),claimedBy:null,status:'Nouveau',createdAt:new Date().toISOString()};const latest=getDb();latest.bugs[id]=b;writeJson(DB_FILE,latest);const c=getConfig(interaction.guild.id),ch=await interaction.guild.channels.fetch(c.channels.bugs).catch(()=>null);if(!ch || typeof ch.isTextBased!=='function' || !ch.isTextBased())return safeInteractionReply(interaction,{content:'❌ Salon Bugs non configuré.',flags:MessageFlags.Ephemeral});await ch.send({embeds:[bugEmbed(b)],components:bugControls(b)});await sendDm(b.userId,{embeds:[embed(`🐞 Bug ${id} créé`,`Projet : **${projectId}**\nStatut : **Nouveau**`)]});return safeInteractionReply(interaction,{content:`✅ Bug créé : **${id}**.`,flags:MessageFlags.Ephemeral})}
      if(interaction.customId==='sav_modal'){const ref=interaction.fields.getTextInputValue('reference').trim().toUpperCase(),description=interaction.fields.getTextInputValue('description'),db=getDb();let project=db.projects[ref];if(!project&&db.orders[ref]?.projectId)project=db.projects[db.orders[ref].projectId];if(!project)return safeInteractionReply(interaction,{content:'❌ Projet ou commande introuvable.',flags:MessageFlags.Ephemeral});const delivery=Object.values(db.deliveries).find(x=>x.projectId===project.id);if(!delivery)return safeInteractionReply(interaction,{content:'❌ Aucune livraison enregistrée pour ce projet.',flags:MessageFlags.Ephemeral});const days=(Date.now()-new Date(delivery.createdAt).getTime())/86400000;if(days>14)return safeInteractionReply(interaction,{content:'❌ La garantie technique de 14 jours est expirée.',flags:MessageFlags.Ephemeral});const ch=await createTicket(interaction.guild,interaction.user.id,'sav',false,project.orderId);await ch.send({embeds:[embed('🛠️ Demande SAV',`Projet : **${project.id}**\n${description}`)]});return safeInteractionReply(interaction,{content:`✅ Ticket SAV créé : ${ch}.`,flags:MessageFlags.Ephemeral})}
      if(interaction.customId.startsWith('ticket_rename_modal:')){const id=interaction.customId.split(':')[1],db=getDb(),t=db.tickets[id];if(!t)return safeInteractionReply(interaction,{content:'❌ Ticket introuvable.',flags:MessageFlags.Ephemeral});const guild=await getGuild(t.guildId),ch=await guild.channels.fetch(t.channelId).catch(()=>null);if(!ch)return safeInteractionReply(interaction,{content:'❌ Salon introuvable.',flags:MessageFlags.Ephemeral});await ch.setName(interaction.fields.getTextInputValue('name').toLowerCase().replace(/[^a-z0-9-]/g,'-').slice(0,100));return safeInteractionReply(interaction,{content:'✅ Ticket renommé.',flags:MessageFlags.Ephemeral})}
      if(interaction.customId.startsWith('contact_modal:')){const[,collection,id]=interaction.customId.split(':'),db=getDb(),item=db[collection]?.[id];if(!item)return safeInteractionReply(interaction,{content:'❌ Élément introuvable.',flags:MessageFlags.Ephemeral});const ok=await sendDm(item.userId,{embeds:[embed(`💬 Message concernant ${id}`,interaction.fields.getTextInputValue('text'))]});return safeInteractionReply(interaction,{content:ok?'✅ Message envoyé.':'❌ Impossible d’envoyer le MP.',flags:MessageFlags.Ephemeral})}
    }
  }catch(error){const gid=interaction.guildId||null;await logError(gid,error,`Interaction ${interaction.type} ${interaction.customId||interaction.commandName||''}`);if(!interaction.replied&&!interaction.deferred)await safeInteractionReply(interaction,{content:`❌ Erreur : ${error.message||'Une erreur est survenue.'}`,flags:MessageFlags.Ephemeral}).catch(()=>{});}
});

client.on(Events.Error,e=>console.error('❌ Erreur Discord :',e));
process.on('unhandledRejection',e=>console.error('❌ Promesse non gérée :',e));
process.on('uncaughtException',e=>console.error('❌ Exception non gérée :',e));
process.on('SIGTERM',()=>{console.log('SIGTERM reçu, arrêt propre.');client.destroy();process.exit(0)});
process.on('SIGINT',()=>{console.log('SIGINT reçu, arrêt propre.');client.destroy();process.exit(0)});

client.login(process.env.TOKEN).catch(e=>{console.error('❌ Connexion Discord impossible :',e);process.exit(1)});
