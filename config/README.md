# Configuração do Firebase

## Como configurar o Firebase no projeto

### 1. Criar projeto no Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto" ou selecione um projeto existente
3. Siga as instruções para criar/configurar o projeto

### 2. Obter as credenciais

1. No Firebase Console, vá em **Configurações do projeto** (ícone de engrenagem)
2. Role até a seção **Seus aplicativos**
3. Clique no ícone **Web** (`</>`) para adicionar um app web
4. Registre o app (pode usar qualquer nome)
5. Copie as credenciais do Firebase que aparecem

### 3. Configurar o arquivo de configuração

1. Copie o arquivo `firebase.config.example.ts` para `firebase.config.ts`:
   ```bash
   cp config/firebase.config.example.ts config/firebase.config.ts
   ```

2. Abra `config/firebase.config.ts` e preencha com suas credenciais:
   ```typescript
   export const firebaseConfig = {
     apiKey: "SUA_API_KEY_AQUI",
     authDomain: "seu-projeto.firebaseapp.com",
     projectId: "seu-projeto-id",
     storageBucket: "seu-projeto.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456"
   };
   ```

### 4. Configurar Firestore Database

1. No Firebase Console, vá em **Firestore Database**
2. Clique em **Criar banco de dados**
3. Escolha o modo de produção (ou teste para desenvolvimento)
4. Selecione a localização do banco de dados
5. Configure as regras de segurança (veja abaixo)

### 5. Configurar Authentication

1. No Firebase Console, vá em **Authentication**
2. Clique em **Começar**
3. Habilite o método **Email/Password**
4. Salve as alterações

### 6. Regras de Segurança do Firestore

Configure as regras de segurança no Firestore. Exemplo básico:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários - leitura própria, escrita própria
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Quadras - leitura pública, escrita apenas para admins
    // Permite atualização do campo rating para usuários autenticados
    match /quadras/{quadraId} {
      allow read: if true; 
      // Permitir atualização apenas do campo rating para usuários autenticados
      allow update: if request.auth != null && (
        // Usuários autenticados podem atualizar apenas rating e updatedAt
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['rating', 'updatedAt']) ||
        // Admins podem atualizar qualquer campo
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      // Criação e exclusão apenas para admins
      allow create, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Reviews - leitura pública, escrita autenticada
    match /reviews/{reviewId} {
      allow read: if true; // Permite leitura pública (sem autenticação)
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Bookings - leitura para usuários autenticados (necessário para verificar disponibilidade)
    // Escrita autenticada (criar/atualizar próprias reservas ou admin)
    match /bookings/{bookingId} {
      // Permitir leitura para todos os usuários autenticados
      // Isso é necessário para verificar disponibilidade de horários
      allow read: if request.auth != null;
      // Permitir criação para usuários autenticados
      allow create: if request.auth != null;
      // Permitir atualização apenas para o dono da reserva ou admin
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      // Permitir exclusão apenas para o dono da reserva ou admin
      allow delete: if request.auth != null && (
        request.auth.uid == resource.data.userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
    
    // Chats - leitura própria ou admin
    match /chats/{chatId} {
      allow read: if request.auth != null && (
        request.auth.uid == resource.data.userId ||
        request.auth.uid == resource.data.adminId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow write: if request.auth != null;
    }
  }
}
```

### 7. Estrutura de Dados

O Firestore terá as seguintes coleções:

- **users**: Dados dos usuários (id, name, email, role, avatar)
- **quadras**: Dados das quadras
- **reviews**: Avaliações das quadras
- **bookings**: Reservas
- **chats**: Conversas entre usuários e admins

### 8. Criar primeiro usuário admin

Após configurar tudo, você pode criar o primeiro usuário admin:

1. Use a página de registro do app (`/register`)
2. Selecione o tipo "Administrador"
3. Registre com email e senha
4. O usuário será criado no Firebase Authentication e no Firestore

### Importante

- O arquivo `config/firebase.config.ts` está no `.gitignore` e **NÃO será commitado no Git**
- Sempre use o arquivo de exemplo (`firebase.config.example.ts`) como referência
- Nunca compartilhe suas credenciais do Firebase publicamente

