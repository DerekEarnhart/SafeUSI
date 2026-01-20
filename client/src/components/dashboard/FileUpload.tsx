import { useState, useRef } from 'react';
import { Upload, File, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  jobId?: string;
  progress: number;
}

export function FileUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      await uploadFile(file);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File) => {
    const fileId = Math.random().toString(36).substr(2, 9);
    
    // Add file to list with uploading status
    const uploadFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0
    };
    
    setUploadedFiles(prev => [...prev, uploadFile]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId && f.progress < 90 
            ? { ...f, progress: f.progress + 10 }
            : f
        ));
      }, 100);

      const response = await fetch('/api/process-file', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (response.ok) {
        const result = await response.json();
        
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { 
                ...f, 
                status: result.status === 'completed' ? 'complete' : 'processing', 
                progress: 100, 
                jobId: result.fileId || result.jobId
              }
            : f
        ));

        toast({
          title: "File uploaded successfully",
          description: result.textExtracted 
            ? `${file.name} uploaded and text extracted (${result.wordCount} words)`
            : `${file.name} uploaded successfully`,
        });

        // Invalidate React Query cache to refresh file list immediately
        queryClient.invalidateQueries({ queryKey: ['/api/uploaded-files'] });

        // If still processing, check status after a short delay
        if (result.status !== 'completed') {
          setTimeout(() => {
            setUploadedFiles(prev => prev.map(f => 
              f.id === fileId 
                ? { ...f, status: 'complete' }
                : f
            ));
            // Invalidate cache again after processing completes
            queryClient.invalidateQueries({ queryKey: ['/api/uploaded-files'] });
          }, 1000);
        }
        
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'error', progress: 0 }
          : f
      ));

      toast({
        title: "Upload failed",
        description: `Failed to upload ${file.name}`,
        variant: "destructive",
      });
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'processing': return 'Processing...';
      case 'complete': return 'Ready for search';
      case 'error': return 'Failed';
      default: return 'Unknown';
    }
  };

  return (
    <Card className="border-amber-200/20 bg-amber-50/5 dark:bg-amber-950/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-amber-600" />
          Project File Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div 
          className="border-2 border-dashed border-amber-300/30 rounded-lg p-8 text-center hover:border-amber-400/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          data-testid="file-upload-area"
        >
          <Upload className="h-8 w-8 text-amber-600 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-2">
            Click to upload project files or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            Infinite processing • All file types • No size limits
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            data-testid="file-input"
          />
        </div>

        {/* Upload Button */}
        <Button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-amber-600 hover:bg-amber-700"
          data-testid="upload-button"
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose Files
        </Button>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Uploaded Files</h4>
            {uploadedFiles.map((file) => (
              <div 
                key={file.id} 
                className="flex items-center justify-between p-3 bg-background/50 rounded-lg border"
                data-testid={`file-item-${file.id}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(file.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" data-testid={`file-name-${file.id}`}>
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span data-testid={`file-size-${file.id}`}>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span data-testid={`file-status-${file.id}`}>{getStatusText(file.status)}</span>
                      {file.jobId && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-xs">Job: {file.jobId.slice(0, 8)}</span>
                        </>
                      )}
                    </div>
                    {(file.status === 'uploading' || file.status === 'processing') && (
                      <Progress value={file.progress} className="mt-1 h-1" />
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="text-muted-foreground hover:text-foreground"
                  data-testid={`remove-file-${file.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Simple RAG System Status */}
        <div className="p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-200/20">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-green-700 dark:text-green-300">
              Simple RAG system is active
            </span>
          </div>
          <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
            Files will be saved locally with text extraction for search
          </p>
        </div>
      </CardContent>
    </Card>
  );
}