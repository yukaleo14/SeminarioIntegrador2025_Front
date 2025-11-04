import { Rol } from "./Rol";
import { Sucursal } from "./Sucursal";
import { Ubicacion } from "./Ubicacion";

export interface Usuario {
    nombre: string;
    apellido: string;
    telefono: string;
    dni: string;
    mail: string;
    cuit: string;
    rol: Rol;
    sucursal?: Sucursal;
    ubicacion?: Ubicacion[];
}
