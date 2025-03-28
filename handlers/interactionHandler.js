// File: handlers/interactionHandler.js
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
} = require("discord.js");
const {
  ticketCategory,
  roleSupport,
  ticketNamePrefix,
} = require("../config.js");
const { getOrCreateKhoTicketCategory } = require("./categoryHandler");

module.exports = async (interaction) => {
  const user = interaction.user;
  const channel = interaction.channel;
  const member = await interaction.guild.members.fetch(user.id);
  const ticketOwnerId = channel.topic;

  if (interaction.isButton()) {
    if (
      interaction.customId === "buy_ticket" ||
      interaction.customId === "support_ticket"
    ) {
      const modal = new ModalBuilder()
        .setCustomId(`ticket_reason_${interaction.customId}`) // Lưu ID nút
        .setTitle("Ma Đạo Store");

      const reasonInput = new TextInputBuilder()
        .setCustomId("reason_input")
        .setLabel("Mô tả / Lý do tạo ticket")
        .setPlaceholder("Nhập mô tả sản phẩm hoặc lý do ticket")
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(5)
        .setMaxLength(150);

      const actionRow = new ActionRowBuilder().addComponents(reasonInput);
      modal.addComponents(actionRow);

      await interaction.showModal(modal);
    } else if (interaction.customId === "lock_ticket") {
      if (!member.roles.cache.has(roleSupport)) {
        return interaction.reply({
          content: "❌ Bạn không có quyền sử dụng chức năng này!",
          ephemeral: true,
        });
      }
      await channel.permissionOverwrites.edit(ticketOwnerId, {
        ViewChannel: false,
      });
      await interaction.update({
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("unlock_ticket")
              .setLabel("🔓 Mở Khoá")
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId("close_ticket")
              .setLabel("❌ Đóng Ticket")
              .setStyle(ButtonStyle.Secondary)
          ),
        ],
      });
    } else if (interaction.customId === "unlock_ticket") {
      if (!member.roles.cache.has(roleSupport)) {
        return interaction.reply({
          content: "❌ Bạn không có quyền sử dụng chức năng này!",
          ephemeral: true,
        });
      }
      await channel.permissionOverwrites.edit(ticketOwnerId, {
        ViewChannel: true,
      });
      await interaction.update({
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("lock_ticket")
              .setLabel("🔒 Khoá Ticket")
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId("close_ticket")
              .setLabel("❌ Đóng Ticket")
              .setStyle(ButtonStyle.Secondary)
          ),
        ],
      });
    } else if (interaction.customId === "close_ticket") {
      if (!member.roles.cache.has(roleSupport)) {
        return interaction.reply({
          content: "❌ Bạn không có quyền sử dụng chức năng này!",
          ephemeral: true,
        });
      }

      try {
        const khoTicketCategory = await getOrCreateKhoTicketCategory(
          interaction.guild
        );

        await interaction.channel.setParent(khoTicketCategory);
        await interaction.reply({
          content: "🔒 Ticket này đã được đóng và di chuyển vào kho lưu trữ!",
          ephemeral: true,
        });
      } catch (error) {
        console.error("Lỗi:", error);
        await interaction.reply({
          content: "Lỗi: " + error.message,
          ephemeral: true,
        });
      }
    }
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith("ticket_reason_")) {
      const reason = interaction.fields.getTextInputValue("reason_input");
      const guild = interaction.guild;
      const ticketType =
        interaction.customId === "ticket_reason_buy_ticket"
          ? "Mua hàng"
          : "Hỗ trợ / Bảo hành";

      const ticketChannel = await guild.channels.create({
        name: `${ticketNamePrefix}${interaction.user.username}`,
        type: 0, // ChannelType.GuildText
        parent: ticketCategory,
        topic: user.id,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.AttachFiles,
            ],
          },
          {
            id: roleSupport,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
            ],
          },
        ],
      });

      const embed = new EmbedBuilder()
        .setTitle("Ma Đạo Store Ticket")
        .setDescription(`\n\u200B**📌 Mô tả : ${reason}**\n\u200B`) // \u200B là khoảng trống giúp tạo khoảng cách
        .setColor("#FF9900")
        .setImage(
          "https://media.discordapp.net/attachments/1333290953842233354/1343213717306736640/GIF_UPDATE.gif"
        )
        .addFields(
          { name: "👤 Người tạo", value: `<@${user.id}>`, inline: true },
          { name: "✨ Loại ticket", value: ticketType, inline: true },
          {
            name: "🕛 Thời gian tạo",
            value: new Date().toLocaleString("vi-VN", {
              timeZone: "Asia/Ho_Chi_Minh",
            }),
            inline: true,
          }
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("lock_ticket")
          .setLabel("Khoá Ticket")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("Đóng Ticket")
          .setStyle(ButtonStyle.Secondary)
      );

      await ticketChannel.send({
        content: `<@&${roleSupport}> | Ticket của <@${user.id}>`,
        embeds: [embed],
        components: [row],
      });
      await interaction.reply({
        content: `✅ Ticket của bạn đã được tạo tại ${ticketChannel}`,
        ephemeral: true,
      });
    }
  } else {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.deferReply({ ephemeral: true });
    }
    return;
  }
};
