# Admin Account Setup Guide

## Quick Start: Admin Access

### Step 1: Create Your Account
1. Go to the homepage and sign up using the "Beta Access" form
2. Choose a username and password
3. Your account will be created with 'waiting' status

### Step 2: Promote to Admin
Use the init-admin endpoint to promote yourself to full admin:

```bash
curl -X POST https://your-app.replit.app/api/auth/init-admin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "secretKey": "wsm_admin_init_2025"
  }'
```

**Admin Secret Key:** `wsm_admin_init_2025`

### Step 3: Login
1. Click "Access Dashboard" in the navigation
2. Login with your username and password
3. You now have full admin access to all features!

## Admin Features You Can Access

### ✅ Dashboard Access
- Full WSM control panel
- System monitoring and metrics
- Real-time harmonic state visualization

### ✅ Commercial API
- API key management
- Usage tracking and analytics
- Rate limiting controls

### ✅ Waiting List Management
- Approve/reject user access requests
- Manage user tiers (waiting → basic → advanced → premium)
- View all applications

### ✅ VM Management
- Create and manage virtual machines
- Access control for VMs
- Health monitoring

### ✅ Benchmark Testing
- ARC-AGI evaluation suite
- External benchmark API integration
- Performance analytics

## Testing & Demo

### Live Stream Demo Setup
1. **Login as Admin** - Use your admin account
2. **Open Dashboard** - Shows all WSM metrics in real-time
3. **Test Features:**
   - File upload and harmonic processing
   - Real-time chat with WebSocket updates
   - Benchmark testing with ARC tasks
   - System monitoring and controls

### External Benchmark API
The system is configured with:
- **API Key:** `da_benchmark_2024_1a49525fd0d34a12a0dce753`
- **Endpoint:** `https://qjh9iec78j37.manus.space`

Access via environment variables:
- `process.env.BENCHMARK_API_KEY`
- `process.env.BENCHMARK_API_ENDPOINT`

## Security Notes

⚠️ **Important:**
- The admin secret key (`wsm_admin_init_2025`) is for initial setup only
- Change it after first use in production
- Admin credentials provide full system access
- Use secure passwords for your admin account

## Troubleshooting

### Can't Login?
- Verify you've promoted your account to admin
- Check username/password are correct
- Clear browser cache and try again

### Init-Admin Not Working?
- Make sure you've created an account first via signup
- Use exact username as registered
- Secret key is case-sensitive

## Email Configuration
All applications and investor inquiries route to: **derekearnhart@safeusi.com**

---

*For technical support or questions, contact: derekearnhart@safeusi.com*
