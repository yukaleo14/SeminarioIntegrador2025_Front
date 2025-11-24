import { Categoria } from "./Categoria";
import { Estado } from "./Estado";
import { Sucursal } from "./Sucursal";

export interface Producto {
    id: number;
    nombre: string;
    precio: number;
    imagen:string;
    categoriaId: number;
    categoria: Categoria;
    estado: Estado;
    sucursal: Sucursal;
}