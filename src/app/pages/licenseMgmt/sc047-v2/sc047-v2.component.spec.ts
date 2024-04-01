import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sc047V2Component } from './sc047-v2.component';

describe('Sc047V2Component', () => {
  let component: Sc047V2Component;
  let fixture: ComponentFixture<Sc047V2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Sc047V2Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Sc047V2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
