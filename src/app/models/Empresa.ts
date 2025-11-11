import { Sucursal } from "./Sucursal";

export interface Empresa {
  nombre: string;
  cuitCuil: string;
  imagenPerfil: string;
  usuarioId: number;
  sucursalId?: number;
  sucursal?: Sucursal
  // sucursal??
}
