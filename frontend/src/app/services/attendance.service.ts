import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Attendance } from '../models/attendance.model';
import { Notification } from '../models/notification.model';
import { API_URL } from './auth.service';

export interface AttendanceInput {
  classId: string;
  date: string;
  time: string;
  customerIds: string[];
}

/** API calls for attendance. */
@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/attendance`;

  list() {
    return this.http.get<Attendance[]>(this.url);
  }

  /** confirmed = true after the user has said "save anyway" to the server's warnings. */
  record(data: AttendanceInput, confirmed = false) {
    return this.http.post<{ record: Attendance; notifications: Notification[] }>(this.url, {
      ...data,
      confirmed,
    });
  }
}
