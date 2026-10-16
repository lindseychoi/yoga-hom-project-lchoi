import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, TemplateRef, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Observable } from 'rxjs';
import { alertAction, confirmAction } from '../../components/confirm-dialog';
import { CLASS_TYPES } from '../../models/class.model';
import { CLASS_COUNTS, PACKAGE_CATEGORIES, Package, UNLIMITED } from '../../models/package.model';
import { PackageService } from '../../services/package.service';

/** Form-level check matching the server: the end date has to be after the start date. */
const endAfterStart: ValidatorFn = (group) => {
  const { startDate, endDate } = group.value;
  return startDate && endDate && endDate <= startDate ? { endBeforeStart: true } : null;
};

/** Table of packages with add, edit, and delete (UC3). The form opens as a dialog defined in this template. */
@Component({
  selector: 'app-packages',
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
    <button mat-flat-button type="button" (click)="openForm()">Add package</button>

    <table mat-table [dataSource]="packages()">
      <ng-container matColumnDef="packageName">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let p">{{ p.packageName }}</td>
      </ng-container>
      <ng-container matColumnDef="packageCategory">
        <th mat-header-cell *matHeaderCellDef>Category</th>
        <td mat-cell *matCellDef="let p">{{ p.packageCategory }}</td>
      </ng-container>
      <ng-container matColumnDef="numberOfClasses">
        <th mat-header-cell *matHeaderCellDef>Classes</th>
        <td mat-cell *matCellDef="let p">{{ p.numberOfClasses === unlimited ? 'Unlimited' : p.numberOfClasses }}</td>
      </ng-container>
      <ng-container matColumnDef="price">
        <th mat-header-cell *matHeaderCellDef>Price</th>
        <td mat-cell *matCellDef="let p">{{ p.price | currency }}</td>
      </ng-container>
      <ng-container matColumnDef="endDate">
        <th mat-header-cell *matHeaderCellDef>Valid until</th>
        <td mat-cell *matCellDef="let p">{{ p.endDate | date }}</td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let p">
          <button mat-button type="button" (click)="openForm(p)">Edit</button>
          <button mat-button type="button" (click)="remove(p)">Delete</button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns"></tr>
    </table>

    <ng-template #formDialog>
      <h2 mat-dialog-title>{{ editing ? 'Edit' : 'Add' }} package</h2>
      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-dialog-content class="fields">
          <mat-form-field appearance="outline">
            <mat-label>Name</mat-label>
            <input matInput formControlName="packageName" />
            <mat-error>Package name is required</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select formControlName="packageCategory">
              @for (category of categories; track category) {
                <mat-option [value]="category">{{ category }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Number of classes</mat-label>
            <mat-select formControlName="numberOfClasses">
              @for (count of counts; track count) {
                <mat-option [value]="count">{{ count === unlimited ? 'Unlimited' : count }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Class type</mat-label>
            <mat-select formControlName="classType">
              @for (type of types; track type) {
                <mat-option [value]="type">{{ type }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Start date</mat-label>
            <input matInput type="date" formControlName="startDate" />
            <mat-error>Start date is required</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>End date</mat-label>
            <input matInput type="date" formControlName="endDate" />
            <mat-error>End date is required</mat-error>
          </mat-form-field>
          @if (form.hasError('endBeforeStart')) {
            <mat-error>End date must be after the start date</mat-error>
          }
          <mat-form-field appearance="outline">
            <mat-label>Price</mat-label>
            <input matInput type="number" min="0" formControlName="price" />
            <mat-error>Price must be 0 or more</mat-error>
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
export class Packages {
  private readonly service = inject(PackageService);
  private readonly dialog = inject(MatDialog);
  private readonly formDialog = viewChild.required<TemplateRef<unknown>>('formDialog');
  private dialogRef?: MatDialogRef<unknown>;

  protected readonly categories = PACKAGE_CATEGORIES;
  protected readonly counts = CLASS_COUNTS;
  protected readonly types = CLASS_TYPES;
  protected readonly unlimited = UNLIMITED;
  protected readonly columns = ['packageName', 'packageCategory', 'numberOfClasses', 'price', 'endDate', 'actions'];
  protected readonly packages = signal<Package[]>([]);
  protected editing: Package | null = null;
  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      packageName: ['', Validators.required],
      packageCategory: [PACKAGE_CATEGORIES[0] as Package['packageCategory'], Validators.required],
      numberOfClasses: [CLASS_COUNTS[0], Validators.required],
      classType: [CLASS_TYPES[0] as Package['classType'], Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
    },
    { validators: endAfterStart }
  );

  constructor() {
    this.load();
  }

  private load() {
    this.service.list().subscribe({
      next: (list) => this.packages.set(list),
      error: (error) => this.showError(error),
    });
  }

  /** Opens the add form, or the edit form filled in when a package is passed in. Dates are cut to YYYY-MM-DD for the date inputs. */
  protected openForm(pkg?: Package) {
    this.editing = pkg ?? null;
    this.form.reset(
      pkg && { ...pkg, startDate: pkg.startDate.slice(0, 10), endDate: pkg.endDate.slice(0, 10) }
    );
    this.dialogRef = this.dialog.open(this.formDialog(), { width: '480px' });
  }

  /** On add, confirms with the new package ID (UC3). */
  protected save() {
    const data = this.form.getRawValue();
    if (this.editing) {
      this.persist(this.service.update(this.editing._id, data));
      return;
    }
    this.persist(this.service.create(data), (pkg) =>
      alertAction(this.dialog, `Saved package ${pkg.packageId}.`)
    );
  }

  /** Saves, closes the form, and reloads the table. On an error, shows the message and brings the form back. */
  private persist(request: Observable<Package>, onSaved?: (pkg: Package) => void) {
    request.subscribe({
      next: (pkg) => {
        this.dialogRef?.close();
        this.load();
        onSaved?.(pkg);
      },
      error: (error) => {
        this.dialogRef?.addPanelClass('dialog-hidden');
        this.showError(error, false).subscribe(() =>
          this.dialogRef?.removePanelClass('dialog-hidden')
        );
      },
    });
  }

  protected remove(pkg: Package) {
    confirmAction(this.dialog, {
      message: `Delete ${pkg.packageName}?`,
      confirmLabel: 'Delete',
    }).subscribe((ok) => {
      if (!ok) {
        return;
      }
      this.service.remove(pkg._id).subscribe({
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
