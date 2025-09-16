import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoriaItem } from '../../models/CategoriaItem';

@Component({
  selector: 'app-item-categoria',
  imports: [RouterLink],
  templateUrl: './item-categoria.html',
  styleUrl: './item-categoria.scss'
})
export class ItemCategoria {
  data = input.required<CategoriaItem>();// data:CategoriaItem
}
