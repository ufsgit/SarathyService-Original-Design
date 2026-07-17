import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent), title: 'Login' },
  {
    path: 'admin',
    loadComponent: () => import('./shared/layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), title: 'Dashboard' },
      { path: 'change-password', loadComponent: () => import('./features/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent), title: 'Change Password' },
      // Branch
      { path: 'branch/add', loadComponent: () => import('./features/branch/add-branch/add-branch.component').then(m => m.AddBranchComponent), canActivate: [adminGuard], title: 'Add Branch' },
      { path: 'branch/list', loadComponent: () => import('./features/branch/list-branch/list-branch.component').then(m => m.ListBranchComponent), title: 'Branch List' },
      { path: 'branch/edit/:id', loadComponent: () => import('./features/branch/edit-branch/edit-branch.component').then(m => m.EditBranchComponent), canActivate: [adminGuard], title: 'Edit Branch' },
      // Employee
      { path: 'employee/add', loadComponent: () => import('./features/employee/add-employee/add-employee.component').then(m => m.AddEmployeeComponent), canActivate: [adminGuard], title: 'Add Employee' },
      { path: 'employee/list', loadComponent: () => import('./features/employee/list-employee/list-employee.component').then(m => m.ListEmployeeComponent), title: 'Employee List' },
      { path: 'employee/edit/:id', loadComponent: () => import('./features/employee/edit-employee/edit-employee.component').then(m => m.EditEmployeeComponent), canActivate: [adminGuard], title: 'Edit Employee' },
      // Labour
      { path: 'labour/add', loadComponent: () => import('./features/labour/add-labour/add-labour.component').then(m => m.AddLabourComponent), canActivate: [adminGuard], title: 'Add Labour' },
      { path: 'labour/list', loadComponent: () => import('./features/labour/list-labour/list-labour.component').then(m => m.ListLabourComponent), title: 'Labour List' },
      { path: 'labour/edit/:id', loadComponent: () => import('./features/labour/edit-labour/edit-labour.component').then(m => m.EditLabourComponent), canActivate: [adminGuard], title: 'Edit Labour' },
      // Customer
      { path: 'customer/add', loadComponent: () => import('./features/customer/add-customer/add-customer.component').then(m => m.AddCustomerComponent), title: 'Add Customer' },
      { path: 'customer/list', loadComponent: () => import('./features/customer/list-customer/list-customer.component').then(m => m.ListCustomerComponent), title: 'Customer List' },
      { path: 'customer/edit/:id', loadComponent: () => import('./features/customer/edit-customer/edit-customer.component').then(m => m.EditCustomerComponent), title: 'Edit Customer' },
      // Vehicle Model
      { path: 'model/add', loadComponent: () => import('./features/vehicle-model/add-model/add-model.component').then(m => m.AddModelComponent), canActivate: [adminGuard], title: 'Add Model' },
      { path: 'model/list', loadComponent: () => import('./features/vehicle-model/list-model/list-model.component').then(m => m.ListModelComponent), title: 'Model List' },
      { path: 'model/edit/:id', loadComponent: () => import('./features/vehicle-model/edit-model/edit-model.component').then(m => m.EditModelComponent), canActivate: [adminGuard], title: 'Edit Model' },
      // Logo Master
      { path: 'logomaster', loadComponent: () => import('./admin-logomaster/admin-logomaster').then(m => m.AdminLogomaster), canActivate: [adminGuard], title: 'Logo Master' },
      // Insurance Company
      { path: 'insurance/add', loadComponent: () => import('./features/insurance-company/add-insurance/add-insurance.component').then(m => m.AddInsuranceComponent), canActivate: [adminGuard], title: 'Add Insurance Company' },
      { path: 'insurance/list', loadComponent: () => import('./features/insurance-company/list-insurance/list-insurance.component').then(m => m.ListInsuranceComponent), title: 'Insurance Company List' },
      { path: 'insurance/edit/:id', loadComponent: () => import('./features/insurance-company/edit-insurance/edit-insurance.component').then(m => m.EditInsuranceComponent), canActivate: [adminGuard], title: 'Edit Insurance Company' },
      // Invoice
      { path: 'invoice/labour', loadComponent: () => import('./features/invoice/labour-invoice/labour-invoice.component').then(m => m.LabourInvoiceComponent), title: 'Labour Invoice' },
      { path: 'invoice/labour/:id', loadComponent: () => import('./features/invoice/labour-invoice/labour-invoice.component').then(m => m.LabourInvoiceComponent), title: 'Labour Invoice' },

      { path: 'invoice/insurance', loadComponent: () => import('./features/invoice/insurance-invoice/insurance-invoice.component').then(m => m.InsuranceInvoiceComponent), title: 'Insurance Invoice' },
      { path: 'invoice/insurance/:id', loadComponent: () => import('./features/invoice/insurance-invoice/insurance-invoice.component').then(m => m.InsuranceInvoiceComponent), title: 'Insurance Invoice' },

      { path: 'invoice/list', loadComponent: () => import('./features/invoice/invoice-list/invoice-list.component').then(m => m.InvoiceListComponent), title: 'Invoice List' },
      { path: 'invoice/edit/:id', loadComponent: () => import('./features/invoice/invoice-edit/invoice-edit.component').then(m => m.InvoiceEditComponent), title: 'Edit Invoice' },
      { path: 'invoice/ready/labour', loadComponent: () => import('./features/invoice/ready-bills/ready-bills.component').then(m => m.ReadyBillsComponent), data: { type: 'labour' }, title: 'Ready for Bill List(Labour)' },
      { path: 'invoice/ready/insurance', loadComponent: () => import('./features/invoice/ready-bills/ready-bills.component').then(m => m.ReadyBillsComponent), data: { type: 'insurance' }, title: 'Ready for Bill List(Insurance)' },
      // Reports
      { path: 'reports/job-card-summary', loadComponent: () => import('./features/reports/job-card-summary/job-card-summary.component').then(m => m.JobCardSummaryComponent), title: 'Job Card Summary' },
      { path: 'reports/job-card-statement', loadComponent: () => import('./features/reports/job-card-statement/job-card-statement.component').then(m => m.JobCardStatementComponent), title: 'Job Card Statement' },
      { path: 'reports/previous-bills/labour', loadComponent: () => import('./features/reports/previous-bills/previous-bills.component').then(m => m.PreviousBillsComponent), data: { type: 'labour' }, title: 'Previous Bills(Labour)' },
      { path: 'reports/previous-bills/insurance', loadComponent: () => import('./features/reports/previous-bills/previous-bills.component').then(m => m.PreviousBillsComponent), data: { type: 'insurance' }, title: 'Previous Bills(Insurance)' },
      { path: 'reports/job-card-detail/:id', loadComponent: () => import('./features/reports/job-card-detail/job-card-detail.component').then(m => m.JobCardDetailComponent), title: 'Job Card Detail' },
      // Vehicle History
      { path: 'vehicle-history', loadComponent: () => import('./features/vehicle-history/vehicle-history.component').then(m => m.VehicleHistoryComponent), title: 'Vehicle History' },
    ]
  },
  {
    path: 'staff',
    loadComponent: () => import('./shared/layouts/staff-layout/staff-layout.component').then(m => m.StaffLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/staff-dashboard.component').then(m => m.StaffDashboardComponent), title: 'Dashboard' },
      { path: 'change-password', loadComponent: () => import('./features/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent), title: 'Change Password' },
      // Customer
      { path: 'customer/add', loadComponent: () => import('./features/customer/add-customer/add-customer.component').then(m => m.AddCustomerComponent), title: 'Add Customer' },
      { path: 'customer/list', loadComponent: () => import('./features/customer/list-customer/list-customer.component').then(m => m.ListCustomerComponent), title: 'Customer List' },
      { path: 'customer/edit/:id', loadComponent: () => import('./features/customer/edit-customer/edit-customer.component').then(m => m.EditCustomerComponent), title: 'Edit Customer' },
      // Invoice
      { path: 'invoice/labour', loadComponent: () => import('./features/invoice/labour-invoice/labour-invoice.component').then(m => m.LabourInvoiceComponent), title: 'Labour Invoice' },
      { path: 'invoice/labour/:id', loadComponent: () => import('./features/invoice/labour-invoice/labour-invoice.component').then(m => m.LabourInvoiceComponent), title: 'Labour Invoice' },

      { path: 'invoice/insurance', loadComponent: () => import('./features/invoice/insurance-invoice/insurance-invoice.component').then(m => m.InsuranceInvoiceComponent), title: 'Insurance Invoice' },
      { path: 'invoice/insurance/:id', loadComponent: () => import('./features/invoice/insurance-invoice/insurance-invoice.component').then(m => m.InsuranceInvoiceComponent), title: 'Insurance Invoice' },

      { path: 'invoice/list', loadComponent: () => import('./features/invoice/invoice-list/invoice-list.component').then(m => m.InvoiceListComponent), title: 'Invoice List' },
      { path: 'invoice/edit/:id', loadComponent: () => import('./features/invoice/invoice-edit/invoice-edit.component').then(m => m.InvoiceEditComponent), title: 'Edit Invoice' },
      { path: 'invoice/ready/labour', loadComponent: () => import('./features/invoice/ready-bills/ready-bills.component').then(m => m.ReadyBillsComponent), data: { type: 'labour' }, title: 'Ready for Bill List(Labour)' },
      { path: 'invoice/ready/insurance', loadComponent: () => import('./features/invoice/ready-bills/ready-bills.component').then(m => m.ReadyBillsComponent), data: { type: 'insurance' }, title: 'Ready for Bill List(Insurance)' },
      // Reports
      { path: 'reports/job-card-summary', loadComponent: () => import('./features/reports/job-card-summary/job-card-summary.component').then(m => m.JobCardSummaryComponent), title: 'Job Card Summary' },
      { path: 'reports/job-card-statement', loadComponent: () => import('./features/reports/job-card-statement/job-card-statement.component').then(m => m.JobCardStatementComponent), title: 'Job Card Statement' },
      { path: 'reports/previous-bills/labour', loadComponent: () => import('./features/reports/previous-bills/previous-bills.component').then(m => m.PreviousBillsComponent), data: { type: 'labour' }, title: 'Previous Bills(Labour)' },
      { path: 'reports/previous-bills/insurance', loadComponent: () => import('./features/reports/previous-bills/previous-bills.component').then(m => m.PreviousBillsComponent), data: { type: 'insurance' }, title: 'Previous Bills(Insurance)' },
      { path: 'reports/job-card-detail/:id', loadComponent: () => import('./features/reports/job-card-detail/job-card-detail.component').then(m => m.JobCardDetailComponent), title: 'Job Card Detail' },
      // Vehicle History
      { path: 'vehicle-history', loadComponent: () => import('./features/vehicle-history/vehicle-history.component').then(m => m.VehicleHistoryComponent), title: 'Vehicle History' },
    ]
  },
  { path: '**', redirectTo: '/login' }
];
