import { Horario } from "./Horario";
import { Ubicacion } from "./Ubicacion";

export interface Sucursal extends Ubicacion {
    imagenSucursal: string;
    descripcion: string;
    horario: Horario[];
}