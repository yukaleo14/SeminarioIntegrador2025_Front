import { Categoria } from "./Categoria";
import { Estado } from "./Estado";
import { Usuario } from "./Usuario";

export interface Producto {
    id: number;
    nombre: string;
    precio: number;
    imagen:string;
    categoria: Categoria;
    estado: Estado;
    empresa: Usuario;
}