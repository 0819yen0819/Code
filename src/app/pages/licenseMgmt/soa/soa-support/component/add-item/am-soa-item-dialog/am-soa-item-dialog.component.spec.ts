import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmSoaItemDialogComponent } from './am-soa-item-dialog.component';

describe('AmSoaItemDialogComponent', () => {
  let component: AmSoaItemDialogComponent;
  let fixture: ComponentFixture<AmSoaItemDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AmSoaItemDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AmSoaItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
