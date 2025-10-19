import { User, Quadra, Review, Booking, Chat } from '../types';

class StorageService {
  private getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  }

  // Usuários
  getUsers(): User[] {
    return this.getItem<User[]>('users') || [];
  }

  saveUsers(users: User[]): void {
    this.setItem('users', users);
  }

  getCurrentUser(): User | null {
    return this.getItem<User>('currentUser');
  }

  setCurrentUser(user: User | null): void {
    this.setItem('currentUser', user);
  }

  // Quadras
  getQuadras(): Quadra[] {
    return this.getItem<Quadra[]>('quadras') || [];
  }

  saveQuadras(quadras: Quadra[]): void {
    this.setItem('quadras', quadras);
  }

  getQuadraById(id: string): Quadra | null {
    try {
      const quadras = this.getQuadras();
      const quadra = quadras.find(q => q.id === id);
      
      if (!quadra) {
        console.log('Quadra não encontrada com ID:', id);
        return null;
      }
      
      // Se a quadra não tem operatingHours, retornar como está
      // O componente vai lidar com isso
      return quadra;
    } catch (error) {
      console.error('Erro ao buscar quadra por ID:', error);
      return null;
    }
  }

  // Reviews
  getReviews(): Review[] {
    return this.getItem<Review[]>('reviews') || [];
  }

  saveReviews(reviews: Review[]): void {
    this.setItem('reviews', reviews);
  }

  // Reservas
  getBookings(): Booking[] {
    return this.getItem<Booking[]>('bookings') || [];
  }

  saveBookings(bookings: Booking[]): void {
    this.setItem('bookings', bookings);
  }


  // Chat
  getChats(): Chat[] {
    return this.getItem<Chat[]>('chats') || [];
  }

  saveChats(chats: Chat[]): void {
    this.setItem('chats', chats);
  }

  getChatByUserId(userId: string): Chat | null {
    const chats = this.getChats();
    return chats.find(chat => chat.userId === userId) || null;
  }

  getChatById(chatId: string): Chat | null {
    const chats = this.getChats();
    return chats.find(chat => chat.id === chatId) || null;
  }

  // Inicializar dados de exemplo
  initializeData(): void {
    if (!this.getUsers().length) {
      const initialUsers: User[] = [
        {
          id: '1',
          name: 'Admin',
          email: 'admin@ondetem.com',
          role: 'admin'
        },
        {
          id: '2',
          name: 'João Silva',
          email: 'joao@email.com',
          role: 'user'
        }
      ];
      this.saveUsers(initialUsers);
    }

    if (!this.getQuadras().length) {
      const initialQuadras: Quadra[] = [
        {
          id: '1',
          name: 'Quadra do Parque Central',
          description: 'Quadra de futebol society com gramado sintético',
          address: 'Parque Central, Centro',
          coordinates: { lat: -23.5505, lng: -46.6333 },
          price: 80,
          photos: [],
          rating: 4.5,
          reviews: [],
          amenities: ['Gramado sintético', 'Vestiários', 'Estacionamento'],
          ownerId: '1',
          isActive: true,
          operatingHours: {
            monday: { open: '08:00', close: '22:00', isOpen: true },
            tuesday: { open: '08:00', close: '22:00', isOpen: true },
            wednesday: { open: '08:00', close: '22:00', isOpen: true },
            thursday: { open: '08:00', close: '22:00', isOpen: true },
            friday: { open: '08:00', close: '22:00', isOpen: true },
            saturday: { open: '08:00', close: '22:00', isOpen: true },
            sunday: { open: '08:00', close: '22:00', isOpen: true }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Campo do Bairro',
          description: 'Campo de futebol com gramado natural',
          address: 'Rua das Flores, 123',
          coordinates: { lat: -23.5515, lng: -46.6343 },
          price: 60,
          photos: [],
          rating: 4.2,
          reviews: [],
          amenities: ['Gramado natural', 'Iluminação'],
          ownerId: '1',
          isActive: true,
          operatingHours: {
            monday: { open: '08:00', close: '22:00', isOpen: true },
            tuesday: { open: '08:00', close: '22:00', isOpen: true },
            wednesday: { open: '08:00', close: '22:00', isOpen: true },
            thursday: { open: '08:00', close: '22:00', isOpen: true },
            friday: { open: '08:00', close: '22:00', isOpen: true },
            saturday: { open: '08:00', close: '22:00', isOpen: true },
            sunday: { open: '08:00', close: '22:00', isOpen: true }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      this.saveQuadras(initialQuadras);
    }
  }
}

export const storageService = new StorageService();
