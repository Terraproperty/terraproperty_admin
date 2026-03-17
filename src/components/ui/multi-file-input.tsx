import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { ImageIcon, Loader2, X } from "lucide-react";

interface FilePreview {
  file: File;
  preview: string;
  uploading: boolean;
  error?: string;
  url?: string;
}

interface MultiFileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  onChange?: (files: FilePreview[]) => void;
  value?: FilePreview[];
  maxFiles?: number;
  onClear?: (index: number) => void;
}

const MultiFileInput = React.forwardRef<HTMLInputElement, MultiFileInputProps>(
  ({ className, onChange, value = [], maxFiles = 5, onClear, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [previews, setPreviews] = React.useState<FilePreview[]>(value);

    const handleClick = () => {
      inputRef.current?.click();
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = Array.from(e.target.files || []);
      if (previews.length + newFiles.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const newPreviews: FilePreview[] = [];

      for (const file of newFiles) {
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        
        newPreviews.push({
          file,
          preview: previewUrl,
          uploading: true
        });
      }

      const updatedPreviews = [...previews, ...newPreviews];
      setPreviews(updatedPreviews);
      
      if (onChange) {
        onChange(updatedPreviews);
      }

      // Reset input value to allow selecting the same file again
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    const handleRemove = (index: number) => {
      const newPreviews = previews.filter((_, i) => i !== index);
      setPreviews(newPreviews);
      
      if (onChange) {
        onChange(newPreviews);
      }

      if (onClear) {
        onClear(index);
      }
    };

    // Cleanup preview URLs on unmount
    React.useEffect(() => {
      return () => {
        previews.forEach(preview => {
          if (preview.preview) {
            URL.revokeObjectURL(preview.preview);
          }
        });
      };
    }, []);

    return (
      <div className="space-y-4">
        {previews.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={preview.preview}
                  alt={`Preview ${index + 1}`}
                  className="h-full w-full rounded-lg object-cover"
                />
                {preview.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -right-2 -top-2"
                  onClick={() => handleRemove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
                {preview.error && (
                  <p className="absolute bottom-0 left-0 right-0 bg-destructive/90 p-1 text-xs text-white text-center rounded-b-lg">
                    {preview.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {previews.length < maxFiles && (
          <div
            onClick={handleClick}
            className={cn(
              "relative flex min-h-[150px] cursor-pointer items-center justify-center rounded-lg border border-dashed border-input bg-background p-4 transition-colors hover:bg-accent/50",
              className
            )}
          >
            <input
              {...props}
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleChange}
              className="hidden"
              multiple
            />
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
              <span>Click to upload images</span>
              <span className="text-xs">
                JPG, JPEG, PNG (max. 5MB) - {maxFiles - previews.length} remaining
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

MultiFileInput.displayName = "MultiFileInput";

export { MultiFileInput, type FilePreview };
