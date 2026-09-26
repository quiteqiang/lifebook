import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '@/App';

afterEach(() => cleanup());

vi.mock('@/components/ui/voice-powered-orb', () => ({
  VoicePoweredOrb: () => <div role="img" aria-label="Animated voice orb" />,
}));

vi.mock('@/components/ui/voice-mix-studio', () => ({
  VoiceMixStudio: () => <div aria-label="Voice collection mixer" />,
}));

describe('Today home visual', () => {
  it('shows the animated voice orb before recording starts', () => {
    render(<App />);
    expect(screen.getByRole('img', { name: 'Animated voice orb' })).toBeTruthy();
  });

  it('uses an icon-only accessible brand header', () => {
    render(<App />);
    expect(screen.queryByText('Life Book')).toBeNull();
    expect(screen.getByRole('banner', { name: 'Life Book' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Library' })).toBeTruthy();
  });

  it('applies the Today and Library shell theme classes when switching tabs', () => {
    render(<App />);
    expect(document.querySelector('.app-shell')?.className).toContain('is-today');
    expect(document.querySelector('.main-stage')?.className).toContain('tab-today');
    fireEvent.click(screen.getByRole('button', { name: 'Library' }));
    expect(document.querySelector('.app-shell')?.className).toContain('is-library');
    expect(document.querySelector('.main-stage')?.className).toContain('tab-book');
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(document.querySelector('.app-shell')?.className).toContain('is-today');
    expect(document.querySelector('.app-shell')?.className).not.toContain('is-library');
  });
});
