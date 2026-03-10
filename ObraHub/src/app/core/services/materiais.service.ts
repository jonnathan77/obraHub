import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Material } from '../models';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class MateriaisService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(params?: HttpParams) {
    const token = this.auth.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: token ? `Bearer ${token}` : ''
      }),
      params
    };
  }

  getAll(obraId?: string | number): Observable<Material[]> {
    const params = obraId != null ? new HttpParams().set('obraId', String(obraId)) : undefined;
    return this.http.get<{ success: boolean; data: Material[] }>(
      `${API}/materiais`,
      this.headers(params)
    ).pipe(
      map(r => r.data || []),
      catchError(() => of([]))
    );
  }

  create(payload: { obraid: number; nome: string; unidade: string; estoque_inicial?: number }): Observable<Material | null> {
    return this.http.post<{ success: boolean; data: Material }>(
      `${API}/materiais`,
      payload,
      this.headers()
    ).pipe(
      map(r => r.data || null),
      catchError(() => of(null))
    );
  }

  update(id: number, payload: Partial<Material>): Observable<Material | null> {
    return this.http.put<{ success: boolean; data: Material }>(
      `${API}/materiais/${id}`,
      payload,
      this.headers()
    ).pipe(
      map(r => r.data || null),
      catchError(() => of(null))
    );
  }

  delete(id: number): Observable<boolean> {
    return this.http.delete<{ success: boolean }>(
      `${API}/materiais/${id}`,
      this.headers()
    ).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}
