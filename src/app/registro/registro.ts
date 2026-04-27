import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { AuthService, RegisterDto } from '../services/auth-service';

@Component({
  selector: 'app-registro',
  imports: [MatCardModule, MatCheckboxModule, MatInputModule, ReactiveFormsModule, MatFormFieldModule, MatIconModule, MatButtonModule, MatSelectModule, MatError],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Registro {
  hide = signal<boolean>(true);
  hide2 = signal<boolean>(true);
  private _fb = inject(FormBuilder);
  private _authService = inject(AuthService);
  formularioRegistro: FormGroup = new FormGroup({});
  constructor() {
    this.formularioRegistro = this._fb.group({
        nombre: ['', Validators.required],
        apellido: ['', Validators.required],
        dni: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(8)]],
        cuitCuil: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
        telefono: ['', Validators.required],
        mail: ['', [Validators.required, Validators.email]],
        tipoUsuario: ['', Validators.required],
        contrasena: ['', Validators.required],
        confContraseña: ['', Validators.required],
        termCondiciones: [false, Validators.requiredTrue]
      }, { validators: confirmPasswordValidator }
    );

  }

  private readonly router = inject(Router);
  onSubmit() {
    if (!this.formularioRegistro.valid) return

    const rq = this.getObject();

    this._authService.register(rq).subscribe({
      next: (token: string) => {

        console.log('Usuario registrado correctamente, token:', token);
        
        this.router.navigate(['/dashboard']); 

      },
      error: (err) => {
        console.error('Error al registrar:', err);
        let mensajeError = 'Error al registrar, por favor intente nuevamente.';

        if (err.error?.message) {
        mensajeError = err.error.message;
      } else if (err.status === 409) {
        mensajeError = 'Ya existe un usuario con ese correo electrónico.';
      } else if (err.status === 400) {
        mensajeError = 'Datos inválidos. Verifique la información ingresada.';
      }

      alert(mensajeError);
      }
    });
  }

  getObject(): RegisterDto {
    return {
      nombre: this.formularioRegistro.controls['nombre'].value,
      apellido: this.formularioRegistro.controls['apellido'].value,
      contrasena: this.formularioRegistro.controls['contrasena'].value,
      cuitCuil: this.formularioRegistro.controls['cuitCuil'].value,
      dni: this.formularioRegistro.controls['dni'].value,
      mail: this.formularioRegistro.controls['mail'].value,
      telefono: this.formularioRegistro.controls['telefono'].value,
      rol: this.formularioRegistro.controls['tipoUsuario'].value,
      imagenPerfil: '',
      altura: '',
      calle: '',
      coordenadaX: 0,
      coordenadaY: 0,
      nombreUbicacion: ''
    };
  }

  toggleHide() {
    this.hide.update(valorActual => !valorActual);
  };
  toggleHide2() {
    this.hide2.update(valorActual => !valorActual);
  };

}

export const confirmPasswordValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const passwordControl = group.get('contrasena');
  const confirmControl = group.get('confContraseña');

  if (!passwordControl || !confirmControl) return null;
  const password = passwordControl.value;
  const confirm = confirmControl.value;
  // Si aún no se completaron ambos campos, limpiamos error previo
  if (!password || !confirm) {
    confirmControl.setErrors(null);
    return null;
  }
  if (password !== confirm) {
    confirmControl.setErrors({ passwordNoMatch: true });
    return { passwordNoMatch: true };
  }
  // Si coinciden, aseguramos limpiar errores anteriores
  if (confirmControl.hasError('passwordNoMatch')) {
    confirmControl.setErrors(null);
  }
  return null;
};
