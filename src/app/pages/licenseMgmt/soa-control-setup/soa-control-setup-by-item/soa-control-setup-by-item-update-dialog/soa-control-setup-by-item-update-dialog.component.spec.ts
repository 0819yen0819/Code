import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoaControlSetupByItemUpdateDialogComponent } from './soa-control-setup-by-item-update-dialog.component';

describe('SoaControlSetupByItemUpdateDialogComponent', () => {
  let component: SoaControlSetupByItemUpdateDialogComponent;
  let fixture: ComponentFixture<SoaControlSetupByItemUpdateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoaControlSetupByItemUpdateDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoaControlSetupByItemUpdateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
