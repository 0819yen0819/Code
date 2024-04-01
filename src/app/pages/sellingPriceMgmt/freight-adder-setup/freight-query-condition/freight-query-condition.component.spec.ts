import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreightQueryConditionComponent } from './freight-query-condition.component';

describe('FreightQueryConditionComponent', () => {
  let component: FreightQueryConditionComponent;
  let fixture: ComponentFixture<FreightQueryConditionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FreightQueryConditionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FreightQueryConditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
