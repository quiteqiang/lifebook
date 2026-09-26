import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Library } from '@/components/ui/library';

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function pointerEvent(type: string, clientX: number, pointerId = 7, mouseButtons?: number) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    clientX: { value: clientX },
    pointerId: { value: pointerId },
    ...(mouseButtons === undefined ? {} : { pointerType: { value: 'mouse' }, buttons: { value: mouseButtons } }),
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
    expect(screen.queryByRole('button', { name: /Turn 3D Page/ })).toBeNull();
  });

  it('leaves a simple pointer click with its book button and captures a real drag', () => {
    render(<Library />);
    const carousel = screen.getByRole('region', { name: 'Memory volumes' }).querySelector('.library-books-carousel') as HTMLElement;
    const book = screen.getByRole('button', { name: /February 2026/ });
    const capture = vi.fn();
    const release = vi.fn();
    carousel.setPointerCapture = capture;
    carousel.releasePointerCapture = release;

    fireEvent(book, pointerEvent('pointerdown', 220));
    fireEvent(book, pointerEvent('pointermove', 217));
    fireEvent(book, pointerEvent('pointerup', 217));
    expect(capture).not.toHaveBeenCalled();
    expect(release).not.toHaveBeenCalled();
    fireEvent.click(book);
    expect(screen.getByRole('dialog', { name: /February 2026/ })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Close book' }));
    fireEvent(book, pointerEvent('pointerdown', 220));
    fireEvent(book, pointerEvent('pointermove', 180));
    expect(capture).toHaveBeenCalledWith(7);
    expect(carousel.classList.contains('is-dragging')).toBe(true);
    fireEvent(carousel, pointerEvent('pointerup', 180));
    expect(release).toHaveBeenCalledWith(7);
  });

  it('keeps settling when a pointer click does not become a drag', () => {
    vi.spyOn(performance, 'now').mockReturnValueOnce(0).mockReturnValueOnce(10).mockReturnValue(20);
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      frames.push(callback);
      return frames.length;
    });
    const cancel = vi.spyOn(window, 'cancelAnimationFrame');
    render(<Library />);
    const carousel = screen.getByRole('region', { name: 'Memory volumes' }).querySelector('.library-books-carousel') as HTMLElement;
    const february = screen.getByRole('button', { name: /February 2026/ });
    const may = screen.getByRole('button', { name: /May 2026/ });

    fireEvent(carousel, pointerEvent('pointerdown', 220));
    fireEvent(carousel, pointerEvent('pointermove', 128));
    fireEvent(carousel, pointerEvent('pointerup', 128));
    expect(frames.length).toBeGreaterThan(0);

    fireEvent(february, pointerEvent('pointerdown', 220));
    fireEvent(february, pointerEvent('pointermove', 218));
    fireEvent(february, pointerEvent('pointerup', 218));
    expect(cancel).not.toHaveBeenCalled();

    for (let step = 0; step < 80 && frames.length; step++) frames.shift()?.(step * 16);
    expect(bookOffset(may)).toBeCloseTo(0, 2);
    expect(may.classList.contains('is-active')).toBe(true);
  });

  it('starts a held drag from the settled position after animation finishes', () => {
    vi.spyOn(performance, 'now').mockReturnValueOnce(0).mockReturnValueOnce(10).mockReturnValue(20);
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      frames.push(callback);
      return frames.length;
    });
    render(<Library />);
    const carousel = screen.getByRole('region', { name: 'Memory volumes' }).querySelector('.library-books-carousel') as HTMLElement;
    const may = screen.getByRole('button', { name: /May 2026/ });

    fireEvent(carousel, pointerEvent('pointerdown', 220));
    fireEvent(carousel, pointerEvent('pointermove', 128));
    fireEvent(carousel, pointerEvent('pointerup', 128));
    fireEvent(carousel, pointerEvent('pointerdown', 220));
    for (let step = 0; step < 80 && frames.length; step++) frames.shift()?.(step * 16);

    const beforeDrag = bookOffset(may);
    expect(beforeDrag).toBeCloseTo(0, 2);
    fireEvent(carousel, pointerEvent('pointermove', 200));
    expect(carousel.classList.contains('is-dragging')).toBe(true);
    expect(Math.abs(bookOffset(may) - beforeDrag)).toBeLessThan(7);
    fireEvent(carousel, pointerEvent('pointerup', 200));
  });

  it('ignores a return move after an uncaptured pointer leaves or releases outside', () => {
    render(<Library />);
    const carousel = screen.getByRole('region', { name: 'Memory volumes' }).querySelector('.library-books-carousel') as HTMLElement;
    const capture = vi.fn();
    carousel.setPointerCapture = capture;
    const caption = screen.getByTestId('library-active-volume');

    fireEvent(carousel, pointerEvent('pointerdown', 220, 7, 1));
    fireEvent(carousel, pointerEvent('pointermove', 218, 7, 1));
    fireEvent(carousel, pointerEvent('pointerout', 218, 7, 1));
    fireEvent(carousel, pointerEvent('pointermove', 100, 7, 0));
    expect(caption.textContent).toContain('February 2026');
    expect(capture).not.toHaveBeenCalled();

    fireEvent(carousel, pointerEvent('pointerdown', 220, 7, 1));
    fireEvent(carousel, pointerEvent('pointermove', 100, 7, 0));
    expect(caption.textContent).toContain('February 2026');
    expect(capture).not.toHaveBeenCalled();
    expect(carousel.classList.contains('is-dragging')).toBe(false);
  });

  it('closes the open book portal', () => {
    render(<Library />);
    fireEvent.click(screen.getByRole('button', { name: /July 2026/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Close book' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens with book depth and completes its entrance after the transition', () => {
    render(<Library />);
    fireEvent.click(screen.getByRole('button', { name: /July 2026/ }));
    const dialog = screen.getByRole('dialog', { name: /July 2026/ });

    expect(dialog.classList.contains('is-opening')).toBe(true);
    expect(dialog.querySelector('.library-book-spine')).toBeTruthy();
    expect(dialog.querySelector('.library-cover-depth')).toBeTruthy();
    expect(dialog.querySelector('.library-page-edges')).toBeTruthy();

    fireEvent.animationEnd(dialog);
    expect(dialog.classList.contains('is-opening')).toBe(false);
  });

  it('turns the open book page in place and keeps its controls available', () => {
    const onReplay = vi.fn();
    render(<Library onReplay={onReplay} />);
    fireEvent.click(screen.getByRole('button', { name: /July 2026/ }));
    const page = screen.getByRole('button', { name: 'Flip page' });
    expect(page.className).not.toContain('is-flipped');
    expect(page.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(page);
    expect(page.className).toContain('is-flipped');
    expect(page.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('dialog', { name: /July 2026/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Turn 3D Page/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Replay Voice' }));
    expect(onReplay).toHaveBeenCalledOnce();
    fireEvent.click(page);
    expect(page.className).not.toContain('is-flipped');
    expect(page.getAttribute('aria-pressed')).toBe('false');
  });

  it('skips the entrance state when reduced motion is requested', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    render(<Library />);
    fireEvent.click(screen.getByRole('button', { name: /July 2026/ }));

    expect(screen.getByRole('dialog', { name: /July 2026/ }).classList.contains('is-opening')).toBe(false);
  });

  it('keeps the leaf available and focused in both flip directions', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    render(<Library />);
    fireEvent.click(screen.getByRole('button', { name: /July 2026/ }));
    const leaf = screen.getByRole('button', { name: 'Flip page' });
    leaf.focus();
    fireEvent.click(leaf);
    expect(leaf.classList.contains('is-flipped')).toBe(true);
    expect(leaf.tabIndex).toBe(0);
    expect(leaf.getAttribute('aria-hidden')).toBeNull();
    expect(document.activeElement).toBe(leaf);

    fireEvent.click(leaf);
    expect(leaf.classList.contains('is-flipped')).toBe(false);
    expect(leaf.tabIndex).toBe(0);
    expect(leaf.getAttribute('aria-hidden')).toBeNull();
    expect(document.activeElement).toBe(leaf);
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
