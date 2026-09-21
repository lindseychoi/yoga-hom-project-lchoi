import { HttpErrorResponse } from '@angular/common/http';
import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Observable } from 'rxjs';
import { alertAction, confirmAction } from '../../components/confirm-dialog';
import { CLASS_TYPES, DAYS_OF_WEEK, YogaClass } from '../../models/class.model';
import { Instructor } from '../../models/instructor.model';
import { ClassService } from '../../services/class.service';
import { InstructorService } from '../../services/instructor.service';

/** Table of classes with add, edit, and delete. The form opens as a dialog defined in this template. */
@Component({
  selector: 'app-classes',
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
    <button mat-flat-button type="button" (click)="openForm()">Add class</button>

    <table mat-table [dataSource]="classes()">
      <ng-container matColumnDef="dayOfWeek">
        <th mat-header-cell *matHeaderCellDef>Day</th>
        <td mat-cell *matCellDef="let c">{{ c.dayOfWeek }}</td>
      </ng-container>
      <ng-container matColumnDef="time">
        <th mat-header-cell *matHeaderCellDef>Time</th>
        <td mat-cell *matCellDef="let c">{{ c.time }}</td>
      </ng-container>
      <ng-container matColumnDef="className">
        <th mat-header-cell *matHeaderCellDef>Class</th>
        <td mat-cell *matCellDef="let c">{{ c.className }}</td>
      </ng-container>
      <ng-container matColumnDef="classType">
        <th mat-header-cell *matHeaderCellDef>Type</th>
        <td mat-cell *matCellDef="let c">{{ c.classType }}</td>
      </ng-container>
      <ng-container matColumnDef="instructor">
        <th mat-header-cell *matHeaderCellDef>Instructor</th>
        <td mat-cell *matCellDef="let c">{{ instructorNames().get(c.instructorId) ?? c.instructorId }}</td>
      </ng-container>
      <ng-container matColumnDef="payRate">
        <th mat-header-cell *matHeaderCellDef>Pay rate</th>
        <td mat-cell *matCellDef="let c">{{ c.payRate }}</td>
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
      <h2 mat-dialog-title>{{ editing ? 'Edit' : 'Add' }} class</h2>
      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-dialog-content class="fields">
          <mat-form-field appearance="outline">
            <mat-label>Instructor</mat-label>
            <mat-select formControlName="instructorId">
              @for (i of instructors(); track i.instructorId) {
                <mat-option [value]="i.instructorId">{{ i.firstName }} {{ i.lastName }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Day</mat-label>
            <mat-select formControlName="dayOfWeek">
              @for (day of days; track day) {
                <mat-option [value]="day">{{ day }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Time</mat-label>
            <input matInput type="time" formControlName="time" />
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
            <mat-label>Class name</mat-label>
            <input matInput formControlName="className" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Pay rate</mat-label>
            <input matInput type="number" min="0" formControlName="payRate" />
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
export class Classes {
  private readonly classService = inject(ClassService);
  private readonly instructorService = inject(InstructorService);
  private readonly dialog = inject(MatDialog);
  private readonly formDialog = viewChild.required<TemplateRef<unknown>>('formDialog');
  private dialogRef?: MatDialogRef<unknown>;

  protected readonly days = DAYS_OF_WEEK;
  protected readonly types = CLASS_TYPES;
  protected readonly columns = ['dayOfWeek', 'time', 'className', 'classType', 'instructor', 'payRate', 'actions'];
  protected readonly classes = signal<YogaClass[]>([]);
  protected readonly instructors = signal<Instructor[]>([]);
  protected readonly instructorNames = computed(
    () => new Map(this.instructors().map((i) => [i.instructorId, `${i.firstName} ${i.lastName}`]))
  );
  protected editing: YogaClass | null = null;
  protected readonly form = inject(FormBuilder).nonNullable.group({
    instructorId: ['', Validators.required],
    dayOfWeek: [DAYS_OF_WEEK[0] as YogaClass['dayOfWeek'], Validators.required],
    time: ['', Validators.required],
    classType: [CLASS_TYPES[0] as YogaClass['classType'], Validators.required],
    className: ['', Validators.required],
    payRate: [0, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    this.load();
    this.instructorService.list().subscribe({
      next: (list) => this.instructors.set(list),
      error: (error) => this.showError(error),
    });
  }

  /** Loads the classes, sorted Monday to Sunday and then by time. */
  private load() {
    this.classService.list().subscribe({
      next: (list) =>
        this.classes.set(
          [...list].sort(
            (a, b) =>
              DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek) ||
              a.time.localeCompare(b.time)
          )
        ),
      error: (error) => this.showError(error),
    });
  }

  /** Opens the add form, or the edit form filled in when a class is passed in. */
  protected openForm(yogaClass?: YogaClass) {
    this.editing = yogaClass ?? null;
    this.form.reset(yogaClass);
    this.dialogRef = this.dialog.open(this.formDialog(), { width: '480px' });
  }

  protected save() {
    const data = this.form.getRawValue();
    this.persist(
      this.editing ? this.classService.update(this.editing._id, data) : this.classService.create(data)
    );
  }

  /** Saves, closes the form, and reloads the table. On an error (such as a taken time slot), shows the message and brings the form back. */
  private persist(request: Observable<YogaClass>) {
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

  protected remove(yogaClass: YogaClass) {
    confirmAction(this.dialog, {
      message: `Delete ${yogaClass.className} on ${yogaClass.dayOfWeek} at ${yogaClass.time}?`,
      confirmLabel: 'Delete',
    }).subscribe((ok) => {
      if (!ok) {
        return;
      }
      this.classService.remove(yogaClass._id).subscribe({
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
