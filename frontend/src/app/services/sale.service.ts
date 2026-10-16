import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Customer } from '../models/customer.model';
import { Sale } from '../models/sale.model';
import { API_URL } from './auth.service';

export type SaleInput = Omit<Sale, '_id'>;

/** API calls for sales. */
@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/sales`;

  list() {
    return this.http.get<Sale[]>(this.url);
  }

  /** Also returns the customer, so the screen can show the new balance. */
  create(data: SaleInput) {
    return this.http.post<{ sale: Sale; customer: Customer }>(this.url, data);
  }
}
