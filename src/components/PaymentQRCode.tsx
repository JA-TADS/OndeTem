import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { CreditCard, Copy, Check, Clock, AlertCircle } from 'lucide-react';

interface PaymentQRCodeProps {
  isOpen: boolean;
  onClose: () => void;
  totalPrice: number;
  quadraName: string;
  userName: string;
  onPaymentConfirmed: () => void;
}

const PaymentQRCode: React.FC<PaymentQRCodeProps> = ({
  isOpen,
  onClose,
  totalPrice,
  quadraName,
  userName,
  onPaymentConfirmed
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [pixKey, setPixKey] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'confirmed' | 'timeout'>('pending');
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutos em segundos

  // Chave PIX do admin (em produção viria do banco de dados)
  const adminPixKey = 'admin@ondetem.com'; // Chave PIX do admin

  useEffect(() => {
    if (isOpen) {
      generateQRCode();
      setTimeLeft(15 * 60);
      setPaymentStatus('pending');
    }
  }, [isOpen, totalPrice]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft > 0 && paymentStatus === 'pending') {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && paymentStatus === 'pending') {
      setPaymentStatus('timeout');
    }
    return () => clearTimeout(timer);
  }, [timeLeft, paymentStatus]);

  const generateQRCode = async () => {
    try {
      // Gerar código PIX (formato simplificado para demonstração)
      const pixData = {
        chave: adminPixKey,
        valor: totalPrice.toFixed(2),
        descricao: `Reserva - ${quadraName} - ${userName}`,
        merchant: 'OndeTem Quadras'
      };

      const qrCodeString = JSON.stringify(pixData);
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeUrl(qrCodeDataUrl);
      setPixKey(adminPixKey);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
    }
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePaymentConfirm = () => {
    setPaymentStatus('confirmed');
    setTimeout(() => {
      onPaymentConfirmed();
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Pagamento PIX
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Informações da Reserva */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Detalhes da Reserva</h3>
            <p className="text-sm text-blue-800">Quadra: {quadraName}</p>
            <p className="text-sm text-blue-800">Cliente: {userName}</p>
            <p className="text-sm text-blue-800">Valor: R$ {totalPrice.toFixed(2)}</p>
          </div>

          {/* Status do Pagamento */}
          {paymentStatus === 'pending' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="font-medium">Aguardando Pagamento</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatTime(timeLeft)}
                </div>
              </div>
              
              {/* QR Code */}
              {qrCodeUrl && (
                <div className="text-center mb-4">
                  <img src={qrCodeUrl} alt="QR Code PIX" className="mx-auto border rounded-lg" />
                  <p className="text-sm text-gray-600 mt-2">
                    Escaneie o QR Code com seu app de pagamento
                  </p>
                </div>
              )}

              {/* Chave PIX */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chave PIX:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={pixKey}
                    readOnly
                    className="flex-1 border rounded px-3 py-2 bg-gray-50"
                  />
                  <button
                    onClick={copyPixKey}
                    className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 flex items-center"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                {copied && (
                  <p className="text-green-600 text-sm mt-1">Chave copiada!</p>
                )}
              </div>

              {/* Botão de Confirmação Manual */}
              <div className="text-center">
                <button
                  onClick={handlePaymentConfirm}
                  className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
                >
                  Confirmar Pagamento
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Clique aqui após realizar o pagamento
                </p>
              </div>
            </div>
          )}

          {paymentStatus === 'confirmed' && (
            <div className="text-center py-8">
              <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-600 mb-2">
                Pagamento Confirmado!
              </h3>
              <p className="text-gray-600">
                Sua reserva foi confirmada com sucesso.
              </p>
            </div>
          )}

          {paymentStatus === 'timeout' && (
            <div className="text-center py-8">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-red-600 mb-2">
                Tempo Esgotado
              </h3>
              <p className="text-gray-600 mb-4">
                O tempo para pagamento expirou. Tente novamente.
              </p>
              <button
                onClick={() => {
                  setPaymentStatus('pending');
                  setTimeLeft(15 * 60);
                  generateQRCode();
                }}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentQRCode;
