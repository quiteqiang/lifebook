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

  it('scrolls the bookshelf when dragged with a mouse', () => {
    render(<Library />);
    const carousel = screen.getByRole('region', { name: 'Memory volumes' }).querySelector('.library-books-carousel') as HTMLElement;
    Object.defineProperty(carousel, 'clientWidth', { configurable: true, value: 400 });
    Object.defineProperty(carousel, 'scrollWidth', { configurable: true, value: 1200 });
    carousel.scrollLeft = 0;

    fireEvent.mouseDown(carousel, { clientX: 300 });
    fireEvent.mouseMove(carousel, { clientX: 220 });

    expect(carousel.scrollLeft).toBe(80);
    expect(carousel.classList.contains('is-dragging')).toBe(true);

    fireEvent.mouseUp(carousel, { clientX: 220 });
    expect(carousel.scrollLeft).toBe(400);
    expect(carousel.classList.contains('is-dragging')).toBe(false);
  });
});
