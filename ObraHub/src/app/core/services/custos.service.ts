import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Custo } from '../models';

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

  constructor() { }

  getAll(): Observable<Custo[]> {
    return of(this.custos).pipe(delay(500));
  }

  getByObraId(obraId: string): Observable<Custo[]> {
    return of(this.custos.filter(c => c.obraId === obraId)).pipe(delay(500));
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
      .reduce((sum, c) => sum + c.valor, 0);
    return of(total).pipe(delay(500));
  }
}
