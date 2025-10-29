import { Routes } from '@angular/router';
import { Home } from './home/home';
import { ItemCategoria } from './components/item-categoria/item-categoria';
import { CardEmpresa } from './components/card-empresa/card-empresa';
import { Login } from './login/login';
import { Registro } from './registro/registro';
import { EmpresaConsultaComponent } from './empresa-consulta/empresa-consulta';
import { SeguimientoPedido } from './components/seguimiento-pedido/seguimiento-pedido';

export const routes: Routes = [
    {path:'home' ,component: Home},
    {path:'login' ,component: Login},
    {path:'categoria/:id' ,component: ItemCategoria},
    {path:'registro' ,component: Registro},
    {path:'empresa/:id' ,component: EmpresaConsultaComponent},
    {path:'seguimiento' ,component: SeguimientoPedido},

    {path:'**' ,redirectTo:'home'}
];
