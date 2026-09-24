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

  it('switches the app shell to the Library theme on the second tab', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Library' }));
    expect(document.querySelector('.app-shell')?.className).toContain('is-library');
  });
});
