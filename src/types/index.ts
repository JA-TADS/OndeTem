export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
}

export interface Quadra {
  id: string;
  name: string;
  description: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  price: number;
  photos: string[];
  rating: number;
  reviews: Review[];
  amenities: string[];
  ownerId: string;
  isActive: boolean;
  operatingHours: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  quadraId?: string; // Opcional para compatibilidade com Firebase
}

export interface Booking {
  id: string;
  quadraId: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface Chat {
  id: string;
  userId: string;
  userName: string;
  adminId: string;
  adminName: string;
  quadraId?: string;
  messages: ChatMessage[];
  lastMessage: string;
  lastMessageTime: string;
  isActive: boolean;
  createdAt: string;
}
