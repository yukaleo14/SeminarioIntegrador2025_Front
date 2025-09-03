import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarruselCategorias } from './carrusel-categorias';

describe('CarruselCategorias', () => {
  let component: CarruselCategorias;
  let fixture: ComponentFixture<CarruselCategorias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarruselCategorias]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarruselCategorias);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
