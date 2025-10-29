import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { CardEmpresa } from '../card-empresa/card-empresa';
import { Skeleton } from '../skeleton/skeleton';
import { EmpresaService } from '../../services/empresa-service';
import { Sucursal } from '../../models/Sucursal';

@Component({
  selector: 'app-listado-negocios',
  imports: [CardEmpresa, Skeleton],
  templateUrl: './listado-negocios.html',
  styleUrl: './listado-negocios.scss'
})
export class ListadoNegocios implements OnInit{
  // TODO: Obtener negocios/empresas por service
  empresas: WritableSignal<Sucursal[]> = signal([]);

  private readonly _dataService = inject(EmpresaService);
  ngOnInit(): void {
  }
}