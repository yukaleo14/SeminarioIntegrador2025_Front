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
import { ProductosPorCategoria } from './productos-por-categoria/productos-por-categoria';
import { ProductoTableComponent } from './components/producto-table/producto-table';
import {Chat} from './components/chat/chat';
import { RepartidorComponent } from './repartidor/repartidor';
import { EmpresaEstadisticas } from './empresa-estadisticas/empresa-estadisticas';
import { RepartidorEstadisticas } from './repartidor-estadisticas/repartidor-estadisticas' ;

export const routes: Routes = [
    {path:'home' ,component: Home},
    {path:'login' ,component: Login},
    {path:'categoria/:id' ,component: ItemCategoria},
    {path:'registro' ,component: Registro},
    {path:'sucursal/:idEmpresa' ,component: SucursalConsultaComponent},
    {path:'seguimiento/:pedidoId' ,component: SeguimientoPedido},
    {path:'seguimiento' ,component: SeguimientoPedido},
    {path:'seleccion-ubicacion' , component: SeleccionUbicaciones},
    {path: 'tabla-pedidos', component: TablaPedidos},
    {path: 'categoria/:idCategoria/productos', component: ProductosPorCategoria},
    {path: 'estadisticasRepartidor', component: RepartidorEstadisticas},

    {path:'producto',component: ProductoTableComponent},
    {path:'chat',component: Chat},
    {path:'repartidor', component: RepartidorComponent},
    {path:'estadisticas', component: EmpresaEstadisticas},

    {path:'**' ,redirectTo:'home'}
];
