import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Instructor } from '../models/instructor.model';
import { Notification } from '../models/notification.model';
import { API_URL } from './auth.service';

export type InstructorInput = Omit<Instructor, '_id' | 'instructorId' | 'createdAt' | 'updatedAt'> & {
  password?: string;
};

/** API calls for instructors. exists() asks the server whether a name is already taken. */
@Injectable({ providedIn: 'root' })
export class InstructorService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/instructors`;

  list() {
    return this.http.get<Instructor[]>(this.url);
  }

  exists(firstName: string, lastName: string) {
    return this.http.get<{ exists: boolean }>(`${this.url}/check-duplicate`, {
      params: { firstName, lastName },
    });
  }

  /** Also returns the welcome message the server sent. */
  create(data: InstructorInput) {
    return this.http.post<{ instructor: Instructor; notification: Notification }>(this.url, data);
  }

  update(id: string, data: InstructorInput) {
    return this.http.put<Instructor>(`${this.url}/${id}`, data);
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
