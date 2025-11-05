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
    rol: Rol; // CLIENTE, BUSINESS, DELIVERY
    sucursal?: Sucursal; // Tiene si rol = 'BUSINESS'
    ubicacion?: Ubicacion[];// Tiene si rol ='CLIENTE'
}
