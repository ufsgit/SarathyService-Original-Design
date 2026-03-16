import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-labour-invoice', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './labour-invoice.component.html',
  styleUrls: ['./labour-invoice.component.css']
})
export class LabourInvoiceComponent implements OnInit {
  form: any = { inv_discount: 0, inv_type: 'Cash', inv_total: 0 }; 
  items: any[] = [this.newItem()];
  branches: any[] = []; mechanics: any[] = []; advisors: any[] = []; labourNames: any[] = [];
  editMode = false; invoiceId: number | null = null;
  
  constructor(private api: ApiService, private notify: NotificationService, private router: Router, private auth: AuthService, private route: ActivatedRoute) {}
  
  ngOnInit() {
    this.api.getBranches().subscribe(d => this.branches = d);
    this.api.getLabourNames().subscribe(d => this.labourNames = d);
    // Load all advisors & mechanics initially (no branch filter)
    this.api.getMechanics().subscribe(d => this.mechanics = d);
    this.api.getAdvisors().subscribe(d => this.advisors = d);
    
    this.invoiceId = this.route.snapshot.params['id'] ? +this.route.snapshot.params['id'] : null;
    if (this.invoiceId) {
      this.editMode = true;
      this.loadInvoice(this.invoiceId);
    } else {
      this.form.inv_inv_date = new Date().toISOString().split('T')[0];
      this.form.inv_jcard_date = new Date().toISOString().split('T')[0];
      this.form.inv_sale_date = new Date().toISOString().split('T')[0];
      this.form.inv_repair_typ = 'Paid service';
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
        // Fix for date formats if needed
        if (this.form.inv_inv_date) this.form.inv_inv_date = this.form.inv_inv_date.split('T')[0];
        if (this.form.inv_jcard_date) this.form.inv_jcard_date = this.form.inv_jcard_date.split('T')[0];
        if (this.form.inv_sale_date) this.form.inv_sale_date = this.form.inv_sale_date.split('T')[0];
        
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
      },
      error: () => this.notify.error('Failed to load invoice')
    });
  }

  loadNextNo() {
    if (this.form.inv_branch) {
      this.api.getNextInvoiceNo(this.form.inv_branch).subscribe(res => {
        const today = new Date();
        const ymd = today.getFullYear().toString()
          + String(today.getMonth() + 1).padStart(2, '0')
          + String(today.getDate()).padStart(2, '0');
        // Match user's example: CI20260312 + 357322
        this.form.inv_no = `CI${ymd}${res.nextNo}`;
      });
    }
  }

  loadBranchEmployees(branchId: number) {
    this.form.inv_advisername = '';
    this.form.inv_mechna = '';
    this.api.getMechanics(branchId).subscribe(d => this.mechanics = d);
    this.api.getAdvisors(branchId).subscribe(d => this.advisors = d);
  }

  onBranchChange() {
    this.loadNextNo();
    if (this.form.inv_branch) {
      this.loadBranchEmployees(this.form.inv_branch);
    } else {
      // Branch cleared — reload all
      this.api.getMechanics().subscribe(d => this.mechanics = d);
      this.api.getAdvisors().subscribe(d => this.advisors = d);
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
          this.form.inv_email = c.c_email; 
          this.form.inv_gstin = c.gstin_no; 
          this.form.inv_modl = c.model_name; 
          this.form.inv_chassis = c.c_chassis_no; 
          this.form.inv_engine = c.c_engine_no; 
        },
        error: () => {}
      });
    }
  }

  onAddToReadyForBill() {
    if (!this.form.in_registr || !this.form.inv_cus || !this.form.inv_branch || !this.form.inv_no) {
      this.notify.error('Please fill Registration No, Customer Name, Branch and Invoice No');
      return;
    }
    if (this.items.length === 0 || !this.items[0].ic_particular) {
      this.notify.error('Please add at least one line item');
      return;
    }
    this.form.items = this.items;
    this.api.createLabourInvoice(this.form).subscribe({
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

  onPrint() {
    this.notify.info('Print functionality will be triggered here');
  }

  onSubmit() {
    if (!this.form.in_registr || !this.form.inv_cus || !this.form.inv_branch || !this.form.inv_no) {
      this.notify.error('Please fill Registration No, Customer Name, Branch and Invoice No');
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
          this.notify.success('Invoice updated');
          const prefix = this.router.url.includes('/admin/') ? '/admin' : '/staff';
          this.router.navigate([prefix + '/reports/previous-bills/labour']);
        },
        error: (e: any) => this.notify.error(e.error?.message || 'Error updating invoice')
      });
    } else {
      this.api.createLabourInvoice(this.form).subscribe({
        next: () => { 
          this.notify.success('Invoice created'); 
          this.router.navigate(['/admin/invoice/list']); 
        },
        error: (e:any) => this.notify.error(e.error?.message || 'Error')
      });
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
