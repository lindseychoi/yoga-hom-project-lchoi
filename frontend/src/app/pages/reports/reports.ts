import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { alertAction } from '../../components/confirm-dialog';
import { CustomerRow, InstructorRow, PackageSalesRow, PaymentRow } from '../../models/report.model';
import { AuthService } from '../../services/auth.service';
import { ReportService } from '../../services/report.service';

/** This month as YYYY-MM in local time, the format a month input expects. */
const thisMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/** UC7 studio reports for managers (four tabs); an instructor sees only their own performance (UC9). */
@Component({
  selector: 'app-reports',
  imports: [CurrencyPipe, MatFormFieldModule, MatInputModule, MatTableModule, MatTabsModule],
  template: `
    @if (auth.isManager()) {
      <mat-tab-group>
        <mat-tab label="Package sales">
          <table mat-table [dataSource]="packageSales()">
            <ng-container matColumnDef="packageName">
              <th mat-header-cell *matHeaderCellDef>Package</th>
              <td mat-cell *matCellDef="let r">{{ r.packageName }}</td>
            </ng-container>
            <ng-container matColumnDef="sold">
              <th mat-header-cell *matHeaderCellDef>Sold</th>
              <td mat-cell *matCellDef="let r">{{ r.sold }}</td>
            </ng-container>
            <ng-container matColumnDef="revenue">
              <th mat-header-cell *matHeaderCellDef>Revenue</th>
              <td mat-cell *matCellDef="let r">{{ r.revenue | currency }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['packageName', 'sold', 'revenue']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['packageName', 'sold', 'revenue']"></tr>
          </table>
        </mat-tab>

        <mat-tab label="Instructors">
          <table mat-table [dataSource]="instructors()">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Instructor</th>
              <td mat-cell *matCellDef="let r">{{ r.name }}</td>
            </ng-container>
            <ng-container matColumnDef="classes">
              <th mat-header-cell *matHeaderCellDef>Classes</th>
              <td mat-cell *matCellDef="let r">{{ r.classes.join(', ') }}</td>
            </ng-container>
            <ng-container matColumnDef="checkIns">
              <th mat-header-cell *matHeaderCellDef>Check-ins</th>
              <td mat-cell *matCellDef="let r">{{ r.checkIns }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['name', 'classes', 'checkIns']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['name', 'classes', 'checkIns']"></tr>
          </table>
        </mat-tab>

        <mat-tab label="Customers">
          <table mat-table [dataSource]="customers()">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Customer</th>
              <td mat-cell *matCellDef="let r">{{ r.name }}</td>
            </ng-container>
            <ng-container matColumnDef="classBalance">
              <th mat-header-cell *matHeaderCellDef>Balance</th>
              <td mat-cell *matCellDef="let r">{{ r.classBalance }}</td>
            </ng-container>
            <ng-container matColumnDef="packages">
              <th mat-header-cell *matHeaderCellDef>Packages</th>
              <td mat-cell *matCellDef="let r">{{ packageList(r) }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['name', 'classBalance', 'packages']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['name', 'classBalance', 'packages']"></tr>
          </table>
        </mat-tab>

        <mat-tab label="Teacher payment">
          <mat-form-field appearance="outline" class="month">
            <mat-label>Month</mat-label>
            <input matInput type="month" [value]="month()" (change)="pickMonth($any($event.target).value)" />
          </mat-form-field>
          <table mat-table [dataSource]="payments()">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Instructor</th>
              <td mat-cell *matCellDef="let r">{{ r.name }}</td>
            </ng-container>
            <ng-container matColumnDef="classesHeld">
              <th mat-header-cell *matHeaderCellDef>Classes held</th>
              <td mat-cell *matCellDef="let r">{{ r.classesHeld }}</td>
            </ng-container>
            <ng-container matColumnDef="pay">
              <th mat-header-cell *matHeaderCellDef>Pay</th>
              <td mat-cell *matCellDef="let r">{{ r.pay | currency }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['name', 'classesHeld', 'pay']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['name', 'classesHeld', 'pay']"></tr>
          </table>
        </mat-tab>
      </mat-tab-group>
    } @else {
      <h2>My performance</h2>
      <mat-form-field appearance="outline" class="month">
        <mat-label>Month</mat-label>
        <input matInput type="month" [value]="month()" (change)="pickMonth($any($event.target).value)" />
      </mat-form-field>
      @if (myPerformance(); as me) {
        <p>Classes held: {{ me.classesHeld }}</p>
        <p>Check-ins: {{ me.checkIns }}</p>
        <p>Pay: {{ me.pay | currency }}</p>
      }
    }
  `,
  styles: `
    table {
      width: 100%;
      margin-top: 1rem;
      --mat-table-background-color: transparent;
    }

    .month {
      margin-top: 1rem;
    }
  `,
})
export class Reports {
  protected readonly auth = inject(AuthService);
  private readonly service = inject(ReportService);
  private readonly dialog = inject(MatDialog);

  protected readonly month = signal(thisMonth());
  protected readonly packageSales = signal<PackageSalesRow[]>([]);
  protected readonly instructors = signal<InstructorRow[]>([]);
  protected readonly customers = signal<CustomerRow[]>([]);
  protected readonly payments = signal<PaymentRow[]>([]);
  protected readonly myPerformance = signal<PaymentRow | null>(null);

  constructor() {
    // Managers load all four reports; instructors only their own
    if (this.auth.isManager()) {
      this.service.packageSales().subscribe({
        next: (rows) => this.packageSales.set(rows),
        error: (error) => this.showError(error),
      });
      this.service.instructors().subscribe({
        next: (rows) => this.instructors.set(rows),
        error: (error) => this.showError(error),
      });
      this.service.customers().subscribe({
        next: (rows) => this.customers.set(rows),
        error: (error) => this.showError(error),
      });
    }
    this.loadMonth();
  }

  /** Reloads the month-based report when a new month is picked. */
  protected pickMonth(month: string) {
    if (!month) {
      return;
    }
    this.month.set(month);
    this.loadMonth();
  }

  /** Teacher payment for managers, or the instructor's own performance, for the chosen month. */
  private loadMonth() {
    if (this.auth.isManager()) {
      this.service.teacherPayment(this.month()).subscribe({
        next: (rows) => this.payments.set(rows),
        error: (error) => this.showError(error),
      });
    } else {
      this.service.myPerformance(this.month()).subscribe({
        next: (row) => this.myPerformance.set(row),
        error: (error) => this.showError(error),
      });
    }
  }

  /** Packages for the customer table, e.g. "10-class pass (active), Drop-in (expired)". */
  protected packageList(row: CustomerRow): string {
    return row.packages.map((p) => `${p.packageName} (${p.status})`).join(', ');
  }

  private showError(error: HttpErrorResponse) {
    alertAction(this.dialog, error.error?.message ?? error.message);
  }
}
