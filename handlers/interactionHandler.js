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
        const member = await fetchMember();
        if (!roleSupport.some((roleId) => member.roles.cache.has(roleId))) {
          return interaction.reply({
            content: "❌ Bạn không có quyền sử dụng chức năng này!",
            flags: 64,
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
            },
            { name: "📌 Channel", value: `<#${channel.id}>`, inline: true }
          )
          .setImage(
            "https://media.discordapp.net/attachments/1333290953842233354/1343213717306736640/GIF_UPDATE.gif?ex=67c26381&is=67c11201&hm=34e74c8499bd10d38dabecca15e545d1f766ef19f46e435f6efb44ddf7cee587&=&width=703&height=396"
          )
          .setFooter({
            text: "MDS | Made With 💓",
            iconURL:
              "https://media.discordapp.net/attachments/1333290953842233354/1343213715490869392/GIF.gif?ex=67c26381&is=67c11201&hm=3cae06abd49e8032362fa81e4ca8391735f06a236d450826f100dce95cd88aa4&=&width=216&height=216",
          })
          .setTimestamp();

        // Kiểm tra channel và guild trước khi thực hiện
        if (!interaction.guild || !channel) {
          console.error(
            `Lỗi: Guild hoặc channel không tồn tại cho ticket ${
              channel?.name || "unknown"
            }`
          );
          return interaction.reply({
            content:
              "❌ Lỗi: Không tìm thấy guild hoặc channel. Vui lòng thử lại!",
            flags: 64,
          });
        }

        // Kiểm tra số lượng kênh trong closedTicketCategory
        let closedCategory;
        try {
          closedCategory = await interaction.guild.channels.fetch(
            closedTicketCategory,
            { cache: false }
          );
          if (!closedCategory || closedCategory.type !== 4) {
            throw new Error("Category không hợp lệ hoặc không tồn tại");
          }
        } catch (error) {
          console.error(
            `Lỗi khi fetch closedTicketCategory (${closedTicketCategory}): ${error.message}`
          );
          return interaction.reply({
            content: "❌ Lỗi: Không tìm thấy danh mục lưu trữ ticket!",
            flags: 64,
          });
        }

        const channelCount = closedCategory.children.cache.size;

        if (channelCount >= 50) {
          try {
            const guild = interaction.guild;
            const date = new Date().toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              timeZone: "Asia/Ho_Chi_Minh",
            });

            // Tạo embed thông báo kho đầy
            const warningEmbed = new EmbedBuilder()
              .setTitle("⚠️ Cảnh Báo: Category Ticket Đã Đầy")
              .setDescription(
                `Category **${closedCategory.name}** đã đạt giới hạn 50 kênh. Một category mới sẽ được tạo và bot sẽ restart.`
              )
              .setColor("#FF0000")
              .addFields(
                { name: "Guild", value: guild.name, inline: true },
                { name: "Thời gian", value: date, inline: true }
              )
              .setThumbnail(
                guild.iconURL() ||
                  "https://media.discordapp.net/attachments/1333290953842233354/1343213717306736640/GIF_UPDATE.gif?ex=67c26381&is=67c11201&hm=34e74c8499bd10d38dabecca15e545d1f766ef19f46e435f6efb44ddf7cee587&=&width=703&height=396"
              )
              .setFooter({
                text: "MDS | Made With 💓",
                iconURL:
                  "https://media.discordapp.net/attachments/1333290953842233354/1343213715490869392/GIF.gif?ex=67c26381&is=67c11201&hm=3cae06abd49e8032362fa81e4ca8391735f06a236d450826f100dce95cd88aa4&=&width=216&height=216",
              })
              .setTimestamp();

            // Gửi embed tới ownerId
            let owner;
            try {
              owner = await interaction.client.users.fetch(ownerId, {
                cache: false,
              });
              await owner.send({ embeds: [warningEmbed] });
            } catch (error) {
              console.error(
                `Không thể gửi DM tới owner (${ownerId}): ${error.message}`
              );
            }

            // Tạo category mới với retry
            let newCategory;
            let retryCount = 0;
            const maxRetries = 2;
            while (retryCount <= maxRetries) {
              try {
                newCategory = await guild.channels.create({
                  name: `Kho ticket từ ${date}`,
                  type: 4, // GuildCategory
                  permissionOverwrites: [
                    {
                      id: guild.id,
                      deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                  ],
                });
                break;
              } catch (error) {
                retryCount++;
                if (retryCount > maxRetries) {
                  throw new Error(`Lỗi tạo category mới: ${error.message}`);
                }
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }
            }

            // Ghi file config.js với ID category mới
            try {
              const configPath = "./config.js";
              const configContent = await fs.readFile(configPath, "utf8");
              const updatedConfig = configContent.replace(
                /closedTicketCategory: "\d+"/,
                `closedTicketCategory: "${newCategory.id}"`
              );
              await fs.writeFile(configPath, updatedConfig);
            } catch (error) {
              console.error(`Lỗi khi ghi config.js: ${error.message}`);
              throw error;
            }

            // Retry mechanism để set permission
            retryCount = 0;
            let success = false;
            while (retryCount <= maxRetries && !success) {
              try {
                await channel.permissionOverwrites.set(
                  [
                    {
                      id: guild.id,
                      deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                  ],
                  { timeout: 5000 }
                );
                success = true;
              } catch (error) {
                retryCount++;
                if (retryCount > maxRetries) {
                  throw new Error(`Lỗi set permission: ${error.message}`);
                }
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }
            }

            // Di chuyển ticket và gửi embed
            await channel.send({ embeds: [closeEmbed] });
            await channel.setParent(newCategory.id, { lockPermissions: false });
            await interaction.reply({
              content: "🔒 Ticket đã được đóng và di chuyển vào kho mới!",
              flags: 64,
            });

            // Log sự kiện
            console.log(
              `Ticket ${channel.name} đã được đóng và di chuyển vào category mới ${newCategory.name} bởi ${user.tag}`
            );

            // Chủ động restart bot
            process.exit(0);
          } catch (error) {
            console.error(
              `Lỗi khi xử lý đóng ticket ${channel.name}: ${error.message}`
            );
            await interaction.reply({
              content: `❌ Có lỗi xảy ra khi đóng ticket: ${error.message}. Vui lòng thử lại!`,
              flags: 64,
            });
          }
        } else {
          // Retry mechanism để set permission
          let retryCount = 0;
          const maxRetries = 2;
          let success = false;
          while (retryCount <= maxRetries && !success) {
            try {
              await channel.permissionOverwrites.set(
                [
                  {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                  },
                ],
                { timeout: 5000 }
              );
              success = true;
            } catch (error) {
              retryCount++;
              if (retryCount > maxRetries) {
                throw new Error(`Lỗi set permission: ${error.message}`);
              }
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }

          // Di chuyển ticket và gửi embed
          await channel.send({ embeds: [closeEmbed] });
          await channel.setParent(closedTicketCategory, {
            lockPermissions: false,
          });
          await interaction.reply({
            content: "🔒 Ticket đã được đóng và di chuyển vào lưu trữ!",
            flags: 64,
          });

          // Log sự kiện
          console.log(`Ticket ${channel.name} đã được đóng bởi ${user.tag}`);
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
