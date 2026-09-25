import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Library } from '@/components/ui/library';

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function pointerEvent(type: string, clientX: number, pointerId = 7) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    clientX: { value: clientX },
    pointerId: { value: pointerId },
  });
  return event;
}

function bookOffset(book: HTMLElement) {
  return Number(book.style.transform.match(/translateX\(calc\(-50% \+ ([\d.-]+)px\)\)/)?.[1]);
}

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

    fireEvent(carousel, pointerEvent('pointerdown', 300));
    fireEvent(carousel, pointerEvent('pointermove', 190));

    expect(books[1].getAttribute('style')).not.toBe(initialTransform);
    expect(books[1].getAttribute('style')).toContain('translateX');
    expect(screen.getByTestId('library-active-volume').textContent).toContain('March 2026');
  });

  it('keeps motion continuous as the active month changes', () => {
    render(<Library />);
    const carousel = screen.getByRole('region', { name: 'Memory volumes' }).querySelector('.library-books-carousel') as HTMLElement;
    const february = screen.getByRole('button', { name: /February 2026/ });
    const march = screen.getByRole('button', { name: /March 2026/ });

    fireEvent(carousel, pointerEvent('pointerdown', 220));
    fireEvent(carousel, pointerEvent('pointermove', 175));
    const beforeBoundary = bookOffset(march);
    expect(february.classList.contains('is-active')).toBe(true);

    fireEvent(carousel, pointerEvent('pointermove', 173));
    expect(carousel.classList.contains('is-dragging')).toBe(true);
    expect(march.classList.contains('is-active')).toBe(true);
    expect(screen.getByTestId('library-active-volume').textContent).toContain('March 2026');
    expect(Math.abs(bookOffset(march) - beforeBoundary)).toBeLessThan(7);
    fireEvent(carousel, pointerEvent('pointerup', 173));
    expect(carousel.classList.contains('is-dragging')).toBe(false);
  });

  it('clamps a large drag and release to the last volume', () => {
    render(<Library />);
    const carousel = screen.getByRole('region', { name: 'Memory volumes' }).querySelector('.library-books-carousel') as HTMLElement;
    const december = screen.getByRole('button', { name: /December 2026/ });

    fireEvent(carousel, pointerEvent('pointerdown', 220));
    fireEvent(carousel, pointerEvent('pointermove', -5000));
    expect(december.classList.contains('is-active')).toBe(true);
    expect(screen.getByTestId('library-active-volume').textContent).toContain('December 2026');
    fireEvent(carousel, pointerEvent('pointerup', -5000));
    expect(screen.getByTestId('library-active-volume').textContent).toContain('December 2026');
    expect(december.classList.contains('is-active')).toBe(true);
  });

  it('caps velocity carry to two volumes when settling', () => {
    vi.spyOn(performance, 'now').mockReturnValueOnce(0).mockReturnValueOnce(10);
    render(<Library />);
    const carousel = screen.getByRole('region', { name: 'Memory volumes' }).querySelector('.library-books-carousel') as HTMLElement;

    fireEvent(carousel, pointerEvent('pointerdown', 220));
    fireEvent(carousel, pointerEvent('pointermove', 128));
    expect(screen.getByTestId('library-active-volume').textContent).toContain('March 2026');
    fireEvent(carousel, pointerEvent('pointerup', 128));
    expect(screen.getByTestId('library-active-volume').textContent).toContain('May 2026');
  });

  it('settles immediately when reduced motion is requested', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    vi.spyOn(performance, 'now').mockReturnValueOnce(0).mockReturnValueOnce(10);
    const frame = vi.spyOn(window, 'requestAnimationFrame');
    render(<Library />);
    const carousel = screen.getByRole('region', { name: 'Memory volumes' }).querySelector('.library-books-carousel') as HTMLElement;
    const may = screen.getByRole('button', { name: /May 2026/ });

    fireEvent(carousel, pointerEvent('pointerdown', 220));
    fireEvent(carousel, pointerEvent('pointermove', 128));
    fireEvent(carousel, pointerEvent('pointerup', 128));

    expect(screen.getByTestId('library-active-volume').textContent).toContain('May 2026');
    expect(bookOffset(may)).toBe(0);
    expect(may.classList.contains('is-active')).toBe(true);
    expect(frame).not.toHaveBeenCalled();
  });
});
