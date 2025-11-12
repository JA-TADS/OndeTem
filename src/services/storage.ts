import { User, Quadra, Review, Booking, Chat } from '../types';
import { firebaseService } from './firebase';

class StorageService {
  // Cache local para melhor performance
  private cache: {
    users?: User[];
    quadras?: Quadra[];
    reviews?: Review[];
    bookings?: Booking[];
    chats?: Chat[];
  } = {};

  // Usuários
  async getUsers(): Promise<User[]> {
    if (this.cache.users) {
      return this.cache.users;
    }
    this.cache.users = await firebaseService.getUsers();
    return this.cache.users;
  }

  async saveUsers(users: User[]): Promise<void> {
    this.cache.users = users;
    // Salvar cada usuário no Firebase
    for (const user of users) {
      await firebaseService.updateUser(user.id, user);
    }
  }

  getCurrentUser(): User | null {
    // Este método não é mais usado, pois o AuthContext gerencia o usuário atual
    // Mantido para compatibilidade
    return null;
  }

  setCurrentUser(_user: User | null): void {
    // Este método não é mais usado, pois o AuthContext gerencia o usuário atual
    // Mantido para compatibilidade
  }

  // Quadras
  async getQuadras(): Promise<Quadra[]> {
    if (this.cache.quadras) {
      return this.cache.quadras;
    }
    try {
      const quadras = await firebaseService.getQuadras();
      // Garantir que sempre retorne um array, mesmo se houver erro
      this.cache.quadras = Array.isArray(quadras) ? quadras : [];
      return this.cache.quadras;
    } catch (error) {
      console.error('Erro no storageService.getQuadras():', error);
      // Retornar array vazio em caso de erro
      this.cache.quadras = [];
      return [];
    }
  }

  async saveQuadras(quadras: Quadra[]): Promise<void> {
    this.cache.quadras = quadras;
    // Salvar cada quadra no Firebase individualmente
    // Isso garante que cada quadra seja atualizada separadamente
    for (const quadra of quadras) {
      try {
        await firebaseService.saveQuadra(quadra);
      } catch (error) {
        console.error(`Erro ao salvar quadra ${quadra.id}:`, error);
        // Continuar salvando outras quadras mesmo se uma falhar
      }
    }
  }

  async getQuadraById(id: string): Promise<Quadra | null> {
    try {
      const quadra = await firebaseService.getQuadraById(id);
      
      if (!quadra) {
        console.log('Quadra não encontrada com ID:', id);
        return null;
      }
      
      return quadra;
    } catch (error) {
      console.error('Erro ao buscar quadra por ID:', error);
      return null;
    }
  }

  // Reviews
  async getReviews(): Promise<Review[]> {
    if (this.cache.reviews) {
      return this.cache.reviews;
    }
    this.cache.reviews = await firebaseService.getReviews();
    return this.cache.reviews;
  }

  async saveReviews(reviews: Review[]): Promise<void> {
    this.cache.reviews = reviews;
    // Salvar cada review no Firebase
    for (const review of reviews) {
      await firebaseService.saveReview(review);
    }
  }

  // Reservas
  async getBookings(forceRefresh: boolean = false): Promise<Booking[]> {
    if (this.cache.bookings && !forceRefresh) {
      return this.cache.bookings;
    }
    this.cache.bookings = await firebaseService.getBookings();
    return this.cache.bookings;
  }

  async saveBookings(bookings: Booking[]): Promise<void> {
    this.cache.bookings = bookings;
    // Salvar cada booking no Firebase
    console.log('💾 Salvando', bookings.length, 'reservas no Firebase...');
    for (const booking of bookings) {
      try {
        await firebaseService.saveBooking(booking);
        console.log('✅ Reserva salva:', booking.id, '- Status:', booking.status);
      } catch (error) {
        console.error(`❌ Erro ao salvar reserva ${booking.id}:`, error);
        // Continuar salvando outras reservas mesmo se uma falhar
      }
    }
    console.log('✅ Todas as reservas foram processadas');
  }

  // Chat
  async getChats(): Promise<Chat[]> {
    if (this.cache.chats) {
      return this.cache.chats;
    }
    // Tentar buscar todos os chats (pode falhar por permissão)
    this.cache.chats = await firebaseService.getChats();
    return this.cache.chats;
  }

  async getChatsByUserId(userId: string): Promise<Chat[]> {
    // Buscar chats usando query específica que respeita as regras de permissão
    return await firebaseService.getChatsByUserId(userId);
  }

  async getChatsByAdminId(adminId: string): Promise<Chat[]> {
    // Buscar chats usando query específica que respeita as regras de permissão
    return await firebaseService.getChatsByAdminId(adminId);
  }

  async saveChats(chats: Chat[]): Promise<void> {
    this.cache.chats = chats;
    // Salvar cada chat no Firebase
    for (const chat of chats) {
      await firebaseService.saveChat(chat);
    }
  }

  async getChatByUserId(userId: string): Promise<Chat | null> {
    return await firebaseService.getChatByUserId(userId);
  }

  async getChatById(chatId: string): Promise<Chat | null> {
    return await firebaseService.getChatById(chatId);
  }

  // Atualizar cache de chats sem salvar no Firebase
  updateChatsCache(chats: Chat[]): void {
    this.cache.chats = chats;
  }

  async deleteChat(chatId: string): Promise<void> {
    // Deletar do Firebase
    await firebaseService.deleteChat(chatId);
    // Atualizar cache local
    if (this.cache.chats) {
      this.cache.chats = this.cache.chats.filter(chat => chat.id !== chatId);
    }
  }

  // Limpar cache
  clearCache(): void {
    this.cache = {};
  }

  // Inicializar dados de exemplo
  async initializeData(): Promise<void> {
    await firebaseService.initializeData();
  }
}

export const storageService = new StorageService();
