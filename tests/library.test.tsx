import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Library } from '@/components/ui/library';

afterEach(() => cleanup());

describe('Library replacement page', () => {
  it('shows twelve monthly volumes and opens a book portal', () => {
    render(<Library />);

    expect(screen.queryByRole('heading', { name: 'The Living Shelf' })).toBeNull();
    expect(screen.queryByText('MEMORY ARCHIVE')).toBeNull();
    expect(screen.getAllByRole('button', { name: /2026/ })).toHaveLength(12);
    expect(screen.getByRole('button', { name: /January 2026/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /December 2026/ })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Memory volumes' }).querySelector('.library-books')?.classList.contains('library-books-carousel')).toBe(true);

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

  it('applies coverflow motion and updates the active volume caption while dragging', () => {
    render(<Library />);
    const carousel = screen.getByRole('region', { name: 'Memory volumes' }).querySelector('.library-books-carousel') as HTMLElement;
    const books = screen.getAllByRole('button', { name: /2026/ });
    const initialTransform = books[1].getAttribute('style');

    const down = new Event('pointerdown', { bubbles: true });
    Object.defineProperty(down, 'clientX', { value: 300 });
    Object.defineProperty(down, 'pointerId', { value: 7 });
    const move = new Event('pointermove', { bubbles: true });
    Object.defineProperty(move, 'clientX', { value: 190 });
    Object.defineProperty(move, 'pointerId', { value: 7 });
    fireEvent(carousel, down);
    fireEvent(carousel, move);

    expect(books[1].getAttribute('style')).not.toBe(initialTransform);
    expect(books[1].getAttribute('style')).toContain('translateX');
    expect(screen.getByTestId('library-active-volume').textContent).toContain('March 2026');
  });
});
