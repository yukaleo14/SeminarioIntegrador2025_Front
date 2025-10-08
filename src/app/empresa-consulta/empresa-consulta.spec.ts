import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpresaConsulta } from './empresa-consulta';

describe('EmpresaConsulta', () => {
  let component: EmpresaConsulta;
  let fixture: ComponentFixture<EmpresaConsulta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmpresaConsulta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmpresaConsulta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
