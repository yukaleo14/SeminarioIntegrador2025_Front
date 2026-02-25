import { NgOptimizedImage } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Categoria } from '../../models/Categoria';
import { FileService } from '../../services/file-service';

@Component({
  selector: 'app-item-categoria',
  imports: [NgOptimizedImage],
  templateUrl: './item-categoria.html',
  styleUrl: './item-categoria.scss'
})
export class ItemCategoria {
  data = input.required<Categoria>();
  private readonly _fileService = inject(FileService);
  
  getImagenUrl(nombreArchivo: string): string {
    return this._fileService.getImagenUrl(`categoria/${nombreArchivo}`);
  }
}
