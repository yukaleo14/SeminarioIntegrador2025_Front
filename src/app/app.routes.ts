import { Routes } from '@angular/router';
import { Home } from './home/home';
import { ItemCategoria } from './components/item-categoria/item-categoria';
import { CardEmpresa } from './components/card-empresa/card-empresa';
import { Login } from './login/login';
import { Registro } from './registro/registro';
import { SucursalConsultaComponent } from './sucursal-consulta/sucursal-consulta';
import { SeguimientoPedido } from './components/seguimiento-pedido/seguimiento-pedido';
import { SeleccionUbicaciones } from './components/seleccion-ubicaciones/seleccion-ubicaciones';
import { TablaPedidos } from './components/tabla-pedidos/tabla-pedidos';

export const routes: Routes = [
    {path:'home' ,component: Home},
    {path:'login' ,component: Login},
    {path:'categoria/:id' ,component: ItemCategoria},
    {path:'registro' ,component: Registro},
    {path:'sucursal/:idEmpresa' ,component: SucursalConsultaComponent},
    {path:'seguimiento' ,component: SeguimientoPedido},
    {path:'seleccion-ubicacion' , component: SeleccionUbicaciones},
    {path: 'tabla-pedidos', component: TablaPedidos},

    {path:'**' ,redirectTo:'home'}
];
