export class CreateTaskDto {
  title: string;
  steps?: string[];
  reminderDate?: Date;
  isImportant?: boolean;
  note: string;
  isComplete: boolean;
  files?: string[];
  userId: number;
  finishTask?: Date;
}
