import React from 'react';
import { FlashcardTrainer } from '../components/FlashcardTrainer';

const FlashcardsPage: React.FC = () => (
  <section className="space-y-4" aria-labelledby="flashcards-heading">
    <h1 id="flashcards-heading" className="text-2xl font-bold">
      Flashcard trainer
    </h1>
    <FlashcardTrainer />
  </section>
);

export default FlashcardsPage;
