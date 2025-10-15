import { Estado } from "./Estado";
import { FormaPago } from "./FormaPago";

export interface Pago{
    numero: string;
    monto: number;
    fechaHora: Date;
    formaPago: FormaPago;
    estado: Estado; 
}