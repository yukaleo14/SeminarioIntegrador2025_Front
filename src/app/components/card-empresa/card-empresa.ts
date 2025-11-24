import { NgOptimizedImage } from "@angular/common";
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sucursal } from '../../models/Sucursal';
import { FileService } from '../../services/file-service';
@Component({
  selector: 'app-card-empresa',
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './card-empresa.html',
  styleUrl: './card-empresa.scss'
})
export class CardEmpresa {
  private readonly _fileService = inject(FileService);
  empresa = input.required<Sucursal>();
  getImagenUrl(nombreArchivo: string): string {
    return this._fileService.getImagenUrl(nombreArchivo);
  }
}
