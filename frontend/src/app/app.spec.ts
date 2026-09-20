import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not show the logged-in shell when logged out', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const shell = (fixture.nativeElement as HTMLElement).querySelector('.shell');
    expect(shell?.classList.contains('app')).toBe(false);
  });
});
