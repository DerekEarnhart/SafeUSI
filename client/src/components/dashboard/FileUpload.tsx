import { useState, useRef, useEffect } from 'react';
import { Upload, File, CheckCircle, AlertCircle, X, FileArchive, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  jobId?: string;
  progress: number;
  wordCount?: number;
  fileType?: string;
}

interface ServerFile {
  id: string;
  filename: string;
  fileSize: number;
  fileType: string;
  status: string;
  textExtracted: boolean;
  wordCount: number;
  createdAt: string;
}

// Chunk size for large file uploads (5MB)
const CHUNK_SIZE = 5 * 1024 * 1024;

export function FileUpload() {
  const [uploadingFiles, setUploadingFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing files from server - this ensures persistence across tabs
  const { data: serverFiles = [], isLoading: filesLoading, refetch: refetchFiles } = useQuery<ServerFile[]>({
    queryKey: ['/api/uploaded-files'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Convert server files to display format
  const displayFiles: UploadedFile[] = [
    // Currently uploading files
    ...uploadingFiles,
    // Server files (exclude any that are currently being uploaded)
    ...serverFiles
      .filter(sf => !uploadingFiles.some(uf => uf.jobId === sf.id))
      .map(sf => ({
        id: sf.id,
        name: sf.filename,
        size: sf.fileSize,
        status: sf.textExtracted ? 'complete' as const : 'processing' as const,
        jobId: sf.id,
        progress: 100,
        wordCount: sf.wordCount,
        fileType: sf.fileType,
      }))
  ];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check if it's a ChatGPT export (zip file)
      if (file.name.endsWith('.zip') && file.size > 100 * 1024 * 1024) {
        // Large zip file - use chunked upload
        await uploadLargeFile(file);
      } else if (file.name.endsWith('.zip')) {
        // Regular zip file - might be ChatGPT export
        await uploadFile(file, true);
      } else {
        await uploadFile(file, false);
      }
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File, isChatGPTExport: boolean = false) => {
    const fileId = Math.random().toString(36).substr(2, 9);
    
    // Add file to uploading list
    const uploadFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0,
      fileType: isChatGPTExport ? 'chatgpt-export' : file.type,
    };
    
    setUploadingFiles(prev => [...prev, uploadFile]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (isChatGPTExport) {
        formData.append('type', 'chatgpt-export');
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => prev.map(f => 
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
        
        // Update to complete status
        setUploadingFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { 
                ...f, 
                status: 'complete', 
                progress: 100, 
                jobId: result.fileId || result.jobId,
                wordCount: result.wordCount,
              }
            : f
        ));

        toast({
          title: "File uploaded successfully",
          description: result.textExtracted 
            ? `${file.name} - ${result.wordCount} words extracted`
            : `${file.name} uploaded successfully`,
        });

        // Refresh the file list from server
        queryClient.invalidateQueries({ queryKey: ['/api/uploaded-files'] });
        
        // Remove from uploading list after a short delay (server list will show it)
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
        }, 1000);
        
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      setUploadingFiles(prev => prev.map(f => 
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

  const uploadLargeFile = async (file: File) => {
    const fileId = Math.random().toString(36).substr(2, 9);
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    // Add file to uploading list
    const uploadFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0,
      fileType: 'chatgpt-export',
    };
    
    setUploadingFiles(prev => [...prev, uploadFile]);

    try {
      // Initialize chunked upload
      const initResponse = await fetch('/api/upload/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          fileSize: file.size,
          totalChunks,
          fileType: 'chatgpt-export',
        }),
      });

      if (!initResponse.ok) {
        throw new Error('Failed to initialize upload');
      }

      const { uploadId } = await initResponse.json();

      // Upload chunks
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', totalChunks.toString());

        const chunkResponse = await fetch('/api/upload/chunk', {
          method: 'POST',
          body: formData,
        });

        if (!chunkResponse.ok) {
          throw new Error(`Failed to upload chunk ${chunkIndex + 1}`);
        }

        // Update progress
        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
        setUploadingFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress } : f
        ));
      }

      // Complete the upload
      const completeResponse = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId }),
      });

      if (!completeResponse.ok) {
        throw new Error('Failed to complete upload');
      }

      const result = await completeResponse.json();

      // Update status
      setUploadingFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              status: 'complete', 
              progress: 100, 
              jobId: result.fileId,
              wordCount: result.wordCount,
            }
          : f
      ));

      toast({
        title: "Large file uploaded successfully",
        description: `${file.name} - ${result.conversationCount || 0} conversations extracted`,
      });

      // Refresh file list
      queryClient.invalidateQueries({ queryKey: ['/api/uploaded-files'] });
      
      // Remove from uploading list
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
      }, 1000);

    } catch (error) {
      setUploadingFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'error', progress: 0 }
          : f
      ));

      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : `Failed to upload ${file.name}`,
        variant: "destructive",
      });
    }
  };

  const removeFile = async (fileId: string, jobId?: string) => {
    // Remove from local state
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
    
    // If it has a jobId, also delete from server
    if (jobId) {
      try {
        await fetch(`/api/files/${jobId}`, { method: 'DELETE' });
        queryClient.invalidateQueries({ queryKey: ['/api/uploaded-files'] });
      } catch (error) {
        console.error('Failed to delete file from server:', error);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadedFile['status'], fileType?: string) => {
    if (fileType === 'chatgpt-export') {
      if (status === 'complete') {
        return <FileArchive className="h-4 w-4 text-green-500" />;
      }
      return <FileArchive className="h-4 w-4 text-blue-500" />;
    }
    
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: UploadedFile['status'], wordCount?: number) => {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'processing': return 'Processing...';
      case 'complete': return wordCount ? `Ready • ${wordCount.toLocaleString()} words` : 'Ready for search';
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
          {filesLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
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
            Supports ChatGPT exports (ZIP) • All file types • Up to 1GB+
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="*/*,.zip"
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

        {/* Files List - Shows both uploading and server files */}
        {displayFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Uploaded Files ({displayFiles.length})
            </h4>
            {displayFiles.map((file) => (
              <div 
                key={file.id} 
                className="flex items-center justify-between p-3 bg-background/50 rounded-lg border"
                data-testid={`file-item-${file.id}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(file.status, file.fileType)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" data-testid={`file-name-${file.id}`}>
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span data-testid={`file-size-${file.id}`}>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span data-testid={`file-status-${file.id}`}>
                        {getStatusText(file.status, file.wordCount)}
                      </span>
                    </div>
                    {(file.status === 'uploading' || file.status === 'processing') && (
                      <Progress value={file.progress} className="mt-1 h-1" />
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id, file.jobId)}
                  className="text-muted-foreground hover:text-foreground"
                  data-testid={`remove-file-${file.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* ChatGPT Export Info */}
        <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/20">
          <div className="flex items-center gap-2">
            <FileArchive className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              ChatGPT Export Support
            </span>
          </div>
          <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
            Upload your ChatGPT data export ZIP file (up to 1GB+). All conversations will be extracted and indexed for search.
          </p>
        </div>

        {/* RAG System Status */}
        <div className="p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-200/20">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-green-700 dark:text-green-300">
              RAG System Active
            </span>
          </div>
          <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
            Files persist across sessions and are available in all tabs
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
