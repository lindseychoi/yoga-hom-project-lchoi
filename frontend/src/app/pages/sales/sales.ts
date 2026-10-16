import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { alertAction } from '../../components/confirm-dialog';
import { Customer } from '../../models/customer.model';
import { Package, UNLIMITED } from '../../models/package.model';
import { PAYMENT_MODES, Sale } from '../../models/sale.model';
import { CustomerService } from '../../services/customer.service';
import { PackageService } from '../../services/package.service';
import { SaleService } from '../../services/sale.service';

/** Now as 'YYYY-MM-DDTHH:mm' in local time, the format a datetime-local input expects. */
const localNow = (): string => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

/** Past sales and a dialog to record a new one (UC5). Sales are a record, so they can't be edited or deleted. */
@Component({
  selector: 'app-sales',
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
  ],
  template: `
    <button mat-flat-button type="button" (click)="openForm()">Record sale</button>

    <table mat-table [dataSource]="sales()">
      <ng-container matColumnDef="paymentDate">
        <th mat-header-cell *matHeaderCellDef>Date</th>
        <td mat-cell *matCellDef="let s">{{ s.paymentDate | date }}</td>
      </ng-container>
      <ng-container matColumnDef="customer">
        <th mat-header-cell *matHeaderCellDef>Customer</th>
        <td mat-cell *matCellDef="let s">{{ customerNames().get(s.customerId) ?? s.customerId }}</td>
      </ng-container>
      <ng-container matColumnDef="package">
        <th mat-header-cell *matHeaderCellDef>Package</th>
        <td mat-cell *matCellDef="let s">{{ packageNames().get(s.packageId) ?? s.packageId }}</td>
      </ng-container>
      <ng-container matColumnDef="amountPaid">
        <th mat-header-cell *matHeaderCellDef>Amount</th>
        <td mat-cell *matCellDef="let s">{{ s.amountPaid | currency }}</td>
      </ng-container>
      <ng-container matColumnDef="validityEnd">
        <th mat-header-cell *matHeaderCellDef>Valid until</th>
        <!-- Dates are stored as midnight UTC, so show them in UTC to avoid a day shift -->
        <td mat-cell *matCellDef="let s">{{ s.validityEnd | date: 'mediumDate' : 'UTC' }}</td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns"></tr>
    </table>

    <ng-template #formDialog>
      <h2 mat-dialog-title>Record sale</h2>
      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-dialog-content class="fields">
          <mat-form-field appearance="outline">
            <mat-label>Customer</mat-label>
            <mat-select formControlName="customerId">
              @for (c of customers(); track c.customerId) {
                <mat-option [value]="c.customerId">{{ c.firstName }} {{ c.lastName }} ({{ c.customerId }})</mat-option>
              }
            </mat-select>
            <mat-error>Customer is required</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Package</mat-label>
            <mat-select formControlName="packageId" (selectionChange)="pickPackage($event.value)">
              @for (p of sellablePackages(); track p.packageId) {
                <mat-option [value]="p.packageId">{{ p.packageName }}</mat-option>
              }
            </mat-select>
            <mat-error>Package is required</mat-error>
          </mat-form-field>

          <!-- Package type fills in automatically once a package is picked (UC5) -->
          @if (selectedPackage(); as p) {
            <p class="package-type">
              {{ p.classType }} · {{ p.packageCategory }} ·
              {{ p.numberOfClasses === unlimited ? 'Unlimited' : p.numberOfClasses + ' classes' }} ·
              {{ p.price | currency }}
            </p>
          }

          <mat-form-field appearance="outline">
            <mat-label>Amount paid</mat-label>
            <input matInput type="number" min="0" formControlName="amountPaid" />
            <mat-error>Amount paid is required</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Payment mode</mat-label>
            <mat-select formControlName="paymentMode">
              @for (mode of paymentModes; track mode) {
                <mat-option [value]="mode">{{ mode }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Payment date and time</mat-label>
            <input matInput type="datetime-local" formControlName="paymentDate" />
            <mat-error>Payment date is required</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Valid from</mat-label>
            <input matInput type="date" formControlName="validityStart" />
            <mat-error>Valid from is required</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Valid until</mat-label>
            <input matInput type="date" formControlName="validityEnd" />
            <mat-error>Valid until is required</mat-error>
          </mat-form-field>

          <!-- The same UC5 rules the server checks -->
          @if (form.hasError('amountMismatch')) {
            <mat-error>Amount must be {{ selectedPackage()?.price | currency }}</mat-error>
          }
          @if (form.hasError('outsidePackage')) {
            <mat-error>Validity dates must be within the package dates</mat-error>
          }
          @if (form.hasError('endBeforeStart')) {
            <mat-error>Valid until must be after valid from</mat-error>
          }
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

    .fields {
      display: flex;
      flex-direction: column;
      padding-top: 0.5rem;
    }

    .package-type {
      margin: 0 0 1rem;
    }
  `,
})
export class Sales {
  private readonly saleService = inject(SaleService);
  private readonly customerService = inject(CustomerService);
  private readonly packageService = inject(PackageService);
  private readonly dialog = inject(MatDialog);
  private readonly formDialog = viewChild.required<TemplateRef<unknown>>('formDialog');
  private dialogRef?: MatDialogRef<unknown>;

  protected readonly paymentModes = PAYMENT_MODES;
  protected readonly unlimited = UNLIMITED;
  protected readonly columns = ['paymentDate', 'customer', 'package', 'amountPaid', 'validityEnd'];
  protected readonly sales = signal<Sale[]>([]);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly packages = signal<Package[]>([]);
  protected readonly selectedPackage = signal<Package | null>(null);

  // Lookups so the table can show names instead of IDs
  protected readonly customerNames = computed(
    () => new Map(this.customers().map((c) => [c.customerId, `${c.firstName} ${c.lastName}`]))
  );
  protected readonly packageNames = computed(
    () => new Map(this.packages().map((p) => [p.packageId, p.packageName]))
  );
  // Only packages that haven't ended can be sold
  protected readonly sellablePackages = computed(() =>
    this.packages().filter((p) => p.endDate.slice(0, 10) >= localNow().slice(0, 10))
  );

  /** The same UC5 checks the server makes, so the manager sees them before saving. Dates are compared as YYYY-MM-DD. */
  private readonly saleRules: ValidatorFn = (group) => {
    const pkg = this.selectedPackage();
    const { amountPaid, validityStart, validityEnd } = group.value;
    if (!pkg) {
      return null;
    }
    if (amountPaid !== null && amountPaid !== pkg.price) {
      return { amountMismatch: true };
    }
    if (validityStart < pkg.startDate.slice(0, 10) || validityEnd > pkg.endDate.slice(0, 10)) {
      return { outsidePackage: true };
    }
    if (validityEnd <= validityStart) {
      return { endBeforeStart: true };
    }
    return null;
  };

  protected readonly form = inject(FormBuilder).group(
    {
      customerId: ['', Validators.required],
      packageId: ['', Validators.required],
      amountPaid: [null as number | null, Validators.required],
      paymentMode: [PAYMENT_MODES[0] as Sale['paymentMode'], Validators.required],
      paymentDate: ['', Validators.required],
      validityStart: ['', Validators.required],
      validityEnd: ['', Validators.required],
    },
    { validators: this.saleRules }
  );

  constructor() {
    this.load();
    this.customerService.list().subscribe({
      next: (list) => this.customers.set(list),
      error: (error) => this.showError(error),
    });
    this.packageService.list().subscribe({
      next: (list) => this.packages.set(list),
      error: (error) => this.showError(error),
    });
  }

  private load() {
    this.saleService.list().subscribe({
      next: (list) => this.sales.set(list),
      error: (error) => this.showError(error),
    });
  }

  /** Opens an empty form, with the payment time set to now and validity starting today. */
  protected openForm() {
    this.selectedPackage.set(null);
    this.form.reset({
      paymentMode: PAYMENT_MODES[0],
      paymentDate: localNow(),
      validityStart: localNow().slice(0, 10),
    });
    this.dialogRef = this.dialog.open(this.formDialog(), { width: '480px' });
  }

  /** Shows the picked package's type and defaults "valid until" to the package's end date. */
  protected pickPackage(packageId: string) {
    const pkg = this.packages().find((p) => p.packageId === packageId) ?? null;
    this.selectedPackage.set(pkg);
    if (pkg) {
      this.form.patchValue({ validityEnd: pkg.endDate.slice(0, 10) });
    }
    // Re-run the UC5 checks now that the package is known
    this.form.updateValueAndValidity();
  }

  /** Records the sale, then shows the customer's new balance (UC5). */
  protected save() {
    const value = this.form.getRawValue();
    const data = {
      customerId: value.customerId ?? '',
      packageId: value.packageId ?? '',
      amountPaid: value.amountPaid ?? 0,
      paymentMode: value.paymentMode ?? PAYMENT_MODES[0],
      // The input gives local time; send it as a full timestamp so the server reads the same moment
      paymentDate: new Date(value.paymentDate ?? '').toISOString(),
      validityStart: value.validityStart ?? '',
      validityEnd: value.validityEnd ?? '',
    };
    this.saleService.create(data).subscribe({
      next: ({ customer }) => {
        this.dialogRef?.close();
        this.load();
        const name = `${customer.firstName} ${customer.lastName}`;
        const message =
          this.selectedPackage()?.numberOfClasses === UNLIMITED
            ? `Sale recorded. Unlimited package, so ${name}'s balance stays ${customer.classBalance}.`
            : `Sale recorded. ${name}'s class balance is now ${customer.classBalance}.`;
        alertAction(this.dialog, message);
      },
      error: (error) => {
        this.dialogRef?.addPanelClass('dialog-hidden');
        this.showError(error, false).subscribe(() =>
          this.dialogRef?.removePanelClass('dialog-hidden')
        );
      },
    });
  }

  /** Shows the server's message in a dialog. Pass false when another dialog is open, so two dark layers don't stack. */
  private showError(error: HttpErrorResponse, hasBackdrop = true) {
    return alertAction(this.dialog, error.error?.message ?? error.message, hasBackdrop);
  }
}
