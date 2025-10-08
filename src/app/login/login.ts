import { Component, inject, model, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';





@Component({
  selector: 'app-login',
  imports: [MatCardModule,MatCheckboxModule, MatInputModule, ReactiveFormsModule, MatFormFieldModule, MatIconModule, MatButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private _router = inject(Router);
  hide = signal<boolean>(true);
  remember_me: boolean = true;
 // la logica y variables de datos que se usan en el template
  onRegistrarse(){
    //Navegar al componente de registro
    this._router.navigate(['/registro']);
  }

  toggleHide(){
    this.hide.update(valorActual => !valorActual);
  }

}

