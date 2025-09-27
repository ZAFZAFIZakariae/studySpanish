import Dexie, { Table } from 'dexie';
import { Lesson, Exercise, Grade, Flashcard } from './lib/schemas';
import { SpeakingCheckpoint } from './types/speaking';

class AppDB extends Dexie {
  lessons!: Table<Lesson, string>;
  exercises!: Table<Exercise, string>;
  grades!: Table<Grade, string>;
  flashcards!: Table<Flashcard, string>;
  settings!: Table<{ key: string; value: any }, string>;
  speaking!: Table<SpeakingCheckpoint, string>;

  constructor() {
    super('spanishAppDB');
    this.version(1).stores({
      lessons: 'id,level,tags',
      exercises: 'id,lessonId,type',
      grades: 'id,exerciseId,isCorrect,score',
      flashcards: 'id,tag,deck',
      settings: 'key',
    });

    this.version(2).stores({
      lessons: 'id,slug,level,tags',
      exercises: 'id,lessonId,type',
      grades: 'id,exerciseId,isCorrect,score',
      flashcards: 'id,tag,deck',
      settings: 'key',
    });

    this.version(3).stores({
      lessons: 'id,slug,level,tags',
      exercises: 'id,lessonId,type',
      grades: 'id,exerciseId,isCorrect,score',
      flashcards: 'id,tag,deck',
      settings: 'key',
      speaking: 'id,exerciseId',
    });
  }
}

export const db = new AppDB();
