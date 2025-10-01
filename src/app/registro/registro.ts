import { Component,model, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-registro',
  imports: [MatCardModule,MatCheckboxModule, MatInputModule, ReactiveFormsModule, MatFormFieldModule, MatIconModule, MatButtonModule],
  templateUrl: './registro.html',
  styleUrl: './registro.scss'
})
export class Registro {
  hide = signal<boolean>(true);
  accept_terms_conditions: boolean = true;
 // la logica y variables de datos que se usan en el template
  onRegistrarse(){
    //Navegar al componente de registro
  }

  toggleHide(){
    this.hide.update(valorActual => !valorActual);
  }
}
