import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SubjectsPage from '../SubjectsPage';

jest.mock('../../data/subjectResources', () => ({
  subjectResourceLibrary: {}
}));

describe('SubjectsPage', () => {
  it('shows summary and translation details for Distributed Applications session 1', async () => {
    render(
      <MemoryRouter>
        <SubjectsPage />
      </MemoryRouter>
    );

    const detail = await screen.findByRole('article');
    const summarySection = within(detail).getByRole('region', { name: /lesson summary/i });

    expect(within(summarySection).getByText(/we kicked off with the full syllabus walkthrough/i)).toBeInTheDocument();
    expect(within(summarySection).getByText(/dimos la bienvenida al curso repasando el sílabo completo/i)).toBeInTheDocument();

    const translationSection = within(detail).getByRole('region', { name: /translation notes/i });
    expect(within(translationSection).getByText(/english in progress/i)).toBeInTheDocument();
    expect(within(translationSection).getByText(/notas bilingües con el vocabulario administrativo clave/i)).toBeInTheDocument();
  });
});
