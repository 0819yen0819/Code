import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BafaAddDialogComponent } from './bafa-add-dialog.component';

describe('BafaAddDialogComponent', () => {
  let component: BafaAddDialogComponent;
  let fixture: ComponentFixture<BafaAddDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BafaAddDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BafaAddDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
