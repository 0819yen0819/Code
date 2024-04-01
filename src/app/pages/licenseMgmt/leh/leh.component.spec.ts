import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LehComponent } from './leh.component';

describe('LehComponent', () => {
  let component: LehComponent;
  let fixture: ComponentFixture<LehComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LehComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LehComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
