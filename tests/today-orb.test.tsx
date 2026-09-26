import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '@/App';
import { AIVoiceInput } from '@/components/ui/ai-voice-input';

afterEach(() => { cleanup(); vi.useRealTimers(); });

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

  it('shows the voice input state and removes the control in Library', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Start voice input' })).toBeTruthy();
    expect(screen.getByText('Click to speak')).toBeTruthy();
    expect(screen.getByText('00:00')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Start voice input' }));
    expect(screen.getByRole('button', { name: 'Stop voice input' })).toBeTruthy();
    expect(screen.getByText('Listening...')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Library' }));
    expect(screen.queryByRole('button', { name: /voice input/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(screen.getByRole('button', { name: 'Start voice input' })).toBeTruthy();
  });
});

describe('AI voice input', () => {
  it('updates the elapsed timer without repeatedly requesting a stop', () => {
    vi.useFakeTimers();
    const onStart = vi.fn();
    const onStop = vi.fn();
    const { rerender } = render(<AIVoiceInput active={false} ready={false} disabled={false} onStart={onStart} onStop={onStop} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start voice input' }));
    expect(onStart).toHaveBeenCalledTimes(1);
    rerender(<AIVoiceInput active ready disabled={false} onStart={onStart} onStop={onStop} />);
    act(() => { vi.advanceTimersByTime(2100); });
    expect(screen.getByText('00:02')).toBeTruthy();
    expect(onStop).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Stop voice input' }));
    expect(onStop).toHaveBeenCalledTimes(1);
    rerender(<AIVoiceInput active={false} ready={false} disabled={false} onStart={onStart} onStop={onStop} />);
    expect(screen.getByText('00:00')).toBeTruthy();
  });

  it('disables the voice button while saving', () => {
    const onStart = vi.fn();
    render(<AIVoiceInput active={false} ready={false} disabled onStart={onStart} onStop={vi.fn()} />);
    const button = screen.getByRole('button', { name: 'Start voice input' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(onStart).not.toHaveBeenCalled();
  });
});
