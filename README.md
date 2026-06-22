# TravelPaglu

**TravelPaglu** is a full-stack web application for browsing, creating, and managing vacation rental listings. Users can sign up, post properties with photos, leave star-rated reviews, and view listing locations on an interactive map. The app is inspired by platforms like Airbnb and is built with the **MVC pattern** on **Node.js** and **Express**.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Seeding](#database-seeding)
- [Architecture Overview](#architecture-overview)
- [Data Models](#data-models)
- [Routes & API](#routes--api)
- [Middleware](#middleware)
- [Frontend](#frontend)
- [Error Handling](#error-handling)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 23.x |
| Framework | Express.js |
| Database | MongoDB (Mongoose ODM) |
| Templating | EJS + ejs-mate (layouts) |
| Authentication | Passport.js + passport-local-mongoose |
| Sessions | express-session + connect-mongo |
| File Upload | Multer + Cloudinary |
| Validation | Joi (server), Bootstrap (client) |
| Maps | Leaflet.js + OpenStreetMap tiles |
| Geocoding | Nominatim (OpenStreetMap) via Axios |
| Styling | Bootstrap 5, custom CSS, Font Awesome |

---

## Features

### 1. Browse All Listings

**What it does:** Displays every property in a responsive card grid with image, title, and nightly price (₹).

**Implementation:**
- **Route:** `GET /listings`
- **Controller:** `listingController.showListings` in `controllers/listing.js`
- **View:** `views/listings/index.ejs`
- Fetches all documents with `Listing.find({})` and renders them in a Bootstrap grid (`row-cols-lg-3`). Each card links to the listing detail page.

---

### 2. View Listing Details

**What it does:** Shows full listing info — image, description, price, location, country, owner username, reviews, and an interactive map.

**Implementation:**
- **Route:** `GET /listings/:id`
- **Controller:** `listingController.seeListing`
- **View:** `views/listings/show.ejs`
- Uses Mongoose `.populate()` to load nested `reviews` (with `author`) and `owner`.
- Redirects to `/listings` with a flash error if the listing does not exist.
- Map coordinates are passed to the client as JSON and rendered with Leaflet (`public/js/map.js`).

---

### 3. Create a New Listing

**What it does:** Logged-in users can post a new rental with title, description, image, price, location, and country.

**Implementation:**
- **Routes:** `GET /listings/new` (form), `POST /listings` (submit)
- **Middleware chain:** `isLoggedIn` → `upload.single('listing[image]')` → `handleError` (Joi) → controller
- **Controller:** `listingController.postTheListing`
- **View:** `views/listings/new.ejs`

**Key steps in the controller:**
1. Validates that an image file was uploaded via Multer.
2. Geocodes the location string using the [Nominatim API](https://nominatim.openstreetmap.org/) (Axios) and stores coordinates as a GeoJSON `Point` in `listing.geometry`.
3. Uploads the image to **Cloudinary** (`cloudConfig.js` via `multer-storage-cloudinary`).
4. Sets `owner` to the current user's `_id` and saves the listing.

---

### 4. Edit a Listing

**What it does:** Only the listing owner can update property details and optionally replace the image.

**Implementation:**
- **Routes:** `GET /listings/:id/edit`, `PUT /listings/:id`
- **Middleware:** `isLoggedIn`, `isOwner`, `handleError`, Multer upload
- **Controller:** `listingController.renderEditForm`, `listingController.editTheListing`
- **View:** `views/listings/edit.ejs`

**Key behavior:**
- `isOwner` compares `currentUser._id` with `listing.owner._id`.
- If the location field changes, coordinates are re-fetched from Nominatim.
- If a new image is uploaded, the Cloudinary URL and filename are updated; otherwise the existing image is kept.
- Edit page shows a resized preview via Cloudinary URL transformation (`/uploads` → `/uploads/w_250`).

---

### 5. Delete a Listing

**What it does:** Owners can permanently remove their listing.

**Implementation:**
- **Route:** `DELETE /listings/:id` (HTML form with `?_method=DELETE` via method-override)
- **Middleware:** `isLoggedIn`, `isOwner`
- **Controller:** `listingController.destroyLisitng`
- Uses `Listing.findByIdAndDelete(id)`.
- A **Mongoose post hook** on `findOneAndDelete` in `models/listings.js` automatically deletes all associated reviews via `Review.deleteMany()`.

---

### 6. User Authentication (Sign Up / Login / Logout)

**What it does:** Users register with username, email, and password; log in with username/password; and log out securely.

**Implementation:**
- **Routes:** `/signup`, `/login`, `/logout` in `routes/users.js`
- **Controller:** `controllers/users.js`
- **Views:** `views/users/signup.ejs`, `views/users/login.ejs`
- **Model:** `models/user.js` uses `passport-local-mongoose` plugin for password hashing and authentication.
- **Passport setup** in `app.js`:
  - `passport.use(new LocalStrategy(User.authenticate()))`
  - Serialize/deserialize user for session storage.
- Login uses `passport.authenticate("local")` with `failureRedirect` and `failureFlash`.
- **Redirect-after-login:** `saveRedirectUrl` middleware stores the original URL in the session when an unauthenticated user hits a protected route; after login, `postUser` redirects back to that URL.

---

### 7. Session Management & Flash Messages

**What it does:** Keeps users logged in across requests and shows success/error notifications.

**Implementation:**
- Sessions stored in **MongoDB** via `connect-mongo` (`MongoStore`).
- Session cookie: 7-day expiry, `httpOnly`.
- `connect-flash` provides one-time `success` and `error` messages.
- Middleware in `app.js` exposes `res.locals.success`, `res.locals.error`, and `res.locals.currentUser` to all EJS templates.
- **View:** `views/includes/flashMsg.ejs` renders flash alerts.

---

### 8. Reviews & Star Ratings

**What it does:** Logged-in users can leave a 1–5 star review with a comment. Review authors can delete their own reviews.

**Implementation:**
- **Routes:** nested under `/listings/:id/review` in `routes/reviews.js`
  - `POST /` — create review
  - `DELETE /:reviewId` — delete review
- **Controller:** `controllers/reviews.js`
- **Middleware:** `isLoggedIn`, `handlereviewError` (Joi), `isAuthor` (for delete)
- **Model:** `models/reviews.js` — stores `comment`, `rating`, `createdAt`, and `author` (User ref).
- Reviews are pushed to `listing.reviews` array and saved on both documents.
- **UI:** Starability CSS (`public/css/rating.css`) provides accessible star radio inputs on the show page; submitted ratings are displayed with `data-rating` attributes.

---

### 9. Interactive Map

**What it does:** Shows the listing location on an OpenStreetMap-powered map with a marker and popup.

**Implementation:**
- **Library:** Leaflet.js (loaded in `views/layouts/boilerplate.ejs`)
- **Script:** `public/js/map.js`
- Coordinates from MongoDB GeoJSON (`[longitude, latitude]`) are flipped to `[lat, lng]` for Leaflet.
- `updateLocation()` function on the edit page re-centers the map when editing an existing listing.

---

### 10. Image Upload (Cloudinary)

**What it does:** Listing images are uploaded to Cloudinary instead of local disk storage.

**Implementation:**
- **Config:** `cloudConfig.js`
- Uses `multer-storage-cloudinary` with folder `TravelPaglu_dev`.
- Allowed formats: `png`, `jpg`, `jpeg`.
- Stored on the listing as `{ url, filename }`.

---

### 11. Server-Side Validation (Joi)

**What it does:** Validates listing and review form data before it reaches the controller.

**Implementation:**
- **Schemas:** `schema.js`
  - **Listing:** title (1–30 chars), description, price (≥ 0), location, country — all required.
  - **Review:** rating (1–5), comment — required.
- **Middleware:** `handleError` and `handlereviewError` in `middleware.js` run Joi validation and throw `ExpressError(400, ...)` on failure.

---

### 12. Client-Side Form Validation

**What it does:** Bootstrap validation feedback on forms before submission.

**Implementation:**
- Forms use `class="needs-validation"` and `novalidate`.
- `public/js/script.js` listens for submit events and applies Bootstrap's `was-validated` class.

---

### 13. Authorization Middleware

| Middleware | Purpose | File |
|------------|---------|------|
| `isLoggedIn` | Redirects to `/login` if not authenticated; saves `redirectUrl` | `middleware.js` |
| `isOwner` | Allows only the listing owner to edit/delete | `middleware.js` |
| `isAuthor` | Allows only the review author to delete a review | `middleware.js` |
| `saveRedirectUrl` | Passes stored redirect URL to login flow | `middleware.js` |

---

### 14. Database Seeding

**What it does:** Populates the database with 25 sample listings for development/demo.

**Implementation:**
- **Script:** `init/index.js`
- **Data:** `init/data.js` (sample listings with Unsplash image URLs)
- Clears existing listings and inserts sample data with a hardcoded `owner` ObjectId.
- Uses local MongoDB: `mongodb://127.0.0.1:27017/TravelPaglu`

---

## Project Structure

```
travelpaglu/
├── app.js                  # Express app entry point, Passport & session setup
├── cloudConfig.js          # Cloudinary + Multer storage config
├── schema.js               # Joi validation schemas
├── middleware.js           # Auth, ownership, and validation middleware
├── controllers/
│   ├── listing.js          # Listing CRUD + geocoding logic
│   ├── reviews.js          # Review create/delete
│   └── users.js            # Signup, login, logout
├── models/
│   ├── listings.js         # Listing schema + review cascade delete
│   ├── reviews.js          # Review schema
│   └── user.js             # User schema (passport-local-mongoose)
├── routes/
│   ├── listing.js          # /listings routes + Multer upload
│   ├── reviews.js          # Nested /listings/:id/review routes
│   └── users.js            # /signup, /login, /logout
├── views/
│   ├── layouts/boilerplate.ejs   # Main layout (Bootstrap, Leaflet, CSS)
│   ├── includes/                 # navbar, footer, flash messages
│   ├── listings/                   # index, show, new, edit
│   ├── users/                      # login, signup
│   └── error.ejs                   # Global error page
├── public/
│   ├── css/                # style.css, rating.css
│   └── js/                 # script.js (validation), map.js (Leaflet)
├── utils/
│   ├── wrapAsync.js        # Async error wrapper for route handlers
│   └── ExpressError.js     # Custom error class with statusCode
└── init/
    ├── index.js              # Seed script
    └── data.js               # Sample listing data
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 23.x
- MongoDB Atlas account (or local MongoDB)
- [Cloudinary](https://cloudinary.com/) account

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd travelpaglu

# Install dependencies
npm install

# Create a .env file (see Environment Variables below)

# Start the server
node app.js
```

The app runs at **http://localhost:8080**.

---

## Environment Variables

Create a `.env` file in the project root:

```env
ATLAS_LINK=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/TravelPaglu
SECRET=your_session_secret_key
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
```

| Variable | Used For |
|----------|----------|
| `ATLAS_LINK` | MongoDB connection (app + session store) |
| `SECRET` | Express session signing |
| `CLOUD_NAME` | Cloudinary cloud name |
| `CLOUD_API_KEY` | Cloudinary API key |
| `CLOUD_API_SECRET` | Cloudinary API secret |

---

## Database Seeding

To load sample listings into a **local** MongoDB instance:

```bash
node init/index.js
```

> **Note:** Update the `owner` ObjectId in `init/index.js` to match a real user in your database before seeding.

---

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│   Browser   │────▶│   Express    │────▶│ Middleware  │────▶│Controller│
│  (EJS/JS)   │◀────│   Routes     │◀────│ Auth/Joi    │◀────│  Layer   │
└─────────────┘     └──────────────┘     └─────────────┘     └────┬─────┘
                                                                   │
                    ┌──────────────┐     ┌─────────────┐           │
                    │  Cloudinary  │◀────│   Multer    │◀──────────┤
                    └──────────────┘     └─────────────┘           │
                    ┌──────────────┐     ┌─────────────┐           │
                    │  Nominatim   │◀────│    Axios    │◀──────────┤
                    └──────────────┘     └─────────────┘           │
                    ┌──────────────┐                               │
                    │   MongoDB    │◀──────────────────────────────┘
                    │  (Mongoose)  │
                    └──────────────┘
```

**Request flow example — creating a listing:**

1. User submits the form at `POST /listings`.
2. `isLoggedIn` checks authentication.
3. Multer uploads the image to Cloudinary.
4. `handleError` validates body with Joi.
5. `wrapAsync` catches async errors and forwards to the error handler.
6. Controller geocodes location, saves listing to MongoDB.
7. Flash message set; user redirected to `/listings`.

---

## Data Models

### User (`models/user.js`)

| Field | Type | Notes |
|-------|------|-------|
| `email` | String | Required |
| `username` | String | Added by passport-local-mongoose |
| `hash` / `salt` | String | Password hashing (plugin) |

### Listing (`models/listings.js`)

| Field | Type | Notes |
|-------|------|-------|
| `title` | String | Required |
| `description` | String | |
| `image` | `{ url, filename }` | Cloudinary |
| `price` | Number | |
| `location` | String | |
| `country` | String | |
| `reviews` | ObjectId[] | Ref → Review |
| `owner` | ObjectId | Ref → User |
| `geometry` | GeoJSON Point | `[longitude, latitude]` |

### Review (`models/reviews.js`)

| Field | Type | Notes |
|-------|------|-------|
| `comment` | String | |
| `rating` | Number | 1–5 |
| `createdAt` | Date | Default: now |
| `author` | ObjectId | Ref → User |

---

## Routes & API

### Listings (`/listings`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/listings` | — | List all listings |
| GET | `/listings/new` | ✓ | New listing form |
| POST | `/listings` | ✓ | Create listing |
| GET | `/listings/:id` | — | Show listing |
| GET | `/listings/:id/edit` | Owner | Edit form |
| PUT | `/listings/:id` | Owner | Update listing |
| DELETE | `/listings/:id` | Owner | Delete listing |

### Reviews (`/listings/:id/review`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | ✓ | Add review |
| DELETE | `/:reviewId` | Author | Delete review |

### Users (`/`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/signup` | Sign-up form |
| POST | `/signup` | Register user |
| GET | `/login` | Login form |
| POST | `/login` | Authenticate |
| GET | `/logout` | Log out |

---

## Middleware

All custom middleware lives in `middleware.js`:

```js
isLoggedIn        // Requires authentication
isOwner           // Requires listing ownership
isAuthor          // Requires review authorship
handleError       // Joi validation for listings
handlereviewError // Joi validation for reviews
saveRedirectUrl   // Preserves URL for post-login redirect
```

Async route handlers are wrapped with `wrapAsync` (`utils/wrapAsync.js`) so rejected promises are passed to Express's error handler.

---

## Frontend

| Asset | Purpose |
|-------|---------|
| `public/css/style.css` | Custom styling for cards, layout, buttons |
| `public/css/rating.css` | Starability star-rating component |
| `public/js/script.js` | Bootstrap form validation |
| `public/js/map.js` | Leaflet map initialization and marker |
| Bootstrap 5 | Responsive grid, navbar, forms |
| Font Awesome | Compass icon in navbar |
| Google Fonts | Open Sans, Schibsted Grotesk |

Layouts use **ejs-mate** so every page extends `views/layouts/boilerplate.ejs` via `<% layout("/layouts/boilerplate") -%>`.

---

## Error Handling

- **Custom error class:** `utils/ExpressError.js` — carries `statusCode` and `message`.
- **404 catch-all:** `app.all("*", ...)` throws `ExpressError(404, "Page Not Found")`.
- **Global handler:** Renders `views/error.ejs` with the appropriate HTTP status.
- **Async errors:** Caught by `wrapAsync` and forwarded to the global handler.
- **Validation errors:** Joi middleware throws `ExpressError(400, ...)` with detail messages.

---

## License

ISC
