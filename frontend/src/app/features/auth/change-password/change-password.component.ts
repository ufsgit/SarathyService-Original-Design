import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {
  oldPassword = '';  newPassword = '';  confirmPassword = '';
  constructor(private auth: AuthService, private notify: NotificationService) {}
  onSubmit() {
    if (this.newPassword !== this.confirmPassword) { this.notify.error('Passwords do not match'); return; }
    // if (this.newPassword.length < 6) { this.notify.error('Password must be at least 6 characters'); return; }
    this.auth.changePassword(this.oldPassword, this.newPassword).subscribe({
      next: () => { this.notify.success('Password changed successfully'); this.oldPassword = this.newPassword = this.confirmPassword = ''; },
      error: (err:any) => this.notify.error(err.error?.message || 'Failed to change password')
    });
  }
}
