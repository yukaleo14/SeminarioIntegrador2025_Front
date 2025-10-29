import { Categoria } from "./Categoria";
import { Horario } from "./Horario";
import { Ubicacion } from "./Ubicacion";

export interface Sucursal extends Ubicacion {
    id: number;
    imagenSucursal: string;
    nombre: string;
    descripcion: string;
    horario: Horario[];
    categorias?: Categoria[];
}