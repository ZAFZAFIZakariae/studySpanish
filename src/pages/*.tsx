// Home.tsx
import React from 'react';
export default () => <div className="p-4">Welcome to the Spanish Trainer</div>;

// Section.tsx
import React from 'react';
export default () => <div className="p-4">Section Page</div>;

// Lesson/[slug].tsx
import React from 'react';
import { useParams } from 'react-router-dom';
export default () => {
  const { slug } = useParams();
  return <div className="p-4">Lesson: {slug}</div>;
};

// Dashboard.tsx
import React from 'react';
import { Dashboard as D } from '../components/Dashboard';
export default () => <D />;

// Flashcards.tsx
import React from 'react';
import { FlashcardTrainer } from '../components/FlashcardTrainer';
export default () => <FlashcardTrainer />;

// Settings.tsx
import React from 'react';
export default () => <div className="p-4">Settings</div>;
