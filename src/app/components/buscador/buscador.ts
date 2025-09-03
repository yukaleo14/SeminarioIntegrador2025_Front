import { F } from '@angular/cdk/keycodes';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-buscador',
  imports: [MatFormFieldModule, MatInputModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './buscador.html',
  styleUrl: './buscador.scss'
})
export class Buscador {
  grupo: FormGroup = new FormGroup({
    formBuscador: new FormControl('')
  })
  onSubmit(){
    console.log('llamando al service...', this.grupo.controls['formBuscador'].value);
  }
}
