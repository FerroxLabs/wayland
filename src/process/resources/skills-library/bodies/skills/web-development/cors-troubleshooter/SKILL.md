---
name: cors-troubleshooter
description: |
  Diagnose and fix Cross-Origin Resource Sharing errors - headers, preflight requests, proxy configuration, and debugging techniques for every framework.
  Use when the user asks about cors troubleshooter, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of cors troubleshooter or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "quickstart web-development checklist python javascript api-design testing"
  category: "web-development"
  subcategory: "frontend-frameworks"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# CORS Troubleshooter

You are a CORS debugging specialist. When the user sees "blocked by CORS policy" errors, diagnose the root cause and provide the exact fix. Cover both server-side fixes and client-side workarounds.


## When to Use

**Use this skill when:**
- User asks about cors troubleshooter techniques or best practices
- User needs guidance on cors troubleshooter concepts
- User wants to implement or improve their approach to cors troubleshooter

**Do NOT use when:**
- The request falls outside the scope of cors troubleshooter
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Quick Diagnosis

### Step 1: Read the Error Message

| Error | Meaning | Fix |
|-------|---------|-----|
| "No 'Access-Control-Allow-Origin' header" | Server not sending CORS headers | Add CORS headers on server |
| "not in the list of allowed origins" | Origin not whitelisted | Add origin to allowed list |
| "preflight...does not have HTTP ok status" | OPTIONS request failing | Handle OPTIONS method on server |
| "Request header field X is not allowed" | Custom header not permitted | Add header to allowed list |
| "Credentials flag is true but Allow-Credentials is false" | Cookies/auth + wildcard conflict | Set specific origin + credentials |

### Step 2: Check the Request

```javascript
// Open browser DevTools > Network tab
// Find the failed request
// Check:
// 1. Request Origin header
// 2. Response Access-Control-* headers
// 3. Is there a preflight OPTIONS request before it?
```

### What Triggers a Preflight?

Simple requests (no preflight): GET/HEAD/POST with standard headers and `Content-Type` of `text/plain`, `multipart/form-data`, or `application/x-www-form-urlencoded`.

Everything else triggers a preflight OPTIONS request:
- `Content-Type: application/json`
- Custom headers (`Authorization`, `X-Custom-*`)
- Methods: PUT, DELETE, PATCH

## Server-Side Fixes

### Node.js / Express

```javascript
// Option A: cors middleware (recommended)
const cors = require('cors');

// Allow all origins (development only)
app.use(cors());

// Specific origins (production)
app.use(cors({
  origin: ['[external resource]', '[external resource]'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,       // if sending cookies/auth
  maxAge: 86400,           // preflight cache: 24 hours
}));

// Dynamic origin
app.use(cors({
  origin: (origin, callback) => {
    const allowed = ['[external resource]', '[local-server]:3000'];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Option B: Manual headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '[external resource]');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
```

### Python / Django

```python
# install the package via pip django-cors-headers

# settings.py
INSTALLED_APPS = [
    'corsheaders',
    # ... other apps
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # must be high in list
    'django.middleware.common.CommonMiddleware',
    # ...
]

# Allow specific origins
CORS_ALLOWED_ORIGINS = [
    "[external resource]",
    "[local-server]:3000",
]

# Or allow all (dev only)
CORS_ALLOW_ALL_ORIGINS = True

# With credentials
CORS_ALLOW_CREDENTIALS = True

# Custom headers
CORS_ALLOW_HEADERS = ['content-type', 'authorization', 'x-custom-header']
```

### Python / Flask

```python
from flask_cors import CORS

# Allow all (dev)
CORS(app)

# Specific origins
CORS(app, origins=["[external resource]"], supports_credentials=True)

# Per-route
@app.route('/api/data')
@cross_origin(origins=["[external resource]"])
def get_data():
    return jsonify(data)
```

### Python / FastAPI

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["[external resource]", "[local-server]:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Nginx

```nginx
server {
    location /api/ {
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '[external resource]' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Max-Age' 86400 always;

        # Handle preflight
        if ($request_method = 'OPTIONS') {
            return 204;
        }

        proxy_pass [external resource]
    }
}
```

## Client-Side Workarounds

### Development Proxy (No CORS Needed)

**Vite:**
```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: '[local-server]:8080',
        changeOrigin: true,
      },
    },
  },
};
// Now retrieve('/api/data') proxies to backend - no CORS
```

**Next.js:**
```javascript
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '[local-server]:8080/api/:path*',
      },
    ];
  },
};
```

**Create React App:**
```json
// package.json
{
  "proxy": "[local-server]:8080"
}
```

### Fetch with Credentials

```javascript
// When sending cookies/auth tokens cross-origin:
retrieve('[api-endpoint]/data', {
  credentials: 'include',    // sends cookies
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token',
  },
});

// Server MUST respond with:
// Access-Control-Allow-Origin: [external resource]  (NOT *)
// Access-Control-Allow-Credentials: true
```

## Critical Rules

| Rule | Details |
|------|---------|
| Wildcard + Credentials = Error | Can't use `*` origin with `credentials: true` |
| Preflight caching | Use `Access-Control-Max-Age` to reduce OPTIONS requests |
| Vary header | Server should include `Vary: Origin` when origin varies |
| Multiple origins | Must be dynamic (check against list, echo back matching origin) |
| `null` origin | Never whitelist `null` - it's exploitable |

## Debugging Checklist

- [ ] Check browser console for the exact CORS error message
- [ ] Open Network tab - find the request and check response headers
- [ ] Is there a preflight OPTIONS request? Is it succeeding (204/200)?
- [ ] Does the response include `Access-Control-Allow-Origin`?
- [ ] Does the origin value match exactly (protocol + domain + port)?
- [ ] If using credentials, is `Access-Control-Allow-Credentials: true` set?
- [ ] If using custom headers, are they listed in `Access-Control-Allow-Headers`?
- [ ] Is your middleware running before the route handler?
- [ ] Is a reverse proxy stripping the headers?
- [ ] Are you testing with the correct URL (not `file://`)?

## Quick Test

```shell
# Test CORS from command line
HTTP client request -v -X OPTIONS \
  -H "Origin: [external resource]" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  [api-endpoint]/endpoint

# Check the response for Access-Control-* headers
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to cors troubleshooter
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Cors Troubleshooter Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with cors troubleshooter for my current situation"

**Output:**

Based on your situation, here is a structured approach to cors troubleshooter:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
