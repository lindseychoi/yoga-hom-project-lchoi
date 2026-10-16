import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Customer } from '../models/customer.model';
import { Notification } from '../models/notification.model';
import { API_URL } from './auth.service';

/** The balance isn't part of the form: it only changes through sales and attendance. */
export type CustomerInput = Omit<
  Customer,
  '_id' | 'customerId' | 'classBalance' | 'createdAt' | 'updatedAt'
>;

/** API calls for customers. exists() asks the server whether a name is already taken. */
@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/customers`;

  list() {
    return this.http.get<Customer[]>(this.url);
  }

  exists(firstName: string, lastName: string) {
    return this.http.get<{ exists: boolean }>(`${this.url}/check-duplicate`, {
      params: { firstName, lastName },
    });
  }

  /** Also returns the welcome message the server sent. */
  create(data: CustomerInput) {
    return this.http.post<{ customer: Customer; notification: Notification }>(this.url, data);
  }

  update(id: string, data: CustomerInput) {
    return this.http.put<Customer>(`${this.url}/${id}`, data);
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
