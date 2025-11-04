import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sucursal } from '../../models/Sucursal';
@Component({
  selector: 'app-card-empresa',
  imports: [RouterLink],
  templateUrl: './card-empresa.html',
  styleUrl: './card-empresa.scss'
})
export class CardEmpresa {
  empresa = input.required<Sucursal>();
}
