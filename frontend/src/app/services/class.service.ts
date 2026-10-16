import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { YogaClass } from '../models/class.model';
import { Notification } from '../models/notification.model';
import { API_URL } from './auth.service';

export type ClassInput = Omit<YogaClass, '_id' | 'isPublished' | 'createdAt' | 'updatedAt'>;

/** API calls for classes. */
@Injectable({ providedIn: 'root' })
export class ClassService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/classes`;

  list() {
    return this.http.get<YogaClass[]>(this.url);
  }

  create(data: ClassInput) {
    return this.http.post<YogaClass>(this.url, data);
  }

  update(id: string, data: ClassInput) {
    return this.http.put<YogaClass>(`${this.url}/${id}`, data);
  }

  /** Publishes a draft class. Returns the confirmations sent to the instructor and the manager. */
  publish(id: string) {
    return this.http.post<{ class: YogaClass; notifications: Notification[] }>(
      `${this.url}/${id}/publish`,
      {}
    );
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
