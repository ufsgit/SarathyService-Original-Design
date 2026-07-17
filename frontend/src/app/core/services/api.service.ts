import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // --- Brand ---
  getActiveBrand(): Observable<any> { return this.http.get<any>(`${this.baseUrl}/brand/active`); }

  // --- Branches ---
  getBranches(): Observable<any[]> { return this.http.get<any[]>(`${this.baseUrl}/branches`); }
  getBranch(id: number): Observable<any> { return this.http.get<any>(`${this.baseUrl}/branches/${id}`); }
  createBranch(data: any): Observable<any> { return this.http.post(`${this.baseUrl}/branches`, data); }
  updateBranch(id: number, data: any): Observable<any> { return this.http.put(`${this.baseUrl}/branches/${id}`, data); }
  deleteBranch(id: number): Observable<any> { return this.http.delete(`${this.baseUrl}/branches/${id}`); }
  getPaginatedBranches(page: number = 1, pageSize: number = 10, search: string = ''): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/branches/paginated`, { params: { page: page.toString(), pageSize: pageSize.toString(), search } });
  }

  // --- Employees ---
  getEmployees(): Observable<any[]> { return this.http.get<any[]>(`${this.baseUrl}/employees`); }
  getEmployee(id: number): Observable<any> { return this.http.get<any>(`${this.baseUrl}/employees/${id}`); }
  createEmployee(data: any): Observable<any> { return this.http.post(`${this.baseUrl}/employees`, data); }
  updateEmployee(id: number, data: any): Observable<any> { return this.http.put(`${this.baseUrl}/employees/${id}`, data); }
  updateEmployeeStatus(id: number, status: any): Observable<any> { return this.http.put(`${this.baseUrl}/employees/${id}/status`, { status }); }
  updateEmployeeLogin(id: number, data: any): Observable<any> { return this.http.put(`${this.baseUrl}/employees/${id}/login`, data); }
  getEmployeeLogin(id: number): Observable<any> { return this.http.get(`${this.baseUrl}/employees/${id}/login`); }
  deleteEmployee(id: number): Observable<any> { return this.http.delete(`${this.baseUrl}/employees/${id}`); }
  getPaginatedEmployees(page: number = 1, pageSize: number = 10, search: string = ''): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/employees/paginated`, { params: { page: page.toString(), pageSize: pageSize.toString(), search } });
  }
  getMechanics(branchId?: number): Observable<any[]> {
    const params: any = {};
    if (branchId) params['branchId'] = branchId.toString();
    return this.http.get<any[]>(`${this.baseUrl}/employees/mechanics`, { params });
  }
  getAdvisors(branchId?: number): Observable<any[]> {
    const params: any = {};
    if (branchId) params['branchId'] = branchId.toString();
    return this.http.get<any[]>(`${this.baseUrl}/employees/advisors`, { params });
  }

  // --- Labours ---
  getLabours(): Observable<any[]> { return this.http.get<any[]>(`${this.baseUrl}/labours`); }
  getLabour(id: number): Observable<any> { return this.http.get<any>(`${this.baseUrl}/labours/${id}`); }
  createLabour(data: any): Observable<any> { return this.http.post(`${this.baseUrl}/labours`, data); }
  updateLabour(id: number, data: any): Observable<any> { return this.http.put(`${this.baseUrl}/labours/${id}`, data); }
  deleteLabour(id: number): Observable<any> { return this.http.delete(`${this.baseUrl}/labours/${id}`); }
  getPaginatedLabours(page: number = 1, pageSize: number = 10, search: string = ''): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/labours/paginated`, { params: { page: page.toString(), pageSize: pageSize.toString(), search } });
  }

  // --- Customers ---
  getPaginatedCustomers(page: number = 1, pageSize: number = 10, search: string = ''): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/customers/paginated`, { params: { page: page.toString(), pageSize: pageSize.toString(), search } });
  }
  getCustomers(branchId?: number): Observable<any[]> {
    const params: any = {};
    if (branchId) params['branchId'] = branchId.toString();
    return this.http.get<any[]>(`${this.baseUrl}/customers`, { params });
  }
  getCustomer(id: number): Observable<any> { return this.http.get<any>(`${this.baseUrl}/customers/${id}`); }
  getCustomerByReg(regNo: string): Observable<any> { return this.http.get<any>(`${this.baseUrl}/customers/reg/${regNo}`); }
  searchCustomers(q: string): Observable<any[]> { return this.http.get<any[]>(`${this.baseUrl}/customers/search`, { params: { q } }); }
  createCustomer(data: any): Observable<any> { return this.http.post(`${this.baseUrl}/customers`, data); }
  updateCustomer(id: number, data: any): Observable<any> { return this.http.put(`${this.baseUrl}/customers/${id}`, data); }
  deleteCustomer(id: number): Observable<any> { return this.http.delete(`${this.baseUrl}/customers/${id}`); }
  checkRegistration(reg_no: string): Observable<any> { return this.http.post(`${this.baseUrl}/customers/check-registration`, { reg_no }); }

  // --- Vehicle Models ---
  getModels(): Observable<any[]> { return this.http.get<any[]>(`${this.baseUrl}/models`); }
  getModel(id: number): Observable<any> { return this.http.get<any>(`${this.baseUrl}/models/${id}`); }
  createModel(data: any): Observable<any> { return this.http.post(`${this.baseUrl}/models`, data); }
  updateModel(id: number, data: any): Observable<any> { return this.http.put(`${this.baseUrl}/models/${id}`, data); }
  deleteModel(id: number): Observable<any> { return this.http.delete(`${this.baseUrl}/models/${id}`); }
  getPaginatedModels(page: number = 1, pageSize: number = 10, search: string = ''): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/models/paginated`, { params: { page: page.toString(), pageSize: pageSize.toString(), search } });
  }

  // --- Insurance Companies ---
  getInsuranceCompanies(): Observable<any[]> { return this.http.get<any[]>(`${this.baseUrl}/insurance-companies`); }
  getInsuranceCompany(id: number): Observable<any> { return this.http.get<any>(`${this.baseUrl}/insurance-companies/${id}`); }
  createInsuranceCompany(data: any): Observable<any> { return this.http.post(`${this.baseUrl}/insurance-companies`, data); }
  updateInsuranceCompany(id: number, data: any): Observable<any> { return this.http.put(`${this.baseUrl}/insurance-companies/${id}`, data); }
  deleteInsuranceCompany(id: number): Observable<any> { return this.http.delete(`${this.baseUrl}/insurance-companies/${id}`); }
  getPaginatedInsurance(page: number = 1, pageSize: number = 10, search: string = ''): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/insurance-companies/paginated`, { params: { page: page.toString(), pageSize: pageSize.toString(), search } });
  }

  // --- Invoices ---
  createLabourInvoice(data: any): Observable<any> { return this.http.post(`${this.baseUrl}/invoices/labour`, data); }
  createInsuranceInvoice(data: any): Observable<any> { return this.http.post(`${this.baseUrl}/invoices/insurance`, data); }
  getLabourInvoices(branchId?: number): Observable<any[]> {
    const url = branchId ? `${this.baseUrl}/invoices/labour/list?branchId=${branchId}` : `${this.baseUrl}/invoices/labour/list`;
    return this.http.get<any[]>(url);
  }
  getInsuranceInvoices(branchId?: number): Observable<any[]> {
    const url = branchId ? `${this.baseUrl}/invoices/insurance/list?branchId=${branchId}` : `${this.baseUrl}/invoices/insurance/list`;
    return this.http.get<any[]>(url);
  }
  getInvoice(id: number): Observable<any> { return this.http.get<any>(`${this.baseUrl}/invoices/${id}`); }
  updateInvoice(id: number, data: any): Observable<any> { return this.http.put(`${this.baseUrl}/invoices/${id}`, data); }
  markInvoiceReady(id: number): Observable<any> { return this.http.put(`${this.baseUrl}/invoices/${id}/ready`, {}); }
  getReadyLabourBills(params?: any): Observable<any> { return this.http.get<any>(`${this.baseUrl}/invoices/ready/labour`, { params }); }
  getReadyInsuranceBills(params?: any): Observable<any> { return this.http.get<any>(`${this.baseUrl}/invoices/ready/insurance`, { params }); }
  getNextInvoiceNo(branchId: number): Observable<any> { return this.http.get<any>(`${this.baseUrl}/invoices/next-no`, { params: { branchId: branchId.toString() } }); }
  getLabourNames(): Observable<any[]> { return this.http.get<any[]>(`${this.baseUrl}/invoices/labour-names`); }
  getInvoicePDFUrl(id: number, filename?: string): string { 
    return filename ? `${this.baseUrl}/invoices/${id}/pdf/${filename}.pdf` : `${this.baseUrl}/invoices/${id}/pdf`; 
  }
  getInvoiceWordUrl(id: number): string { return `${this.baseUrl}/invoices/${id}/word`; }

  // --- Job Cards ---
  createJobCard(data: any): Observable<any> { return this.http.post(`${this.baseUrl}/jobcards`, data); }
  getJobCards(branchId?: number): Observable<any[]> {
    const url = branchId ? `${this.baseUrl}/jobcards?branchId=${branchId}` : `${this.baseUrl}/jobcards`;
    return this.http.get<any[]>(url);
  }
  getJobCard(id: number): Observable<any> { return this.http.get<any>(`${this.baseUrl}/jobcards/${id}`); }
  getNextJobCardNo(date?: string): Observable<any> { 
    const params: any = {};
    if (date) params['date'] = date;
    return this.http.get<any>(`${this.baseUrl}/jobcards/next-number`, { params });
  }

  // --- Reports ---
  getJobCardSummary(data: any): Observable<any> { return this.http.post(`${this.baseUrl}/reports/job-card-summary`, data); }
  getJobCardStatement(data: any): Observable<any> { return this.http.post(`${this.baseUrl}/reports/job-card-statement`, data); }
  getPreviousLabourBills(params?: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/reports/previous-bills/labour`, { params });
  }
  getPreviousInsuranceBills(params?: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/reports/previous-bills/insurance`, { params });
  }
  getFilterOptions(): Observable<any> { return this.http.get<any>(`${this.baseUrl}/reports/filter-options`); }

  // --- Vehicle History ---
  searchVehicleHistory(reg_no: string): Observable<any> { return this.http.post(`${this.baseUrl}/vehicle-history/search`, { reg_no }); }
  searchVehicleRegNo(query: string): Observable<string[]> { return this.http.get<string[]>(`${this.baseUrl}/vehicle-history/search-reg`, { params: { q: query } }); }
  getVehicleHistoryPDFUrl(regNo: string): string { return `${this.baseUrl}/vehicle-history/pdf?reg_no=${regNo}`; }
}
