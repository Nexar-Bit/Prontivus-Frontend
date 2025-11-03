/**
 * Migration Tracker
 * Track migration status of components and pages
 */

export type MigrationStatus = "pending" | "in-progress" | "completed" | "blocked";
export type MigrationPriority = "high" | "medium" | "low";

export interface ComponentMigration {
  id: string;
  name: string;
  path: string;
  status: MigrationStatus;
  priority: MigrationPriority;
  dependsOn?: string[];
  notes?: string;
  completedAt?: string;
}

export const componentMigrations: ComponentMigration[] = [
  // Core UI Components
  {
    id: "button",
    name: "Button Component",
    path: "src/components/ui/button.tsx",
    status: "in-progress",
    priority: "high",
    notes: "Enhance with medical styling",
  },
  {
    id: "input",
    name: "Input Component",
    path: "src/components/ui/input.tsx",
    status: "in-progress",
    priority: "high",
    notes: "Enhance with medical styling",
  },
  {
    id: "card",
    name: "Card Component",
    path: "src/components/ui/card.tsx",
    status: "in-progress",
    priority: "high",
    notes: "Add medical card variant",
  },
  
  // Navigation
  {
    id: "sidebar",
    name: "App Sidebar",
    path: "src/components/app-sidebar.tsx",
    status: "completed",
    priority: "high",
    completedAt: "2024-01-01",
  },
  {
    id: "header",
    name: "App Header",
    path: "src/components/app-header.tsx",
    status: "completed",
    priority: "high",
    completedAt: "2024-01-01",
  },
  
  // Forms
  {
    id: "medical-forms",
    name: "Medical Form Components",
    path: "src/components/medical-forms",
    status: "completed",
    priority: "high",
    completedAt: "2024-01-01",
  },
  {
    id: "patient-form",
    name: "Patient Registration Form",
    path: "src/components/medical-forms/enhanced-patient-form.tsx",
    status: "completed",
    priority: "high",
    completedAt: "2024-01-01",
  },
  
  // Patient Profile
  {
    id: "patient-profile",
    name: "Patient Profile",
    path: "src/components/patient-profile",
    status: "completed",
    priority: "high",
    completedAt: "2024-01-01",
  },
  
  // Documents
  {
    id: "documents",
    name: "Medical Document Templates",
    path: "src/components/documents",
    status: "completed",
    priority: "medium",
    completedAt: "2024-01-01",
  },
  
  // Dashboard
  {
    id: "dashboard",
    name: "Main Dashboard",
    path: "src/app/(dashboard)/page.tsx",
    status: "completed",
    priority: "high",
    completedAt: "2024-01-01",
  },
  {
    id: "dashboard-components",
    name: "Dashboard Components",
    path: "src/components/dashboard",
    status: "completed",
    priority: "high",
    completedAt: "2024-01-01",
  },
  
  // Animations
  {
    id: "animations",
    name: "Micro-interactions",
    path: "src/components/animations",
    status: "completed",
    priority: "medium",
    completedAt: "2024-01-01",
  },
  
  // Assets
  {
    id: "assets",
    name: "Image Asset System",
    path: "src/components/assets",
    status: "completed",
    priority: "low",
    completedAt: "2024-01-01",
  },
  
  // Pending Migrations
  {
    id: "table",
    name: "Table Component",
    path: "src/components/ui/table.tsx",
    status: "pending",
    priority: "high",
    notes: "Add medical styling and variants",
  },
  {
    id: "select",
    name: "Select Component",
    path: "src/components/ui/select.tsx",
    status: "pending",
    priority: "high",
    notes: "Enhance with medical styling",
  },
  {
    id: "textarea",
    name: "Textarea Component",
    path: "src/components/ui/textarea.tsx",
    status: "pending",
    priority: "medium",
    notes: "Add medical form integration",
  },
  
  // Pages - High Priority
  {
    id: "login-page",
    name: "Login Page",
    path: "src/app/login/page.tsx",
    status: "pending",
    priority: "high",
  },
  {
    id: "appointments-page",
    name: "Appointments Page",
    path: "src/app/(dashboard)/secretaria/agendamentos",
    status: "completed",
    priority: "high",
    completedAt: "2024-01-01",
  },
  {
    id: "patients-page",
    name: "Patients List Page",
    path: "src/app/(dashboard)/secretaria/pacientes",
    status: "pending",
    priority: "high",
  },
  
  // Pages - Medium Priority
  {
    id: "financial-pages",
    name: "Financial Module",
    path: "src/app/(dashboard)/financeiro",
    status: "pending",
    priority: "medium",
  },
  {
    id: "reports-pages",
    name: "Reports Pages",
    path: "src/app/(dashboard)/relatorios",
    status: "pending",
    priority: "medium",
  },
  
  // Pages - Low Priority
  {
    id: "settings-page",
    name: "Settings Page",
    path: "src/app/(dashboard)/settings",
    status: "pending",
    priority: "low",
  },
  {
    id: "admin-pages",
    name: "Admin Pages",
    path: "src/app/(dashboard)/admin",
    status: "pending",
    priority: "low",
  },
];

/**
 * Get migration status summary
 */
export function getMigrationSummary() {
  const total = componentMigrations.length;
  const completed = componentMigrations.filter((m) => m.status === "completed").length;
  const inProgress = componentMigrations.filter((m) => m.status === "in-progress").length;
  const pending = componentMigrations.filter((m) => m.status === "pending").length;
  const blocked = componentMigrations.filter((m) => m.status === "blocked").length;
  
  return {
    total,
    completed,
    inProgress,
    pending,
    blocked,
    progress: Math.round((completed / total) * 100),
  };
}

/**
 * Get migrations by priority
 */
export function getMigrationsByPriority(priority: MigrationPriority) {
  return componentMigrations.filter((m) => m.priority === priority);
}

/**
 * Get migrations by status
 */
export function getMigrationsByStatus(status: MigrationStatus) {
  return componentMigrations.filter((m) => m.status === status);
}

/**
 * Update migration status
 */
export function updateMigrationStatus(
  id: string,
  status: MigrationStatus,
  notes?: string
) {
  const migration = componentMigrations.find((m) => m.id === id);
  if (migration) {
    migration.status = status;
    if (status === "completed") {
      migration.completedAt = new Date().toISOString();
    }
    if (notes) {
      migration.notes = notes;
    }
  }
}

