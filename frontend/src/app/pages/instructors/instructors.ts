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
import { Instructor } from '../../models/instructor.model';
import { InstructorService } from '../../services/instructor.service';

/** Table of instructors with add, edit, and delete. The form opens as a dialog defined in this template. */
@Component({
  selector: 'app-instructors',
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
    <button mat-flat-button type="button" (click)="openForm()">Add instructor</button>

    <table mat-table [dataSource]="instructors()">
      <ng-container matColumnDef="instructorId">
        <th mat-header-cell *matHeaderCellDef>ID</th>
        <td mat-cell *matCellDef="let i">{{ i.instructorId }}</td>
      </ng-container>
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let i">{{ i.firstName }} {{ i.lastName }}</td>
      </ng-container>
      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef>Email</th>
        <td mat-cell *matCellDef="let i">{{ i.email }}</td>
      </ng-container>
      <ng-container matColumnDef="phone">
        <th mat-header-cell *matHeaderCellDef>Phone</th>
        <td mat-cell *matCellDef="let i">{{ i.phone }}</td>
      </ng-container>
      <ng-container matColumnDef="preferredContact">
        <th mat-header-cell *matHeaderCellDef>Preferred contact</th>
        <td mat-cell *matCellDef="let i">{{ i.preferredContact }}</td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let i">
          <button mat-button type="button" (click)="openForm(i)">Edit</button>
          <button mat-button type="button" (click)="remove(i)">Delete</button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns"></tr>
    </table>

    <ng-template #formDialog>
      <h2 mat-dialog-title>{{ editing ? 'Edit' : 'Add' }} instructor</h2>
      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-dialog-content class="fields">
          <mat-form-field appearance="outline">
            <mat-label>First name</mat-label>
            <input matInput formControlName="firstName" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Last name</mat-label>
            <input matInput formControlName="lastName" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Address</mat-label>
            <input matInput formControlName="address" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Phone</mat-label>
            <input matInput formControlName="phone" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
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

    .fields {
      display: flex;
      flex-direction: column;
      padding-top: 0.5rem;
    }
  `,
})
export class Instructors {
  private readonly service = inject(InstructorService);
  private readonly dialog = inject(MatDialog);
  private readonly formDialog = viewChild.required<TemplateRef<unknown>>('formDialog');
  private dialogRef?: MatDialogRef<unknown>;

  protected readonly columns = ['instructorId', 'name', 'email', 'phone', 'preferredContact', 'actions'];
  protected readonly instructors = signal<Instructor[]>([]);
  protected editing: Instructor | null = null;
  protected readonly form = inject(FormBuilder).nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    address: [''],
    phone: [''],
    email: ['', Validators.email],
    preferredContact: ['email' as Instructor['preferredContact']],
  });

  constructor() {
    this.load();
  }

  private load() {
    this.service.list().subscribe({
      next: (list) => this.instructors.set(list),
      error: (error) => this.showError(error),
    });
  }

  /** Opens the add form, or the edit form filled in when an instructor is passed in. */
  protected openForm(instructor?: Instructor) {
    this.editing = instructor ?? null;
    this.form.reset(instructor);
    this.dialogRef = this.dialog.open(this.formDialog(), { width: '480px' });
  }

  /** On add, first asks whether the name already exists. The form dialog is hidden while that question shows, so nothing typed is lost. */
  protected save() {
    const data = this.form.getRawValue();
    if (this.editing) {
      this.persist(this.service.update(this.editing._id, data));
      return;
    }
    this.service.exists(data.firstName, data.lastName).subscribe({
      next: ({ exists }) => {
        if (!exists) {
          this.persist(this.service.create(data));
          return;
        }
        this.dialogRef?.addPanelClass('dialog-hidden');
        confirmAction(
          this.dialog,
          {
            message: `An instructor named ${data.firstName} ${data.lastName} already exists. Save anyway?`,
            confirmLabel: 'Save anyway',
          },
          false
        ).subscribe((ok) => {
          if (ok) {
            this.persist(this.service.create(data));
          } else {
            this.dialogRef?.removePanelClass('dialog-hidden');
          }
        });
      },
      error: (error) => this.showError(error),
    });
  }

  /** Saves, closes the form, and reloads the table. On an error, shows the message and brings the form back. */
  private persist(request: Observable<Instructor>) {
    request.subscribe({
      next: () => {
        this.dialogRef?.close();
        this.load();
      },
      error: (error) => {
        this.dialogRef?.addPanelClass('dialog-hidden');
        this.showError(error, false).subscribe(() =>
          this.dialogRef?.removePanelClass('dialog-hidden')
        );
      },
    });
  }

  protected remove(instructor: Instructor) {
    confirmAction(this.dialog, {
      message: `Delete ${instructor.firstName} ${instructor.lastName}?`,
      confirmLabel: 'Delete',
    }).subscribe((ok) => {
      if (!ok) {
        return;
      }
      this.service.remove(instructor._id).subscribe({
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
