import { Component, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { EmpresaService } from '../services/empresa-service';
import { catchError, of, tap } from 'rxjs';
import { Skeleton } from '../components/skeleton/skeleton';


@Component({
  selector: 'app-empresa-consulta',
  imports: [MatButtonModule, MatIcon, Skeleton],
  templateUrl: './empresa-consulta.html',
  styleUrl: './empresa-consulta.scss'
})
export class EmpresaConsulta {
 private _dataService = inject(EmpresaService);
  id = input.required<number>();

  error = signal<string | null>(null);

  empresa = toSignal(
    this._dataService.getById(this.id()).pipe(
      tap(() => this.error.set(null)),
      catchError(err => {
        this.error.set('No se pudo cargar la empresa');
        return of(null);
      })
    ),
    { initialValue: null }
  );
}