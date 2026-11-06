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
import { WorkOrder } from './types';
import { api } from './services/api';

const AppContent: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Sync default tab when user role changes and enforce role permissions
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        setActiveTab((prev) => (prev.startsWith('tech_') ? 'dashboard' : prev));
      } else {
        const allowedTechTabs = ['tech_dashboard', 'tech_work_orders', 'daily_activity', 'equipment', 'inventory'];
        setActiveTab((prev) => (allowedTechTabs.includes(prev) ? prev : 'tech_dashboard'));
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
    if (action === 'submit_report') {
      setReportingWO(wo);
    } else if (action === 'review') {
      setReviewingWO(wo);
    } else if (action === 'assign') {
      setAssigningWO(wo);
    } else if (action === 'accept') {
      if (currentUser) {
        api.acceptWorkOrder(wo.id, currentUser.id).then(() => {
          openWorkOrderDetail(wo.id);
        });
      }
    } else if (action === 'acknowledge') {
      if (currentUser) {
        api.acknowledgeAssignment(wo.id, currentUser.id).then(() => {
          openWorkOrderDetail(wo.id);
        });
      }
    } else if (action === 'start') {
      if (currentUser) {
        api.startWork(wo.id, currentUser.id).then(() => {
          openWorkOrderDetail(wo.id);
        });
      }
    } else if (action === 'hold') {
      if (currentUser) {
        api.holdWork(wo.id, currentUser.id, 'Awaiting components or field clearance').then(() => {
          openWorkOrderDetail(wo.id);
        });
      }
    } else if (action === 'close') {
      if (currentUser) {
        api.closeWorkOrder(wo.id, currentUser.id, 'Work order verified and completed').then(() => {
          openWorkOrderDetail(wo.id);
        });
      }
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
          {activeTab === 'dashboard' && (
            <AdminDashboard
              onNavigate={(tab) => setActiveTab(tab)}
              onSelectWorkOrder={(id) => openWorkOrderDetail(id)}
              onCreateWorkOrder={() => setShowCreateWO(true)}
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

          {activeTab === 'preventive' && isAdmin && <PreventiveMaintenanceView />}

          {activeTab === 'inventory' && <InventoryView />}

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
