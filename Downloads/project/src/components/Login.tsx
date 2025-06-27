import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Mail, Lock, User } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const success = await login(email, password);
    if (!success) {
      setError('Email ou mot de passe incorrect');
    }
    setIsLoading(false);
  };

  const demoUsers = [
    { email: 'admin@boutique.com', password: 'hamaza44', role: 'Administrateur' },
    { email: 'agent@boutique.com', password: '123456', role: 'Agent de vente' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
           <div className="p-4  rounded-3xl shadow-xl inline-flex items-center justify-center">
              <img
                src="/hali.jpg"
                alt="Logo HaliStock"
                className="w-24 h-24 rounded-full object-cover border-4 border-white"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">HaliStock</h1>
          <p className="text-gray-600 mt-2">Système de Gestion de Boutique</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

           <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2C5A5C] text-white py-3 px-4 rounded-lg hover:bg-[#24494A] focus:ring-2 focus:ring-[#2C5A5C] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
           

            {showDemo && (
              <div className="mt-4 space-y-3">
                {demoUsers.map((user, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">{user.role}</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Email: {user.email}</p>
                      <p>Mot de passe: {user.password}</p>
                    </div>
                    <button
                      onClick={() => {
                        setEmail(user.email);
                        setPassword(user.password);
                      }}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Utiliser ces identifiants
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>© 2025 HaliStock. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
}