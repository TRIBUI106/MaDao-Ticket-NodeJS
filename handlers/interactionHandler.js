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
  closedTicketCategory,
  ticketCategory,
  roleSupport,
  ownerId,
} = require("../config.js");
const fs = require("fs").promises;

module.exports = async (interaction) => {
  const user = interaction.user;
  const channel = interaction.channel;

  // Fetch member chỉ khi cần
  const fetchMember = async () => {
    try {
      return await interaction.guild.members.fetch(user.id);
    } catch (error) {
      console.error(`Lỗi khi fetch member (${user.id}): ${error.message}`);
      throw error; // Ném lỗi để xử lý ở tầng trên
    }
  };

  if (interaction.isButton()) {
    try {
      // Xử lý nút "buy_ticket" hoặc "support_ticket"
      if (["buy_ticket", "support_ticket"].includes(interaction.customId)) {
        const modal = new ModalBuilder()
          .setCustomId("ticket_reason")
          .setTitle("Ma Đạo Ticket");

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
      }

      // Xử lý nút "lock_ticket"
      else if (interaction.customId === "lock_ticket") {
        const member = await fetchMember();
        if (!roleSupport.some((roleId) => member.roles.cache.has(roleId))) {
          return interaction.reply({
            content: "❌ Bạn không có quyền sử dụng chức năng này!",
            flags: 64,
          });
        }

        await channel.permissionOverwrites.edit(channel.topic, {
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
      }

      // Xử lý nút "unlock_ticket"
      else if (interaction.customId === "unlock_ticket") {
        const member = await fetchMember();
        if (!roleSupport.some((roleId) => member.roles.cache.has(roleId))) {
          return interaction.reply({
            content: "❌ Bạn không có quyền sử dụng chức năng này!",
            flags: 64,
          });
        }

        await channel.permissionOverwrites.edit(channel.topic, {
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
      }
  
      // Xử lý nút "close_ticket"
      else if (interaction.customId === "close_ticket") {
        await interaction.deferReply({ ephemeral: true }); // Defer để tránh interaction failed
        const member = await fetchMember();
        if (!roleSupport.some((roleId) => member.roles.cache.has(roleId))) {
          return interaction.editReply({
            content: "❌ Bạn không có quyền sử dụng chức năng này!",
          });
        }

        // Tạo embed thông báo đóng ticket
        const closeEmbed = new EmbedBuilder()
          .setTitle("🔒 Ticket Đã Được Đóng")
          .setDescription(
            "Ticket này đã được đóng và lưu trữ. Cảm ơn bạn đã sử dụng dịch vụ! 🎉"
          )
          .setColor("#FF9900")
          .addFields(
            { name: "👤 Người đóng", value: `<@${user.id}>`, inline: true },
            {
              name: "🕛 Thời gian",
              value: new Date().toLocaleString("vi-VN", {
                timeZone: "Asia/Ho_Chi_Minh",
              }),
              inline: true,
            }
          )
          .setFooter({
            text: "MDS | Made With 💓",
            iconURL:
              "https://media.discordapp.net/attachments/1333290953842233354/1343213715490869392/GIF.gif",
          });

        try {
          // Kiểm tra channel và guild
          if (!interaction.guild || !channel) {
            throw new Error("Guild hoặc channel không tồn tại");
          }

          // Fetch lại closedTicketCategory để tránh lỗi unknown channel
          let closedCategory;
          try {
            closedCategory = await interaction.guild.channels.fetch(
              closedTicketCategory,
              { cache: true, force: true }
            );
            if (!closedCategory || closedCategory.type !== 4) {
              throw new Error("Category không hợp lệ");
            }
          } catch (error) {
            console.error(
              `Lỗi fetch closedTicketCategory (${closedTicketCategory}): ${error.message}`
            );
            throw new Error("Không tìm thấy danh mục lưu trữ ticket");
          }

          // Kiểm tra số lượng kênh
          if (closedCategory.children.cache.size >= 50) {
            const guild = interaction.guild;
            const today = new Date();
            const day = today.getDate();
            const month = today.getMonth() + 1; // 6 cho tháng 6
            const dateStr = `Kho ticket từ ${day}/${month}`; // Format: Kho ticket từ 8/6

            // Tạo category mới
            const newCategory = await guild.channels.create({
              name: dateStr,
              type: 4,
              permissionOverwrites: [
                { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
              ],
            });

            // Cập nhật config.js
            const configPath = "./config.js";
            const configContent = await fs.readFile(configPath, "utf8");
            const updatedConfig = configContent.replace(
              /closedTicketCategory: "\d+"/,
              `closedTicketCategory: "${newCategory.id}"`
            );
            await fs.writeFile(configPath, updatedConfig);

            // Set permission và di chuyển ticket
            await channel.permissionOverwrites.set([
              { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            ]);
            await channel.send({ embeds: [closeEmbed] });
            await channel.setParent(newCategory.id);
            await interaction.editReply({
              content: "🔒 Ticket đã được đóng và di chuyển vào kho mới!",
            });

            console.log(
              `Ticket ${channel.name} đóng, di chuyển vào ${newCategory.name} bởi ${user.tag}`
            );
            process.exit(0); // Restart bot
          } else {
            // Set permission và di chuyển ticket
            await channel.permissionOverwrites.set([
              {
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
              },
            ]);
            await channel.send({ embeds: [closeEmbed] });
            await channel.setParent(closedTicketCategory);
            await interaction.editReply({
              content: "🔒 Ticket đã được đóng và di chuyển vào lưu trữ!",
            });

            console.log(`Ticket ${channel.name} đóng bởi ${user.tag}`);
          }
        } catch (error) {
          console.error(`Lỗi đóng ticket ${channel.name}: ${error.message}`);
          await interaction.editReply({
            content: `❌ Lỗi: ${error.message}. Thử lại sau!`,
          });
        }
      }
    } catch (error) {
      console.error(`Lỗi khi xử lý button interaction: ${error.message}`);
      await interaction
        .reply({
          content: "❌ Có lỗi xảy ra khi xử lý. Vui lòng thử lại!",
          flags: 64,
        })
        .catch((err) => console.error(`Lỗi khi reply lỗi: ${err.message}`));
    }
  }

  // Xử lý modal submit
  else if (
    interaction.isModalSubmit() &&
    interaction.customId === "ticket_reason"
  ) {
    try {
      const reason = interaction.fields.getTextInputValue("reason_input");
      const guild = interaction.guild;
      const ticketType = interaction.customId.includes("buy_ticket")
        ? "Mua hàng"
        : "Hỗ trợ / Bảo hành";

      // Cấu hình quyền cho channel
      const permissionOverwrites = [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        {
          id: user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.AttachFiles,
          ],
        },
        ...roleSupport.map((roleId) => ({
          id: roleId,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
          ],
        })),
      ];

      // Tạo ticket channel
      const ticketChannel = await guild.channels.create({
        name: `💌┃${user.username}`,
        type: 0, // GuildText
        parent: ticketCategory,
        topic: user.id,
        permissionOverwrites,
      });

      // Tạo embed
      const embed = new EmbedBuilder()
        .setTitle("MDS Ticket")
        .setDescription(`\n\u200B**📌 Mô tả: ${reason}**\n\u200B`)
        .setColor("#FF9900")
        .setImage(
          "https://media.discordapp.net/attachments/1333290953842233354/1343213717306736640/GIF_UPDATE.gif?ex=67c26381&is=67c11201&hm=34e74c8499bd10d38dabecca15e545d1f766ef19f46e435f6efb44ddf7cee587&=&width=703&height=396"
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

      // Tạo nút
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

      // Gửi thông báo ticket
      const roleMentions = roleSupport
        .map((roleId) => `<@&${roleId}>`)
        .join(" ");
      await ticketChannel.send({
        content: `${roleMentions} | Ticket của <@${user.id}>`,
        embeds: [embed],
        components: [row],
      });

      // Phản hồi người dùng
      await interaction.reply({
        content: `✅ Ticket của bạn đã được tạo tại ${ticketChannel}`,
        flags: 64,
      });
    } catch (error) {
      console.error(`Lỗi khi xử lý modal submit: ${error.message}`);
      await interaction
        .reply({
          content: "❌ Có lỗi xảy ra khi tạo ticket. Vui lòng thử lại!",
          flags: 64,
        })
        .catch((err) => console.error(`Lỗi khi reply lỗi: ${err.message}`));
    }
  }
};
