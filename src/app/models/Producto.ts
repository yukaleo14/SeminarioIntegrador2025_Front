import { Categoria } from "./Categoria";
import { Estado } from "./Estado";
import { Sucursal } from "./Sucursal";

export interface Producto {
  id?: number; // Opcional en create (generado por back), requerido en read/update
  nombre: string;
  descripcion?: string; // Opcional, como en DTO
  precio: number;
  imagen?: string; // Opcional
  tiempoPreparacionEstimado: number;
  categoriaId: number;
  estadoId: number;
  sucursalId: number;
  
  // Objetos relacionados: Opcionales, solo para recepción (e.g., GET con include en back)
  categoria?: Categoria;
  estado?: Estado;
  sucursal?: Sucursal;
}