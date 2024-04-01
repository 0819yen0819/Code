import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhiteListMtnComponent } from './white-list-mtn.component';

describe('WhiteListMtnComponent', () => {
  let component: WhiteListMtnComponent;
  let fixture: ComponentFixture<WhiteListMtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WhiteListMtnComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WhiteListMtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
