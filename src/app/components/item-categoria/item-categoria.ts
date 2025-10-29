import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Categoria } from '../../models/Categoria';

@Component({
  selector: 'app-item-categoria',
  imports: [RouterLink],
  templateUrl: './item-categoria.html',
  styleUrl: './item-categoria.scss'
})
export class ItemCategoria {
  data = input.required<Categoria>();// data:CategoriaItem
}
