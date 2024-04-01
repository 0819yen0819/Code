import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddImpMultiItemComponent } from './add-imp-multi-item.component';

describe('AddImpMultiItemComponent', () => {
  let component: AddImpMultiItemComponent;
  let fixture: ComponentFixture<AddImpMultiItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddImpMultiItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddImpMultiItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
