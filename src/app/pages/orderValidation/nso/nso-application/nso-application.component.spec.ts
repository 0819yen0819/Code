import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NsoApplicationComponent } from './nso-application.component';

describe('NsoApplicationComponent', () => {
  let component: NsoApplicationComponent;
  let fixture: ComponentFixture<NsoApplicationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NsoApplicationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NsoApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
