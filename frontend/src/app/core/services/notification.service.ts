import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private dialog: MatDialog) {}

  confirm(message: string, title: string = 'Confirm'): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      panelClass: 'white-dialog-panel',
      data: { title, message, type: 'confirm' },
      disableClose: true
    });
    return dialogRef.afterClosed();
  }

  success(message: string): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      panelClass: 'white-dialog-panel',
      data: { title: 'Success', message, type: 'success' }
    });
  }

  error(message: string): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      panelClass: 'white-dialog-panel',
      data: { title: 'Error', message, type: 'error' },
      disableClose: true
    });
  }

  info(message: string): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      panelClass: 'white-dialog-panel',
      data: { title: 'Information', message, type: 'info' }
    });
  }
}
