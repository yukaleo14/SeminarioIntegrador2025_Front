import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
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
export class Registro implements OnInit {
  hide = signal<boolean>(true);
  hide2 = signal<boolean>(true);

  tipoSeleccionado = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  private _fb = inject(FormBuilder);
  private _authService = inject(AuthService);
  private readonly router = inject(Router);

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

  ngOnInit(): void {
    // Escuchamos los cambios en el tipo de usuario para ajustar el formulario
    this.formularioRegistro.get('tipoUsuario')?.valueChanges.subscribe(tipo => {
      this.tipoSeleccionado.set(tipo);
      this.actualizarValidaciones(tipo);
    });

    // Limpiamos el error si el usuario modifica el formulario
    this.formularioRegistro.valueChanges.subscribe(() => {
      if (this.errorMessage()) {
        this.errorMessage.set(null);
      }
    });
  }

  private actualizarValidaciones(tipo: string) {
    const controls = this.formularioRegistro.controls;

    if (tipo === 'EMPRESA') {
      controls['apellido'].clearValidators();
      controls['dni'].clearValidators();
      controls['telefono'].clearValidators();
      
      controls['cuitCuil'].setValidators([Validators.required, Validators.minLength(11), Validators.maxLength(11)]);
    } else {
      // COMPRADOR o REPARTIDOR
      controls['apellido'].setValidators([Validators.required]);
      controls['dni'].setValidators([Validators.required, Validators.minLength(8), Validators.maxLength(8)]);
      controls['telefono'].setValidators([Validators.required]);
      
      controls['cuitCuil'].clearValidators();
    }

    // Actualizamos el estado de validez de los campos modificados
    ['apellido', 'dni', 'telefono', 'cuitCuil'].forEach(field => {
      controls[field].updateValueAndValidity();
    });
  }

  onSubmit() {
    if (!this.formularioRegistro.valid) return;

    this.errorMessage.set(null);
    const rq = this.getObject();
    this.formularioRegistro.disable();

    this._authService.register(rq).subscribe({
      next: (token: string) => {
        console.log('Usuario registrado correctamente');
        this.router.navigate(['/']); 
      },
      error: (err) => {
        this.formularioRegistro.enable();
        
        if (err.status === 400 && err.error?.message) {
          if (Array.isArray(err.error.message)) {
            this.errorMessage.set('Datos inválidos: ' + err.error.message.join(' | '));
          } else {
            this.errorMessage.set(err.error.message);
          }
        } else if (err.status === 409) {
          this.errorMessage.set('Ya existe un usuario con ese correo electrónico o DNI/CUIT.');
        } else {
          this.errorMessage.set('Error al registrar, por favor intente nuevamente.');
        }
      }
    });
  }

  getObject(): RegisterDto {const isEmpresa = this.tipoSeleccionado() === 'EMPRESA';
    return {
      rol: this.formularioRegistro.controls['tipoUsuario'].value,
      nombre: this.formularioRegistro.controls['nombre'].value,
      mail: this.formularioRegistro.controls['mail'].value,
      contrasena: this.formularioRegistro.controls['contrasena'].value,
      
      // Enviamos strings vacíos si el campo no aplica al rol seleccionado
      apellido: isEmpresa ? '' : this.formularioRegistro.controls['apellido'].value,
      dni: isEmpresa ? '' : this.formularioRegistro.controls['dni'].value,
      telefono: isEmpresa ? '' : this.formularioRegistro.controls['telefono'].value,
      cuitCuil: isEmpresa ? this.formularioRegistro.controls['cuitCuil'].value : '',
      
      // Campos por defecto de tu DTO original
      imagenPerfil: '',
      altura: '',
      calle: '',
      coordenadaX: 0,
      coordenadaY: 0,
      nombreUbicacion: ''
    };
  }

  toggleHide() { this.hide.update(v => !v); }
  toggleHide2() { this.hide2.update(v => !v); }
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
