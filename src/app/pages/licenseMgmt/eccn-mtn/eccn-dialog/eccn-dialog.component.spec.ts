import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EccnDialogComponent } from './eccn-dialog.component';

describe('EccnDialogComponent', () => {
  let component: EccnDialogComponent;
  let fixture: ComponentFixture<EccnDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EccnDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EccnDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
