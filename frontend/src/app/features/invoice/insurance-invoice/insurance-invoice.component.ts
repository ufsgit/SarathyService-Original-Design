import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { AddCustomerModalComponent } from '../../../shared/components/add-customer-modal/add-customer-modal.component';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-insurance-invoice', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AddCustomerModalComponent, SearchableSelectComponent],
  templateUrl: './insurance-invoice.component.html',
  styleUrls: ['./insurance-invoice.component.css']
})
export class InsuranceInvoiceComponent implements OnInit {
  form: any = { inv_discount: 0, inv_type: 'Cash', inv_total: 0 };
  items: any[] = [this.newItem()];
  branches: any[] = []; mechanics: any[] = []; advisors: any[] = []; companies: any[] = []; labourNames: any[] = [];
  editMode = false; invoiceId: number | null = null;
  showAddCustomerModal = false;
  pendingRegNo = '';

  // Searchable Select Options
  branchOptions: string[] = [];
  advisorOptions: string[] = [];
  mechanicOptions: string[] = [];
  companyOptions: string[] = [];
  repairTypeOptions: string[] = [
    'First free service', 'Second free service', 'Third free service',
    'Paid service', 'AMC service', 'Accidental Repair',
    'Other Repairs(within warranty)', 'Other Repairs(outside warranty)'
  ];

  // Selected Labels
  selectedBranchLabel = '';
  selectedAdvisorLabel = '';
  selectedMechanicLabel = '';
  selectedCompanyLabel = '';

  constructor(private api: ApiService, private notify: NotificationService, private router: Router, public auth: AuthService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.api.getBranches().subscribe(d => {
      this.branches = d;
      this.updateBranchOptions();
    });
    this.api.getLabourNames().subscribe(d => this.labourNames = d);
    this.api.getInsuranceCompanies().subscribe(d => {
      this.companies = d;
      this.updateCompanyOptions();
      // If editing, trigger change once companies are loaded to fill GST/Address
      if (this.editMode && this.form.inv_insurance_company) {
        this.onInsuranceChange();
      }
    });
    // Load all advisors & mechanics initially
    this.api.getMechanics().subscribe(d => {
      this.mechanics = d;
      this.updateMechanicOptions();
    });
    this.api.getAdvisors().subscribe(d => {
      this.advisors = d;
      this.updateAdvisorOptions();
    });

    this.invoiceId = this.route.snapshot.params['id'] ? +this.route.snapshot.params['id'] : null;
    if (this.invoiceId) {
      this.editMode = true;
      this.loadInvoice(this.invoiceId);
    } else {
      this.form.inv_inv_date = new Date().toISOString().split('T')[0];
      this.form.inv_jcard_date = new Date().toISOString().split('T')[0];
      this.form.inv_repair_typ = 'Accidental Repair';
      this.form.inv_type = 'Cash';

      if (this.auth.currentUser?.branchId) {
        this.form.inv_branch = this.auth.currentUser.branchId;
        this.loadNextNo();
        this.loadBranchEmployees(this.auth.currentUser.branchId);
      }
    }
  }

  loadInvoice(id: number) {
    this.api.getInvoice(id).subscribe({
      next: (res: any) => {
        this.form = res.invoice;
        // Normalize types and fields for legacy records
        if (this.form.inv_branch) this.form.inv_branch = +this.form.inv_branch;
        this.form.inv_engine = this.form.inv_engine || this.form.in_engine;

        if (this.form.inv_inv_date) this.form.inv_inv_date = this.form.inv_inv_date.split('T')[0];
        if (this.form.inv_jcard_date) this.form.inv_jcard_date = this.form.inv_jcard_date.split('T')[0];
        if (this.form.inv_sale_date) this.form.inv_sale_date = this.form.inv_sale_date.split('T')[0];

        // Map insurance fields from DB columns
        this.form.inv_insurance_company = this.form.insurance_id;
        this.form.inv_surveyor = this.form.insurance_serveyor;
        if (this.companies.length > 0) {
          this.onInsuranceChange();
        }

        this.items = res.items.map((it: any) => ({
          ic_labour_code: it.lc_lab_code,
          ic_particular: it.lc_lb_name,
          ic_hsn: it.lc_sacode,
          ic_qty: it.lc_qty || 1,
          ic_rate: +it.lc_rate,
          ic_disc_per: +it.lc_disc_p,
          ic_disc: +it.lc_disc,
          ic_taxable_amt: +it.lc_tax_amunt,
          ic_sgst_p: +it.lc_sgst_p,
          ic_sgst_amt: +it.lc_sgst_a,
          ic_cgst_p: +it.lc_cgst_p,
          ic_cgst_amt: +it.lc_cgst_a,
          ic_total: +it.lc_amount,
          ic_type: it.lc_type
        }));
        this.calcTotals();

        // Update selected labels for Edit Mode
        if (this.branches.length > 0) this.updateBranchOptions();
        if (this.advisors.length > 0) this.updateAdvisorOptions();
        if (this.mechanics.length > 0) this.updateMechanicOptions();
        if (this.companies.length > 0) this.updateCompanyOptions();
      },
      error: () => this.notify.error('Failed to load invoice')
    });
  }

  updateBranchOptions() {
    this.branchOptions = this.branches.map(b => `${b.branch_name} [${b.branch_id}]`);
    if (this.form.inv_branch) {
      const b = this.branches.find(x => x.b_id == this.form.inv_branch);
      this.selectedBranchLabel = b ? `${b.branch_name} [${b.branch_id}]` : '';
    }
  }

  updateAdvisorOptions() {
    this.advisorOptions = this.advisors.map(a => `${a.e_first_name} [${a.e_code}]`);
    if (this.form.inv_advisername) {
      const a = this.advisors.find(x => x.e_first_name == this.form.inv_advisername);
      this.selectedAdvisorLabel = a ? `${a.e_first_name} [${a.e_code}]` : '';
    }
  }

  updateMechanicOptions() {
    this.mechanicOptions = this.mechanics.map(m => `${m.e_first_name} [${m.e_code}]`);
    if (this.form.inv_mechna) {
      const m = this.mechanics.find(x => x.e_first_name == this.form.inv_mechna);
      this.selectedMechanicLabel = m ? `${m.e_first_name} [${m.e_code}]` : '';
    }
  }

  updateCompanyOptions() {
    this.companyOptions = this.companies.map(c => c.ic_name || c.ic_company_name || c.icompany_name);
    if (this.form.inv_insurance_company) {
      const c = this.companies.find(x => x.com_id == this.form.inv_insurance_company);
      this.selectedCompanyLabel = c ? (c.ic_name || c.ic_company_name || c.icompany_name) : '';
    }
  }

  onBranchSelect(label: string) {
    if (!label) {
      this.form.inv_branch = '';
      this.selectedBranchLabel = '';
    } else {
      const b = this.branches.find(x => `${x.branch_name} [${x.branch_id}]` === label);
      if (b) {
        this.form.inv_branch = b.b_id;
        this.onBranchChange();
      }
    }
  }

  onAdvisorSelect(label: string) {
    if (!label) {
      this.form.inv_advisername = '';
      this.selectedAdvisorLabel = '';
    } else {
      const a = this.advisors.find(x => `${x.e_first_name} [${x.e_code}]` === label);
      if (a) {
        this.form.inv_advisername = a.e_first_name;
      }
    }
  }

  onMechanicSelect(label: string) {
    if (!label) {
      this.form.inv_mechna = '';
      this.selectedMechanicLabel = '';
    } else {
      const m = this.mechanics.find(x => `${x.e_first_name} [${x.e_code}]` === label);
      if (m) {
        this.form.inv_mechna = m.e_first_name;
      }
    }
  }

  onInsuranceSelect(label: string) {
    if (!label) {
      this.form.inv_insurance_company = '';
      this.selectedCompanyLabel = '';
      this.form.inv_insurance_gstin = '';
      this.form.inv_insurance_address = '';
    } else {
      const c = this.companies.find(x => (x.ic_name || x.ic_company_name || x.icompany_name) === label);
      if (c) {
        this.form.inv_insurance_company = c.com_id;
        this.onInsuranceChange();
      }
    }
  }

  loadNextNo() {
    if (this.form.inv_branch) {
      this.api.getNextInvoiceNo(this.form.inv_branch).subscribe(res => {
        const today = new Date();
        const ymd = today.getFullYear().toString()
          + String(today.getMonth() + 1).padStart(2, '0')
          + String(today.getDate()).padStart(2, '0');
        // Match user's example: CI20260312 + 357322 (no additional padding needed if ID is already long)
        this.form.inv_no = `CI${ymd}${res.nextNo}`;
      });
    }
  }

  loadBranchEmployees(branchId: number) {
    this.form.inv_advisername = '';
    this.form.inv_mechna = '';
    this.selectedAdvisorLabel = '';
    this.selectedMechanicLabel = '';
    this.api.getMechanics(branchId).subscribe(d => {
      this.mechanics = d;
      this.updateMechanicOptions();
    });
    this.api.getAdvisors(branchId).subscribe(d => {
      this.advisors = d;
      this.updateAdvisorOptions();
    });
  }

  onBranchChange() {
    this.loadNextNo();
    if (this.form.inv_branch) {
      this.loadBranchEmployees(this.form.inv_branch);
    } else {
      this.api.getMechanics().subscribe(d => {
        this.mechanics = d;
        this.updateMechanicOptions();
      });
      this.api.getAdvisors().subscribe(d => {
        this.advisors = d;
        this.updateAdvisorOptions();
      });
    }
  }

  onInsuranceChange() {
    if (this.form.inv_insurance_company) {
      const found = this.companies.find(c => c.com_id == this.form.inv_insurance_company);
      if (found) {
        // Checking common property names for GST and Address
        this.form.inv_insurance_gstin = found.ic_gst || found.icompany_gst || found.gstin_no;
        this.form.inv_insurance_address = found.ic_address || found.icompany_address;
      }
    }
  }

  newItem() {
    return {
      ic_labour_code: '',
      ic_particular: '',
      ic_hsn: '998729',
      ic_qty: 1,
      ic_rate: 0,
      ic_disc_per: 0,
      ic_disc: 0,
      ic_taxable_amt: 0,
      ic_sgst_p: 9,
      ic_sgst_amt: 0,
      ic_cgst_p: 9,
      ic_cgst_amt: 0,
      ic_total: 0,
      ic_type: 'Paid Service'
    };
  }

  addItem() { this.items.push(this.newItem()); }
  removeItem(i: number) { this.items.splice(i, 1); this.calcTotals(); }

  onLabourCodeSelect(i: number) {
    const found = this.labourNames.find(l => l.l_code === this.items[i].ic_labour_code);
    if (found) {
      this.items[i].ic_particular = found.l_name;
      this.items[i].ic_hsn = found.l_hsn || '998729'; 
      this.items[i].ic_rate = found.l_amount; 
      this.calcItem(i); 
    }
  }

  calcItem(i: number) {
    const item = this.items[i];
    if (item.ic_type === 'Expense' || item.ic_type === 'Free Service') {
      item.ic_disc = 0;
      item.ic_taxable_amt = 0;
      item.ic_cgst_amt = 0;
      item.ic_sgst_amt = 0;
      item.ic_total = 0;
    } else {
      const rate = item.ic_rate || 0;
      item.ic_disc = +(rate * (item.ic_disc_per || 0) / 100).toFixed(2);
      item.ic_taxable_amt = +(rate - item.ic_disc).toFixed(2);
      item.ic_cgst_amt = +(item.ic_taxable_amt * (item.ic_cgst_p / 100)).toFixed(2);
      item.ic_sgst_amt = +(item.ic_taxable_amt * (item.ic_sgst_p / 100)).toFixed(2);
      item.ic_total = +(item.ic_taxable_amt + item.ic_cgst_amt + item.ic_sgst_amt).toFixed(2);
    }
    this.calcTotals();
  }

  calcTotals() {
    let taxableTotal = 0, cgstTotal = 0, sgstTotal = 0, discTotal = 0;
    this.items.forEach(item => {
      taxableTotal += (item.ic_taxable_amt || 0);
      cgstTotal += (item.ic_cgst_amt || 0);
      sgstTotal += (item.ic_sgst_amt || 0);
      discTotal += (item.ic_disc || 0);
    });
    this.form.inv_taxable_total = +taxableTotal.toFixed(2);
    this.form.inv_cgst = +cgstTotal.toFixed(2);
    this.form.inv_sgst = +sgstTotal.toFixed(2);
    this.form.inv_discount = +discTotal.toFixed(2);
    const grandTotal = taxableTotal + cgstTotal + sgstTotal;
    
    // As per reference screenshot, Total Payable Amount is the sum including taxes
    this.form.inv_total = +grandTotal.toFixed(2); 
    this.form.inv_final_amount = Math.round(grandTotal);
  }

  onRegBlur() {
    if (this.form.in_registr) {
      this.api.getCustomerByReg(this.form.in_registr).subscribe({
        next: (c:any) => { 
          this.form.inv_cus = c.c_name; 
          this.form.inv_cus_addres = c.c_address; 
          this.form.inv_pho = c.c_contact_no; 
          this.form.inv_modl = c.model_name; 
          this.form.inv_chassis = c.c_chassis_no; 
          this.form.inv_engine = c.c_engine_no; 
        },
        error: () => {
          this.pendingRegNo = this.form.in_registr;
          this.showAddCustomerModal = true;
        }
      });
    }
  }

  onCustomerAdded(c: any) {
    this.form.inv_cus = c.c_name;
    this.form.inv_cus_addres = c.c_address;
    this.form.inv_pho = c.c_contact_no;
    this.form.inv_modl = c.model_name;
    this.form.inv_chassis = c.c_chassis_no;
    this.form.inv_engine = c.c_engine_no;
    this.showAddCustomerModal = false;
  }

  onAddToReadyForBill() {
    if (!this.form.in_registr || !this.form.inv_cus || !this.form.inv_branch) {
      this.notify.error('Please fill Registration No, Customer Name, Branch.');
      return;
    }
    if (this.items.length === 0 || !this.items[0].ic_particular) {
      this.notify.error('Please add at least one line item');
      return;
    }
    this.form.items = this.items;

    if (this.editMode && this.invoiceId) {
      this.api.updateInvoice(this.invoiceId, this.form).subscribe({
        next: () => {
          this.api.markInvoiceReady(this.invoiceId!).subscribe({
            next: () => {
              this.notify.success('Invoice updated and marked as Ready for Bill');
              this.router.navigate(['/admin/invoice/ready-bills']);
            },
            error: (e: any) => this.notify.error('Invoice updated but failed to mark as ready')
          });
        },
        error: (e: any) => this.notify.error(e.error?.message || 'Error updating invoice')
      });
    } else {
      this.api.createInsuranceInvoice(this.form).subscribe({
        next: (res: any) => {
          this.api.markInvoiceReady(res.id).subscribe({
            next: () => {
              this.notify.success('Invoice saved and marked as Ready for Bill');
              this.router.navigate(['/admin/invoice/ready-bills']);
            },
            error: (e: any) => this.notify.error('Invoice saved but failed to mark as ready')
          });
        },
        error: (e: any) => this.notify.error(e.error?.message || 'Error saving invoice')
      });
    }
  }

  onPrint() {
    if (!this.invoiceId) {
      this.notify.error('Please save the invoice first');
      return;
    }
    const url = this.api.getInvoicePDFUrl(this.invoiceId);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const pdfUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url;
    
    window.open(pdfUrl, '_blank');

    if (this.editMode) {
      this.notify.success('Invoice finalized and print triggered. Redirecting...');
      setTimeout(() => {
        this.router.navigate(['/admin/reports/previous-bills/insurance']);
      }, 1500);
    }
  }


  scrollTableUp() {
    const el = document.getElementById('tableScrollContainer');
    if (el) el.scrollTop -= 60;
  }

  scrollTableDown() {
    const el = document.getElementById('tableScrollContainer');
    if (el) el.scrollTop += 60;
  }
}
