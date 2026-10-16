import { HttpErrorResponse } from '@angular/common/http';
import { Component, TemplateRef, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Observable } from 'rxjs';
import { alertAction, confirmAction } from '../../components/confirm-dialog';
import { Customer } from '../../models/customer.model';
import { PHONE_PATTERN } from '../../models/instructor.model';
import { CustomerInput, CustomerService } from '../../services/customer.service';

/** Table of customers with add, edit, and delete (UC4). The form opens as a dialog defined in this template. */
@Component({
  selector: 'app-customers',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
  ],
  template: `
    <button mat-flat-button type="button" (click)="openForm()">Add customer</button>

    <table mat-table [dataSource]="customers()">
      <ng-container matColumnDef="customerId">
        <th mat-header-cell *matHeaderCellDef>ID</th>
        <td mat-cell *matCellDef="let c">{{ c.customerId }}</td>
      </ng-container>
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let c">{{ c.firstName }} {{ c.lastName }}</td>
      </ng-container>
      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef>Email</th>
        <td mat-cell *matCellDef="let c">{{ c.email }}</td>
      </ng-container>
      <ng-container matColumnDef="phone">
        <th mat-header-cell *matHeaderCellDef>Phone</th>
        <td mat-cell *matCellDef="let c">{{ c.phone }}</td>
      </ng-container>
      <ng-container matColumnDef="classBalance">
        <th mat-header-cell *matHeaderCellDef>Balance</th>
        <td mat-cell *matCellDef="let c">{{ c.classBalance }}</td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let c">
          <button mat-button type="button" (click)="openForm(c)">Edit</button>
          <button mat-button type="button" (click)="remove(c)">Delete</button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns"></tr>
    </table>

    <ng-template #formDialog>
      <h2 mat-dialog-title>{{ editing ? 'Edit' : 'Add' }} customer</h2>
      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-dialog-content class="fields">
          <mat-form-field appearance="outline">
            <mat-label>First name</mat-label>
            <input matInput formControlName="firstName" />
            <mat-error>First name is required</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Last name</mat-label>
            <input matInput formControlName="lastName" />
            <mat-error>Last name is required</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Address</mat-label>
            <input matInput formControlName="address" />
            <mat-error>Address is required</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Phone</mat-label>
            <input matInput formControlName="phone" />
            <mat-error>{{ form.controls.phone.hasError('required') ? 'Phone is required' : 'Phone is not valid' }}</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
            <mat-error>{{ form.controls.email.hasError('required') ? 'Email is required' : 'Email is not valid' }}</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Preferred contact</mat-label>
            <mat-select formControlName="preferredContact">
              <mat-option value="email">Email</mat-option>
              <mat-option value="phone">Phone</mat-option>
            </mat-select>
          </mat-form-field>
        </mat-dialog-content>
        <mat-dialog-actions>
          <button mat-button type="button" mat-dialog-close>Cancel</button>
          <button mat-flat-button type="submit" [disabled]="form.invalid">Save</button>
        </mat-dialog-actions>
      </form>
    </ng-template>
  `,
  styles: `
    table {
      width: 100%;
      margin-top: 1rem;
      --mat-table-background-color: transparent;
    }

    /* Keep Edit / Delete side by side */
    td:last-child {
      white-space: nowrap;
    }

    .fields {
      display: flex;
      flex-direction: column;
      padding-top: 0.5rem;
    }
  `,
})
export class Customers {
  private readonly service = inject(CustomerService);
  private readonly dialog = inject(MatDialog);
  private readonly formDialog = viewChild.required<TemplateRef<unknown>>('formDialog');
  private dialogRef?: MatDialogRef<unknown>;

  protected readonly columns = ['customerId', 'name', 'email', 'phone', 'classBalance', 'actions'];
  protected readonly customers = signal<Customer[]>([]);
  protected editing: Customer | null = null;
  protected readonly form = inject(FormBuilder).nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    // Same required fields and formats the server checks
    address: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    email: ['', [Validators.required, Validators.email]],
    preferredContact: ['email' as Customer['preferredContact'], Validators.required],
  });

  constructor() {
    this.load();
  }

  private load() {
    this.service.list().subscribe({
      next: (list) => this.customers.set(list),
      error: (error) => this.showError(error),
    });
  }

  /** Opens the add form, or the edit form filled in when a customer is passed in. */
  protected openForm(customer?: Customer) {
    this.editing = customer ?? null;
    this.form.reset(customer);
    this.dialogRef = this.dialog.open(this.formDialog(), { width: '480px' });
  }

  /** On add, first asks whether the name already exists. The form dialog is hidden while that question shows, so nothing typed is lost. */
  protected save() {
    const data: CustomerInput = this.form.getRawValue();
    if (this.editing) {
      this.persist(this.service.update(this.editing._id, data));
      return;
    }
    this.service.exists(data.firstName, data.lastName).subscribe({
      next: ({ exists }) => {
        if (!exists) {
          this.create(data);
          return;
        }
        this.dialogRef?.addPanelClass('dialog-hidden');
        confirmAction(
          this.dialog,
          {
            message: `A customer named ${data.firstName} ${data.lastName} already exists. Save anyway?`,
            confirmLabel: 'Save anyway',
          },
          false
        ).subscribe((ok) => {
          if (ok) {
            this.create(data);
          } else {
            this.dialogRef?.removePanelClass('dialog-hidden');
          }
        });
      },
      error: (error) => this.showError(error),
    });
  }

  /** Adds the customer, then shows the new ID and the welcome message the server sent (UC4). */
  private create(data: CustomerInput) {
    this.persist(this.service.create(data), ({ customer, notification }) =>
      alertAction(
        this.dialog,
        `Saved customer ${customer.customerId}. Message sent by ${notification.channel} to ${notification.to}: "${notification.message}"`
      )
    );
  }

  /** Saves, closes the form, and reloads the table. On an error, shows the message and brings the form back. */
  private persist<T>(request: Observable<T>, onSaved?: (result: T) => void) {
    request.subscribe({
      next: (result) => {
        this.dialogRef?.close();
        this.load();
        onSaved?.(result);
      },
      error: (error) => {
        this.dialogRef?.addPanelClass('dialog-hidden');
        this.showError(error, false).subscribe(() =>
          this.dialogRef?.removePanelClass('dialog-hidden')
        );
      },
    });
  }

  protected remove(customer: Customer) {
    confirmAction(this.dialog, {
      message: `Delete ${customer.firstName} ${customer.lastName}?`,
      confirmLabel: 'Delete',
    }).subscribe((ok) => {
      if (!ok) {
        return;
      }
      this.service.remove(customer._id).subscribe({
        next: () => this.load(),
        error: (error) => this.showError(error),
      });
    });
  }

  /** Shows the server's message in a dialog. Pass false when another dialog is open, so two dark layers don't stack. */
  private showError(error: HttpErrorResponse, hasBackdrop = true) {
    return alertAction(this.dialog, error.error?.message ?? error.message, hasBackdrop);
  }
}
