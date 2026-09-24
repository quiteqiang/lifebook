import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Library } from '@/components/ui/library';

afterEach(() => cleanup());

describe('Library replacement page', () => {
  it('shows the three sample volumes and opens a book portal', () => {
    render(<Library />);

    expect(screen.queryByRole('heading', { name: 'The Living Shelf' })).toBeNull();
    expect(screen.queryByText('MEMORY ARCHIVE')).toBeNull();
    expect(screen.getByRole('button', { name: /July 2026/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /August 2026/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /September 2026/ })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /September 2026/ }));

    expect(screen.getByRole('dialog', { name: /September 2026/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Turn 3D Page' })).toBeTruthy();
  });

  it('closes the open book portal', () => {
    render(<Library />);
    fireEvent.click(screen.getByRole('button', { name: /July 2026/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Close book' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
