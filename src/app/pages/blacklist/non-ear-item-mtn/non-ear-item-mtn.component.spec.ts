import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NonEarItemMtnComponent } from './non-ear-item-mtn.component';

describe('NonEarItemMtnComponent', () => {
  let component: NonEarItemMtnComponent;
  let fixture: ComponentFixture<NonEarItemMtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NonEarItemMtnComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NonEarItemMtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
