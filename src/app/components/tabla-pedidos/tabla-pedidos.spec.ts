import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaPedidos } from './tabla-pedidos';

describe('TablaPedidos', () => {
  let component: TablaPedidos;
  let fixture: ComponentFixture<TablaPedidos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaPedidos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TablaPedidos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
