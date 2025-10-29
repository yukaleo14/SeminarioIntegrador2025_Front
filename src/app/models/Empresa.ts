import { Categoria } from "./Categoria";
import { Sucursal } from "./Sucursal";

export interface Empresa {
  id: number
  nombre: string;
  portada: string;
  descripcion: string;
  sucursal: Sucursal;
  categorias?: Categoria[]
}