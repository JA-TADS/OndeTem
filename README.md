# 🏟️ OndeTem  
### Sistema de Locação de Quadras Esportivas

<div align="center">

![React](https://img.shields.io/badge/React-18.2.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0.0-blue?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-4.4.0-purple?style=for-the-badge&logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-3.3.0-cyan?style=for-the-badge&logo=tailwindcss)

</div>

---

## 📌 Sobre o Projeto

O **OndeTem** é uma aplicação web desenvolvida para facilitar a **busca, reserva e gerenciamento de quadras esportivas**.

A plataforma conecta:
- 👤 **Usuários**, que buscam e reservam quadras  
- 🔧 **Administradores**, que gerenciam horários, quadras e reservas  

Tudo isso com uma experiência moderna, intuitiva e responsiva.

---

## 🖼️ Demonstração

### 🏠 Tela Inicial
![Tela Inicial](https://github.com/user-attachments/assets/4a382de6-ed27-4aeb-9177-827b087fb4f1)

### ✅ Check-in
![Check-in](https://github.com/user-attachments/assets/914bc23a-2cc4-43f7-b1ae-a70a783a3163)

### ⚙️ Painel Administrativo
![Painel](https://github.com/user-attachments/assets/2a873af1-003c-4e62-837e-a950d2f6f21e)

### 👤 Área do Usuário
![Usuário](https://github.com/user-attachments/assets/50c97fe4-eb0e-41f2-9d4d-0abc324b0c5d)

---

## ✨ Funcionalidades

### 👤 Usuários
- 🗺️ Mapa interativo com quadras próximas  
- 📅 Sistema de reservas (1h a 4h)  
- ⭐ Avaliações com comentários  
- 📋 Histórico de reservas  
- 💬 Chat com administradores  
- 📍 Geolocalização automática  
- 👤 Perfil com avatar  

### 🔧 Administradores
- ⚙️ Painel administrativo completo  
- 🏟️ CRUD de quadras  
- 💰 Pagamentos via PIX  
- ⏰ Gestão de horários  
- 📊 Status de reservas (pendente, confirmado, cancelado)  
- 💬 Chat com usuários  
- 📸 Upload de imagens (Cloudinary)  

---

## 🚀 Tecnologias Utilizadas

- **React 18** — Interface e componentes  
- **TypeScript** — Tipagem estática  
- **Vite** — Build e desenvolvimento rápido  
- **Tailwind CSS** — Estilização moderna  
- **Leaflet** — Mapas interativos  
- **Lucide React** — Ícones  
- **Firebase** — Backend (Auth, Firestore, Storage)  
- **Cloudinary** — Upload de imagens  

---

## 🛠️ Como Executar o Projeto

### 📋 Pré-requisitos
- Node.js 16+
- npm ou yarn

### ▶️ Instalação

```bash
# Clone o repositório
git clone https://github.com/JA-TADS/OndeTem.git

# Acesse a pasta
cd OndeTem

# Instale as dependências
npm install

# Execute o projeto
npm run dev
```

🌐 Acesso

Abra no navegador:

http://localhost:5173

🔥 Configuração do Firebase

Este projeto utiliza o Firebase como backend.

Passos:
Acesse o Firebase Console
Crie um projeto
Ative:
Authentication (Email/Password)
Firestore Database
Gere as credenciais
Configuração local:
cp config/firebase.config.example.ts config/firebase.config.ts

Edite o arquivo com suas credenciais.

⚠️ Importante: Nunca suba esse arquivo para o GitHub.

📸 Configuração do Cloudinary

Para upload de imagens:

Crie conta em: https://cloudinary.com
Copie seu Cloud Name
Crie um Upload Preset (Unsigned)
Configure em:
config/cloudinary.config.ts

📁 Estrutura do Projeto
```
src/
├── components/
│   ├── AdminPanel.tsx
│   ├── MapView.tsx
│   ├── ProfilePage.tsx
│   └── ...
├── contexts/
│   └── AuthContext.tsx
├── services/
│   └── storage.ts
├── types/
│   └── index.ts
└── App.tsx
```

📱 Responsividade
💻 Layout adaptado para desktop
📱 Interface otimizada para mobile
🎯 Navegação fluida e intuitiva
🎯 Diferenciais do Projeto

- Integração completa com mapa (geolocalização)
- Sistema real de reservas
- Comunicação em tempo real (chat)
- Arquitetura organizada com TypeScript
- Backend serverless (Firebase)

📌 Melhorias Futuras

💳 Integração com gateway de pagamento (Stripe)
📲 Versão mobile (React Native)
🔔 Notificações em tempo real
📊 Dashboard analítico para admins
