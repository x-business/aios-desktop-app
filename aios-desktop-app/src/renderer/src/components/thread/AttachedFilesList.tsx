import { X } from 'lucide-react';
import { ParsedFilePickerResult } from '@shared/types/parsedfile-tyeps';

interface AttachedFilesListProps {
  attachedFiles: ParsedFilePickerResult;
  onRemoveFile: (index: number) => void;
  onClearAll: () => void;
}

export function AttachedFilesList({
  attachedFiles,
  onRemoveFile,
  onClearAll,
}: AttachedFilesListProps) {
  if (
    !attachedFiles.messageContent ||
    attachedFiles.messageContent.length === 0
  ) {
    return null;
  }

  return (
    <div className="px-3.5 py-1 flex flex-wrap items-center gap-2">
      {attachedFiles.messageContent.map((file, index) => (
        <div
          key={index}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-background"
        >
          {file.type.startsWith('image/') ? '🖼️' : '📄'}{' '}
          {file.fileName && file.fileName.length > 20
            ? file.fileName.substring(0, 20) + '...'
            : file.fileName}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFile(index);
            }}
            className="ml-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {attachedFiles.messageContent.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-xs underline text-muted-foreground hover:text-foreground"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
