import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepartidorEstadisticas } from './repartidor-estadisticas';

describe('RepartidorEstadisticas', () => {
  let component: RepartidorEstadisticas;
  let fixture: ComponentFixture<RepartidorEstadisticas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepartidorEstadisticas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RepartidorEstadisticas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
