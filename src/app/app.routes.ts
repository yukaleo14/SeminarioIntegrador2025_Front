import { Routes } from '@angular/router';
import { Home } from './home/home';
import { ItemCategoria } from './components/item-categoria/item-categoria';
import { CardEmpresa } from './components/card-empresa/card-empresa';

export const routes: Routes = [
    {path:'home' ,component: Home},
    {path:'categoria/:id' ,component: ItemCategoria},
    {path:'empresa/:id' ,component: CardEmpresa},

    {path:'**' ,redirectTo:'home'}
];
