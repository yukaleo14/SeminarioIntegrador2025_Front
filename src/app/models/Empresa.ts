import { Sucursal } from "./Sucursal";

export interface Empresa {
  id?: number;
  nombre: string;
  cuitCuil: string;
  imagenPerfil: string;
  usuarioId: number;
  sucursalId?: number;
  sucursal?: Sucursal
  // sucursal??
}
