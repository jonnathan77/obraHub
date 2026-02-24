import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ListaObrasComponent } from './lista-obras/lista-obras.component';
import { DetalheObraComponent } from './detalhe-obra/detalhe-obra.component';

const routes: Routes = [
  { path: '', component: ListaObrasComponent },
  { path: ':id', component: DetalheObraComponent }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class ObrasModule { }
