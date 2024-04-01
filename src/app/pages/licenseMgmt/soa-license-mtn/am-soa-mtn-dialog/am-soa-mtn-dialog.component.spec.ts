import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmSoaMtnDialogComponent } from './am-soa-mtn-dialog.component';

describe('AmSoaMtnDialogComponent', () => {
  let component: AmSoaMtnDialogComponent;
  let fixture: ComponentFixture<AmSoaMtnDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AmSoaMtnDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AmSoaMtnDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
