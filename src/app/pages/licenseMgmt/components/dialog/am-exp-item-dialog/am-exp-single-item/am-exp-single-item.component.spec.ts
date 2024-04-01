import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmExpSingleItemComponent } from './am-exp-single-item.component';

describe('AmExpSingleItemComponent', () => {
  let component: AmExpSingleItemComponent;
  let fixture: ComponentFixture<AmExpSingleItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AmExpSingleItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AmExpSingleItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
