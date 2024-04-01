import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RuleSetupComponent } from './rule-setup.component';

describe('ImpExpLicenseMtnComponent', () => {
  let component: RuleSetupComponent;
  let fixture: ComponentFixture<RuleSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RuleSetupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RuleSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
