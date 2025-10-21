import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
jest.mock('../../data/subjectResources', () => ({
  subjectResourceLibrary: {},
}));

import SubjectExtractsPage from '../SubjectExtractsPage';

describe('SubjectExtractsPage', () => {
  it('renders the first extract and shows its source', () => {
    render(<SubjectExtractsPage />);

    expect(screen.getByRole('heading', { name: /explore extracted study resources/i })).toBeInTheDocument();
    const sourceMeta = screen.getByText(/source file:/i);
    expect(sourceMeta).toHaveTextContent(/subjects\//i);
    expect(screen.getAllByRole('button', { name: /view/i }).length).toBeGreaterThan(0);
  });

  it('filters extracts when the user types a search query', async () => {
    render(<SubjectExtractsPage />);
    const user = userEvent.setup();

    const search = screen.getByRole('searchbox', { name: /search extracts/i });
    await user.type(search, 'microservices');

    expect(screen.getByText(/showing .* for "microservices"\./i)).toBeInTheDocument();
  });

  it('updates the preview when selecting another extract', async () => {
    render(<SubjectExtractsPage />);
    const user = userEvent.setup();

    const cards = screen.getAllByRole('button', { name: /view/i });
    expect(cards.length).toBeGreaterThan(1);

    const sourceMeta = screen.getByText(/source file:/i);
    const initialSource = sourceMeta.textContent;

    await user.click(cards[1]);

    expect(screen.getByText(/source file:/i).textContent).not.toEqual(initialSource);
  });

  it('shows an empty state when no extracts match the filter', async () => {
    render(<SubjectExtractsPage />);
    const user = userEvent.setup();

    const search = screen.getByRole('searchbox', { name: /search extracts/i });
    await user.clear(search);
    await user.type(search, 'zzznomatch');

    expect(screen.getByText(/no extracts match "zzznomatch"/i)).toBeInTheDocument();
  });
});
