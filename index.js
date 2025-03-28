const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const { token, prefix } = require("./config.js");
const handleInteraction = require("./handlers/interactionHandler");
const handleTicketCommand = require("./handlers/ticketHandler");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const command = args.shift().toLowerCase();

  if (command === "setup") {
    handleTicketCommand(message);
  }
});

client.on("interactionCreate", async (interaction) => {
  handleInteraction(interaction);
});

client.once("ready", () => {
  console.log(`Bot đã sẵn sàng! Đăng nhập với tên: ${client.user.tag}`);
  client.user.setPresence({
    activities: [
      { name: `Mua hàng đi ngừi đẹp`, type: ActivityType.Streaming },
    ],
    status: "dnd",
  });
});

client.login(token);
