import 'whatwg-fetch';

import "@testing-library/jest-dom";

// Mock Next.js API routes
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => {
      return {
        json: jest.fn().mockResolvedValue(data),
        status: init?.status || 200,
        headers: init?.headers || {},
      };
    }),
    redirect: jest.fn((url) => ({
      url,
      status: 302,
    })),
  },
}));

// Mock Next.js headers
jest.mock('next/headers', () => ({
  headers: jest.fn(() => new Map()),
  cookies: jest.fn(() => new Map()),
}));
