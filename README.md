<div align="center">
  <img src="public/logo.png" alt="LockifyZ Logo" width="120" height="120" />
  <h1>LockifyZ</h1>
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

**LockifyZ** is a premium, beautifully designed digital vault for securely storing and managing your passwords and credit cards. Built with modern web technologies and a mobile-first approach, it features a glassmorphism UI, smooth micro-animations, and PWA capabilities—ensuring your sensitive data is always accessible and secured with military-grade encryption.

## ✨ Features

- **🔐 End-to-End Encryption:** Your passwords and cards are encrypted securely before storing them in the database.
- **📱 Mobile-First Design:** Fully responsive, native-like mobile experience with bottom navigation and touch-friendly UI.
- **🎨 Premium UI/UX:** Dark mode by default, glassmorphism elements, dynamic glowing effects, and smooth animations.
- **🌐 Progressive Web App (PWA):** Install LockifyZ on your home screen for offline access and native app feel.
- **💳 Card & Password Management:** Easily view, add, edit, and delete your credentials.
- **🖼️ Profile Customization:** Custom avatars with ImgBB integration.

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
git clone https://github.com/muhammadsaif7717/passgrid.git
cd passgrid
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

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/muhammadsaif7717/passgrid/issues).

---

<div align="center">
  Built with ❤️ using Next.js & TailwindCSS
</div>
