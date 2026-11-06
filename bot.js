import http from 'node:http';
import { Octokit } from "@octokit/rest";
import {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  MessageFlags,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  AttachmentBuilder,
} from "discord.js";

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is running!');
});
server.listen(3000, () => {
  console.log('✅ Web server running on port 3000');
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!TOKEN) {
  console.error("Missing DISCORD_BOT_TOKEN environment variable.");
  process.exit(1);
}

// ===== Kleuren =====
const EMBED_COLOR = 0x2ecc71;

// ===== Kanaal IDs =====
const WELCOME_CHANNEL_ID = "1567269934747090979";
const GANG_LIST_CHANNEL_ID = "1568002909243711488";
const COMMANDS_INFO_CHANNEL_ID = "1568003929265021000";
const WARN_CHANNEL_ID = "1568004154801127464";
const PROMO_CHANNEL_ID = "1567269935753990238";
const DEMOTE_CHANNEL_ID = "1567269935753990239";
const ALL_LOGS_CHANNEL_ID = "1568004384602853536";
const AFWEZIGHEID_CHANNEL_ID = "1567269935753990243";
const AANGENOMEN_CHANNEL_ID = "1567901313168048198";
const ONTSLAGEN_CHANNEL_ID = "1567901328305426542";
const SOLICITATIE_STATUS_CHANNEL_ID = "1567899535861354618";
const GANG_PORTO_CHANNEL_ID = "1567269935527366695";
const NON_ACTIEF_CHANNEL_ID = "1568028895310127154";

// ===== Ticket settings =====
const TICKET_PANEL_CHANNEL_ID = "1567269934747090980";
const TICKET_SUPPORT_ROLE_ID = "1567269932918378603";
const TICKET_TRANSCRIPT_CHANNEL_ID = "1568004866507276389";

// ===== Warn roles =====
const WARN_ROLE_LEVEL1 = "1567269932515852290";
const WARN_ROLE_LEVEL2 = "1567269932515852289";

// ===== Auto-role bij join =====
const AUTO_ROLE_ID = "1567269932515852291";

// ===== Blacklist settings =====
const BLACKLIST_CHANNEL_ID = "1568005409988415518";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
let GIST_ID = process.env.GIST_ID || null;
const GIST_FILENAME = "gsf.json";

// ===== Overige settings =====
const ROLE_CHANGE_DEBOUNCE_MS = 2000;

const DEFAULT_MAX_GANG_LEDEN = 30;
let maxGangLeden = DEFAULT_MAX_GANG_LEDEN;

const BIJNA_VOL_THRESHOLD = 5;

const TICKET_CATEGORIES = {
  application: {
    name: "Sollicitatie",
    prefix: "sollicitatie",
    categoryId: "1568009181795983412",
    emoji: "📝",
    color: EMBED_COLOR,
    isApplication: true,
  },
  partner: {
    name: "Partner",
    prefix: "partner",
    categoryId: "1568009222833045645",
    emoji: "🤝",
    color: EMBED_COLOR,
  },
};

// ===== SIMPELERE SOLLICITATIE VRAGEN =====
const APPLICATION_PARTS = {
  part1: {
    title: "01 — Wie ben je?",
    emoji: "👤",
    questions: [
      { id: "naam", label: "Naam", placeholder: "Vul je naam in", style: TextInputStyle.Short, max: 100 },
      { id: "leeftijd", label: "Leeftijd", placeholder: "Vul je leeftijd in", style: TextInputStyle.Short, max: 10 },
      { id: "discord", label: "Discord", placeholder: "Vul je Discord tag in", style: TextInputStyle.Short, max: 100 },
      { id: "ic_naam", label: "IC-naam", placeholder: "Vul je IC-naam in", style: TextInputStyle.Short, max: 100 }
    ]
  },
  part2: {
    title: "02 — Ervaring",
    emoji: "🎮",
    questions: [
      { id: "rp_ervaring", label: "Ervaring met FiveM/Serious RP", placeholder: "Vertel kort over je ervaring", style: TextInputStyle.Paragraph, max: 300 },
      { id: "activiteit", label: "Hoeveel uur per dag actief?", placeholder: "Bijv. 4 uur", style: TextInputStyle.Short, max: 50 }
    ]
  },
  part3: {
    title: "03 — Motivatie",
    emoji: "💼",
    questions: [
      { id: "waarom", label: "Waarom wil je bij GSF?", placeholder: "Leg kort uit...", style: TextInputStyle.Paragraph, max: 300 },
      { id: "toevoegen", label: "Wat kun jij toevoegen?", placeholder: "Leg kort uit...", style: TextInputStyle.Paragraph, max: 300 },
      { id: "serverregels", label: "Ben je bekend met de serverregels?", placeholder: "Ja of Nee", style: TextInputStyle.Short, max: 10 }
    ]
  }
};

const SUPPORT_TICKET_PERMS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.ManageMessages,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ManageThreads,
  PermissionFlagsBits.AddReactions,
  PermissionFlagsBits.UseExternalEmojis,
];

// ===== Role settings =====
const ADMIN_ROLE_ID = "1567269932918378603";
const MOD_ROLE_ID = "1567269932918378603";
const LID_ROLE_ID = "1567269932918378602";
const LID_NAME_PREFIX = "𝕲𝕾𝕱 | ";
const PLACEHOLDER_IMAGE = "https://cdn.discordapp.com/attachments/1567554042039771136/1568002571287662792/gsf.webp?ex=6aee3bb1&is=6aecea31&hm=aee9006b8b0e2009a7a1f4ebb27196b322c71595483d771e285eab9286dbd691&";

// ===== GSF rollen =====
const ACTIEF_ROLE_ID = "1567269932918378607";
const AFWEZIG_ROLE_ID = "1567269932918378601";

const FOOTER_TEXT = "GSF • Den Haag Roleplay";

const ranks = [
  { name: "Big Brother", roleId: "1567269932989816879", level: 8, emoji: "👑" },
  { name: "Chief Enforcer", roleId: "1567269932989816878", level: 7, emoji: "🎩" },
  { name: "Brother", roleId: "1567269932989816877", level: 6, emoji: "🤝" },
  { name: "Street Capo", roleId: "1567269932989816876", level: 5, emoji: "⚔️" },
  { name: "Street Soldier", roleId: "1567269932989816875", level: 4, emoji: "🪖" },
  { name: "Runner", roleId: "1567269932989816874", level: 3, emoji: "🏃" },
  { name: "Lookout", roleId: "1567269932989816873", level: 2, emoji: "👀" },
  { name: "Hang Around", roleId: "1567274843714486408", level: 1, emoji: "⏳" },
];

const sortedRanks = [...ranks].sort((a, b) => b.level - a.level);

const AUTO_MOD_MIN_LEVEL = 7;

// ===== Sollicitatie status =====
const SOLLICITATIE_STATUS_CONFIG = {
  open:       { label: "Open",       circle: "🟢", color: 0x2ecc71, text: "Er is ruimte voor nieuwe sollicitaties." },
  bijna_vol:  { label: "Bijna vol",  circle: "🟠", color: 0xe67e22, text: "Er is nog beperkt ruimte. Wees snel!" },
  vol:        { label: "Vol",        circle: "🔴", color: 0xe74c3c, text: "We nemen momenteel geen nieuwe sollicitaties aan." },
};

let sollicitatieStatusMessageId = null;
let lastSollicitatieStatus = null;

// ===== Gang porto =====
let gangPorto = {
  frequentie: "1",
  updatedAt: Date.now(),
  updatedBy: null,
};
let gangPortoMessageId = null;

// ===== Afwezigheid =====
const afwezigUsers = new Map();
let nonActiefMessageId = null;
let afwezigPanelMessageId = null;

// ===== Helpers =====
function getNumber(name) {
  const match = name.match(/\d+/);
  return match ? parseInt(match[0], 10) : 999;
}

function displayName(member) { return member.displayName; }
function memberLink(id, _name) { return `<@!${id}>`; }

function getCurrentDate() {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function getFullDate() {
  return new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Parse dd/mm/jjjj of dd-mm-jjjj
function parseDutchDate(input) {
  if (!input) return null;
  const match = input.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  const test = new Date(year, month - 1, day);
  if (test.getFullYear() !== year || test.getMonth() !== month - 1 || test.getDate() !== day) return null;
  return { day, month, year };
}

function dutchDateToMs(dateObj) {
  return new Date(dateObj.year, dateObj.month - 1, dateObj.day, 23, 59, 59, 999).getTime();
}

// Duur formatteren: "2d 5u 12m"
function formatRemaining(ms) {
  if (ms <= 0) return "verlopen";
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}u`);
  if (m > 0) parts.push(`${m}m`);
  return parts.join(" ") || "< 1m";
}

function hasAdminRole(member) { return member.roles.cache.has(ADMIN_ROLE_ID); }
function hasModRole(member) { return member.roles.cache.has(MOD_ROLE_ID) || member.roles.cache.has(ADMIN_ROLE_ID); }
function getRoleIdByLevel(level) { const r = ranks.find(r => r.level === level); return r ? r.roleId : null; }
function getRankNameByLevel(level) { const r = ranks.find(r => r.level === level); return r ? r.name : null; }

function getCurrentRankLevel(member) {
  for (const rank of sortedRanks) {
    if (member.roles.cache.has(rank.roleId)) return rank.level;
  }
  return 0;
}

function hasGangRole(member) {
  return ranks.some(r => member.roles.cache.has(r.roleId));
}

function shouldHaveAutoMod(member) {
  return getCurrentRankLevel(member) >= AUTO_MOD_MIN_LEVEL;
}

async function syncAutoModRole(member) {
  try {
    if (member.user.bot) return;
    const should = shouldHaveAutoMod(member);
    const has = member.roles.cache.has(MOD_ROLE_ID);

    if (should && !has) {
      await member.roles.add(MOD_ROLE_ID, "Automatisch: rang Chief Enforcer of hoger");
    } else if (!should && has) {
      await member.roles.remove(MOD_ROLE_ID, "Automatisch: rang onder Chief Enforcer");
    }
  } catch (err) { console.error("syncAutoModRole error:", err); }
}

async function removeAllGangRoles(member) {
  const gangRoleIds = ranks.map(r => r.roleId);
  const rolesToRemove = member.roles.cache.filter(role => gangRoleIds.includes(role.id));
  if (rolesToRemove.size > 0) await member.roles.remove(rolesToRemove);
}

async function removeLidRole(member) {
  if (member.roles.cache.has(LID_ROLE_ID)) await member.roles.remove(LID_ROLE_ID);
}

async function syncActiefRole(member) {
  try {
    if (member.user.bot) return;
    const hasGang = hasGangRole(member);
    const afwezigEntry = afwezigUsers.get(member.id);
    const isAfwezig = afwezigEntry && afwezigEntry.untilMs > Date.now();

    if (hasGang) {
      if (isAfwezig) {
        if (member.roles.cache.has(ACTIEF_ROLE_ID)) await member.roles.remove(ACTIEF_ROLE_ID);
        if (!member.roles.cache.has(AFWEZIG_ROLE_ID)) await member.roles.add(AFWEZIG_ROLE_ID);
      } else {
        if (member.roles.cache.has(AFWEZIG_ROLE_ID)) await member.roles.remove(AFWEZIG_ROLE_ID);
        if (!member.roles.cache.has(ACTIEF_ROLE_ID)) await member.roles.add(ACTIEF_ROLE_ID);
      }
    } else {
      if (member.roles.cache.has(ACTIEF_ROLE_ID)) await member.roles.remove(ACTIEF_ROLE_ID);
      if (member.roles.cache.has(AFWEZIG_ROLE_ID)) await member.roles.remove(AFWEZIG_ROLE_ID);
    }
  } catch (err) { console.error("syncActiefRole error:", err); }
}

async function applyLidPrefix(member) {
  try {
    if (member.user.bot) return;
    if (member.roles.cache.has(LID_ROLE_ID)) {
      if (!member.displayName.startsWith(LID_NAME_PREFIX)) {
        await member.setNickname(`${LID_NAME_PREFIX}${member.displayName}`.slice(0, 32));
      }
    } else {
      if (member.displayName.startsWith(LID_NAME_PREFIX)) {
        const newName = member.displayName.slice(LID_NAME_PREFIX.length);
        await member.setNickname(newName || null);
      }
    }
  } catch (error) { console.error("Failed to update lid prefix:", error); }
}

function getServerIcon(guild) {
  if (guild && guild.iconURL()) return guild.iconURL({ size: 1024 });
  return PLACEHOLDER_IMAGE;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration,
  ],
});

let messageId = null;
const activeApplications = new Map();

// ===== STATUS SYSTEEM =====
let statusToggle = false;

async function updateBotStatus() {
  try {
    const guild = client.guilds.cache.first();
    if (!guild) return;

    if (statusToggle) {
      client.user.setActivity(`${guild.memberCount} Discord Members`, { type: 3 });
    } else {
      const uniqueMembers = countGangMembers();
      client.user.setActivity(`${uniqueMembers} Gang Members`, { type: 3 });
    }
    statusToggle = !statusToggle;
  } catch (error) {
    console.error("Failed to update status:", error);
  }
}

function startStatusInterval() {
  updateBotStatus();
  setInterval(updateBotStatus, 10000);
}

// ===== GANG LEDEN TELLEN =====
function countGangMembers() {
  const guild = client.guilds.cache.first();
  if (!guild) return 0;
  const unique = new Set();
  for (const rank of ranks) {
    const role = guild.roles.cache.get(rank.roleId);
    if (role) role.members.forEach(m => unique.add(m.id));
  }
  return unique.size;
}

// ===== AUTOMATISCHE SOLLICITATIE STATUS =====
function computeSollicitatieStatus() {
  const count = countGangMembers();
  const plekken = maxGangLeden - count;

  if (plekken <= 0) return "vol";
  if (plekken <= BIJNA_VOL_THRESHOLD) return "bijna_vol";
  return "open";
}

// ===== LEDENLIJST =====
async function buildEmbed() {
  const guild = client.guilds.cache.first();
  if (!guild) return null;
  let body = "";
  const uniqueMembers = new Set();
  for (const rank of sortedRanks) {
    const role = guild.roles.cache.get(rank.roleId);
    if (!role) {
      body += `**${rank.emoji} ${rank.name} (0)**\n➤ Rol niet gevonden\n\n`;
      continue;
    }
    const members = [...role.members.values()].map((m) => ({ id: m.id, name: displayName(m) })).sort((a, b) => getNumber(a.name) - getNumber(b.name));
    for (const m of members) uniqueMembers.add(m.id);
    body += `**${rank.emoji} ${rank.name} (${members.length})**\n`;
    if (members.length > 0) for (const m of members) body += `➤ ${memberLink(m.id, m.name)}\n`;
    else body += `➤ Geen leden\n`;
    body += `\n`;
  }
  const description = `**Totaal: ${uniqueMembers.size} leden**\n\n${body}`;
  return new EmbedBuilder().setTitle("GSF Ledenlijst").setColor(EMBED_COLOR).setDescription(description.slice(0, 4096)).setFooter({ text: FOOTER_TEXT }).setTimestamp();
}

async function updateList() {
  const embed = await buildEmbed();
  if (!embed) throw new Error("Bot zit niet in een server.");
  const channel = await client.channels.fetch(GANG_LIST_CHANNEL_ID);
  if (!channel || !channel.isTextBased()) throw new Error(`Channel ${GANG_LIST_CHANNEL_ID} is geen tekstkanaal of bestaat niet.`);
  const payload = { embeds: [embed], allowedMentions: { parse: [] } };
  if (messageId) {
    try {
      const existing = await channel.messages.fetch(messageId);
      await existing.edit(payload);
      return;
    } catch (err) { messageId = null; }
  }
  try {
    const fetched = await channel.messages.fetch({ limit: 100 });
    const botMessages = fetched.filter((m) => m.author.id === client.user?.id);
    for (const m of botMessages.values()) await m.delete().catch(() => null);
  } catch (err) {}
  const sent = await channel.send(payload);
  messageId = sent.id;
}

async function safeUpdateList() {
  try { await updateList(); } catch (err) { console.error("Failed to update gang list:", err); }
}

// ===== WELKOM =====
async function sendWelcomeMessage(member) {
  try {
    const channel = await client.channels.fetch(WELCOME_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;
    const userAvatar = member.user?.avatarURL() || member.displayAvatarURL() || PLACEHOLDER_IMAGE;
    const memberCount = member.guild.memberCount;
    const embed = new EmbedBuilder()
      .setTitle("👋 WELKOM!")
      .setDescription(`Welkom ${memberLink(member.id, member.displayName)} in de **GSF** Discord server!`)
      .addFields(
        { name: "📊 Totaal aantal leden", value: `${memberCount}`, inline: true },
        { name: "📅 Datum", value: getCurrentDate(), inline: true }
      )
      .setColor(EMBED_COLOR).setFooter({ text: FOOTER_TEXT }).setTimestamp().setThumbnail(userAvatar);
    await channel.send({ embeds: [embed] });
  } catch (error) { console.error("Welcome message error:", error); }
}

// ===== PROMO/DEMOTE/WARN/AANGENOMEN/ONTSLAGEN =====
async function sendPromoEmbed(guild, user, oldRank, newRank, reason) {
  const channel = await client.channels.fetch(PROMO_CHANNEL_ID);
  if (!channel || !channel.isTextBased()) return;
  const embed = new EmbedBuilder().setTitle("📈 PROMOTIE").setDescription(`${memberLink(user.id, user.displayName)}`)
    .addFields(
      { name: "📌 Van", value: oldRank, inline: false },
      { name: "🎯 Naar", value: newRank, inline: false },
      { name: "📝 Reden", value: reason, inline: false },
      { name: "📅 Datum", value: getCurrentDate(), inline: false }
    ).setColor(EMBED_COLOR).setFooter({ text: FOOTER_TEXT }).setTimestamp().setThumbnail(getServerIcon(guild));
  await channel.send({ embeds: [embed] });
}

async function sendDemoteEmbed(guild, user, oldRank, newRank, reason) {
  const channel = await client.channels.fetch(DEMOTE_CHANNEL_ID);
  if (!channel || !channel.isTextBased()) return;
  const embed = new EmbedBuilder().setTitle("📉 DEMOTIE").setDescription(`${memberLink(user.id, user.displayName)}`)
    .addFields(
      { name: "📌 Van", value: oldRank, inline: false },
      { name: "⬇️ Naar", value: newRank, inline: false },
      { name: "📝 Reden", value: reason, inline: false },
      { name: "📅 Datum", value: getCurrentDate(), inline: false }
    ).setColor(EMBED_COLOR).setFooter({ text: FOOTER_TEXT }).setTimestamp().setThumbnail(getServerIcon(guild));
  await channel.send({ embeds: [embed] });
}

async function sendWarnEmbed(user, warnLevel, reason) {
  const channel = await client.channels.fetch(WARN_CHANNEL_ID);
  if (!channel || !channel.isTextBased()) return;
  const userAvatar = user.user?.avatarURL() || user.displayAvatarURL() || PLACEHOLDER_IMAGE;
  const embed = new EmbedBuilder().setTitle("⚠️ WAARSCHUWING").setDescription(`${memberLink(user.id, user.displayName)}`)
    .addFields(
      { name: "⚠️ Niveau", value: warnLevel, inline: false },
      { name: "📝 Reden", value: reason, inline: false },
      { name: "📅 Datum", value: getCurrentDate(), inline: false }
    ).setColor(EMBED_COLOR).setFooter({ text: FOOTER_TEXT }).setTimestamp().setThumbnail(userAvatar);
  await channel.send({ embeds: [embed] });
}

async function sendRemoveWarnEmbed(user, warnLevel, reason) {
  const channel = await client.channels.fetch(WARN_CHANNEL_ID);
  if (!channel || !channel.isTextBased()) return;
  const userAvatar = user.user?.avatarURL() || user.displayAvatarURL() || PLACEHOLDER_IMAGE;
  const embed = new EmbedBuilder().setTitle("✅ WAARSCHUWING INGETROKKEN").setDescription(`${memberLink(user.id, user.displayName)}`)
    .addFields(
      { name: "⚠️ Niveau", value: warnLevel, inline: false },
      { name: "📝 Reden ingetrokken", value: reason, inline: false },
      { name: "📅 Datum", value: getCurrentDate(), inline: false }
    ).setColor(EMBED_COLOR).setFooter({ text: FOOTER_TEXT }).setTimestamp().setThumbnail(userAvatar);
  await channel.send({ embeds: [embed] });
}

async function sendAangenomenEmbed(guild, user, rank, reason) {
  const channel = await client.channels.fetch(AANGENOMEN_CHANNEL_ID);
  if (!channel || !channel.isTextBased()) return;
  const userAvatar = user.user?.avatarURL() || user.displayAvatarURL() || PLACEHOLDER_IMAGE;
  const embed = new EmbedBuilder().setTitle("✅ AANGENOMEN").setDescription(`${memberLink(user.id, user.displayName)}`)
    .addFields(
      { name: "🎯 Rang", value: rank, inline: false },
      { name: "📝 Reden", value: reason, inline: false },
      { name: "📅 Datum", value: getCurrentDate(), inline: false }
    ).setColor(EMBED_COLOR).setFooter({ text: FOOTER_TEXT }).setTimestamp().setThumbnail(userAvatar);
  await channel.send({ embeds: [embed] });
}

async function sendOntslagenEmbed(user, reason) {
  const channel = await client.channels.fetch(ONTSLAGEN_CHANNEL_ID);
  if (!channel || !channel.isTextBased()) return;
  const userAvatar = user.user?.avatarURL() || user.displayAvatarURL() || PLACEHOLDER_IMAGE;
  const embed = new EmbedBuilder().setTitle("❌ ONTSLAGEN").setDescription(`${memberLink(user.id, user.displayName)}`)
    .addFields(
      { name: "📝 Reden", value: reason, inline: false },
      { name: "📅 Datum", value: getCurrentDate(), inline: false }
    ).setColor(EMBED_COLOR).setFooter({ text: FOOTER_TEXT }).setTimestamp().setThumbnail(userAvatar);
  await channel.send({ embeds: [embed] });
}

async function sendAfwezigheidEmbed(user, reason, fromDate, tilDate) {
  const channel = await client.channels.fetch(AFWEZIGHEID_CHANNEL_ID);
  if (!channel || !channel.isTextBased()) return;
  const userAvatar = user.user?.avatarURL() || user.displayAvatarURL() || PLACEHOLDER_IMAGE;
  const embed = new EmbedBuilder().setTitle("📋 AFWEZIGHEID").setDescription(`${memberLink(user.id, user.displayName)}`)
    .addFields(
      { name: "📝 Reden", value: reason, inline: false },
      { name: "📅 Vanaf", value: fromDate, inline: false },
      { name: "📅 Tot", value: tilDate, inline: false },
      { name: "📅 Gemeld op", value: getFullDate(), inline: false }
    ).setColor(EMBED_COLOR).setFooter({ text: FOOTER_TEXT }).setTimestamp().setThumbnail(userAvatar);
  await channel.send({ embeds: [embed] });
}

async function sendMuteEmbed(user, minutes, reason) {
  const channel = await client.channels.fetch(WARN_CHANNEL_ID);
  if (!channel || !channel.isTextBased()) return;
  const userAvatar = user.user?.avatarURL() || user.displayAvatarURL() || PLACEHOLDER_IMAGE;
  const embed = new EmbedBuilder().setTitle("🔇 GEMUTE").setDescription(`${memberLink(user.id, user.displayName)}`)
    .addFields(
      { name: "⏱️ Duur", value: `${minutes} minuten`, inline: false },
      { name: "📝 Reden", value: reason, inline: false },
      { name: "📅 Datum", value: getCurrentDate(), inline: false }
    ).setColor(EMBED_COLOR).setFooter({ text: FOOTER_TEXT }).setTimestamp().setThumbnail(userAvatar);
  await channel.send({ embeds: [embed] });
}

async function sendUnmuteEmbed(user, reason) {
  const channel = await client.channels.fetch(WARN_CHANNEL_ID);
  if (!channel || !channel.isTextBased()) return;
  const userAvatar = user.user?.avatarURL() || user.displayAvatarURL() || PLACEHOLDER_IMAGE;
  const embed = new EmbedBuilder().setTitle("🔊 GEUNMUTE").setDescription(`${memberLink(user.id, user.displayName)}`)
    .addFields(
      { name: "📝 Reden", value: reason || "Geen reden", inline: false },
      { name: "📅 Datum", value: getCurrentDate(), inline: false }
    ).setColor(EMBED_COLOR).setFooter({ text: FOOTER_TEXT }).setTimestamp().setThumbnail(userAvatar);
  await channel.send({ embeds: [embed] });
}

async function sendSollicitatieFormulier(interaction) {
  const guild = interaction.guild;
  const embed = new EmbedBuilder()
    .setAuthor({ name: "GSF", iconURL: getServerIcon(guild) })
    .setTitle("📝 Sollicitatieformulier")
    .setDescription(
      "Vul alle vragen **eerlijk en volledig** in. We verwachten serieuze antwoorden en respect voor onze gang.\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setColor(EMBED_COLOR).setThumbnail(getServerIcon(guild))
    .addFields(
      { name: "**01 — Wie ben je?**", value: "> **Naam:**\n> **Leeftijd:**\n> **Discord:**\n> **IC-naam:**", inline: false },
      { name: "**02 — Ervaring**", value: "> **Ervaring met FiveM/Serious RP:**\n> **Hoeveel uur per dag actief?**", inline: false },
      { name: "**03 — Motivatie**", value: "> **Waarom wil je bij GSF?**\n> **Wat kun jij toevoegen?**\n> **Ben je bekend met de serverregels?**", inline: false }
    )
    .setFooter({ text: FOOTER_TEXT, iconURL: getServerIcon(guild) })
    .setTimestamp();
  await interaction.channel.send({ embeds: [embed] });
}

// ========================================
// 📝 LOG SYSTEEM
// ========================================
async function sendLog(interaction, title, description) {
  try {
    const channel = await client.channels.fetch(ALL_LOGS_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setColor(EMBED_COLOR)
      .setDescription(description)
      .addFields(
        { name: "Gebruiker", value: `<@${interaction.user.id}> (\`${interaction.user.tag}\`)`, inline: true },
        { name: "Kanaal", value: `<#${interaction.channelId}>`, inline: true },
        { name: "Datum", value: getCurrentDate(), inline: true }
      )
      .setFooter({ text: FOOTER_TEXT })
      .setTimestamp()
      .setThumbnail(interaction.user.displayAvatarURL());
    await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
  } catch (err) {
    console.error("Log error:", err.message);
  }
}

async function sendSystemLog(title, description, thumbnailUrl = null) {
  try {
    const channel = await client.channels.fetch(ALL_LOGS_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setColor(EMBED_COLOR)
      .setDescription(description)
      .addFields({ name: "Datum", value: getCurrentDate(), inline: true })
      .setFooter({ text: FOOTER_TEXT })
      .setTimestamp();
    if (thumbnailUrl) embed.setThumbnail(thumbnailUrl);
    await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
  } catch (err) {
    console.error("System log error:", err.message);
  }
}

// ========================================
// 🚫 DB (GitHub Gist)
// ========================================
const octokit = GITHUB_TOKEN ? new Octokit({ auth: GITHUB_TOKEN }) : null;

let blacklistCache = {};
let blacklistMessageId = null;
let blacklistLoaded = false;

async function loadData() {
  if (!octokit) {
    console.warn("⚠️ Geen GITHUB_TOKEN — database werkt niet persistent.");
    blacklistLoaded = true;
    return;
  }

  try {
    if (!GIST_ID) {
      const { data } = await octokit.gists.create({
        description: "GSF Bot — Database",
        public: false,
        files: { [GIST_FILENAME]: { content: JSON.stringify({ blacklist: {}, gangporto: null, afwezig: {}, maxGangLeden: DEFAULT_MAX_GANG_LEDEN }, null, 2) } },
      });
      GIST_ID = data.id;
      console.log(`⚠️ Nieuwe Gist aangemaakt. Zet dit in je env: GIST_ID=${GIST_ID}`);
      blacklistCache = {};
      blacklistLoaded = true;
      return;
    }

    const { data } = await octokit.gists.get({ gist_id: GIST_ID });
    const content = data.files[GIST_FILENAME]?.content || "{}";
    const parsed = JSON.parse(content);

    if (parsed && typeof parsed === "object" && !("blacklist" in parsed) && !("gangporto" in parsed) && !("afwezig" in parsed) && !("maxGangLeden" in parsed)) {
      blacklistCache = parsed;
    } else {
      blacklistCache = parsed.blacklist || {};
      if (parsed.gangporto) gangPorto = { ...gangPorto, ...parsed.gangporto };
      if (typeof parsed.maxGangLeden === "number" && parsed.maxGangLeden > 0) maxGangLeden = parsed.maxGangLeden;
      if (parsed.afwezig) {
        for (const [userId, entry] of Object.entries(parsed.afwezig)) {
          if (entry.untilMs > Date.now()) afwezigUsers.set(userId, entry);
        }
      }
    }

    const now = Date.now();
    let changed = false;
    for (const [id, entry] of Object.entries(blacklistCache)) {
      if (entry.expiresAt && entry.expiresAt < now) {
        delete blacklistCache[id];
        changed = true;
      }
    }
    if (changed) await saveData();
    blacklistLoaded = true;
    console.log(`✅ Data geladen: ${Object.keys(blacklistCache).length} blacklist, ${afwezigUsers.size} afwezig, porto = ${gangPorto.frequentie}, maxGangLeden = ${maxGangLeden}`);
  } catch (err) {
    console.error("❌ Load error:", err.message);
    blacklistLoaded = true;
  }
}

async function saveData() {
  if (!octokit || !GIST_ID) {
    console.warn("⚠️ Kan niet opslaan: geen GITHUB_TOKEN of GIST_ID.");
    return false;
  }
  try {
    const afwezigObj = {};
    for (const [userId, entry] of afwezigUsers.entries()) afwezigObj[userId] = entry;
    await octokit.gists.update({
      gist_id: GIST_ID,
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify({
            blacklist: blacklistCache,
            gangporto: gangPorto,
            afwezig: afwezigObj,
            maxGangLeden: maxGangLeden,
          }, null, 2),
        },
      },
    });
    return true;
  } catch (err) {
    console.error("❌ Save error:", err.message);
    return false;
  }
}

const saveBlacklist = saveData;

function isBlacklisted(userId) {
  const entry = blacklistCache[userId];
  if (!entry) return false;
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    delete blacklistCache[userId];
    saveData().catch(() => {});
    return false;
  }
  return true;
}

function parseDuration(input) {
  if (!input) return null;
  const match = input.toLowerCase().trim().match(/^(\d+)\s*([smhdw])$/);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 };
  return value * multipliers[unit];
}

function formatDuration(ms) {
  if (!ms) return "Permanent";
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}u`);
  if (m > 0) parts.push(`${m}m`);
  return parts.join(" ") || "< 1m";
}

function formatBlacklistExpiry(entry) {
  if (!entry.expiresAt) return "Permanent";
  const remaining = entry.expiresAt - Date.now();
  if (remaining <= 0) return "Verlopen";
  const date = new Date(entry.expiresAt).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return `${formatDuration(remaining)} (${date})`;
}

async function buildBlacklistEmbed() {
  const entries = Object.entries(blacklistCache).filter(([_, e]) => !e.expiresAt || e.expiresAt > Date.now());
  entries.sort((a, b) => {
    const aPerm = !a[1].expiresAt;
    const bPerm = !b[1].expiresAt;
    if (aPerm && !bPerm) return -1;
    if (!aPerm && bPerm) return 1;
    if (aPerm && bPerm) return (a[1].addedAt || 0) - (b[1].addedAt || 0);
    return a[1].expiresAt - b[1].expiresAt;
  });

  let body = "";
  if (entries.length === 0) {
    body = "> Geen geblackliste leden op dit moment.";
  } else {
    for (const [userId, entry] of entries) {
      const expiry = formatBlacklistExpiry(entry);
      const reason = entry.reason || "Geen reden";
      body += `**🚫 ${entry.username || "Onbekend"}** (<@${userId}>)\n`;
      body += `➤ Verloopt: **${expiry}**\n`;
      body += `➤ Reden: ${reason}\n\n`;
    }
  }

  const description = `**Totaal: ${entries.length} geblacklist**\n\n${body}`;
  return new EmbedBuilder()
    .setTitle("🚫 GSF Blacklist")
    .setColor(EMBED_COLOR)
    .setDescription(description.slice(0, 4096))
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();
}

async function updateBlacklistEmbed() {
  try {
    const channel = await client.channels.fetch(BLACKLIST_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;
    const embed = await buildBlacklistEmbed();
    const payload = { embeds: [embed], allowedMentions: { parse: [] } };

    if (blacklistMessageId) {
      try {
        const msg = await channel.messages.fetch(blacklistMessageId);
        await msg.edit(payload);
        return;
      } catch { blacklistMessageId = null; }
    }

    try {
      const fetched = await channel.messages.fetch({ limit: 50 });
      const botMsgs = fetched.filter(m => m.author.id === client.user.id);
      for (const m of botMsgs.values()) await m.delete().catch(() => {});
    } catch {}

    const sent = await channel.send(payload);
    blacklistMessageId = sent.id;
  } catch (err) {
    console.error("Blacklist embed error:", err.message);
  }
}

async function addToBlacklist(userId, username, durationMs, reason, addedBy) {
  blacklistCache[userId] = {
    userId,
    username,
    reason: reason || "Geen reden",
    addedBy,
    addedAt: Date.now(),
    expiresAt: durationMs ? Date.now() + durationMs : null,
  };
  const ok = await saveData();
  await updateBlacklistEmbed();
  return ok;
}

async function removeFromBlacklist(userId) {
  if (!blacklistCache[userId]) return false;
  delete blacklistCache[userId];
  await saveData();
  await updateBlacklistEmbed();
  return true;
}

function startBlacklistInterval() {
  setInterval(async () => {
    let changed = false;
    const now = Date.now();
    for (const [id, entry] of Object.entries(blacklistCache)) {
      if (entry.expiresAt && entry.expiresAt < now) {
        delete blacklistCache[id];
        changed = true;
      }
    }
    if (changed) await saveData();
    await updateBlacklistEmbed();
  }, 60_000);
}

async function handleBlacklist(interaction) {
  if (!hasModRole(interaction.member)) {
    return interaction.reply({ content: "❌ Je hebt niet de juiste rol!", flags: MessageFlags.Ephemeral });
  }

  const targetUser = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason");
  const durationInput = interaction.options.getString("duur");

  if (targetUser.bot) {
    return interaction.reply({ content: "❌ Je kan geen bot blacklisten.", flags: MessageFlags.Ephemeral });
  }

  if (isBlacklisted(targetUser.id)) {
    return interaction.reply({ content: `❌ ${targetUser.username} staat al op de blacklist.`, flags: MessageFlags.Ephemeral });
  }

  let durationMs = null;
  if (durationInput) {
    durationMs = parseDuration(durationInput);
    if (!durationMs) {
      return interaction.reply({ content: "❌ Ongeldige duur. Gebruik bijv. `7d`, `12h`, `30m` of laat leeg voor permanent.", flags: MessageFlags.Ephemeral });
    }
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const ok = await addToBlacklist(targetUser.id, targetUser.username, durationMs, reason, interaction.user.id);

  if (ok) {
    const durLabel = durationMs ? formatDuration(durationMs) : "Permanent";
    await interaction.editReply({ content: `✅ ${targetUser.username} is geblacklist voor **${durLabel}**.\nReden: ${reason}` });
  } else {
    await interaction.editReply({ content: "⚠️ Geblacklist in geheugen, maar opslaan naar Gist mislukt." });
  }
  await sendLog(interaction, "🚫 Blacklist", `${targetUser.username} (\`${targetUser.id}\`) geblacklist.\nReden: ${reason}`);
}

async function handleUnblacklist(interaction) {
  if (!hasModRole(interaction.member)) {
    return interaction.reply({ content: "❌ Je hebt niet de juiste rol!", flags: MessageFlags.Ephemeral });
  }
  const targetUser = interaction.options.getUser("user");
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const ok = await removeFromBlacklist(targetUser.id);
  if (ok) await interaction.editReply({ content: `✅ ${targetUser.username} is van de blacklist gehaald.` });
  else await interaction.editReply({ content: `❌ ${targetUser.username} staat niet op de blacklist.` });
  await sendLog(interaction, "✅ Unblacklist", `${targetUser.username} (\`${targetUser.id}\`) van blacklist gehaald.`);
}

// ===== Mute system =====
const activeMutes = new Map();

async function applyMute(member, minutes, reason) {
  try {
    let muteRole = member.guild.roles.cache.find(r => r.name === "Gemute");
    if (!muteRole) {
      muteRole = await member.guild.roles.create({
        name: "Gemute", color: 0x808080, permissions: [], reason: "Role for muted members"
      });
      for (const channel of member.guild.channels.cache.values()) {
        try {
          await channel.permissionOverwrites.edit(muteRole, {
            SendMessages: false, AddReactions: false, Speak: false, Connect: false,
            RequestToSpeak: false, CreatePublicThreads: false, CreatePrivateThreads: false,
            SendMessagesInThreads: false,
          });
        } catch (err) {}
      }
    }
    await member.roles.add(muteRole);
    await sendMuteEmbed(member, minutes, reason);
    if (minutes > 0) {
      const timeout = setTimeout(async () => {
        await removeMute(member, "Automatisch einde mute");
        activeMutes.delete(member.id);
      }, minutes * 60 * 1000);
      activeMutes.set(member.id, timeout);
    }
    return true;
  } catch (error) { console.error("Mute error:", error); return false; }
}

async function removeMute(member, reason = "Handmatig") {
  try {
    const muteRole = member.guild.roles.cache.find(r => r.name === "Gemute");
    if (muteRole && member.roles.cache.has(muteRole.id)) {
      await member.roles.remove(muteRole);
      if (activeMutes.has(member.id)) {
        clearTimeout(activeMutes.get(member.id));
        activeMutes.delete(member.id);
      }
      await sendUnmuteEmbed(member, reason);
    }
    return true;
  } catch (error) { console.error("Unmute error:", error); return false; }
}

// ========================================
// 📻 GANG PORTO
// ========================================
function buildPortoEmbed() {
  return new EmbedBuilder()
    .setTitle("📻 GSF Gang Porto")
    .setColor(EMBED_COLOR)
    .setDescription(
      "**Huidige frequentie**\n" +
      "```" + gangPorto.frequentie + "```\n" +
      "**Regels**\n" +
      "> 1. Deel de porto **nooit** met iemand buiten de gang.\n" +
      "> 2. **Iedereen** met een gang-rol moet in de porto zitten.\n" +
      "> 3. Verander de frequentie met `/portochange`.\n\n" +
      "Laatst gewijzigd: <t:" + Math.floor(gangPorto.updatedAt / 1000) + ":R>"
    )
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();
}

async function updatePortoEmbed() {
  try {
    const channel = await client.channels.fetch(GANG_PORTO_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;
    const payload = { embeds: [buildPortoEmbed()], allowedMentions: { parse: [] } };

    if (gangPortoMessageId) {
      try {
        const msg = await channel.messages.fetch(gangPortoMessageId);
        await msg.edit(payload);
        return;
      } catch { gangPortoMessageId = null; }
    }

    try {
      const fetched = await channel.messages.fetch({ limit: 50 });
      const botMsgs = fetched.filter(m => m.author.id === client.user.id);
      for (const m of botMsgs.values()) await m.delete().catch(() => {});
    } catch {}

    const sent = await channel.send(payload);
    gangPortoMessageId = sent.id;
  } catch (err) {
    console.error("Porto embed error:", err.message);
  }
}

async function handlePortoChange(interaction) {
  if (!hasModRole(interaction.member)) {
    return interaction.reply({ content: "❌ Je hebt niet de juiste rol!", flags: MessageFlags.Ephemeral });
  }

  const freqRaw = interaction.options.getString("frequentie").trim();
  if (!/^\d{1,8}$/.test(freqRaw)) {
    return interaction.reply({ content: "❌ Gebruik alleen cijfers (max 8), bijv. `123` of `4567`.", flags: MessageFlags.Ephemeral });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const old = gangPorto.frequentie;
  gangPorto.frequentie = freqRaw;
  gangPorto.updatedAt = Date.now();
  gangPorto.updatedBy = interaction.user.id;

  const saved = await saveData();
  await updatePortoEmbed();
  await sendLog(interaction, "📻 Porto gewijzigd", `Van **${old}** naar **${freqRaw}**.`);

  if (saved) {
    await interaction.editReply({ content: `✅ Porto aangepast naar **${freqRaw}** en opgeslagen.` });
  } else {
    await interaction.editReply({ content: `⚠️ Porto aangepast naar **${freqRaw}** in geheugen, maar opslaan naar Gist mislukt.` });
  }
}

// ========================================
// 📝 SOLLICITATIE STATUS DISPLAY
// ========================================
function buildSollicitatieStatusEmbed() {
  const gangCount = countGangMembers();
  const current = computeSollicitatieStatus();
  const plekken = Math.max(0, maxGangLeden - gangCount);

  const statusLines = Object.entries(SOLLICITATIE_STATUS_CONFIG).map(([key, cfg]) => {
    const isCurrent = key === current;
    const label = isCurrent ? `**${cfg.label}**` : cfg.label;
    return `${cfg.circle} ${label} — ${cfg.text}`;
  }).join("\n");

  let desc =
    `**Huidige status**\n` +
    `${SOLLICITATIE_STATUS_CONFIG[current].circle} **${SOLLICITATIE_STATUS_CONFIG[current].label}**\n\n` +
    `**Gangleden:** ${gangCount} / ${maxGangLeden} leden\n` +
    `**Vrije plekken:** ${plekken}\n\n` +
    `**Statussen**\n${statusLines}`;

  return new EmbedBuilder()
    .setTitle("📝 Sollicitatie Status")
    .setColor(EMBED_COLOR)
    .setDescription(desc)
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();
}

async function updateSollicitatieStatusEmbed() {
  try {
    const channel = await client.channels.fetch(SOLICITATIE_STATUS_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;
    const payload = { embeds: [buildSollicitatieStatusEmbed()], allowedMentions: { parse: [] } };

    if (sollicitatieStatusMessageId) {
      try {
        const msg = await channel.messages.fetch(sollicitatieStatusMessageId);
        await msg.edit(payload);
        return;
      } catch { sollicitatieStatusMessageId = null; }
    }

    try {
      const fetched = await channel.messages.fetch({ limit: 50 });
      const botMsgs = fetched.filter(m => m.author.id === client.user.id);
      for (const m of botMsgs.values()) await m.delete().catch(() => {});
    } catch {}

    const sent = await channel.send(payload);
    sollicitatieStatusMessageId = sent.id;
  } catch (err) {
    console.error("Sollicitatie status embed error:", err.message);
  }
}

async function checkAndLogStatusChange() {
  const current = computeSollicitatieStatus();
  if (lastSollicitatieStatus !== null && lastSollicitatieStatus !== current) {
    const cfg = SOLLICITATIE_STATUS_CONFIG[current];
    await sendSystemLog("📝 Sollicitatiestatus automatisch gewijzigd", `Status → ${cfg.circle} **${cfg.label}**`);
  }
  lastSollicitatieStatus = current;
}

// ========================================
// ✏️ /editmax
// ========================================
async function handleEditMax(interaction) {
  if (!hasAdminRole(interaction.member)) {
    return interaction.reply({ content: "❌ Je hebt niet de juiste rol!", flags: MessageFlags.Ephemeral });
  }

  const aantal = interaction.options.getInteger("aantal");

  if (aantal < 1 || aantal > 500) {
    return interaction.reply({ content: "❌ Kies een getal tussen 1 en 500.", flags: MessageFlags.Ephemeral });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const old = maxGangLeden;
  maxGangLeden = aantal;

  const saved = await saveData();
  await updateSollicitatieStatusEmbed();
  await checkAndLogStatusChange();
  await sendLog(interaction, "✏️ Max gangleden gewijzigd", `Van **${old}** naar **${aantal}**.`);

  if (saved) {
    await interaction.editReply({ content: `✅ Max gangleden aangepast naar **${aantal}** en opgeslagen.` });
  } else {
    await interaction.editReply({ content: `⚠️ Max aangepast naar **${aantal}** in geheugen, maar opslaan naar Gist mislukt.` });
  }
}

// ========================================
// 📴 NON-ACTIEF DISPLAY
// ========================================
function buildNonActiefEmbed() {
  const entries = [...afwezigUsers.entries()].filter(([_, e]) => e.untilMs > Date.now());
  let body = "";
  if (entries.length === 0) {
    body = "> Momenteel is niemand non-actief.";
  } else {
    const now = Date.now();
    entries.sort((a, b) => a[1].untilMs - b[1].untilMs);
    for (const [userId, entry] of entries) {
      const remaining = formatRemaining(entry.untilMs - now);
      body += `<@${userId}> — ${entry.reason}\n`;
      body += `➤ Nog: **${remaining}** (tot ${entry.tilDate})\n\n`;
    }
  }
  return new EmbedBuilder()
    .setTitle("📴 Non-Actief")
    .setColor(EMBED_COLOR)
    .setDescription(body.slice(0, 4096))
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();
}

async function updateNonActiefEmbed() {
  try {
    const channel = await client.channels.fetch(NON_ACTIEF_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;
    const payload = { embeds: [buildNonActiefEmbed()], allowedMentions: { parse: [] } };

    if (nonActiefMessageId) {
      try {
        const msg = await channel.messages.fetch(nonActiefMessageId);
        await msg.edit(payload);
        return;
      } catch { nonActiefMessageId = null; }
    }

    try {
      const fetched = await channel.messages.fetch({ limit: 50 });
      const botMsgs = fetched.filter(m => m.author.id === client.user.id);
      for (const m of botMsgs.values()) await m.delete().catch(() => {});
    } catch {}

    const sent = await channel.send(payload);
    nonActiefMessageId = sent.id;
  } catch (err) {
    console.error("Non-actief embed error:", err.message);
  }
}

// ========================================
// 📋 AFWEZIGHEID PANEL
// ========================================
function buildAfwezigPanelEmbed() {
  return new EmbedBuilder()
    .setTitle("📋 Afwezigheid melden")
    .setColor(EMBED_COLOR)
    .setDescription(
      "**Meld je afwezigheid**\n\n" +
      "Klik op de knop hieronder om je afwezigheid te melden.\n" +
      "Je krijgt dan de **non-actief** rol en je **actief** rol wordt weggehaald.\n\n" +
      "**Datum formaat**\n" +
      "> `01/01/2026`\n" +
      "> `01-01-2026`\n\n" +
      "Je kan je op elk moment eerder aanwezig melden."
    )
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();
}

function buildAfwezigPanelButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('afwezig_melden_open')
      .setLabel('Afwezig melden')
      .setEmoji('📋')
      .setStyle(ButtonStyle.Primary)
  );
}

async function setupAfwezigPanel() {
  try {
    const channel = await client.channels.fetch(AFWEZIGHEID_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;

    // Verwijder ALLEEN het oude panel-bericht (niet de afwezigheids-embeds!)
    if (afwezigPanelMessageId) {
      try {
        const old = await channel.messages.fetch(afwezigPanelMessageId);
        await old.delete().catch(() => {});
      } catch {}
      afwezigPanelMessageId = null;
    }

    const sent = await channel.send({ embeds: [buildAfwezigPanelEmbed()], components: [buildAfwezigPanelButton()] });
    afwezigPanelMessageId = sent.id;
    console.log("✅ Afwezigheid panel (opnieuw) geplaatst");
  } catch (e) {
    console.error("Afwezig panel error:", e.message);
  }
}

function buildAfwezigModal() {
  const modal = new ModalBuilder()
    .setCustomId("afwezig_melden_modal")
    .setTitle("Afwezigheid melden");

  const reasonInput = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("Reden")
    .setPlaceholder("Waarom ben je afwezig?")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(300);

  const fromInput = new TextInputBuilder()
    .setCustomId("from")
    .setLabel("Vanaf (dd/mm/jjjj of dd-mm-jjjj)")
    .setPlaceholder("01/01/2026")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(10);

  const tilInput = new TextInputBuilder()
    .setCustomId("til")
    .setLabel("Tot (dd/mm/jjjj of dd-mm-jjjj)")
    .setPlaceholder("07/01/2026")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(10);

  modal.addComponents(
    new ActionRowBuilder().addComponents(reasonInput),
    new ActionRowBuilder().addComponents(fromInput),
    new ActionRowBuilder().addComponents(tilInput)
  );
  return modal;
}

async function registerAfwezigheid({ guild, userId, reason, fromRaw, tilRaw }) {
  const fromParsed = parseDutchDate(fromRaw);
  if (!fromParsed) {
    return {
      ok: false,
      error:
        "❌ **Ongeldige 'vanaf' datum.**\n\n" +
        "Gebruik een van deze formaten:\n" +
        "> `01/01/2026`\n" +
        "> `01-01-2026`\n\n" +
        `Je gaf: \`${fromRaw}\``
    };
  }

  const tilParsed = parseDutchDate(tilRaw);
  if (!tilParsed) {
    return {
      ok: false,
      error:
        "❌ **Ongeldige 'tot' datum.**\n\n" +
        "Gebruik een van deze formaten:\n" +
        "> `01/01/2026`\n" +
        "> `01-01-2026`\n\n" +
        `Je gaf: \`${tilRaw}\``
    };
  }

  const fromMs = dutchDateToMs(fromParsed);
  const untilMs = dutchDateToMs(tilParsed);

  if (untilMs < fromMs) {
    return { ok: false, error: "❌ De **'tot'** datum kan niet vóór de **'vanaf'** datum liggen." };
  }

  if (untilMs < Date.now()) {
    return { ok: false, error: "❌ De **'tot'** datum ligt in het verleden. Kies een datum in de toekomst." };
  }

  const member = await guild.members.fetch(userId);

  afwezigUsers.set(member.id, {
    reason,
    fromDate: fromRaw,
    tilDate: tilRaw,
    untilMs,
    since: Date.now(),
  });
  await saveData();

  await syncActiefRole(member);
  await sendAfwezigheidEmbed(member, reason, fromRaw, tilRaw);
  await updateNonActiefEmbed();

  // Verplaats afwezig-panel naar onderen
  await setupAfwezigPanel();

  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle("📋 Afwezigheid gemeld")
      .setColor(EMBED_COLOR)
      .setDescription(
        `Je bent afwezig gemeld tot **${tilRaw}**.\n` +
        `Reden: ${reason}\n\n` +
        `Je actief-rol is weggehaald en je hebt de non-actief-rol gekregen.\n\n` +
        `Klik hieronder om je eerder weer aanwezig te melden (of wacht tot de einddatum).`
      )
      .setFooter({ text: FOOTER_TEXT })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`aanwezig_${member.id}`)
        .setLabel("Aanwezig melden")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success)
    );

    await member.send({ embeds: [dmEmbed], components: [row] });
  } catch (err) {
    console.log("Kon geen DM sturen naar user voor afwezigheid.");
  }

  return { ok: true, member };
}

async function handleAfwezigheid(interaction) {
  const reason = interaction.options.getString("reason");
  const fromRaw = interaction.options.getString("from");
  const tilRaw = interaction.options.getString("til");

  const result = await registerAfwezigheid({
    guild: interaction.guild,
    userId: interaction.user.id,
    reason, fromRaw, tilRaw,
  });

  if (!result.ok) {
    return interaction.reply({ content: result.error, flags: MessageFlags.Ephemeral });
  }

  await interaction.reply({ content: `✅ Afwezigheid gemeld tot **${tilRaw}**. Je actief-rol is weg, non-actief staat aan.`, flags: MessageFlags.Ephemeral });
  await sendLog(interaction, "📋 Afwezigheid", `<@${interaction.user.id}> afwezig gemeld tot **${tilRaw}**.\nReden: ${reason}`);
}

async function handleAfwezigModalSubmit(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const reason = interaction.fields.getTextInputValue("reason");
  const fromRaw = interaction.fields.getTextInputValue("from");
  const tilRaw = interaction.fields.getTextInputValue("til");

  const result = await registerAfwezigheid({
    guild: interaction.guild,
    userId: interaction.user.id,
    reason, fromRaw, tilRaw,
  });

  if (!result.ok) {
    return interaction.editReply({ content: result.error });
  }

  await interaction.editReply({ content: `✅ Afwezigheid gemeld tot **${tilRaw}**. Je actief-rol is weg, non-actief staat aan.` });

  try {
    const channel = await client.channels.fetch(ALL_LOGS_CHANNEL_ID);
    if (channel && channel.isTextBased()) {
      const embed = new EmbedBuilder()
        .setTitle("📋 Afwezigheid")
        .setColor(EMBED_COLOR)
        .setDescription(`<@${interaction.user.id}> afwezig gemeld tot **${tilRaw}**.\nReden: ${reason}`)
        .addFields(
          { name: "Gebruiker", value: `<@${interaction.user.id}>`, inline: true },
          { name: "Datum", value: getCurrentDate(), inline: true }
        )
        .setFooter({ text: FOOTER_TEXT })
        .setTimestamp()
        .setThumbnail(interaction.user.displayAvatarURL());
      await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
    }
  } catch (err) {}
}

// ===== Aanwezig melden =====
async function handleAanwezig(interaction, userId) {
  if (interaction.user.id !== userId) {
    return interaction.reply({ content: "❌ Deze knop is niet voor jou.", flags: MessageFlags.Ephemeral });
  }

  const entry = afwezigUsers.get(userId);
  if (!entry) {
    return interaction.reply({ content: "ℹ️ Je bent niet (meer) afwezig gemeld.", flags: MessageFlags.Ephemeral });
  }

  afwezigUsers.delete(userId);
  await saveData();

  let member = null;
  try {
    member = await interaction.guild.members.fetch(userId);
    await syncActiefRole(member);
  } catch (err) {}

  await updateNonActiefEmbed();

  await interaction.update({
    content: "✅ Je bent weer aanwezig gemeld! Je actief-rol is teruggezet.",
    embeds: [],
    components: []
  }).catch(async () => {
    await interaction.reply({ content: "✅ Je bent weer aanwezig gemeld!", flags: MessageFlags.Ephemeral }).catch(() => {});
  });

  try {
    const user = await client.users.fetch(userId);
    const dmEmbed = new EmbedBuilder()
      .setTitle("✅ Weer aanwezig gemeld")
      .setColor(EMBED_COLOR)
      .setDescription(
        `Je bent weer **aanwezig** gemeld!\n\n` +
        `Je non-actief-rol is weggehaald en je actief-rol is teruggezet.\n` +
        `Welkom terug bij **GSF**!`
      )
      .setFooter({ text: FOOTER_TEXT })
      .setTimestamp();

    await user.send({ embeds: [dmEmbed] });
  } catch (err) {
    console.log(`Kon geen bevestigings-DM sturen naar ${userId} (${err.message})`);
  }

  try {
    const memberName = member ? member.displayName : `<@${userId}>`;
    await sendSystemLog("✅ Aanwezig gemeld", `${memberName} heeft zich weer aanwezig gemeld.`);
  } catch (err) {}
}

async function checkAfwezigExpiry() {
  const guild = client.guilds.cache.first();
  if (!guild) return;
  const now = Date.now();
  let changed = false;
  for (const [userId, entry] of afwezigUsers.entries()) {
    if (entry.untilMs <= now) {
      afwezigUsers.delete(userId);
      changed = true;
      try {
        const member = await guild.members.fetch(userId);
        await syncActiefRole(member);

        try {
          const user = await client.users.fetch(userId);
          const dmEmbed = new EmbedBuilder()
            .setTitle("✅ Afwezigheid automatisch beëindigd")
            .setColor(EMBED_COLOR)
            .setDescription(
              `Je afwezigheid is **automatisch beëindigd** op de einddatum.\n\n` +
              `Je non-actief-rol is weggehaald en je actief-rol is teruggezet.\n` +
              `Welkom terug bij **GSF**!`
            )
            .setFooter({ text: FOOTER_TEXT })
            .setTimestamp();
          await user.send({ embeds: [dmEmbed] });
        } catch (err) {}
      } catch {}
    }
  }
  if (changed) {
    await saveData();
    await updateNonActiefEmbed();
  }
}

// ========================================
// 🎫 TICKET SYSTEM
// ========================================
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderContent(content, mentions) {
  if (!content) return '';
  let html = escapeHtml(content);
  if (mentions && mentions.users) {
    for (const [id, user] of mentions.users) {
      html = html.replace(new RegExp(`&lt;@!?${id}&gt;`, 'g'), `<span class="mention">@${escapeHtml(user.username)}</span>`);
    }
  }
  html = html.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank">$1</a>');
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="codeblock">$1</pre>');
  html = html.replace(/`([^`]+)`/g, '<code class="inline">$1</code>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\n/g, '<br>');
  return html;
}

function renderEmbed(e) {
  const color = e.color ? `#${e.color.toString(16).padStart(6, '0')}` : '#5865f2';
  let fields = '';
  if (e.fields && e.fields.length > 0) {
    fields = `<div class="embed-fields">${e.fields.map(f =>
      `<div class="embed-field" style="grid-column: span ${f.inline ? 1 : 2}">
        <div class="embed-field-name">${escapeHtml(f.name)}</div>
        <div class="embed-field-value">${renderContent(f.value)}</div>
      </div>`
    ).join('')}</div>`;
  }
  return `<div class="embed" style="border-left:4px solid ${color}">
    <div class="embed-grid">
      <div class="embed-main">
        ${e.author ? `<div class="embed-author">${e.author.iconURL ? `<img src="${e.author.iconURL}" class="embed-author-icon">` : ''}${escapeHtml(e.author.name)}</div>` : ''}
        ${e.title ? `<div class="embed-title">${escapeHtml(e.title)}</div>` : ''}
        ${e.description ? `<div class="embed-desc">${renderContent(e.description)}</div>` : ''}
        ${fields}
        ${e.footer ? `<div class="embed-footer">${e.footer.iconURL ? `<img src="${e.footer.iconURL}" class="embed-footer-icon">` : ''}${escapeHtml(e.footer.text)}</div>` : ''}
      </div>
      ${e.thumbnail ? `<img src="${e.thumbnail.url}" class="embed-thumb">` : ''}
    </div>
    ${e.image ? `<img src="${e.image.url}" class="embed-image">` : ''}
  </div>`;
}

function renderAttachments(attachments) {
  if (!attachments || attachments.size === 0) return '';
  return [...attachments.values()].map(a => {
    const isImage = a.contentType && a.contentType.startsWith('image/');
    if (isImage) return `<div class="attachment-image"><a href="${a.url}" target="_blank"><img src="${a.url}" alt="${escapeHtml(a.name)}"></a></div>`;
    return `<div class="attachment"><a href="${a.url}" target="_blank">📎 ${escapeHtml(a.name)}</a></div>`;
  }).join('');
}

async function makeTranscript(channel) {
  let allMessages = [], lastId = null, searching = true;
  while (searching) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;
    const messages = await channel.messages.fetch(options);
    if (messages.size === 0) break;
    allMessages.push(...messages.values());
    lastId = messages.last().id;
    if (messages.size < 100) searching = false;
  }
  allMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
  const messagesHtml = allMessages.map(m => {
    const avatar = m.author.displayAvatarURL({ extension: 'png', size: 64 });
    const time = new Date(m.createdTimestamp).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const botBadge = m.author.bot ? '<span class="bot-badge">BOT</span>' : '';
    return `<div class="message">
      <img class="avatar" src="${avatar}" alt="avatar">
      <div class="message-body">
        <div class="message-header">
          <span class="username" style="color:${m.member && m.member.displayHexColor && m.member.displayHexColor !== '#000000' ? m.member.displayHexColor : '#ffffff'}">${escapeHtml(m.author.username)}</span>
          ${botBadge}
          <span class="timestamp">${time}</span>
        </div>
        ${m.content ? `<div class="message-content">${renderContent(m.content, m.mentions)}</div>` : ''}
        ${m.embeds && m.embeds.length > 0 ? m.embeds.map(renderEmbed).join('') : ''}
        ${renderAttachments(m.attachments)}
      </div>
    </div>`;
  }).join('');
  const html = `<!DOCTYPE html>
<html lang="nl"><head><meta charset="UTF-8"><title>Transcript - #${escapeHtml(channel.name)}</title>
<style>
* { box-sizing: border-box; }
body { margin: 0; background: #313338; color: #dbdee1; font-family: 'gg sans', Arial, sans-serif; font-size: 16px; line-height: 1.375; }
.header { background: #2b2d31; padding: 16px 20px; border-bottom: 1px solid #1e1f22; }
.header h1 { margin: 0; font-size: 18px; color: #f2f3f5; }
.header .meta { color: #949ba4; font-size: 13px; margin-top: 4px; }
.chat { padding: 20px 0; }
.message { display: flex; padding: 4px 20px; margin-top: 16px; }
.avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 16px; flex-shrink: 0; }
.message-body { flex: 1; min-width: 0; }
.message-header { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; }
.username { font-weight: 500; font-size: 16px; }
.bot-badge { background: #5865f2; color: #fff; font-size: 10px; font-weight: 600; padding: 1px 4px; border-radius: 3px; }
.timestamp { color: #949ba4; font-size: 12px; }
.message-content { color: #dbdee1; word-wrap: break-word; white-space: pre-wrap; }
.mention { background: #3c4270; color: #c9cdfb; padding: 0 2px; border-radius: 3px; }
.codeblock { background: #2b2d31; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 14px; white-space: pre-wrap; }
.embed { background: #2b2d31; border-radius: 4px; padding: 12px 16px; margin-top: 8px; max-width: 520px; }
.embed-title { font-size: 16px; font-weight: 600; color: #f2f3f5; margin-bottom: 4px; }
.embed-desc { font-size: 14px; color: #dbdee1; }
.embed-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
.embed-field-name { font-size: 14px; font-weight: 600; color: #f2f3f5; }
.embed-field-value { font-size: 14px; color: #dbdee1; }
.embed-thumb { width: 80px; height: 80px; border-radius: 4px; }
.embed-footer { font-size: 12px; color: #949ba4; margin-top: 8px; }
</style></head><body>
<div class="header"><h1>Transcript: #${escapeHtml(channel.name)}</h1><div class="meta">${allMessages.length} berichten • ${new Date().toLocaleString('nl-NL')}</div></div>
<div class="chat">${messagesHtml}</div>
</body></html>`;
  return { html, messageCount: allMessages.length };
}

const activeTickets = new Map();

async function closeTicket(channel, closerId) {
  const ticket = activeTickets.get(channel.id);
  if (!ticket) return { ok: false, reason: 'Geen actief ticket.' };
  try {
    const { html, messageCount } = await makeTranscript(channel);
    const buffer = Buffer.from(html, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: `transcript-${channel.name}.html` });

    const transcriptChannel = await client.channels.fetch(TICKET_TRANSCRIPT_CHANNEL_ID);
    const cat = TICKET_CATEGORIES[ticket.category];
    const embed = new EmbedBuilder()
      .setTitle('Ticket Transcript')
      .setColor(EMBED_COLOR)
      .addFields(
        { name: 'Kanaal', value: `#${channel.name}`, inline: true },
        { name: 'Klant', value: `<@${ticket.userId}>`, inline: true },
        { name: 'Gesloten door', value: `<@${closerId}>`, inline: true },
        { name: 'Categorie', value: cat ? cat.name : 'Onbekend', inline: true },
        { name: 'Berichten', value: `${messageCount}`, inline: true }
      )
      .setFooter({ text: FOOTER_TEXT })
      .setTimestamp();
    await transcriptChannel.send({ embeds: [embed], files: [attachment] });

    try {
      const user = await client.users.fetch(ticket.userId);
      await user.send({
        content: `🔒 Je ticket **#${channel.name}** is gesloten. Hieronder vind je het transcript.`,
        files: [attachment]
      });
    } catch (e) { console.log("Kon geen DM sturen naar user."); }

  } catch (e) { console.error('Transcript error:', e.message); }

  activeTickets.delete(channel.id);
  activeApplications.delete(channel.id);
  setTimeout(async () => { try { await channel.delete('Ticket gesloten'); } catch (e) {} }, 5000);
  return { ok: true };
}

function buildTicketPanelEmbed() {
  return new EmbedBuilder()
    .setTitle('🎫 Tickets')
    .setColor(EMBED_COLOR)
    .setDescription('Kies hieronder een categorie om een ticket te openen.\n\n> 📝 **Sollicitatie** — Solliciteer bij GSF\n> 🤝 **Partner** — Vraag een partnership aan')
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();
}

function buildTicketPanelMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket_category_select')
      .setPlaceholder('Kies een categorie...')
      .addOptions([
        { label: 'Sollicitatie', value: 'application', emoji: '📝', description: 'Solliciteer bij GSF' },
        { label: 'Partner', value: 'partner', emoji: '🤝', description: 'Vraag een partnership aan' },
      ])
  );
}

async function setupTicketPanel() {
  try {
    const channel = await client.channels.fetch(TICKET_PANEL_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;
    try {
      const fetched = await channel.messages.fetch({ limit: 50 });
      const botMsgs = fetched.filter(m => m.author.id === client.user.id);
      for (const m of botMsgs.values()) await m.delete().catch(() => {});
    } catch (e) {}
    await channel.send({ embeds: [buildTicketPanelEmbed()], components: [buildTicketPanelMenu()] });
    console.log('✅ Ticket panel geplaatst');
  } catch (e) { console.error('Ticket panel error:', e.message); }
}

// ===== SOLLICITATIE SYSTEEM =====
function buildApplicationStartEmbed() {
  return new EmbedBuilder()
    .setTitle('📝 Sollicitatie Formulier')
    .setColor(EMBED_COLOR)
    .setDescription(
      'Welkom bij je sollicitatie voor **GSF**!\n\n' +
      'Vul de 3 delen in door op de knoppen hieronder te klikken.\n\n' +
      '👤 **Deel 1** — Wie ben je?\n' +
      '🎮 **Deel 2** — Ervaring\n' +
      '💼 **Deel 3** — Motivatie\n\n' +
      'Zodra je alle 3 de delen hebt ingevuld, wordt je sollicitatie automatisch naar de staff gestuurd!'
    )
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();
}

function buildApplicationButtons(channelId) {
  const data = activeApplications.get(channelId) || { part1: false, part2: false, part3: false };

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`app_part1_${channelId}`)
      .setLabel('Deel 1: Wie ben je?')
      .setEmoji(data.part1 ? '✅' : '👤')
      .setStyle(data.part1 ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`app_part2_${channelId}`)
      .setLabel('Deel 2: Ervaring')
      .setEmoji(data.part2 ? '✅' : '🎮')
      .setStyle(data.part2 ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`app_part3_${channelId}`)
      .setLabel('Deel 3: Motivatie')
      .setEmoji(data.part3 ? '✅' : '💼')
      .setStyle(data.part3 ? ButtonStyle.Success : ButtonStyle.Secondary)
  );
}

function buildApplicationModal(partKey) {
  const part = APPLICATION_PARTS[partKey];
  const modal = new ModalBuilder().setCustomId(`app_modal_${partKey}`).setTitle(part.title);

  for (const q of part.questions) {
    const input = new TextInputBuilder()
      .setCustomId(q.id)
      .setLabel(q.label.slice(0, 45))
      .setPlaceholder(q.placeholder.slice(0, 100))
      .setStyle(q.style)
      .setRequired(true)
      .setMaxLength(q.max);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  }
  return modal;
}

function buildFinalApplicationEmbed(userId, answers) {
  const p1 = answers.part1 || {};
  const p2 = answers.part2 || {};
  const p3 = answers.part3 || {};

  return new EmbedBuilder()
    .setTitle('📝 Sollicitatie Ingevuld')
    .setColor(EMBED_COLOR)
    .setDescription(`<@${userId}> heeft de sollicitatie volledig ingevuld.`)
    .addFields(
      { name: '👤 01 — Wie ben je?', value: `**Naam:** ${p1.naam || '-'}\n**Leeftijd:** ${p1.leeftijd || '-'}\n**Discord:** ${p1.discord || '-'}\n**IC Naam:** ${p1.ic_naam || '-'}`, inline: false },
      { name: '🎮 02 — Ervaring', value: `**FiveM/Serious RP:** ${p2.rp_ervaring || '-'}\n**Activiteit:** ${p2.activiteit || '-'}`, inline: false },
      { name: '💼 03 — Motivatie', value: `**Waarom GSF:** ${p3.waarom || '-'}\n**Toevoeging:** ${p3.toevoegen || '-'}\n**Bekend met regels:** ${p3.serverregels || '-'}`, inline: false }
    )
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();
}

function buildAdminReviewButtons(channelId, userId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`app_accept_${userId}`).setLabel('Aannemen').setEmoji('✅').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`app_reject_${userId}`).setLabel('Afwijzen').setEmoji('❌').setStyle(ButtonStyle.Danger)
  );
}

function buildRankSelectMenu(userId) {
  const options = ranks.map(r => ({ label: r.name, value: r.roleId }));
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`app_rank_select_${userId}`)
      .setPlaceholder('Kies een rang voor de gebruiker...')
      .addOptions(options)
  );
}

// ===== COMMANDS OVERZICHT =====
async function setupCommandsEmbed() {
  try {
    const channel = await client.channels.fetch(COMMANDS_INFO_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;

    try {
      const fetched = await channel.messages.fetch({ limit: 50 });
      const botMsgs = fetched.filter(m => m.author.id === client.user.id);
      for (const m of botMsgs.values()) await m.delete().catch(() => {});
    } catch (e) {}

    const embed = new EmbedBuilder()
      .setTitle('📚 Bot Commands Overzicht')
      .setColor(EMBED_COLOR)
      .setDescription('Hieronder vind je een overzicht van alle beschikbare commands voor de GSF bot.')
      .addFields(
        {
          name: '🛠️ Algemeen & Beheer',
          value:
            '**`/refresh`** — Refresh de gang ledenlijst\n' +
            '**`/clear <aantal>`** — Verwijder berichten in het kanaal\n' +
            '**`/afwezig <reden> <van> <tot>`** — Meld je afwezigheid\n' +
            '**`/mute <user> <minuten> [reden]`** — Mute een lid\n' +
            '**`/unmute <user> [reden]`** — Unmute een lid',
          inline: false
        },
        {
          name: '👑 Gang Beheer',
          value:
            '**`/promo <stappen> <user> <reden>`** — Promoveer een lid\n' +
            '**`/demote <stappen> <user> <reden>`** — Demoveer een lid\n' +
            '**`/aangenomen <user> <rang> <reden>`** — Neem een nieuw lid aan\n' +
            '**`/ontslagen <user> <reden>`** — Ontsla een lid\n' +
            '**`/warn <nummer> <user> <reden>`** — Geef een waarschuwing\n' +
            '**`/removewarn <nummer> <user> <reden>`** — Trek een waarschuwing in\n' +
            '**`/blacklist <user> <reden> [duur]`** — Blacklist een gebruiker\n' +
            '**`/unblacklist <user>`** — Haal van de blacklist\n' +
            '**`/portochange <frequentie>`** — Wijzig de gang porto\n' +
            '**`/editmax <aantal>`** — Wijzig max gangleden',
          inline: false
        },
        {
          name: '🎫 Ticket Beheer',
          value:
            '**`/ticketpanel`** — Plaats het ticket paneel\n' +
            '**`/add <user>`** — Voeg een user toe aan ticket\n' +
            '**`/remove <user>`** — Verwijder een user uit ticket\n' +
            '**`/close`** — Sluit het ticket\n' +
            '**`/rename <naam>`** — Hernoem het ticket kanaal\n' +
            '**`/sollicitatieformulier`** — Stuur het sollicitatieformulier',
          inline: false
        }
      )
      .setFooter({ text: FOOTER_TEXT, iconURL: getServerIcon(channel.guild) })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    console.log('✅ Commands overzicht geplaatst');
  } catch (e) {
    console.error('Kon commands overzicht niet plaatsen:', e.message);
  }
}

// ===== Command registration =====
async function registerCommands() {
  const commands = [
    new SlashCommandBuilder().setName("refresh").setDescription("Refresh de gang ledenlijst nu").addBooleanOption(o => o.setName("ephemeral").setDescription("Toon alleen aan jou").setRequired(false)),
    new SlashCommandBuilder().setName("promo").setDescription("Promoveer een lid").addIntegerOption(o => o.setName("steps").setDescription("Stappen omhoog").setRequired(true).setMinValue(1).setMaxValue(9)).addUserOption(o => o.setName("user").setDescription("Lid").setRequired(true)).addStringOption(o => o.setName("reason").setDescription("Reden").setRequired(true)),
    new SlashCommandBuilder().setName("demote").setDescription("Demoveer een lid").addIntegerOption(o => o.setName("steps").setDescription("Stappen omlaag").setRequired(true).setMinValue(1).setMaxValue(9)).addUserOption(o => o.setName("user").setDescription("Lid").setRequired(true)).addStringOption(o => o.setName("reason").setDescription("Reden").setRequired(true)),
    new SlashCommandBuilder().setName("warn").setDescription("Waarschuw een lid").addIntegerOption(o => o.setName("number").setDescription("1 of 2").setRequired(true).setMinValue(1).setMaxValue(2)).addUserOption(o => o.setName("user").setDescription("Lid").setRequired(true)).addStringOption(o => o.setName("reason").setDescription("Reden").setRequired(true)),
    new SlashCommandBuilder().setName("removewarn").setDescription("Trek waarschuwing in").addIntegerOption(o => o.setName("number").setDescription("1 of 2").setRequired(true).setMinValue(1).setMaxValue(2)).addUserOption(o => o.setName("user").setDescription("Lid").setRequired(true)).addStringOption(o => o.setName("reason").setDescription("Reden").setRequired(true)),
    new SlashCommandBuilder().setName("aangenomen").setDescription("Neem een nieuw lid aan").addUserOption(o => o.setName("user").setDescription("Lid").setRequired(true)).addStringOption(o => o.setName("rank").setDescription("Rang").setRequired(true).addChoices(...ranks.map(r => ({ name: r.name, value: r.name })))).addStringOption(o => o.setName("reason").setDescription("Reden").setRequired(true)),
    new SlashCommandBuilder().setName("ontslagen").setDescription("Ontsla een lid").addUserOption(o => o.setName("user").setDescription("Lid").setRequired(true)).addStringOption(o => o.setName("reason").setDescription("Reden").setRequired(true)),
    new SlashCommandBuilder().setName("afwezig").setDescription("Meld afwezigheid").addStringOption(o => o.setName("reason").setDescription("Reden").setRequired(true)).addStringOption(o => o.setName("from").setDescription("Vanaf (dd/mm/jjjj of dd-mm-jjjj)").setRequired(true)).addStringOption(o => o.setName("til").setDescription("Tot (dd/mm/jjjj of dd-mm-jjjj)").setRequired(true)),
    new SlashCommandBuilder().setName("clear").setDescription("Verwijder berichten").addStringOption(o => o.setName("number").setDescription("Aantal of 'all'").setRequired(true)),
    new SlashCommandBuilder().setName("mute").setDescription("Mute een lid").addUserOption(o => o.setName("user").setDescription("Lid").setRequired(true)).addIntegerOption(o => o.setName("minutes").setDescription("Minuten").setRequired(true).setMinValue(1).setMaxValue(1440)).addStringOption(o => o.setName("reason").setDescription("Reden").setRequired(false)),
    new SlashCommandBuilder().setName("unmute").setDescription("Unmute een lid").addUserOption(o => o.setName("user").setDescription("Lid").setRequired(true)).addStringOption(o => o.setName("reason").setDescription("Reden").setRequired(false)),
    new SlashCommandBuilder().setName("sollicitatieformulier").setDescription("Stuur het GSF sollicitatieformulier (alleen mods)"),
    new SlashCommandBuilder().setName("add").setDescription("Voeg een gebruiker toe aan dit ticket").addUserOption(o => o.setName("user").setDescription("Gebruiker").setRequired(true)),
    new SlashCommandBuilder().setName("remove").setDescription("Verwijder een gebruiker uit dit ticket").addUserOption(o => o.setName("user").setDescription("Gebruiker").setRequired(true)),
    new SlashCommandBuilder().setName("close").setDescription("Sluit dit ticket"),
    new SlashCommandBuilder().setName("rename").setDescription("Hernoem dit ticket").addStringOption(o => o.setName("name").setDescription("Nieuwe naam").setRequired(true)),
    new SlashCommandBuilder().setName("ticketpanel").setDescription("Plaats het ticket panel (alleen mods)"),
    new SlashCommandBuilder()
      .setName("blacklist")
      .setDescription("Blacklist een gebruiker (zonder duur = permanent)")
      .addUserOption(o => o.setName("user").setDescription("Gebruiker").setRequired(true))
      .addStringOption(o => o.setName("reason").setDescription("Reden van blacklist").setRequired(true))
      .addStringOption(o => o.setName("duur").setDescription("Duur: bijv. 7d, 12h, 30m (leeg = permanent)").setRequired(false)),
    new SlashCommandBuilder()
      .setName("unblacklist")
      .setDescription("Haal een gebruiker van de blacklist")
      .addUserOption(o => o.setName("user").setDescription("Gebruiker").setRequired(true)),
    new SlashCommandBuilder()
      .setName("portochange")
      .setDescription("Wijzig de gang porto frequentie")
      .addStringOption(o => o.setName("frequentie").setDescription("Nieuwe frequentie (alleen cijfers)").setRequired(true)),
    new SlashCommandBuilder()
      .setName("editmax")
      .setDescription("Wijzig het maximum aantal gangleden (alleen admins)")
      .addIntegerOption(o => o.setName("aantal").setDescription("Nieuw maximum (1-500)").setRequired(true).setMinValue(1).setMaxValue(500)),
  ].map(cmd => cmd.toJSON());

  try {
    const guild = client.guilds.cache.first();
    if (guild) {
      await guild.commands.set(commands);
      console.log(`✅ Commands geregistreerd in ${guild.name}`);
    } else {
      await client.application?.commands.set(commands);
    }
  } catch (err) { console.error("Failed to register commands:", err); }
}

// ===== Command handlers =====
async function handlePromote(interaction) {
  const steps = interaction.options.getInteger("steps");
  const targetUser = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason");
  if (!hasModRole(interaction.member)) return interaction.reply({ content: "❌ Je hebt niet de juiste rol!", flags: MessageFlags.Ephemeral });
  const targetMember = await interaction.guild.members.fetch(targetUser.id);
  const currentLevel = getCurrentRankLevel(targetMember);
  if (currentLevel === 0) return interaction.reply({ content: `❌ ${targetUser.username} heeft geen gang rol!`, flags: MessageFlags.Ephemeral });
  let newLevel = Math.min(currentLevel + steps, 8);
  if (newLevel === currentLevel) return interaction.reply({ content: `❌ Al hoogste rang!`, flags: MessageFlags.Ephemeral });
  const newRole = interaction.guild.roles.cache.get(getRoleIdByLevel(newLevel));
  try {
    await removeAllGangRoles(targetMember);
    await targetMember.roles.add(newRole);
    await syncActiefRole(targetMember);
    await syncAutoModRole(targetMember);
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await sendPromoEmbed(interaction.guild, targetMember, getRankNameByLevel(currentLevel), getRankNameByLevel(newLevel), reason, steps);
    await safeUpdateList();
    await updateSollicitatieStatusEmbed();
    await checkAndLogStatusChange();
    await interaction.deleteReply().catch(() => null);
    await sendLog(interaction, "📈 Promotie", `<@${targetUser.id}> van **${getRankNameByLevel(currentLevel)}** naar **${getRankNameByLevel(newLevel)}**.\nReden: ${reason}`);
  } catch (error) { if (!interaction.replied) await interaction.reply({ content: `❌ ${error.message}`, flags: MessageFlags.Ephemeral }); }
}

async function handleDemote(interaction) {
  const steps = interaction.options.getInteger("steps");
  const targetUser = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason");
  if (!hasModRole(interaction.member)) return interaction.reply({ content: "❌ Je hebt niet de juiste rol!", flags: MessageFlags.Ephemeral });
  const targetMember = await interaction.guild.members.fetch(targetUser.id);
  const currentLevel = getCurrentRankLevel(targetMember);
  if (currentLevel === 0) return interaction.reply({ content: `❌ ${targetUser.username} heeft geen gang rol!`, flags: MessageFlags.Ephemeral });
  let newLevel = Math.max(currentLevel - steps, 1);
  if (newLevel === currentLevel) return interaction.reply({ content: `❌ Al laagste rang!`, flags: MessageFlags.Ephemeral });
  const newRole = interaction.guild.roles.cache.get(getRoleIdByLevel(newLevel));
  try {
    await removeAllGangRoles(targetMember);
    await targetMember.roles.add(newRole);
    await syncActiefRole(targetMember);
    await syncAutoModRole(targetMember);
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await sendDemoteEmbed(interaction.guild, targetMember, getRankNameByLevel(currentLevel), getRankNameByLevel(newLevel), reason, steps);
    await safeUpdateList();
    await updateSollicitatieStatusEmbed();
    await checkAndLogStatusChange();
    await interaction.deleteReply().catch(() => null);
    await sendLog(interaction, "📉 Demotie", `<@${targetUser.id}> van **${getRankNameByLevel(currentLevel)}** naar **${getRankNameByLevel(newLevel)}**.\nReden: ${reason}`);
  } catch (error) { if (!interaction.replied) await interaction.reply({ content: `❌ ${error.message}`, flags: MessageFlags.Ephemeral }); }
}

async function handleWarn(interaction) {
  const number = interaction.options.getInteger("number");
  const targetUser = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason");
  if (!hasModRole(interaction.member)) return interaction.reply({ content: "❌ Je hebt niet de juiste rol!", flags: MessageFlags.Ephemeral });
  const targetMember = await interaction.guild.members.fetch(targetUser.id);
  const warnRole = interaction.guild.roles.cache.get(number === 1 ? WARN_ROLE_LEVEL1 : WARN_ROLE_LEVEL2);
  try {
    await targetMember.roles.add(warnRole);
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await sendWarnEmbed(targetMember, number === 1 ? "1e Waarschuwing" : "2e Waarschuwing", reason);
    await interaction.deleteReply().catch(() => null);
    await sendLog(interaction, "⚠️ Warn", `<@${targetUser.id}> kreeg waarschuwing ${number}.\nReden: ${reason}`);
  } catch (error) { if (!interaction.replied) await interaction.reply({ content: `❌ ${error.message}`, flags: MessageFlags.Ephemeral }); }
}

async function handleRemoveWarn(interaction) {
  const number = interaction.options.getInteger("number");
  const targetUser = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason");
  if (!hasModRole(interaction.member)) return interaction.reply({ content: "❌ Je hebt niet de juiste rol!", flags: MessageFlags.Ephemeral });
  const targetMember = await interaction.guild.members.fetch(targetUser.id);
  const warnRoleId = number === 1 ? WARN_ROLE_LEVEL1 : WARN_ROLE_LEVEL2;
  if (!targetMember.roles.cache.has(warnRoleId)) return interaction.reply({ content: `❌ ${targetUser.username} heeft geen waarschuwing!`, flags: MessageFlags.Ephemeral });
  try {
    await targetMember.roles.remove(interaction.guild.roles.cache.get(warnRoleId));
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await sendRemoveWarnEmbed(targetMember, number === 1 ? "1e Waarschuwing" : "2e Waarschuwing", reason);
    await interaction.deleteReply().catch(() => null);
    await sendLog(interaction, "✅ Warn ingetrokken", `<@${targetUser.id}> waarschuwing ${number} ingetrokken.\nReden: ${reason}`);
  } catch (error) { if (!interaction.replied) await interaction.reply({ content: `❌ ${error.message}`, flags: MessageFlags.Ephemeral }); }
}

async function handleAangenomen(interaction) {
  const targetUser = interaction.options.getUser("user");
  const rankName = interaction.options.getString("rank");
  const reason = interaction.options.getString("reason");
  if (!hasAdminRole(interaction.member)) return interaction.reply({ content: "❌ Je hebt niet de juiste rol!", flags: MessageFlags.Ephemeral });

  if (isBlacklisted(targetUser.id)) {
    return interaction.reply({ content: `❌ ${targetUser.username} staat op de blacklist en kan niet aangenomen worden.`, flags: MessageFlags.Ephemeral });
  }

  if (computeSollicitatieStatus() === "vol") {
    return interaction.reply({ content: `❌ De gang is vol (${countGangMembers()}/${maxGangLeden}). Je kan niemand meer aannemen.`, flags: MessageFlags.Ephemeral });
  }

  const rank = ranks.find(r => r.name === rankName);
  const targetMember = await interaction.guild.members.fetch(targetUser.id);
  try {
    await removeAllGangRoles(targetMember);
    await targetMember.roles.add(interaction.guild.roles.cache.get(rank.roleId));
    await targetMember.roles.add(interaction.guild.roles.cache.get(LID_ROLE_ID));
    await syncActiefRole(targetMember);
    await syncAutoModRole(targetMember);
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await sendAangenomenEmbed(interaction.guild, targetMember, rank.name, reason);
    await safeUpdateList();
    await updateSollicitatieStatusEmbed();
    await checkAndLogStatusChange();

    try {
      await targetUser.send({ content: `✅ Gefeliciteerd! Je bent aangenomen bij **GSF** met de rang **${rank.name}**.\nReden: ${reason}` });
    } catch (err) {}

    await interaction.deleteReply().catch(() => null);
    await sendLog(interaction, "✅ Aangenomen", `<@${targetUser.id}> aangenomen als **${rank.name}**.\nReden: ${reason}`);
  } catch (error) { if (!interaction.replied) await interaction.reply({ content: `❌ ${error.message}`, flags: MessageFlags.Ephemeral }); }
}

async function handleOntslagen(interaction) {
  const targetUser = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason");
  if (!hasModRole(interaction.member)) return interaction.reply({ content: "❌ Je hebt niet de juiste rol!", flags: MessageFlags.Ephemeral });
  const targetMember = await interaction.guild.members.fetch(targetUser.id);
  try {
    await removeAllGangRoles(targetMember);
    await removeLidRole(targetMember);
    await syncActiefRole(targetMember);
    await syncAutoModRole(targetMember);
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await sendOntslagenEmbed(targetMember, reason);
    await safeUpdateList();
    await updateSollicitatieStatusEmbed();
    await checkAndLogStatusChange();

    try {
      await targetUser.send({ content: `❌ Je bent ontslagen bij **GSF**.\nReden: ${reason}` });
    } catch (err) {}

    await interaction.deleteReply().catch(() => null);
    await sendLog(interaction, "❌ Ontslagen", `<@${targetUser.id}> ontslagen.\nReden: ${reason}`);
  } catch (error) { if (!interaction.replied) await interaction.reply({ content: `❌ ${error.message}`, flags: MessageFlags.Ephemeral }); }
}

async function handleRefresh(interaction) {
  if (!hasModRole(interaction.member)) return interaction.reply({ content: "❌ Je hebt niet de juiste rol!", flags: MessageFlags.Ephemeral });
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    await updateList();
    await updateSollicitatieStatusEmbed();
    await checkAndLogStatusChange();
    await interaction.editReply("✅ Ledenlijst bijgewerkt.");
    await sendLog(interaction, "🔄 Refresh", `Ledenlijst bijgewerkt.`);
  }
  catch (err) { await interaction.editReply(`❌ ${err.message}`); }
}

async function handleClear(interaction) {
  const numberInput = interaction.options.getString("number");
  const channel = interaction.channel;
  if (!hasModRole(interaction.member)) return interaction.reply({ content: "❌ Je hebt niet de juiste rol!", ephemeral: true });
  if (!channel.permissionsFor(client.user)?.has(PermissionFlagsBits.ManageMessages)) return interaction.reply({ content: "❌ Geen permissie!", ephemeral: true });
  await interaction.deferReply({ ephemeral: true });
  try {
    let deletedSize = 0;
    if (numberInput.toLowerCase() === "all") {
      let fetched;
      do {
        fetched = await channel.messages.fetch({ limit: 100 });
        if (fetched.size === 0) break;
        const deleted = await channel.bulkDelete(fetched, true);
        deletedSize += deleted.size;
        await new Promise(r => setTimeout(r, 1000));
      } while (fetched.size === 100);
      await interaction.editReply({ content: `✅ **${deletedSize}** berichten verwijderd!` });
    } else {
      const amount = parseInt(numberInput);
      if (isNaN(amount) || amount < 1 || amount > 100) return interaction.editReply({ content: "❌ Voer een getal 1-100 in of 'all'!" });
      const fetched = await channel.messages.fetch({ limit: amount });
      const deleted = await channel.bulkDelete(fetched, true);
      deletedSize = deleted.size;
      await interaction.editReply({ content: `✅ **${deletedSize}** berichten verwijderd!` });
    }
    await sendLog(interaction, "🧹 Clear", `${deletedSize} berichten verwijderd in <#${channel.id}>.`);
  } catch (error) { await interaction.editReply({ content: `❌ ${error.message}` }); }
}

async function handleMute(interaction) {
  const targetUser = interaction.options.getUser("user");
  const minutes = interaction.options.getInteger("minutes");
  const reason = interaction.options.getString("reason") || "Geen reden";
  if (!hasModRole(interaction.member)) return interaction.reply({ content: "❌ Je hebt niet de juiste rol!", flags: MessageFlags.Ephemeral });
  const targetMember = await interaction.guild.members.fetch(targetUser.id);
  const existingMuteRole = interaction.guild.roles.cache.find(r => r.name === "Gemute");
  if (existingMuteRole && targetMember.roles.cache.has(existingMuteRole.id)) return interaction.reply({ content: "❌ Al gemute!", ephemeral: true });
  await interaction.deferReply({ ephemeral: true });
  const success = await applyMute(targetMember, minutes, reason);
  if (success) await interaction.editReply({ content: `✅ ${targetUser.username} is gemute voor ${minutes} min!` });
  else await interaction.editReply({ content: `❌ Mute mislukt.` });
  await sendLog(interaction, "🔇 Mute", `<@${targetUser.id}> gemute voor ${minutes} min.\nReden: ${reason}`);
}

async function handleUnmute(interaction) {
  const targetUser = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason") || "Geen reden";
  if (!hasModRole(interaction.member)) return interaction.reply({ content: "❌ Je hebt niet de juiste rol!", flags: MessageFlags.Ephemeral });
  const targetMember = await interaction.guild.members.fetch(targetUser.id);
  await interaction.deferReply({ ephemeral: true });
  const success = await removeMute(targetMember, reason);
  if (success) await interaction.editReply({ content: `✅ ${targetUser.username} is geunmute!` });
  else await interaction.editReply({ content: `❌ Unmute mislukt.` });
  await sendLog(interaction, "🔊 Unmute", `<@${targetUser.id}> geunmute.\nReden: ${reason}`);
}

async function handleSollicitatieFormulier(interaction) {
  if (!hasModRole(interaction.member)) return interaction.reply({ content: "❌ Je hebt niet de juiste rol!", flags: MessageFlags.Ephemeral });
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    await sendSollicitatieFormulier(interaction);
    await interaction.editReply({ content: "✅ Formulier verzonden!" });
    await sendLog(interaction, "📝 Sollicitatieformulier", `Formulier verzonden in <#${interaction.channelId}>.`);
  } catch (error) { await interaction.editReply({ content: `❌ ${error.message}` }); }
}

// ===== Ticket handlers =====
async function handleTicketCategorySelect(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const choice = interaction.values[0];
  const cat = TICKET_CATEGORIES[choice];
  if (!cat) return interaction.editReply({ content: 'Onbekende categorie.' });

  try {
    const guild = interaction.guild;
    const ticketOwner = await guild.members.fetch(interaction.user.id);
    const supportRole = await guild.roles.fetch(TICKET_SUPPORT_ROLE_ID).catch(() => null);
    const everyoneRole = guild.roles.everyone;

    if (!supportRole) {
      return interaction.editReply({ content: `⚠️ Ticket support rol (${TICKET_SUPPORT_ROLE_ID}) niet gevonden.` });
    }

    const existing = [...activeTickets.entries()].find(([_, t]) => t.userId === interaction.user.id);
    if (existing) return interaction.editReply({ content: `Je hebt al een open ticket: <#${existing[0]}>` });

    const channelName = `${cat.prefix}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: cat.categoryId,
      permissionOverwrites: [
        { id: everyoneRole, deny: [PermissionFlagsBits.ViewChannel] },
        { id: ticketOwner, allow: [
          PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles,
        ]},
        { id: supportRole, allow: SUPPORT_TICKET_PERMS },
        { id: client.user, allow: [
          PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory,
        ]},
      ],
      topic: `Ticket van ${interaction.user.tag} — ${cat.name}`,
    });

    activeTickets.set(ticketChannel.id, {
      userId: interaction.user.id,
      category: choice,
      extraUsers: [],
      startedAt: Date.now(),
    });

    const embed = new EmbedBuilder()
      .setTitle(cat.name)
      .setColor(EMBED_COLOR)
      .setDescription(`<@${interaction.user.id}> — beschrijf hieronder je vraag.`)
      .setFooter({ text: FOOTER_TEXT })
      .setTimestamp();

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_close').setLabel('Sluiten').setEmoji('🔒').setStyle(ButtonStyle.Danger)
    );

    if (cat.isApplication) {
      activeApplications.set(ticketChannel.id, {
        part1: false, part2: false, part3: false,
        answers: {}
      });

      const startEmbed = buildApplicationStartEmbed();
      const appButtons = buildApplicationButtons(ticketChannel.id);

      await ticketChannel.send({
        content: `<@${interaction.user.id}> <@&${TICKET_SUPPORT_ROLE_ID}>`,
        embeds: [embed, startEmbed],
        components: [appButtons, closeRow]
      });
    } else {
      await ticketChannel.send({ content: `<@${interaction.user.id}> <@&${TICKET_SUPPORT_ROLE_ID}>`, embeds: [embed], components: [closeRow] });
    }

    await interaction.editReply({ content: `Ticket aangemaakt: <#${ticketChannel.id}>` });
    await sendLog(interaction, "🎫 Ticket geopend", `<@${interaction.user.id}> opende ticket <#${ticketChannel.id}> (${cat.name}).`);
  } catch (e) {
    console.error('Ticket create error:', e);
    await interaction.editReply({ content: `Fout: ${e.message}` });
  }
}

async function handleApplicationPartOpen(interaction, partKey) {
  try {
    const modal = buildApplicationModal(partKey);
    await interaction.showModal(modal);
  } catch (error) {
    console.error(`❌ ShowModal error (${partKey}):`, error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: `❌ Kon deel niet openen: ${error.message}`, ephemeral: true }).catch(console.error);
    }
  }
}

async function handleApplicationModalSubmit(interaction, partKey) {
  await interaction.deferReply({ ephemeral: true });

  const channelId = interaction.channelId;
  const data = activeApplications.get(channelId);

  if (!data) {
    return interaction.editReply({ content: '❌ Sollicitatie data niet gevonden. Probeer opnieuw.' });
  }

  const part = APPLICATION_PARTS[partKey];
  const answers = data.answers;

  if (!answers[partKey]) answers[partKey] = {};
  for (const q of part.questions) {
    answers[partKey][q.id] = interaction.fields.getTextInputValue(q.id);
  }

  data[partKey] = true;
  data.userId = interaction.user.id;
  activeApplications.set(channelId, data);

  try {
    const messages = await interaction.channel.messages.fetch({ limit: 20 });
    const botMessage = messages.find(m => m.author.id === client.user.id && m.components.length > 0 && m.components[0].components[0].customId?.startsWith('app_part'));
    if (botMessage) {
      await botMessage.edit({ components: [buildApplicationButtons(channelId), new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_close').setLabel('Sluiten').setEmoji('🔒').setStyle(ButtonStyle.Danger))] });
    }
  } catch (e) { console.error('Failed to update buttons:', e); }

  await interaction.editReply({ content: `✅ **${part.title}** opgeslagen!` });

  if (data.part1 && data.part2 && data.part3) {
    const finalEmbed = buildFinalApplicationEmbed(data.userId, answers);
    const adminButtons = buildAdminReviewButtons(channelId, data.userId);

    await interaction.channel.send({
      content: `<@&${TICKET_SUPPORT_ROLE_ID}> 📢 **Een nieuwe sollicitatie is volledig ingevuld!**`,
      embeds: [finalEmbed],
      components: [adminButtons]
    });

    data.completed = true;
    activeApplications.set(channelId, data);
  }
}

async function handleAppAccept(interaction, userId) {
  if (!hasAdminRole(interaction.member)) return interaction.reply({ content: "❌ Je hebt niet de juiste rol!", ephemeral: true });
  if (computeSollicitatieStatus() === "vol") {
    return interaction.reply({ content: `❌ De gang is vol (${countGangMembers()}/${maxGangLeden}). Je kan niemand meer aannemen.`, ephemeral: true });
  }
  await interaction.reply({
    content: "Kies de rang voor deze gebruiker in het dropdown menu hieronder:",
    components: [buildRankSelectMenu(userId)],
    ephemeral: true
  });
}

async function handleAppReject(interaction, userId) {
  if (!hasAdminRole(interaction.member)) return interaction.reply({ content: "❌ Je hebt niet de juiste rol!", ephemeral: true });
  await interaction.update({ components: [] });
  const targetUser = await client.users.fetch(userId).catch(() => null);
  if (targetUser) {
    await sendOntslagenEmbed(targetUser, "Sollicitatie afgewezen");
    try {
      await targetUser.send({ content: `❌ Je sollicitatie bij **GSF** is helaas afgewezen.\nReden: Sollicitatie afgewezen` });
    } catch (err) {}
  }
  await interaction.channel.send({ content: `❌ Sollicitatie van <@${userId}> is afgewezen door <@${interaction.user.id}>.` });
  await sendLog(interaction, "❌ Sollicitatie afgewezen", `<@${userId}> afgewezen.`);
}

async function handleAppRankSelect(interaction, userId) {
  if (!hasAdminRole(interaction.member)) return interaction.reply({ content: "❌ Je hebt niet de juiste rol!", ephemeral: true });
  if (isBlacklisted(userId)) {
    return interaction.reply({ content: `❌ <@${userId}> staat op de blacklist en kan niet aangenomen worden.`, ephemeral: true });
  }
  if (computeSollicitatieStatus() === "vol") {
    return interaction.reply({ content: `❌ De gang is vol (${countGangMembers()}/${maxGangLeden}). Je kan niemand meer aannemen.`, ephemeral: true });
  }

  await interaction.deferUpdate();
  const roleId = interaction.values[0];
  const rank = ranks.find(r => r.roleId === roleId);
  if (!rank) return;

  const reason = "Sollicitatie/Overstap";
  const targetUser = await client.users.fetch(userId).catch(() => null);
  const targetMember = await interaction.guild.members.fetch(userId).catch(() => null);

  if (!targetUser || !targetMember) {
    return interaction.followUp({ content: "❌ Gebruiker niet gevonden.", ephemeral: true });
  }

  try {
    await removeAllGangRoles(targetMember);
    await targetMember.roles.add(interaction.guild.roles.cache.get(rank.roleId));
    await targetMember.roles.add(interaction.guild.roles.cache.get(LID_ROLE_ID));
    await syncActiefRole(targetMember);
    await syncAutoModRole(targetMember);

    await sendAangenomenEmbed(interaction.guild, targetMember, rank.name, reason);
    await safeUpdateList();
    await updateSollicitatieStatusEmbed();
    await checkAndLogStatusChange();

    try {
      await targetUser.send({
        content: `✅ Gefeliciteerd! Je bent aangenomen bij **GSF** met de rang **${rank.name}**.\nReden: ${reason}`
      });
    } catch (err) {}

    await interaction.editReply({ content: `✅ <@${userId}> is aangenomen als **${rank.name}**!`, components: [] });
    await interaction.channel.send({ content: `✅ <@${userId}> is aangenomen als **${rank.name}** door <@${interaction.user.id}>.` });
    await sendLog(interaction, "✅ Aangenomen (sollicitatie)", `<@${userId}> aangenomen als **${rank.name}**.`);
  } catch (error) {
    await interaction.followUp({ content: `❌ Fout: ${error.message}`, ephemeral: true });
  }
}

async function handleTicketClose(interaction) {
  const ticket = activeTickets.get(interaction.channelId);
  if (!ticket) return interaction.reply({ content: 'Geen actief ticket.', ephemeral: true });
  const isOwner = ticket.userId === interaction.user.id;
  const isStaff = interaction.member.roles.cache.has(TICKET_SUPPORT_ROLE_ID);
  if (!isOwner && !isStaff) return interaction.reply({ content: 'Je mag dit ticket niet sluiten.', ephemeral: true });
  await interaction.reply({ content: '🔒 Ticket wordt gesloten en transcript wordt verstuurd...' });
  await closeTicket(interaction.channel, interaction.user.id);
  await sendLog(interaction, "🔒 Ticket gesloten", `Ticket <#${interaction.channelId}> gesloten.`);
}

async function handleAdd(interaction) {
  if (!interaction.member.roles.cache.has(TICKET_SUPPORT_ROLE_ID)) return interaction.reply({ content: '❌ Geen permissie.', ephemeral: true });
  await interaction.deferReply({ ephemeral: true });
  const ticket = activeTickets.get(interaction.channelId);
  if (!ticket) return interaction.editReply({ content: 'Geen actief ticket.' });
  const targetUser = interaction.options.getUser('user');

  try {
    const targetMember = await interaction.guild.members.fetch(targetUser.id);
    await interaction.channel.permissionOverwrites.edit(targetMember, {
      ViewChannel: true, SendMessages: true, ReadMessageHistory: true, AttachFiles: true,
    });
    if (!ticket.extraUsers.includes(targetUser.id)) ticket.extraUsers.push(targetUser.id);
    await interaction.channel.send({ content: `➕ <@${targetUser.id}> is toegevoegd door <@${interaction.user.id}>.` });
    await interaction.editReply({ content: `✅ <@${targetUser.id}> toegevoegd.` });
    await sendLog(interaction, "➕ Ticket toevoegen", `<@${targetUser.id}> toegevoegd aan ticket.`);
  } catch (e) { await interaction.editReply({ content: `Fout: ${e.message}` }); }
}

async function handleRemove(interaction) {
  if (!interaction.member.roles.cache.has(TICKET_SUPPORT_ROLE_ID)) return interaction.reply({ content: '❌ Geen permissie.', ephemeral: true });
  await interaction.deferReply({ ephemeral: true });
  const ticket = activeTickets.get(interaction.channelId);
  if (!ticket) return interaction.editReply({ content: 'Geen actief ticket.' });
  const targetUser = interaction.options.getUser('user');
  if (targetUser.id === ticket.userId) return interaction.editReply({ content: '⚠️ Kan eigenaar niet verwijderen.' });

  try {
    const targetMember = await interaction.guild.members.fetch(targetUser.id);
    await interaction.channel.permissionOverwrites.delete(targetMember);
    ticket.extraUsers = ticket.extraUsers.filter(id => id !== targetUser.id);
    await interaction.channel.send({ content: `➖ <@${targetUser.id}> is verwijderd door <@${interaction.user.id}>.` });
    await interaction.editReply({ content: `✅ <@${targetUser.id}> verwijderd.` });
    await sendLog(interaction, "➖ Ticket verwijderen", `<@${targetUser.id}> verwijderd uit ticket.`);
  } catch (e) { await interaction.editReply({ content: `Fout: ${e.message}` }); }
}

async function handleClose(interaction) {
  if (!interaction.member.roles.cache.has(TICKET_SUPPORT_ROLE_ID)) return interaction.reply({ content: '❌ Geen permissie.', ephemeral: true });
  const ticket = activeTickets.get(interaction.channelId);
  if (!ticket) return interaction.reply({ content: 'Geen actief ticket.', ephemeral: true });
  await interaction.reply({ content: '🔒 Ticket wordt gesloten en transcript wordt verstuurd...' });
  await closeTicket(interaction.channel, interaction.user.id);
  await sendLog(interaction, "🔒 Ticket gesloten", `Ticket <#${interaction.channelId}> gesloten via /close.`);
}

async function handleRename(interaction) {
  if (!interaction.member.roles.cache.has(TICKET_SUPPORT_ROLE_ID)) return interaction.reply({ content: '❌ Geen permissie.', ephemeral: true });
  await interaction.deferReply({ ephemeral: true });
  if (!activeTickets.has(interaction.channelId)) return interaction.editReply({ content: 'Geen actief ticket.' });
  const newName = interaction.options.getString('name').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 100);
  if (!newName) return interaction.editReply({ content: '⚠️ Ongeldige naam.' });
  const oldName = interaction.channel.name;
  try {
    await interaction.channel.setName(newName);
    await interaction.editReply({ content: `✅ Hernoemd naar \`${newName}\`.` });
    await sendLog(interaction, "✏️ Ticket hernoemd", `Van \`${oldName}\` naar \`${newName}\`.`);
  } catch (e) { await interaction.editReply({ content: `Fout: ${e.message}` }); }
}

async function handleTicketPanel(interaction) {
  if (!hasModRole(interaction.member)) return interaction.reply({ content: '❌ Geen permissie.', ephemeral: true });
  await interaction.deferReply({ ephemeral: true });
  try {
    await setupTicketPanel();
    await interaction.editReply({ content: '✅ Ticket panel geplaatst!' });
    await sendLog(interaction, "🎫 Ticketpanel", `Ticketpanel opnieuw geplaatst.`);
  } catch (e) { await interaction.editReply({ content: `Fout: ${e.message}` }); }
}

// ===== Events =====
const watchedRoleIds = new Set(ranks.map(r => r.roleId));
let pendingUpdate = null;

function scheduleUpdate() {
  if (pendingUpdate) return;
  pendingUpdate = setTimeout(() => { pendingUpdate = null; safeUpdateList(); }, ROLE_CHANGE_DEBOUNCE_MS);
}

client.once("ready", async () => {
  console.log(`✅ Bot online als ${client.user?.tag}`);
  try {
    const guild = client.guilds.cache.first();
    if (guild) {
      await guild.members.fetch();
      await guild.roles.fetch();
      for (const member of guild.members.cache.values()) {
        if (member.user.bot) continue;
        await applyLidPrefix(member);
        await syncActiefRole(member);
        await syncAutoModRole(member);
      }
    }
  } catch (err) { console.error("Ready error:", err); }

  await registerCommands();
  await safeUpdateList();
  await setupTicketPanel();
  await setupCommandsEmbed();
  await setupAfwezigPanel();

  await loadData();
  await updateBlacklistEmbed();
  await updatePortoEmbed();
  await updateSollicitatieStatusEmbed();
  await updateNonActiefEmbed();
  lastSollicitatieStatus = computeSollicitatieStatus();
  startBlacklistInterval();
  setInterval(checkAfwezigExpiry, 60_000);

  startStatusInterval();
});

client.on("guildMemberAdd", async (member) => {
  try {
    if (!member.user.bot) await member.roles.add(AUTO_ROLE_ID, "Auto-role bij join");
  } catch (err) { console.error("Auto-role error:", err); }
  await sendWelcomeMessage(member);
});

client.on("guildMemberRemove", async (member) => {
  const hasGang = [...member.roles.cache.keys()].some(id => watchedRoleIds.has(id));
  if (hasGang) scheduleUpdate();
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
  const hadLid = oldMember.roles.cache.has(LID_ROLE_ID);
  const hasLid = newMember.roles.cache.has(LID_ROLE_ID);
  if (hadLid !== hasLid) await applyLidPrefix(newMember);

  const oldGang = ranks.some(r => oldMember.roles.cache.has(r.roleId));
  const newGang = ranks.some(r => newMember.roles.cache.has(r.roleId));
  if (oldGang !== newGang) {
    await syncActiefRole(newMember);
    await syncAutoModRole(newMember);
  }

  const oldRoles = new Set(oldMember.roles.cache.keys());
  const newRoles = new Set(newMember.roles.cache.keys());
  let changed = false;
  for (const id of oldRoles) if (!newRoles.has(id)) changed = true;
  for (const id of newRoles) if (!oldRoles.has(id)) changed = true;
  if (!changed) return;
  let touchesGangRole = false;
  for (const id of watchedRoleIds) if (oldRoles.has(id) !== newRoles.has(id)) { touchesGangRole = true; break; }
  if (touchesGangRole) {
    await syncAutoModRole(newMember);
    scheduleUpdate();
    await updateSollicitatieStatusEmbed();
    await checkAndLogStatusChange();
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId.startsWith('app_part')) {
      const partKey = interaction.customId.split('_')[1];
      return await handleApplicationPartOpen(interaction, partKey);
    }
    if (interaction.customId === 'ticket_close') {
      return await handleTicketClose(interaction);
    }
    if (interaction.customId.startsWith('app_accept_')) {
      const userId = interaction.customId.split('_')[2];
      return await handleAppAccept(interaction, userId);
    }
    if (interaction.customId.startsWith('app_reject_')) {
      const userId = interaction.customId.split('_')[2];
      return await handleAppReject(interaction, userId);
    }
    if (interaction.customId.startsWith('aanwezig_')) {
      const userId = interaction.customId.split('_')[1];
      return await handleAanwezig(interaction, userId);
    }
    if (interaction.customId === 'afwezig_melden_open') {
      return await interaction.showModal(buildAfwezigModal());
    }
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'ticket_category_select') {
      return await handleTicketCategorySelect(interaction);
    }
    if (interaction.customId.startsWith('app_rank_select_')) {
      const userId = interaction.customId.split('_')[3];
      return await handleAppRankSelect(interaction, userId);
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'afwezig_melden_modal') {
      return await handleAfwezigModalSubmit(interaction);
    }
    if (interaction.customId.startsWith('app_modal_')) {
      const partKey = interaction.customId.replace('app_modal_', '');
      return await handleApplicationModalSubmit(interaction, partKey);
    }
  }

  if (interaction.isChatInputCommand()) {
    const name = interaction.commandName;
    if (name === "refresh") await handleRefresh(interaction);
    else if (name === "promo") await handlePromote(interaction);
    else if (name === "demote") await handleDemote(interaction);
    else if (name === "warn") await handleWarn(interaction);
    else if (name === "removewarn") await handleRemoveWarn(interaction);
    else if (name === "aangenomen") await handleAangenomen(interaction);
    else if (name === "ontslagen") await handleOntslagen(interaction);
    else if (name === "afwezig") await handleAfwezigheid(interaction);
    else if (name === "clear") await handleClear(interaction);
    else if (name === "mute") await handleMute(interaction);
    else if (name === "unmute") await handleUnmute(interaction);
    else if (name === "sollicitatieformulier") await handleSollicitatieFormulier(interaction);
    else if (name === "add") await handleAdd(interaction);
    else if (name === "remove") await handleRemove(interaction);
    else if (name === "close") await handleClose(interaction);
    else if (name === "rename") await handleRename(interaction);
    else if (name === "ticketpanel") await handleTicketPanel(interaction);
    else if (name === "blacklist") await handleBlacklist(interaction);
    else if (name === "unblacklist") await handleUnblacklist(interaction);
    else if (name === "portochange") await handlePortoChange(interaction);
    else if (name === "editmax") await handleEditMax(interaction);
    return;
  }
});

process.on("unhandledRejection", (reason) => console.error("Unhandled rejection:", reason));
process.on("uncaughtException", (err) => console.error("Uncaught exception:", err));

client.login(TOKEN);
