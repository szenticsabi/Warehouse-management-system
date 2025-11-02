# Warehouse manager system (Express + MongoDB + React/Vite)

Egyszerű raktárkezelő alkalmazás.
- Backend: Express + Mongoose (MongoDB)
- Frontend: React + Vite
- A frontend több helyen a `http://localhost:3000` API-t hívja, ezért a backend fusson 3000-es porton.

## Követelmények
- Node.js 18+ (ajánlott 20+), npm
- MongoDB elérés (Atlas vagy lokális)
- Git (opcionális)

## Beállítás
1) Backend környezeti változók (`backend/.env`):  
ATLAS_URI=your-mongodb-uri  
JWT_SECRET=your-strong-secret  
PORT=3000  


2) Telepítés:  
Backend  
cd backend  
npm install  


Frontend  
cd ../frontend  
npm install  


3) Futatás fejlesztői módban (két terminál):  
Terminál 1 - Backend  
cd backend  
npm start  
http://localhost:3000  


Terminál 2 - Frontend  
cd frontend  
npm run dev  
http://localhost:5173 vagy http://localhost:5174  



## Tesztadatok (opcionális)
.env beállítása után  
node backend/seed.js  


Admin belépés: `admin@warehouse.com` / `admin`.

## Tesztek
- Backend (Jest, in-memory MongoDB):  
npm --prefix backend test -- --coverage  
vagy  
npm --prefix backend test  


- Frontend (Vitest):  
cd frontend  
npm --prefix frontend exec vitest run  



## Build (frontend)  
cd frontend  
npm run build  
npm run preview  


## Fontos fájlok
- Backend indítás és port: `backend/index.js`
- DB kapcsolat (ATLAS_URI): `backend/database/connection.js`
- Login hívás (API URL): `frontend/src/pages/Login.jsx`
- Példa API_BASE: `frontend/src/components/Categories.jsx`
