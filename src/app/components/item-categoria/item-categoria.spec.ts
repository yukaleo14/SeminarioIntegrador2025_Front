import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemCategoria } from './item-categoria';

describe('ItemCategoria', () => {
  let component: ItemCategoria;
  let fixture: ComponentFixture<ItemCategoria>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemCategoria]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemCategoria);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
