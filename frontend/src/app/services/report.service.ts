import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { CustomerRow, InstructorRow, PackageSalesRow, PaymentRow } from '../models/report.model';
import { API_URL } from './auth.service';

/** API calls for reports. month is YYYY-MM. */
@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/reports`;

  packageSales() {
    return this.http.get<PackageSalesRow[]>(`${this.url}/package-sales`);
  }

  instructors() {
    return this.http.get<InstructorRow[]>(`${this.url}/instructors`);
  }

  customers() {
    return this.http.get<CustomerRow[]>(`${this.url}/customers`);
  }

  teacherPayment(month: string) {
    return this.http.get<PaymentRow[]>(`${this.url}/teacher-payment`, { params: { month } });
  }

  /** The logged-in instructor's own performance (UC9). */
  myPerformance(month: string) {
    return this.http.get<PaymentRow>(`${this.url}/me`, { params: { month } });
  }
}
