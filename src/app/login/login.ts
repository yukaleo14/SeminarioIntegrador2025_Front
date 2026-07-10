import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService, LoginDto } from '../services/auth-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatCardModule, MatCheckboxModule, MatInputModule, ReactiveFormsModule, MatFormFieldModule, MatIconModule, MatButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements OnInit {
  private _router = inject(Router);
  private _fb = inject(FormBuilder);
  private _authService = inject(AuthService)

  hide = signal<boolean>(true);
  remember_me = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  formularioLogin: FormGroup = new FormGroup({});
  

  ngOnInit(): void {
    this.formularioLogin = this._fb.group({
      mail: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
    });
    this.formularioLogin.valueChanges.subscribe(() => {
      if (this.errorMessage()) {
        this.errorMessage.set(null);
      }
    });
  }

  onSubmit() {
    if (!this.formularioLogin.valid){
      return
    }
    this.errorMessage.set(null);
    const rq: LoginDto = this.formularioLogin.getRawValue() as LoginDto;
    this.formularioLogin.disable();
    
    this._authService.login(rq).subscribe({
      next: (data) => {
        console.log('cayo en el next', data);
        this._router.navigate(['/']);
      },
      error: (err) => {this.formularioLogin.enable(); // Volvemos a habilitar el form

        // 1. Manejar error 400 (Errores de validación del DTO)
        if (err.status === 400 && err.error?.message) {
          // Si el backend devuelve un array de mensajes
          if (Array.isArray(err.error.message)) {
            // Unimos los errores con un salto de línea o coma
            this.errorMessage.set('Datos inválidos: ' + err.error.message.join(' | '));
          } else {
            this.errorMessage.set(err.error.message);
          }
        } 
        // 2. Manejar error 401/403/404 (Credenciales incorrectas o usuario no encontrado)
        else if (err.status === 401 || err.status === 403 || err.status === 404) {
          this.errorMessage.set('Usuario o contraseña incorrectos. Por favor, intente nuevamente.');
        } 
        // 3. Cualquier otro error (Ej: Servidor caído)
        else {
          this.errorMessage.set('Error de conexión con el servidor.');
        }
      },
    })
  }

  // la logica y variables de datos que se usan en el template
  onRegistrarse() {
    //Navegar al componente de registro
    this._router.navigate(['/registro']);
  }

  toggleHide() {
    this.hide.update(valorActual => !valorActual);
  }

}

