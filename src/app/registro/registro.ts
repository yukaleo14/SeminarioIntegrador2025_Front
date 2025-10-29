import { Component,forwardRef,inject, OnInit, signal} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService, RegisterDto, Rol } from '../services/auth-service';

@Component({
  selector: 'app-registro',
  imports: [MatCardModule,MatCheckboxModule, MatInputModule, ReactiveFormsModule, MatFormFieldModule, MatIconModule, MatButtonModule],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => 'mail'),
    multi: true,
  }]
  
})
export class Registro implements OnInit{


  hide = signal<boolean>(true);
  hide2 = signal<boolean>(true);
  
  private formBuilder = inject(FormBuilder);
  private _router = inject(Router);
  private _fb = inject(FormBuilder);
  private _authService = inject(AuthService);
  formularioRegistro: FormGroup = new FormGroup({});
  registerButtonControl = new FormControl(''); 
  constructor(){
        this.formularioRegistro = this._fb.group({
    nombre: ['',Validators.required],
    apellido: ['',Validators.required],
    dni: ['',Validators.required],
    cuitCuil: ['',Validators.required],
    telefono: ['',Validators.required],
    mail: ['',[Validators.required, Validators.email]],
    contraseña: ['',Validators.required],
    confContraseña: ['',Validators.required],
    termCondiciones: [false,Validators.requiredTrue]
    
  });
  }

  ngOnInit(): void {

    


}

  onSubmit(){
    if (!this.formularioRegistro.valid) return
    const rq = this.getObject();
    this._authService.register(rq);
  }
  getObject(): RegisterDto{
    return {
      nombre: this.formularioRegistro.controls['nombre'].value,
      apellido: this.formularioRegistro.controls['apellido'].value,
      contraseña: this.formularioRegistro.controls['contraseña'].value,
      cuit: this.formularioRegistro.controls['cuitCuil'].value,
      dni: this.formularioRegistro.controls['dni'].value,
      mail: this.formularioRegistro.controls['mail'].value,
      telefono: this.formularioRegistro.controls['telefono'].value,
      rol: Rol.CLIENTE
  }
}

  accept_terms_conditions: boolean = true;
 // la logica y variables de datos que se usan en el template

  toggleHide(){
    this.hide.update(valorActual => !valorActual);
  };
  toggleHide2(){
    this.hide2.update(valorActual => !valorActual);
  };


  
  }

