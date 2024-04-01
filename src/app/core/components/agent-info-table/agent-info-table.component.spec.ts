import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentInfoTableComponent } from './agent-info-table.component';

describe('AgentInfoTableComponent', () => {
  let component: AgentInfoTableComponent;
  let fixture: ComponentFixture<AgentInfoTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AgentInfoTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AgentInfoTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
