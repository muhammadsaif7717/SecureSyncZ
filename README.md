<div align="center">
  <img src="public/logo.png" alt="SecureSyncZ Logo" width="120" height="120" />
  <h1>SecureSyncZ</h1>
  <p><strong>Secure Password & Credit Card Vault</strong></p>
  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#contributing">Contributing</a>
  </p>
</div>

---

## 🛡️ Overview

**SecureSyncZ** is a premium, beautifully designed digital vault for securely storing and managing your passwords and credit cards. Built with modern web technologies and a mobile-first approach, it features a glassmorphism UI, smooth micro-animations, and PWA capabilities—ensuring your sensitive data is always accessible and secured with military-grade encryption.

## ✨ Features

- **🔐 End-to-End Encryption:** Your passwords and cards are encrypted securely before storing them in the database.
- **🚀 Advanced Passkeys:** Skip traditional passwords with secure, lightning-fast 6-digit passkey authentication.
- **📱 Mobile-First Design:** Fully responsive, native-like mobile experience with bottom navigation and touch-friendly UI.
- **🎨 Premium UI/UX:** Dark mode by default, glassmorphism elements, dynamic glowing effects, and smooth animations.
- **🌐 Progressive Web App (PWA):** Install SecureSyncZ on your home screen for offline access and native app feel.
- **💳 Card & Password Management:** Easily view, add, edit, and delete your credentials.
- **🛡️ Password Health Dashboard:** Built-in dashboard to detect weak, reused, and old passwords to keep your vault secure.
- **📁 Organization & Quality of Life:** Add Tags/Categories to credentials, and pin your favorites to the top of your lists.
- **🔍 Global Search:** Instantly find your credentials from anywhere using the Cmd+K Command Palette.
- **🔒 AES Encrypted Backups:** Export your vault as an AES-256 encrypted JSON file using a custom Master Password, and import via Drag-and-Drop.
- **⏱️ Auto-Lock:** Automatically secures your vault after 3 minutes of inactivity.
- **🖼️ Profile Customization:** Custom avatars with quick file-size validation and ImgBB integration.

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database:** [MongoDB](https://www.mongodb.com/)
- **State/Fetching:** [React Query (@tanstack/react-query)](https://tanstack.com/query/latest)
- **Authentication:** Custom JWT-based Auth
- **Icons:** [Lucide React](https://lucide.dev/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)

## 🚀 Getting Started

Follow these steps to set up the project locally.

### 1. Clone the repository

```bash
git clone https://github.com/muhammadsaif7717/SecureSyncZ.git
cd SecureSyncZ
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory and add the following:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_32_byte_encryption_key
NEXT_PUBLIC_IMGBB_API_KEY=your_imgbb_api_key
```

> **Note:** The `ENCRYPTION_KEY` must be exactly 32 bytes (64 hex characters) for `aes-256-cbc` encryption.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 🤝 Contributing

Contributions, issues, and feature requests are very welcome!
Developers are highly encouraged to fork, customize this project further, and collaborate with me to make it even better.
Feel free to check the [issues page](https://github.com/muhammadsaif7717/SecureSyncZ/issues) to start contributing.

## 👨‍💻 Author / Credits

**MD. SAIF ISLAM**

- **Portfolio / Contact:** [developer-saif.vercel.app](https://developer-saif.vercel.app/)
- **GitHub:** [@muhammadsaif7717](https://github.com/muhammadsaif7717)

Feel free to reach out through my portfolio if you have any questions, feedback, or want to collaborate!

## 📄 License

This project is completely free to use. It is licensed under the MIT License—meaning anyone can use, modify, customize, and distribute this website without any cost. See the [LICENSE](LICENSE) file for the full legal details.

---

<div align="center">
  Built with ❤️ by <a href="https://developer-saif.vercel.app/">MD. SAIF ISLAM</a> using Next.js & TailwindCSS
</div>
