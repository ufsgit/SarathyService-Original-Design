import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  {
    path: 'admin',
    loadComponent: () => import('./shared/layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'change-password', loadComponent: () => import('./features/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent) },
      // Branch
      { path: 'branch/add', loadComponent: () => import('./features/branch/add-branch/add-branch.component').then(m => m.AddBranchComponent), canActivate: [adminGuard] },
      { path: 'branch/list', loadComponent: () => import('./features/branch/list-branch/list-branch.component').then(m => m.ListBranchComponent) },
      { path: 'branch/edit/:id', loadComponent: () => import('./features/branch/edit-branch/edit-branch.component').then(m => m.EditBranchComponent), canActivate: [adminGuard] },
      // Employee
      { path: 'employee/add', loadComponent: () => import('./features/employee/add-employee/add-employee.component').then(m => m.AddEmployeeComponent), canActivate: [adminGuard] },
      { path: 'employee/list', loadComponent: () => import('./features/employee/list-employee/list-employee.component').then(m => m.ListEmployeeComponent) },
      { path: 'employee/edit/:id', loadComponent: () => import('./features/employee/edit-employee/edit-employee.component').then(m => m.EditEmployeeComponent), canActivate: [adminGuard] },
      // Labour
      { path: 'labour/add', loadComponent: () => import('./features/labour/add-labour/add-labour.component').then(m => m.AddLabourComponent), canActivate: [adminGuard] },
      { path: 'labour/list', loadComponent: () => import('./features/labour/list-labour/list-labour.component').then(m => m.ListLabourComponent) },
      { path: 'labour/edit/:id', loadComponent: () => import('./features/labour/edit-labour/edit-labour.component').then(m => m.EditLabourComponent), canActivate: [adminGuard] },
      // Customer
      { path: 'customer/add', loadComponent: () => import('./features/customer/add-customer/add-customer.component').then(m => m.AddCustomerComponent) },
      { path: 'customer/list', loadComponent: () => import('./features/customer/list-customer/list-customer.component').then(m => m.ListCustomerComponent) },
      { path: 'customer/edit/:id', loadComponent: () => import('./features/customer/edit-customer/edit-customer.component').then(m => m.EditCustomerComponent) },
      // Vehicle Model
      { path: 'model/add', loadComponent: () => import('./features/vehicle-model/add-model/add-model.component').then(m => m.AddModelComponent), canActivate: [adminGuard] },
      { path: 'model/list', loadComponent: () => import('./features/vehicle-model/list-model/list-model.component').then(m => m.ListModelComponent) },
      { path: 'model/edit/:id', loadComponent: () => import('./features/vehicle-model/edit-model/edit-model.component').then(m => m.EditModelComponent), canActivate: [adminGuard] },
      // Insurance Company
      { path: 'insurance/add', loadComponent: () => import('./features/insurance-company/add-insurance/add-insurance.component').then(m => m.AddInsuranceComponent), canActivate: [adminGuard] },
      { path: 'insurance/list', loadComponent: () => import('./features/insurance-company/list-insurance/list-insurance.component').then(m => m.ListInsuranceComponent) },
      { path: 'insurance/edit/:id', loadComponent: () => import('./features/insurance-company/edit-insurance/edit-insurance.component').then(m => m.EditInsuranceComponent), canActivate: [adminGuard] },
      // Invoice
      { path: 'invoice/labour', loadComponent: () => import('./features/invoice/labour-invoice/labour-invoice.component').then(m => m.LabourInvoiceComponent) },
      { path: 'invoice/labour/:id', loadComponent: () => import('./features/invoice/labour-invoice/labour-invoice.component').then(m => m.LabourInvoiceComponent) },

      { path: 'invoice/insurance', loadComponent: () => import('./features/invoice/insurance-invoice/insurance-invoice.component').then(m => m.InsuranceInvoiceComponent) },
      { path: 'invoice/insurance/:id', loadComponent: () => import('./features/invoice/insurance-invoice/insurance-invoice.component').then(m => m.InsuranceInvoiceComponent) },

      { path: 'invoice/list', loadComponent: () => import('./features/invoice/invoice-list/invoice-list.component').then(m => m.InvoiceListComponent) },
      { path: 'invoice/edit/:id', loadComponent: () => import('./features/invoice/invoice-edit/invoice-edit.component').then(m => m.InvoiceEditComponent) },
      { path: 'invoice/ready/labour', loadComponent: () => import('./features/invoice/ready-bills/ready-bills.component').then(m => m.ReadyBillsComponent), data: { type: 'labour' } },
      { path: 'invoice/ready/insurance', loadComponent: () => import('./features/invoice/ready-bills/ready-bills.component').then(m => m.ReadyBillsComponent), data: { type: 'insurance' } },
      // Reports
      { path: 'reports/job-card-summary', loadComponent: () => import('./features/reports/job-card-summary/job-card-summary.component').then(m => m.JobCardSummaryComponent) },
      { path: 'reports/job-card-statement', loadComponent: () => import('./features/reports/job-card-statement/job-card-statement.component').then(m => m.JobCardStatementComponent) },
      { path: 'reports/previous-bills/labour', loadComponent: () => import('./features/reports/previous-bills/previous-bills.component').then(m => m.PreviousBillsComponent), data: { type: 'labour' } },
      { path: 'reports/previous-bills/insurance', loadComponent: () => import('./features/reports/previous-bills/previous-bills.component').then(m => m.PreviousBillsComponent), data: { type: 'insurance' } },
      // Vehicle History
      { path: 'vehicle-history', loadComponent: () => import('./features/vehicle-history/vehicle-history.component').then(m => m.VehicleHistoryComponent) },
    ]
  },
  {
    path: 'staff',
    loadComponent: () => import('./shared/layouts/staff-layout/staff-layout.component').then(m => m.StaffLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/staff-dashboard.component').then(m => m.StaffDashboardComponent) },
      { path: 'change-password', loadComponent: () => import('./features/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent) },
      // Customer
      { path: 'customer/add', loadComponent: () => import('./features/customer/add-customer/add-customer.component').then(m => m.AddCustomerComponent) },
      { path: 'customer/list', loadComponent: () => import('./features/customer/list-customer/list-customer.component').then(m => m.ListCustomerComponent) },
      { path: 'customer/edit/:id', loadComponent: () => import('./features/customer/edit-customer/edit-customer.component').then(m => m.EditCustomerComponent) },
      // Invoice
      { path: 'invoice/labour', loadComponent: () => import('./features/invoice/labour-invoice/labour-invoice.component').then(m => m.LabourInvoiceComponent) },
      { path: 'invoice/labour/:id', loadComponent: () => import('./features/invoice/labour-invoice/labour-invoice.component').then(m => m.LabourInvoiceComponent) },

      { path: 'invoice/insurance', loadComponent: () => import('./features/invoice/insurance-invoice/insurance-invoice.component').then(m => m.InsuranceInvoiceComponent) },
      { path: 'invoice/insurance/:id', loadComponent: () => import('./features/invoice/insurance-invoice/insurance-invoice.component').then(m => m.InsuranceInvoiceComponent) },

      { path: 'invoice/list', loadComponent: () => import('./features/invoice/invoice-list/invoice-list.component').then(m => m.InvoiceListComponent) },
      { path: 'invoice/edit/:id', loadComponent: () => import('./features/invoice/invoice-edit/invoice-edit.component').then(m => m.InvoiceEditComponent) },
      { path: 'invoice/ready/labour', loadComponent: () => import('./features/invoice/ready-bills/ready-bills.component').then(m => m.ReadyBillsComponent), data: { type: 'labour' } },
      { path: 'invoice/ready/insurance', loadComponent: () => import('./features/invoice/ready-bills/ready-bills.component').then(m => m.ReadyBillsComponent), data: { type: 'insurance' } },
      // Reports
      { path: 'reports/job-card-summary', loadComponent: () => import('./features/reports/job-card-summary/job-card-summary.component').then(m => m.JobCardSummaryComponent) },
      { path: 'reports/job-card-statement', loadComponent: () => import('./features/reports/job-card-statement/job-card-statement.component').then(m => m.JobCardStatementComponent) },
      { path: 'reports/previous-bills/labour', loadComponent: () => import('./features/reports/previous-bills/previous-bills.component').then(m => m.PreviousBillsComponent), data: { type: 'labour' } },
      { path: 'reports/previous-bills/insurance', loadComponent: () => import('./features/reports/previous-bills/previous-bills.component').then(m => m.PreviousBillsComponent), data: { type: 'insurance' } },
      // Vehicle History
      { path: 'vehicle-history', loadComponent: () => import('./features/vehicle-history/vehicle-history.component').then(m => m.VehicleHistoryComponent) },
    ]
  },
  { path: '**', redirectTo: '/login' }
];
