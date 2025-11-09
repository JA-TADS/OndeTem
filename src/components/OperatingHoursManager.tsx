import React, { useState, useEffect } from 'react';
import { Quadra } from '../types';
import { storageService } from '../services/storage';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface OperatingHoursManagerProps {
  quadraId: string;
  quadraName: string;
}

const OperatingHoursManager: React.FC<OperatingHoursManagerProps> = ({ quadraId, quadraName }) => {
  const [quadra, setQuadra] = useState<Quadra | null>(null);
  const [loading, setLoading] = useState(true);
  const [operatingHours, setOperatingHours] = useState({
    monday: { open: '08:00', close: '22:00', isOpen: true },
    tuesday: { open: '08:00', close: '22:00', isOpen: true },
    wednesday: { open: '08:00', close: '22:00', isOpen: true },
    thursday: { open: '08:00', close: '22:00', isOpen: true },
    friday: { open: '08:00', close: '22:00', isOpen: true },
    saturday: { open: '08:00', close: '22:00', isOpen: true },
    sunday: { open: '08:00', close: '22:00', isOpen: true }
  });

  const daysOfWeek = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  useEffect(() => {
    loadQuadra();
  }, [quadraId]);

  const loadQuadra = async () => {
    try {
      setLoading(true);
      console.log('Carregando quadra com ID:', quadraId);
      const quadraData = await storageService.getQuadraById(quadraId);
      console.log('Dados da quadra:', quadraData);
      
      if (quadraData) {
        setQuadra(quadraData);
        // Verificar se a quadra tem operatingHours, senão usar valores padrão
        if (quadraData.operatingHours) {
          console.log('Quadra tem operatingHours:', quadraData.operatingHours);
          setOperatingHours(quadraData.operatingHours);
        } else {
          console.log('Quadra não tem operatingHours, usando valores padrão');
          // Se não tem operatingHours, usar valores padrão
          const defaultHours = {
            monday: { open: '08:00', close: '22:00', isOpen: true },
            tuesday: { open: '08:00', close: '22:00', isOpen: true },
            wednesday: { open: '08:00', close: '22:00', isOpen: true },
            thursday: { open: '08:00', close: '22:00', isOpen: true },
            friday: { open: '08:00', close: '22:00', isOpen: true },
            saturday: { open: '08:00', close: '22:00', isOpen: true },
            sunday: { open: '08:00', close: '22:00', isOpen: true }
          };
          setOperatingHours(defaultHours);
        }
      } else {
        console.error('Quadra não encontrada:', quadraId);
      }
    } catch (error) {
      console.error('Erro ao carregar quadra:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day: string) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        isOpen: !prev[day as keyof typeof prev].isOpen
      }
    }));
  };

  const handleTimeChange = (day: string, field: 'open' | 'close', value: string) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!quadra) return;

    try {
      const updatedQuadra = {
        ...quadra,
        operatingHours,
        updatedAt: new Date().toISOString()
      };

      // Atualizar cache local primeiro
      const allQuadras = await storageService.getQuadras();
      const updatedQuadras = allQuadras.map(q => q.id === quadraId ? updatedQuadra : q);
      
      // Atualizar cache
      storageService.clearCache();
      await storageService.saveQuadras(updatedQuadras);

      // Salvar apenas esta quadra no Firebase (não todas)
      const { firebaseService } = await import('../services/firebase');
      await firebaseService.saveQuadra(updatedQuadra);

      setQuadra(updatedQuadra);
      alert('Horários de funcionamento atualizados com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar horários:', error);
      alert('Erro ao salvar horários. Por favor, tente novamente.');
    }
  };

  const copyToAllDays = (sourceDay: string) => {
    const sourceHours = operatingHours[sourceDay as keyof typeof operatingHours];
    const newHours = { ...operatingHours };
    
    daysOfWeek.forEach(day => {
      if (day.key !== sourceDay) {
        newHours[day.key as keyof typeof newHours] = { ...sourceHours };
      }
    });

    setOperatingHours(newHours);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-spin" />
            <p className="text-gray-600">Carregando horários de funcionamento...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!quadra) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600">Quadra não encontrada</p>
          <p className="text-sm text-gray-500">ID: {quadraId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Horários de Funcionamento - {quadraName}</h2>
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-1" />
          <span>Configure os horários de funcionamento da quadra</span>
        </div>
      </div>

      <div className="space-y-4">
        {daysOfWeek.map((day) => {
          const dayData = operatingHours[day.key as keyof typeof operatingHours];
          return (
            <div key={day.key} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <button
                    onClick={() => handleDayToggle(day.key)}
                    className={`flex items-center mr-3 ${
                      dayData.isOpen ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {dayData.isOpen ? (
                      <CheckCircle className="h-5 w-5 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 mr-2" />
                    )}
                    <span className="font-medium">{day.label}</span>
                  </button>
                  {dayData.isOpen && (
                    <button
                      onClick={() => copyToAllDays(day.key)}
                      className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200"
                    >
                      Copiar para todos
                    </button>
                  )}
                </div>
                <span className={`text-sm ${
                  dayData.isOpen ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {dayData.isOpen ? 'Aberto' : 'Fechado'}
                </span>
              </div>

              {dayData.isOpen && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Abertura
                    </label>
                    <input
                      type="time"
                      value={dayData.open}
                      onChange={(e) => handleTimeChange(day.key, 'open', e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fechamento
                    </label>
                    <input
                      type="time"
                      value={dayData.close}
                      onChange={(e) => handleTimeChange(day.key, 'close', e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={loadQuadra}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Salvar Horários
        </button>
      </div>
    </div>
  );
};

export default OperatingHoursManager;
