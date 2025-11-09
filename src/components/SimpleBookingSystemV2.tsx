import React, { useState, useEffect } from 'react';
import { Quadra, Booking } from '../types';
import { storageService } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Calendar, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import PaymentQRCode from './PaymentQRCode';

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
  const [showPayment, setShowPayment] = useState(false);
  const [bookingData, setBookingData] = useState<Booking | null>(null);

  const durationOptions = [
    { value: 1, label: '1 hora', price: quadraPrice },
    { value: 2, label: '2 horas', price: quadraPrice * 2 },
    { value: 3, label: '3 horas', price: quadraPrice * 3 },
    { value: 4, label: '4 horas', price: quadraPrice * 4 }
  ];

  useEffect(() => {
    loadQuadra();
  }, [quadraId]);

  useEffect(() => {
    if (selectedDate && quadra) {
      // Limpar cache antes de gerar horários para garantir dados atualizados
      storageService.clearCache();
      generateAvailableTimes();
    } else {
      setAvailableTimes([]);
    }
  }, [selectedDate, quadra, quadraId]);

  // Recarregar horários quando a janela ganha foco (para sincronizar com mudanças de outros usuários)
  useEffect(() => {
    const handleFocus = () => {
      if (selectedDate && quadra) {
        storageService.clearCache();
        generateAvailableTimes();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && selectedDate && quadra) {
        storageService.clearCache();
        generateAvailableTimes();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedDate, quadra, quadraId]);

  useEffect(() => {
    if (selectedDuration) {
      calculatePrice();
    }
  }, [selectedDuration, quadraPrice]);

  const loadQuadra = async () => {
    try {
      setLoading(true);
      console.log('Carregando quadra com ID:', quadraId);
      const quadraData = await storageService.getQuadraById(quadraId);
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

  const generateAvailableTimes = async () => {
    if (!selectedDate || !quadra) {
      console.log('Sem data ou quadra:', { selectedDate, quadra: !!quadra });
      setAvailableTimes([]);
      return;
    }

    try {
      // Cancelar reservas pendentes expiradas antes de gerar horários
      const { firebaseService } = await import('../services/firebase');
      await firebaseService.cancelExpiredPendingBookings();
      console.log('=== INÍCIO: Gerando horários ===');
      console.log('Data selecionada:', selectedDate);
      console.log('Quadra:', quadra.name);
      console.log('OperatingHours da quadra:', quadra.operatingHours);
      
      // Obter dia da semana (formato: monday, tuesday, etc.)
      const dateObj = new Date(selectedDate + 'T00:00:00');
      
      // Usar getDay() que retorna 0 (domingo) a 6 (sábado) e mapear para os nomes em inglês
      const dayIndex = dateObj.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const mappedDay = dayNames[dayIndex];
      
      console.log('Data objeto:', dateObj);
      console.log('Índice do dia (0=domingo, 6=sábado):', dayIndex);
      console.log('Dia mapeado:', mappedDay);
      
      // Horários padrão como fallback
      const defaultStart = new Date('2000-01-01T08:00');
      const defaultEnd = new Date('2000-01-01T22:00');
      const defaultTimes: string[] = [];
      
      let tempStart = new Date(defaultStart);
      while (tempStart < defaultEnd) {
        defaultTimes.push(tempStart.toTimeString().substring(0, 5));
        tempStart.setMinutes(tempStart.getMinutes() + 30);
      }

      // Verificar horários de funcionamento da quadra
      let allTimes: string[] = [];
      
      if (quadra.operatingHours) {
        const dayHours = quadra.operatingHours[mappedDay as keyof typeof quadra.operatingHours];
        console.log('Horários do dia:', dayHours);
        
         if (dayHours && dayHours.isOpen && dayHours.open && dayHours.close) {
           // Usar horários configurados da quadra (NÃO usar padrão)
           // Garantir formato HH:MM
           const openTime = dayHours.open.length === 5 ? dayHours.open : dayHours.open.substring(0, 5);
           const closeTime = dayHours.close.length === 5 ? dayHours.close : dayHours.close.substring(0, 5);
           
           const start = new Date(`2000-01-01T${openTime}:00`);
           const end = new Date(`2000-01-01T${closeTime}:00`);
           
           // Gerar apenas horários dentro do intervalo de funcionamento (apenas horas inteiras)
           let tempStart = new Date(start);
           // Arredondar para a próxima hora inteira se necessário
           if (tempStart.getMinutes() > 0) {
             tempStart.setMinutes(0);
             tempStart.setHours(tempStart.getHours() + 1);
           }
           while (tempStart < end) {
             const timeString = tempStart.toTimeString().substring(0, 5);
             allTimes.push(timeString);
             tempStart.setHours(tempStart.getHours() + 1); // Incrementar de 1 em 1 hora
           }
           
           console.log('✅ Usando horários da quadra:', openTime, '-', closeTime);
           console.log('Horários gerados:', allTimes.length, allTimes);
         } else {
          // Quadra fechada neste dia ou horários inválidos
          console.warn('⚠️ Quadra fechada ou horários inválidos:', {
            dayHours,
            isOpen: dayHours?.isOpen,
            open: dayHours?.open,
            close: dayHours?.close
          });
          setAvailableTimes([]);
          return;
        }
       } else {
         // Sem horários configurados, não mostrar nenhum horário (não usar padrão)
         console.warn('⚠️ Quadra sem operatingHours configurado, não mostrando horários');
         setAvailableTimes([]);
         return;
       }

      console.log('Todos os horários possíveis:', allTimes.length, allTimes);

       // Obter reservas existentes (apenas confirmadas e pendentes)
       // Forçar refresh para garantir dados atualizados
       storageService.clearCache();
       const allBookings = await storageService.getBookings();
       console.log('Total de reservas no sistema:', allBookings.length);
      
      const existingBookings = allBookings.filter(
        booking => booking.quadraId === quadraId && 
               booking.date === selectedDate &&
               (booking.status === 'confirmed' || booking.status === 'pending')
      );

      console.log('Reservas existentes para esta quadra/data:', existingBookings.length, existingBookings);

      // Filtrar horários disponíveis (remover horários já reservados)
      const availableTimesFiltered = allTimes.filter(time => {
        // Normalizar formato do horário (garantir HH:MM)
        const normalizedTime = time.length === 5 ? time : time.substring(0, 5);
        const timeDate = new Date(`2000-01-01T${normalizedTime}:00`);
        
        const isBooked = existingBookings.some(booking => {
          // Normalizar formatos dos horários da reserva
          const bookingStartNormalized = booking.startTime.length === 5 ? booking.startTime : booking.startTime.substring(0, 5);
          const bookingEndNormalized = booking.endTime.length === 5 ? booking.endTime : booking.endTime.substring(0, 5);
          
          const bookingStart = new Date(`2000-01-01T${bookingStartNormalized}:00`);
          const bookingEnd = new Date(`2000-01-01T${bookingEndNormalized}:00`);
          
          // Verificar se o horário está dentro do intervalo da reserva
          // Um horário está reservado se ele está >= startTime e < endTime
          const isInRange = timeDate >= bookingStart && timeDate < bookingEnd;
          
          if (isInRange) {
            console.log(`❌ Horário ${normalizedTime} está RESERVADO por ${booking.userName} (${bookingStartNormalized}-${bookingEndNormalized}, status: ${booking.status})`);
          }
          
          return isInRange;
        });
        
        if (isBooked) {
          console.log(`🚫 Removendo horário ${normalizedTime} da lista de disponíveis`);
        }
        
        return !isBooked;
      });

      console.log('✅ Horários disponíveis finais:', availableTimesFiltered.length, availableTimesFiltered);
      console.log('=== FIM: Gerando horários ===');
      
      setAvailableTimes(availableTimesFiltered);
    } catch (error) {
      console.error('❌ Erro ao gerar horários disponíveis:', error);
      console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
      setAvailableTimes([]);
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

  const handleBooking = async () => {
    try {
      if (!selectedDate || !selectedStartTime || !selectedDuration) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
      }
      
      if (!user) {
        alert('Você precisa fazer login para fazer uma reserva. Clique em "Entrar" no menu superior.');
        return;
      }

      const endTime = calculateEndTime(selectedStartTime, selectedDuration);

       // Verificar conflitos (incluindo reservas confirmadas e pendentes)
       // Forçar refresh para garantir dados atualizados
       storageService.clearCache();
       const allBookings = await storageService.getBookings();
       const existingBookings = allBookings.filter(
        booking => booking.quadraId === quadraId && 
                   booking.date === selectedDate &&
                   (booking.status === 'confirmed' || booking.status === 'pending')
      );

      const hasConflict = existingBookings.some(booking => {
        // Normalizar formatos dos horários
        const bookingStartNormalized = booking.startTime.length === 5 ? booking.startTime : booking.startTime.substring(0, 5);
        const bookingEndNormalized = booking.endTime.length === 5 ? booking.endTime : booking.endTime.substring(0, 5);
        const newStartNormalized = selectedStartTime.length === 5 ? selectedStartTime : selectedStartTime.substring(0, 5);
        const newEndNormalized = endTime.length === 5 ? endTime : endTime.substring(0, 5);
        
        const bookingStart = new Date(`2000-01-01T${bookingStartNormalized}:00`);
        const bookingEnd = new Date(`2000-01-01T${bookingEndNormalized}:00`);
        const newStart = new Date(`2000-01-01T${newStartNormalized}:00`);
        const newEnd = new Date(`2000-01-01T${newEndNormalized}:00`);

        // Verificar se há sobreposição de horários
        const conflict = (newStart < bookingEnd && newEnd > bookingStart);
        
        if (conflict) {
          console.log(`⚠️ Conflito detectado: Nova reserva (${newStartNormalized}-${newEndNormalized}) conflita com reserva existente (${bookingStartNormalized}-${bookingEndNormalized})`);
        }
        
        return conflict;
      });

      if (hasConflict) {
        alert('Este horário já está reservado. Por favor, escolha outro horário.');
        // Recarregar horários disponíveis
        await generateAvailableTimes();
        return;
      }

      // Criar dados da reserva (salvar como pendente imediatamente)
      const bookingData: Omit<Booking, 'id'> = {
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

      // Salvar reserva diretamente no Firebase primeiro
      try {
        const { firebaseService } = await import('../services/firebase');
        const bookingId = await firebaseService.saveBooking(bookingData);
        
        // Criar objeto booking completo com o ID retornado pelo Firebase
        const booking: Booking = {
          ...bookingData,
          id: bookingId
        };
        
        // Atualizar cache local
        storageService.clearCache();
        
        // Limpar cache e atualizar horários disponíveis após salvar
        await generateAvailableTimes();
        
        // Armazenar booking para uso posterior
        setBookingData(booking);
        setShowPayment(true);
      } catch (error) {
        console.error('Erro ao salvar reserva pendente no Firebase:', error);
        alert('Erro ao processar reserva. Por favor, tente novamente.');
        return;
      }
    } catch (error) {
      console.error('Erro ao processar reserva:', error);
      alert('Erro ao processar reserva. Por favor, tente novamente.');
    }
  };

  const handlePaymentConfirmed = async () => {
    if (!bookingData) {
      console.error('❌ Erro: bookingData está null ao tentar confirmar pagamento');
      alert('Erro: Dados da reserva não encontrados. Por favor, tente novamente.');
      return;
    }

    try {
      console.log('✅ Confirmando pagamento para reserva:', bookingData.id);
      
      // Limpar cache antes de buscar reservas para garantir dados atualizados
      storageService.clearCache();
      
      // Buscar todas as reservas atualizadas
      const allBookings = await storageService.getBookings();
      console.log('Total de reservas encontradas:', allBookings.length);
      
      // Verificar se a reserva ainda existe
      const existingBooking = allBookings.find(b => b.id === bookingData.id);
      if (!existingBooking) {
        console.error('❌ Erro: Reserva não encontrada no banco de dados');
        alert('Erro: Reserva não encontrada. Por favor, tente novamente.');
        return;
      }
      
      // Atualizar reserva existente para confirmada
      const confirmedBooking = {
        ...existingBooking,
        status: 'confirmed' as const,
        updatedAt: new Date().toISOString()
      };
      
      console.log('💾 Atualizando reserva para confirmada no Firebase...');
      // Salvar diretamente no Firebase
      const { firebaseService } = await import('../services/firebase');
      await firebaseService.saveBooking(confirmedBooking);
      console.log('✅ Reserva confirmada salva no Firebase com sucesso');
      
      // Limpar cache e atualizar horários disponíveis após confirmar
      storageService.clearCache();
      if (selectedDate) {
        await generateAvailableTimes();
      }

      // Limpar formulário
      setSelectedDate('');
      setSelectedStartTime('');
      setSelectedDuration(1);
      setTotalPrice(0);
      setBookingData(null);
      setShowPayment(false);

      alert('Reserva confirmada com sucesso! Pagamento aprovado.');
    } catch (error) {
      console.error('❌ Erro ao confirmar pagamento:', error);
      console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
      alert('Erro ao confirmar pagamento. Por favor, tente novamente.');
    }
  };

  const handleBookingCancel = async () => {
    if (!bookingData) return;

    try {
      // Atualizar reserva para cancelada
      const cancelledBooking = {
        ...bookingData,
        status: 'cancelled' as const,
        updatedAt: new Date().toISOString()
      };

      // Salvar diretamente no Firebase
      const { firebaseService } = await import('../services/firebase');
      await firebaseService.saveBooking(cancelledBooking);
      console.log('✅ Reserva cancelada salva no Firebase');
      
      // Limpar cache e atualizar horários disponíveis após cancelar
      storageService.clearCache();
      if (selectedDate) {
        await generateAvailableTimes();
      }

      // Limpar dados
      setBookingData(null);
      setShowPayment(false);

      alert('Reserva cancelada com sucesso.');
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      alert('Erro ao cancelar reserva. Por favor, tente novamente.');
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
      
      {!user && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <p className="text-yellow-800 font-medium">Login necessário</p>
              <p className="text-yellow-700 text-sm">
                Você precisa fazer login para fazer uma reserva. 
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="text-yellow-600 hover:text-yellow-800 underline ml-1"
                >
                  Clique aqui para entrar
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
      
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
          {selectedDate && (() => {
            // Obter horários de funcionamento para o dia selecionado
            const dateObj = new Date(selectedDate + 'T00:00:00');
            const dayIndex = dateObj.getDay();
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayKey = dayNames[dayIndex] as keyof typeof quadra.operatingHours;
            const dayHours = quadra.operatingHours?.[dayKey];
            
            let operatingHoursText = '08:00 às 22:00'; // Fallback padrão
            if (dayHours && dayHours.isOpen && dayHours.open && dayHours.close) {
              operatingHoursText = `${dayHours.open} às ${dayHours.close}`;
            } else if (dayHours && !dayHours.isOpen) {
              operatingHoursText = 'Fechado';
            }
            
            return (
              <div className="text-sm text-gray-600 mt-1">
                <p>{getDayName(selectedDate)} - {formatDate(selectedDate)}</p>
                <p className={dayHours?.isOpen ? "text-green-600" : "text-red-600"}>
                  Funcionamento: {operatingHoursText}
                </p>
                <p>Horários disponíveis: {availableTimes.length}</p>
              </div>
            );
          })()}
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
              disabled={!user}
              className={`w-full mt-4 px-4 py-2 rounded flex items-center justify-center ${
                user 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {user ? 'Pagar com PIX' : 'Login Necessário'}
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

      {/* Modal de Pagamento PIX */}
      {showPayment && bookingData && (
        <PaymentQRCode
          isOpen={showPayment}
          onClose={async () => {
            // Verificar se o pagamento foi confirmado antes de cancelar
            // Se o status ainda for 'pending', significa que foi fechado sem confirmar
            if (bookingData && bookingData.status === 'pending') {
              // Verificar no Firebase se a reserva ainda está pendente
              try {
                storageService.clearCache();
                const allBookings = await storageService.getBookings();
                const currentBooking = allBookings.find(b => b.id === bookingData.id);
                
                // Só cancelar se ainda estiver pendente no Firebase
                if (currentBooking && currentBooking.status === 'pending') {
                  await handleBookingCancel();
                }
              } catch (error) {
                console.error('Erro ao verificar status da reserva:', error);
                // Em caso de erro, cancelar por segurança
                await handleBookingCancel();
              }
            }
            setShowPayment(false);
            setBookingData(null);
          }}
          totalPrice={bookingData.totalPrice}
          quadraName={quadraName}
          userName={bookingData.userName}
          onPaymentConfirmed={handlePaymentConfirmed}
          onCancel={handleBookingCancel}
        />
      )}
    </div>
  );
};

export default SimpleBookingSystemV2;
