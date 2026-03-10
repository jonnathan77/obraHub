import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TemplateAtividade } from '../models';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class TemplateAtividadesService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers() {
    const token = this.auth.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: token ? `Bearer ${token}` : ''
      })
    };
  }

  getAll(): Observable<TemplateAtividade[]> {
    return this.http.get<{ success: boolean; data: TemplateAtividade[] }>(`${API}/template-atividades`, this.headers()).pipe(
      map(r => r.data || []),
      catchError(() => of([]))
    );
  }

  create(payload: { etapa: string; descricao: string; ordem?: number }): Observable<TemplateAtividade | null> {
    return this.http.post<{ success: boolean; data: TemplateAtividade }>(`${API}/template-atividades`, payload, this.headers()).pipe(
      map(r => r.data || null),
      catchError(() => of(null))
    );
  }
}
