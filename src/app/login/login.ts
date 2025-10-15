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
  formularioLogin: FormGroup = new FormGroup({});

  ngOnInit(): void {
    this.formularioLogin = this._fb.group({
      mail: ['', [Validators.required, Validators.email]],
      contraseña: ['', [Validators.required]],
    });

  }

  onSubmit() {
    const rq: LoginDto = this.formularioLogin.getRawValue() as LoginDto;
    this.formularioLogin.disable();
    this._authService.login(rq).subscribe({
      next: (data) => {
        this._router.navigate(['/']);

      },error: (err) =>{
        //TODO: Manejo de errores
        this.formularioLogin.enable();
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

