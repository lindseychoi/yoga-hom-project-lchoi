import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';

export interface ConfirmData {
  message: string;
  confirmLabel: string;
  hideCancel?: boolean;
}

const ALERT_ID = 'alert-dialog';

/** A small yes-or-no dialog. With hideCancel it becomes a message with just an OK button. */
@Component({
  selector: 'app-confirm-dialog',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions>
      @if (!data.hideCancel) {
        <button mat-button type="button" [mat-dialog-close]="false">Cancel</button>
      }
      <button mat-flat-button type="button" [mat-dialog-close]="true">{{ data.confirmLabel }}</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmData>(MAT_DIALOG_DATA);
}

/** Opens the dialog and emits true if the user confirmed. hasBackdrop is false when another dialog is already open. */
export const confirmAction =(dialog: MatDialog, data: ConfirmData, hasBackdrop = true) =>
  dialog.open(ConfirmDialog, { data, hasBackdrop }).afterClosed();

/** Shows a message. If a message dialog is already open it reuses it, so two failed requests don't stack two dialogs. */
export const alertAction =(dialog: MatDialog, message: string, hasBackdrop = true) =>
  (
    dialog.getDialogById(ALERT_ID) ??
    dialog.open(ConfirmDialog, {
      id: ALERT_ID,
      data: { message, confirmLabel: 'OK', hideCancel: true },
      hasBackdrop,
    })
  ).afterClosed();
