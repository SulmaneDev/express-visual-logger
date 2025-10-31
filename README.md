# Express Visual Logger

A visual logging middleware for Express.js applications. It intercepts incoming requests, logs detailed request/response metadata (timestamp, method, URL, body/query/params, duration), and emits real-time events for UI consumption via Server-Sent Events (SSE). Includes a built-in dashboard for viewing logs in real-time.

## Features
- Global request interception and logging.
- Real-time updates to a web-based UI using SSE.
- Customizable static asset serving for the logger dashboard.
- Easy integration with any Express app.
- Supports TypeScript out of the box.

## Installation

Install the package via npm:

```bash
npm i express-visual-logger
```

## Usage

### Basic Setup

1. Import and initialize the logger in your Express app.
2. Use the middleware to log requests.
3. Set up the SSE stream route for real-time updates.
4. Access the dashboard at `/express-visual-logger`.

```typescript
import express from 'express';
import { Logger } from 'express-visual-logger';

const app = express();
const port = 3000;

// Enable body parsing (required for req.body logging)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize logger
const logger = new Logger(app);

// Apply logging middleware
app.use(logger.handler());

// Set up SSE stream for logs
app.get('/express-visual-logger/stream', logger.stream()); // Optional custom path

// Example route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Logger dashboard: http://localhost:${port}/express-visual-logger`);
});
```

### Dashboard Access
- Open your browser to `http://localhost:<port>/express-visual-logger`.
- The UI displays a table with columns: Timestamp, Method, URL, Body/Query, Duration.
- Logs update in real-time as requests are made.
- Includes a "Clear" button to reset the log table.

## Configuration

The logger is configurable via the constructor options (coming soon; currently uses defaults).

- **Static Path**: Defaults to `/express-visual-logger` for serving the dashboard assets.
- **SSE Path**: Use a custom path for the stream, e.g., `/logs`, by mounting `logger.stream()` accordingly.
- **Environment Variables**:
  - `PORT`: Custom server port (defaults to 3000 if not set).

For advanced customization, extend the `Logger` class or modify the emitted data in `LoggerCtx.emit()`.

## Examples

### Full Example with POST Request Logging

```typescript
import express from 'express';
import { Logger } from 'express-visual-logger';

const app = express();
app.use(express.json());

const logger = new Logger(app);
app.use(logger.handler());
app.get('/express-visual-logger/stream', logger.stream());

app.post('/api/data', (req, res) => {
  console.log('Received body:', req.body);
  res.json({ message: 'Data received' });
});

app.listen(3000);
```

- Send a POST request: `curl -X POST http://localhost:3000/api/data -H "Content-Type: application/json" -d '{"key": "value"}'`
- View logs in the dashboard.

### Integrating with Existing App

If your app already has routes, mount the logger middleware early in the stack to capture all requests.

```typescript
// ... existing app setup ...
app.use(logger.handler()); // Add before other routes
```

## Development

- **Build**: `npm run build`
- **Dev Mode**: `npm run dev` (watches for changes)

## Contributing

Contributions welcome! Fork the repo and submit a pull request.

## License

MIT License. See [LICENSE](LICENSE) for details.

Author: Muhammad Sulman (whomaderules@gmail.com)  
GitHub: [SulmaneDev](https://github.com/SulmaneDev)