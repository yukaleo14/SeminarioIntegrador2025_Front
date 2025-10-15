import { Rol } from "./Rol";

export interface Usuario {
    nombre: string;
    apellido: string;
    telefono: string;
    dni: string;
    mail: string;
    cuit: string;
    rol: Rol;
}
