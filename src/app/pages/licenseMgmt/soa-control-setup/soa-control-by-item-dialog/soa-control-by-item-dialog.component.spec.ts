import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoaControlByItemDialogComponent } from './soa-control-by-item-dialog.component';

describe('SoaControlByItemDialogComponent', () => {
  let component: SoaControlByItemDialogComponent;
  let fixture: ComponentFixture<SoaControlByItemDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoaControlByItemDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoaControlByItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
