import React, { useState, useEffect, useRef } from 'react';
import { Chat, ChatMessage } from '../types';
import { storageService } from '../services/storage';
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
    loadChats();
  }, [user?.id, quadraId]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat]);

  const loadChats = async () => {
    try {
      const allChats = await storageService.getChats();
      if (isAdmin) {
        // Para admin, mostrar apenas chats onde ele é o adminId
        const adminChats = allChats.filter(chat => chat.adminId === user?.id);
        setChats(adminChats);
      } else {
        // Para usuário, filtrar por quadra se especificada
        let userChats = allChats.filter(chat => chat.userId === user?.id);
        
        if (quadraId) {
          // Filtrar apenas chats da quadra específica
          userChats = userChats.filter(chat => chat.quadraId === quadraId);
        }
        
        setChats(userChats);
      }
    } catch (error) {
      console.error('Erro ao carregar chats:', error);
      setChats([]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startNewChat = async () => {
    if (!user) return;

    try {
      // Se tem quadraId, verificar se já existe chat para essa quadra
      if (quadraId) {
        const allChats = await storageService.getChats();
        const existingChat = allChats.find(chat => 
          chat.userId === user.id && chat.quadraId === quadraId
        );
        if (existingChat) {
          setSelectedChat(existingChat);
          setShowChatList(false);
          return;
        }
      } else {
        // Se não tem quadraId, usar lógica antiga
        const existingChat = await storageService.getChatByUserId(user.id);
        if (existingChat) {
          setSelectedChat(existingChat);
          setShowChatList(false);
          return;
        }
      }

      // Encontrar o admin da quadra se quadraId foi especificado
      let adminId = '1';
      let adminName = 'Admin';
      
      if (quadraId) {
        const quadra = await storageService.getQuadraById(quadraId);
        if (quadra) {
          adminId = quadra.ownerId;
          // Buscar nome do admin
          const users = await storageService.getUsers();
          const admin = users.find(u => u.id === quadra.ownerId);
          if (admin) {
            adminName = admin.name;
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

      const allChats = await storageService.getChats();
      const updatedChats = [...allChats, newChat];
      await storageService.saveChats(updatedChats);
      
      // Recarregar chats para manter filtros corretos
      loadChats();
      setSelectedChat(newChat);
      setShowChatList(false);
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
        // Se for um admin respondendo, atualizar o adminId
        ...(isAdmin && {
          adminId: user.id,
          adminName: user.name
        })
      };

      const allChats = await storageService.getChats();
      const updatedChats = allChats.map(chat => 
        chat.id === selectedChat.id ? updatedChat : chat
      );
      await storageService.saveChats(updatedChats);

      setSelectedChat(updatedChat);
      // Recarregar chats para manter filtros corretos
      loadChats();
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
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
        const allChats = await storageService.getChats();
        const updatedChats = allChats.filter(chat => chat.id !== chatId);
        await storageService.saveChats(updatedChats);
        
        // Recarregar chats
        loadChats();
        
        // Se o chat deletado estava selecionado, limpar seleção
        if (selectedChat?.id === chatId) {
          setSelectedChat(null);
        }
      } catch (error) {
        console.error('Erro ao deletar chat:', error);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
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

      <div className="flex h-96">
        {/* Lista de chats (apenas para admin) */}
        {isAdmin && (
          <div className="w-1/3 border-r">
            <div className="p-4">
              <h3 className="font-semibold mb-3">Conversas</h3>
              <div className="space-y-2">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-3 rounded cursor-pointer ${
                      selectedChat?.id === chat.id ? 'bg-blue-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div 
                      onClick={() => setSelectedChat(chat)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center flex-1">
                        <User className="h-4 w-4 mr-2" />
                        <span className="font-medium">{chat.userName}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChat(chat.id);
                        }}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                        title="Excluir conversa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div onClick={() => setSelectedChat(chat)}>
                      <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                      <p className="text-xs text-gray-500">{formatTime(chat.lastMessageTime)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Área de mensagens */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Header do chat */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center">
                  {isAdmin ? (
                    <>
                      <User className="h-4 w-4 mr-2" />
                      <span className="font-medium">{selectedChat.userName}</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      <span className="font-medium">Admin</span>
                    </>
                  )}
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {selectedChat.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs p-3 rounded-lg ${
                          message.senderId === user?.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input de mensagem */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 border rounded px-3 py-2"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
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
                <p>Selecione uma conversa para começar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSystem;
