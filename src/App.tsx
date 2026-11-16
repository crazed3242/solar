import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AdminDashboard } from './views/AdminDashboard';
import { TechnicianDashboard } from './views/TechnicianDashboard';
import { WorkOrdersView } from './views/WorkOrdersView';
import { DailyActivityView } from './views/DailyActivityView';
import { EquipmentView } from './views/EquipmentView';
import { PreventiveMaintenanceView } from './views/PreventiveMaintenanceView';
import { InventoryView } from './views/InventoryView';
import { ReportsView } from './views/ReportsView';
import { UsersView } from './views/UsersView';
import { AuditTrailView } from './views/AuditTrailView';
import { AcidComplianceView } from './views/AcidComplianceView';
import { LoginPage } from './views/LoginPage';

// Modals
import { WorkOrderDetailModal } from './components/WorkOrderDetailModal';
import { ReportSubmissionModal } from './components/ReportSubmissionModal';
import { CreateWorkOrderModal } from './components/CreateWorkOrderModal';
import { AdminReviewModal } from './components/AdminReviewModal';
import { AssignTechnicianModal } from './components/AssignTechnicianModal';
import { EquipmentHistoryModal } from './components/EquipmentHistoryModal';
import { SupabaseModal } from './components/SupabaseModal';
import { WorkOrder, isAdminRole, isManagerRole } from './types';
import { api } from './services/api';

const AppContent: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  const isAdmin = isAdminRole(currentUser?.role);
  const isManager = isManagerRole(currentUser?.role);

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Sync default tab when user role changes and enforce role permissions
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        const allowedAdminTabs = ['dashboard', 'work_orders', 'daily_activity', 'equipment', 'reports', 'users', 'audit', 'acid_compliance'];
        setActiveTab((prev) => (allowedAdminTabs.includes(prev) ? prev : 'dashboard'));
      } else if (currentUser.role === 'manager') {
        const allowedManagerTabs = ['dashboard', 'work_orders', 'daily_activity', 'equipment', 'preventive', 'inventory'];
        setActiveTab((prev) => (allowedManagerTabs.includes(prev) ? prev : 'dashboard'));
      } else {
        const allowedEmployeeTabs = ['tech_dashboard', 'tech_work_orders', 'daily_activity', 'equipment'];
        setActiveTab((prev) => (allowedEmployeeTabs.includes(prev) ? prev : 'tech_dashboard'));
      }
    }
  }, [currentUser?.role]);

  // Modals state
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [showCreateWO, setShowCreateWO] = useState<boolean>(false);
  const [reportingWO, setReportingWO] = useState<WorkOrder | null>(null);
  const [reviewingWO, setReviewingWO] = useState<WorkOrder | null>(null);
  const [assigningWO, setAssigningWO] = useState<WorkOrder | null>(null);
  const [historyEquipId, setHistoryEquipId] = useState<number | null>(null);
  const [showSupabaseModal, setShowSupabaseModal] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load single work order details for modal
  const openWorkOrderDetail = async (woId: number) => {
    try {
      const wo = await api.getWorkOrder(woId);
      setSelectedWorkOrder(wo);
    } catch (err) {
      console.error('Failed to load work order details:', err);
    }
  };

  const handleModalAction = (action: string, wo: WorkOrder) => {
    setSelectedWorkOrder(null);
    setActionFeedback(null);
    if (action === 'submit_report') {
      setReportingWO(wo);
    } else if (action === 'review') {
      setReviewingWO(wo);
    } else if (action === 'assign') {
      setAssigningWO(wo);
    } else if (action === 'accept') {
      if (currentUser) {
        api.acceptWorkOrder(wo.id, currentUser.id).then(() => {
          setRefreshTrigger((n) => n + 1);
          openWorkOrderDetail(wo.id);
        }).catch((err: any) => setActionFeedback({ type: 'error', message: err.message || 'Failed to accept work order' }));
      }
    } else if (action === 'acknowledge') {
      if (currentUser) {
        api.acknowledgeAssignment(wo.id, currentUser.id).then(() => {
          setRefreshTrigger((n) => n + 1);
          openWorkOrderDetail(wo.id);
        }).catch((err: any) => setActionFeedback({ type: 'error', message: err.message || 'Failed to acknowledge assignment' }));
      }
    } else if (action === 'start') {
      if (currentUser) {
        api.startWork(wo.id, currentUser.id).then(() => {
          setRefreshTrigger((n) => n + 1);
          openWorkOrderDetail(wo.id);
        }).catch((err: any) => setActionFeedback({ type: 'error', message: err.message || 'Failed to start work' }));
      }
    } else if (action === 'hold') {
      if (currentUser) {
        api.holdWork(wo.id, currentUser.id, 'Awaiting components or field clearance').then(() => {
          setRefreshTrigger((n) => n + 1);
          openWorkOrderDetail(wo.id);
        }).catch((err: any) => setActionFeedback({ type: 'error', message: err.message || 'Failed to put work on hold' }));
      }
    } else if (action === 'close') {
      if (currentUser) {
        api.closeWorkOrder(wo.id, currentUser.id, 'Work order verified and completed').then(() => {
          setRefreshTrigger((n) => n + 1);
          openWorkOrderDetail(wo.id);
        }).catch((err: any) => setActionFeedback({ type: 'error', message: err.message || 'Failed to close work order' }));
      }
    } else if (action === 'unassign') {
      if (currentUser) {
        api.unassignWorkOrder(wo.id, currentUser.id, 'Assignment removed by Administrator').then(() => {
          setRefreshTrigger((n) => n + 1);
          setActionFeedback({ type: 'success', message: `Removed employee assignment from ${wo.work_order_code}.` });
          openWorkOrderDetail(wo.id);
        }).catch((err: any) => setActionFeedback({ type: 'error', message: err.message || 'Failed to remove assignment' }));
      }
    } else if (action === 'delete') {
      api.deleteWorkOrder(wo.id).then(() => {
        setRefreshTrigger((n) => n + 1);
        setActionFeedback({ type: 'success', message: `Deleted work order ${wo.work_order_code}.` });
      }).catch((err: any) => setActionFeedback({ type: 'error', message: err.message || 'Failed to delete work order' }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Initializing Solar Panel Power Plant MMS...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onNavigate={(tab) => setActiveTab(tab)}
        onOpenSupabase={() => setShowSupabaseModal(true)}
      />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Workspace Area */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {actionFeedback && (
            <div
              className={`mb-4 p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                actionFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}
            >
              <span>{actionFeedback.message}</span>
              <button onClick={() => setActionFeedback(null)} className="text-[11px] font-mono opacity-80 hover:opacity-100 cursor-pointer">
                Dismiss
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (isAdmin || isManager) && (
            <AdminDashboard
              onNavigate={(tab) => setActiveTab(tab)}
              onSelectWorkOrder={(id) => openWorkOrderDetail(id)}
              onCreateWorkOrder={() => setShowCreateWO(true)}
              refreshKey={refreshTrigger}
            />
          )}

          {activeTab === 'tech_dashboard' && (
            <TechnicianDashboard
              onNavigate={(tab) => setActiveTab(tab)}
              onSelectWorkOrder={(id) => openWorkOrderDetail(id)}
              onSubmitReport={(wo) => setReportingWO(wo)}
            />
          )}

          {(activeTab === 'work_orders' || activeTab === 'tech_work_orders') && (
            <WorkOrdersView
              onSelectWorkOrder={(id) => openWorkOrderDetail(id)}
              onCreateWorkOrder={() => setShowCreateWO(true)}
              refreshKey={refreshTrigger}
            />
          )}

          {activeTab === 'daily_activity' && (
            <DailyActivityView
              onSelectWorkOrder={(id) => openWorkOrderDetail(id)}
            />
          )}

          {activeTab === 'equipment' && (
            <EquipmentView
              onSelectEquipment={(id) => setHistoryEquipId(id)}
              onCreateWorkOrderForAsset={(id) => setShowCreateWO(true)}
            />
          )}

          {activeTab === 'preventive' && isManager && <PreventiveMaintenanceView />}

          {activeTab === 'inventory' && isManager && <InventoryView />}

          {activeTab === 'reports' && isAdmin && <ReportsView />}

          {activeTab === 'users' && isAdmin && <UsersView />}

          {activeTab === 'audit' && isAdmin && <AuditTrailView />}

          {activeTab === 'acid_compliance' && isAdmin && <AcidComplianceView />}
        </main>
      </div>

      {/* Global Modals */}
      {selectedWorkOrder && (
        <WorkOrderDetailModal
          workOrder={selectedWorkOrder}
          onClose={() => setSelectedWorkOrder(null)}
          onAction={handleModalAction}
        />
      )}

      {showCreateWO && (
        <CreateWorkOrderModal
          onClose={() => setShowCreateWO(false)}
          onSuccess={() => {
            setShowCreateWO(false);
            setRefreshTrigger((n) => n + 1);
            setActiveTab('work_orders');
          }}
        />
      )}

      {reportingWO && (
        <ReportSubmissionModal
          workOrder={reportingWO}
          onClose={() => setReportingWO(null)}
          onSuccess={() => {
            setReportingWO(null);
            setRefreshTrigger((n) => n + 1);
            openWorkOrderDetail(reportingWO.id);
          }}
        />
      )}

      {reviewingWO && (
        <AdminReviewModal
          workOrder={reviewingWO}
          onClose={() => setReviewingWO(null)}
          onSuccess={() => {
            setReviewingWO(null);
            setRefreshTrigger((n) => n + 1);
            openWorkOrderDetail(reviewingWO.id);
          }}
        />
      )}

      {assigningWO && (
        <AssignTechnicianModal
          workOrder={assigningWO}
          onClose={() => setAssigningWO(null)}
          onSuccess={() => {
            setAssigningWO(null);
            setRefreshTrigger((n) => n + 1);
            openWorkOrderDetail(assigningWO.id);
          }}
        />
      )}

      {historyEquipId !== null && (
        <EquipmentHistoryModal
          equipmentId={historyEquipId}
          onClose={() => setHistoryEquipId(null)}
          onSelectWorkOrder={(id) => {
            setHistoryEquipId(null);
            openWorkOrderDetail(id);
          }}
        />
      )}

      <SupabaseModal
        isOpen={showSupabaseModal}
        onClose={() => setShowSupabaseModal(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
