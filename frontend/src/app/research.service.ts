import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SearchResult } from './models';

@Injectable({ providedIn: 'root' })
export class ResearchService {
  private api = '/api';

  constructor(private http: HttpClient) {}

  search(query: string, rows = 20): Observable<SearchResult> {
    const params = new HttpParams().set('q', query).set('rows', String(rows));
    return this.http.get<SearchResult>(`${this.api}/search`, { params });
  }
}