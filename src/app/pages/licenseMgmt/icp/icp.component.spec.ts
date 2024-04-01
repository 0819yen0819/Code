import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IcpComponent } from './icp.component';

describe('IcpComponent', () => {
  let component: IcpComponent;
  let fixture: ComponentFixture<IcpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IcpComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IcpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
