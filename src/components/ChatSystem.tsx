import React, { useState, useEffect, useRef } from 'react';
import { Chat, ChatMessage } from '../types';
import { storageService } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Send, User, Shield } from 'lucide-react';

interface ChatSystemProps {
  isAdmin?: boolean;
}

const ChatSystem: React.FC<ChatSystemProps> = ({ isAdmin = false }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showChatList, setShowChatList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat]);

  const loadChats = () => {
    const allChats = storageService.getChats();
    if (isAdmin) {
      setChats(allChats);
    } else {
      const userChat = allChats.find(chat => chat.userId === user?.id);
      setChats(userChat ? [userChat] : []);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startNewChat = () => {
    if (!user) return;

    const existingChat = storageService.getChatByUserId(user.id);
    if (existingChat) {
      setSelectedChat(existingChat);
      setShowChatList(false);
      return;
    }

    const newChat: Chat = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      adminId: '1',
      adminName: 'Admin',
      messages: [],
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const allChats = storageService.getChats();
    const updatedChats = [...allChats, newChat];
    storageService.saveChats(updatedChats);
    
    setChats([newChat]);
    setSelectedChat(newChat);
    setShowChatList(false);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

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
      lastMessageTime: message.timestamp
    };

    const allChats = storageService.getChats();
    const updatedChats = allChats.map(chat => 
      chat.id === selectedChat.id ? updatedChat : chat
    );
    storageService.saveChats(updatedChats);

    setSelectedChat(updatedChat);
    setChats(updatedChats);
    setNewMessage('');
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

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            {isAdmin ? 'Chat com Usuários' : 'Chat com Admin'}
          </h2>
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
                    onClick={() => setSelectedChat(chat)}
                    className={`p-3 rounded cursor-pointer ${
                      selectedChat?.id === chat.id ? 'bg-blue-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span className="font-medium">{chat.userName}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                    <p className="text-xs text-gray-500">{formatTime(chat.lastMessageTime)}</p>
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
