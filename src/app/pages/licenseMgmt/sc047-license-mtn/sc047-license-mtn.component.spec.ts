import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sc047LicenseMtnComponent } from './sc047-license-mtn.component';

describe('Sc047LicenseMtnComponent', () => {
  let component: Sc047LicenseMtnComponent;
  let fixture: ComponentFixture<Sc047LicenseMtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Sc047LicenseMtnComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Sc047LicenseMtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
