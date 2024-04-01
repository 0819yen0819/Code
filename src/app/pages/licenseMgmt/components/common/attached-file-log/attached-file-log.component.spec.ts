import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttachedFileLogComponent } from './attached-file-log.component';

describe('AttachedFileLogComponent', () => {
  let component: AttachedFileLogComponent;
  let fixture: ComponentFixture<AttachedFileLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AttachedFileLogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AttachedFileLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
