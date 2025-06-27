import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ProductManagement } from './components/ProductManagement';
import { PointOfSale } from './components/PointOfSale';
import { RentalManagement } from './components/RentalManagement';
import { TransactionHistory } from './components/TransactionHistory';
import { UserManagement } from './components/UserManagement';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('pos');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <PointOfSale />;
      case 'products':
        return <ProductManagement />;
      case 'rentals':
        return <RentalManagement />;
      case 'transactions':
        return <TransactionHistory />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Paramètres</h1>
            <p className="text-gray-600">Configuration du système (à venir)</p>
          </div>
        );
      default:
        return <PointOfSale />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </AuthProvider>
  );
}

export default App;