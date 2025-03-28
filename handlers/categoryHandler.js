const { PermissionsBitField, ChannelType } = require("discord.js");

async function getOrCreateKhoTicketCategory(guild) {
  const today = new Date();
  const formattedDate = `${today.getDate()}-${today.getMonth() + 1}`;
  const categoryName = `Kho Ticket Từ ${formattedDate}`;

  // Tìm category có tên đúng format
  const categories = guild.channels.cache.filter(
    (c) =>
      c.type === ChannelType.GuildCategory &&
      c.name.startsWith("Kho Ticket Từ ")
  );

  // Kiểm tra xem có category nào chưa đầy không
  let availableCategory = categories.find(
    (cat) =>
      guild.channels.cache.filter((ch) => ch.parentId === cat.id).size < 50
  );

  // Nếu không có category trống, tạo mới
  if (!availableCategory) {
    availableCategory = await guild.channels.create({
      name: categoryName,
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
      ],
    });
  }

  return availableCategory.id;
}

module.exports = { getOrCreateKhoTicketCategory };
