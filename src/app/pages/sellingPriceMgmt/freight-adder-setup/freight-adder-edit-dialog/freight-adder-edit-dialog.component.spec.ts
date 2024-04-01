import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreightAdderEditDialogComponent } from './freight-adder-edit-dialog.component';

describe('FreightAdderEditDialogComponent', () => {
  let component: FreightAdderEditDialogComponent;
  let fixture: ComponentFixture<FreightAdderEditDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FreightAdderEditDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FreightAdderEditDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
