# 🏟️ OndeTem - Sistema de Locação de Quadras

<div align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.0.0-blue?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/Vite-4.4.0-purple?style=for-the-badge&logo=vite" />
  <img src="https://img.shields.io/badge/Tailwind-3.3.0-cyan?style=for-the-badge&logo=tailwindcss" />
</div>

## 📱 Sobre o Projeto

O **OndeTem** é um aplicativo web completo para locação de quadras esportivas, desenvolvido com React e TypeScript. O sistema permite que usuários encontrem, avaliem e reservem quadras próximas, enquanto administradores gerenciam suas quadras e horários de funcionamento.

## ✨ Funcionalidades

### 👤 Para Usuários
- **🗺️ Mapa interativo** com quadras próximas e filtros por esporte/comodidades
- **👤 Perfil personalizado** com foto de avatar
- **📅 Sistema de reservas** flexível (1h a 4h, apenas horas inteiras)
- **⭐ Avaliações** nas quadras (com comentário opcional)
- **📋 Histórico de reservas** completo
- **💬 Chat** com administradores
- **📍 Geolocalização** automática

### 🔧 Para Administradores
- **⚙️ Painel administrativo** completo
- **🏟️ Gerenciamento de quadras** (CRUD completo)
- **💰 Sistema de pagamento PIX** para reservas
- **⏰ Horários de funcionamento** por quadra
- **💬 Sistema de chat** com usuários
- **📊 Visualização de horários** com status das reservas (pendentes, confirmadas, canceladas)
- **📸 Upload de fotos** via Cloudinary

## 🚀 Tecnologias Utilizadas

- **React 18.2.0** - Framework principal
- **TypeScript 5.0.0** - Tipagem estática
- **Vite 4.4.0** - Build tool e dev server
- **Tailwind CSS 3.3.0** - Framework de estilização
- **Leaflet** - Mapas interativos
- **Lucide React** - Ícones modernos
- **Firebase** - Backend (Authentication, Firestore, Storage)

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

# Configurar Firebase (veja seção abaixo)
# Copie config/firebase.config.example.ts para config/firebase.config.ts
# e preencha com suas credenciais do Firebase

# Executar projeto
npm run dev
```

### Acessar
Abra [http://localhost:5173](http://localhost:5173) no navegador

## 🔥 Configuração do Firebase

Este projeto usa Firebase para autenticação e persistência de dados. **É necessário configurar o Firebase antes de usar o aplicativo.**

### Passos para Configurar:

1. **Criar projeto no Firebase**
   - Acesse [Firebase Console](https://console.firebase.google.com/)
   - Crie um novo projeto ou use um existente

2. **Configurar Authentication**
   - No Firebase Console, vá em **Authentication**
   - Habilite o método **Email/Password**

3. **Configurar Firestore Database**
   - Vá em **Firestore Database**
   - Crie o banco de dados
   - Configure as regras de segurança (veja `config/README.md`)

4. **Obter credenciais**
   - Vá em **Configurações do projeto** → **Seus aplicativos**
   - Adicione um app Web
   - Copie as credenciais

5. **Configurar arquivo local**
   ```bash
   # Copiar arquivo de exemplo
   cp config/firebase.config.example.ts config/firebase.config.ts
   
   # Editar config/firebase.config.ts e preencher com suas credenciais
   ```

**⚠️ IMPORTANTE:** O arquivo `config/firebase.config.ts` está no `.gitignore` e **NÃO será commitado no Git**. Nunca compartilhe suas credenciais publicamente.

Para mais detalhes, consulte `config/README.md`.

## 📸 Configuração do Cloudinary (Upload de Imagens)

Este projeto usa **Cloudinary** para armazenar imagens de quadras e fotos de perfil. É gratuito e fácil de configurar!

### Passos Rápidos:

1. **Criar conta gratuita** em [cloudinary.com](https://cloudinary.com/users/register/free)
2. **Obter Cloud Name** do dashboard
3. **Criar Upload Preset** (modo Unsigned)
4. **Configurar** `config/cloudinary.config.ts` com suas credenciais

Para instruções detalhadas, consulte `config/CLOUDINARY_SETUP.md`.

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
