import { DetallePedido } from "./DetallePedido";
import { Estado } from "./Estado";
import { Pago } from "./Pago";
import { Ruta } from "./Ruta";

export interface Pedido{
    numero: number;
    horaLlegadaEstimada: Date;
    montoTotal: number;
    tiempoPreparacionEstimado: number;
    tiempoRepartoEstimado: number;
    fechaHora: Date;
    repartidor: any; // TODO: DEFINIR CLASE REPARTIDOR?
    comprador: any; // TODO: DEFINIR CLASE COMPRADOR?
    ruta: Ruta;
    detalle: DetallePedido[];
    estado: Estado;
    pago: Pago;
}
