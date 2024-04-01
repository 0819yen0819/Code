import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmSc047V2ItemDialogComponent } from './am-sc047-v2-item-dialog.component';

describe('AmSc047V2ItemDialogComponent', () => {
  let component: AmSc047V2ItemDialogComponent;
  let fixture: ComponentFixture<AmSc047V2ItemDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AmSc047V2ItemDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AmSc047V2ItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
