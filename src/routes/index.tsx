import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import AdminLayout from '../components/layout/AdminLayout';

// Views
import Login from '../views/Login';
import ForgotPassword from '../views/ForgotPassword';
import VerifyOtp from '../views/VerifyOtp';
import ResetPassword from '../views/ResetPassword';
import Dashboard from '../views/Dashboard';
import UserList from '../views/users/UserList';
import UserForm from '../views/users/UserForm';
import OrderList from '../views/orders/OrderList';
import OrderDetail from '../views/orders/OrderDetail';
import OrderForm from '../views/orders/OrderForm';
import PartnerList from '../views/partners/PartnerList';
import PartnerForm from '../views/partners/PartnerForm';
import CourierList from '../views/couriers/CourierList';
import CourierForm from '../views/couriers/CourierForm';
import AssignmentPanel from '../views/assignments/AssignmentPanel';
import ReconciliationView from '../views/reconciliation/ReconciliationView';
// import PricingView from '../views/pricing/PricingView';
import LabelView from '../views/labels/LabelView';
import OptimizedRoute from '../views/routes/OptimizedRoute';
import NotificationsList from '../views/notifications/NotificationsList';
import ReportingDashboard from '../views/reporting/ReportingDashboard';
import ProfileView from '../views/profile/ProfileView';
import SettingsView from '../views/settings/SettingsView';
import AuditListView from '../views/audit/AuditListView';
import PermissionsView from '../views/permissions/PermissionsView';
import PricingRuleList from '../views/pricing-rules/PricingRuleList';
import PricingRuleForm from '../views/pricing-rules/PricingRuleForm';
import RoleList from '../views/roles/RoleList';
import RoleForm from '../views/roles/RoleForm';
import ZoneList from '../views/zones/ZoneList';
import ZoneForm from '../views/zones/ZoneForm';


function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  return isAuthenticated ? <AdminLayout>{children}</AdminLayout> : <Navigate to="/login" />;
}

function ProtectedRoute({ children, requiredPage }: { children: React.ReactNode; requiredPage: string }) {
  const { isAuthenticated, loading } = useAuth();
  const { canAccess } = usePermissions();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Vérifier l'accès à la page
  if (!canAccess(requiredPage)) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Accès refusé</h1>
            <p className="text-gray-600 dark:text-gray-400">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute requiredPage="/users">
              <UserList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/new"
          element={
            <ProtectedRoute requiredPage="/users">
              <UserForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:uuid"
          element={
            <ProtectedRoute requiredPage="/users">
              <UserForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute requiredPage="/orders">
              <OrderList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/new"
          element={
            <ProtectedRoute requiredPage="/orders">
              <OrderForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:uuid"
          element={
            <ProtectedRoute requiredPage="/orders">
              <OrderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:uuid/edit"
          element={
            <ProtectedRoute requiredPage="/orders">
              <OrderForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partners"
          element={
            <ProtectedRoute requiredPage="/partners">
              <PartnerList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partners/new"
          element={
            <ProtectedRoute requiredPage="/partners">
              <PartnerForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partners/:uuid"
          element={
            <ProtectedRoute requiredPage="/partners">
              <PartnerForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/couriers"
          element={
            <ProtectedRoute requiredPage="/couriers">
              <CourierList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/couriers/new"
          element={
            <ProtectedRoute requiredPage="/couriers">
              <CourierForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/couriers/:uuid"
          element={
            <ProtectedRoute requiredPage="/couriers">
              <CourierForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <ProtectedRoute requiredPage="/assignments">
              <AssignmentPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reconciliation"
          element={
            <ProtectedRoute requiredPage="/reconciliation">
              <ReconciliationView />
            </ProtectedRoute>
          }
        />
        {/* Route Tarification désactivée - Calcul automatique dans les commandes */}
        {/* <Route
          path="/pricing"
          element={
            <ProtectedRoute requiredPage="/pricing">
              <PricingView />
            </ProtectedRoute>
          }
        /> */}
        <Route
          path="/labels"
          element={
            <ProtectedRoute requiredPage="/labels">
              <LabelView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/routes"
          element={
            <ProtectedRoute requiredPage="/routes">
              <OptimizedRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <PrivateRoute>
              <NotificationsList />
            </PrivateRoute>
          }
        />
        <Route
          path="/reporting"
          element={
            <ProtectedRoute requiredPage="/reporting">
              <ReportingDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfileView />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsView />
            </PrivateRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedRoute requiredPage="/audit">
              <AuditListView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/permissions"
          element={
            <ProtectedRoute requiredPage="/permissions">
              <PermissionsView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <ProtectedRoute requiredPage="/permissions">
              <RoleList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles/new"
          element={
            <ProtectedRoute requiredPage="/permissions">
              <RoleForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles/:uuid"
          element={
            <ProtectedRoute requiredPage="/permissions">
              <RoleForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pricing-rules"
          element={
            <ProtectedRoute requiredPage="/pricing">
              <PricingRuleList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pricing-rules/new"
          element={
            <ProtectedRoute requiredPage="/pricing">
              <PricingRuleForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pricing-rules/:uuid"
          element={
            <ProtectedRoute requiredPage="/pricing">
              <PricingRuleForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/zones"
          element={
            <ProtectedRoute requiredPage="/zones">
              <ZoneList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/zones/new"
          element={
            <ProtectedRoute requiredPage="/zones">
              <ZoneForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/zones/:uuid/edit"
          element={
            <ProtectedRoute requiredPage="/zones">
              <ZoneForm />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

