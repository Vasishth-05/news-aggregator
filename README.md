# News Aggregator API

A Node.js and Express API for user accounts, news preferences, and personalized news. User data is stored in MongoDB. News searches use the NewsCatcher API, with results cached in memory for five minutes.

## Requirements

- Node.js 18 or newer
- MongoDB connection string
- NewsCatcher API token

## Setup

Install dependencies and create a `.env` file in the project root:

```sh
npm install
```

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/news-aggregator
JWT_SECRET=replace-with-a-long-random-secret
NEWSCATCHER_API_KEY=your-newscatcher-api-token
```

Start the API in development mode with `npm run dev`. It listens on port `5000` by default; set `PORT` to change it. The server connects to MongoDB on startup. Keep `.env` private.

## API

Base URL: `http://localhost:5000`

All routes are available under both `/users` and `/news`. Protected routes require `Authorization: Bearer <token>`. Sign-in tokens expire after one day. Send and receive JSON.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/users/signup` | Register with `name`, `email`, `password`, and optional `preferences` (array of strings). |
| `POST` | `/users/login` | Sign in with `email` and `password`; returns a JWT. |
| `GET` | `/users/preferences` | Get the signed-in user's preferences. |
| `PUT` | `/users/preferences` | Replace preferences; body: `{ "preferences": ["technology", "science"] }`. |
| `GET` | `/news` | Fetch news matching the user's preferences. Set preferences first. |
| `GET` | `/news/search/:keyword` | Search news by keyword. |
| `POST` | `/news/:id/read` | Mark an article ID as read. |
| `GET` | `/news/read` | List the user's read article IDs. |
| `POST` | `/news/:id/favourite` | Mark an article ID as a favourite. |
| `GET` | `/news/favourite` | List the user's favourite article IDs. |

News endpoints return article data from NewsCatcher. Read and favourite lists store article IDs; they do not store full article content. Successful news responses include `source` (`api` or `cache`).

## Tests

Run `npm test`. The tests use the configured MongoDB and NewsCatcher credentials, so those services must be available.

## Project layout

- `app.js` configures Express, connects to MongoDB, and mounts the routes.
- `src/route/` defines API endpoints; `src/controller/` implements request handling.
- `src/middleware/` validates bearer tokens; `src/model/` defines the Mongoose user model; `src/db/` connects to MongoDB.
- `test/` contains API tests.
