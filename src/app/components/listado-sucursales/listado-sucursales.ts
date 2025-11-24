import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { Sucursal } from '../../models/Sucursal';
import { SucursalService } from '../../services/sucursal-service';
import { CardEmpresa } from '../card-empresa/card-empresa';
import { Skeleton } from '../skeleton/skeleton';

@Component({
  selector: 'app-listado-sucursales',
  imports: [CardEmpresa, Skeleton],
  templateUrl: './listado-sucursales.html',
  styleUrl: './listado-sucursales.scss'
})
export class ListadoSucursales implements OnInit{
  empresas: WritableSignal<Sucursal[]> = signal([]);

  private readonly _dataService = inject(SucursalService);
  ngOnInit(): void {
    this.cargarEmpresas();
  }
  cargarEmpresas() {
    this._dataService.findAll().subscribe({
      next: (sucursales: Sucursal[]) => {
        this.empresas.set(sucursales);
      },
      error: (err: HttpErrorResponse) => {
        alert('Error al obtener las sucursales: '+ err.message);
      }
    });
  }
}