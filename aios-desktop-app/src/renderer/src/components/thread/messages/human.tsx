import { useStreamContext } from '@/providers/Stream';
import { Message } from '@langchain/langgraph-sdk';
import { useState, useCallback } from 'react';
import { getContentString } from '../utils';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { BranchSwitcher, CommandBar } from './shared';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { MessageContent, MessageContentText } from '@langchain/core/messages';
import { toast } from 'sonner';

function EditableContent({
  value,
  setValue,
  onSubmit,
  onPaste,
  handleFileUpload,
}: {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: () => void;
  onPaste: (e: React.ClipboardEvent) => void;
  handleFileUpload: (files: File[]) => Promise<void>;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <Textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onPaste={onPaste}
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add('border-primary');
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove('border-primary');
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('border-primary');
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
          handleFileUpload(files);
        }
      }}
      className="transition-colors focus-visible:ring-0"
    />
  );
}

// Add type guard
function isImageUrlObject(
  image_url: string | { url: string; detail?: string }
): image_url is { url: string; detail?: string } {
  return typeof image_url === 'object' && 'url' in image_url;
}

const extractFileName = (text: string): string | null => {
  const match = text.match(/\[<file name=([^>]+)>/);
  if (match) {
    return match[1]; // return the file name
  }
  return null; // no match found
};

const getUserInputContent = (content: MessageContent): string => {
  if (Array.isArray(content)) {
    const userInputs = content
      .filter(
        (c): c is MessageContentText =>
          c.type === 'text' && extractFileName(c.text) === null
      )
      .map((c) => c.text);
    return userInputs.join('\n');
  }
  return typeof content === 'string' ? content : '';
};

export function HumanMessage({
  message,
  isLoading,
}: {
  message: Message;
  isLoading: boolean;
}) {
  const thread = useStreamContext();
  const meta = thread.getMessagesMetadata(message);
  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState('');
  const contentString = getContentString(message.content);

  const handleSubmitEdit = () => {
    setIsEditing(false);

    const newMessage: Message = { type: 'human', content: value };
    thread.submit(
      { messages: [newMessage] },
      {
        checkpoint: parentCheckpoint,
        streamMode: ['values'],
        optimisticValues: (prev) => {
          const values = meta?.firstSeenState?.values;
          if (!values) return prev;

          return {
            ...values,
            messages: [...(values.messages ?? []), newMessage],
          };
        },
      }
    );
  };

  const drawMessageContent = (content: MessageContent) => {
    if (Array.isArray(content)) {
      type MessageContentWithImage = {
        type: 'image_url';
        image_url: { url: string; detail?: string };
      };

      const userinput = content.filter(
        (c): c is MessageContentText =>
          c.type === 'text' && extractFileName(c.text) === null
      );

      const files = content.filter(
        (c): c is MessageContentText =>
          c.type === 'text' && extractFileName(c.text) !== null
      );

      const images = content.filter(
        (c): c is MessageContentWithImage =>
          c.type === 'image_url' && isImageUrlObject(c.image_url)
      );

      return (
        <div className="px-4 py-2 text-right rounded-3xl bg-muted">
          {userinput.map((c, i) => (
            <p key={i} className="">
              {c.text}
            </p>
          ))}
          <div className="px-3.5 py-1 flex flex-wrap items-center gap-2">
            {files.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-background"
              >
                📄
                <span>{extractFileName(c.text)}</span>
              </div>
            ))}
            {images.map((c, i) => (
              <div key={i} className="my-2">
                <img
                  src={c.image_url.url}
                  alt={c.image_url.detail || 'Image'}
                  width={40}
                  height={40}
                  className="rounded-md"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const handleFileUpload = useCallback(async (files: File[]) => {
    try {
      const result = await window.api.handleFiles(files);
      if (result.success && result.messageContent?.length) {
        toast.success(`Added ${result.messageContent.length} file(s)`);
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error: any) {
      console.error('Error processing files:', error);
      toast.error('Failed to process files: ' + (error.message || 'Unknown error'));
    }
  }, []);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const files: File[] = [];

    items.forEach(item => {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    });

    if (files.length > 0) {
      e.preventDefault();
      await handleFileUpload(files);
    }
  }, [handleFileUpload]);

  return (
    <div
      className={cn(
        'flex items-center ml-auto gap-2 group',
        isEditing && 'w-full max-w-xl'
      )}
    >
      <div className={cn('', isEditing && 'w-full')}>
        {isEditing ? (
          <EditableContent
            value={value}
            setValue={setValue}
            onSubmit={handleSubmitEdit}
            onPaste={handlePaste}
            handleFileUpload={handleFileUpload}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {message.content && Array.isArray(message.content) ? (
              drawMessageContent(message.content)
            ) : (
              <div className="whitespace-pre-wrap">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {typeof message.content === 'string' ? message.content : ''}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        <div
          className={cn(
            'flex gap-2 items-center ml-auto transition-opacity',
            'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100',
            isEditing && 'opacity-100'
          )}
        >
          <BranchSwitcher
            branch={meta?.branch}
            branchOptions={meta?.branchOptions}
            onSelect={(branch) => thread.setBranch(branch)}
            isLoading={isLoading}
          />
          <CommandBar
            isLoading={isLoading}
            content={contentString}
            isEditing={isEditing}
            setIsEditing={(c) => {
              if (c) {
                setValue(getUserInputContent(message.content));
              }
              setIsEditing(c);
            }}
            handleSubmitEdit={handleSubmitEdit}
            isHumanMessage={true}
          />
        </div>
      </div>
    </div>
  );
}
