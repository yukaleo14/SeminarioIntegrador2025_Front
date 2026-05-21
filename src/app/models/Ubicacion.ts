export interface Posicion {
    coordenadaX: number;
    coordenadaY: number;
}

export interface Ubicacion{
    id: number;
    coordenadaX: number;
    coordenadaY: number;
    nombreUbicacion: string;
    calle: string;
    altura: number;
    posicion?: Posicion;
}