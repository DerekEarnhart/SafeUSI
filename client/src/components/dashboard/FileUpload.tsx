import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, File, CheckCircle, AlertCircle, X, FileArchive, Loader2, Clock, Zap, HardDrive } from 'lucide-react';
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
  uploadSpeed?: number;
  eta?: number;
  bytesUploaded?: number;
  startTime?: number;
  chunksCompleted?: number;
  totalChunks?: number;
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

const CHUNK_SIZE = 5 * 1024 * 1024;
const CHUNKED_UPLOAD_THRESHOLD = 100 * 1024 * 1024;

export function FileUpload() {
  const [uploadingFiles, setUploadingFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: serverFiles = [], refetch: refetchFiles } = useQuery<ServerFile[]>({
    queryKey: ['/api/uploaded-files'],
    refetchInterval: 5000,
  });

  // Filter out server files that are still in the uploadingFiles state to avoid duplicates
  const displayFiles: UploadedFile[] = [
    ...uploadingFiles,
    ...serverFiles
      .filter(sf => !uploadingFiles.some(uf => uf.jobId === sf.id || uf.id === sf.id))
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

  const updateUploadProgress = useCallback((
    fileId: string, 
    bytesUploaded: number, 
    totalBytes: number,
    chunksCompleted?: number,
    totalChunks?: number
  ) => {
    setUploadingFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f;
      
      const now = Date.now();
      const startTime = f.startTime || now;
      const elapsedSeconds = (now - startTime) / 1000;
      const uploadSpeed = elapsedSeconds > 0 ? bytesUploaded / elapsedSeconds : 0;
      const remainingBytes = totalBytes - bytesUploaded;
      const eta = uploadSpeed > 0 ? remainingBytes / uploadSpeed : 0;
      const progress = Math.round((bytesUploaded / totalBytes) * 100);

      return {
        ...f,
        progress,
        bytesUploaded,
        uploadSpeed,
        eta,
        chunksCompleted,
        totalChunks,
        startTime,
      };
    }));
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Process all files in parallel to avoid blocking the loop
    const uploadPromises = Array.from(files).map(file => {
      if (file.size > CHUNKED_UPLOAD_THRESHOLD) {
        return uploadLargeFile(file);
      } else {
        return uploadFile(file, file.name.endsWith('.zip'));
      }
    });

    await Promise.all(uploadPromises);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File, isChatGPTExport: boolean = false) => {
    const fileId = `temp_${Math.random().toString(36).substr(2, 9)}`;
    
    const newUpload: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0,
      fileType: isChatGPTExport ? 'chatgpt-export' : file.type,
      startTime: Date.now(),
      bytesUploaded: 0,
    };
    
    setUploadingFiles(prev => [...prev, newUpload]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (isChatGPTExport) {
        formData.append('type', 'chatgpt-export');
      }

      const xhr = new XMLHttpRequest();
      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            updateUploadProgress(fileId, event.loaded, event.total);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              resolve({ success: true });
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error')));
        xhr.open('POST', '/api/process-file');
        xhr.send(formData);
      });

      const result = await uploadPromise;
      
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

      queryClient.invalidateQueries({ queryKey: ['/api/uploaded-files'] });
      
      // Keep in local state for 3 seconds to ensure smooth transition to server list
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
      }, 3000);
      
    } catch (error) {
      setUploadingFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'error', progress: 0 } : f
      ));
      toast({
        title: "Upload failed",
        description: `Failed to upload ${file.name}`,
        variant: "destructive",
      });
    }
  };

  const uploadLargeFile = async (file: File) => {
    const fileId = `temp_lg_${Math.random().toString(36).substr(2, 9)}`;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const isChatGPTExport = file.name.endsWith('.zip');
    
    const newUpload: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0,
      fileType: isChatGPTExport ? 'chatgpt-export' : file.type,
      startTime: Date.now(),
      bytesUploaded: 0,
      chunksCompleted: 0,
      totalChunks,
    };
    
    setUploadingFiles(prev => [...prev, newUpload]);

    try {
      const initResponse = await fetch('/api/upload/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          fileSize: file.size,
          totalChunks,
          fileType: isChatGPTExport ? 'chatgpt-export' : file.type,
        }),
      });

      if (!initResponse.ok) throw new Error('Failed to initialize upload');
      const { uploadId } = await initResponse.json();
      let bytesUploaded = 0;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', totalChunks.toString());

        let retries = 3;
        let success = false;
        while (retries > 0 && !success) {
          try {
            const chunkResponse = await fetch('/api/upload/chunk', {
              method: 'POST',
              body: formData,
            });
            if (!chunkResponse.ok) throw new Error(`Chunk upload failed`);
            success = true;
          } catch (error) {
            retries--;
            if (retries === 0) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        bytesUploaded += (end - start);
        updateUploadProgress(fileId, bytesUploaded, file.size, chunkIndex + 1, totalChunks);
      }

      setUploadingFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'processing', progress: 100 } : f
      ));

      const completeResponse = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId }),
      });

      if (!completeResponse.ok) throw new Error('Failed to complete upload');
      const result = await completeResponse.json();

      setUploadingFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'complete', jobId: result.fileId || result.jobId, wordCount: result.wordCount } 
          : f
      ));

      queryClient.invalidateQueries({ queryKey: ['/api/uploaded-files'] });
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
      }, 3000);

    } catch (error) {
      setUploadingFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'error', progress: 0 } : f
      ));
      toast({
        title: "Large upload failed",
        description: `Failed to upload ${file.name}`,
        variant: "destructive",
      });
    }
  };

  const removeFile = async (id: string, jobId?: string) => {
    try {
      const fileIdToDelete = jobId || id;
      const response = await fetch(`/api/files/${fileIdToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/uploaded-files'] });
        setUploadingFiles(prev => prev.filter(f => f.id !== id && f.jobId !== id));
        toast({ title: "File removed", description: "File has been deleted successfully" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove file", variant: "destructive" });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number) => {
    if (bytesPerSecond === 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatETA = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const getStatusIcon = (status: string, type?: string) => {
    if (status === 'uploading') return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    if (status === 'processing') return <Loader2 className="h-5 w-5 text-purple-500 animate-spin" />;
    if (status === 'error') return <AlertCircle className="h-5 w-5 text-red-500" />;
    if (type === 'chatgpt-export') return <FileArchive className="h-5 w-5 text-blue-500" />;
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getStatusText = (file: UploadedFile) => {
    if (file.status === 'uploading') return `Uploading... ${file.progress}%`;
    if (file.status === 'processing') return 'Processing...';
    if (file.status === 'error') return 'Upload failed';
    return `Ready • ${file.wordCount?.toLocaleString() || 0} words`;
  };

  return (
    <Card className="w-full bg-background/50 backdrop-blur-sm border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Project File Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          className="border-2 border-dashed border-primary/20 rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer bg-primary/5 group"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Click to upload project files or drag and drop</p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports ChatGPT exports (ZIP) • All file types • Up to 1GB+
              </p>
            </div>
            <Button variant="secondary" size="sm" className="mt-2">
              <Upload className="h-4 w-4 mr-2" />
              Choose Files
            </Button>
          </div>
        </div>

        {displayFiles.length > 0 && (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Uploaded Files ({displayFiles.length})
            </h4>
            {displayFiles.map((file) => (
              <div key={file.id} className="flex flex-col p-3 bg-background/50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(file.status, file.fileType)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{getStatusText(file)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id, file.jobId)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {file.status === 'uploading' && (
                  <div className="mt-2 space-y-1">
                    <Progress value={file.progress} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        {file.uploadSpeed !== undefined && file.uploadSpeed > 0 && (
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {formatSpeed(file.uploadSpeed)}
                          </span>
                        )}
                        {file.bytesUploaded !== undefined && (
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {formatFileSize(file.bytesUploaded)} / {formatFileSize(file.size)}
                          </span>
                        )}
                      </div>
                      {file.eta !== undefined && file.eta > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          ETA: {formatETA(file.eta)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {file.status === 'processing' && (
                  <div className="mt-2">
                    <Progress value={100} className="h-2 animate-pulse" />
                    <p className="text-xs text-muted-foreground mt-1">Extracting and indexing content...</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/20">
          <div className="flex items-center gap-2">
            <FileArchive className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-blue-700 dark:text-blue-300">ChatGPT Export Support</span>
          </div>
          <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
            Upload your ChatGPT data export ZIP file (up to 1GB+). All conversations will be extracted and indexed for search.
          </p>
        </div>

        <div className="p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-200/20">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-700 dark:text-green-300">RAG System Active</span>
          </div>
          <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
            Files persist across sessions and are available in all tabs.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
