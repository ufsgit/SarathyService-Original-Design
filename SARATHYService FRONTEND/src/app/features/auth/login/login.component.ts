import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';  password = '';  hidePassword = true;  loading = false;
  constructor(private auth: AuthService, private notify: NotificationService, private router: Router) {
    if (auth.isLoggedIn) {
      this.router.navigate([auth.isAdmin ? '/admin/dashboard' : '/staff/dashboard']);
    }
  }
  onLogin() {
    if (!this.username || !this.password) { this.notify.error('Please enter username and password'); return; }
    this.loading = true;
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.notify.success('Login successful!');
        this.router.navigate([this.auth.isAdmin ? '/admin/dashboard' : '/staff/dashboard']);
      },
      error: (err) => { this.loading = false; this.notify.error(err.error?.message || 'Login failed'); }
    });
  }
}
