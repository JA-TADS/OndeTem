import React, { useState, useEffect } from 'react';
import { Quadra, Booking } from '../types';
import { storageService } from '../services/storage';
import { Clock, Calendar, User, CheckCircle, AlertCircle, X } from 'lucide-react';

interface AdminBookingViewProps {
  quadraId: string;
  quadraName: string;
  isOpen: boolean;
  onClose: () => void;
}

const AdminBookingView: React.FC<AdminBookingViewProps> = ({ quadraId, quadraName, isOpen, onClose }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [quadra, setQuadra] = useState<Quadra | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allTimes, setAllTimes] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadQuadra();
    }
  }, [isOpen, quadraId]);

  useEffect(() => {
    if (selectedDate) {
      loadBookingsForDate();
      generateAllTimes();
    }
  }, [selectedDate, quadra]);

  const loadQuadra = () => {
    const quadraData = storageService.getQuadraById(quadraId);
    setQuadra(quadraData);
  };

  const loadBookingsForDate = () => {
    const allBookings = storageService.getBookings();
    const dateBookings = allBookings.filter(
      booking => booking.quadraId === quadraId && booking.date === selectedDate
    );
    setBookings(dateBookings);
  };

  const generateAllTimes = () => {
    if (!quadra || !selectedDate) {
      setAllTimes([]);
      return;
    }

    try {
      console.log('Gerando horários para:', { quadra: quadra.name, selectedDate });
      
      const dayOfWeek = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'lowercase' });
      console.log('Dia da semana:', dayOfWeek);
      
      // Sempre usar horários padrão como fallback
      const defaultTimes = [];
      const defaultStart = new Date('2000-01-01T08:00');
      const defaultEnd = new Date('2000-01-01T22:00');

      while (defaultStart < defaultEnd) {
        const timeString = defaultStart.toTimeString().substring(0, 5);
        defaultTimes.push(timeString);
        defaultStart.setMinutes(defaultStart.getMinutes() + 30);
      }

      // Se a quadra não tem operatingHours, usar horários padrão
      if (!quadra.operatingHours) {
        console.log('Quadra não tem operatingHours, usando horários padrão');
        setAllTimes(defaultTimes);
        return;
      }
      
      const dayHours = quadra.operatingHours[dayOfWeek as keyof typeof quadra.operatingHours];
      console.log('Horários do dia:', dayHours);

      // Se não tem horários configurados para este dia, usar padrão
      if (!dayHours || !dayHours.isOpen || !dayHours.open || !dayHours.close) {
        console.log('Horários não configurados para este dia, usando padrão');
        setAllTimes(defaultTimes);
        return;
      }

      // Usar horários configurados
      const times = [];
      const start = new Date(`2000-01-01T${dayHours.open}`);
      const end = new Date(`2000-01-01T${dayHours.close}`);

      while (start < end) {
        const timeString = start.toTimeString().substring(0, 5);
        times.push(timeString);
        start.setMinutes(start.getMinutes() + 30);
      }

      console.log('Horários gerados:', times);
      setAllTimes(times.length > 0 ? times : defaultTimes);
    } catch (error) {
      console.error('Erro ao gerar horários:', error);
      // Em caso de erro, usar horários padrão
      const fallbackTimes = [];
      const start = new Date('2000-01-01T08:00');
      const end = new Date('2000-01-01T22:00');

      while (start < end) {
        const timeString = start.toTimeString().substring(0, 5);
        fallbackTimes.push(timeString);
        start.setMinutes(start.getMinutes() + 30);
      }
      setAllTimes(fallbackTimes);
    }
  };

  const getBookingForTime = (time: string) => {
    return bookings.find(booking => {
      const bookingStart = new Date(`2000-01-01T${booking.startTime}`);
      const bookingEnd = new Date(`2000-01-01T${booking.endTime}`);
      const timeDate = new Date(`2000-01-01T${time}`);
      
      return timeDate >= bookingStart && timeDate < bookingEnd;
    });
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 border-green-300 text-green-800';
      case 'pending': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'cancelled': return 'bg-red-100 border-red-300 text-red-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const getDayName = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { weekday: 'long' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">Horários de Reserva - {quadraName}</h2>
            <p className="text-gray-600">Visualização para Administrador</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Seleção de Data */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-2" />
              Selecionar Data
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="border rounded px-3 py-2 w-full"
            />
            {selectedDate && (
              <p className="text-sm text-gray-600 mt-1">
                {getDayName(selectedDate)} - {formatDate(selectedDate)}
              </p>
            )}
          </div>

          {/* Horários */}
          {selectedDate && allTimes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Horários do Dia</h3>
              <div className="grid grid-cols-6 gap-2">
                {allTimes.map((time) => {
                  const booking = getBookingForTime(time);
                  return (
                    <div
                      key={time}
                      className={`p-3 rounded border text-center ${
                        booking
                          ? getBookingStatusColor(booking.status)
                          : 'bg-white border-gray-200 text-gray-700'
                      }`}
                    >
                      <div className="text-sm font-medium">{time}</div>
                      {booking && (
                        <div className="mt-1 text-xs">
                          <div className="font-medium">{booking.userName}</div>
                          <div className="opacity-75">
                            {getBookingStatusText(booking.status)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lista de Reservas */}
          {selectedDate && bookings.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Reservas do Dia</h3>
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{booking.userName}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {booking.startTime} - {booking.endTime}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(booking.date)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBookingStatusColor(booking.status)}`}>
                          {getBookingStatusText(booking.status)}
                        </span>
                        <div className="text-sm text-gray-600 mt-1">
                          R$ {booking.totalPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedDate && bookings.length === 0 && allTimes.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Nenhuma reserva para esta data</p>
              <p className="text-sm">Todos os horários estão disponíveis</p>
            </div>
          )}

          {selectedDate && allTimes.length === 0 && bookings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Nenhum horário disponível para esta data</p>
              <p className="text-sm">Verifique se a quadra está funcionando neste dia</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBookingView;
