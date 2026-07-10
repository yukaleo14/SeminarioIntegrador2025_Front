import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetallePedidoDialog } from './detalle-pedido-dialog';

describe('DetallePedidoDialog', () => {
  let component: DetallePedidoDialog;
  let fixture: ComponentFixture<DetallePedidoDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetallePedidoDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetallePedidoDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
