import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddExpMultiItemComponent } from './add-exp-multi-item.component';

describe('AddExpMultiItemComponent', () => {
  let component: AddExpMultiItemComponent;
  let fixture: ComponentFixture<AddExpMultiItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddExpMultiItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddExpMultiItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
