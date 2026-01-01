import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { OrderProvider } from './context/OrderContext';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { POSScreen } from './components/pos/POSScreen';
import { CartSidebar } from './components/pos/CartSidebar';
import { AdminLayout } from './components/admin/AdminLayout';

const Main: React.FC = () => {
  // We now get the view state from AuthContext
  const { currentView } = useAuth();

  if (currentView === 'login') return <Login />;

  if (currentView === 'admin') {
    return (
      <Layout>
        <AdminLayout />
      </Layout>
    );
  }

  // POS View
  return (
    <Layout>
      <div className="flex h-full">
        <POSScreen />
        <CartSidebar />
      </div>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <OrderProvider>
           <Main />
        </OrderProvider>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;