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
		"https://media.discordapp.net/attachments/1333290953842233354/1343213715490869392/GIF.gif?ex=67c26381&is=67c11201&hm=3cae06abd49e8032362fa81e4ca8391735f06a236d450826f100dce95cd88aa4&=&width=216&height=216"
    })
    .setTitle("Ma Đạo Ticket System")
    .setDescription(
      "Nếu bạn cần mua hàng hoặc hỗ trợ bảo hành, vui lòng chọn nút bên dưới."
    )
    .setColor("#825121")
    .setFooter({
      text: "Ma Đạo Store | Made With 💓",
      iconURL:
        "https://media.discordapp.net/attachments/1333290953842233354/1343213715490869392/GIF.gif?ex=67c26381&is=67c11201&hm=3cae06abd49e8032362fa81e4ca8391735f06a236d450826f100dce95cd88aa4&=&width=216&height=216"
    })
    .setImage(
      "https://media.discordapp.net/attachments/1333290953842233354/1343213717306736640/GIF_UPDATE.gif?ex=67c26381&is=67c11201&hm=34e74c8499bd10d38dabecca15e545d1f766ef19f46e435f6efb44ddf7cee587&=&width=703&height=396"
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("buy_ticket")
      .setLabel("🛒 Mua hàng")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("support_ticket")
      .setLabel("🏦 Hỗ Trợ / Bảo Hành")
      .setStyle(ButtonStyle.Success)
  );

  await message.channel.send({ embeds: [embed], components: [row] });
};
