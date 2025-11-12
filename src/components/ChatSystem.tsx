import React, { useState, useEffect, useRef } from 'react';
import { Chat, ChatMessage } from '../types';
import { storageService } from '../services/storage';
import { firebaseService } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Send, User, Shield, Trash2 } from 'lucide-react';

interface ChatSystemProps {
  isAdmin?: boolean;
  quadraId?: string;
}

const ChatSystem: React.FC<ChatSystemProps> = ({ isAdmin = false, quadraId }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showChatList, setShowChatList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeChats = async () => {
      await loadChats();
    };
    initializeChats();
  }, [user?.id, quadraId]);

  useEffect(() => {
    if (selectedChat) {
      // Usar setTimeout para garantir que o DOM foi atualizado
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [selectedChat, selectedChat?.messages?.length]);

  const loadChats = async (forceReloadSelected: boolean = false, clearCache: boolean = true) => {
    try {
      let allChats: Chat[];
      
      // Limpar cache apenas se solicitado
      if (clearCache) {
        storageService.clearCache();
      }
      
      // Buscar chats usando queries específicas que respeitam as regras de permissão
      if (isAdmin && user?.id) {
        // Para admin, buscar apenas chats onde ele é o adminId
        allChats = await firebaseService.getChatsByAdminId(user.id);
        setChats(allChats);
      } else if (user?.id) {
        // Para usuário, buscar apenas chats onde ele é o userId
        allChats = await firebaseService.getChatsByUserId(user.id);
        
        // Filtrar por quadra se especificada
        let userChats = allChats;
        if (quadraId) {
          userChats = allChats.filter(chat => chat.quadraId === quadraId);
        }
        
        setChats(userChats);
        
        // Se não há chat selecionado e há chats disponíveis, selecionar o primeiro
        if (!selectedChat && userChats.length > 0) {
          await loadChatById(userChats[0].id);
        }
      } else {
        allChats = [];
        setChats([]);
      }
      
      // Atualizar cache local
      if (allChats.length > 0) {
        storageService.updateChatsCache(allChats);
      }
      
      // Se há um chat selecionado e foi solicitado recarregamento, atualizar com os dados mais recentes
      if (selectedChat && forceReloadSelected) {
        const updatedChat = allChats.find(chat => chat.id === selectedChat.id);
        if (updatedChat) {
          // Recarregar o chat completo para garantir que todas as mensagens estejam presentes
          await loadChatById(updatedChat.id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar chats:', error);
      setChats([]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatById = async (chatId: string) => {
    try {
      // Buscar o chat completo pelo ID diretamente do Firebase
      console.log('=== Carregando chat pelo ID ===', chatId);
      const fullChat = await firebaseService.getChatById(chatId);
      if (fullChat) {
        // Garantir que messages seja sempre um array
        const chatWithMessages = {
          ...fullChat,
          messages: Array.isArray(fullChat.messages) ? fullChat.messages : []
        };
        
        console.log('Chat carregado do Firebase:', {
          id: chatWithMessages.id,
          messagesCount: chatWithMessages.messages.length,
          messages: chatWithMessages.messages,
          messagesType: typeof chatWithMessages.messages,
          isArray: Array.isArray(chatWithMessages.messages)
        });
        
        setSelectedChat(chatWithMessages);
        
        // Atualizar o cache local sem salvar no Firebase
        // Buscar chats do usuário atual para atualizar o cache
        if (user?.id) {
          const allChats = isAdmin 
            ? await firebaseService.getChatsByAdminId(user.id)
            : await firebaseService.getChatsByUserId(user.id);
          const updatedChats = allChats.map(chat => 
            chat.id === chatId ? chatWithMessages : chat
          );
          storageService.updateChatsCache(updatedChats);
        }
        
        console.log('Chat selecionado no estado. Mensagens:', chatWithMessages.messages.length);
      } else {
        console.error('Chat não encontrado no Firebase:', chatId);
        // Se não encontrar pelo ID, tentar buscar na lista de chats do usuário
        if (user?.id) {
          const allChats = isAdmin 
            ? await firebaseService.getChatsByAdminId(user.id)
            : await firebaseService.getChatsByUserId(user.id);
          const chat = allChats.find(c => c.id === chatId);
          if (chat) {
            const chatWithMessages = {
              ...chat,
              messages: Array.isArray(chat.messages) ? chat.messages : []
            };
            console.log('Chat encontrado na lista:', chat.id, 'Mensagens:', chatWithMessages.messages.length);
            setSelectedChat(chatWithMessages);
          } else {
            console.error('Chat não encontrado em lugar nenhum:', chatId);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar chat:', error);
    }
  };

  const startNewChat = async () => {
    if (!user) return;

    try {
      // Buscar diretamente do Firebase usando query específica que respeita as regras de permissão
      console.log('Buscando chats existentes...', { userId: user.id, quadraId });
      const userChats = await firebaseService.getChatsByUserId(user.id);
      console.log('Chats do usuário encontrados:', userChats.length, userChats.map(c => ({ id: c.id, quadraId: c.quadraId })));
      
      let existingChat: Chat | undefined;
      
      if (quadraId) {
        // Buscar chat existente para esta quadra (comparação mais robusta)
        existingChat = userChats.find(chat => {
          const chatQuadraId = chat.quadraId || '';
          const searchQuadraId = quadraId || '';
          return chatQuadraId === searchQuadraId && chatQuadraId !== '';
        });
        console.log('Buscando chat com quadraId:', quadraId, 'Encontrado:', existingChat ? existingChat.id : 'nenhum');
        if (existingChat) {
          console.log('Chat encontrado tem mensagens:', existingChat.messages?.length || 0);
        }
      } else {
        // Buscar chat existente sem quadraId (verificar se é null, undefined ou string vazia)
        existingChat = userChats.find(chat => !chat.quadraId || chat.quadraId === '');
        console.log('Buscando chat sem quadraId. Encontrado:', existingChat ? existingChat.id : 'nenhum');
        if (existingChat) {
          console.log('Chat encontrado tem mensagens:', existingChat.messages?.length || 0);
        }
      }
      
      // Se encontrou um chat existente, carregar ele
      if (existingChat) {
        console.log('Chat existente encontrado:', existingChat.id, 'Mensagens:', existingChat.messages?.length || 0);
        await loadChatById(existingChat.id);
        setShowChatList(false);
        return;
      }
      
      console.log('Nenhum chat existente encontrado, criando novo...');

      let adminId = '1';
      let adminName = 'Admin';
      
      if (quadraId) {
        const quadra = await storageService.getQuadraById(quadraId);
        if (quadra) {
          adminId = quadra.ownerId;
          // Tentar buscar apenas o usuário específico do admin
          try {
            const admin = await firebaseService.getUserById(quadra.ownerId);
            if (admin) {
              adminName = admin.name;
            }
          } catch (error) {
            // Se não tiver permissão para buscar o usuário, usar "Admin" como padrão
            console.warn('Não foi possível buscar nome do admin, usando padrão:', error);
            adminName = 'Admin';
          }
        }
      }

      const newChat: Chat = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        adminId: adminId,
        adminName: adminName,
        quadraId: quadraId,
        messages: [],
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        isActive: true,
        createdAt: new Date().toISOString()
      };

      // Salvar o novo chat diretamente no Firebase
      await firebaseService.saveChat(newChat);
      
      // Atualizar o cache local
      const updatedChats = [...userChats, newChat];
      storageService.updateChatsCache(updatedChats);
      
      // Selecionar o novo chat imediatamente
      setSelectedChat(newChat);
      setShowChatList(false);
      
      // Atualizar a lista de chats sem recarregar o chat selecionado e sem limpar cache
      await loadChats(false, false);
    } catch (error) {
      console.error('Erro ao criar novo chat:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    try {
      const message: ChatMessage = {
        id: Date.now().toString(),
        senderId: user.id,
        senderName: user.name,
        receiverId: user.id === selectedChat.userId ? selectedChat.adminId : selectedChat.userId,
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        isRead: false
      };

      const updatedChat = {
        ...selectedChat,
        messages: [...selectedChat.messages, message],
        lastMessage: message.message,
        lastMessageTime: message.timestamp,
        ...(isAdmin && {
          adminId: user.id,
          adminName: user.name
        })
      };

      // Atualizar o estado local primeiro para mostrar a mensagem imediatamente
      setSelectedChat(updatedChat);
      setNewMessage('');

      // Salvar no Firebase diretamente
      console.log('Enviando mensagem. Chat atualizado:', {
        id: updatedChat.id,
        messagesCount: updatedChat.messages.length,
        lastMessage: updatedChat.lastMessage,
        messages: updatedChat.messages
      });
      
      // Salvar o chat atualizado diretamente no Firebase
      try {
        await firebaseService.saveChat(updatedChat);
        console.log('Chat salvo no Firebase com sucesso');
        
        // Atualizar a lista de chats sem recarregar o chat selecionado e sem limpar cache
        // Isso atualiza o cache local também
        await loadChats(false, false);
      } catch (error) {
        console.error('Erro ao salvar no Firebase:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem. Tente novamente.');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  const handleDeleteChat = async (chatId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita.')) {
      try {
        // Deletar o chat do Firebase
        await storageService.deleteChat(chatId);
        
        // Limpar cache e recarregar chats
        storageService.clearCache();
        await loadChats();
        
        // Se o chat deletado estava selecionado, limpar seleção
        if (selectedChat?.id === chatId) {
          setSelectedChat(null);
        }
      } catch (error) {
        console.error('Erro ao deletar chat:', error);
        alert('Erro ao excluir a conversa. Tente novamente.');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            {isAdmin ? 'Chat com Usuários' : 'Chat com Admin'}
          </h2>
          <div className="flex items-center space-x-2">
            {selectedChat && (
              <button
                onClick={() => handleDeleteChat(selectedChat.id)}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 flex items-center"
                title="Excluir conversa"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </button>
            )}
            {!isAdmin && (
              <button
                onClick={startNewChat}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                Novo Chat
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex" style={{ height: '450px' }}>
        {isAdmin && (
          <div className="w-1/3 border-r flex flex-col h-full">
            <div className="p-3 border-b flex-shrink-0">
              <h3 className="font-semibold text-sm">Conversas</h3>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-2 space-y-1">
                {chats.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Nenhuma conversa encontrada</p>
                ) : (
                  chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-2 rounded cursor-pointer ${
                        selectedChat?.id === chat.id ? 'bg-blue-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div 
                        onClick={() => loadChatById(chat.id)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <User className="h-3 w-3 mr-1.5 flex-shrink-0" />
                          <span className="font-medium text-sm truncate">{chat.userName}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(chat.id);
                          }}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 flex-shrink-0 ml-1"
                          title="Excluir conversa"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <div onClick={() => loadChatById(chat.id)} className="mt-1">
                        <p className="text-xs text-gray-600 truncate">{chat.lastMessage || 'Sem mensagens'}</p>
                        <p className="text-xs text-gray-500">{formatTime(chat.lastMessageTime)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col h-full min-h-0">
          {selectedChat ? (
            <>
              <div className="p-3 border-b bg-gray-50 flex-shrink-0">
                <div className="flex items-center">
                  {isAdmin ? (
                    <>
                      <User className="h-4 w-4 mr-2" />
                      <span className="font-medium text-sm">{selectedChat.userName}</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      <span className="font-medium text-sm">Admin</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 min-h-0">
                <div className="space-y-3">
                  {(() => {
                    const messages = Array.isArray(selectedChat.messages) ? selectedChat.messages : [];
                    console.log('Renderizando mensagens. Total:', messages.length, 'selectedChat:', selectedChat.id);
                    
                    if (messages.length === 0) {
                      return (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-500 text-sm">Nenhuma mensagem ainda. Comece a conversar!</p>
                        </div>
                      );
                    }
                    
                    return messages.map((message) => {
                      // Determinar se a mensagem é do usuário atual
                      const isMyMessage = message.senderId === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs p-2 rounded-lg ${
                              isMyMessage
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-800'
                            }`}
                          >
                            <p className="text-sm break-words">{message.message}</p>
                            <p className="text-xs mt-1 opacity-70">
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="p-3 border-t flex-shrink-0">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 border rounded px-3 py-2 text-sm"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Selecione uma conversa para começar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSystem;
