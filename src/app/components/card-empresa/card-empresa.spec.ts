import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardEmpresa } from './card-empresa';

describe('CardEmpresa', () => {
  let component: CardEmpresa;
  let fixture: ComponentFixture<CardEmpresa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardEmpresa]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardEmpresa);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
