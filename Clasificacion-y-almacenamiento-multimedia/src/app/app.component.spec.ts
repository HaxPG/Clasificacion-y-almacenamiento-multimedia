import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing'; // Import for RouterOutlet

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
    // TestBed.overrideComponent(AppComponent, { // If NavbarComponent or SidebarComponent are not standalone or have complex dependencies
    //   set: { imports: [RouterTestingModule] } // Or mock them
    // });
  }); // Note: If NavbarComponent or SidebarComponent are complex, they might need to be mocked or properly provided in the testing module.

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the main layout structure', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-navbar')).toBeTruthy();
    expect(compiled.querySelector('app-sidebar')).toBeTruthy();
    expect(compiled.querySelector('main.app-main router-outlet')).toBeTruthy();
  });
});
