import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, delay } from 'rxjs/operators';
import { Custo } from '../models';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class CustosService {
  private custos: Custo[] = [
    {
      id: '1',
      obraId: '1',
      descricao: 'Escavadeira aluguel',
      categoria: 'Equipamento',
      valor: 5000,
      data: new Date('2025-01-20')
    },
    {
      id: '2',
      obraId: '1',
      descricao: 'Concreto m³',
      categoria: 'Material',
      valor: 12000,
      data: new Date('2025-02-10')
    },
    {
      id: '3',
      obraId: '1',
      descricao: 'Mão de obra (fundação)',
      categoria: 'Mão de obra',
      valor: 8000,
      data: new Date('2025-03-05')
    },
    {
      id: '4',
      obraId: '2',
      descricao: 'Projeto arquitetônico',
      categoria: 'Serviço',
      valor: 3000,
      data: new Date('2026-01-05')
    }
  ];

  constructor(private http: HttpClient, private auth: AuthService) { }

  private headers(): { headers: HttpHeaders } {
    const token = this.auth.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: token ? `Bearer ${token}` : ''
      })
    };
  }

  getAll(): Observable<Custo[]> {
    return of(this.custos).pipe(delay(500));
  }

  getByObraId(obraId: string): Observable<Custo[]> {
    // fetch from backend view (vw_custos_obra) and adapt to Custo model
    return this.http.get<{ success: boolean; data: any[] }>(
      `${API}/custos/obra/${obraId}`,
      this.headers()
    ).pipe(
      map(response => {
        const rows: any[] = (response as any).data || [];
        // convert each row returned by the view into the Custo interface
        return rows.map((r: any) => {
          return {
            // optional id if available in the view
            id: r.id ? String(r.id) : undefined,
            obraId: String(r.obraid || obraId),
            descricao: r.nome || r.descricao || '',
            categoria: r.tipo || r.categoria || '',
            quantidade: r.quantidade != null ? Number(r.quantidade) : undefined,
            valorunitario: r.valorunitario != null ? parseFloat(r.valorunitario) : undefined,
            valor: parseFloat(r.valortotal || r.valor || 0) || 0,
            data: r.datamovimentacao ? new Date(r.datamovimentacao) : (r.data ? new Date(r.data) : new Date())
          } as Custo;
        });

      }),
      catchError(error => {
        console.error('Erro ao listar custos:', error);
        return of([]);
      })
    );
  }

  getById(id: string): Observable<Custo | undefined> {
    return of(this.custos.find(c => c.id === id)).pipe(delay(500));
  }

  create(custo: Omit<Custo, 'id'>): Observable<Custo> {
    const novoCusto: Custo = {
      ...custo,
      id: (this.custos.length + 1).toString()
    };
    this.custos.push(novoCusto);
    return of(novoCusto).pipe(delay(500));
  }

  update(id: string, custo: Partial<Custo>): Observable<Custo | undefined> {
    const index = this.custos.findIndex(c => c.id === id);
    if (index !== -1) {
      this.custos[index] = { ...this.custos[index], ...custo };
      return of(this.custos[index]).pipe(delay(500));
    }
    return of(undefined).pipe(delay(500));
  }

  delete(id: string): Observable<boolean> {
    const index = this.custos.findIndex(c => c.id === id);
    if (index !== -1) {
      this.custos.splice(index, 1);
      return of(true).pipe(delay(500));
    }
    return of(false).pipe(delay(500));
  }

  getTotalByObraId(obraId: string): Observable<number> {
    const total = this.custos
      .filter(c => c.obraId === obraId)
      .reduce((sum, c) => sum + (c.valor || 0), 0);
    return of(total).pipe(delay(500));
  }
}
