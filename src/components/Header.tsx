import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Settings, User, LogIn, UserPlus } from 'lucide-react';

const Header: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-blue-500 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">OndeTem</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-700">Olá, {user.name}</span>
                
                {/* Avatar/Perfil */}
                <button
                  onClick={handleProfileClick}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  title="Perfil"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </button>

                {isAdmin && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <Settings className="h-5 w-5 mr-1" />
                    Admin
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="flex items-center bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Cadastrar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
