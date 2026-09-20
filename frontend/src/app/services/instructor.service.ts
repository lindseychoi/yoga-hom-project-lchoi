import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Instructor } from '../models/instructor.model';
import { API_URL } from './auth.service';

export type InstructorInput = Omit<Instructor, '_id' | 'instructorId' | 'createdAt' | 'updatedAt'>;

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

  create(data: InstructorInput) {
    return this.http.post<Instructor>(this.url, data);
  }

  update(id: string, data: InstructorInput) {
    return this.http.put<Instructor>(`${this.url}/${id}`, data);
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
