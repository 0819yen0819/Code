import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EccnMtnComponent } from './eccn-mtn.component';

describe('EccnMtnComponent', () => {
  let component: EccnMtnComponent;
  let fixture: ComponentFixture<EccnMtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EccnMtnComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EccnMtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
