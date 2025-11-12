import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Mock axios to avoid Jest ESM parsing issues in node_modules and network calls
jest.mock('axios', () => {
  const axiosMock = {
    defaults: { headers: { common: {} } },
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: jest.fn(() => 0), eject: jest.fn() },
      response: { use: jest.fn(() => 0), eject: jest.fn() }
    },
    create: () => ({ get: jest.fn(), post: jest.fn(), defaults: { headers: { common: {} } } })
  };
  return axiosMock;
});

// Mock react-leaflet ESM exports to avoid Jest parser issues
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  Popup: ({ children }) => <div>{children}</div>,
  useMap: () => ({})
}));

test('App renders without crashing', () => {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>
  );
});
