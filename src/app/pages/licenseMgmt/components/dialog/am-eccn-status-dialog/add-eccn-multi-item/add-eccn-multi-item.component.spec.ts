import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEccnMultiItemComponent } from './add-eccn-multi-item.component';

describe('AddEccnMultiItemComponent', () => {
  let component: AddEccnMultiItemComponent;
  let fixture: ComponentFixture<AddEccnMultiItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEccnMultiItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEccnMultiItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
