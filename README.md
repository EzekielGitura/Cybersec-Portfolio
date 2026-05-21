# Cybersecurity Portfolio

A Supabase-backed cybersecurity portfolio with separate pages for the home intro, projects, experience, toolkit, and contact details.

## Run Locally

Serve the folder locally:

```powershell
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Run `supabase/schema.sql`.
4. Create your admin user in Supabase Authentication.
5. Copy that user ID and run:

```sql
insert into public.admin_users (user_id)
values ('YOUR-AUTH-USER-ID');
```

6. Open `supabase-config.js` and replace:

```js
URL: "https://YOUR_PROJECT_REF.supabase.co",
ANON_KEY: "YOUR_SUPABASE_ANON_KEY"
```

Use the public anon key, not the service role key.

## Update Content

Use `Content Studio` on `projects.html`. It requires Supabase login and admin access.

You can update:

- Portfolio name, hero copy, phone, and email
- Toolkit items
- Experience entries
- Project/writeup content
- PDF uploads through Supabase Storage

Public visitors can read the portfolio. Only users listed in `admin_users` can write.

## Files

- `index.html` - intro-focused homepage
- `projects.html` - project carousel, previews, uploads, and CMS dialogs
- `experience.html` - experience page
- `toolkit.html` - toolkit page
- `contact.html` - contact page
- `app.js` - Supabase-backed portfolio logic
- `site.js` - shared Supabase-backed rendering for intro, experience, toolkit, and contact pages
- `supabase-config.js` - Supabase project configuration
- `supabase/schema.sql` - database, storage, and security policies
- `Assets/logo.png` - official logo
- `Assets/icon.jpg` - favicon
# Cybersec-Portfolio
