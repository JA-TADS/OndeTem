import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, Firestore, collection, doc, getDoc, setDoc, getDocs, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { firebaseConfig } from '../../config/firebase.config';
import { User, Quadra, Review, Booking, Chat } from '../types';

// Inicializar Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Função helper para remover campos undefined (Firestore não aceita undefined)
const removeUndefinedFields = (obj: any): any => {
  const cleaned: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
};

// Converter Firebase User para User do sistema
const convertFirebaseUserToUser = async (firebaseUser: FirebaseUser): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        id: firebaseUser.uid,
        name: userData.name || firebaseUser.displayName || '',
        email: firebaseUser.email || '',
        role: userData.role || 'user',
        avatar: userData.avatar || firebaseUser.photoURL || undefined
      };
    }
    return null;
  } catch (error) {
    console.error('Erro ao converter usuário:', error);
    return null;
  }
};

// Serviço de autenticação Firebase
export const firebaseAuth = {
  // Registrar novo usuário
  register: async (name: string, email: string, password: string, role: 'user' | 'admin'): Promise<User | null> => {
    try {
      console.log('Iniciando registro no Firebase Authentication...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('Usuário criado no Authentication:', firebaseUser.uid);

      // Criar documento do usuário no Firestore
      // Firestore não aceita undefined, então removemos campos undefined
      const userData: any = {
        name,
        email,
        role
      };
      // Não incluímos avatar se for undefined (Firestore não aceita undefined)

      console.log('Criando documento no Firestore...');
      // Remover campos undefined antes de salvar
      const cleanedUserData = removeUndefinedFields(userData);
      await setDoc(doc(db, 'users', firebaseUser.uid), cleanedUserData);
      console.log('Documento criado no Firestore com sucesso!');

      return {
        id: firebaseUser.uid,
        ...userData
      };
    } catch (error: any) {
      console.error('Erro ao registrar usuário:', error);
      console.error('Código do erro:', error.code);
      console.error('Mensagem do erro:', error.message);
      throw error;
    }
  },

  // Login
  login: async (email: string, password: string): Promise<User | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return await convertFirebaseUserToUser(userCredential.user);
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  },

  // Observar mudanças no estado de autenticação
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await convertFirebaseUserToUser(firebaseUser);
        callback(user);
      } else {
        callback(null);
      }
    });
  },

  // Obter usuário atual
  getCurrentUser: async (): Promise<User | null> => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      return await convertFirebaseUserToUser(firebaseUser);
    }
    return null;
  }
};

// Serviço de dados Firebase
export const firebaseService = {
  // ========== USUÁRIOS ==========
  getUsers: async (): Promise<User[]> => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      return usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
    } catch (error: any) {
      // Se for erro de permissão, apenas logar como warning e retornar array vazio
      if (error?.code === 'permission-denied') {
        console.warn('Permissão negada ao buscar usuários. Retornando array vazio.');
      } else {
        console.error('Erro ao buscar usuários:', error);
      }
      return [];
    }
  },

  getUserById: async (userId: string): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return {
          id: userDoc.id,
          ...userDoc.data()
        } as User;
      }
      return null;
    } catch (error: any) {
      // Se for erro de permissão, apenas logar como warning, não como error
      if (error?.code === 'permission-denied') {
        console.warn('Permissão negada ao buscar usuário:', userId);
      } else {
        console.error('Erro ao buscar usuário:', error);
      }
      return null;
    }
  },

  updateUser: async (userId: string, userData: Partial<User>): Promise<void> => {
    try {
      const updateData = {
        ...userData,
        updatedAt: Timestamp.now()
      };
      // Remover campos undefined antes de atualizar
      const cleanedData = removeUndefinedFields(updateData);
      await updateDoc(doc(db, 'users', userId), cleanedData);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  },

  // ========== QUADRAS ==========
  getQuadras: async (): Promise<Quadra[]> => {
    try {
      console.log('Firebase: Buscando quadras...');
      console.log('Firebase: Auth state:', auth.currentUser ? `Autenticado (${auth.currentUser.uid})` : 'Não autenticado');
      
      const quadrasSnapshot = await getDocs(collection(db, 'quadras'));
      console.log('Firebase: Quadras encontradas:', quadrasSnapshot.docs.length);
      
      if (quadrasSnapshot.docs.length === 0) {
        console.log('Firebase: Nenhuma quadra encontrada no Firestore');
        return [];
      }
      
      const quadras = quadrasSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        } as Quadra;
      });
      
      console.log('Firebase: Quadras processadas:', quadras.length);
      console.log('Firebase: IDs das quadras:', quadras.map(q => q.id));
      
      // Garantir que sempre retornamos um array
      return Array.isArray(quadras) ? quadras : [];
    } catch (error: any) {
      console.error('❌ ERRO ao buscar quadras no Firebase:', error);
      console.error('Código do erro:', error?.code);
      console.error('Mensagem do erro:', error?.message);
      console.error('Stack trace:', error?.stack);
      
      // Se for erro de permissão, retornar array vazio mas logar o erro
      if (error?.code === 'permission-denied') {
        console.error('❌ PERMISSÃO NEGADA: As regras do Firestore estão bloqueando a leitura de quadras.');
        console.error('📝 SOLUÇÃO: Acesse o Firebase Console → Firestore Database → Regras');
        console.error('📝 Atualize a regra de quadras para: allow read: if true;');
        console.error('📝 Regra atual deve estar assim:');
        console.error('   match /quadras/{quadraId} {');
        console.error('     allow read: if true;');
        console.error('     ...');
        console.error('   }');
      }
      
      // Sempre retornar um array vazio, nunca undefined
      return [];
    }
  },

  getQuadraById: async (quadraId: string): Promise<Quadra | null> => {
    try {
      const quadraDoc = await getDoc(doc(db, 'quadras', quadraId));
      if (quadraDoc.exists()) {
        const data = quadraDoc.data();
        return {
          id: quadraDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        } as Quadra;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar quadra:', error);
      return null;
    }
  },

  saveQuadra: async (quadra: Omit<Quadra, 'id'> | Quadra): Promise<string> => {
    try {
      const hasId = 'id' in quadra && quadra.id;
      const quadraData = {
        ...quadra,
        createdAt: hasId ? undefined : Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      // Remover campos undefined antes de salvar
      const cleanedData = removeUndefinedFields(quadraData);
      
      if (hasId) {
        await setDoc(doc(db, 'quadras', quadra.id), cleanedData);
        return quadra.id;
      } else {
        const newDocRef = doc(collection(db, 'quadras'));
        await setDoc(newDocRef, cleanedData);
        return newDocRef.id;
      }
    } catch (error) {
      console.error('Erro ao salvar quadra:', error);
      throw error;
    }
  },

  deleteQuadra: async (quadraId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'quadras', quadraId));
    } catch (error) {
      console.error('Erro ao deletar quadra:', error);
      throw error;
    }
  },

  updateQuadraRating: async (quadraId: string, newRating: number): Promise<void> => {
    try {
      // Atualizar apenas o campo rating da quadra
      await updateDoc(doc(db, 'quadras', quadraId), {
        rating: newRating,
        updatedAt: Timestamp.now()
      });
      console.log('Rating da quadra atualizado:', quadraId, newRating);
    } catch (error: any) {
      console.error('Erro ao atualizar rating da quadra:', error);
      // Se for erro de permissão, não lançar erro (apenas admins podem atualizar)
      if (error?.code !== 'permission-denied') {
        throw error;
      }
    }
  },

  // ========== REVIEWS ==========
  getReviews: async (): Promise<Review[]> => {
    try {
      const reviewsSnapshot = await getDocs(collection(db, 'reviews'));
      return reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
      } as Review));
    } catch (error) {
      console.error('Erro ao buscar reviews:', error);
      return [];
    }
  },

  getReviewsByQuadraId: async (quadraId: string): Promise<Review[]> => {
    try {
      const q = query(collection(db, 'reviews'), where('quadraId', '==', quadraId));
      const reviewsSnapshot = await getDocs(q);
      return reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
      } as Review));
    } catch (error) {
      console.error('Erro ao buscar reviews:', error);
      return [];
    }
  },

  saveReview: async (review: Omit<Review, 'id' | 'createdAt'> | Review): Promise<string> => {
    try {
      // Verificar se o usuário está autenticado no Firebase
      const currentUser = auth.currentUser;
      console.log('Firebase: Salvando review...', review);
      console.log('Firebase: Usuário autenticado?', currentUser ? `Sim (${currentUser.uid})` : 'Não');
      
      if (!currentUser) {
        const error = new Error('Usuário não autenticado no Firebase');
        (error as any).code = 'unauthenticated';
        throw error;
      }
      
      // Sempre deixar o Firebase gerar o ID para evitar conflitos
      // Converter createdAt de string ISO para Timestamp se necessário
      const reviewData: any = {
        userId: review.userId,
        userName: review.userName,
        rating: review.rating,
        comment: review.comment,
        quadraId: review.quadraId,
        createdAt: Timestamp.now() // Sempre usar Timestamp do Firebase
      };
      
      // Remover campos undefined antes de salvar
      const cleanedData = removeUndefinedFields(reviewData);
      
      console.log('Firebase: Dados a serem salvos:', cleanedData);
      
      const newDocRef = doc(collection(db, 'reviews'));
      await setDoc(newDocRef, cleanedData);
      
      console.log('Firebase: Review salvo com sucesso, ID:', newDocRef.id);
      return newDocRef.id;
    } catch (error: any) {
      console.error('Erro ao salvar review no Firebase:', error);
      console.error('Código do erro:', error?.code);
      console.error('Mensagem do erro:', error?.message);
      console.error('Stack trace:', error?.stack);
      console.error('Auth currentUser:', auth.currentUser);
      
      if (error?.code === 'permission-denied') {
        console.error('❌ PERMISSÃO NEGADA: Verifique se o usuário está autenticado e as regras do Firestore permitem criação de reviews.');
        console.error('📝 SOLUÇÃO: Acesse o Firebase Console → Firestore Database → Regras');
        console.error('📝 Verifique se a regra de reviews permite: allow create: if request.auth != null;');
        console.error('📝 Usuário atual do Firebase Auth:', auth.currentUser?.uid || 'Nenhum');
      } else if (error?.code === 'unauthenticated') {
        console.error('❌ USUÁRIO NÃO AUTENTICADO: O Firebase Auth não tem um usuário logado.');
        console.error('📝 Isso pode acontecer se o token de autenticação expirou ou foi limpo.');
      }
      
      throw error;
    }
  },

  updateReview: async (reviewId: string, review: Review): Promise<void> => {
    try {
      // Verificar se o usuário está autenticado no Firebase
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        const error = new Error('Usuário não autenticado no Firebase');
        (error as any).code = 'unauthenticated';
        throw error;
      }
      
      // Verificar se o usuário é o dono da avaliação
      const reviewDoc = await getDoc(doc(db, 'reviews', reviewId));
      if (!reviewDoc.exists()) {
        throw new Error('Avaliação não encontrada');
      }
      
      const existingReview = reviewDoc.data();
      if (existingReview.userId !== currentUser.uid) {
        const error = new Error('Você só pode editar suas próprias avaliações');
        (error as any).code = 'permission-denied';
        throw error;
      }
      
      // Preparar dados para atualização (preservar createdAt original)
      const reviewData: any = {
        userId: review.userId,
        userName: review.userName,
        rating: review.rating,
        comment: review.comment,
        quadraId: review.quadraId,
        createdAt: existingReview.createdAt, // Preservar createdAt original
        updatedAt: Timestamp.now() // Adicionar updatedAt
      };
      
      // Remover campos undefined antes de salvar
      const cleanedData = removeUndefinedFields(reviewData);
      
      await setDoc(doc(db, 'reviews', reviewId), cleanedData);
      console.log('Firebase: Review atualizado com sucesso, ID:', reviewId);
    } catch (error: any) {
      console.error('Erro ao atualizar review no Firebase:', error);
      throw error;
    }
  },

  // ========== BOOKINGS ==========
  getBookings: async (): Promise<Booking[]> => {
    try {
      console.log('Firebase: Buscando bookings...');
      console.log('Firebase: Auth state:', auth.currentUser ? `Autenticado (${auth.currentUser.uid})` : 'Não autenticado');
      
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
      console.log('Firebase: Bookings encontrados:', bookingsSnapshot.docs.length);
      
      const bookings = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
      } as Booking));
      
      console.log('Firebase: Bookings processados:', bookings.length);
      return bookings;
    } catch (error: any) {
      console.error('❌ ERRO ao buscar bookings no Firebase:', error);
      console.error('Código do erro:', error?.code);
      console.error('Mensagem do erro:', error?.message);
      
      if (error?.code === 'permission-denied') {
        console.error('❌ PERMISSÃO NEGADA: Verifique se o usuário está autenticado e as regras do Firestore permitem leitura de bookings.');
        console.error('📝 SOLUÇÃO: Acesse o Firebase Console → Firestore Database → Regras');
        console.error('📝 Verifique se a regra de bookings permite: allow read: if request.auth != null;');
        console.error('📝 Usuário atual do Firebase Auth:', auth.currentUser?.uid || 'Nenhum');
        console.error('📝 IMPORTANTE: Você precisa estar LOGADO para ver os horários disponíveis!');
      } else if (error?.code === 'unauthenticated') {
        console.error('❌ USUÁRIO NÃO AUTENTICADO: O Firebase Auth não tem um usuário logado.');
        console.error('📝 Isso pode acontecer se o token de autenticação expirou ou foi limpo.');
        console.error('📝 SOLUÇÃO: Faça login novamente no aplicativo.');
      }
      
      // Retornar array vazio em caso de erro
      return [];
    }
  },

  getBookingsByUserId: async (userId: string): Promise<Booking[]> => {
    try {
      const q = query(collection(db, 'bookings'), where('userId', '==', userId));
      const bookingsSnapshot = await getDocs(q);
      return bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
      } as Booking));
    } catch (error) {
      console.error('Erro ao buscar bookings:', error);
      return [];
    }
  },

  saveBooking: async (booking: Omit<Booking, 'id'> | Booking): Promise<string> => {
    try {
      // Preservar createdAt se já existir, senão criar novo
      let createdAtValue: Timestamp | string | undefined;
      if ('createdAt' in booking && booking.createdAt) {
        // Se já tem createdAt, converter para Timestamp se for string ISO
        if (typeof booking.createdAt === 'string') {
          createdAtValue = Timestamp.fromDate(new Date(booking.createdAt));
        } else {
          createdAtValue = booking.createdAt as any;
        }
      } else {
        // Se não tem createdAt, criar novo (reserva nova)
        createdAtValue = Timestamp.now();
      }
      
      const bookingData = {
        ...booking,
        createdAt: createdAtValue,
        updatedAt: Timestamp.now()
      };
      
      // Remover campos undefined antes de salvar
      const cleanedData = removeUndefinedFields(bookingData);
      
      if ('id' in booking && booking.id) {
        await setDoc(doc(db, 'bookings', booking.id), cleanedData);
        return booking.id;
      } else {
        const newDocRef = doc(collection(db, 'bookings'));
        await setDoc(newDocRef, cleanedData);
        return newDocRef.id;
      }
    } catch (error) {
      console.error('Erro ao salvar booking:', error);
      throw error;
    }
  },

  // Cancelar automaticamente reservas pendentes expiradas (mais de 5 minutos)
  cancelExpiredPendingBookings: async (): Promise<number> => {
    try {
      const allBookings = await firebaseService.getBookings();
      const now = new Date();
      const expirationTime = 5 * 60 * 1000; // 5 minutos em milissegundos
      let cancelledCount = 0;

      const expiredBookings = allBookings.filter(booking => {
        if (booking.status !== 'pending') return false;
        
        // Converter createdAt para Date se for string
        const createdAt = typeof booking.createdAt === 'string' 
          ? new Date(booking.createdAt) 
          : (booking.createdAt as any)?.toDate?.() || new Date(booking.createdAt);
        
        const timeDiff = now.getTime() - createdAt.getTime();
        return timeDiff > expirationTime;
      });

      // Cancelar reservas expiradas
      for (const booking of expiredBookings) {
        try {
          const cancelledBooking = {
            ...booking,
            status: 'cancelled' as const,
            updatedAt: new Date().toISOString()
          };
          await firebaseService.saveBooking(cancelledBooking);
          cancelledCount++;
          console.log(`✅ Reserva ${booking.id} cancelada automaticamente (expirada)`);
        } catch (error) {
          console.error(`❌ Erro ao cancelar reserva ${booking.id}:`, error);
        }
      }

      if (cancelledCount > 0) {
        console.log(`🔄 ${cancelledCount} reserva(s) pendente(s) cancelada(s) automaticamente`);
      }

      return cancelledCount;
    } catch (error) {
      console.error('Erro ao cancelar reservas expiradas:', error);
      return 0;
    }
  },

  // ========== CHATS ==========
  getChats: async (): Promise<Chat[]> => {
    try {
      // Tentar buscar todos os chats (pode falhar por permissão)
      const chatsSnapshot = await getDocs(collection(db, 'chats'));
      return chatsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId || '',
          userName: data.userName || '',
          adminId: data.adminId || '',
          adminName: data.adminName || '',
          quadraId: data.quadraId || undefined,
          messages: Array.isArray(data.messages) ? data.messages : [],
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTime || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString()
        } as Chat;
      });
    } catch (error: any) {
      // Se for erro de permissão, retornar array vazio
      if (error?.code === 'permission-denied') {
        console.warn('Permissão negada ao buscar todos os chats. Use getChatsByUserId ou getChatsByAdminId.');
        return [];
      }
      console.error('Erro ao buscar chats:', error);
      return [];
    }
  },

  getChatsByUserId: async (userId: string): Promise<Chat[]> => {
    try {
      const q = query(collection(db, 'chats'), where('userId', '==', userId));
      const chatsSnapshot = await getDocs(q);
      return chatsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId || '',
          userName: data.userName || '',
          adminId: data.adminId || '',
          adminName: data.adminName || '',
          quadraId: data.quadraId || undefined,
          messages: Array.isArray(data.messages) ? data.messages : [],
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTime || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString()
        } as Chat;
      });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        console.warn('Permissão negada ao buscar chats do usuário:', userId);
      } else {
        console.error('Erro ao buscar chats do usuário:', error);
      }
      return [];
    }
  },

  getChatsByAdminId: async (adminId: string): Promise<Chat[]> => {
    try {
      const q = query(collection(db, 'chats'), where('adminId', '==', adminId));
      const chatsSnapshot = await getDocs(q);
      return chatsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId || '',
          userName: data.userName || '',
          adminId: data.adminId || '',
          adminName: data.adminName || '',
          quadraId: data.quadraId || undefined,
          messages: Array.isArray(data.messages) ? data.messages : [],
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTime || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString()
        } as Chat;
      });
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        console.warn('Permissão negada ao buscar chats do admin:', adminId);
      } else {
        console.error('Erro ao buscar chats do admin:', error);
      }
      return [];
    }
  },

  getChatByUserId: async (userId: string): Promise<Chat | null> => {
    try {
      const q = query(collection(db, 'chats'), where('userId', '==', userId));
      const chatsSnapshot = await getDocs(q);
      if (!chatsSnapshot.empty) {
        const chatDoc = chatsSnapshot.docs[0];
        const data = chatDoc.data();
        return {
          id: chatDoc.id,
          userId: data.userId || '',
          userName: data.userName || '',
          adminId: data.adminId || '',
          adminName: data.adminName || '',
          quadraId: data.quadraId || undefined,
          messages: Array.isArray(data.messages) ? data.messages : [],
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTime || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString()
        } as Chat;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar chat:', error);
      return null;
    }
  },

  getChatById: async (chatId: string): Promise<Chat | null> => {
    try {
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      if (chatDoc.exists()) {
        const data = chatDoc.data();
        const chat: Chat = {
          id: chatDoc.id,
          userId: data.userId || '',
          userName: data.userName || '',
          adminId: data.adminId || '',
          adminName: data.adminName || '',
          quadraId: data.quadraId || undefined,
          messages: Array.isArray(data.messages) ? data.messages : [],
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTime || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString()
        };
        console.log('Chat retornado do Firebase getChatById:', {
          id: chat.id,
          messagesCount: chat.messages.length,
          messages: chat.messages
        });
        return chat;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar chat:', error);
      return null;
    }
  },

  saveChat: async (chat: Omit<Chat, 'id'> | Chat): Promise<string> => {
    try {
      const chatData = {
        ...chat,
        createdAt: 'id' in chat && chat.id ? undefined : Timestamp.now()
      };
      
      // Remover campos undefined antes de salvar
      const cleanedData = removeUndefinedFields(chatData);
      
      // Log para debug
      if ('id' in chat && chat.id) {
        console.log('Salvando chat no Firebase:', {
          id: chat.id,
          messagesCount: Array.isArray(cleanedData.messages) ? cleanedData.messages.length : 0,
          hasMessages: !!cleanedData.messages
        });
        await setDoc(doc(db, 'chats', chat.id), cleanedData);
        return chat.id;
      } else {
        const newDocRef = doc(collection(db, 'chats'));
        await setDoc(newDocRef, cleanedData);
        return newDocRef.id;
      }
    } catch (error) {
      console.error('Erro ao salvar chat:', error);
      throw error;
    }
  },

  deleteChat: async (chatId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'chats', chatId));
    } catch (error) {
      console.error('Erro ao deletar chat:', error);
      throw error;
    }
  },

  // ========== INICIALIZAÇÃO DE DADOS ==========
  initializeData: async (): Promise<void> => {
    try {
      // Verificar se já existem dados (apenas se o usuário estiver autenticado)
      // Se não estiver autenticado, não tentar inicializar (evita erro de permissão)
      if (!auth.currentUser) {
        return; // Não inicializar se não houver usuário autenticado
      }
      
      const usersSnapshot = await getDocs(collection(db, 'users'));
      if (!usersSnapshot.empty) {
        return; // Já existem dados, não inicializar
      }

      // Nota: O usuário admin precisa ser criado manualmente via Firebase Console
      // ou através do registro com email/senha. Aqui apenas criamos o documento se necessário.
      console.log('Dados iniciais devem ser criados manualmente ou através do registro.');
    } catch (error: any) {
      // Ignorar erros de permissão na inicialização (não é crítico)
      if (error?.code === 'permission-denied') {
        console.log('Inicialização de dados requer autenticação. Continuando sem inicializar.');
        return;
      }
      console.error('Erro ao inicializar dados:', error);
    }
  }
};

