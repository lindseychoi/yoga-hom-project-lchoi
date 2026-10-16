import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Package } from '../models/package.model';
import { API_URL } from './auth.service';

export type PackageInput = Omit<Package, '_id' | 'packageId'>;

/** API calls for packages. */
@Injectable({ providedIn: 'root' })
export class PackageService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/packages`;

  list() {
    return this.http.get<Package[]>(this.url);
  }

  create(data: PackageInput) {
    return this.http.post<Package>(this.url, data);
  }

  update(id: string, data: PackageInput) {
    return this.http.put<Package>(`${this.url}/${id}`, data);
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
