import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { ImageIcon, Loader2, X } from "lucide-react";

interface FileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  onChange?: (file: File | null) => void;
  value?: File | null;
  preview?: string | null;
  loading?: boolean;
  error?: string;
  onClear?: () => void;
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ className, onChange, value, preview, loading, error, onClear, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleClick = () => {
      inputRef.current?.click();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      if (onChange) {
        onChange(file);
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      if (onClear) {
        onClear();
      }
      if (onChange) {
        onChange(null);
      }
    };

    return (
      <div className="space-y-2">
        <div
          onClick={handleClick}
          className={cn(
            "relative flex min-h-[150px] cursor-pointer items-center justify-center rounded-lg border border-dashed border-input bg-background p-4 transition-colors hover:bg-accent/50",
            error && "border-destructive",
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
          />

          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading...</span>
            </div>
          ) : preview ? (
            <div className="relative aspect-video w-full">
              <img
                src={preview}
                alt="Preview"
                className="h-full w-full rounded-lg object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -right-2 -top-2"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : value ? (
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span>{value.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
              <span>Click to upload image</span>
              <span className="text-xs">JPG, JPEG, PNG (max. 5MB)</span>
            </div>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);

FileInput.displayName = "FileInput";

export { FileInput };
