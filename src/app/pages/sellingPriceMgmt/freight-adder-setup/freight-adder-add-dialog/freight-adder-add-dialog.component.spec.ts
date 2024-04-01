import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreightAdderAddDialogComponent } from './freight-adder-add-dialog.component';

describe('FreightAdderAddDialogComponent', () => {
  let component: FreightAdderAddDialogComponent;
  let fixture: ComponentFixture<FreightAdderAddDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FreightAdderAddDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FreightAdderAddDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
