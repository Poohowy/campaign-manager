import '@testing-library/jest-dom/vitest'

class ResizeObserverMock {
  observe(): void {
    return undefined
  }

  unobserve(): void {
    return undefined
  }

  disconnect(): void {
    return undefined
  }
}

globalThis.ResizeObserver = ResizeObserverMock
