# Ma Đạo Ticket - Discord Bot

Ma Đạo Store Ticket Bot là bot hỗ trợ quản lý ticket trên Discord, giúp người dùng tạo ticket nhanh chóng để mua hàng hoặc yêu cầu hỗ trợ.

## 🚀 Tính năng

- Hiển thị embed giới thiệu về ticket với các nút bấm tạo ticket.
- Người dùng có thể chọn loại ticket (Mua hàng / Hỗ trợ - Bảo hành).
- Sau khi nhập lý do, bot sẽ tạo một kênh riêng để quản lý ticket.
- Nhân viên có thể khóa/mở khóa ticket hoặc đóng ticket khi cần.
- Ticket sau khi đóng sẽ được chuyển vào mục lưu trữ.

## 📌 Cách cài đặt

### 1️⃣ Clone repo về máy:

```sh
git clone https://github.com/TRIBUI106/MaDao-Ticket-NodeJS.git
cd MaDao-Ticket-NodeJS
```

### 2️⃣ Cài đặt dependencies:

```sh
npm install
```

### 3️⃣ Cấu hình bot:

Chỉnh sửa file `config.js` với thông tin phù hợp:

```js
module.exports = {
  token: "YOUR_BOT_TOKEN",
  roleSupport: "ROLE_ID_HERE",
  ticketCategory: "CATEGORY_ID_HERE",
};
```

### 4️⃣ Chạy bot:

```sh
npm run dev
```

## 🛠 Công nghệ sử dụng

- [Node.js](https://nodejs.org/)
- [discord.js](https://discord.js.org/)
- [Nodemon](https://www.npmjs.com/package/nodemon) (Hỗ trợ reload khi code thay đổi)

## 📝 Đóng góp

Mọi đóng góp đều được hoan nghênh! Nếu bạn có ý tưởng hoặc lỗi cần báo cáo, hãy tạo issue hoặc gửi pull request.

## 📜 Giấy phép

Dự án này được cấp phép theo [MIT License](LICENSE).

## 💻 Lập trình viên :
- chez1s
- Xio279

---

❤️ Được tạo bởi Ma Đạo Store Developer Team.
