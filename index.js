require('dotenv').config();

const fs = require('fs');
const path = require('path');
const {
  Client, GatewayIntentBits, Partials, Events, SlashCommandBuilder, ChannelType,
  PermissionFlagsBits, MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder,
  ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
  ActivityType
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

const CHANNELS = [
  ['bienvenue','Bienvenue'],['depart','À bientôt'],['reglement','Règlement'],['annonces','Annonces'],['info','Informations'],['roadmap','Roadmap'],['liens','Nos liens'],['faq','FAQ'],['sondages','Sondages'],['ticket','Ticket'],
  ['discussion','Discussion'],['media','Média'],['suggestion','Suggestion'],['vos_bots','Vos bots'],['presentation','Présentation'],['evenements','Événements'],
  ['creation_bot','Création bot'],['creation_serveur','Création serveur'],['hebergement','Hébergement'],['tarifs','Tarifs'],['garantie','Garantie'],
  ['commander','Commander'],['demander_devis','Demander un devis'],['suivi_commandes','Suivi commandes'],['paiements','Paiements'],['conditions','Conditions'],['questions_commandes','Questions commandes'],['offres_speciales','Offres spéciales'],
  ['infos_clients','Informations clients'],['livraisons_clients','Livraisons clients'],['factures','Factures'],['avis','Laisser un avis'],
  ['support_premium','Support prioritaire'],['commandes_premium','Commandes prioritaires'],['avantages_premium','Avantages Premium'],['annonces_premium','Annonces Premium'],['premium_chat','Premium Chat'],
  ['annonces_dev','Annonces Dev'],['discussion_dev','Discussion Dev'],['documentation','Documentation'],['tests_dev','Tests Dev'],['bugs','Bugs'],
  ['liste_projets','Liste des projets'],['projets_attente','Projets en attente'],['analyse','Analyse'],['developpement','Développement'],['tests_projets','Tests projets'],['corrections','Corrections'],['termines','Terminés'],['livraisons_projets','Livraisons projets'],['archives','Archives'],
  ['ventes','Ventes'],['devis_commerciaux','Devis commerciaux'],['commandes_commerciales','Commandes commerciales'],['statistiques_commerciales','Statistiques commerciales'],['objectifs','Objectifs'],['chiffre_affaires','Chiffre d’affaires'],['discussion_commerciale','Discussion commerciale'],
  ['creations','Créations'],['logos','Logos'],['bannieres','Bannières'],['miniatures','Miniatures'],['reseaux_sociaux','Réseaux sociaux'],['discussion_design','Discussion Design'],
  ['staff_chat','Staff Chat'],['staff_annonces','Staff Annonces'],['recrutements','Recrutements'],['sanctions','Sanctions'],['reunions','Réunions'],
  ['direction','Direction'],['finance','Finance'],['statistiques_globales','Statistiques globales'],['planning','Planning'],['partenaires','Partenaires'],['contrats','Contrats'],['decisions','Décisions'],['documents','Documents'],
  ['fondation','Fondation'],['documents_confidentiels','Documents confidentiels'],['projets_secrets','Projets secrets'],['gestion_financiere','Gestion financière'],['acces_total','Accès total'],['journal_direction','Journal de direction']
];

const CATEGORIES = [
  ['tickets','Catégorie Tickets'],
  ['tickets_premium','Catégorie Tickets Premium'],
  ['devis','Catégorie salons privés Devis']
];

const ROLES = [
  ['nouveau','Nouveau'],['membre','Membre'],['prospect','Prospect'],['client','Client'],['client_premium','Client Premium'],
  ['staff','Support / Staff'],['commercial','Commercial'],['developpeur','Développeur'],['moderateur','Modérateur'],['administrateur','Administrateur'],['directeur','Directeur'],['cofondateur','Co-Fondateur'],['fondateur','Fondateur']
];

const PRICES = {
  mini: { label: 'Bot Mini', price: 15, description: 'Petit bot personnalisé, jusqu’à 10 fonctionnalités prévues au cahier des charges.' },
  essentiel: { label: 'Bot Essentiel', price: 35, description: 'Bot personnalisé standard, jusqu’à 25 fonctionnalités.' },
  avance: { label: 'Bot Avancé', price: 40, description: 'Bot complet, jusqu’à 50 fonctionnalités et systèmes avancés.' },
  premium: { label: 'Bot Premium', price: 60, description: 'Bot + création/refonte du serveur Discord + 1 mois d’hébergement offert.' },
  hosting: { label: 'Hébergement', price: 5, description: 'Hébergement du bot : 5 €/mois.' }
};

function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CONFIG_FILE)) fs.writeFileSync(CONFIG_FILE, JSON.stringify({ guilds: {} }, null, 2));
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({
    counters: { tickets:0, quotes:0, orders:0, payments:0, sales:0, projects:0, tests:0, bugs:0, reviews:0 },
    tickets:{}, quotes:{}, orders:{}, payments:{}, sales:{}, projects:{}, tests:{}, bugs:{}, reviews:{}
  }, null, 2));
}

function readJson(file) { ensureFiles(); return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, data) { ensureFiles(); fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

function getConfig(guildId) {
  const data = readJson(CONFIG_FILE);
  if (!data.guilds[guildId]) data.guilds[guildId] = {};
  const c = data.guilds[guildId];
  if (!c.channels) c.channels = {};
  if (!c.categories) c.categories = {};
  if (!c.roles) c.roles = {};
  if (!c.panels) c.panels = {};
  if (!c.settings) c.settings = {};
  if (!c.permissions) c.permissions = {};
  if (typeof c.settings.paypalUrl !== 'string') c.settings.paypalUrl = '';
  if (typeof c.settings.paymentMessage !== 'string') c.settings.paymentMessage = '';
  if (typeof c.settings.monthlyGoal !== 'number') c.settings.monthlyGoal = 0;
  writeJson(CONFIG_FILE, data);
  return c;
}

function setConfig(guildId, section, key, value) {
  const data = readJson(CONFIG_FILE);
  if (!data.guilds[guildId]) data.guilds[guildId] = {};
  const c = data.guilds[guildId];
  if (!c.channels) c.channels = {};
  if (!c.categories) c.categories = {};
  if (!c.roles) c.roles = {};
  if (!c.panels) c.panels = {};
  if (!c.settings) c.settings = {};
  if (!c.permissions) c.permissions = {};
  if (!c[section]) c[section] = {};
  c[section][key] = value;
  writeJson(CONFIG_FILE, data);
}

function getDb() {
  const db = readJson(DB_FILE);
  if (!db.counters) db.counters = {};
  for (const k of ['tickets','quotes','orders','payments','sales','projects','tests','bugs','reviews']) {
    if (typeof db.counters[k] !== 'number') db.counters[k] = 0;
    if (!db[k]) db[k] = {};
  }
  writeJson(DB_FILE, db);
  return db;
}

function nextId(type, prefix) {
  const db = getDb();
  db.counters[type] += 1;
  const id = `${prefix}-${String(db.counters[type]).padStart(4,'0')}`;
  writeJson(DB_FILE, db);
  return id;
}

function embed(title, description, color = 0x5865F2) {
  return new EmbedBuilder().setTitle(title).setDescription(description).setColor(color).setTimestamp().setFooter({ text: 'Creaty Bot' });
}

function isAdmin(member) { return Boolean(member?.permissions?.has(PermissionFlagsBits.Administrator)); }
function isStaff(member, c) {
  if (!member) return false;
  if (isAdmin(member)) return true;
  const ids = [c.roles.staff,c.roles.commercial,c.roles.developpeur,c.roles.moderateur,c.roles.administrateur,c.roles.directeur,c.roles.cofondateur,c.roles.fondateur].filter(Boolean);
  return member.roles.cache.some(r => ids.includes(r.id));
}
function hasFeature(member, c, key) {
  if (isAdmin(member)) return true;
  const roleId = c.permissions[key];
  if (roleId && member.roles.cache.has(roleId)) return true;
  const founders = [c.roles.fondateur,c.roles.cofondateur].filter(Boolean);
  return member.roles.cache.some(r => founders.includes(r.id));
}
async function sendDm(userId, payload) {
  try { const u = await client.users.fetch(userId); await u.send(payload); return true; } catch { return false; }
}

function tariffsEmbed() {
  return embed('💰 Tarifs Creaty Bot', [
    `**Bot Mini — 15 €**\n${PRICES.mini.description}`,
    `**Bot Essentiel — 35 €**\n${PRICES.essentiel.description}`,
    `**Bot Avancé — 40 €**\n${PRICES.avance.description}`,
    `**Bot Premium — 60 €**\n${PRICES.premium.description}`,
    `**Hébergement — 5 €/mois**\n${PRICES.hosting.description}`,
    '',
    '**Important :** les limites concernent le cahier des charges accepté avant le développement. Les ajouts après validation peuvent faire l’objet d’un nouveau devis.'
  ].join('\n\n'), 0xF1C40F);
}

function panelFor(key) {
  const defs = {
    reglement:['📜 Règlement','Respect, sécurité et comportement professionnel sont obligatoires. Clique ci-dessous pour accepter.',0x57F287],
    info:['📌 Informations','Bienvenue chez Creaty Bot. Utilise les salons dédiés pour les devis, commandes, paiements, suivi et support.',0x3498DB],
    liens:['🔗 Nos liens','Les liens officiels sont gérés via la commande `/liens` par les personnes autorisées.',0x3498DB],
    faq:['❓ FAQ','Choisis une question dans le menu. Si ton problème n’est pas résolu, ouvre un ticket.',0xF1C40F],
    ticket:['🎫 Support','Uniquement : Support, Bug, SAV / Garantie, Partenariat et Autre.',0x3498DB],
    suggestion:['💡 Suggestions','Propose une amélioration à l’équipe.',0xF1C40F],
    creation_bot:['🤖 Création de bot','Découvre nos offres puis commande ou demande un devis.',0x5865F2],
    creation_serveur:['💬 Création de serveur Discord','Création ou refonte complète de serveurs Discord.',0x5865F2],
    hebergement:['🌐 Hébergement','Hébergement disponible à **5 €/mois**. Le Bot Premium inclut le premier mois.',0x3498DB],
    garantie:['📃 Garantie','Garantie technique de **14 jours après livraison**. Pour un problème couvert, ouvre un SAV.',0x95A5A6],
    commander:['📝 Commander','Choisis ton offre puis remplis le formulaire.',0x5865F2],
    demander_devis:['💰 Demander un devis','Demande un devis personnalisé. Un salon privé de discussion peut être créé.',0xF1C40F],
    suivi_commandes:['📦 Suivi','Consulte tes devis, commandes et projets.',0x3498DB],
    paiements:['💳 Paiements','Déclare un paiement effectué pour une commande.',0x2ECC71],
    conditions:['📜 Conditions','Une commande commence après validation et paiement. Les ajouts après validation peuvent nécessiter un nouveau devis. La garantie technique est de 14 jours après livraison. Les délais sont indicatifs. Les problèmes causés par des services tiers ou des modifications externes ne sont pas automatiquement couverts.',0x95A5A6],
    questions_commandes:['❓ Questions commandes','Choisis ton problème. Un ticket privé sera créé.',0xF1C40F],
    avis:['⭐ Laisser un avis','Seuls les clients ayant au moins un projet terminé peuvent publier un avis.',0xF1C40F],
    tests_dev:['🧪 Tests','Commence un test lié à un numéro de projet ou consulte uniquement tes propres tests.',0x9B59B6],
    bugs:['🐞 Bugs','Déclare et suis les bugs liés aux projets.',0xED4245]
  };
  return defs[key];
}

function panelComponents(key) {
  if (key === 'reglement') return [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('rules_accept').setLabel('Accepter le règlement').setStyle(ButtonStyle.Success))];
  if (key === 'ticket' || key === 'support_premium') return [new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId(key === 'support_premium' ? 'ticket_select_premium' : 'ticket_select').setPlaceholder('Choisir un type de ticket').addOptions(
      {label:'Support',value:'support',emoji:'❓'},{label:'Bug',value:'bug',emoji:'🐞'},{label:'SAV / Garantie',value:'sav',emoji:'🛠️'},{label:'Partenariat',value:'partenariat',emoji:'🤝'},{label:'Autre',value:'autre',emoji:'📌'}
    ))];
  if (key === 'creation_bot' || key === 'creation_serveur' || key === 'hebergement') return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('go_order').setLabel('Commander').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('go_quote').setLabel('Demander un devis').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('go_support').setLabel('Poser une question').setStyle(ButtonStyle.Secondary)
  )];
  if (key === 'tarifs') return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('go_order').setLabel('Commander').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('go_quote').setLabel('Demander un devis').setStyle(ButtonStyle.Primary)
  )];
  if (key === 'garantie') return [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('sav_open').setLabel('Ouvrir un SAV').setStyle(ButtonStyle.Primary))];
  if (key === 'commander') return [new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId('order_offer_select').setPlaceholder('Choisir une offre').addOptions(
      {label:'Bot Mini — 15 €',value:'mini'},{label:'Bot Essentiel — 35 €',value:'essentiel'},{label:'Bot Avancé — 40 €',value:'avance'},{label:'Bot Premium — 60 €',value:'premium'},{label:'Hébergement — 5 €/mois',value:'hosting'},{label:'Projet sur mesure',value:'custom'}
    ))];
  if (key === 'demander_devis') return [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('go_quote').setLabel('Demander un devis').setStyle(ButtonStyle.Primary))];
  if (key === 'suivi_commandes') return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('track_quotes').setLabel('Mes devis').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('track_orders').setLabel('Mes commandes').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('track_projects').setLabel('Mes projets').setStyle(ButtonStyle.Success)
  )];
  if (key === 'paiements') return [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('payment_declare').setLabel('Déclarer un paiement').setStyle(ButtonStyle.Success))];
  if (key === 'questions_commandes') return [new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId('order_question_select').setPlaceholder('Choisir une question').addOptions(
      {label:'Je ne comprends pas ma commande',value:'comprendre'},{label:'Où en est ma commande ?',value:'suivi'},{label:'Problème de paiement',value:'paiement'},{label:'Modifier ma commande',value:'modifier'},{label:'Annuler ma demande',value:'annuler'},{label:'Question sur mon devis',value:'devis'},{label:'Autre',value:'autre'}
    ))];
  if (key === 'avis') return [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('review_open').setLabel('Laisser un avis').setStyle(ButtonStyle.Success))];
  if (key === 'tests_dev') return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('test_open').setLabel('Commencer un test').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('test_mine').setLabel('Mes tests').setStyle(ButtonStyle.Secondary)
  )];
  if (key === 'bugs') return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('bug_open').setLabel('Déclarer un bug').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('bug_mine').setLabel('Mes bugs').setStyle(ButtonStyle.Secondary)
  )];
  if (key === 'faq') return [new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId('faq_select').setPlaceholder('Choisir une question').addOptions(
      {label:'Comment commander ?',value:'commander'},{label:'Quelle offre choisir ?',value:'offre'},{label:'Comment demander un devis ?',value:'devis'},{label:'Comment payer ?',value:'payer'},{label:'Comment suivre mon projet ?',value:'suivi'},{label:'Combien de temps prend un projet ?',value:'delai'},{label:'Comment fonctionne l’hébergement ?',value:'hosting'},{label:'Comment fonctionne la garantie ?',value:'garantie'},{label:'Mon bot a un bug',value:'bug'},{label:'Modifier ma commande',value:'modifier'},{label:'Ajouter des fonctionnalités',value:'ajout'},{label:'Problème non résolu',value:'ticket'}
    ))];
  return [];
}

async function upsertPanel(guild, key) {
  const c = getConfig(guild.id);
  const channel = guild.channels.cache.get(c.channels[key]);
  if (!channel || !channel.isTextBased()) return false;
  let payload;
  if (key === 'tarifs') payload = { embeds:[tariffsEmbed()], components:panelComponents(key) };
  else {
    const d = panelFor(key);
    if (!d) return false;
    payload = { embeds:[embed(d[0],d[1],d[2])], components:panelComponents(key) };
  }
  const oldId = c.panels[key];
  if (oldId) {
    try { const m = await channel.messages.fetch(oldId); await m.edit(payload); return true; } catch {}
  }
  const m = await channel.send(payload);
  setConfig(guild.id,'panels',key,m.id);
  return true;
}

async function createPrivateChannel(guild, categoryId, userId, name, c) {
  const overwrites = [
    {id:guild.roles.everyone.id,deny:[PermissionFlagsBits.ViewChannel]},
    {id:userId,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles]}
  ];
  for (const roleId of [c.roles.staff,c.roles.commercial,c.roles.moderateur,c.roles.administrateur,c.roles.directeur,c.roles.cofondateur,c.roles.fondateur].filter(Boolean)) {
    overwrites.push({id:roleId,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles]});
  }
  return guild.channels.create({name:name.toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,90),type:ChannelType.GuildText,parent:categoryId||undefined,permissionOverwrites:overwrites});
}

function quoteEmbed(q){return embed(`💰 ${q.id} — ${q.projectName}`,[`Client : <@${q.userId}>`,`Service : **${q.service}**`,`Prix : **${q.price==null?'À définir':`${Number(q.price).toFixed(2)} €`}**`,`Statut : **${q.status}**`,`Responsable : ${q.claimedBy?`<@${q.claimedBy}>`:'Aucun'}`,`Salon privé : ${q.privateChannelId?`<#${q.privateChannelId}>`:'Non créé'}`,'',q.description].join('\n'),0xF1C40F)}
function quoteControls(q){return [new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`quote_claim:${q.id}`).setLabel('Prendre').setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId(`quote_price:${q.id}`).setLabel('Définir le prix').setStyle(ButtonStyle.Secondary),
  new ButtonBuilder().setCustomId(`quote_send:${q.id}`).setLabel('Envoyer au client').setStyle(ButtonStyle.Success),
  new ButtonBuilder().setCustomId(`quote_contact:${q.id}`).setLabel('Contacter').setStyle(ButtonStyle.Secondary)
),new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`quote_order:${q.id}`).setLabel('Transformer en commande').setStyle(ButtonStyle.Success).setDisabled(q.status!=='Accepté par le client'),
  new ButtonBuilder().setCustomId(`quote_refuse:${q.id}`).setLabel('Refuser').setStyle(ButtonStyle.Danger),
  new ButtonBuilder().setCustomId(`quote_archive:${q.id}`).setLabel('Archiver').setStyle(ButtonStyle.Secondary)
)]}

function orderEmbed(o){return embed(`📦 ${o.id} — ${o.projectName}`,[`Client : <@${o.userId}>`,`Offre : **${o.offerLabel||o.service}**`,`Prix : **${o.price==null?'À définir':`${Number(o.price).toFixed(2)} €`}**`,`Statut : **${o.status}**`,`Paiement : **${o.paymentStatus}**`,`Responsable : ${o.claimedBy?`<@${o.claimedBy}>`:'Aucun'}`,`Projet : **${o.projectId||'Non créé'}**`].join('\n'),0x3498DB)}
function orderControls(o){return [new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`order_claim:${o.id}`).setLabel('Prendre').setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId(`order_accept:${o.id}`).setLabel('Accepter').setStyle(ButtonStyle.Success).setDisabled(o.status!=='En attente'),
  new ButtonBuilder().setCustomId(`order_refuse:${o.id}`).setLabel('Refuser').setStyle(ButtonStyle.Danger),
  new ButtonBuilder().setCustomId(`order_contact:${o.id}`).setLabel('Contacter').setStyle(ButtonStyle.Secondary)
),new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`order_pay:${o.id}`).setLabel('Envoyer le paiement').setStyle(ButtonStyle.Success).setDisabled(o.status!=='Acceptée'),
  new ButtonBuilder().setCustomId(`order_archive:${o.id}`).setLabel('Archiver').setStyle(ButtonStyle.Secondary)
)]}

function projectEmbed(p){const s=PROJECT_STAGES[p.stageIndex];return embed(`${s.emoji} ${p.id} — ${p.projectName}`,[`Client : <@${p.userId}>`,`Commande : **${p.orderId}**`,`Responsable : ${p.claimedBy?`<@${p.claimedBy}>`:'Aucun'}`,`Étape : **${s.label}**`,`Progression : **${s.progress}%**`].join('\n'))}
function projectControls(p){return [new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`project_claim:${p.id}`).setLabel('Prendre').setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId(`project_prev:${p.id}`).setLabel('Précédent').setStyle(ButtonStyle.Secondary).setDisabled(p.stageIndex<=0),
  new ButtonBuilder().setCustomId(`project_next:${p.id}`).setLabel('Suivant').setStyle(ButtonStyle.Success).setDisabled(p.stageIndex>=PROJECT_STAGES.length-1),
  new ButtonBuilder().setCustomId(`project_contact:${p.id}`).setLabel('Contacter').setStyle(ButtonStyle.Secondary)
),new ActionRowBuilder().addComponents(
  new StringSelectMenuBuilder().setCustomId(`project_stage:${p.id}`).setPlaceholder('Choisir une étape').addOptions(PROJECT_STAGES.map((s,i)=>({label:s.label,value:String(i),emoji:s.emoji,default:p.stageIndex===i})))
)]}

async function saveQuoteCard(guild,q){const c=getConfig(guild.id);const ch=guild.channels.cache.get(c.channels.devis_commerciaux);if(!ch?.isTextBased())throw new Error('Salon Devis commerciaux non configuré.');if(q.messageId){try{const m=await ch.messages.fetch(q.messageId);await m.edit({embeds:[quoteEmbed(q)],components:quoteControls(q)});return;}catch{}}const m=await ch.send({embeds:[quoteEmbed(q)],components:quoteControls(q)});const db=getDb();if(db.quotes[q.id])db.quotes[q.id].messageId=m.id;writeJson(DB_FILE,db)}
async function saveOrderCard(guild,o){const c=getConfig(guild.id);const ch=guild.channels.cache.get(c.channels.commandes_commerciales);if(!ch?.isTextBased())throw new Error('Salon Commandes commerciales non configuré.');if(o.messageId){try{const m=await ch.messages.fetch(o.messageId);await m.edit({embeds:[orderEmbed(o)],components:orderControls(o)});return;}catch{}}const m=await ch.send({embeds:[orderEmbed(o)],components:orderControls(o)});const db=getDb();if(db.orders[o.id])db.orders[o.id].messageId=m.id;writeJson(DB_FILE,db)}

async function saveProjectCards(guild,p){
  const c=getConfig(guild.id);const s=PROJECT_STAGES[p.stageIndex];
  const list=guild.channels.cache.get(c.channels.liste_projets);if(!list?.isTextBased())throw new Error('Salon Liste des projets non configuré.');
  if(p.listMessageId){try{const m=await list.messages.fetch(p.listMessageId);await m.edit({embeds:[projectEmbed(p)],components:projectControls(p)});}catch{p.listMessageId=null}}
  if(!p.listMessageId){const m=await list.send({embeds:[projectEmbed(p)],components:projectControls(p)});p.listMessageId=m.id}
  const stageCh=guild.channels.cache.get(c.channels[s.key]);if(!stageCh?.isTextBased())throw new Error(`Salon ${s.label} non configuré.`);
  if(p.stageMessageId&&p.stageChannelId&&p.stageChannelId!==stageCh.id){try{const old=await guild.channels.fetch(p.stageChannelId);const m=await old.messages.fetch(p.stageMessageId);await m.delete()}catch{}p.stageMessageId=null;p.stageChannelId=null}
  if(p.stageMessageId){try{const m=await stageCh.messages.fetch(p.stageMessageId);await m.edit({embeds:[projectEmbed(p)],components:projectControls(p)});}catch{p.stageMessageId=null}}
  if(!p.stageMessageId){const m=await stageCh.send({embeds:[projectEmbed(p)],components:projectControls(p)});p.stageMessageId=m.id;p.stageChannelId=stageCh.id}
  const db=getDb();db.projects[p.id]=p;writeJson(DB_FILE,db)
}

async function changeProjectStage(guild,p,newIndex){const old=PROJECT_STAGES[p.stageIndex];const now=PROJECT_STAGES[newIndex];p.stageIndex=newIndex;p.updatedAt=new Date().toISOString();const db=getDb();db.projects[p.id]=p;writeJson(DB_FILE,db);await saveProjectCards(guild,p);await sendDm(p.userId,{embeds:[embed(`🚀 Mise à jour ${p.id}`,`Ton projet **${p.projectName}** passe de **${old.label}** à **${now.label}**.\nProgression : **${now.progress}%**`,0x3498DB)]})}

async function createQuote(guild,userId,projectName,service,description){const c=getConfig(guild.id);const id=nextId('quotes','DEV');const cat=c.categories.devis||c.categories.tickets;let privateCh=null;if(cat)privateCh=await createPrivateChannel(guild,cat,userId,`devis-${id}`,c);const q={id,guildId:guild.id,userId,projectName,service,description,price:null,status:'En attente',claimedBy:null,orderId:null,messageId:null,privateChannelId:privateCh?.id||null,createdAt:new Date().toISOString()};const db=getDb();db.quotes[id]=q;writeJson(DB_FILE,db);await saveQuoteCard(guild,q);if(privateCh)await privateCh.send({content:`<@${userId}>`,embeds:[embed(`💰 Discussion privée — ${id}`,`Ce salon est lié au devis **${id}**.`)]});await sendDm(userId,{embeds:[embed(`💰 Devis ${id} créé`,`Ta demande pour **${projectName}** a été reçue.${privateCh?`\nSalon privé : <#${privateCh.id}>`:''}`,0xF1C40F)]});return q}

async function createOrder(guild,userId,offerKey,projectName,service,description,price=null,quoteId=null){const id=nextId('orders','CMD');const offer=PRICES[offerKey];const o={id,guildId:guild.id,userId,offerKey,offerLabel:offer?.label||service,projectName,service,description,price:price??offer?.price??null,quoteId,status:'En attente',paymentStatus:'Non envoyé',claimedBy:null,projectId:null,messageId:null,createdAt:new Date().toISOString()};const db=getDb();db.orders[id]=o;if(quoteId&&db.quotes[quoteId]){db.quotes[quoteId].status='Transformé en commande';db.quotes[quoteId].orderId=id}writeJson(DB_FILE,db);await saveOrderCard(guild,o);if(quoteId)await saveQuoteCard(guild,getDb().quotes[quoteId]);await sendDm(userId,{embeds:[embed(`📦 Commande ${id} reçue`,`Ta commande **${o.offerLabel}** pour **${projectName}** a été envoyée à notre équipe.`)]});return o}

async function createProject(guild,o){const id=nextId('projects','PROJ');const p={id,guildId:guild.id,userId:o.userId,orderId:o.id,projectName:o.projectName,stageIndex:0,claimedBy:null,listMessageId:null,stageMessageId:null,stageChannelId:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};const db=getDb();db.projects[id]=p;if(db.orders[o.id])db.orders[o.id].projectId=id;writeJson(DB_FILE,db);await saveProjectCards(guild,p);await saveOrderCard(guild,getDb().orders[o.id]);await sendDm(p.userId,{embeds:[embed(`🚀 Projet ${id} créé`,`Ton projet **${p.projectName}** est maintenant en **En attente**.`)]});return p}

async function createTicket(guild,userId,type,premium=false,linkedOrderId=null){const c=getConfig(guild.id);const cat=premium&&c.categories.tickets_premium?c.categories.tickets_premium:c.categories.tickets;if(!cat)throw new Error('Catégorie Tickets non configurée.');const id=nextId('tickets','TICKET');const ch=await createPrivateChannel(guild,cat,userId,`${type}-${id}`,c);const t={id,guildId:guild.id,userId,type,premium,linkedOrderId,status:'Ouvert',claimedBy:null,channelId:ch.id,createdAt:new Date().toISOString()};const db=getDb();db.tickets[id]=t;writeJson(DB_FILE,db);await ch.send({content:`<@${userId}>`,embeds:[embed(`🎫 ${id} — ${type}`,`${linkedOrderId?`Commande liée : **${linkedOrderId}**\n`:''}Explique ta demande.`)],components:[new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`ticket_claim:${id}`).setLabel('Prendre').setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId(`ticket_contact:${id}`).setLabel('Contacter en MP').setStyle(ButtonStyle.Secondary),
  new ButtonBuilder().setCustomId(`ticket_close:${id}`).setLabel('Fermer').setStyle(ButtonStyle.Danger)
)]});return ch}

function testEmbed(t){return embed(`🧪 ${t.id} — ${t.projectId}`,`Testeur : <@${t.userId}>\nProjet : **${t.projectId}**\nVersion : **${t.version}**\nStatut : **${t.status}**\n\n**Objectif :** ${t.objective}\n\n**Méthode :** ${t.method}`,0x9B59B6)}
function testControls(t){return [new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`test_status:${t.id}:En cours`).setLabel('En cours').setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId(`test_status:${t.id}:Réussi`).setLabel('Réussi').setStyle(ButtonStyle.Success),
  new ButtonBuilder().setCustomId(`test_status:${t.id}:Échec`).setLabel('Échec').setStyle(ButtonStyle.Danger),
  new ButtonBuilder().setCustomId(`test_status:${t.id}:À retester`).setLabel('À retester').setStyle(ButtonStyle.Secondary)
)]}
function bugEmbed(b){return embed(`🐞 ${b.id} — ${b.projectId}`,`Auteur : <@${b.userId}>\nProjet : **${b.projectId}**\nGravité : **${b.severity}**\nStatut : **${b.status}**\n\n**Description :** ${b.description}\n\n**Reproduction :** ${b.steps}`,0xED4245)}
function bugControls(b){return [new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`bug_status:${b.id}:Confirmé`).setLabel('Confirmé').setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId(`bug_status:${b.id}:En correction`).setLabel('En correction').setStyle(ButtonStyle.Secondary),
  new ButtonBuilder().setCustomId(`bug_status:${b.id}:À tester`).setLabel('À tester').setStyle(ButtonStyle.Secondary),
  new ButtonBuilder().setCustomId(`bug_status:${b.id}:Corrigé`).setLabel('Corrigé').setStyle(ButtonStyle.Success),
  new ButtonBuilder().setCustomId(`bug_status:${b.id}:Fermé`).setLabel('Fermé').setStyle(ButtonStyle.Danger)
)]}

async function showTracking(interaction,type){const db=getDb();let items=[];if(type==='quotes')items=Object.values(db.quotes).filter(x=>x.guildId===interaction.guild.id&&x.userId===interaction.user.id);if(type==='orders')items=Object.values(db.orders).filter(x=>x.guildId===interaction.guild.id&&x.userId===interaction.user.id);if(type==='projects')items=Object.values(db.projects).filter(x=>x.guildId===interaction.guild.id&&x.userId===interaction.user.id);if(!items.length)return interaction.reply({content:'Aucun élément enregistré pour toi.',flags:MessageFlags.Ephemeral});let desc='';if(type==='quotes')desc=items.map(x=>`**${x.id} — ${x.projectName}**\n${x.status} • ${x.price==null?'Prix à définir':`${x.price} €`}`).join('\n\n');if(type==='orders')desc=items.map(x=>`**${x.id} — ${x.projectName}**\n${x.status} • Paiement : ${x.paymentStatus}`).join('\n\n');if(type==='projects')desc=items.map(x=>{const s=PROJECT_STAGES[x.stageIndex];return `**${x.id} — ${x.projectName}**\n${s.emoji} ${s.label} • ${s.progress}%`}).join('\n\n');return interaction.reply({embeds:[embed(type==='quotes'?'💰 Mes devis':type==='orders'?'📦 Mes commandes':'🚀 Mes projets',desc)],flags:MessageFlags.Ephemeral})}

const commands = [
  new SlashCommandBuilder().setName('config').setDescription('Configuration complète.')
    .addSubcommand(s=>s.setName('salon').setDescription('Configurer un salon ou une catégorie.').addStringOption(o=>o.setName('type').setDescription('Élément').setRequired(true).setAutocomplete(true)).addChannelOption(o=>o.setName('cible').setDescription('Salon ou catégorie').setRequired(true)))
    .addSubcommand(s=>s.setName('role').setDescription('Configurer un rôle.').addStringOption(o=>o.setName('type').setDescription('Rôle').setRequired(true).setAutocomplete(true)).addRoleOption(o=>o.setName('role').setDescription('Rôle Discord').setRequired(true)))
    .addSubcommand(s=>s.setName('paiement').setDescription('Configurer PayPal.').addStringOption(o=>o.setName('lien').setDescription('Lien PayPal').setRequired(true)).addStringOption(o=>o.setName('message').setDescription('Message avec le lien').setRequired(false)))
    .addSubcommand(s=>s.setName('objectif').setDescription('Objectif mensuel.').addNumberOption(o=>o.setName('montant').setDescription('Montant').setMinValue(0).setRequired(true)))
    .addSubcommand(s=>s.setName('autorisation').setDescription('Rôle autorisé pour une fonction.').addStringOption(o=>o.setName('fonction').setDescription('Fonction').setRequired(true).addChoices({name:'Liens',value:'liens'},{name:'Annonces',value:'annonces'},{name:'Tarifs',value:'tarifs'},{name:'Offres',value:'offres'},{name:'Sondages',value:'sondages'},{name:'Roadmap',value:'roadmap'})).addRoleOption(o=>o.setName('role').setDescription('Rôle').setRequired(true)))
    .addSubcommand(s=>s.setName('voir').setDescription('Voir la configuration.')),
  new SlashCommandBuilder().setName('panneaux').setDescription('Gestion des panneaux.').addSubcommand(s=>s.setName('reparer').setDescription('Réparer les panneaux.')).addSubcommand(s=>s.setName('mettre-a-jour').setDescription('Mettre à jour les panneaux.')),
  new SlashCommandBuilder().setName('version').setDescription('Initialiser une nouvelle version.').addSubcommand(s=>s.setName('initialiser').setDescription('Ajouter les nouvelles clés et panneaux sans effacer la configuration.')),
  new SlashCommandBuilder().setName('tarif').setDescription('Publier les tarifs.'),
  new SlashCommandBuilder().setName('liens').setDescription('Mettre à jour les liens officiels.').addStringOption(o=>o.setName('contenu').setDescription('Texte des liens').setRequired(true)),
  new SlashCommandBuilder().setName('projet').setDescription('Gestion manuelle d’un projet.')
    .addSubcommand(s=>s.setName('avancer').setDescription('Avancer un projet.').addStringOption(o=>o.setName('id').setDescription('PROJ-0001').setRequired(true)))
    .addSubcommand(s=>s.setName('reculer').setDescription('Reculer un projet.').addStringOption(o=>o.setName('id').setDescription('PROJ-0001').setRequired(true)))
    .addSubcommand(s=>s.setName('etape').setDescription('Définir une étape.').addStringOption(o=>o.setName('id').setDescription('PROJ-0001').setRequired(true)).addStringOption(o=>o.setName('etape').setDescription('Étape').setRequired(true).addChoices(...PROJECT_STAGES.map((s,i)=>({name:s.label,value:String(i)}))))),
  new SlashCommandBuilder().setName('suivi').setDescription('Voir tes devis, commandes et projets.')
].map(x=>x.toJSON());

client.once(Events.ClientReady, async ready => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ CREATY BOT CONNECTÉ');
  console.log(`🤖 Nom : ${ready.user.tag}`);
  console.log(`🆔 ID : ${ready.user.id}`);
  console.log(`🌐 Serveurs : ${ready.guilds.cache.size}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  ensureFiles();
  for (const guild of ready.guilds.cache.values()) {
    getConfig(guild.id);
    await guild.commands.set(commands);
    console.log(`✅ Commandes slash installées sur ${guild.name}`);
  }
});

client.on(Events.GuildMemberAdd, async member => {const c=getConfig(member.guild.id);if(c.roles.nouveau)await member.roles.add(c.roles.nouveau).catch(()=>{});const ch=member.guild.channels.cache.get(c.channels.bienvenue);if(ch?.isTextBased())await ch.send({embeds:[new EmbedBuilder().setColor(0x57F287).setTitle(`👋 Bienvenue ${member.user.username}`).setDescription(`Bienvenue ${member} sur **${member.guild.name}**.\nTu es notre **${member.guild.memberCount}e membre**.`).setThumbnail(member.user.displayAvatarURL({size:256})).setTimestamp()]}).catch(()=>{})});
client.on(Events.GuildMemberRemove, async member => {const c=getConfig(member.guild.id);const ch=member.guild.channels.cache.get(c.channels.depart);if(ch?.isTextBased())await ch.send({embeds:[new EmbedBuilder().setColor(0xED4245).setTitle(`👋 À bientôt ${member.user.username}`).setDescription(`**${member.user.tag}** a quitté le serveur.`).setThumbnail(member.user.displayAvatarURL({size:256})).setTimestamp()]}).catch(()=>{})});

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isAutocomplete()) {
      if (interaction.commandName !== 'config') return;
      const sub = interaction.options.getSubcommand();
      const focused = interaction.options.getFocused().toLowerCase();
      if (sub === 'salon') {
        const all=[...CATEGORIES.map(([k,n])=>({name:`Catégorie • ${n}`,value:`category:${k}`})),...CHANNELS.map(([k,n])=>({name:`Salon • ${n}`,value:`channel:${k}`}))];
        return interaction.respond(all.filter(x=>x.name.toLowerCase().includes(focused)).slice(0,25));
      }
      if (sub === 'role') return interaction.respond(ROLES.map(([k,n])=>({name:n,value:k})).filter(x=>x.name.toLowerCase().includes(focused)).slice(0,25));
    }

    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'config') {
        if (!isAdmin(interaction.member)) return interaction.reply({content:'❌ Réservé aux administrateurs.',flags:MessageFlags.Ephemeral});
        const sub=interaction.options.getSubcommand();
        if (sub==='salon') {
          const raw=interaction.options.getString('type');const target=interaction.options.getChannel('cible');const[kind,key]=raw.split(':');
          if(kind==='category'&&target.type!==ChannelType.GuildCategory)return interaction.reply({content:'❌ Sélectionne une catégorie.',flags:MessageFlags.Ephemeral});
          if(kind==='channel'&&target.type===ChannelType.GuildCategory)return interaction.reply({content:'❌ Sélectionne un salon.',flags:MessageFlags.Ephemeral});
          setConfig(interaction.guild.id,kind==='category'?'categories':'channels',key,target.id);if(kind==='channel')await upsertPanel(interaction.guild,key).catch(()=>{});return interaction.reply({content:`✅ **${key}** configuré sur ${target}.`,flags:MessageFlags.Ephemeral});
        }
        if(sub==='role'){const key=interaction.options.getString('type');const role=interaction.options.getRole('role');setConfig(interaction.guild.id,'roles',key,role.id);return interaction.reply({content:`✅ Rôle **${key}** configuré sur ${role}.`,flags:MessageFlags.Ephemeral})}
        if(sub==='paiement'){const link=interaction.options.getString('lien').trim();const msg=interaction.options.getString('message')||'';if(!/^https?:\/\//i.test(link))return interaction.reply({content:'❌ Le lien doit commencer par http:// ou https://',flags:MessageFlags.Ephemeral});setConfig(interaction.guild.id,'settings','paypalUrl',link);setConfig(interaction.guild.id,'settings','paymentMessage',msg);return interaction.reply({content:'✅ Paiement PayPal configuré.',flags:MessageFlags.Ephemeral})}
        if(sub==='objectif'){const a=interaction.options.getNumber('montant');setConfig(interaction.guild.id,'settings','monthlyGoal',a);return interaction.reply({content:`✅ Objectif : **${a.toFixed(2)} €**.`,flags:MessageFlags.Ephemeral})}
        if(sub==='autorisation'){const f=interaction.options.getString('fonction');const role=interaction.options.getRole('role');setConfig(interaction.guild.id,'permissions',f,role.id);return interaction.reply({content:`✅ ${role} peut gérer **${f}**.`,flags:MessageFlags.Ephemeral})}
        if(sub==='voir'){const c=getConfig(interaction.guild.id);return interaction.reply({embeds:[embed('⚙️ Configuration',`Salons : **${Object.keys(c.channels).length}/${CHANNELS.length}**\nCatégories : **${Object.keys(c.categories).length}/${CATEGORIES.length}**\nRôles : **${Object.keys(c.roles).length}/${ROLES.length}**\nPayPal : **${c.settings.paypalUrl?'Configuré':'Non configuré'}**`)],flags:MessageFlags.Ephemeral})}
      }
      if(interaction.commandName==='panneaux'||interaction.commandName==='version'){if(!isAdmin(interaction.member))return interaction.reply({content:'❌ Réservé aux administrateurs.',flags:MessageFlags.Ephemeral});await interaction.deferReply({flags:MessageFlags.Ephemeral});const c=getConfig(interaction.guild.id);let count=0;for(const key of Object.keys(c.channels)){if(await upsertPanel(interaction.guild,key).catch(()=>false))count++}return interaction.editReply(`✅ **${count} panneaux** vérifiés ou mis à jour. Configuration conservée.`)}
      if(interaction.commandName==='tarif'){const c=getConfig(interaction.guild.id);if(!hasFeature(interaction.member,c,'tarifs'))return interaction.reply({content:'❌ Pas autorisé.',flags:MessageFlags.Ephemeral});const ok=await upsertPanel(interaction.guild,'tarifs');return interaction.reply({content:ok?'✅ Tarifs mis à jour.':'❌ Configure le salon Tarifs.',flags:MessageFlags.Ephemeral})}
      if(interaction.commandName==='liens'){const c=getConfig(interaction.guild.id);if(!hasFeature(interaction.member,c,'liens'))return interaction.reply({content:'❌ Pas autorisé.',flags:MessageFlags.Ephemeral});const ch=interaction.guild.channels.cache.get(c.channels.liens);if(!ch?.isTextBased())return interaction.reply({content:'❌ Salon Nos liens non configuré.',flags:MessageFlags.Ephemeral});const content=interaction.options.getString('contenu');const old=c.panels.liens;const payload={embeds:[embed('🔗 Nos liens officiels',content,0x3498DB)]};if(old){try{const m=await ch.messages.fetch(old);await m.edit(payload);return interaction.reply({content:'✅ Liens mis à jour.',flags:MessageFlags.Ephemeral})}catch{}}const m=await ch.send(payload);setConfig(interaction.guild.id,'panels','liens',m.id);return interaction.reply({content:'✅ Liens publiés.',flags:MessageFlags.Ephemeral})}
      if(interaction.commandName==='projet'){const c=getConfig(interaction.guild.id);if(!isStaff(interaction.member,c))return interaction.reply({content:'❌ Réservé au personnel.',flags:MessageFlags.Ephemeral});const sub=interaction.options.getSubcommand();const id=interaction.options.getString('id').trim().toUpperCase();const db=getDb();const p=db.projects[id];if(!p)return interaction.reply({content:'❌ Projet introuvable.',flags:MessageFlags.Ephemeral});let n=p.stageIndex;if(sub==='avancer')n=Math.min(PROJECT_STAGES.length-1,p.stageIndex+1);if(sub==='reculer')n=Math.max(0,p.stageIndex-1);if(sub==='etape')n=Number(interaction.options.getString('etape'));await changeProjectStage(interaction.guild,p,n);return interaction.reply({content:`✅ **${id}** est maintenant en **${PROJECT_STAGES[n].label}**. Client notifié.`})}
      if(interaction.commandName==='suivi')return interaction.reply({content:'Choisis :',components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('track_quotes').setLabel('Mes devis').setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId('track_orders').setLabel('Mes commandes').setStyle(ButtonStyle.Primary),new ButtonBuilder().setCustomId('track_projects').setLabel('Mes projets').setStyle(ButtonStyle.Success))],flags:MessageFlags.Ephemeral});
    }

    if (interaction.isStringSelectMenu()) {
      if(interaction.customId==='order_offer_select'){const offerKey=interaction.values[0];const offer=PRICES[offerKey];const modal=new ModalBuilder().setCustomId(`order_modal:${offerKey}`).setTitle(`Commander ${offer?.label||'Projet sur mesure'}`);modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('project').setLabel('Nom du projet').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('service').setLabel('Service / type de bot').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Description et fonctionnalités').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1800)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('deadline').setLabel('Délai souhaité').setStyle(TextInputStyle.Short).setRequired(false)));return interaction.showModal(modal)}
      if(interaction.customId==='ticket_select'||interaction.customId==='ticket_select_premium'){const ch=await createTicket(interaction.guild,interaction.user.id,interaction.values[0],interaction.customId==='ticket_select_premium');return interaction.reply({content:`✅ Ticket créé : ${ch}`,flags:MessageFlags.Ephemeral})}
      if(interaction.customId==='order_question_select'){const ch=await createTicket(interaction.guild,interaction.user.id,`question-${interaction.values[0]}`);return interaction.reply({content:`✅ Ticket créé : ${ch}`,flags:MessageFlags.Ephemeral})}
      if(interaction.customId==='faq_select'){const a={commander:'Va dans **📝・commander**, choisis ton offre puis remplis le formulaire.',offre:'Mini = petit besoin, Essentiel = standard, Avancé = projet complet, Premium = bot + serveur + 1 mois d’hébergement.',devis:'Va dans **💰・demander-un-devis**. Un DEV-XXXX et un salon privé peuvent être créés.',payer:'Après acceptation, l’équipe t’envoie le lien PayPal. Déclare ensuite ton paiement.',suivi:'Va dans **📦・suivi-commandes**.',delai:'Le délai dépend de la complexité et est estimé avant ou pendant validation.',hosting:'Hébergement : **5 €/mois**. Premium inclut le premier mois.',garantie:'Garantie technique : **14 jours après livraison**.',bug:'Ouvre un SAV si le bug est sous garantie.',modifier:'Une modification importante peut nécessiter un nouveau devis.',ajout:'Les nouvelles fonctionnalités hors cahier des charges peuvent être facturées séparément.',ticket:'Utilise le panneau Ticket.'};return interaction.reply({embeds:[embed('❓ Réponse FAQ',a[interaction.values[0]]||'Ouvre un ticket.')],flags:MessageFlags.Ephemeral})}
      if(interaction.customId.startsWith('project_stage:')){const id=interaction.customId.split(':')[1];const db=getDb();const p=db.projects[id];if(!p)return interaction.reply({content:'❌ Projet introuvable.',flags:MessageFlags.Ephemeral});const c=getConfig(p.guildId);if(!isStaff(interaction.member,c))return interaction.reply({content:'❌ Réservé au personnel.',flags:MessageFlags.Ephemeral});const n=Number(interaction.values[0]);await changeProjectStage(interaction.guild,p,n);return interaction.reply({content:`✅ Projet déplacé vers **${PROJECT_STAGES[n].label}**. Client notifié.`})}
    }

    if (interaction.isButton()) {
      if(interaction.customId==='rules_accept'){const c=getConfig(interaction.guild.id);if(c.roles.membre)await interaction.member.roles.add(c.roles.membre).catch(()=>{});if(c.roles.nouveau)await interaction.member.roles.remove(c.roles.nouveau).catch(()=>{});return interaction.reply({content:'✅ Règlement accepté.',flags:MessageFlags.Ephemeral})}
      if(interaction.customId==='go_quote'){const modal=new ModalBuilder().setCustomId('quote_modal').setTitle('Demande de devis');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('project').setLabel('Nom du projet').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('service').setLabel('Service demandé').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Description détaillée').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1800)));return interaction.showModal(modal)}
      if(interaction.customId==='go_order')return interaction.reply({content:'Utilise le panneau **📝・commander** pour choisir ton offre.',flags:MessageFlags.Ephemeral});
      if(interaction.customId==='go_support'){const ch=await createTicket(interaction.guild,interaction.user.id,'support');return interaction.reply({content:`✅ Ticket créé : ${ch}`,flags:MessageFlags.Ephemeral})}
      if(interaction.customId==='sav_open'){const ch=await createTicket(interaction.guild,interaction.user.id,'sav');return interaction.reply({content:`✅ SAV ouvert : ${ch}`,flags:MessageFlags.Ephemeral})}
      if(interaction.customId==='payment_declare'){const modal=new ModalBuilder().setCustomId('payment_modal').setTitle('Déclarer un paiement');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('order').setLabel('Numéro CMD-0001').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('proof').setLabel('Référence ou preuve').setStyle(TextInputStyle.Paragraph).setRequired(true)));return interaction.showModal(modal)}
      if(interaction.customId==='review_open'){const db=getDb();const ok=Object.values(db.projects).some(p=>p.guildId===interaction.guild.id&&p.userId===interaction.user.id&&p.stageIndex>=5);if(!ok)return interaction.reply({content:'❌ Tu dois avoir un projet terminé.',flags:MessageFlags.Ephemeral});const modal=new ModalBuilder().setCustomId('review_modal').setTitle('Laisser un avis');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Titre').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('rating').setLabel('Note sur 5').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('message').setLabel('Ton avis').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1500)));return interaction.showModal(modal)}
      if(interaction.customId==='test_open'){const modal=new ModalBuilder().setCustomId('test_modal').setTitle('Commencer un test');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('project').setLabel('PROJ-0001').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('version').setLabel('Version').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('objective').setLabel('Objectif').setStyle(TextInputStyle.Paragraph).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('method').setLabel('Méthode').setStyle(TextInputStyle.Paragraph).setRequired(true)));return interaction.showModal(modal)}
      if(interaction.customId==='test_mine'){const mine=Object.values(getDb().tests).filter(t=>t.guildId===interaction.guild.id&&t.userId===interaction.user.id);return interaction.reply({embeds:[embed('🧪 Mes tests',mine.length?mine.map(t=>`**${t.id}** — ${t.projectId} — ${t.status}`).join('\n'):'Aucun test.')],flags:MessageFlags.Ephemeral})}
      if(interaction.customId==='bug_open'){const modal=new ModalBuilder().setCustomId('bug_modal').setTitle('Déclarer un bug');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('project').setLabel('PROJ-0001').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('severity').setLabel('Gravité').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('steps').setLabel('Comment reproduire').setStyle(TextInputStyle.Paragraph).setRequired(true)));return interaction.showModal(modal)}
      if(interaction.customId==='bug_mine'){const mine=Object.values(getDb().bugs).filter(b=>b.guildId===interaction.guild.id&&b.userId===interaction.user.id);return interaction.reply({embeds:[embed('🐞 Mes bugs',mine.length?mine.map(b=>`**${b.id}** — ${b.projectId} — ${b.status}`).join('\n'):'Aucun bug.')],flags:MessageFlags.Ephemeral})}
      if(interaction.customId==='track_quotes')return showTracking(interaction,'quotes');if(interaction.customId==='track_orders')return showTracking(interaction,'orders');if(interaction.customId==='track_projects')return showTracking(interaction,'projects');
      if(interaction.customId.startsWith('quote_')){const[action,id]=interaction.customId.split(':');const db=getDb();const q=db.quotes[id];if(!q)return interaction.reply({content:'❌ Devis introuvable.',flags:MessageFlags.Ephemeral});const c=getConfig(q.guildId);if(!isStaff(interaction.member,c))return interaction.reply({content:'❌ Réservé au personnel.',flags:MessageFlags.Ephemeral});if(action==='quote_claim'){q.claimedBy=interaction.user.id;db.quotes[id]=q;writeJson(DB_FILE,db);await saveQuoteCard(interaction.guild,q);return interaction.reply({content:'✅ Devis pris en charge.'})}if(action==='quote_price'){const modal=new ModalBuilder().setCustomId(`quote_price_modal:${id}`).setTitle(`Prix ${id}`);modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('price').setLabel('Prix en euros').setStyle(TextInputStyle.Short).setRequired(true)));return interaction.showModal(modal)}if(action==='quote_send'){if(q.price==null)return interaction.reply({content:'❌ Définis le prix avant.',flags:MessageFlags.Ephemeral});const sent=await sendDm(q.userId,{embeds:[embed(`💰 Devis ${id}`,`Projet : **${q.projectName}**\nPrix : **${Number(q.price).toFixed(2)} €**`)],components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`client_quote_accept:${id}`).setLabel('Accepter').setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId(`client_quote_refuse:${id}`).setLabel('Refuser').setStyle(ButtonStyle.Danger))]});if(!sent)return interaction.reply({content:'❌ Impossible d’envoyer le MP.',flags:MessageFlags.Ephemeral});q.status='Envoyé au client';db.quotes[id]=q;writeJson(DB_FILE,db);await saveQuoteCard(interaction.guild,q);return interaction.reply({content:'✅ Devis envoyé.'})}if(action==='quote_order'){if(q.status!=='Accepté par le client')return interaction.reply({content:'❌ Le client doit accepter le devis.',flags:MessageFlags.Ephemeral});const o=await createOrder(interaction.guild,q.userId,'custom',q.projectName,q.service,q.description,q.price,q.id);return interaction.reply({content:`✅ Commande **${o.id}** créée.`})}if(action==='quote_contact'){const modal=new ModalBuilder().setCustomId(`contact_modal:quotes:${id}`).setTitle('Contacter le client');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('text').setLabel('Message').setStyle(TextInputStyle.Paragraph).setRequired(true)));return interaction.showModal(modal)}if(action==='quote_refuse'){q.status='Refusé';db.quotes[id]=q;writeJson(DB_FILE,db);await saveQuoteCard(interaction.guild,q);await sendDm(q.userId,{embeds:[embed(`❌ Devis ${id} refusé`,'Ta demande a été refusée.',0xED4245)]});return interaction.reply({content:'✅ Devis refusé.'})}if(action==='quote_archive'){q.status='Archivé';db.quotes[id]=q;writeJson(DB_FILE,db);await saveQuoteCard(interaction.guild,q);return interaction.reply({content:'✅ Devis archivé.'})}}
      if(interaction.customId.startsWith('client_quote_')){const[action,id]=interaction.customId.split(':');const db=getDb();const q=db.quotes[id];if(!q||q.userId!==interaction.user.id)return interaction.reply({content:'❌ Ce devis ne t’appartient pas.',flags:MessageFlags.Ephemeral});const guild=await client.guilds.fetch(q.guildId);if(action==='client_quote_accept'){q.status='Accepté par le client';db.quotes[id]=q;writeJson(DB_FILE,db);await saveQuoteCard(guild,q);return interaction.update({embeds:[embed(`✅ Devis ${id} accepté`,`Tu as accepté ce devis de **${Number(q.price).toFixed(2)} €**.`)],components:[]})}q.status='Refusé par le client';db.quotes[id]=q;writeJson(DB_FILE,db);await saveQuoteCard(guild,q);return interaction.update({embeds:[embed(`❌ Devis ${id} refusé`,'Le devis a été refusé.',0xED4245)],components:[]})}
      if(interaction.customId.startsWith('order_')){const[action,id]=interaction.customId.split(':');const db=getDb();const o=db.orders[id];if(!o)return interaction.reply({content:'❌ Commande introuvable.',flags:MessageFlags.Ephemeral});const c=getConfig(o.guildId);if(!isStaff(interaction.member,c))return interaction.reply({content:'❌ Réservé au personnel.',flags:MessageFlags.Ephemeral});if(action==='order_claim'){o.claimedBy=interaction.user.id;db.orders[id]=o;writeJson(DB_FILE,db);await saveOrderCard(interaction.guild,o);return interaction.reply({content:'✅ Commande prise en charge.'})}if(action==='order_accept'){o.status='Acceptée';db.orders[id]=o;writeJson(DB_FILE,db);await saveOrderCard(interaction.guild,o);await sendDm(o.userId,{embeds:[embed(`✅ Commande ${id} acceptée`,'Ta commande a été acceptée. Le paiement va pouvoir t’être envoyé.')]});return interaction.reply({content:'✅ Commande acceptée.'})}if(action==='order_refuse'){o.status='Refusée';db.orders[id]=o;writeJson(DB_FILE,db);await saveOrderCard(interaction.guild,o);await sendDm(o.userId,{embeds:[embed(`❌ Commande ${id} refusée`,'Ta commande a été refusée.',0xED4245)]});return interaction.reply({content:'✅ Commande refusée.'})}if(action==='order_contact'){const modal=new ModalBuilder().setCustomId(`contact_modal:orders:${id}`).setTitle('Contacter le client');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('text').setLabel('Message').setStyle(TextInputStyle.Paragraph).setRequired(true)));return interaction.showModal(modal)}if(action==='order_pay'){if(!c.settings.paypalUrl)return interaction.reply({content:'❌ Configure PayPal avec `/config paiement`.',flags:MessageFlags.Ephemeral});const sent=await sendDm(o.userId,{embeds:[embed(`💳 Paiement de ${id}`,`Montant : **${o.price==null?'À confirmer':`${Number(o.price).toFixed(2)} €`}**\n\n${c.settings.paymentMessage||'Effectue ton paiement via le lien officiel :'}\n${c.settings.paypalUrl}`)],components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`payment_for_order:${id}`).setLabel('J’ai payé').setStyle(ButtonStyle.Success))]});if(!sent)return interaction.reply({content:'❌ Impossible d’envoyer le MP.',flags:MessageFlags.Ephemeral});o.paymentStatus='Lien envoyé';db.orders[id]=o;writeJson(DB_FILE,db);await saveOrderCard(interaction.guild,o);return interaction.reply({content:'✅ Lien PayPal envoyé.'})}if(action==='order_archive'){o.status='Archivée';db.orders[id]=o;writeJson(DB_FILE,db);await saveOrderCard(interaction.guild,o);return interaction.reply({content:'✅ Commande archivée.'})}}
      if(interaction.customId.startsWith('payment_for_order:')){const orderId=interaction.customId.split(':')[1];const modal=new ModalBuilder().setCustomId(`payment_order_modal:${orderId}`).setTitle('Déclarer le paiement');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('proof').setLabel('Référence ou preuve').setStyle(TextInputStyle.Paragraph).setRequired(true)));return interaction.showModal(modal)}
      if(interaction.customId.startsWith('payment_accept:')||interaction.customId.startsWith('payment_refuse:')){const[action,id]=interaction.customId.split(':');const db=getDb();const p=db.payments[id];if(!p)return interaction.reply({content:'❌ Paiement introuvable.',flags:MessageFlags.Ephemeral});const c=getConfig(p.guildId);if(!isStaff(interaction.member,c))return interaction.reply({content:'❌ Réservé au personnel.',flags:MessageFlags.Ephemeral});const o=db.orders[p.orderId];if(action==='payment_refuse'){p.status='Refusé';db.payments[id]=p;writeJson(DB_FILE,db);await sendDm(p.userId,{embeds:[embed(`❌ Paiement ${id} refusé`,'La preuve n’a pas été validée.',0xED4245)]});return interaction.update({embeds:[embed(`❌ Paiement ${id} refusé`,`Commande : **${p.orderId}**`,0xED4245)],components:[]})}p.status='Validé';o.paymentStatus='Validé';const saleId=nextId('sales','VENTE');const latest=getDb();latest.payments[id]=p;latest.orders[o.id]=o;latest.sales[saleId]={id:saleId,guildId:p.guildId,orderId:o.id,userId:o.userId,projectName:o.projectName,amount:Number(o.price||0),createdAt:new Date().toISOString()};writeJson(DB_FILE,latest);const project=await createProject(interaction.guild,o);const salesCh=interaction.guild.channels.cache.get(c.channels.ventes);if(salesCh?.isTextBased())await salesCh.send({embeds:[embed(`💰 ${saleId}`,`Commande : **${o.id}**\nClient : <@${o.userId}>\nProjet : **${o.projectName}**\nMontant : **${Number(o.price||0).toFixed(2)} €**`,0x2ECC71)]});return interaction.update({embeds:[embed(`✅ Paiement ${id} validé`,`Projet créé : **${project.id}**\nVente : **${saleId}**`,0x57F287)],components:[]})}
      if(interaction.customId.startsWith('project_')){const[action,id]=interaction.customId.split(':');const db=getDb();const p=db.projects[id];if(!p)return interaction.reply({content:'❌ Projet introuvable.',flags:MessageFlags.Ephemeral});const c=getConfig(p.guildId);if(!isStaff(interaction.member,c))return interaction.reply({content:'❌ Réservé au personnel.',flags:MessageFlags.Ephemeral});if(action==='project_claim'){p.claimedBy=interaction.user.id;db.projects[id]=p;writeJson(DB_FILE,db);await saveProjectCards(interaction.guild,p);return interaction.reply({content:'✅ Projet pris en charge.'})}if(action==='project_prev'){await changeProjectStage(interaction.guild,p,Math.max(0,p.stageIndex-1));return interaction.reply({content:'✅ Projet reculé. Client notifié.'})}if(action==='project_next'){await changeProjectStage(interaction.guild,p,Math.min(PROJECT_STAGES.length-1,p.stageIndex+1));return interaction.reply({content:'✅ Projet avancé. Client notifié.'})}if(action==='project_contact'){const modal=new ModalBuilder().setCustomId(`contact_modal:projects:${id}`).setTitle('Contacter le client');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('text').setLabel('Message').setStyle(TextInputStyle.Paragraph).setRequired(true)));return interaction.showModal(modal)}}
      if(interaction.customId.startsWith('test_status:')){const[,id,status]=interaction.customId.split(':');const db=getDb();const t=db.tests[id];if(!t)return interaction.reply({content:'❌ Test introuvable.',flags:MessageFlags.Ephemeral});const c=getConfig(t.guildId);if(interaction.user.id!==t.userId&&!isStaff(interaction.member,c))return interaction.reply({content:'❌ Tu ne peux modifier que tes tests.',flags:MessageFlags.Ephemeral});t.status=status;db.tests[id]=t;writeJson(DB_FILE,db);await interaction.update({embeds:[testEmbed(t)],components:testControls(t)});await sendDm(t.userId,{embeds:[embed(`🧪 Mise à jour ${id}`,`Statut : **${status}**`)]});return}
      if(interaction.customId.startsWith('bug_status:')){const[,id,status]=interaction.customId.split(':');const db=getDb();const b=db.bugs[id];if(!b)return interaction.reply({content:'❌ Bug introuvable.',flags:MessageFlags.Ephemeral});const c=getConfig(b.guildId);if(interaction.user.id!==b.userId&&!isStaff(interaction.member,c))return interaction.reply({content:'❌ Tu ne peux modifier que tes bugs.',flags:MessageFlags.Ephemeral});b.status=status;db.bugs[id]=b;writeJson(DB_FILE,db);await interaction.update({embeds:[bugEmbed(b)],components:bugControls(b)});await sendDm(b.userId,{embeds:[embed(`🐞 Mise à jour ${id}`,`Statut : **${status}**`)]});return}
      if(interaction.customId.startsWith('ticket_')){const[action,id]=interaction.customId.split(':');const db=getDb();const t=db.tickets[id];if(!t)return interaction.reply({content:'❌ Ticket introuvable.',flags:MessageFlags.Ephemeral});const c=getConfig(t.guildId);if(!isStaff(interaction.member,c))return interaction.reply({content:'❌ Réservé au personnel.',flags:MessageFlags.Ephemeral});if(action==='ticket_claim'){t.claimedBy=interaction.user.id;db.tickets[id]=t;writeJson(DB_FILE,db);return interaction.reply({content:`✅ Ticket pris par ${interaction.user}.`})}if(action==='ticket_contact'){const modal=new ModalBuilder().setCustomId(`contact_modal:tickets:${id}`).setTitle('Contacter le client');modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('text').setLabel('Message').setStyle(TextInputStyle.Paragraph).setRequired(true)));return interaction.showModal(modal)}if(action==='ticket_close'){t.status='Fermé';db.tickets[id]=t;writeJson(DB_FILE,db);await interaction.channel.permissionOverwrites.edit(t.userId,{SendMessages:false}).catch(()=>{});return interaction.update({embeds:[embed(`🔒 ${id} fermé`,'Le ticket est fermé. Les données sont conservées.',0x95A5A6)],components:[]})}}
    }

    if (interaction.isModalSubmit()) {
      if(interaction.customId==='quote_modal'){const q=await createQuote(interaction.guild,interaction.user.id,interaction.fields.getTextInputValue('project'),interaction.fields.getTextInputValue('service'),interaction.fields.getTextInputValue('description'));return interaction.reply({content:`✅ Devis créé : **${q.id}**.`,flags:MessageFlags.Ephemeral})}
      if(interaction.customId.startsWith('order_modal:')){const offerKey=interaction.customId.split(':')[1];const o=await createOrder(interaction.guild,interaction.user.id,offerKey,interaction.fields.getTextInputValue('project'),interaction.fields.getTextInputValue('service'),`${interaction.fields.getTextInputValue('description')}\nDélai souhaité : ${interaction.fields.getTextInputValue('deadline')||'Non précisé'}`);return interaction.reply({content:`✅ Commande créée : **${o.id}**.`,flags:MessageFlags.Ephemeral})}
      if(interaction.customId.startsWith('quote_price_modal:')){const id=interaction.customId.split(':')[1];const db=getDb();const q=db.quotes[id];if(!q)return interaction.reply({content:'❌ Devis introuvable.',flags:MessageFlags.Ephemeral});const price=Number(interaction.fields.getTextInputValue('price').replace(',','.'));if(!Number.isFinite(price)||price<0)return interaction.reply({content:'❌ Prix invalide.',flags:MessageFlags.Ephemeral});q.price=price;q.status='Prix défini';db.quotes[id]=q;writeJson(DB_FILE,db);await saveQuoteCard(interaction.guild,q);return interaction.reply({content:`✅ Prix : **${price.toFixed(2)} €**.`})}
      if(interaction.customId==='payment_modal'||interaction.customId.startsWith('payment_order_modal:')){const orderId=interaction.customId==='payment_modal'?interaction.fields.getTextInputValue('order').trim().toUpperCase():interaction.customId.split(':')[1];const proof=interaction.fields.getTextInputValue('proof');const db=getDb();const o=db.orders[orderId];if(!o||o.userId!==interaction.user.id)return interaction.reply({content:'❌ Commande introuvable ou non autorisée.',flags:MessageFlags.Ephemeral});const paymentId=nextId('payments','PAY');const latest=getDb();latest.payments[paymentId]={id:paymentId,guildId:o.guildId,orderId,userId:interaction.user.id,proof,status:'En attente',createdAt:new Date().toISOString()};latest.orders[orderId].paymentStatus='À vérifier';writeJson(DB_FILE,latest);const c=getConfig(o.guildId);const ch=interaction.guild.channels.cache.get(c.channels.paiements);if(!ch?.isTextBased())return interaction.reply({content:'❌ Salon Paiements non configuré.',flags:MessageFlags.Ephemeral});await ch.send({embeds:[embed(`💳 ${paymentId}`,`Commande : **${orderId}**\nClient : <@${interaction.user.id}>\nMontant attendu : **${o.price==null?'Non défini':`${Number(o.price).toFixed(2)} €`}**\n\nPreuve / référence :\n${proof}`,0xF39C12)],components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`payment_accept:${paymentId}`).setLabel('Valider').setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId(`payment_refuse:${paymentId}`).setLabel('Refuser').setStyle(ButtonStyle.Danger))]});await saveOrderCard(interaction.guild,latest.orders[orderId]);return interaction.reply({content:`✅ Paiement déclaré : **${paymentId}**.`,flags:MessageFlags.Ephemeral})}
      if(interaction.customId==='review_modal'){const title=interaction.fields.getTextInputValue('title');const rating=Math.max(1,Math.min(5,parseInt(interaction.fields.getTextInputValue('rating'),10)||5));const message=interaction.fields.getTextInputValue('message');const id=nextId('reviews','AVIS');const db=getDb();db.reviews[id]={id,guildId:interaction.guild.id,userId:interaction.user.id,title,rating,message,createdAt:new Date().toISOString()};writeJson(DB_FILE,db);const c=getConfig(interaction.guild.id);const ch=interaction.guild.channels.cache.get(c.channels.avis);if(ch?.isTextBased())await ch.send({embeds:[embed(`⭐ ${title}`,`${'⭐'.repeat(rating)}\n\n${message}\n\n— ${interaction.user} • Commande vérifiée`,0xF1C40F)]});return interaction.reply({content:'✅ Avis publié.',flags:MessageFlags.Ephemeral})}
      if(interaction.customId==='test_modal'){const projectId=interaction.fields.getTextInputValue('project').trim().toUpperCase();const db=getDb();if(!db.projects[projectId])return interaction.reply({content:'❌ Projet introuvable.',flags:MessageFlags.Ephemeral});const id=nextId('tests','TEST');const t={id,guildId:interaction.guild.id,userId:interaction.user.id,projectId,version:interaction.fields.getTextInputValue('version'),objective:interaction.fields.getTextInputValue('objective'),method:interaction.fields.getTextInputValue('method'),status:'À tester',createdAt:new Date().toISOString()};const latest=getDb();latest.tests[id]=t;writeJson(DB_FILE,latest);const c=getConfig(interaction.guild.id);const ch=interaction.guild.channels.cache.get(c.channels.tests_dev);if(!ch?.isTextBased())return interaction.reply({content:'❌ Salon Tests non configuré.',flags:MessageFlags.Ephemeral});await ch.send({embeds:[testEmbed(t)],components:testControls(t)});await sendDm(t.userId,{embeds:[embed(`🧪 Test ${id} commencé`,`Projet : **${projectId}**\nStatut : **À tester**`)]});return interaction.reply({content:`✅ Test créé : **${id}**.`,flags:MessageFlags.Ephemeral})}
      if(interaction.customId==='bug_modal'){const projectId=interaction.fields.getTextInputValue('project').trim().toUpperCase();const db=getDb();if(!db.projects[projectId])return interaction.reply({content:'❌ Projet introuvable.',flags:MessageFlags.Ephemeral});const id=nextId('bugs','BUG');const b={id,guildId:interaction.guild.id,userId:interaction.user.id,projectId,severity:interaction.fields.getTextInputValue('severity'),description:interaction.fields.getTextInputValue('description'),steps:interaction.fields.getTextInputValue('steps'),status:'Nouveau',createdAt:new Date().toISOString()};const latest=getDb();latest.bugs[id]=b;writeJson(DB_FILE,latest);const c=getConfig(interaction.guild.id);const ch=interaction.guild.channels.cache.get(c.channels.bugs);if(!ch?.isTextBased())return interaction.reply({content:'❌ Salon Bugs non configuré.',flags:MessageFlags.Ephemeral});await ch.send({embeds:[bugEmbed(b)],components:bugControls(b)});await sendDm(b.userId,{embeds:[embed(`🐞 Bug ${id} créé`,`Projet : **${projectId}**\nStatut : **Nouveau**`)]});return interaction.reply({content:`✅ Bug créé : **${id}**.`,flags:MessageFlags.Ephemeral})}
      if(interaction.customId.startsWith('contact_modal:')){const[,collection,id]=interaction.customId.split(':');const db=getDb();const item=db[collection]?.[id];if(!item)return interaction.reply({content:'❌ Élément introuvable.',flags:MessageFlags.Ephemeral});const ok=await sendDm(item.userId,{embeds:[embed(`💬 Message concernant ${id}`,interaction.fields.getTextInputValue('text'))]});return interaction.reply({content:ok?'✅ Message envoyé.':'❌ Impossible d’envoyer le MP.',flags:MessageFlags.Ephemeral})}
    }
  } catch (error) {
    console.error('❌ Erreur interaction :', error);
    if (!interaction.replied && !interaction.deferred) await interaction.reply({content:`❌ Erreur : ${error.message||'Une erreur est survenue.'}`,flags:MessageFlags.Ephemeral}).catch(()=>{});
  }
});

client.on(Events.Error, e => console.error('❌ Erreur Discord :', e));
process.on('unhandledRejection', e => console.error('❌ Promesse non gérée :', e));
client.login(process.env.TOKEN);
