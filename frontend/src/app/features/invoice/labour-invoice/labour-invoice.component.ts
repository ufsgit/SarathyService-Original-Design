import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { AddCustomerModalComponent } from '../../../shared/components/add-customer-modal/add-customer-modal.component';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-labour-invoice', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AddCustomerModalComponent, SearchableSelectComponent],
  templateUrl: './labour-invoice.component.html',
  styleUrls: ['./labour-invoice.component.css']
})
export class LabourInvoiceComponent implements OnInit {
  form: any = { inv_discount: 0, inv_type: 'Cash', inv_total: 0, inv_no: '' };
  items: any[] = [this.newItem()];
  branches: any[] = []; mechanics: any[] = []; advisors: any[] = []; labourNames: any[] = [];
  editMode = false; invoiceId: number | null = null;
  isFromPreviousBills = false; isFromReadyBills = false; isFinalizing = false;
  showAddCustomerModal = false;
  pendingRegNo = '';
  isLoading = false;
  display_inv_no = '';

  // Searchable Select Options
  branchOptions: string[] = [];
  advisorOptions: string[] = [];
  mechanicOptions: string[] = [];
  repairTypeOptions: string[] = [
    'First free service', 'Second free service', 'Third free service',
    'Paid service', 'AMC service', 'Accidental Repair',
    'Other Repairs(within warranty)', 'Other Repairs(outside warranty)'
  ];

  // Selected Labels for Searchable Select
  selectedBranchLabel = '';
  selectedAdvisorLabel = '';
  selectedMechanicLabel = '';

  labourCodeOptions: string[] = [];
  jobTypeOptions: string[] = ['Paid Service', 'Expense', 'Free Service'];

  formatLabourCode = (option: string) => {
    return option ? option.split(' - ')[0] : option;
  };

  constructor(private api: ApiService, private notify: NotificationService, private router: Router, public auth: AuthService, private route: ActivatedRoute, private titleService: Title) { }

  ngOnInit() {
    this.api.getBranches().subscribe(d => {
      this.branches = d;
      this.updateBranchOptions();
    });
    this.api.getLabourNames().subscribe(d => {
      this.labourNames = d;
      this.updateLabourCodeOptions();
    });
    // Load all advisors & mechanics initially (no branch filter)
    this.api.getMechanics().subscribe(d => {
      this.mechanics = d;
      this.updateMechanicOptions();
    });
    this.api.getAdvisors().subscribe(d => {
      this.advisors = d;
      this.updateAdvisorOptions();
    });

    this.isFromPreviousBills = this.route.snapshot.queryParams['from'] === 'previous';
    this.isFromReadyBills = this.route.snapshot.queryParams['from'] === 'ready';
    this.invoiceId = this.route.snapshot.params['id'] ? +this.route.snapshot.params['id'] : null;
    if (this.invoiceId) {
      this.editMode = true;
      this.loadInvoice(this.invoiceId);
    } else {
      this.form.inv_inv_date = new Date().toISOString().split('T')[0];
      this.form.inv_jcard_date = new Date().toISOString().split('T')[0];
      this.form.inv_repair_typ = '';
      if (this.auth.currentUser?.branchId) {
        this.form.inv_branch = this.auth.currentUser.branchId;
        this.loadNextNo();
        this.loadBranchEmployees(this.auth.currentUser.branchId);
      }
    }
  }

  loadInvoice(id: number) {
    this.isLoading = true;
    this.api.getInvoice(id).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.form = res.invoice;
        
        if (this.isFromReadyBills) {
          this.titleService.setTitle(`Ready bill labour (${this.form.inv_job_card_no || ''})`);
        } else if (this.isFromPreviousBills) {
          this.titleService.setTitle(`Previous bill labour (${this.form.inv_job_card_no || ''})`);
        } else {
          this.titleService.setTitle(`Labour Invoice (${this.form.inv_job_card_no || ''})`);
        }

        if (this.form.inv_branch) {
          this.form.inv_branch = +this.form.inv_branch;
          if (!this.isFromPreviousBills) {
            this.loadNextNo();
          }
        }
        this.form.inv_engine = this.form.inv_engine || this.form.in_engine;
        this.form.inv_cus_gstin = this.form.inv_cus_gstin || this.form.inv_gstin;

        const formatDate = (dateStr: string) => {
          if (!dateStr) return dateStr;
          const d = new Date(dateStr);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        };
        if (this.form.inv_inv_date) this.form.inv_inv_date = formatDate(this.form.inv_inv_date);
        if (this.form.inv_jcard_date) this.form.inv_jcard_date = formatDate(this.form.inv_jcard_date);
        if (this.form.inv_sale_date) this.form.inv_sale_date = formatDate(this.form.inv_sale_date);

        if (this.isFromReadyBills) {
          const today = new Date().toISOString().split('T')[0];
          this.form.inv_inv_date = today;
        }

        this.items = res.items.map((it: any) => ({
          ic_labour_code: it.lc_lab_code,
          ic_particular: it.lc_lb_name,
          ic_hsn: it.lc_sacode,
          ic_qty: it.lc_qty || 1, // Add defaults if missing
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
        if (this.labourNames.length > 0) this.updateLabourCodeOptions();
      },
      error: () => {
        this.isLoading = false;
        this.notify.error('Failed to load invoice');
      }
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

  updateLabourCodeOptions() {
    this.labourCodeOptions = this.labourNames.map(l => `${l.l_code} - ${l.l_name}`);
    this.items.forEach(item => {
      if (item.ic_labour_code) {
        const match = this.labourNames.find(x => x.l_code === item.ic_labour_code);
        if (match) {
          item.ic_labour_label = `${match.l_code} - ${match.l_name}`;
        }
      }
    });
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

  loadNextNo() {
    if (this.form.inv_branch) {
      this.api.getNextInvoiceNo(this.form.inv_branch).subscribe(res => {
        this.display_inv_no = res.nextNo;
      });
    }
  }

  onJcardDateChange() {
    // Intentionally left blank: disabled auto-fill job card no on date change per user request
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
      // Branch cleared — reload all
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

  newItem() {
    return {
      ic_labour_label: '',
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
    const label = this.items[i].ic_labour_label;
    if (!label) {
      this.items[i].ic_labour_code = '';
      this.items[i].ic_particular = '';
      this.items[i].ic_rate = 0;
      this.calcItem(i);
      return;
    }
    const found = this.labourNames.find(l => `${l.l_code} - ${l.l_name}` === label);
    if (found) {
      this.items[i].ic_labour_code = found.l_code;
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
    this.form.inv_final_amount = +grandTotal.toFixed(2);
  }

  onRegBlur() {
    if (this.form.in_registr) {
      this.api.getCustomerByReg(this.form.in_registr).subscribe({
        next: (c: any) => {
          this.form.inv_cus = c.c_name;
          this.form.inv_cus_addres = c.c_address;
          this.form.inv_pho = c.c_contact_no;
          this.form.inv_email = c.c_email;
          this.form.inv_cus_gstin = c.gstin_no;
          this.form.inv_modl = c.model_name;
          this.form.inv_chassis = c.c_chassis_no;
          this.form.inv_engine = c.c_engine_no;
          if (c.c_sales_date) {
            const d = new Date(c.c_sales_date);
            if (!isNaN(d.getTime())) {
              this.form.inv_sale_date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            }
          }
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
    this.form.inv_email = c.c_email;
    this.form.inv_cus_gstin = c.gstin_no;
    this.form.inv_modl = c.model_name;
    this.form.inv_chassis = c.c_chassis_no;
    this.form.inv_engine = c.c_engine_no;
    if (c.c_sales_date) {
      const d = new Date(c.c_sales_date);
      if (!isNaN(d.getTime())) {
        this.form.inv_sale_date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }
    this.showAddCustomerModal = false;
  }

  private validateForm(isBilling: boolean): boolean {
    const missing: string[] = [];
    if (!this.form.inv_branch) missing.push('Branch Name');
    if (!this.form.inv_job_card_no) missing.push('Jobcard No');
    if (!this.form.inv_jcard_date) missing.push('Jobcard Date');
    if (this.isFromPreviousBills && !this.form.inv_no) missing.push('Invoice No');
    if (!this.form.inv_inv_date) missing.push('Invoice Date');
    if (!this.form.in_registr) missing.push('Registration No');
    if (!this.form.inv_modl) missing.push('Model Name');
    if (!this.form.inv_km) missing.push('KM Reading');
    if (!this.form.inv_cus) missing.push('Customer Name');
    if (!this.form.inv_pho) missing.push('Mobile Number');
    if (!this.form.inv_type) missing.push('Invoice Type');
    if (isBilling) {
      if (!this.form.inv_advisername) missing.push('Advisor Name');
      if (!this.form.inv_mechna) missing.push('Mechanic Name');
    }
    if (!this.form.inv_repair_typ) missing.push('Repair Type');

    if (missing.length > 0) {
      this.notify.error(`Please fill missing mandatory fields: ${missing.join(', ')}`);
      return false;
    }


    if (isBilling && (this.items.length === 0 || !this.items[0].ic_particular)) {
      this.notify.error('Please add at least one line item');
      return false;
    }

    return true;
  }

  onAddToReadyForBill() {
    if (!this.validateForm(false)) return;
    if (this.items.length === 0 || !this.items[0].ic_particular) {
      this.notify.error('Please add at least one line item');
      return;
    }
    this.form.items = this.items;
    if (!this.isFromPreviousBills) {
      this.form.inv_no = ''; // Ensure we do not save the display invoice number
    }
    this.isLoading = true;

    if (this.editMode && this.invoiceId) {
      this.api.updateInvoice(this.invoiceId, this.form).subscribe({
        next: () => {
          this.api.markInvoiceReady(this.invoiceId!).subscribe({
            next: () => {
              this.isLoading = false;
              this.notify.success('Invoice updated and marked as Ready for Bill');
              const basePath = this.auth.isAdmin ? '/admin' : '/staff';
              setTimeout(() => {
                this.router.navigate([`${basePath}/invoice/ready/labour`]);
              }, 1500);
            },
            error: (e: any) => {
              this.isLoading = false;
              this.notify.error('Invoice updated but failed to mark as ready');
            }
          });
        },
        error: (e: any) => {
          this.isLoading = false;
          this.notify.error(e.error?.message || 'Error updating invoice');
        }
      });
    } else {
      this.api.createLabourInvoice(this.form).subscribe({
        next: (res: any) => {
          this.invoiceId = res.id; // Store ID for subsequent actions
          this.api.markInvoiceReady(res.id).subscribe({
            next: () => {
              this.isLoading = false;
              this.notify.success('Invoice saved and marked as Ready for Bill');
              const basePath = this.auth.isAdmin ? '/admin' : '/staff';
              setTimeout(() => {
                this.router.navigate([`${basePath}/invoice/ready/labour`]);
              }, 1500);
            },
            error: (e: any) => {
              this.isLoading = false;
              this.notify.error('Invoice saved but failed to mark as ready');
            }
          });
        },
        error: (e: any) => {
          this.isLoading = false;
          this.notify.error(e.error?.message || 'Error saving invoice');
        }
      });
    }
  }

  onSaveBill() {
    if (!this.validateForm(true)) return;
    this.form.items = this.items;

    if (this.editMode && this.invoiceId) {
      this.isLoading = true;
      if (this.isFromPreviousBills) this.form.isFinalized = true;
      this.api.updateInvoice(this.invoiceId, this.form).subscribe({
        next: () => {
          this.isLoading = false;
          this.notify.success('Invoice updated successfully');
          setTimeout(() => {
            this.router.navigate(['/admin/reports/previous-bills/labour']);
          }, 1500);
        },
        error: (e: any) => {
          this.isLoading = false;
          this.notify.error(e.error?.message || 'Error updating invoice');
        }
      });
    }
  }

  saveBeforeAction(callback: Function) {
    if (!this.validateForm(true)) return;
    this.form.items = this.items;
    if (!this.isFromPreviousBills) {
      this.form.inv_no = ''; // Ensure we do not save the display invoice number
    }
    this.isLoading = true;

    if (this.editMode && this.invoiceId) {
      if (this.isFromPreviousBills) this.form.isFinalized = true;
      this.api.updateInvoice(this.invoiceId, this.form).subscribe({
        next: () => {
          this.api.markInvoiceReady(this.invoiceId!).subscribe({
            next: () => { this.isLoading = false; callback(); },
            error: () => { this.isLoading = false; this.notify.error('Failed to prepare invoice for action'); }
          });
        },
        error: (e: any) => { this.isLoading = false; this.notify.error(e.error?.message || 'Error updating invoice'); }
      });
    } else {
      this.api.createLabourInvoice(this.form).subscribe({
        next: (res: any) => {
          this.invoiceId = res.id;
          this.api.markInvoiceReady(res.id).subscribe({
            next: () => { this.isLoading = false; callback(); },
            error: () => { this.isLoading = false; this.notify.error('Failed to prepare invoice for action'); }
          });
        },
        error: (e: any) => { this.isLoading = false; this.notify.error(e.error?.message || 'Error saving invoice'); }
      });
    }
  }

  onPrint() {
    this.saveBeforeAction(() => this.triggerPrint());
  }

  printInvoice() {
    if (!this.invoiceId) return;
    const filename = `${this.form.inv_no || this.invoiceId} - invoice`;
    let url = this.api.getInvoicePDFUrl(this.invoiceId, filename);
    window.open(url, '_blank');
  }

  private triggerPrint() {
    this.printInvoice();

    this.notify.success('Invoice finalized and print triggered.');
    setTimeout(() => {
      this.router.navigate(['/admin/reports/previous-bills/labour']);
    }, 1500);
  }

  onWordExport() {
    if (!this.invoiceId) {
      this.saveBeforeAction(() => this.triggerWord());
    } else {
      this.triggerWord();
    }
  }

  private triggerWord() {
    const url = this.api.getInvoiceWordUrl(this.invoiceId!);
    window.open(url, '_blank');

    this.notify.success('Invoice finalized and Word export triggered.');
    setTimeout(() => {
      this.router.navigate(['/admin/reports/previous-bills/labour']);
    }, 1500);
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
