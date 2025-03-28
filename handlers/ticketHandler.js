const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = async (message) => {
  const embed = new EmbedBuilder()

    .setAuthor({
      name: "chez1s",
      iconURL:
        "https://cdn.discordapp.com/attachments/1345700208251502623/1345700267131146240/chez1s.jpg?ex=67c58089&is=67c42f09&hm=7d2d821fade351c7919caa3b8f78daed99f70670c2a00bc36efd1123a22db987&",
    })
    .setTitle("Hệ Thống Ticket Ma Đạo Store")
    .setDescription(
      "Nếu bạn cần mua hàng hoặc hỗ trợ bảo hành, vui lòng chọn nút bên dưới.\n**VUI LÒNG KHÔNG SPAM TICKET**"
    )
    .setColor("#FF9900")
    .setFooter({
      text: "Ma Đạo Store | Made With 💓",
      iconURL:
        "https://media.discordapp.net/attachments/1333290953842233354/1343213715490869392/GIF.gif?ex=67c50681&is=67c3b501&hm=2612722eafebfe2de76d0ddff914e31db3d2e6d2cdb36a09dbc337b04f10ae37&width=216&height=216&",
    })
    .setImage(
      "https://media.discordapp.net/attachments/1333290953842233354/1343213717306736640/GIF_UPDATE.gif"
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("buy_ticket")
      .setLabel("Mua hàng")
      .setEmoji("<:18419pengucheckmate:1344556787822497814>")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("support_ticket")
      .setLabel("Hỗ Trợ / Bảo Hành")
      .setEmoji("<:52305penguhmmthink:1344556802024673320>")
      .setStyle(ButtonStyle.Success)
  );

  await message.channel.send({ embeds: [embed], components: [row] });
};
