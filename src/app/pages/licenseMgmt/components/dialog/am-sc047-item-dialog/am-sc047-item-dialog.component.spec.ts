import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmSc047ItemDialogComponent } from './am-sc047-item-dialog.component';

describe('AmSc047ItemDialogComponent', () => {
  let component: AmSc047ItemDialogComponent;
  let fixture: ComponentFixture<AmSc047ItemDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AmSc047ItemDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AmSc047ItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
