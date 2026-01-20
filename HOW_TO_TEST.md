# Complete Application Testing Guide

## 🚀 Quick Start Testing Steps

### 1. **Test File Upload + RAG System (MVP Core)**
This is your main working feature:

**Upload a file:**
```bash
curl -X POST http://localhost:5000/api/process-file -F "file=@package.json"
```
Expected response: `{"jobId":"...", "status":"completed", "fileId":"...", "filename":"package.json"}`

**Query your uploaded files:**
```bash
curl -X POST http://localhost:5000/api/files/query \
  -H "Content-Type: application/json" \
  -d '{"question":"What dependencies are in this project?","userId":"anonymous"}'
```

**Check uploaded files:**
```bash
curl -X GET http://localhost:5000/api/uploaded-files
```

### 2. **Test VM System**

**Provision a VM:**
```bash
curl -X POST http://localhost:5000/api/vms/provision \
  -H "Content-Type: application/json" \
  -d '{"agentType":"lightweight","agentCount":1,"name":"my-workspace","type":"shared","cpu":2,"memory":2048}'
```

**Check VM status:**
```bash
curl -X GET http://localhost:5000/api/vms
```

**Monitor VM health:**
- The logs show VM monitoring every 15 seconds
- Look for: `[VM Monitor] Checking health of X VMs (X total)`

### 3. **Test Frontend Interface**

**Via Browser:**
1. Navigate to: `http://localhost:5000`
2. Go to the dashboard (main page)
3. Scroll down to find "Project File Upload" section
4. Try uploading a file using the interface
5. Use the "Ask about your files" chat interface

### 4. **Test WSM (Weyl State Machine) Features**

**Execute WSM code:**
```bash
curl -X POST http://localhost:5000/api/programming/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"print(\"Hello WSM!\")"}'
```

**Get WSM metrics:**
```bash
curl -X GET http://localhost:5000/api/wsm/metrics
```

## 🧪 What Each System Does

### **File Upload + RAG (✅ WORKING)**
- **Purpose**: Upload project files and ask questions about them
- **How it works**: Files are stored on disk, text is extracted, you can query content
- **Test success**: Files upload in ~1ms, text extraction works, queries return answers

### **VM System (🔄 CUSTOM)**
- **Purpose**: Provision virtual machines for isolated workspaces
- **How it works**: Creates VM instances with endpoints, SSH access, health monitoring
- **Test success**: VM shows "active" status, gets endpoint URL like `https://workspace-xxx.replit.app`

### **WSM Engine (⚡ ADVANCED)**
- **Purpose**: Quantum-inspired computation with harmonic algebra
- **How it works**: Python bridge processes requests, generates harmonic states
- **Test success**: Returns coherence metrics, processes harmonic calculations

### **Real-time Monitoring (📊 LIVE)**
- **Purpose**: WebSocket updates for live system status
- **How it works**: Browser receives live updates every 2 seconds
- **Test success**: Dashboard shows live metrics, coherence scores, VM status

## 🔍 Troubleshooting

### **VMs Not Working?**
- Check logs: `[VM Monitor] Checking health of 0 VMs` means no VMs
- Provision new VM: Use the provision command above
- Wait 10-15 seconds for VM to become "active"

### **File Upload Not Working?**
- Check if file actually uploaded: `curl -X GET http://localhost:5000/api/uploaded-files`
- Try smaller files first (under 10MB)
- Check console for error messages

### **WSM Errors?**
- Look for Python errors in logs
- WSM system sometimes has timeout issues (30s timeout)
- File compression errors are bypassed in the new system

### **Frontend Issues?**
- Check browser console for JavaScript errors
- Ensure WebSocket connection (should see live metrics updating)
- Try refreshing the page

## 🎯 Success Indicators

**✅ Everything Working:**
- File uploads return success in ~1ms
- VMs show "active" status with endpoint URLs
- Dashboard shows live updating metrics
- RAG queries return relevant answers
- WebSocket shows real-time data

**🔴 Common Issues:**
- "0 VMs total" → No VMs provisioned
- "Compression failed" → Old error, should be fixed
- "Authentication required" → Some admin features need auth
- Timeout errors → WSM system overloaded

## 🚀 Quick Health Check

Run this single command to test everything:
```bash
# Test core functionality
curl -X POST http://localhost:5000/api/process-file -F "file=@package.json" && \
curl -X GET http://localhost:5000/api/vms && \
curl -X GET http://localhost:5000/api/uploaded-files
```

If all return successful responses, your system is working correctly!