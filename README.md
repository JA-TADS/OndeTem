# 🏟️ OndeTem - Sistema de Locação de Quadras

<div align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.0.0-blue?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/Vite-4.4.0-purple?style=for-the-badge&logo=vite" />
  <img src="https://img.shields.io/badge/Tailwind-3.3.0-cyan?style=for-the-badge&logo=tailwindcss" />
</div>

## 📱 Sobre o Projeto

O **OndeTem** é um aplicativo web completo para locação de quadras esportivas, desenvolvido com React e TypeScript. O sistema permite que usuários encontrem, avaliem e reservem quadras próximas, enquanto administradores gerenciam suas quadras e confirmam reservas.

## ✨ Funcionalidades

### 👤 Para Usuários
- **🗺️ Mapa interativo** com quadras próximas
- **👤 Perfil personalizado** com foto de avatar
- **📅 Sistema de reservas** flexível (1h a 4h, incrementos de 30min)
- **⭐ Avaliações e comentários** nas quadras
- **📋 Histórico de reservas** completo
- **💬 Chat** com administradores

### 🔧 Para Administradores
- **⚙️ Painel administrativo** completo
- **🏟️ Gerenciamento de quadras** (CRUD completo)
- **✅ Confirmação de reservas** pendentes
- **⏰ Horários de funcionamento** por quadra
- **💬 Sistema de chat** com usuários
- **📊 Visualização de horários** com status das reservas

## 🚀 Tecnologias Utilizadas

- **React 18.2.0** - Framework principal
- **TypeScript 5.0.0** - Tipagem estática
- **Vite 4.4.0** - Build tool e dev server
- **Tailwind CSS 3.3.0** - Framework de estilização
- **Leaflet** - Mapas interativos
- **Lucide React** - Ícones modernos
- **LocalStorage** - Persistência de dados

## 🛠️ Como Executar

### Pré-requisitos
- Node.js 16+ instalado
- npm ou yarn

### Instalação
```bash
# Clonar repositório
git clone https://github.com/SEU_USUARIO/onde-tem-quadras.git

# Entrar na pasta
cd onde-tem-quadras

# Instalar dependências
npm install

# Executar projeto
npm run dev
```

### Acessar
Abra [http://localhost:5173](http://localhost:5173) no navegador

## 📊 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── AdminPanel.tsx   # Painel administrativo
│   ├── MapView.tsx      # Visualização do mapa
│   ├── ProfilePage.tsx  # Página de perfil
│   └── ...
├── contexts/            # Contextos React
│   └── AuthContext.tsx  # Autenticação
├── services/            # Serviços
│   └── storage.ts       # Persistência de dados
├── types/               # Tipos TypeScript
│   └── index.ts         # Interfaces
└── App.tsx              # Componente principal
```

## 🎨 Interface

### 🖥️ Desktop
- Layout responsivo com sidebar
- Grid de quadras organizado
- Modal de detalhes expandido

### 📱 Mobile
- Interface adaptada para touch
- Navegação otimizada
- Componentes compactos

---

<div align="center">
  <p>Feito com ❤️ usando React + TypeScript</p>
</div>
