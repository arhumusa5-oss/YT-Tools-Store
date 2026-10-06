# YT Tools Store 🎬⚡

Official e-commerce digital store and admin management system for **YT Tools Store**, inspired by [nexustech.pk](https://nexustech.pk/).

---

## 🚀 How to Run Locally

1. Open terminal in `d:\YT Tools Store`.
2. Start the local server:
   ```bash
   npm run dev
   ```
3. Open in browser:
   - **Storefront**: [http://localhost:3000](http://localhost:3000)
   - **Order Tracking**: [http://localhost:3000/track-order](http://localhost:3000/track-order)
   - **Admin Control Panel**: [http://localhost:3000/admin](http://localhost:3000/admin)
   - **Admin Password**: `12388127`

---

## ☁️ How to Deploy to Vercel (Real-Time Cloud Database)

Vercel is a **Serverless Platform**, which means local files are read-only and reset on restarts. To ensure that **products added from the Admin Panel update in real-time and persist forever on Vercel**:

### Step 1: Create a Free Cloud Database (Takes 1 Minute)
Choose either **Neon** or **Supabase** (both are 100% free forever):
- **Option A (Recommended - Neon)**:
  1. Go to [neon.tech](https://neon.tech) and create a free account.
  2. Create a new project (e.g. `yt-tools-store`).
  3. Copy your Connection String (starts with `postgres://...`).
- **Option B (Supabase)**:
  1. Go to [supabase.com](https://supabase.com) and create a free project.
  2. Copy your PostgreSQL URI connection string from Project Settings ➔ Database.

### Step 2: Deploy to Vercel
1. Push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Deploy YT Tools Store"
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"** ➔ Import your repository.
3. In the **Environment Variables** section on Vercel, add:
   - **Key**: `DATABASE_URL`
   - **Value**: *(Paste your connection string from Neon or Supabase)*
4. Click **Deploy**.

**That's it!** The application will automatically create the tables on your cloud database. Whenever you add a product, change a price, or toggle "Sold Out" from the admin panel, it updates in **real-time** across the globe!
