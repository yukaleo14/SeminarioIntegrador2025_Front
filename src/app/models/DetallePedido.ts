import { Producto } from "./Producto";

export interface DetallePedido {
    cantidad: number;
    precioUnidad: number;
    producto: Producto;
}