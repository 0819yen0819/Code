import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EccnStatusMtnComponent } from './eccn-status-mtn.component';

describe('EccnStatusMtnComponent', () => {
  let component: EccnStatusMtnComponent;
  let fixture: ComponentFixture<EccnStatusMtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EccnStatusMtnComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EccnStatusMtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
