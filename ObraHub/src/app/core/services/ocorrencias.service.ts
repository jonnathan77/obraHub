import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Ocorrencia } from '../models';
import { AuthService } from './auth.service';

const API = 'http://localhost:3000';

@Injectable({
  providedIn: 'root'
})
export class OcorrenciasService {
  constructor(private http: HttpClient, private auth: AuthService) { }

  private headers() {
    const token = this.auth.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: token ? `Bearer ${token}` : ''
      })
    };
  }

  /**
   * Listar todas as ocorrências de uma obra
   */
  getByObraId(obraId: string): Observable<Ocorrencia[]> {
    return this.http.get<{ success: boolean; data: Ocorrencia[] }>(
      `${API}/ocorrencias/obra/${obraId}`,
      this.headers()
    ).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Erro ao listar ocorrências:', error);
        return of([]);
      })
    );
  }

  /**
   * Obter ocorrência por ID
   */
  getById(id: string): Observable<Ocorrencia | null> {
    return this.http.get<{ success: boolean; data: Ocorrencia }>(
      `${API}/ocorrencias/${id}`,
      this.headers()
    ).pipe(
      map(response => response.data || null),
      catchError(() => of(null))
    );
  }

  /**
   * Listar todas (compatibilidade)
   */
  getAll(): Observable<Ocorrencia[]> {
    return of([]);
  }

  /**
   * Criar nova ocorrência
   */
  create(ocorrencia: any): Observable<Ocorrencia | null> {
    return this.http.post<{ success: boolean; data: Ocorrencia }>(
      `${API}/ocorrencias`,
      ocorrencia,
      this.headers()
    ).pipe(
      map(response => response.data || null),
      catchError(error => {
        console.error('Erro ao criar ocorrência:', error);
        return of(null);
      })
    );
  }

  /**
   * Atualizar ocorrência
   */
  update(id: string, ocorrencia: any): Observable<Ocorrencia | null> {
    return this.http.patch<{ success: boolean; data: Ocorrencia }>(
      `${API}/ocorrencias/${id}`,
      ocorrencia,
      this.headers()
    ).pipe(
      map(response => response.data || null),
      catchError(error => {
        console.error('Erro ao atualizar ocorrência:', error);
        return of(null);
      })
    );
  }

  /**
   * Deletar ocorrência
   */
  delete(id: string): Observable<any> {
    return this.http.delete(
      `${API}/ocorrencias/${id}`,
      this.headers()
    ).pipe(
      catchError(error => {
        console.error('Erro ao deletar ocorrência:', error);
        return of(null);
      })
    );
  }
}
