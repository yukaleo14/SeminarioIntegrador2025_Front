import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductosPorCategoria } from './productos-por-categoria';

describe('ProductosPorCategoria', () => {
  let component: ProductosPorCategoria;
  let fixture: ComponentFixture<ProductosPorCategoria>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductosPorCategoria]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductosPorCategoria);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
