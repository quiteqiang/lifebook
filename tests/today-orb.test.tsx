import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@/App';

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
});

