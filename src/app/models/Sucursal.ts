import { Categoria } from "./Categoria";
import { Horario } from "./Horario";
import { Ubicacion } from "./Ubicacion";

export interface Sucursal extends Ubicacion {
    id: number;
    empresaId: number;
    imagen?: string;
    nombre: string;
    descripcion: string;
    horario?: Horario[];
    ubicacion?: Ubicacion;
    ubicacionId: number;
    estadoId: number;
    productos?: any[]; // Mejorar con el tipo Producto

    categorias?: Categoria[]; //esto se tiene que sacar, se obtiene a través de los productos
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
