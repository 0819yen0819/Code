import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmImpSingleItemComponent } from './am-imp-single-item.component';

describe('AmImpSingleItemComponent', () => {
  let component: AmImpSingleItemComponent;
  let fixture: ComponentFixture<AmImpSingleItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AmImpSingleItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AmImpSingleItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
