import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Obra } from '../models';
import { AuthService } from './auth.service';

const API = 'http://localhost:3000';

@Injectable({
  providedIn: 'root'
})
export class ObrasService {
  constructor(private http: HttpClient, private auth: AuthService) { }

  private headers() {
    const token = this.auth.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: token ? `Bearer ${token}` : ''
      })
    };
  }

  getAll(): Observable<Obra[]> {
    // Busca obras da empresa do usuário
    return this.http.get<{ success: boolean; data: Obra[] }>(`${API}/works`, this.headers()).pipe(
      map(response => response.data || []),
      catchError(() => of([]))
    );
  }

  getById(id: string): Observable<Obra | null> {
    return this.http.get<{ success: boolean; data: Obra }>(`${API}/works/${id}`, this.headers()).pipe(
      map(response => response.data || null),
      catchError(() => of(null))
    );
  }

  create(obra: any): Observable<any> {
    return this.http.post<{ success: boolean; data: any }>(`${API}/works`, obra, this.headers()).pipe(
      map(response => response.data || null),
      catchError(() => of(null))
    );
  }

  update(id: string, obra: any): Observable<any> {
    return this.http.patch<{ success: boolean; data: any }>(`${API}/works/${id}`, obra, this.headers()).pipe(
      map(response => response.data || null),
      catchError(() => of(null))
    );
  }

  delete(id: string): Observable<any> {
    // backend ainda não tem rota DELETE, manter mock behavior
    return this.http.delete(`${API}/works/${id}`, this.headers()).pipe(
      catchError(() => of(null))
    );
  }
}
