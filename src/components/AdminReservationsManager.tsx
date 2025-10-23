import React, { useState, useEffect } from 'react';
import { Booking, Quadra } from '../types';
import { storageService } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react';

const AdminReservationsManager: React.FC = () => {
  const { user } = useAuth();
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedQuadra, setSelectedQuadra] = useState<string>('all');
  const [quadras, setQuadras] = useState<Quadra[]>([]);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  useEffect(() => {
    filterBookings();
  }, [allBookings, selectedStatus, selectedQuadra]);

  const loadData = () => {
    try {
      const allBookings = storageService.getBookings();
      const allQuadras = storageService.getQuadras();
      
      // Filtrar apenas quadras do admin logado
      const userQuadras = allQuadras.filter(quadra => quadra.ownerId === user?.id);
      
      // Filtrar reservas apenas das quadras do admin
      const userQuadraIds = userQuadras.map(q => q.id);
      const userBookings = allBookings.filter(booking => 
        userQuadraIds.includes(booking.quadraId)
      );
      
      setAllBookings(userBookings);
      setQuadras(userQuadras);
      console.log('Dados carregados:', { bookings: userBookings, quadras: userQuadras });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const filterBookings = () => {
    let filtered = [...allBookings];

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(booking => booking.status === selectedStatus);
    }

    if (selectedQuadra !== 'all') {
      filtered = filtered.filter(booking => booking.quadraId === selectedQuadra);
    }

    // Ordenar por data de criação (mais recentes primeiro)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredBookings(filtered);
  };

  const handleStatusChange = (bookingId: string, newStatus: 'confirmed' | 'cancelled') => {
    try {
      const allBookings = storageService.getBookings();
      const updatedBookings = allBookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus, updatedAt: new Date().toISOString() }
          : booking
      );

      storageService.saveBookings(updatedBookings);
      // Recarregar dados para manter filtros corretos
      loadData();
      
      const statusText = newStatus === 'confirmed' ? 'confirmada' : 'cancelada';
      alert(`Reserva ${statusText} com sucesso!`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar reserva');
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelada';
      default: return 'Desconhecido';
    }
  };

  const getQuadraName = (quadraId: string) => {
    const quadra = quadras.find(q => q.id === quadraId);
    return quadra ? quadra.name : `Quadra ${quadraId}`;
  };

  const getStatusCounts = () => {
    const pending = allBookings.filter(b => b.status === 'pending').length;
    const confirmed = allBookings.filter(b => b.status === 'confirmed').length;
    const cancelled = allBookings.filter(b => b.status === 'cancelled').length;
    
    return { pending, confirmed, cancelled, total: allBookings.length };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Gerenciar Reservas</h2>
        
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm text-yellow-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-800">{statusCounts.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-green-600">Confirmadas</p>
                <p className="text-2xl font-bold text-green-800">{statusCounts.confirmed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <p className="text-sm text-red-600">Canceladas</p>
                <p className="text-2xl font-bold text-red-800">{statusCounts.cancelled}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-blue-600">Total</p>
                <p className="text-2xl font-bold text-blue-800">{statusCounts.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendentes</option>
              <option value="confirmed">Confirmadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Quadra:</label>
            <select
              value={selectedQuadra}
              onChange={(e) => setSelectedQuadra(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="all">Todas</option>
              {quadras.map(quadra => (
                <option key={quadra.id} value={quadra.id}>
                  {quadra.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Reservas */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Reservas ({filteredBookings.length})
          </h3>
          
          {filteredBookings.length > 0 ? (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-500 mr-1" />
                          <span className="font-medium">{booking.userName}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                          <span className="text-sm text-gray-600">
                            {formatDate(booking.date)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-500 mr-1" />
                          <span className="text-sm text-gray-600">
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p><strong>Quadra:</strong> {getQuadraName(booking.quadraId)}</p>
                        <p><strong>Valor:</strong> R$ {booking.totalPrice.toFixed(2)}</p>
                        <p><strong>Criada em:</strong> {new Date(booking.createdAt).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                      
                      {booking.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStatusChange(booking.id, 'confirmed')}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 flex items-center"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirmar
                          </button>
                          <button
                            onClick={() => handleStatusChange(booking.id, 'cancelled')}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 flex items-center"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Nenhuma reserva encontrada</p>
              <p className="text-sm">Ajuste os filtros para ver mais resultados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReservationsManager;
