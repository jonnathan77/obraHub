import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Atividade } from '../models';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class AtividadesService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers() {
    const token = this.auth.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: token ? `Bearer ${token}` : ''
      })
    };
  }

  getByObraId(obraId: number): Observable<Atividade[]> {
    return this.http.get<{ success: boolean; data: Atividade[] }>(`${API}/works/${obraId}/atividades`, this.headers()).pipe(
      map(r => r.data || []),
      catchError(() => of([]))
    );
  }

  create(obraId: number, payload: { etapa: string; descricao: string; responsavel?: string; estrutura_obra_id?: number }): Observable<Atividade | null> {
    return this.http.post<{ success: boolean; data: Atividade }>(`${API}/works/${obraId}/atividades`, payload, this.headers()).pipe(
      map(r => r.data || null),
      catchError(() => of(null))
    );
  }

  update(id: number, payload: Partial<Atividade>): Observable<Atividade | null> {
    return this.http.put<{ success: boolean; data: Atividade }>(`${API}/atividades/${id}`, payload, this.headers()).pipe(
      map(r => r.data || null),
      catchError(() => of(null))
    );
  }

  delete(id: number): Observable<boolean> {
    return this.http.delete<{ success: boolean }>(`${API}/atividades/${id}`, this.headers()).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}
