import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { alertAction } from '../../components/confirm-dialog';
import { DAYS_OF_WEEK, YogaClass } from '../../models/class.model';
import { Instructor } from '../../models/instructor.model';
import { ClassService } from '../../services/class.service';
import { InstructorService } from '../../services/instructor.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <h2>Weekly schedule</h2>
    <div class="week">
      @for (day of schedule(); track day.name) {
        <section class="day" [class.today]="day.name === today">
          <h3>{{ day.name }}</h3>
          @for (c of day.classes; track c._id) {
            <div class="slot">
              <strong>{{ c.time }}</strong>
              <span>{{ c.className }}</span>
              <small>{{ instructorNames().get(c.instructorId) ?? c.instructorId }}</small>
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: `
    @use '../../../styles/variables' as vars;

    .week {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
    }

    .day {
      padding: 0 0.75rem;
      min-height: 8rem;
    }

    .day + .day {
      border-left: 1px solid vars.$color-periwinkle;
    }

    .day.today {
      background: rgb(vars.$color-periwinkle, 0.07);
      border-radius: 0.75rem;
    }

    h3 {
      margin: 0 0 0.75rem;
    }

    strong {
      font-weight: 500;
    }

    .slot {
      display: flex;
      flex-direction: column;
      margin-bottom: 0.5rem;
      padding: 0.5rem;
      border-radius: 0.75rem;
      background: rgba(vars.$color-blush, 0.22);
      overflow-wrap: anywhere;
    }

    @media (max-width: 1200px) {
      .week {
        grid-template-columns: 1fr;
      }

      .day + .day {
        border-left: none;
        border-top: 1px solid vars.$color-periwinkle;
      }
    }
  `,
})
export class Dashboard {
  private readonly dialog = inject(MatDialog);

  protected readonly today = DAYS_OF_WEEK[(new Date().getDay() + 6) % 7];
  protected readonly classes = signal<YogaClass[]>([]);
  protected readonly instructors = signal<Instructor[]>([]);
  protected readonly instructorNames = computed(
    () => new Map(this.instructors().map((i) => [i.instructorId, `${i.firstName} ${i.lastName}`]))
  );
  protected readonly schedule = computed(() =>
    DAYS_OF_WEEK.map((name) => ({
      name,
      classes: this.classes()
        .filter((c) => c.dayOfWeek === name)
        .sort((a, b) => a.time.localeCompare(b.time)),
    }))
  );

  constructor() {
    inject(ClassService)
      .list()
      .subscribe({
        next: (list) => this.classes.set(list),
        error: (error) => this.showError(error),
      });
    inject(InstructorService)
      .list()
      .subscribe({
        next: (list) => this.instructors.set(list),
        error: (error) => this.showError(error),
      });
  }

  private showError(error: HttpErrorResponse) {
    alertAction(this.dialog, error.error?.message ?? error.message);
  }
}
