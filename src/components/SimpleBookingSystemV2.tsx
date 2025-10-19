import React, { useState, useEffect } from 'react';
import { Quadra, Booking } from '../types';
import { storageService } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

interface SimpleBookingSystemV2Props {
  quadraId: string;
  quadraName: string;
  quadraPrice: number;
}

const SimpleBookingSystemV2: React.FC<SimpleBookingSystemV2Props> = ({ quadraId, quadraName, quadraPrice }) => {
  const { user } = useAuth();
  const [quadra, setQuadra] = useState<Quadra | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStartTime, setSelectedStartTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  const durationOptions = [
    { value: 1, label: '1 hora', price: quadraPrice },
    { value: 1.5, label: '1h 30min', price: quadraPrice * 1.5 },
    { value: 2, label: '2 horas', price: quadraPrice * 2 },
    { value: 2.5, label: '2h 30min', price: quadraPrice * 2.5 },
    { value: 3, label: '3 horas', price: quadraPrice * 3 },
    { value: 3.5, label: '3h 30min', price: quadraPrice * 3.5 },
    { value: 4, label: '4 horas', price: quadraPrice * 4 }
  ];

  useEffect(() => {
    loadQuadra();
  }, [quadraId]);

  useEffect(() => {
    if (selectedDate) {
      generateAvailableTimes();
    }
  }, [selectedDate, quadra]);

  useEffect(() => {
    if (selectedDuration) {
      calculatePrice();
    }
  }, [selectedDuration, quadraPrice]);

  const loadQuadra = () => {
    try {
      setLoading(true);
      console.log('Carregando quadra com ID:', quadraId);
      const quadraData = storageService.getQuadraById(quadraId);
      console.log('Dados da quadra carregados:', quadraData);
      
      if (quadraData) {
        setQuadra(quadraData);
      } else {
        console.error('Quadra não encontrada:', quadraId);
      }
    } catch (error) {
      console.error('Erro ao carregar quadra:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAvailableTimes = () => {
    if (!selectedDate) {
      setAvailableTimes([]);
      return;
    }

    try {
      console.log('Gerando horários para data:', selectedDate);
      
      // Sempre usar horários padrão (8h às 22h) como base
      const allTimes = [];
      const start = new Date('2000-01-01T08:00');
      const end = new Date('2000-01-01T22:00');

      while (start < end) {
        const timeString = start.toTimeString().substring(0, 5);
        allTimes.push(timeString);
        start.setMinutes(start.getMinutes() + 30);
      }

      console.log('Todos os horários possíveis:', allTimes);

      // Obter reservas existentes
      const existingBookings = storageService.getBookings().filter(
        booking => booking.quadraId === quadraId && booking.date === selectedDate
      );

      console.log('Reservas existentes:', existingBookings);

      // Filtrar horários disponíveis
      const availableTimesFiltered = allTimes.filter(time => {
        const timeDate = new Date(`2000-01-01T${time}`);
        
        return !existingBookings.some(booking => {
          const bookingStart = new Date(`2000-01-01T${booking.startTime}`);
          const bookingEnd = new Date(`2000-01-01T${booking.endTime}`);
          return timeDate >= bookingStart && timeDate < bookingEnd;
        });
      });

      console.log('Horários disponíveis:', availableTimesFiltered);
      setAvailableTimes(availableTimesFiltered);
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
      setAvailableTimes(fallbackTimes);
    }
  };

  const calculatePrice = () => {
    const price = selectedDuration * quadraPrice;
    setTotalPrice(price);
  };

  const calculateEndTime = (startTime: string, duration: number) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(start.getTime() + (duration * 60 * 60 * 1000));
    return end.toTimeString().substring(0, 5);
  };

  const handleBooking = () => {
    if (!selectedDate || !selectedStartTime || !selectedDuration || !user) return;

    const endTime = calculateEndTime(selectedStartTime, selectedDuration);

    // Verificar conflitos
    const existingBookings = storageService.getBookings().filter(
      booking => booking.quadraId === quadraId && booking.date === selectedDate
    );

    const hasConflict = existingBookings.some(booking => {
      const bookingStart = new Date(`2000-01-01T${booking.startTime}`);
      const bookingEnd = new Date(`2000-01-01T${booking.endTime}`);
      const newStart = new Date(`2000-01-01T${selectedStartTime}`);
      const newEnd = new Date(`2000-01-01T${endTime}`);

      return (newStart < bookingEnd && newEnd > bookingStart);
    });

    if (hasConflict) {
      alert('Este horário já está reservado. Por favor, escolha outro horário.');
      return;
    }

    const booking: Booking = {
      id: Date.now().toString(),
      quadraId,
      userId: user.id,
      userName: user.name,
      date: selectedDate,
      startTime: selectedStartTime,
      endTime: endTime,
      totalPrice,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Salvar reserva
    const allBookings = storageService.getBookings();
    const updatedBookings = [...allBookings, booking];
    storageService.saveBookings(updatedBookings);

    // Limpar formulário
    setSelectedDate('');
    setSelectedStartTime('');
    setSelectedDuration(1);
    setTotalPrice(0);

    alert('Reserva realizada com sucesso! Aguarde confirmação do administrador.');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const getDayName = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { weekday: 'long' });
  };

  const isDateValid = () => {
    if (!selectedDate) return false;
    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDateObj >= today;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-spin" />
            <p className="text-gray-600">Carregando sistema de reservas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!quadra) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600">Quadra não encontrada</p>
          <p className="text-sm text-gray-500">ID: {quadraId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Reservar Horário - {quadraName}</h2>
      
      <div className="space-y-6">
        {/* Seleção de Data */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4 inline mr-2" />
            Data da Reserva
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              console.log('Data selecionada:', e.target.value);
              setSelectedDate(e.target.value);
            }}
            min={new Date().toISOString().split('T')[0]}
            className="border rounded px-3 py-2 w-full"
          />
          {selectedDate && (
            <div className="text-sm text-gray-600 mt-1">
              <p>{getDayName(selectedDate)} - {formatDate(selectedDate)}</p>
              <p className="text-green-600">Funcionamento: 08:00 às 22:00</p>
              <p>Horários disponíveis: {availableTimes.length}</p>
            </div>
          )}
        </div>

        {/* Seleção de Horário */}
        {selectedDate && isDateValid() && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4 inline mr-2" />
              Horário de Início
            </label>
            {availableTimes.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {availableTimes.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedStartTime(time)}
                    className={`p-2 text-sm rounded border transition-colors ${
                      selectedStartTime === time
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Nenhum horário disponível para esta data</p>
              </div>
            )}
          </div>
        )}

        {/* Seleção de Duração */}
        {selectedStartTime && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4 inline mr-2" />
              Duração da Reserva (mínimo 1h, máximo 4h)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {durationOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedDuration(option.value)}
                  className={`p-2 text-sm rounded border transition-colors ${
                    selectedDuration === option.value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-medium text-xs">{option.label}</div>
                    <div className="text-xs opacity-75">R$ {option.price.toFixed(2)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Resumo da Reserva */}
        {selectedDate && selectedStartTime && selectedDuration && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Resumo da Reserva</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Quadra:</span>
                <span className="font-medium">{quadraName}</span>
              </div>
              <div className="flex justify-between">
                <span>Data:</span>
                <span className="font-medium">{formatDate(selectedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Horário:</span>
                <span className="font-medium">
                  {selectedStartTime} - {calculateEndTime(selectedStartTime, selectedDuration)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Duração:</span>
                <span className="font-medium">{selectedDuration}h</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-bold">Total:</span>
                <span className="font-bold text-green-600">R$ {totalPrice.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handleBooking}
              className="w-full mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center justify-center"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar Reserva
            </button>
          </div>
        )}

        {!isDateValid() && selectedDate && (
          <div className="text-center py-4 text-red-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Selecione uma data válida (hoje ou futura)</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleBookingSystemV2;
