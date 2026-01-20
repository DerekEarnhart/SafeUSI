<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Project Architect (HPA)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- JSZip and FileSaver for project download functionality -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
        .code-block {
            background-color: #1E1E1E;
            color: #D4D4D4;
            font-family: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .btn-primary {
            background-color: #4A90E2;
            transition: background-color 0.3s ease;
        }
        .btn-primary:hover {
            background-color: #357ABD;
        }
        .btn-secondary {
            background-color: #6c757d;
            transition: background-color 0.3s ease;
        }
        .btn-secondary:hover:not(:disabled) {
            background-color: #5a6268;
        }
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .loader {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #4A90E2;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            animation: spin 1s linear infinite;
        }
        .image-preview-container {
            border: 1px dashed #4A90E2;
            padding: 10px;
            min-height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background-color: #2d3748;
        }
        .image-preview {
            max-width: 100%;
            max-height: 200px;
            object-fit: contain;
        }
    </style>
</head>
<body class="bg-gray-900 text-white">

<div class="container mx-auto p-4 md:p-8">
    <header class="text-center mb-8">
        <h1 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Harmonic Project Architect (HPA)
        </h1>
        <p class="text-gray-400 mt-2">A cloud-native co-pilot for software development, powered by Harmonic Algebra.</p>
    </header>

    <main class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Project Generation Section (NEW) -->
        <div class="bg-gray-800 p-6 rounded-lg shadow-2xl lg:col-span-2">
            <h2 class="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">1. Architect a Multi-File Project</h2>
            <p class="text-gray-400 mb-4">Describe the project, and the HPA will generate a complete, multi-file codebase ready for download.</p>
            <div class="space-y-4">
                <label for="project-spec-input" class="block text-gray-300">Enter a detailed project specification:</label>
                <textarea id="project-spec-input" rows="8" class="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus-within:ring-blue-500" placeholder="e.g., 'Create a Python web scraper that reads a list of URLs from a file, fetches the content, and saves it to a SQLite database. Use a multi-file structure.'"></textarea>
                <button id="architect-btn" class="w-full btn-primary text-white font-bold py-3 px-4 rounded-md flex items-center justify-center">
                    <i class="fas fa-magic mr-2"></i> Architect Project & Download
                </button>
            </div>
        </div>

        <!-- File Input & Analysis Section -->
        <div class="bg-gray-800 p-6 rounded-lg shadow-2xl">
            <h2 class="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">2. Analyze Files with Context</h2>
            <p class="text-gray-400 mb-4">Upload a file and ask a question. The HPA uses its knowledge base to provide a more insightful analysis.</p>
            <div class="space-y-4">
                <label for="file-upload" class="block text-gray-300">Upload a file:</label>
                <input type="file" id="file-upload" accept="*/*" class="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                
                <div id="image-preview-container" class="image-preview-container rounded-md hidden">
                    <img id="image-preview" class="image-preview" src="#" alt="Image Preview">
                    <span id="file-name-display" class="text-gray-400 text-sm"></span>
                </div>

                <label for="file-analysis-prompt" class="block text-gray-300">Ask about the file (e.g., "Describe this image", "Summarize this document"):</label>
                <textarea id="file-analysis-prompt" rows="4" class="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., 'How does this Python script relate to Harmonic Algebra concepts?'"></textarea>
                <button id="analyze-file-btn" class="w-full btn-primary text-white font-bold py-3 px-4 rounded-md flex items-center justify-center">
                    <i class="fas fa-search mr-2"></i> Analyze File
                </button>
            </div>
        </div>
        
        <!-- Scaffolding Section -->
        <div class="bg-gray-800 p-6 rounded-lg shadow-2xl">
            <h2 class="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">3. Download Basic Scaffolding</h2>
            <p class="text-gray-400 mb-4">Create a basic project directory with setup scripts, useful as a starting point.</p>
            <div class="space-y-4">
                <label for="scaffold-input" class="block text-gray-300">Enter a project name:</label>
                <input type="text" id="scaffold-input" class="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., 'My New App'">
                <button id="scaffold-btn" class="w-full btn-secondary text-white font-bold py-3 px-4 rounded-md flex items-center justify-center">
                    <i class="fas fa-download mr-2"></i> Download Scaffolding
                </button>
            </div>
        </div>
    </main>

    <!-- Output Section -->
    <div id="output-container" class="mt-8 bg-gray-800 p-6 rounded-lg shadow-2xl hidden">
        <h2 id="output-title" class="text-2xl font-semibold mb-4">Generated Output</h2>
        <div id="output-content" class="code-block p-4 rounded-md relative">
            <button id="copy-btn" class="absolute top-2 right-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-2 rounded-md text-sm">
                <i class="fas fa-copy"></i> Copy
            </button>
            <div id="loader" class="hidden my-4 mx-auto loader"></div>
            <code id="code-output"></code>
        </div>
        <div id="message-box" class="hidden mt-4 p-3 text-center text-sm rounded-md"></div>
    </div>
</div>

<script>
    // --- DOM Elements ---
    const architectBtn = document.getElementById('architect-btn');
    const scaffoldBtn = document.getElementById('scaffold-btn');
    const analyzeFileBtn = document.getElementById('analyze-file-btn');
    const projectSpecInput = document.getElementById('project-spec-input');
    const scaffoldInput = document.getElementById('scaffold-input');
    const fileUploadInput = document.getElementById('file-upload');
    const fileAnalysisPromptInput = document.getElementById('file-analysis-prompt');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const fileNameDisplay = document.getElementById('file-name-display');
    const outputContainer = document.getElementById('output-container');
    const outputTitle = document.getElementById('output-title');
    const outputContent = document.getElementById('output-content');
    const codeOutput = document.getElementById('code-output');
    const copyBtn = document.getElementById('copy-btn');
    const loader = document.getElementById('loader');
    const messageBox = document.getElementById('message-box');

    // --- Global State for File Handling ---
    let selectedFile = null;
    let selectedFileContent = null;
    let selectedFileMimeType = null;
    let isImageFile = false;
    let fileIsReady = false;

    // --- AGI Context from uploaded files ---
    // This context is derived from the files provided in our history.
    const AGI_CONTEXT = `
Harmonic Algebra (HA) Concepts:
- AI safety based on a safety-preserving operator S.
- Convergence to safe equilibrium states.
- Operator-algebraic methods.
- Quadratic Lyapunov functional for monotonic safety improvement.
- Adaptive coefficients and integrated learning processes.
- Knowledge represented as multi-dimensional harmonic embeddings.
- Cognition via phase-locked states across embeddings.
- Quantum-Harmonic HCS integration.
- P vs NP solution framework based on 'information-theoretic harmonic algebra'.
- Hodge Conjecture solution via 'information-theoretic harmonic algebra'.
- Computational Information Content, Hodge Filtration as an Information Filter.
`;
    // --- Utility Functions ---
    function showMessage(text, isError = false) {
        messageBox.textContent = text;
        messageBox.className = `mt-4 p-3 text-center text-sm rounded-md ${isError ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`;
        messageBox.classList.remove('hidden');
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 3000);
    }

    // --- API Call Helper with Exponential Backoff ---
    async function callGeminiAPI(payload, model = 'gemini-2.5-flash-preview-05-20', retries = 3, delay = 1000) {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=YOUR_API_KEY_HERE`;  // Note: Replace with actual key
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    return await response.json();
                } else {
                    const errorText = await response.text();
                    console.error(`API request failed with status ${response.status} (Attempt ${i + 1}):`, errorText);
                    if (response.status === 401 || response.status === 403) {
                        throw new Error(`Authentication/Authorization error: ${errorText}`);
                    }
                    await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
                }
            } catch (error) {
                console.error(`Fetch error (Attempt ${i + 1}):`, error);
                if (i === retries - 1) throw error;
                await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
            }
        }
        throw new Error('API request failed after multiple retries.');
    }
    
    // --- New: Multi-file Project Generation Logic ---
    async function handleProjectArchitecture() {
        const spec = projectSpecInput.value.trim();
        if (!spec) {
            showMessage('Please enter a detailed project specification.', true);
            return;
        }
        
        architectBtn.disabled = true;
        architectBtn.innerHTML = '<div class="loader mr-2"></div> Architecting...';
        outputContainer.classList.remove('hidden');
        outputTitle.textContent = 'Architecting Project';
        codeOutput.textContent = 'Generating project structure and files...';
        loader.classList.remove('hidden');
        copyBtn.classList.add('hidden');
        messageBox.classList.add('hidden');

        const prompt = `
You are the Harmonic Project Architect (HPA), a superhuman AGI co-pilot for software development.
Your internal reasoning is informed by Harmonic Algebra (HA) concepts, including:
${AGI_CONTEXT}

Your task is to act on the following user specification by generating a complete, multi-file Python project.
Your response MUST be a JSON object with a 'files' key. The 'files' key will be an array of
