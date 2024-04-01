import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingFailedComponent } from './pending-failed.component';

describe('PendingFailedComponent', () => {
  let component: PendingFailedComponent;
  let fixture: ComponentFixture<PendingFailedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PendingFailedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingFailedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
