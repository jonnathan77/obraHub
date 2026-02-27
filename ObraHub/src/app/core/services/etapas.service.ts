import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Etapa } from '../models';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class EtapasService {
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
   * Listar todas as etapas de uma obra
   */
  getByObraId(obraId: string): Observable<Etapa[]> {
    return this.http.get<{ success: boolean; data: Etapa[] }>(
      `${API}/etapas/obra/${obraId}`,
      this.headers()
    ).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Erro ao listar etapas:', error);
        return of([]);
      })
    );
  }

  /**
   * Obter etapa por ID
   */
  getById(id: string): Observable<Etapa | null> {
    return this.http.get<{ success: boolean; data: Etapa }>(
      `${API}/etapas/${id}`,
      this.headers()
    ).pipe(
      map(response => response.data || null),
      catchError(() => of(null))
    );
  }

  /**
   * Listar todas as etapas (compatibilidade)
   */
  getAll(): Observable<Etapa[]> {
    return of([]);
  }

  /**
   * Criar nova etapa
   */
  create(etapa: any): Observable<Etapa | null> {
    return this.http.post<{ success: boolean; data: Etapa }>(
      `${API}/etapas`,
      etapa,
      this.headers()
    ).pipe(
      map(response => response.data || null),
      catchError(error => {
        console.error('Erro ao criar etapa:', error);
        return of(null);
      })
    );
  }

  /**
   * Atualizar etapa
   */
  update(id: string, etapa: any): Observable<Etapa | null> {
    return this.http.patch<{ success: boolean; data: Etapa }>(
      `${API}/etapas/${id}`,
      etapa,
      this.headers()
    ).pipe(
      map(response => response.data || null),
      catchError(error => {
        console.error('Erro ao atualizar etapa:', error);
        return of(null);
      })
    );
  }

  /**
   * Deletar etapa
   */
  delete(id: string): Observable<any> {
    return this.http.delete(
      `${API}/etapas/${id}`,
      this.headers()
    ).pipe(
      catchError(error => {
        console.error('Erro ao deletar etapa:', error);
        return of(null);
      })
    );
  }
}
