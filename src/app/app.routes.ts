import { Routes } from '@angular/router';
import { Home } from './home/home';
import { ItemCategoria } from './components/item-categoria/item-categoria';
import { CardEmpresa } from './components/card-empresa/card-empresa';
import { Login } from './login/login';
import { Registro } from './registro/registro';

export const routes: Routes = [
    {path:'home' ,component: Home},
    {path:'login' ,component: Login},
    {path:'categoria/:id' ,component: ItemCategoria},
    {path:'empresa/:id' ,component: CardEmpresa},
    {path:'registro' ,component: Registro},

    {path:'**' ,redirectTo:'home'}
];
