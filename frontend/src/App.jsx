import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import AuthModal from './components/auth/AuthModal';
import OnboardingModal from './components/onboarding/OnboardingModal';
import CartConflictModal from './components/cart/CartConflictModal';
import ErrorBoundary from './components/common/ErrorBoundary';

// Pages
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import BuildMealPage from './pages/BuildMealPage';
import MealPlannerPage from './pages/MealPlannerPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import OrdersPage from './pages/OrdersPage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

export default function App() {
  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAFAFA' }}>
        {/* Navigation Bar */}
        <Navbar />

        {/* Global Modals */}
        <AuthModal />
        <OnboardingModal />
        <CartConflictModal />

        {/* Page Content */}
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/build-meal" element={<BuildMealPage />} />
            <Route path="/meal-planner" element={<MealPlannerPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/tracking/:orderId" element={<OrderTrackingPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/seller" element={<SellerDashboardPage />} />
            <Route path="/seller/*" element={<SellerDashboardPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </ErrorBoundary>
  );
}
