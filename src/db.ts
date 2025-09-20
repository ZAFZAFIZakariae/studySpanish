import Dexie, { Table } from 'dexie';
import { Lesson, Exercise, Grade, Flashcard } from './lib/schemas';

class AppDB extends Dexie {
  lessons!: Table<Lesson, string>;
  exercises!: Table<Exercise, string>;
  grades!: Table<Grade, string>;
  flashcards!: Table<Flashcard, string>;
  settings!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('spanishAppDB');
    this.version(1).stores({
      lessons: 'id,level,tags',
      exercises: 'id,lessonId,type',
      grades: 'id,exerciseId,isCorrect,score',
      flashcards: 'id,tag,deck',
      settings: 'key'
    });

    this.version(2).stores({
      lessons: 'id,slug,level,tags',
      exercises: 'id,lessonId,type',
      grades: 'id,exerciseId,isCorrect,score',
      flashcards: 'id,tag,deck',
      settings: 'key'
    });
  }
}

export const db = new AppDB();
