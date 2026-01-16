import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, User as UserIcon, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  name: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
}

export function AvatarUpload({ currentAvatarUrl, name, onUpload, onRemove }: AvatarUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      onUpload(objectUrl);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1,
    multiple: false
  });

  return (
    <div className="flex items-center gap-6">
      <Avatar className="h-24 w-24 border-2 border-border">
        {currentAvatarUrl ? (
          <AvatarImage src={currentAvatarUrl} alt={name} className="object-cover" />
        ) : null}
        <AvatarFallback className="text-2xl bg-muted">
          {name ? name.charAt(0).toUpperCase() : <UserIcon className="h-8 w-8 text-muted-foreground" />}
        </AvatarFallback>
      </Avatar>

      <div className="space-y-2">
        <div 
          {...getRootProps()} 
          className={`
            border-2 border-dashed rounded-md px-4 py-3 cursor-pointer transition-colors text-sm font-medium
            flex items-center gap-2 hover:bg-muted/50 hover:border-primary/50
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="h-4 w-4 text-muted-foreground" />
          <span>{isDragActive ? 'Drop image here' : 'Upload photo'}</span>
        </div>
        
        {currentAvatarUrl && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRemove}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
          >
            <X className="h-3 w-3 mr-1.5" /> Remove photo
          </Button>
        )}
        
        <p className="text-[10px] text-muted-foreground">
          Recommended: Square JPG, PNG, or GIF. Max 2MB.
        </p>
      </div>
    </div>
  );
}
