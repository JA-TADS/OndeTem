import React from 'react';
import { Shield, Users, MapPin, MessageCircle } from 'lucide-react';

const AdminInfo: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <Shield className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
        <div>
          <h3 className="text-blue-800 font-semibold mb-2">Sistema de Administradores</h3>
          <div className="text-blue-700 text-sm space-y-1">
            <p>• Cada administrador possui suas próprias quadras</p>
            <p>• Você só pode gerenciar quadras que criou</p>
            <p>• Reservas são filtradas por suas quadras</p>
            <p>• Chats são separados por administrador</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInfo;
