import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocWithdrawComponent } from './soc-withdraw.component';

describe('SocWithdrawComponent', () => {
  let component: SocWithdrawComponent;
  let fixture: ComponentFixture<SocWithdrawComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SocWithdrawComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SocWithdrawComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
