import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileService {
    getImagenUrl(nombreArchivo: string): string {
        return `${environment.apiUrl}/file/${nombreArchivo}`;
    }
}