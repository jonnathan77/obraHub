import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Foto } from '../models';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class FotosService {
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
   * Listar todas as fotos de uma obra
   */
  getByObraId(obraId: string): Observable<Foto[]> {
    return this.http.get<{ success: boolean; data: Foto[] }>(
      `${API}/fotos/obra/${obraId}`,
      this.headers()
    ).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Erro ao listar fotos:', error);
        return of([]);
      })
    );
  }

  /**
   * Obter foto por ID
   */
  getById(id: string): Observable<Foto | null> {
    return this.http.get<{ success: boolean; data: Foto }>(
      `${API}/fotos/${id}`,
      this.headers()
    ).pipe(
      map(response => response.data || null),
      catchError(() => of(null))
    );
  }

  /**
   * Listar todas (compatibilidade)
   */
  getAll(): Observable<Foto[]> {
    return of([]);
  }

  /**
   * Fazer upload de arquivo de foto para Cloudinary
   */
  uploadFile(file: File, obraId: string, descricao: string): Observable<Foto | null> {
    const formData = new FormData();
    formData.append('foto', file);
    formData.append('obra_id', obraId);
    formData.append('descricao', descricao);

    return this.http.post<{ success: boolean; data: Foto }>(
      `${API}/fotos`,
      formData,
      this.headers()
    ).pipe(
      map(response => response.data || null),
      catchError(error => {
        console.error('Erro ao fazer upload de foto:', error);
        return of(null);
      })
    );
  }

  /**
   * Atualizar descricao da foto
   */
  update(id: string, descricao: string): Observable<Foto | null> {
    return this.http.patch<{ success: boolean; data: Foto }>(
      `${API}/fotos/${id}`,
      { descricao },
      this.headers()
    ).pipe(
      map(response => response.data || null),
      catchError(error => {
        console.error('Erro ao atualizar foto:', error);
        return of(null);
      })
    );
  }

  /**
   * Deletar foto
   */
  delete(id: string): Observable<any> {
    return this.http.delete(
      `${API}/fotos/${id}`,
      this.headers()
    ).pipe(
      catchError(error => {
        console.error('Erro ao deletar foto:', error);
        return of(null);
      })
    );
  }
}

