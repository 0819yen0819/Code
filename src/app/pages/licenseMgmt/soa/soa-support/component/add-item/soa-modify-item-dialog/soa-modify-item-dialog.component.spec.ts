import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoaModifyItemDialogComponent } from './soa-modify-item-dialog.component';

describe('SoaModifyItemDialogComponent', () => {
  let component: SoaModifyItemDialogComponent;
  let fixture: ComponentFixture<SoaModifyItemDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoaModifyItemDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoaModifyItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
