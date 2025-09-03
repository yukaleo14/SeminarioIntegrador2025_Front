import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoNegocios } from './listado-negocios';

describe('ListadoNegocios', () => {
  let component: ListadoNegocios;
  let fixture: ComponentFixture<ListadoNegocios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoNegocios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoNegocios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
