import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Saludo } from './components/saludo/saludo';
import { Header } from './components/header/header';
import { Buscador } from './components/buscador/buscador';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Saludo, Header,Buscador],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {

  ngOnInit(){}

}
