import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Empresa } from '../../models/Empresa';
@Component({
  selector: 'app-card-empresa',
  imports: [RouterLink],
  templateUrl: './card-empresa.html',
  styleUrl: './card-empresa.scss'
})
export class CardEmpresa {
  empresa = input.required<Empresa>();
}
