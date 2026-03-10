import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EstruturaObra } from '../models';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class EstruturaService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers() {
    const token = this.auth.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: token ? `Bearer ${token}` : ''
      })
    };
  }

  getByObraId(obraId: number): Observable<EstruturaObra[]> {
    return this.http.get<{ success: boolean; data: EstruturaObra[] }>(`${API}/works/${obraId}/estrutura`, this.headers()).pipe(
      map(r => r.data || []),
      catchError(() => of([]))
    );
  }

  create(obraId: number, payload: { nome: string; tipo: string; parent_id?: number; ordem?: number }): Observable<EstruturaObra | null> {
    return this.http.post<{ success: boolean; data: EstruturaObra }>(`${API}/works/${obraId}/estrutura`, payload, this.headers()).pipe(
      map(r => r.data || null),
      catchError(() => of(null))
    );
  }

  delete(id: number): Observable<boolean> {
    return this.http.delete<{ success: boolean }>(`${API}/estrutura/${id}`, this.headers()).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}
