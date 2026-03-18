import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Movimentacao } from '../models';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class MovimentacoesService {
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

  getAll(obraId: string | number): Observable<Movimentacao[]> {
    const params = new HttpParams().set('obraId', String(obraId));
    return this.http.get<{ success: boolean; data: Movimentacao[] }>(
      `${API}/movimentacoes`,
      this.headers(params)
    ).pipe(
      map(r => r.data || []),
      catchError(() => of([]))
    );
  }

  create(data: {
      material_nome: string;
      unidade: string;
      obra_id: number;
      tipo: 'entrada' | 'saida';
      quantidade: number;
      valor_unitario?: number;
      data_movimentacao: string;
    }): Observable<Movimentacao | null> {
    return this.http.post<{ success: boolean; data: Movimentacao }>(
      `${API}/movimentacoes`,
      data,
      this.headers()
    ).pipe(
      map(r => r.data || null),
      catchError(() => of(null))
    );
  }
}
