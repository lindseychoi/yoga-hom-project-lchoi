import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { alertAction, confirmAction } from '../../components/confirm-dialog';
import { Attendance as AttendanceSheet } from '../../models/attendance.model';
import { DAYS_OF_WEEK, YogaClass } from '../../models/class.model';
import { Customer } from '../../models/customer.model';
import { AttendanceInput, AttendanceService } from '../../services/attendance.service';
import { ClassService } from '../../services/class.service';
import { CustomerService } from '../../services/customer.service';

/** Now as 'YYYY-MM-DDTHH:mm' in local time, so it can fill the date and time inputs. */
const localNow = (): string => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

/**
 * Past attendance sheets and a dialog to record a new one (UC6).
 * Managers see every class; instructors only see their own (the server filters both lists).
 */
@Component({
  selector: 'app-attendance',
  imports: [
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
    <button mat-flat-button type="button" (click)="openForm()">Record attendance</button>

    <table mat-table [dataSource]="sheets()">
      <ng-container matColumnDef="date">
        <th mat-header-cell *matHeaderCellDef>Date</th>
        <!-- Stored as midnight UTC, so show it in UTC to avoid a day shift -->
        <td mat-cell *matCellDef="let s">{{ s.date | date: 'mediumDate' : 'UTC' }}</td>
      </ng-container>
      <ng-container matColumnDef="time">
        <th mat-header-cell *matHeaderCellDef>Time</th>
        <td mat-cell *matCellDef="let s">{{ s.time }}</td>
      </ng-container>
      <ng-container matColumnDef="class">
        <th mat-header-cell *matHeaderCellDef>Class</th>
        <td mat-cell *matCellDef="let s">{{ classNames().get(s.classId) ?? s.classId }}</td>
      </ng-container>
      <ng-container matColumnDef="attendees">
        <th mat-header-cell *matHeaderCellDef>Attendees</th>
        <td mat-cell *matCellDef="let s">{{ attendeeList(s) }}</td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns"></tr>
    </table>

    <ng-template #formDialog>
      <h2 mat-dialog-title>Record attendance</h2>
      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-dialog-content class="fields">
          <mat-form-field appearance="outline">
            <mat-label>Class</mat-label>
            <mat-select formControlName="classId">
              @for (c of classes(); track c._id) {
                <mat-option [value]="c._id">{{ c.className }} · {{ c.dayOfWeek }} {{ c.time }}</mat-option>
              }
            </mat-select>
            <mat-error>Class is required</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Date</mat-label>
            <input matInput type="date" formControlName="date" />
            <mat-hint>{{ form.value.date | date: 'EEEE' : 'UTC' }}</mat-hint>
            <mat-error>Date is required</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Time</mat-label>
            <input matInput type="time" formControlName="time" />
            <mat-error>Time is required</mat-error>
          </mat-form-field>

          <!-- Live UC6 warning; saving is still allowed -->
          @if (scheduleWarning(); as warning) {
            <p class="warning">{{ warning }}</p>
          }

          <mat-form-field appearance="outline">
            <mat-label>Customers</mat-label>
            <mat-select formControlName="customerIds" multiple>
              @for (c of customers(); track c.customerId) {
                <mat-option [value]="c.customerId">
                  {{ c.firstName }} {{ c.lastName }} (balance {{ c.classBalance }})
                </mat-option>
              }
            </mat-select>
            <mat-error>Pick at least one customer</mat-error>
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

    .fields {
      display: flex;
      flex-direction: column;
      padding-top: 0.5rem;
    }

    .warning {
      margin: 0 0 1rem;
      color: var(--mat-sys-error);
    }
  `,
})
export class Attendance {
  private readonly attendanceService = inject(AttendanceService);
  private readonly classService = inject(ClassService);
  private readonly customerService = inject(CustomerService);
  private readonly dialog = inject(MatDialog);
  private readonly formDialog = viewChild.required<TemplateRef<unknown>>('formDialog');
  private dialogRef?: MatDialogRef<unknown>;

  protected readonly columns = ['date', 'time', 'class', 'attendees'];
  protected readonly sheets = signal<AttendanceSheet[]>([]);
  protected readonly classes = signal<YogaClass[]>([]);
  protected readonly customers = signal<Customer[]>([]);

  // Lookups so the table can show names instead of IDs
  protected readonly classNames = computed(
    () => new Map(this.classes().map((c) => [c._id, c.className]))
  );
  private readonly customerNames = computed(
    () => new Map(this.customers().map((c) => [c.customerId, `${c.firstName} ${c.lastName}`]))
  );

  protected readonly form = inject(FormBuilder).nonNullable.group({
    classId: ['', Validators.required],
    date: ['', Validators.required],
    time: ['', Validators.required],
    customerIds: [[] as string[], Validators.required],
  });

  constructor() {
    this.load();
    this.classService.list().subscribe({
      next: (list) => this.classes.set(list),
      error: (error) => this.showError(error),
    });
    this.loadCustomers();
  }

  private load() {
    this.attendanceService.list().subscribe({
      next: (list) => this.sheets.set(list),
      error: (error) => this.showError(error),
    });
  }

  /** Reloaded after each save so the balances shown in the picker stay current. */
  private loadCustomers() {
    this.customerService.list().subscribe({
      next: (list) => this.customers.set(list),
      error: (error) => this.showError(error),
    });
  }

  /** Attendee names for the table, with "(negative)" after anyone saved below 0. */
  protected attendeeList(sheet: AttendanceSheet): string {
    return sheet.entries
      .map((e) => {
        const name = this.customerNames().get(e.customerId) ?? e.customerId;
        return e.negativeBalance ? `${name} (negative)` : name;
      })
      .join(', ');
  }

  /** Opens an empty form with the date and time set to now (UC6). */
  protected openForm() {
    const now = localNow();
    this.form.reset({ date: now.slice(0, 10), time: now.slice(11, 16) });
    this.dialogRef = this.dialog.open(this.formDialog(), { width: '480px' });
  }

  /** Live UC6 warning: the picked date/time doesn't match the class's schedule. */
  protected scheduleWarning(): string | null {
    const yogaClass = this.classes().find((c) => c._id === this.form.value.classId);
    const { date, time } = this.form.value;
    if (!yogaClass || !date || !time) {
      return null;
    }
    // getUTCDay() counts Sunday as 0, so shift it to match the Monday-first list
    const day = DAYS_OF_WEEK[(new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7];
    return day === yogaClass.dayOfWeek && time === yogaClass.time
      ? null
      : `Doesn't match the schedule: this class is on ${yogaClass.dayOfWeek} at ${yogaClass.time}, but you entered ${day} at ${time}.`;
  }

  protected save() {
    this.submit(this.form.getRawValue());
  }

  /**
   * Sends the sheet. If the server answers 409 with warnings (balance, package type, schedule),
   * asks "save anyway?" and sends it again confirmed.
   */
  private submit(data: AttendanceInput, confirmed = false) {
    this.attendanceService.record(data, confirmed).subscribe({
      next: ({ notifications }) => {
        this.dialogRef?.close();
        this.load();
        this.loadCustomers();
        alertAction(
          this.dialog,
          notifications.map((n) => `Sent by ${n.channel} to ${n.to}: "${n.message}"`).join(' ')
        );
      },
      error: (error: HttpErrorResponse) => {
        this.dialogRef?.addPanelClass('dialog-hidden');
        if (error.status === 409 && !confirmed) {
          confirmAction(
            this.dialog,
            { message: `${error.error?.message} Save anyway?`, confirmLabel: 'Save anyway' },
            false
          ).subscribe((ok) => {
            this.dialogRef?.removePanelClass('dialog-hidden');
            if (ok) {
              this.submit(data, true);
            }
          });
          return;
        }
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
