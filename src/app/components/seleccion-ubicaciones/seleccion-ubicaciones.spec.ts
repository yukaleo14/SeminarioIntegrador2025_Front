import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeleccionUbicaciones } from './seleccion-ubicaciones';

describe('SeleccionUbicaciones', () => {
  let component: SeleccionUbicaciones;
  let fixture: ComponentFixture<SeleccionUbicaciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeleccionUbicaciones]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeleccionUbicaciones);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
