import fs from 'fs';
import path from 'path';

export interface TextExtractionResult {
  text: string;
  wordCount: number;
  success: boolean;
  error?: string;
  fileType?: string;
  extractedBytes?: number;
  encoding?: string;
}

export class TextExtractor {
  // Comprehensive list of programming languages and file extensions
  static readonly SUPPORTED_EXTENSIONS = new Set([
    // Programming Languages
    '.js', '.jsx', '.ts', '.tsx', '.py', '.rb', '.php', '.java', '.c', '.cpp', '.cc', '.cxx', '.h', '.hpp',
    '.cs', '.go', '.rs', '.swift', '.kt', '.scala', '.clj', '.hs', '.ml', '.fs', '.vb', '.dart', '.lua',
    '.r', '.m', '.mm', '.pl', '.pm', '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd',
    '.f90', '.f95', '.f03', '.f08', '.for', '.ftn', '.jl', '.nim', '.zig', '.odin', '.v', '.crystal',
    '.elm', '.purs', '.reason', '.re', '.rei', '.ocaml', '.ml', '.mli', '.ex', '.exs', '.erl', '.hrl',
    
    // Web Technologies
    '.html', '.htm', '.xhtml', '.xml', '.svg', '.css', '.scss', '.sass', '.less', '.styl',
    '.vue', '.svelte', '.astro', '.md', '.mdx', '.rst', '.adoc', '.tex', '.latex',
    
    // Configuration & Data
    '.json', '.jsonl', '.json5', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.config',
    '.env', '.properties', '.plist', '.xml', '.rdf', '.owl', '.ttl', '.n3', '.nt', '.nq',
    
    // Documentation & Text
    '.txt', '.text', '.log', '.out', '.err', '.readme', '.license', '.changelog', '.authors',
    '.contributors', '.todo', '.fixme', '.notes', '.doc', '.docx', '.rtf',
    
    // Database & Query
    '.sql', '.mysql', '.psql', '.sqlite', '.cql', '.cypher', '.sparql', '.xquery', '.hql',
    
    // Build & Package
    '.dockerfile', '.containerfile', '.makefile', '.cmake', '.gradle', '.ant', '.maven', '.sbt',
    '.cargo', '.cabal', '.mix', '.rebar', '.stack', '.dub', '.nimble', '.rockspec',
    
    // Data Science & Analysis
    '.ipynb', '.rmd', '.qmd', '.jl', '.sage', '.maxima', '.octave', '.scilab', '.wl', '.nb',
    
    // DevOps & Infrastructure
    '.tf', '.tfvars', '.hcl', '.k8s', '.kube', '.helm', '.ansible', '.playbook', '.inventory',
    '.puppet', '.chef', '.salt', '.nix', '.nixos', '.guix', '.pkgbuild',
    
    // Graphics & Shaders
    '.glsl', '.hlsl', '.metal', '.cg', '.fx', '.shader', '.vert', '.frag', '.geom', '.comp',
    
    // Specialized
    '.asm', '.s', '.nasm', '.masm', '.gas', '.llvm', '.bc', '.wasm', '.wat',
    '.proto', '.thrift', '.avro', '.capnp', '.fbs', '.xsd', '.wsdl', '.graphql', '.gql'
  ]);

  static async extractText(filePath: string, mimeType: string): Promise<TextExtractionResult> {
    try {
      const fileStats = fs.statSync(filePath);
      const fileSize = fileStats.size;
      const fileName = path.basename(filePath);
      const fileExt = path.extname(filePath).toLowerCase();
      
      console.log(`Processing file: ${fileName} (${fileSize} bytes)`);

      // Read file with multiple encoding attempts for maximum compatibility
      let fileContent: Buffer;
      let extractedText = '';
      let encoding = 'utf-8';
      let success = true;

      try {
        fileContent = fs.readFileSync(filePath);
      } catch (error: any) {
        throw new Error(`Failed to read file: ${error.message}`);
      }

      // Detect if file is likely binary (contains null bytes in first 1KB)
      const sample = fileContent.slice(0, 1024);
      const isBinary = sample.includes(0);

      if (isBinary && !this.SUPPORTED_EXTENSIONS.has(fileExt)) {
        // For binary files not in our supported list, provide metadata only
        extractedText = `BINARY FILE ANALYSIS:\n` +
          `File: ${fileName}\n` +
          `Size: ${fileSize} bytes\n` +
          `Type: ${mimeType}\n` +
          `Extension: ${fileExt}\n` +
          `Binary data detected - file content not extracted but available for specialized processing.\n` +
          `To process this file type, please convert to a supported text format or use specialized tools.`;
      } else {
        // Try multiple encodings for text extraction
        const encodings = ['utf-8', 'latin1', 'ascii', 'utf16le'];
        
        for (const enc of encodings) {
          try {
            extractedText = fileContent.toString(enc as BufferEncoding);
            encoding = enc;
            
            // Check if encoding seems valid (no excessive control characters)
            const controlCharCount = (extractedText.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g) || []).length;
            const controlRatio = controlCharCount / extractedText.length;
            
            if (controlRatio < 0.1) { // Less than 10% control characters
              break;
            }
          } catch (encError) {
            if (enc === 'latin1') { // latin1 should always work
              throw encError;
            }
            continue;
          }
        }

        // Enhanced processing based on file type
        extractedText = this.processFileContent(extractedText, fileExt, mimeType, fileName);
      }

      // NO TRUNCATION - preserve all content regardless of size
      const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;

      console.log(`Extracted ${extractedText.length} characters, ${wordCount} words from ${fileName}`);

      return {
        text: extractedText,
        wordCount,
        success,
        fileType: fileExt,
        extractedBytes: extractedText.length,
        encoding
      };
    } catch (error: any) {
      console.error(`Text extraction failed for ${filePath}:`, error);
      return {
        text: `EXTRACTION FAILED for ${path.basename(filePath)}: ${error.message}`,
        wordCount: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fileType: path.extname(filePath).toLowerCase(),
        extractedBytes: 0
      };
    }
  }

  static processFileContent(content: string, fileExt: string, mimeType: string, fileName: string): string {
    // Add file metadata header
    let processedContent = `=== FILE: ${fileName} ===\n`;
    processedContent += `Type: ${fileExt} (${mimeType})\n`;
    processedContent += `Content Length: ${content.length} characters\n\n`;

    // Process based on file type
    if (fileExt === '.html' || fileExt === '.htm' || mimeType === 'text/html') {
      // Enhanced HTML processing - preserve more structure
      processedContent += content
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '\n[SCRIPT REMOVED]\n')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '\n[STYLE REMOVED]\n')
        .replace(/<(h[1-6])[^>]*>(.*?)<\/\1>/gi, '\n### $2 ###\n')
        .replace(/<(p|div|section|article)[^>]*>/gi, '\n')
        .replace(/<\/?(p|div|section|article)[^>]*>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n');
    } else if (fileExt === '.xml' || mimeType.includes('xml')) {
      // Enhanced XML processing
      processedContent += content
        .replace(/<!\[CDATA\[[\s\S]*?\]\]>/gi, (match) => match.slice(9, -3))
        .replace(/<!--[\s\S]*?-->/gi, '')
        .replace(/<([^>]+)>/g, '\n[$1]\n')
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n');
    } else if (fileExt === '.json' || fileExt === '.jsonl' || mimeType === 'application/json') {
      // Enhanced JSON processing with structure preservation
      try {
        const parsed = JSON.parse(content);
        processedContent += `JSON Structure Analysis:\n`;
        processedContent += this.analyzeJsonStructure(parsed, 0);
        processedContent += `\n\nRaw JSON Content:\n${content}`;
      } catch {
        processedContent += content; // If parsing fails, use raw content
      }
    } else if (this.SUPPORTED_EXTENSIONS.has(fileExt)) {
      // Programming files - add syntax awareness
      processedContent += `PROGRAMMING FILE (${fileExt}):\n\n`;
      processedContent += content;
    } else {
      // Regular text processing with enhanced cleanup
      processedContent += content
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, '  '); // Convert tabs to spaces for consistency
    }

    // Final cleanup but NO truncation
    return processedContent.trim();
  }

  static analyzeJsonStructure(obj: any, depth: number = 0): string {
    const indent = '  '.repeat(depth);
    let analysis = '';

    if (Array.isArray(obj)) {
      analysis += `${indent}Array (${obj.length} items)\n`;
      if (obj.length > 0) {
        analysis += this.analyzeJsonStructure(obj[0], depth + 1);
        if (obj.length > 1) {
          analysis += `${indent}  ... (${obj.length - 1} more items)\n`;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      const keys = Object.keys(obj);
      analysis += `${indent}Object (${keys.length} properties)\n`;
      for (const key of keys.slice(0, 10)) { // Show first 10 keys
        const value = obj[key];
        analysis += `${indent}  ${key}: ${typeof value}`;
        if (Array.isArray(value)) {
          analysis += ` (${value.length} items)`;
        } else if (typeof value === 'object' && value !== null) {
          analysis += ` (object)`;
        }
        analysis += '\n';
      }
      if (keys.length > 10) {
        analysis += `${indent}  ... (${keys.length - 10} more properties)\n`;
      }
    } else {
      analysis += `${indent}${typeof obj}: ${String(obj).substring(0, 100)}\n`;
    }

    return analysis;
  }

  static getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      // Text & Documentation
      '.txt': 'text/plain', '.text': 'text/plain', '.log': 'text/plain', '.out': 'text/plain',
      '.md': 'text/markdown', '.mdx': 'text/markdown', '.rst': 'text/x-rst', '.adoc': 'text/asciidoc',
      '.tex': 'application/x-tex', '.latex': 'application/x-latex',
      
      // Programming Languages
      '.js': 'application/javascript', '.jsx': 'application/javascript', '.mjs': 'application/javascript',
      '.ts': 'application/typescript', '.tsx': 'application/typescript',
      '.py': 'text/x-python', '.pyw': 'text/x-python', '.pyi': 'text/x-python',
      '.rb': 'text/x-ruby', '.rbw': 'text/x-ruby', '.rake': 'text/x-ruby',
      '.php': 'application/x-php', '.php3': 'application/x-php', '.php4': 'application/x-php',
      '.java': 'text/x-java', '.class': 'application/java-vm',
      '.c': 'text/x-c', '.cpp': 'text/x-c++', '.cc': 'text/x-c++', '.cxx': 'text/x-c++',
      '.h': 'text/x-c', '.hpp': 'text/x-c++', '.hxx': 'text/x-c++',
      '.cs': 'text/x-csharp', '.vb': 'text/x-vb',
      '.go': 'text/x-go', '.rs': 'text/x-rust',
      '.swift': 'text/x-swift', '.kt': 'text/x-kotlin',
      '.scala': 'text/x-scala', '.clj': 'text/x-clojure', '.cljs': 'text/x-clojure',
      '.hs': 'text/x-haskell', '.ml': 'text/x-ocaml', '.fs': 'text/x-fsharp',
      '.dart': 'application/dart', '.lua': 'text/x-lua',
      '.r': 'text/x-r', '.R': 'text/x-r',
      '.m': 'text/x-matlab', '.mm': 'text/x-objc',
      '.pl': 'text/x-perl', '.pm': 'text/x-perl',
      '.sh': 'application/x-sh', '.bash': 'application/x-sh', '.zsh': 'application/x-sh',
      '.ps1': 'application/x-powershell', '.bat': 'application/x-bat', '.cmd': 'application/x-bat',
      '.f90': 'text/x-fortran', '.f95': 'text/x-fortran', '.for': 'text/x-fortran',
      '.jl': 'text/x-julia', '.nim': 'text/x-nim', '.zig': 'text/x-zig',
      '.elm': 'text/x-elm', '.ex': 'text/x-elixir', '.exs': 'text/x-elixir',
      '.erl': 'text/x-erlang', '.hrl': 'text/x-erlang',
      
      // Web Technologies
      '.html': 'text/html', '.htm': 'text/html', '.xhtml': 'application/xhtml+xml',
      '.xml': 'application/xml', '.xsl': 'application/xslt+xml', '.xsd': 'application/xml',
      '.svg': 'image/svg+xml', '.css': 'text/css', '.scss': 'text/x-scss', '.sass': 'text/x-sass',
      '.less': 'text/x-less', '.styl': 'text/x-stylus',
      '.vue': 'text/x-vue', '.svelte': 'text/x-svelte', '.astro': 'text/x-astro',
      
      // Configuration & Data
      '.json': 'application/json', '.jsonl': 'application/jsonl', '.json5': 'application/json5',
      '.yaml': 'text/yaml', '.yml': 'text/yaml',
      '.toml': 'application/toml', '.ini': 'text/plain', '.cfg': 'text/plain',
      '.conf': 'text/plain', '.config': 'text/plain', '.env': 'text/plain',
      '.properties': 'text/x-properties', '.plist': 'application/x-plist',
      '.csv': 'text/csv', '.tsv': 'text/tab-separated-values',
      
      // Database & Query
      '.sql': 'application/sql', '.mysql': 'application/sql', '.psql': 'application/sql',
      '.sqlite': 'application/x-sqlite3', '.cql': 'text/x-cassandra',
      '.cypher': 'text/x-cypher', '.sparql': 'application/sparql-query',
      '.xquery': 'application/xquery', '.hql': 'text/x-hive',
      
      // Build & Package
      '.dockerfile': 'text/x-dockerfile', '.containerfile': 'text/x-dockerfile',
      '.makefile': 'text/x-makefile', '.cmake': 'text/x-cmake',
      '.gradle': 'text/x-gradle', '.sbt': 'text/x-sbt',
      '.cargo': 'text/x-cargo', '.cabal': 'text/x-cabal',
      
      // DevOps & Infrastructure
      '.tf': 'text/x-terraform', '.tfvars': 'text/x-terraform',
      '.hcl': 'text/x-hcl', '.nomad': 'text/x-nomad',
      '.ansible': 'text/x-ansible', '.playbook': 'text/x-ansible',
      '.puppet': 'text/x-puppet', '.chef': 'text/x-chef',
      '.nix': 'text/x-nix', '.nixos': 'text/x-nix',
      
      // Graphics & Shaders
      '.glsl': 'text/x-glsl', '.hlsl': 'text/x-hlsl', '.metal': 'text/x-metal',
      '.shader': 'text/x-shader', '.vert': 'text/x-glsl', '.frag': 'text/x-glsl',
      
      // Specialized
      '.asm': 'text/x-assembly', '.s': 'text/x-assembly',
      '.proto': 'text/x-protobuf', '.thrift': 'text/x-thrift',
      '.graphql': 'application/graphql', '.gql': 'application/graphql',
      '.wasm': 'application/wasm', '.wat': 'text/x-webassembly',
      
      // Data Science
      '.ipynb': 'application/x-ipynb+json', '.rmd': 'text/x-r-markdown',
      '.qmd': 'text/x-quarto', '.sage': 'text/x-sage',
      
      // Archives (for detection, not extraction yet)
      '.zip': 'application/zip', '.tar': 'application/x-tar',
      '.gz': 'application/gzip', '.7z': 'application/x-7z-compressed',
      '.rar': 'application/vnd.rar', '.bz2': 'application/x-bzip2'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}