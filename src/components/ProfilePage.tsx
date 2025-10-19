import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storageService } from '../services/storage';
import { User, Booking } from '../types';
import { User as UserIcon, Edit, Camera, LogOut, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);

  React.useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditAvatar(user.avatar || '');
    }
  }, [user]);

  React.useEffect(() => {
    if (activeTab === 'bookings' && user) {
      try {
        const allBookings = storageService.getBookings();
        const bookings = allBookings.filter(booking => booking.userId === user.id);
        setUserBookings(bookings);
      } catch (error) {
        console.error('Erro ao carregar reservas:', error);
        setUserBookings([]);
      }
    }
  }, [activeTab, user]);

  const handleSaveProfile = () => {
    if (!user) return;

    try {
      const updatedUser: User = {
        ...user,
        name: editName,
        avatar: editAvatar
      };

      // Atualizar usuário no contexto (atualiza o header automaticamente)
      updateUser(updatedUser);
      
      // Atualizar na lista de usuários
      const allUsers = storageService.getUsers();
      const updatedUsers = allUsers.map(u => u.id === user.id ? updatedUser : u);
      storageService.saveUsers(updatedUsers);

      setIsEditing(false);
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar perfil');
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setEditAvatar(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getBookingStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelada';
      default: return 'Desconhecido';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Usuário não encontrado</h2>
          <p className="text-gray-600 mb-4">Por favor, faça login novamente.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Perfil do Usuário</h1>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                activeTab === 'profile'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Perfil
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                activeTab === 'bookings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Minhas Reservas
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {editAvatar ? (
                    <img
                      src={editAvatar}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {isEditing ? 'Editar Perfil' : 'Informações do Perfil'}
                  </h3>
                  <p className="text-gray-600">
                    {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </p>
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border rounded px-3 py-2 w-full max-w-md"
                    placeholder="Seu nome"
                  />
                ) : (
                  <p className="text-gray-900 text-lg">{user.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <p className="text-gray-900 text-lg">{user.email}</p>
              </div>

              {/* Botões */}
              <div className="flex space-x-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Salvar
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(user.name || '');
                        setEditAvatar(user.avatar || '');
                      }}
                      className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Perfil
                  </button>
                )}
              </div>

              {/* Logout */}
              <div className="pt-6 border-t">
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair da Conta
                </button>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-6">Minhas Reservas</h3>
              {userBookings.length > 0 ? (
                <div className="space-y-4">
                  {userBookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">Quadra {booking.quadraId}</h4>
                          <p className="text-gray-600">
                            {formatDate(booking.date)} - {formatTime(booking.startTime)} às {formatTime(booking.endTime)}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBookingStatusColor(booking.status)}`}>
                          {getBookingStatusText(booking.status)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">
                          Total: R$ {booking.totalPrice.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500">
                          Criada em: {new Date(booking.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg">Você ainda não fez nenhuma reserva</p>
                  <p className="text-sm mt-2">Explore as quadras disponíveis e faça sua primeira reserva!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ProfilePage;
