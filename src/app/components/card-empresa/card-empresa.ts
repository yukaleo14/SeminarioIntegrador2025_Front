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

  sucursal = input.required<Sucursal>();
  // empresa = input.required<Sucursal>();
  
  // getImagenUrl(): string {
  //   const nombreArchivo: string = this.empresa()?.imagen ? 'sucursal/' + this.empresa()!.id + '/' + this.empresa()!.imagen : 'logo-placeholder.png'
  //   return this._fileService.getImagenUrl(nombreArchivo);
  // }

  getImagenUrl(): string {
    const imagen = this.sucursal()?.imagen
    if (!imagen) {
      return this._fileService.getImagenUrl('logo-placeholder.png');
    }

    return this._fileService.getImagenUrl(`sucursal/${imagen}`);
  }
}
