import { Categoria } from "./Categoria";
import { Horario } from "./Horario";
import { Ubicacion } from "./Ubicacion";

export interface Sucursal extends Ubicacion {
    id: number;
    imagen?: string;
    nombre: string;
    descripcion: string;
    horario: Horario[];
    categorias?: Categoria[];
}

export interface CreateSucursalDto {
  nombre: string;
  imagen: string;
  descripcion: string;
  estadoId: number; // ?
  empresaId: number;
  // CreateUbicacionDTO?
  ubicacionId: number;
  altura?: string;
  calle?: string;
  nombreUbicacion?: string;
  coordenadaX?: number;
  coordenadaY?: number;
}
